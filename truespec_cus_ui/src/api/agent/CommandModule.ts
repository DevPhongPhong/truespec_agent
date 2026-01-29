// ============================================================================
// COMMAND MODULE - Send commands to Agent
// ============================================================================

import { agentHttpClient } from './httpClient';
import { ApiResponseDTO } from '../../dtos/common';
import {
  FanControlReqDTO,
  ApplyFanPresetReqDTO,
  SystemActionReqDTO,
  ProcessActionReqDTO,
  ExportDataReqDTO,
  FanControlResultResDTO,
  CommandResultResDTO,
  ExportDataResultResDTO,
  ProcessListResDTO,
} from '../../dtos/agent';

/**
 * CommandModule - Execute commands on Agent
 * 
 * Responsibilities:
 * - Fan control
 * - System actions (shutdown, restart, etc.)
 * - Process management
 * - Data export
 */
class CommandModule {
  private static instance: CommandModule;

  private constructor() { }

  static getInstance(): CommandModule {
    if (!CommandModule.instance) {
      CommandModule.instance = new CommandModule();
    }
    return CommandModule.instance;
  }

  // ============================================================================
  // FAN CONTROL
  // ============================================================================

  /**
   * Control fan settings
   */
  async controlFan(data: FanControlReqDTO): Promise<ApiResponseDTO<FanControlResultResDTO>> {
    return agentHttpClient.post<FanControlResultResDTO>('/commands/fan', data);
  }

  /**
   * Apply fan preset
   */
  async applyFanPreset(data: ApplyFanPresetReqDTO): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return agentHttpClient.post<CommandResultResDTO>('/commands/fan/preset', data);
  }

  /**
   * Reset fan to default
   */
  async resetFan(fanId: string): Promise<ApiResponseDTO<FanControlResultResDTO>> {
    return this.controlFan({ fanId, action: 'reset' });
  }

  /**
   * Set all fans to auto mode
   */
  async setAllFansAuto(): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return agentHttpClient.post<CommandResultResDTO>('/commands/fan/auto-all');
  }

  // ============================================================================
  // SYSTEM ACTIONS
  // ============================================================================

  /**
   * Execute system action
   */
  async systemAction(data: SystemActionReqDTO): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return agentHttpClient.post<CommandResultResDTO>('/commands/system', data);
  }

  /**
   * Shutdown computer
   */
  async shutdown(delay = 0, force = false): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.systemAction({ action: 'shutdown', delay, force });
  }

  /**
   * Restart computer
   */
  async restart(delay = 0, force = false): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.systemAction({ action: 'restart', delay, force });
  }

  /**
   * Sleep computer
   */
  async sleep(): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.systemAction({ action: 'sleep' });
  }

  /**
   * Hibernate computer
   */
  async hibernate(): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.systemAction({ action: 'hibernate' });
  }

  /**
   * Lock screen
   */
  async lock(): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.systemAction({ action: 'lock' });
  }

  // ============================================================================
  // PROCESS MANAGEMENT
  // ============================================================================

  /**
   * Get process list
   */
  async getProcesses(): Promise<ApiResponseDTO<ProcessListResDTO>> {
    return agentHttpClient.get<ProcessListResDTO>('/processes');
  }

  /**
   * Execute process action
   */
  async processAction(data: ProcessActionReqDTO): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return agentHttpClient.post<CommandResultResDTO>('/commands/process', data);
  }

  /**
   * Terminate process
   */
  async terminateProcess(pid: number): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.processAction({ pid, action: 'terminate' });
  }

  /**
   * Kill process forcefully
   */
  async killProcess(pid: number): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.processAction({ pid, action: 'kill' });
  }

  /**
   * Set process priority
   */
  async setProcessPriority(pid: number, priority: 'low' | 'normal' | 'high' | 'realtime'): Promise<ApiResponseDTO<CommandResultResDTO>> {
    return this.processAction({ pid, action: 'set_priority', priority });
  }

  // ============================================================================
  // DATA EXPORT
  // ============================================================================

  /**
   * Export data
   */
  async exportData(data: ExportDataReqDTO): Promise<ApiResponseDTO<ExportDataResultResDTO>> {
    return agentHttpClient.post<ExportDataResultResDTO>('/commands/export', data);
  }

  /**
   * Export metrics history
   */
  async exportMetrics(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string): Promise<ApiResponseDTO<ExportDataResultResDTO>> {
    return this.exportData({ dataType: 'metrics', format, startDate, endDate });
  }

  /**
   * Export hardware info
   */
  async exportHardware(format: 'json' | 'html' = 'html'): Promise<ApiResponseDTO<ExportDataResultResDTO>> {
    return this.exportData({ dataType: 'hardware', format });
  }

  /**
   * Export alerts
   */
  async exportAlerts(format: 'json' | 'csv' = 'json', startDate?: string, endDate?: string): Promise<ApiResponseDTO<ExportDataResultResDTO>> {
    return this.exportData({ dataType: 'alerts', format, startDate, endDate });
  }

  // ============================================================================
  // MISC COMMANDS
  // ============================================================================

  /**
   * Ping agent
   */
  async ping(): Promise<ApiResponseDTO<{ latency: number }>> {
    const start = Date.now();
    const response = await agentHttpClient.get<{ time: number }>('/ping');

    if (response.success) {
      return {
        success: true,
        data: { latency: Date.now() - start },
        error: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      data: null,
      error: response.error,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get agent version
   */
  async getVersion(): Promise<ApiResponseDTO<{ version: string; buildDate: string }>> {
    return agentHttpClient.get<{ version: string; buildDate: string }>('/version');
  }
}

export const commandModule = CommandModule.getInstance();
export default CommandModule;

