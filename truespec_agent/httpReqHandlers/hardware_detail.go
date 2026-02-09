package httpHandlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/unitechio/agent/internal/collectors/cpu"
	"github.com/unitechio/agent/internal/collectors/disk"
	"github.com/unitechio/agent/internal/collectors/gpu"
	"github.com/unitechio/agent/internal/collectors/memory"
	"github.com/unitechio/agent/internal/collectors/network"
	"github.com/unitechio/agent/internal/collectors/system"
)

// APIResponse là cấu trúc response chuẩn cho API
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data"`
	Error     *APIError   `json:"error,omitempty"`
	Timestamp string      `json:"timestamp"`
}

// APIError là cấu trúc lỗi chuẩn
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// writeJSONResponse ghi JSON response với format chuẩn
func writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}, err error) {
	// Set CORS headers
	CORSHeaders(w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := APIResponse{
		Success:   err == nil,
		Data:      data,
		Timestamp: time.Now().Format(time.RFC3339),
	}

	if err != nil {
		response.Error = &APIError{
			Code:    "HARDWARE_ERROR",
			Message: err.Error(),
		}
	}

	json.NewEncoder(w).Encode(response)
}

// HandleHardware trả về thông tin phần cứng đầy đủ
// GET /hardware
func HandleHardware(w http.ResponseWriter, r *http.Request) {
	// Handle CORS preflight OPTIONS request
	if r.Method == http.MethodOptions {
		CORSHeaders(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeJSONResponse(w, http.StatusMethodNotAllowed, nil, nil)
		return
	}

	ctx := r.Context()

	// Thu thập thông tin từ các collectors
	osInfo, err := system.OSInfo(ctx)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	cpuInfo, err := cpu.CPUInfo(ctx)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	gpus, err := gpu.GetGPUs()
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	memInfo, err := memory.MemoryInfo(ctx)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	diskInfo, err := disk.DiskInfo(ctx)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	networkInfo, err := network.NetworkInfo(ctx, true)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Tạo response với tất cả thông tin phần cứng
	hardwareData := map[string]interface{}{
		"os":      osInfo,
		"cpu":     cpuInfo,
		"gpu":     gpus,
		"ram":     memInfo,
		"storage": diskInfo,
		"network": networkInfo,
	}

	writeJSONResponse(w, http.StatusOK, hardwareData, nil)
}

// HandleCPU trả về thông tin CPU dưới dạng mảng
// GET /hardware/cpu
func HandleCPU(w http.ResponseWriter, r *http.Request) {
	// Handle CORS preflight OPTIONS request
	if r.Method == http.MethodOptions {
		CORSHeaders(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	fmt.Println("HandleCPU at", time.Now())
	if r.Method != http.MethodGet {
		writeJSONResponse(w, http.StatusMethodNotAllowed, nil, nil)
		return
	}

	ctx := r.Context()
	cpuInfo, err := cpu.CPUInfo(ctx)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Chuyển đổi thành mảng để nhất quán với các hardware khác
	cpuArray := []interface{}{cpuInfo}

	writeJSONResponse(w, http.StatusOK, cpuArray, nil)
}

// HandleGPU trả về thông tin GPU dưới dạng mảng
// GET /hardware/gpu
func HandleGPU(w http.ResponseWriter, r *http.Request) {
	// Handle CORS preflight OPTIONS request
	if r.Method == http.MethodOptions {
		CORSHeaders(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeJSONResponse(w, http.StatusMethodNotAllowed, nil, nil)
		return
	}

	gpus, err := gpu.GetGPUs()
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Chuyển đổi GPUInfo thành map để JSON serialization tốt hơn
	gpuArray := make([]map[string]interface{}, len(gpus))
	for i, g := range gpus {
		gpuArray[i] = map[string]interface{}{
			"index":         g.Index,
			"name":          g.Name,
			"vendor":        g.Vendor,
			"vram_total_mb": g.VRAMTotalMB,
			"vram_used_mb":  g.VRAMUsedMB,
			"driver":        g.Driver,
			"bus_id":        g.BusID,
			"integrated":    g.Integrated,
		}
	}

	writeJSONResponse(w, http.StatusOK, gpuArray, nil)
}

// HandleRAM trả về thông tin RAM
// GET /hardware/ram
func HandleRAM(w http.ResponseWriter, r *http.Request) {
	// Handle CORS preflight OPTIONS request
	if r.Method == http.MethodOptions {
		CORSHeaders(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeJSONResponse(w, http.StatusMethodNotAllowed, nil, nil)
		return
	}

	ctx := r.Context()
	memInfo, err := memory.MemoryInfo(ctx)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Chuyển đổi thành mảng để nhất quán
	ramArray := []interface{}{memInfo}

	writeJSONResponse(w, http.StatusOK, ramArray, nil)
}

// HandleStorage trả về thông tin storage dưới dạng mảng
// GET /hardware/storage
func HandleStorage(w http.ResponseWriter, r *http.Request) {
	// Handle CORS preflight OPTIONS request
	if r.Method == http.MethodOptions {
		CORSHeaders(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeJSONResponse(w, http.StatusMethodNotAllowed, nil, nil)
		return
	}

	ctx := r.Context()
	diskInfo, err := disk.DiskInfo(ctx)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Lấy partitions từ diskInfo
	diskMap, ok := diskInfo.(map[string]interface{})
	if !ok {
		writeJSONResponse(w, http.StatusInternalServerError, nil, nil)
		return
	}

	partitions, ok := diskMap["partitions"].([]map[string]interface{})
	if !ok {
		// Nếu không phải array, chuyển đổi
		partitionsInterface, ok := diskMap["partitions"].([]interface{})
		if ok {
			partitions = make([]map[string]interface{}, len(partitionsInterface))
			for i, p := range partitionsInterface {
				if pMap, ok := p.(map[string]interface{}); ok {
					partitions[i] = pMap
				}
			}
		} else {
			partitions = []map[string]interface{}{}
		}
	}

	writeJSONResponse(w, http.StatusOK, partitions, nil)
}

// HandleNetwork trả về thông tin network dưới dạng mảng
// GET /hardware/network
func HandleNetwork(w http.ResponseWriter, r *http.Request) {
	// Handle CORS preflight OPTIONS request
	if r.Method == http.MethodOptions {
		CORSHeaders(w)
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeJSONResponse(w, http.StatusMethodNotAllowed, nil, nil)
		return
	}

	ctx := r.Context()
	networkInfo, err := network.NetworkInfo(ctx, true)
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	// Lấy interfaces từ networkInfo
	networkMap, ok := networkInfo.(map[string]interface{})
	if !ok {
		writeJSONResponse(w, http.StatusInternalServerError, nil, nil)
		return
	}

	interfaces, ok := networkMap["interfaces"].([]map[string]interface{})
	if !ok {
		// Nếu không phải array, chuyển đổi
		interfacesInterface, ok := networkMap["interfaces"].([]interface{})
		if ok {
			interfaces = make([]map[string]interface{}, len(interfacesInterface))
			for i, iface := range interfacesInterface {
				if ifaceMap, ok := iface.(map[string]interface{}); ok {
					interfaces[i] = ifaceMap
				}
			}
		} else {
			interfaces = []map[string]interface{}{}
		}
	}

	writeJSONResponse(w, http.StatusOK, interfaces, nil)
}
