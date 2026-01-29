package httpHandlers

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

// SSEClient đại diện cho một client SSE đang kết nối
type SSEClient struct {
	// ID duy nhất của client
	ID string
	// HTTP ResponseWriter để gửi dữ liệu đến client
	Writer http.ResponseWriter
	// HTTP Request của client
	Request *http.Request
	// Flusher để flush dữ liệu ngay lập tức
	Flusher http.Flusher
	// Channel để nhận tín hiệu dừng heartbeat
	stopHeartbeat chan struct{}
	// Con trỏ đến node tiếp theo trong danh sách liên kết
	next *SSEClient
	// Mutex để bảo vệ Writer khi tin nhắn được gửi (tránh data race với heartbeat)
	mu sync.Mutex
}

// SSEClientPool quản lý pool các client SSE đang kết nối
type SSEClientPool struct {
	// Con trỏ đến node đầu tiên trong danh sách liên kết
	head *SSEClient
	// Mutex để bảo vệ danh sách liên kết khi đọc/ghi đồng thời
	mu sync.RWMutex
	// Map để truy cập nhanh client theo ID (để remove dễ dàng)
	clientMap map[string]*SSEClient
	// Mutex riêng cho clientMap
	mapMu sync.RWMutex
	// Counter để tạo ID duy nhất cho client
	counter int64
	// Mutex cho counter
	counterMu sync.Mutex
}

// NewSSEClientPool tạo một SSEClientPool mới
func NewSSEClientPool() *SSEClientPool {
	return &SSEClientPool{
		head:      nil,
		clientMap: make(map[string]*SSEClient),
		counter:   0,
	}
}

// Add thêm một client mới vào pool và thiết lập heartbeat mỗi 5 giây
func (p *SSEClientPool) Add(w http.ResponseWriter, r *http.Request) (*SSEClient, error) {
	// Kiểm tra ResponseWriter có hỗ trợ Flush không
	flusher, ok := w.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("streaming unsupported: ResponseWriter does not implement http.Flusher")
	}

	// Tạo ID duy nhất cho client
	p.counterMu.Lock()
	p.counter++
	clientID := fmt.Sprintf("client_%d_%d", time.Now().UnixNano(), p.counter)
	p.counterMu.Unlock()

	// Tạo SSEClient mới
	client := &SSEClient{
		ID:            clientID,
		Writer:        w,
		Request:       r,
		Flusher:       flusher,
		stopHeartbeat: make(chan struct{}),
		next:          nil,
	}

	// Thêm vào danh sách liên kết
	p.mu.Lock()
	// Thêm vào đầu danh sách (O(1))
	client.next = p.head
	p.head = client
	p.mu.Unlock()

	// Thêm vào map để truy cập nhanh
	p.mapMu.Lock()
	p.clientMap[clientID] = client
	p.mapMu.Unlock()

	// Thiết lập heartbeat mỗi 5 giây cho client này
	go p.startHeartbeat(client)

	// Thiết lập auto remove khi client disconnect
	go p.monitorDisconnect(client)

	return client, nil
}

// Send gửi dữ liệu đến client một cách an toàn (thread-safe)
func (c *SSEClient) Send(data []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	_, err := c.Writer.Write(data)
	if err != nil {
		return err
	}
	c.Flusher.Flush()
	return nil
}

// startHeartbeat gửi heartbeat mỗi 5 giây để giữ kết nối sống
func (p *SSEClientPool) startHeartbeat(client *SSEClient) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-client.stopHeartbeat:
			// Nhận tín hiệu dừng heartbeat
			return
		case <-ticker.C:
			// Gửi heartbeat (chỉ flush, không gửi data)
			// Sử dụng lock để tránh conflict với việc gửi data
			client.mu.Lock()
			client.Flusher.Flush()
			client.mu.Unlock()
		case <-client.Request.Context().Done():
			// Context đã bị cancel (client disconnect)
			return
		}
	}
}

// monitorDisconnect theo dõi khi client disconnect và tự động remove
func (p *SSEClientPool) monitorDisconnect(client *SSEClient) {
	// Chờ cho đến khi context bị cancel hoặc request kết thúc
	<-client.Request.Context().Done()
	// Tự động remove client khỏi pool
	p.Remove(client.ID)
}

// Remove xóa một client khỏi pool theo ID
func (p *SSEClientPool) Remove(clientID string) {
	p.mapMu.Lock()
	client, exists := p.clientMap[clientID]
	if !exists {
		p.mapMu.Unlock()
		return
	}
	delete(p.clientMap, clientID)
	p.mapMu.Unlock()

	// Dừng heartbeat của client
	close(client.stopHeartbeat)

	// Xóa khỏi danh sách liên kết
	p.mu.Lock()
	defer p.mu.Unlock()

	// Nếu là node đầu tiên
	if p.head != nil && p.head.ID == clientID {
		p.head = p.head.next
		return
	}

	// Tìm và xóa node trong danh sách liên kết
	current := p.head
	for current != nil && current.next != nil {
		if current.next.ID == clientID {
			current.next = current.next.next
			return
		}
		current = current.next
	}
}

// GetAllClients trả về tất cả các client đang kết nối
func (p *SSEClientPool) GetAllClients() []*SSEClient {
	p.mu.RLock()
	defer p.mu.RUnlock()

	var clients []*SSEClient
	current := p.head
	for current != nil {
		clients = append(clients, current)
		current = current.next
	}
	return clients
}

// GetClientCount trả về số lượng client đang kết nối
func (p *SSEClientPool) GetClientCount() int {
	p.mapMu.RLock()
	defer p.mapMu.RUnlock()
	return len(p.clientMap)
}

// Clear xóa tất cả clients khỏi pool
func (p *SSEClientPool) Clear() {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.mapMu.Lock()
	defer p.mapMu.Unlock()

	// Dừng heartbeat và đóng tất cả clients
	current := p.head
	for current != nil {
		close(current.stopHeartbeat)
		current = current.next
	}

	// Reset pool
	p.head = nil
	p.clientMap = make(map[string]*SSEClient)
}
