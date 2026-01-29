package scheduler

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
	"github.com/unitechio/agent/internal/config"
	"github.com/unitechio/agent/internal/sender"
	"github.com/unitechio/agent/internal/storage"
)

// JobScheduler quản lý các scheduled jobs để thu thập và gửi metrics
type JobScheduler struct {
	// Context để quản lý lifecycle
	ctx context.Context
	// Channel để nhận tín hiệu dừng
	stopCh chan struct{}
	// Trạng thái running
	running bool
	// Mutex để bảo vệ trạng thái running
	mu sync.Mutex
	// Config chứa refresh interval
	cfg *config.Config
	// Storage để lưu trữ metrics
	metricStorage *storage.SystemMetricDataStorage
	// Sender để gửi dữ liệu đến UI clients
	uiSender *sender.UISender
}

// NewJobScheduler tạo một JobScheduler mới
func NewJobScheduler(ctx context.Context, cfg *config.Config, metricStorage *storage.SystemMetricDataStorage, uiSender *sender.UISender) *JobScheduler {
	return &JobScheduler{
		ctx:           ctx,
		stopCh:        make(chan struct{}),
		running:       false,
		cfg:           cfg,
		metricStorage: metricStorage,
		uiSender:      uiSender,
	}
}

// Start khởi động JobScheduler và chạy periodic collection
func (js *JobScheduler) Start() error {
	js.mu.Lock()
	if js.running {
		js.mu.Unlock()
		return nil
	}
	js.running = true
	js.mu.Unlock()

	// Lấy refresh interval từ config
	interval := js.cfg.GetRefreshInterval()
	fmt.Println("interval", interval)
	// Chạy goroutine để thu thập và gửi metrics theo interval
	go js.runScheduler(interval)

	return nil
}

// runScheduler chạy scheduler với ticker theo interval
func (js *JobScheduler) runScheduler(interval time.Duration) {
	// Chạy ngay lập tức khi khởi động
	js.collectAndSendMetrics()

	// Tạo ticker để chạy theo interval
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-js.stopCh:
			// Nhận tín hiệu dừng
			return
		case <-js.ctx.Done():
			// Context bị cancel
			return
		case <-ticker.C:
			// Đến thời gian thu thập metrics
			js.collectAndSendMetrics()
		}
	}
}

// collectAndSendMetrics thu thập metrics từ hệ thống, lưu vào storage và gửi đến clients
func (js *JobScheduler) collectAndSendMetrics() {
	fmt.Println("collectAndSendMetrics at", time.Now())

	// Thu thập tất cả metrics
	metricData, err := js.collectMetrics()
	if err != nil {
		// Nếu có lỗi khi thu thập, bỏ qua lần này
		return
	}

	fmt.Println("metricData", metricData)
	// Lưu vào storage
	js.metricStorage.Set(metricData)

	// Gửi dữ liệu đến tất cả UI clients
	if err := js.uiSender.SendData("metrics"); err != nil {
		// Nếu có lỗi khi gửi, bỏ qua (UISender đã tự động remove failed clients)
	}
}

// collectMetrics thu thập tất cả metrics từ hệ thống
func (js *JobScheduler) collectMetrics() (storage.SystemMetricData, error) {
	var metricData storage.SystemMetricData

	// Thu thập CPU usage
	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		metricData.CPUUsage = cpuPercent[0]
	}

	// Thu thập Memory info
	vmStat, err := mem.VirtualMemory()
	if err == nil {
		metricData.MemoryUsage = vmStat.UsedPercent
		metricData.TotalMemory = int64(vmStat.Total)
		metricData.UsedMemory = int64(vmStat.Used)
	}

	// Thu thập Disk info (tính tổng từ tất cả partitions)
	partitions, err := disk.Partitions(false)
	if err == nil {
		var totalDisk int64
		var usedDisk int64
		for _, partition := range partitions {
			usage, err := disk.Usage(partition.Mountpoint)
			if err == nil {
				totalDisk += int64(usage.Total)
				usedDisk += int64(usage.Used)
			}
		}
		metricData.TotalDisk = totalDisk
		metricData.UsedDisk = usedDisk
		if totalDisk > 0 {
			metricData.DiskUsage = float64(usedDisk) / float64(totalDisk) * 100
		}
	}

	// Thu thập Network stats (bytes sent/received)
	ioCounters, err := net.IOCounters(true)
	if err == nil {
		var totalBytesSent int64
		var totalBytesRecv int64
		for _, counter := range ioCounters {
			totalBytesSent += int64(counter.BytesSent)
			totalBytesRecv += int64(counter.BytesRecv)
		}
		metricData.NetworkBytesSent = totalBytesSent
		metricData.NetworkBytesRecv = totalBytesRecv
	}

	// Thu thập Process count
	processes, err := process.Processes()
	if err == nil {
		metricData.ProcessCount = len(processes)
	}

	// Thu thập Uptime
	hostInfo, err := host.Info()
	if err == nil && hostInfo != nil {
		metricData.Uptime = int64(hostInfo.Uptime)
	}

	// GPU usage có thể được thêm sau nếu cần
	// metricData.GPUUsage = ...

	return metricData, nil
}

// Stop dừng JobScheduler
func (js *JobScheduler) Stop() {
	js.mu.Lock()
	defer js.mu.Unlock()

	if !js.running {
		return
	}

	js.running = false
	close(js.stopCh)
}

// IsRunning trả về trạng thái running của scheduler
func (js *JobScheduler) IsRunning() bool {
	js.mu.Lock()
	defer js.mu.Unlock()
	return js.running
}
