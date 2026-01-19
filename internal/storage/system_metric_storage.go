package storage

import (
	"sync"
	"time"
)

// SystemMetricData chứa các thông tin chỉ số sử dụng máy tính hiện tại
type SystemMetricData struct {
	// Timestamp khi dữ liệu được cập nhật
	Timestamp int64 `json:"timestamp"`
	// CPU usage percentage (0-100)
	CPUUsage float64 `json:"cpu_usage"`
	// Memory usage percentage (0-100)
	MemoryUsage float64 `json:"memory_usage"`
	// Total memory (bytes)
	TotalMemory int64 `json:"total_memory"`
	// Used memory (bytes)
	UsedMemory int64 `json:"used_memory"`
	// Disk usage percentage (0-100)
	DiskUsage float64 `json:"disk_usage"`
	// Total disk space (bytes)
	TotalDisk int64 `json:"total_disk"`
	// Used disk space (bytes)
	UsedDisk int64 `json:"used_disk"`
	// Network bytes sent
	NetworkBytesSent int64 `json:"network_bytes_sent"`
	// Network bytes received
	NetworkBytesRecv int64 `json:"network_bytes_recv"`
	// Number of running processes
	ProcessCount int `json:"process_count"`
	// System uptime (seconds)
	Uptime int64 `json:"uptime"`
	// GPU usage percentage (0-100) - optional
	GPUUsage *float64 `json:"gpu_usage,omitempty"`
}

// SystemMetricDataStorage quản lý lưu trữ dữ liệu metric của hệ thống
type SystemMetricDataStorage struct {
	// Dữ liệu metric hiện tại
	data SystemMetricData
	// Mutex để bảo vệ dữ liệu khi đọc/ghi đồng thời
	mu sync.RWMutex
}

// NewSystemMetricDataStorage tạo một SystemMetricDataStorage mới
func NewSystemMetricDataStorage() *SystemMetricDataStorage {
	return &SystemMetricDataStorage{
		data: SystemMetricData{
			Timestamp: time.Now().Unix(),
		},
	}
}

// Set cập nhật dữ liệu metric mới
func (s *SystemMetricDataStorage) Set(data SystemMetricData) {
	s.mu.Lock()
	defer s.mu.Unlock()
	// Cập nhật timestamp khi set
	data.Timestamp = time.Now().Unix()
	s.data = data
}

// Get trả về bản sao của dữ liệu metric hiện tại
func (s *SystemMetricDataStorage) Get() SystemMetricData {
	s.mu.RLock()
	defer s.mu.RUnlock()
	// Trả về bản sao để tránh race condition
	return s.data
}

// SetCPUUsage cập nhật CPU usage
func (s *SystemMetricDataStorage) SetCPUUsage(usage float64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.CPUUsage = usage
	s.data.Timestamp = time.Now().Unix()
}

// SetMemoryUsage cập nhật memory usage
func (s *SystemMetricDataStorage) SetMemoryUsage(usage float64, total, used int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.MemoryUsage = usage
	s.data.TotalMemory = total
	s.data.UsedMemory = used
	s.data.Timestamp = time.Now().Unix()
}

// SetDiskUsage cập nhật disk usage
func (s *SystemMetricDataStorage) SetDiskUsage(usage float64, total, used int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.DiskUsage = usage
	s.data.TotalDisk = total
	s.data.UsedDisk = used
	s.data.Timestamp = time.Now().Unix()
}

// SetNetworkStats cập nhật network statistics
func (s *SystemMetricDataStorage) SetNetworkStats(bytesSent, bytesRecv int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.NetworkBytesSent = bytesSent
	s.data.NetworkBytesRecv = bytesRecv
	s.data.Timestamp = time.Now().Unix()
}

// SetProcessCount cập nhật số lượng process
func (s *SystemMetricDataStorage) SetProcessCount(count int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.ProcessCount = count
	s.data.Timestamp = time.Now().Unix()
}

// SetUptime cập nhật uptime
func (s *SystemMetricDataStorage) SetUptime(uptime int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.Uptime = uptime
	s.data.Timestamp = time.Now().Unix()
}

// SetGPUUsage cập nhật GPU usage (optional)
func (s *SystemMetricDataStorage) SetGPUUsage(usage float64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data.GPUUsage = &usage
	s.data.Timestamp = time.Now().Unix()
}
