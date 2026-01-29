# Luna Monitor - API Connection Architecture

## 📐 Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LUNA MONITOR WEBAPP                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────┐       ┌──────────────────────────┐       │
│  │     api/auth-server/      │       │       api/agent/          │       │
│  ├──────────────────────────┤       ├──────────────────────────┤       │
│  │ • AuthModule             │       │ • MonitorModule          │       │
│  │ • UserModule             │       │ • HardwareModule         │       │
│  │ • SubscriptionModule     │       │ • AlertModule            │       │
│  │ • httpClient             │       │ • CommandModule          │       │
│  │                          │       │ • httpClient             │       │
│  │                          │       │ • sseClient (SSE)        │       │
│  └───────────┬──────────────┘       └───────────┬──────────────┘       │
│              │                                  │                       │
└──────────────│──────────────────────────────────│───────────────────────┘
               │                                  │
               │ HTTPS                            │ SSE/HTTP
               │                                  │
               ▼                                  ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│        AUTH SERVER           │    │          AGENT               │
│  (Cloud / Self-hosted)       │    │    (Local Machine)           │
├──────────────────────────────┤    ├──────────────────────────────┤
│ • User authentication        │    │ • System monitoring          │
│ • Token management           │    │ • Hardware info              │
│ • Profile & settings         │    │ • Real-time metrics          │
│ • Subscription & billing     │    │ • Fan control                │
│ • Device management          │    │ • Alert management           │
└──────────────────────────────┘    └──────────────────────────────┘
```

## 🔌 Phương thức kết nối

### 1. Auth Server (api/auth-server/)

**Protocol:** HTTPS only

**Base URL:** `VITE_AUTH_SERVER_URL` (default: `http://localhost:8080/api`)

| Module | Chức năng | Endpoints |
|--------|-----------|-----------|
| **AuthModule** | Xác thực | `/auth/login`, `/auth/logout`, `/auth/refresh` |
| **UserModule** | User profile | `/users/me`, `/users/register`, `/users/me/2fa/*` |
| **SubscriptionModule** | Gói dịch vụ | `/subscriptions/*`, `/subscriptions/devices/*` |

**Authentication Flow:**
```
1. User login → POST /auth/login → Receive tokens
2. Store tokens in localStorage
3. Attach Bearer token to all requests
4. Auto-refresh when token expires (401)
5. Logout → Clear tokens

### 2. Agent Service (api/agent/)

**Protocols:**
- **SSE** - Real-time unidirectional (fallback)
- **HTTP** - Request/Response (commands, fallback)

**URLs:**
- HTTP: `VITE_AGENT_URL` (default: `http://localhost:9000/api`)

| Module | Chức năng | Protocol |
|--------|-----------|----------|
| **MonitorModule** | Real-time metrics | SSE |
| **HardwareModule** | Hardware specs | HTTP |
| **AlertModule** | Alerts | SSE + HTTP |

## 🔄 Real-time Data Flow


```typescript
// Connect
await monitorModule.start(deviceId, accessToken);

// Subscribe to metrics updates
monitorModule.onMetrics((metrics) => {
  console.log('CPU Load:', metrics.cpu.load);
  console.log('RAM Usage:', metrics.ram.usedPercent);
});

// Subscribe to alerts
alertModule.onAlert((alert, action) => {
  if (action === 'created') {
    showNotification(alert);
  }
});

// Disconnect when done
monitorModule.stop();
```

### SSE Mode (Fallback)

// Connect (uses SSE internally)
await monitorModule.start(deviceId, accessToken);

// Same subscription API
monitorModule.onMetrics((metrics) => { ... });

## 📦 DTOs Structure

### Request DTOs (`*ReqDTO`)
```
dtos/
├── auth/
│   ├── LoginReqDTO.ts          # Login credentials
│   ├── TokenReqDTO.ts          # Token operations
│   ├── UserReqDTO.ts           # Profile updates
│   └── SubscriptionReqDTO.ts   # Subscription actions
└── agent/
    ├── AlertReqDTO.ts          # Alert queries/actions
    └── CommandReqDTO.ts        # Commands to agent
```

### Response DTOs (`*ResDTO`)
```
dtos/
├── common/
│   └── index.ts                # ApiResponseDTO, PaginationResDTO
├── auth/
│   ├── LoginResDTO.ts          # Login result + tokens
│   ├── TokenResDTO.ts          # Token verification
│   ├── UserResDTO.ts           # User profile
│   └── SubscriptionResDTO.ts   # Subscription details
└── agent/
    ├── SystemMetricsResDTO.ts  # Real-time metrics
    ├── HardwareInfoResDTO.ts   # Hardware specs
    ├── AlertResDTO.ts          # Alert data
    └── CommandResDTO.ts        # Command results
```

## 🔐 Authentication

### Token Storage
```typescript
// Tokens are stored in localStorage
localStorage.getItem('luna_access_token');
localStorage.getItem('luna_refresh_token');
```

### Auto Token Refresh
```typescript
// httpClient automatically handles 401 errors
// 1. Detect 401 response
// 2. Call /auth/refresh with refresh token
// 3. Update stored tokens
// 4. Retry original request
```

### Cross-service Authentication
```typescript
// After login to Auth Server
const { accessToken } = await authModule.login(credentials);

// Use same token for Agent
agentHttpClient.setAccessToken(accessToken);
await monitorModule.start(deviceId, accessToken);
```

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Auth Server
VITE_AUTH_SERVER_URL=http://localhost:8080/api

# Agent
VITE_AGENT_URL=http://localhost:9000/api
VITE_AGENT_WS_URL=ws://localhost:9000/ws
```

### Runtime Configuration
```typescript
// Auth Server
authHttpClient.configure({
  baseUrl: 'https://auth.myapp.com/api',
  timeout: 30000,
  onUnauthorized: () => router.push('/login'),
});

// Agent
agentHttpClient.configure({
  baseUrl: 'http://localhost:9000/api',
  timeout: 15000,
});

agentWsClient.configure({
  url: 'ws://localhost:9000/ws',
  reconnect: true,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
});
```

## 📊 Usage Examples

### Login Flow
```typescript
import { authModule, userModule } from '@/api/auth-server';

// Login
const loginResult = await authModule.login({
  email: 'user@example.com',
  password: 'password123',
});

if (loginResult.success) {
  // Get user profile
  const profile = await userModule.getProfile();
  console.log('Welcome,', profile.data?.fullName);
}
```

### Monitor System Metrics
```typescript
import { monitorModule, hardwareModule } from '@/api/agent';

// Get hardware info first
const hardware = await hardwareModule.getHardwareInfo();
console.log('CPU:', hardware.data?.cpu.name);

// Start real-time monitoring
await monitorModule.start(deviceId, accessToken);

monitorModule.onMetrics((metrics) => {
  updateUI({
    cpuLoad: metrics.cpu.load,
    cpuTemp: metrics.cpu.temperature,
    ramUsed: metrics.ram.usedPercent,
  });
});

monitorModule.onConnection((status) => {
  if (status === 'disconnected') {
    showReconnectButton();
  }
});
```

### Control Fans
```typescript
import { commandModule } from '@/api/agent';

// Set fan to manual mode with 50% PWM
await commandModule.controlFan({
  fanId: 'cpu_fan',
  action: 'set_pwm',
  mode: 'manual',
  pwm: 50,
});

// Apply preset
await commandModule.applyFanPreset({
  preset: 'quiet',
});

// Reset to auto
await commandModule.resetFan('cpu_fan');
```

### Manage Alerts
```typescript
import { alertModule } from '@/api/agent';

// Get unread alerts
const alerts = await alertModule.getAlerts({
  isRead: false,
  severity: ['high', 'critical'],
});

// Subscribe to new alerts
alertModule.subscribeToAlerts();
alertModule.onAlert((alert, action) => {
  if (action === 'created' && alert.severity === 'critical') {
    playAlertSound();
    showCriticalNotification(alert);
  }
});

// Acknowledge alert
await alertModule.acknowledge({
  alertId: 'alert-123',
  note: 'Investigating the issue',
});
```

## 🛡️ Error Handling

All API responses follow this structure:
```typescript
interface ApiResponseDTO<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorDTO | null;
  timestamp: string;
  requestId?: string;
}

interface ApiErrorDTO {
  code: string;       // e.g., 'AUTH_INVALID_CREDENTIALS'
  message: string;    // Human-readable message
  details?: object;   // Additional info
}
```

### Example Error Handling
```typescript
const result = await authModule.login(credentials);

if (!result.success) {
  switch (result.error?.code) {
    case 'AUTH_INVALID_CREDENTIALS':
      showError('Email hoặc mật khẩu không đúng');
      break;
    case 'AUTH_ACCOUNT_LOCKED':
      showError('Tài khoản bị khóa, vui lòng liên hệ hỗ trợ');
      break;
    case 'NETWORK_ERROR':
      showError('Không thể kết nối đến máy chủ');
      break;
    default:
      showError(result.error?.message || 'Có lỗi xảy ra');
  }
}
```

## 🔄 Connection Status

```typescript
type ConnectionStatus = 
  | 'disconnected'   // Not connected
  | 'connecting'     // Attempting connection
  | 'connected'      // Connected and ready
  | 'reconnecting'   // Lost connection, trying to reconnect
  | 'error';         // Connection error

// Monitor status
monitorModule.onConnection((status) => {
  switch (status) {
    case 'connected':
      hideConnectionBanner();
      break;
    case 'reconnecting':
      showBanner('Đang kết nối lại...');
      break;
    case 'disconnected':
      showBanner('Mất kết nối với agent');
      break;
  }
});
```

