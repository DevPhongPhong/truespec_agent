package httpHandlers

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
)

var (
	// globalClientPool là pool chứa tất cả các SSE clients
	globalClientPool *SSEClientPool
	// poolMu bảo vệ globalClientPool khi set/get
	poolMu sync.RWMutex
)

// SetClientPool thiết lập global client pool để HandleSSE sử dụng
func SetClientPool(pool *SSEClientPool) {
	poolMu.Lock()
	defer poolMu.Unlock()
	globalClientPool = pool
}

// GetClientPool trả về global client pool hiện tại
func GetClientPool() *SSEClientPool {
	poolMu.RLock()
	defer poolMu.RUnlock()
	return globalClientPool
}

// HandleSSE handles SSE (Server-Sent Events) connections at /sse.
//
// Usage: register as HTTP handler with "/sse" path.
// Sample usage: mux.HandleFunc("/sse", httpHandlers.HandleSSE)
//
// Before using, make sure to call SetClientPool() to set the client pool.

var count = 0

func HandleSSE(w http.ResponseWriter, r *http.Request) {
	fmt.Println("HandleSSE" + strconv.Itoa(count))
	// Thiết lập headers cho SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Kiểm tra ResponseWriter có hỗ trợ Flush không
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Flush headers ngay lập tức để thiết lập kết nối SSE
	flusher.Flush()

	// Lấy client pool
	pool := GetClientPool()
	if pool == nil {
		// Nếu pool chưa được set, trả về lỗi
		http.Error(w, "SSE client pool not initialized", http.StatusInternalServerError)
		return
	}

	// Thêm client vào pool
	// Pool sẽ tự động setup heartbeat mỗi 5 giây và auto-remove khi disconnect
	client, err := pool.Add(w, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Gửi event connected ban đầu để thông báo client đã kết nối thành công
	connectedMsg := []byte("event: connected\ndata: {\"client_id\":\"" + client.ID + "\"}\n\n")
	w.Write(connectedMsg)
	flusher.Flush()

	// Chờ cho đến khi client disconnect
	// Pool sẽ tự động xử lý heartbeat và remove khi disconnect
	<-r.Context().Done()
}
