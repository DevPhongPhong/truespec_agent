// ============================================================================
// COMMAND REQUEST DTOs - Commands sent to Agent
// ============================================================================

/**
 * Fan control command
 */
export interface FanControlReqDTO {
  fanId: string;
  action: 'set_mode' | 'set_pwm' | 'set_curve' | 'reset';
  mode?: 'auto' | 'manual';
  pwm?: number; // 0-100
  curve?: FanCurvePointReqDTO[];
}

/**
 * Fan curve point
 */
export interface FanCurvePointReqDTO {
  temperature: number;
  pwmDuty: number;
}

/**
 * Apply fan preset command
 */
export interface ApplyFanPresetReqDTO {
  preset: 'quiet' | 'balanced' | 'performance' | 'custom';
  customCurve?: FanCurvePointReqDTO[];
}

/**
 * System action command
 */
export interface SystemActionReqDTO {
  action: 'shutdown' | 'restart' | 'sleep' | 'hibernate' | 'lock';
  delay?: number; // seconds
  force?: boolean;
}

/**
 * Process action command
 */
export interface ProcessActionReqDTO {
  pid: number;
  action: 'terminate' | 'kill' | 'suspend' | 'resume' | 'set_priority';
  priority?: 'low' | 'normal' | 'high' | 'realtime';
}

/**
 * Scan hardware command
 */
export interface ScanHardwareReqDTO {
  components?: ('cpu' | 'gpu' | 'ram' | 'storage' | 'network' | 'battery' | 'fans')[];
  deepScan?: boolean;
}

/**
 * Export data command
 */
export interface ExportDataReqDTO {
  dataType: 'metrics' | 'hardware' | 'alerts' | 'logs';
  format: 'json' | 'csv' | 'html';
  startDate?: string;
  endDate?: string;
  components?: string[];
}

