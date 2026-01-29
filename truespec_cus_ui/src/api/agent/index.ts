// ============================================================================
// AGENT API INDEX
// ============================================================================

// Clients
export { agentHttpClient, default as AgentHttpClient } from './httpClient';
export type { AgentConfig } from './httpClient';

export { agentSseClient, default as AgentSSEClient } from './sseClient';
export type { SSEConfig } from './sseClient';

// Modules
export { monitorModule, default as MonitorModule } from './MonitorModule';
export type { MonitorConfig, MetricsUpdateHandler, ConnectionHandler } from './MonitorModule';

export { hardwareModule, default as HardwareModule } from './HardwareModule';
export { alertModule, default as AlertModule } from './AlertModule';
export { commandModule, default as CommandModule } from './CommandModule';

