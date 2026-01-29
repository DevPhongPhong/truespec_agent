// ============================================================================
// LOGIN REQUEST DTO
// ============================================================================

/**
 * Login request payload
 */
export interface LoginReqDTO {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfoReqDTO;
}

/**
 * Device info for login tracking
 */
export interface DeviceInfoReqDTO {
  deviceId: string;
  deviceName: string;
  platform: 'windows' | 'macos' | 'linux';
  osVersion: string;
  appVersion: string;
}

/**
 * OAuth login request
 */
export interface OAuthLoginReqDTO {
  provider: 'google' | 'github' | 'microsoft';
  accessToken: string;
  deviceInfo?: DeviceInfoReqDTO;
}

