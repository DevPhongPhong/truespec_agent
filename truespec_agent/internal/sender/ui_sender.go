package sender

import (
	"encoding/json"
	"fmt"

	httpHandlers "github.com/unitechio/agent/httpReqHandlers"
	"github.com/unitechio/agent/internal/storage"
)

// UISender xử lý việc gửi dữ liệu đến UI clients qua SSE
type UISender struct {
	// Pool chứa các SSE clients
	clientPool *httpHandlers.SSEClientPool
	// Storage chứa dữ liệu metric của hệ thống
	metricStorage *storage.SystemMetricDataStorage
}

// NewUISender tạo một UISender mới
func NewUISender(clientPool *httpHandlers.SSEClientPool, metricStorage *storage.SystemMetricDataStorage) *UISender {
	return &UISender{
		clientPool:    clientPool,
		metricStorage: metricStorage,
	}
}

// SendData lấy dữ liệu từ SystemMetricDataStorage và gửi đến tất cả clients trong SSEClientPool
func (u *UISender) SendData(event string) error {
	// Lấy dữ liệu metric hiện tại từ storage
	metricData := u.metricStorage.Get()

	// Format dữ liệu theo chuẩn SSE
	message, err := u.formatSSEMessage(event, metricData)
	if err != nil {
		return fmt.Errorf("failed to format SSE message: %w", err)
	}

	// Lấy tất cả clients đang kết nối
	clients := u.clientPool.GetAllClients()

	if len(clients) == 0 {
		return nil
	}

	// Gửi dữ liệu đến từng client
	var failedClients []string
	for _, client := range clients {
		if err := u.sendToClient(client, message); err != nil {
			// Nếu gửi thất bại, đánh dấu để remove
			failedClients = append(failedClients, client.ID)
		}
	}

	// Remove các client không thể gửi được
	for _, clientID := range failedClients {
		u.clientPool.Remove(clientID)
	}

	return nil
}

// sendToClient gửi dữ liệu đến một client cụ thể
func (u *UISender) sendToClient(client *httpHandlers.SSEClient, message []byte) error {
	// Kiểm tra context có còn valid không
	select {
	case <-client.Request.Context().Done():
		// Client đã disconnect
		return fmt.Errorf("client context cancelled")
	default:
		// Context vẫn còn valid, tiếp tục gửi
	}

	// Sử dụng phương thức Send an toàn (thread-safe) của SSEClient
	if err := client.Send(message); err != nil {
		return fmt.Errorf("failed to write to client %s: %w", client.ID, err)
	}

	return nil
}

// formatSSEMessage format dữ liệu theo chuẩn SSE
func (u *UISender) formatSSEMessage(event string, data interface{}) ([]byte, error) {
	// Chuyển đổi data sang JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}

	// Format theo chuẩn SSE: event: <event>\ndata: <json>\n\n
	message := fmt.Sprintf("event: %s\ndata: %s\n\n", event, string(jsonData))
	return []byte(message), nil
}

// SendCustomData gửi dữ liệu tùy chỉnh đến tất cả clients
func (u *UISender) SendCustomData(event string, data interface{}) error {
	// Format dữ liệu theo chuẩn SSE
	message, err := u.formatSSEMessage(event, data)
	if err != nil {
		return fmt.Errorf("failed to format SSE message: %w", err)
	}

	// Lấy tất cả clients đang kết nối
	clients := u.clientPool.GetAllClients()

	// Gửi dữ liệu đến từng client
	var failedClients []string
	for _, client := range clients {
		if err := u.sendToClient(client, message); err != nil {
			// Nếu gửi thất bại, đánh dấu để remove
			failedClients = append(failedClients, client.ID)
		}
	}

	// Remove các client không thể gửi được
	for _, clientID := range failedClients {
		u.clientPool.Remove(clientID)
	}

	return nil
}
