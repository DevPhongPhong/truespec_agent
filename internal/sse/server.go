package sse

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync/atomic"
	"time"
)

// Server quản lý SSE HTTP server
type Server struct {
	pool              *Pool
	logger            *log.Logger
	server            *http.Server
	clientCounter     uint64
	heartbeatInterval time.Duration
}

// ServerConfig cấu hình cho SSE server
type ServerConfig struct {
	Addr              string        // Address to listen on (e.g., ":9000")
	HeartbeatInterval time.Duration // Interval for heartbeat pings
}

// DefaultServerConfig trả về cấu hình mặc định
func DefaultServerConfig() *ServerConfig {
	return &ServerConfig{
		Addr:              ":9000",
		HeartbeatInterval: 30 * time.Second,
	}
}

// NewServer tạo một SSE server mới
func NewServer(cfg *ServerConfig, logger *log.Logger) *Server {
	if cfg == nil {
		cfg = DefaultServerConfig()
	}

	pool := NewPool(logger)

	s := &Server{
		pool:              pool,
		logger:            logger,
		heartbeatInterval: cfg.HeartbeatInterval,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/sse", s.handleCORS(s.handleSSE))
	mux.HandleFunc("/health", s.handleCORS(s.handleHealth))

	s.server = &http.Server{
		Addr:         cfg.Addr,
		Handler:      mux,
		ReadTimeout:  0, // No timeout for SSE
		WriteTimeout: 0, // No timeout for SSE
		IdleTimeout:  0, // No idle timeout for SSE
	}

	return s
}

// Start khởi động SSE server
func (s *Server) Start(ctx context.Context) error {
	s.logger.Printf("Starting SSE server on %s", s.server.Addr)

	// Start heartbeat goroutine
	go s.runHeartbeat(ctx)

	// Start server in goroutine
	errCh := make(chan error, 1)
	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	// Wait for context cancellation or error
	select {
	case err := <-errCh:
		return fmt.Errorf("SSE server error: %w", err)
	case <-ctx.Done():
		return s.Shutdown()
	}
}

// StartBackground khởi động SSE server ở background
func (s *Server) StartBackground(ctx context.Context) {
	go func() {
		if err := s.Start(ctx); err != nil {
			s.logger.Printf("SSE server stopped: %v", err)
		}
	}()
}

// Shutdown dừng SSE server gracefully
func (s *Server) Shutdown() error {
	s.logger.Println("Shutting down SSE server...")

	// Close all client connections
	s.pool.Close()

	// Shutdown HTTP server với timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return s.server.Shutdown(ctx)
}

// GetPool trả về pool để các module khác có thể gọi SendMessage
func (s *Server) GetPool() *Pool {
	return s.pool
}

// handleCORS xử lý CORS headers
func (s *Server) handleCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Cache-Control")
			w.Header().Set("Access-Control-Max-Age", "86400")
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// handleSSE xử lý SSE connection
func (s *Server) handleSSE(w http.ResponseWriter, r *http.Request) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("X-Accel-Buffering", "no") // Disable buffering for nginx

	// Check if ResponseWriter supports flushing
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	// Generate unique client ID
	clientID := s.generateClientID()
	client := NewClient(clientID)

	// Add client to pool
	s.pool.Add(client)

	// Ensure cleanup on disconnect
	defer s.pool.Remove(clientID)

	// Send initial connection event
	welcomeData, _ := json.Marshal(map[string]interface{}{
		"client_id": clientID,
		"message":   "Connected to SSE stream",
		"timestamp": time.Now().Unix(),
	})
	fmt.Fprintf(w, "event: connected\ndata: %s\n\n", welcomeData)
	flusher.Flush()

	s.logger.Printf("SSE client connected: %s", clientID)

	// Listen for messages and client disconnect
	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			// Client disconnected
			s.logger.Printf("SSE client disconnected (context done): %s", clientID)
			return

		case <-client.Done:
			// Client was closed by pool
			s.logger.Printf("SSE client closed by pool: %s", clientID)
			return

		case message, ok := <-client.Channel:
			if !ok {
				// Channel closed
				return
			}

			// Write message to client
			_, err := w.Write(message)
			if err != nil {
				s.logger.Printf("SSE write error for client %s: %v", clientID, err)
				return
			}
			flusher.Flush()
		}
	}
}

// handleHealth endpoint để check SSE server status
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	response := map[string]interface{}{
		"status":       "healthy",
		"client_count": s.pool.GetClientCount(),
		"client_ids":   s.pool.GetClientIDs(),
		"timestamp":    time.Now().Unix(),
	}

	json.NewEncoder(w).Encode(response)
}

// runHeartbeat gửi heartbeat định kỳ đến tất cả clients
func (s *Server) runHeartbeat(ctx context.Context) {
	ticker := time.NewTicker(s.heartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Send heartbeat to all clients
			heartbeatData, _ := json.Marshal(map[string]interface{}{
				"type":      "heartbeat",
				"timestamp": time.Now().Unix(),
			})
			s.pool.SendMessage("heartbeat", heartbeatData)
		}
	}
}

// generateClientID tạo unique client ID
func (s *Server) generateClientID() string {
	counter := atomic.AddUint64(&s.clientCounter, 1)
	return fmt.Sprintf("client_%d_%d", time.Now().UnixNano(), counter)
}

// SendMessage gửi message đến tất cả clients (wrapper cho pool.SendMessage)
// Đây là hàm chính để các module khác gọi
func (s *Server) SendMessage(eventType string, data interface{}) error {
	var messageData []byte
	var err error

	switch v := data.(type) {
	case []byte:
		messageData = v
	case string:
		messageData = []byte(v)
	default:
		messageData, err = json.Marshal(data)
		if err != nil {
			return fmt.Errorf("failed to marshal data: %w", err)
		}
	}

	s.pool.SendMessage(eventType, messageData)
	return nil
}

// SendMessageToClient gửi message đến một client cụ thể
func (s *Server) SendMessageToClient(clientID string, eventType string, data interface{}) error {
	var messageData []byte
	var err error

	switch v := data.(type) {
	case []byte:
		messageData = v
	case string:
		messageData = []byte(v)
	default:
		messageData, err = json.Marshal(data)
		if err != nil {
			return fmt.Errorf("failed to marshal data: %w", err)
		}
	}

	return s.pool.SendMessageToClient(clientID, eventType, messageData)
}
