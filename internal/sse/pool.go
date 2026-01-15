package sse

import (
	"fmt"
	"log"
	"sync"
)

// Client đại diện cho một SSE connection
type Client struct {
	ID       string
	Channel  chan []byte
	Done     chan struct{}
	isClosed bool
	mu       sync.Mutex
}

// NewClient tạo một client mới
func NewClient(id string) *Client {
	return &Client{
		ID:      id,
		Channel: make(chan []byte, 256), // buffered channel để tránh blocking
		Done:    make(chan struct{}),
	}
}

// Close đóng client connection
func (c *Client) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.isClosed {
		return
	}

	c.isClosed = true
	close(c.Done)
	close(c.Channel)
}

// IsClosed kiểm tra client đã đóng chưa
func (c *Client) IsClosed() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.isClosed
}

// Pool quản lý tất cả SSE connections
type Pool struct {
	clients map[string]*Client
	mu      sync.RWMutex
	logger  *log.Logger
}

// NewPool tạo một pool mới
func NewPool(logger *log.Logger) *Pool {
	return &Pool{
		clients: make(map[string]*Client),
		logger:  logger,
	}
}

// Add thêm một client vào pool
func (p *Pool) Add(client *Client) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.clients[client.ID] = client
	p.logger.Printf("SSE client added: %s (total: %d)", client.ID, len(p.clients))
}

// Remove xoá một client khỏi pool
func (p *Pool) Remove(clientID string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if client, exists := p.clients[clientID]; exists {
		client.Close()
		delete(p.clients, clientID)
		p.logger.Printf("SSE client removed: %s (total: %d)", clientID, len(p.clients))
	}
}

// SendMessage gửi message đến tất cả clients trong pool
// Tự động xoá các client đã đóng kết nối
func (p *Pool) SendMessage(eventType string, data []byte) {
	p.mu.Lock()
	defer p.mu.Unlock()

	// Format SSE message
	message := formatSSEMessage(eventType, data)

	closedClients := make([]string, 0)

	for id, client := range p.clients {
		if client.IsClosed() {
			closedClients = append(closedClients, id)
			continue
		}

		// Non-blocking send
		select {
		case client.Channel <- message:
			// Message sent successfully
		default:
			// Channel full hoặc client không responsive -> đánh dấu để xoá
			p.logger.Printf("SSE client %s unresponsive, marking for removal", id)
			closedClients = append(closedClients, id)
		}
	}

	// Cleanup closed/unresponsive clients
	for _, id := range closedClients {
		if client, exists := p.clients[id]; exists {
			client.Close()
			delete(p.clients, id)
			p.logger.Printf("SSE client cleaned up: %s", id)
		}
	}

	if len(p.clients) > 0 {
		p.logger.Printf("SSE message broadcast to %d clients (event: %s)", len(p.clients), eventType)
	}
}

// SendMessageToClient gửi message đến một client cụ thể
func (p *Pool) SendMessageToClient(clientID string, eventType string, data []byte) error {
	p.mu.RLock()
	client, exists := p.clients[clientID]
	p.mu.RUnlock()

	if !exists {
		return fmt.Errorf("client %s not found", clientID)
	}

	if client.IsClosed() {
		p.Remove(clientID)
		return fmt.Errorf("client %s is closed", clientID)
	}

	message := formatSSEMessage(eventType, data)

	select {
	case client.Channel <- message:
		return nil
	default:
		return fmt.Errorf("client %s channel full", clientID)
	}
}

// GetClientCount trả về số lượng clients trong pool
func (p *Pool) GetClientCount() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return len(p.clients)
}

// GetClientIDs trả về danh sách client IDs
func (p *Pool) GetClientIDs() []string {
	p.mu.RLock()
	defer p.mu.RUnlock()

	ids := make([]string, 0, len(p.clients))
	for id := range p.clients {
		ids = append(ids, id)
	}
	return ids
}

// Close đóng tất cả connections và cleanup pool
func (p *Pool) Close() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for id, client := range p.clients {
		client.Close()
		delete(p.clients, id)
	}

	p.logger.Println("SSE pool closed")
}

// formatSSEMessage format data theo chuẩn SSE
func formatSSEMessage(eventType string, data []byte) []byte {
	// SSE format:
	// event: <event-type>\n
	// data: <data>\n
	// \n

	var message []byte

	if eventType != "" {
		message = append(message, []byte(fmt.Sprintf("event: %s\n", eventType))...)
	}

	message = append(message, []byte(fmt.Sprintf("data: %s\n\n", string(data)))...)

	return message
}

