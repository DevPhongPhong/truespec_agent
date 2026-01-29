// ============================================================================
// COMMAND RESPONSE DTOs - Responses from Agent commands
// ============================================================================

/**
 * Generic command result
 */
export interface CommandResultResDTO {
  success: boolean;
  commandId: string;
  executedAt: string;
  duration: number; // milliseconds
  message?: string;
  error?: string;
}

/**
 * Fan control result
 */
export interface FanControlResultResDTO extends CommandResultResDTO {
  fanId: string;
  previousMode: 'auto' | 'manual';
  currentMode: 'auto' | 'manual';
  previousPwm: number;
  currentPwm: number;
  currentRpm: number;
}

/**
 * Scan hardware result
 */
export interface ScanHardwareResultResDTO extends CommandResultResDTO {
  scannedComponents: string[];
  changesDetected: HardwareChangeResDTO[];
}

/**
 * Hardware change detection
 */
export interface HardwareChangeResDTO {
  component: string;
  changeType: 'added' | 'removed' | 'modified';
  previousValue?: string;
  currentValue?: string;
  description: string;
}

/**
 * Export data result
 */
export interface ExportDataResultResDTO extends CommandResultResDTO {
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: string;
  data?: unknown; // Inline data if small enough
}

/**
 * Process list response
 */
export interface ProcessListResDTO {
  processes: ProcessInfoResDTO[];
  total: number;
}

/**
 * Process info
 */
export interface ProcessInfoResDTO {
  pid: number;
  name: string;
  path?: string;
  cpuUsage: number;
  memoryUsage: number;
  memoryBytes: number;
  threads: number;
  handles: number;
  status: 'running' | 'suspended' | 'stopped';
  startTime?: string;
  user?: string;
  priority: 'low' | 'normal' | 'high' | 'realtime';
}

