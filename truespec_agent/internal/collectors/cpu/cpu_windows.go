//go:build windows

package cpu

import (
	"context"
	"fmt"
	"runtime"
	"strings"

	"github.com/StackExchange/wmi"
	"github.com/shirou/gopsutil/v3/cpu"
)

type win32Processor struct {
	NumberOfCores            uint32
	NumberOfLogicalProcessors uint32
	MaxClockSpeed            uint32
	CurrentClockSpeed        uint32
	Architecture             uint16
	Family                   uint16
	Manufacturer             string
	Name                     string
	SocketDesignation        string
	SerialNumber             string
	L2CacheSize              *uint32
	L3CacheSize              *uint32
	L2CacheSpeed             *uint32
	L3CacheSpeed             *uint32
}

type win32ProcessorCache struct {
	Purpose      uint16
	Level        uint8
	MaxCacheSize uint32
	InstalledSize uint32
}

func CPUInfo(ctx context.Context) (interface{}, error) {
	// Get CPU usage (overall)
	percentages, err := cpu.Percent(0, false)
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU usage: %w", err)
	}

	var usage float64
	if len(percentages) > 0 {
		usage = percentages[0]
	}
	
	// Get per-core CPU usage
	perCorePercentages, err := cpu.Percent(0, true)
	if err != nil {
		// If per-core fails, continue with overall usage
		perCorePercentages = []float64{}
	}

	// Get CPU info from gopsutil
	cpuInfo, err := cpu.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU info: %w", err)
	}

	result := map[string]interface{}{
		"usage_percent": usage,
		"per_core_usage": perCorePercentages,
	}

	// Get detailed info from WMI
	var processors []win32Processor
	err = wmi.Query(`
		SELECT NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed, CurrentClockSpeed,
		       Architecture, Family, Manufacturer, Name, SocketDesignation, SerialNumber,
		       L2CacheSize, L3CacheSize, L2CacheSpeed, L3CacheSpeed
		FROM Win32_Processor
	`, &processors)
	
	if err == nil && len(processors) > 0 {
		p := processors[0]
		
		// Cores and Threads
		result["cores"] = int(p.NumberOfCores)
		result["threads"] = int(p.NumberOfLogicalProcessors)
		
		// Clock speeds (in MHz)
		// MaxClockSpeed is the maximum clock speed (often base clock on some systems)
		// CurrentClockSpeed is the current operating speed
		result["max_clock_mhz"] = int(p.MaxClockSpeed)
		result["current_clock_mhz"] = int(p.CurrentClockSpeed)
		
		// Base clock: Use MaxClockSpeed as base (on many systems this is the base clock)
		// Note: WMI doesn't distinguish between base and turbo clearly
		// Frontend can use max_clock_mhz as base and estimate turbo if current > max
		result["base_clock_mhz"] = int(p.MaxClockSpeed)
		
		// Architecture
		arch := getArchitectureName(p.Architecture)
		result["architecture"] = arch
		
		// Socket
		result["socket"] = p.SocketDesignation
		
		// Serial Number
		result["serial_number"] = p.SerialNumber
		
		// Manufacturer and Model
		if p.Manufacturer != "" {
			result["vendor"] = p.Manufacturer
		} else if len(cpuInfo) > 0 {
			result["vendor"] = cpuInfo[0].VendorID
		}
		
		if p.Name != "" {
			result["model"] = strings.TrimSpace(p.Name)
		} else if len(cpuInfo) > 0 {
			result["model"] = cpuInfo[0].ModelName
		}
		
		// Cache information
		if p.L2CacheSize != nil {
			result["l2_cache_kb"] = int(*p.L2CacheSize)
		}
		if p.L3CacheSize != nil {
			result["l3_cache_kb"] = int(*p.L3CacheSize)
		}
		
		// Get cache from Win32_CacheMemory
		// Level mapping: 3 = L1, 4 = L2, 5 = L3
		var caches []win32ProcessorCache
		errCache := wmi.Query(`
			SELECT Purpose, Level, MaxCacheSize, InstalledSize
			FROM Win32_CacheMemory
			WHERE Purpose = 3
		`, &caches)
		
		if errCache == nil {
			var l1CacheKB int
			for _, cache := range caches {
				// Level 3 = L1 cache
				if cache.Level == 3 {
					l1CacheKB += int(cache.InstalledSize)
				}
				// Level 4 = L2 cache (if not already set from Win32_Processor)
				if cache.Level == 4 && result["l2_cache_kb"] == nil {
					result["l2_cache_kb"] = int(cache.InstalledSize)
				}
				// Level 5 = L3 cache (if not already set from Win32_Processor)
				if cache.Level == 5 && result["l3_cache_kb"] == nil {
					result["l3_cache_kb"] = int(cache.InstalledSize)
				}
			}
			if l1CacheKB > 0 {
				result["l1_cache_kb"] = l1CacheKB
			}
		}
		
		// TDP - Try to get from processor power management
		// Note: TDP is not directly available in WMI, we'll need to estimate or leave empty
		// For now, we'll set it to 0 and let frontend handle it
		result["tdp"] = 0
		
	} else {
		// Fallback to gopsutil if WMI fails
		result["cores"] = runtime.NumCPU()
		result["threads"] = runtime.NumCPU() // Fallback: assume no hyperthreading
		
		if len(cpuInfo) > 0 {
			result["model"] = cpuInfo[0].ModelName
			result["mhz"] = cpuInfo[0].Mhz
			result["vendor"] = cpuInfo[0].VendorID
			result["base_clock_mhz"] = int(cpuInfo[0].Mhz)
			result["max_clock_mhz"] = int(cpuInfo[0].Mhz)
		}
	}

	return result, nil
}

func getArchitectureName(arch uint16) string {
	switch arch {
	case 0:
		return "x86"
	case 1:
		return "MIPS"
	case 2:
		return "Alpha"
	case 3:
		return "PowerPC"
	case 5:
		return "ARM"
	case 6:
		return "ia64"
	case 9:
		return "x64"
	default:
		return "Unknown"
	}
}
