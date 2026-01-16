package sse

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// Server quản lý kết nối và broadcast message
type Server struct {
	// Pool quản lý client: key là clientID, value là channel gửi data
	clients map[string]chan []byte
	mu      sync.RWMutex

	// Notifier để đóng heartbeat khi server dừng
	done chan struct{}

	heartBeatInterval int
}

// NewServer khởi tạo SSE server và chạy heartbeat background
func NewServer(heartBeatInterval int) *Server {
	// set default value if not provided
	if heartBeatInterval <= 0 {
		heartBeatInterval = 10
	}

	s := &Server{
		clients:           make(map[string]chan []byte),
		done:              make(chan struct{}),
		heartBeatInterval: heartBeatInterval,
	}

	// Tự động chạy heartbeat mỗi heartBeatInterval giây
	go s.runHeartbeat()
	return s
}

// ServeHTTP implement http.Handler, cho phép nhận kết nối từ client
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// 1. Cấu hình Headers chuẩn cho SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	// 2. Khởi tạo Client
	clientID := fmt.Sprintf("client_%d", time.Now().UnixNano())
	msgChan := make(chan []byte, 256) // Buffer channel để tránh block

	// 3. Thêm vào Pool
	s.addClient(clientID, msgChan)

	// Đảm bảo xóa khỏi pool khi kết nối ngắt
	defer s.removeClient(clientID)

	// Gửi event connected ban đầu
	fmt.Fprintf(w, "event: connected\ndata: %s\n\n", clientID)
	flusher.Flush()

	log.Printf("SSE: Client %s connected. Total: %d", clientID, len(s.clients))

	// 4. Lắng nghe và gửi dữ liệu
	ctx := r.Context()
	for {
		select {
		case <-ctx.Done(): // Client ngắt kết nối hoặc tab đóng
			return
		case msg, open := <-msgChan:
			if !open {
				return // Server đóng
			}
			// Ghi dữ liệu xuống response
			_, err := fmt.Fprintf(w, "%s", msg)
			if err != nil {
				return
			}
			flusher.Flush()
		}
	}
}

// Broadcast gửi message tới toàn bộ client đang sống trong pool
func (s *Server) Broadcast(event string, data interface{}) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	payload, err := formatMessage(event, data)
	if err != nil {
		log.Printf("SSE Error format: %v", err)
		return
	}

	for id, ch := range s.clients {
		select {
		case ch <- payload:
			// Gửi thành công
		default:
			// Channel đầy hoặc client đơ -> Bỏ qua để không block hệ thống
			log.Printf("SSE Warning: Client %s full buffer, skipping msg", id)
		}
	}
}

// Shutdown đóng server và cleanup
func (s *Server) Shutdown() {
	close(s.done) // Stop heartbeat
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, ch := range s.clients {
		close(ch)
	}
	s.clients = nil
}

// --- Các hàm Private (Helper) ---

func (s *Server) addClient(id string, ch chan []byte) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clients[id] = ch
}

func (s *Server) removeClient(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.clients[id]; ok {
		delete(s.clients, id)
		log.Printf("SSE: Client %s disconnected. Total: %d", id, len(s.clients))
	}
}

func (s *Server) runHeartbeat() {
	ticker := time.NewTicker(time.Duration(s.heartBeatInterval) * time.Second) // Yêu cầu: 10s
	defer ticker.Stop()

	for {
		select {
		case <-s.done:
			return
		case <-ticker.C:
			// Gửi ping rỗng hoặc timestamp để giữ kết nối
			s.Broadcast("ping", map[string]int64{"time": time.Now().Unix()})
		}
	}
}

func formatMessage(event string, data interface{}) ([]byte, error) {
	var body []byte
	var err error

	// Chuyển data sang string hoặc json
	switch v := data.(type) {
	case string:
		body = []byte(v)
	case []byte:
		body = v
	default:
		body, err = json.Marshal(data)
		if err != nil {
			return nil, err
		}
	}

	// Format chuẩn SSE:
	// event: name\n
	// data: payload\n\n
	return []byte(fmt.Sprintf("event: %s\ndata: %s\n\n", event, body)), nil
}
