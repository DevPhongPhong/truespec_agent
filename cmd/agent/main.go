package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"

	"github.com/getlantern/systray"
	httpHandlers "github.com/unitechio/agent/httpReqHandlers"
	"github.com/unitechio/agent/internal/config"
	"github.com/unitechio/agent/internal/scheduler"
	"github.com/unitechio/agent/internal/sender"
	"github.com/unitechio/agent/internal/storage"
)

func main() {
	// Lấy đường dẫn config cố định từ thư mục chứa file thực thi
	configPath := getDefaultConfigPath()

	// Tạo context với khả năng cancel để quản lý lifecycle của agent
	ctx, cancel := context.WithCancel(context.Background())

	// Chạy agent trong goroutine riêng để không block main thread
	go func() {
		// Gọi hàm run để khởi động agent với context và config path
		if err := run(ctx, configPath); err != nil {
			// Nếu có lỗi, thoát systray
			systray.Quit()
		}
	}()

	// Xử lý system signals để shutdown gracefully
	go func() {
		// Tạo channel để nhận signals
		sigChan := make(chan os.Signal, 1)
		// Đăng ký nhận các signal: SIGINT (Ctrl+C) và SIGTERM
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		// Chờ nhận signal
		<-sigChan
		// Khi nhận được signal, cancel context để dừng agent
		cancel()
		// Thoát systray
		systray.Quit()
	}()

	// Khởi chạy system tray với callback onReady và onExit
	systray.Run(onReady, func() {
		// Khi systray exit, cancel context để dừng agent
		cancel()
	})
}

func run(ctx context.Context, configPath string) error {
	// =========================================================================
	// LOAD CONFIGURATION
	// =========================================================================

	// Load cấu hình từ file config
	cfg, err := config.Load(configPath)
	if err != nil {
		// Nếu không tìm thấy file config, tạo config mặc định
		if err == config.ErrConfigNotFound {
			// Tạo config mặc định với port 9000 và refresh interval 3 giây (5 phút)
			cfg = &config.Config{
				Port:                   ":9000",
				RefreshIntervalSeconds: 1,
			}
			// Lưu config mặc định vào file
			if err := cfg.Save(configPath); err != nil {
				// Bỏ qua lỗi nếu không lưu được config
			}
		} else {
			// Trả về lỗi nếu không load được config
			return fmt.Errorf("failed to load configuration: %w", err)
		}
	}

	// =========================================================================
	// SSE CLIENT POOL SETUP
	// =========================================================================

	// Tạo SSE client pool để quản lý các kết nối SSE
	clientPool := httpHandlers.NewSSEClientPool()
	// Set pool vào HandleSSE để handler có thể sử dụng
	httpHandlers.SetClientPool(clientPool)

	// =========================================================================
	// STORAGE & SENDER SETUP
	// =========================================================================

	// Tạo storage để lưu trữ metrics
	metricStorage := storage.NewSystemMetricDataStorage()
	// Tạo UI sender để gửi dữ liệu đến clients
	uiSender := sender.NewUISender(clientPool, metricStorage)

	// =========================================================================
	// HTTP LISTENER SETUP
	// =========================================================================

	// Tạo HTTP router mới
	mux := http.NewServeMux()
	// Đăng ký SSE handler cho route "/sse"
	mux.HandleFunc("/sse", httpHandlers.HandleSSE)

	// Tạo HTTP server với port từ config và handler đã định nghĩa
	httpServer := &http.Server{
		Addr:    cfg.Port,
		Handler: mux,
	}

	// Chạy HTTP server trong goroutine riêng để không block main loop
	go func() {
		// Bắt đầu lắng nghe HTTP requests trên port đã cấu hình
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			// Bỏ qua lỗi nếu server đã được đóng
		}
	}()

	// =========================================================================
	// JOB SCHEDULER SETUP
	// =========================================================================

	// Tạo và khởi động JobScheduler với config, storage và sender
	jobScheduler := scheduler.NewJobScheduler(ctx, cfg, metricStorage, uiSender)
	// Khởi động scheduler
	if err := jobScheduler.Start(); err != nil {
		return fmt.Errorf("failed to start job scheduler: %w", err)
	}
	// Đảm bảo scheduler được dừng khi hàm kết thúc
	defer jobScheduler.Stop()

	// =========================================================================
	// MAIN LOOP & SHUTDOWN
	// =========================================================================

	// Chờ cho đến khi nhận signal shutdown
	<-ctx.Done()

	// Khi context bị cancel (nhận shutdown signal)
	// Dừng JobScheduler
	jobScheduler.Stop()

	// Tạo context với timeout 5 giây cho graceful shutdown
	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 5*time.Second)
	// Đảm bảo cancel được gọi khi hàm kết thúc
	defer cancelShutdown()
	// Dừng HTTP server một cách graceful
	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		// Bỏ qua lỗi nếu có
	}

	// Trả về nil để báo shutdown thành công
	return nil
}

func getDefaultConfigPath() string {
	// Lấy đường dẫn file thực thi hiện tại
	execPath, err := os.Executable()
	if err != nil {
		// Nếu không lấy được đường dẫn thực thi, fallback về thư mục hiện tại
		execPath, _ = os.Getwd()
	}

	// Lấy thư mục chứa file thực thi
	execDir := filepath.Dir(execPath)
	// Tạo đường dẫn config.json trong cùng thư mục với file thực thi
	return filepath.Join(execDir, "config.json")
}

func onReady() {
	systray.SetTitle("My Agent")
	systray.SetTooltip("My Agent is running")

	mOpen := systray.AddMenuItem("Open Dashboard", "Open web UI")
	mQuit := systray.AddMenuItem("Quit", "Exit app")

	go func() {
		for {
			select {
			case <-mOpen.ClickedCh:
				openBrowser("http://localhost:9000")
			case <-mQuit.ClickedCh:
				systray.Quit()
				return
			}
		}
	}()
}

func openBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	case "linux":
		cmd = "xdg-open"
		args = []string{url}
	default:
		return
	}

	_ = exec.Command(cmd, args...).Start()
}
