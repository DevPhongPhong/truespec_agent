# Luna Monitor - React TypeScript

Ứng dụng giám sát hệ thống được xây dựng bằng React TypeScript với kiến trúc OOP.

## 🚀 Khởi chạy

```bash
cd luna-monitor-react
npm install
npm run dev
```

Truy cập: http://localhost:3000

## 📁 Cấu trúc Project

```
src/
├── types/              # TypeScript interfaces & types
│   └── index.ts        # Định nghĩa tất cả types
│
├── models/             # OOP Models với Observable pattern
│   ├── BaseModel.ts    # Abstract base class
│   ├── CPUModel.ts     # CPU data model
│   ├── GPUModel.ts     # GPU data model
│   ├── RAMModel.ts     # RAM data model
│   ├── StorageModel.ts # Storage data model
│   ├── NetworkModel.ts # Network data model
│   ├── BatteryModel.ts # Battery data model
│   └── FanModel.ts     # Fan control model
│
├── services/           # Business logic services
│   ├── BaseService.ts  # Abstract service class
│   └── MonitorService.ts # Central monitoring service (Singleton)
│
├── hooks/              # React custom hooks
│   ├── useMonitor.ts   # Hook for monitor service
│   └── useTheme.ts     # Theme management hook
│
├── components/
│   ├── common/         # Reusable UI components
│   │   ├── Card.tsx    # Card component
│   │   ├── Button.tsx  # Button variants
│   │   ├── Badge.tsx   # Badge & chips
│   │   ├── Gauge.tsx   # Circular gauge
│   │   └── Table.tsx   # Data table
│   │
│   ├── charts/         # Chart components
│   │   └── AreaChart.tsx
│   │
│   └── layout/         # Layout components
│       ├── MainLayout.tsx
│       ├── TopBar.tsx
│       └── PageHeader.tsx
│
├── pages/              # Page components
│   ├── OverviewPage.tsx
│   ├── CPUPage.tsx
│   ├── GPUPage.tsx
│   ├── RAMPage.tsx
│   ├── StoragePage.tsx
│   ├── NetworkPage.tsx
│   ├── BatteryPage.tsx
│   └── FanPage.tsx
│
└── styles/             # Global styles
    ├── variables.css   # CSS custom properties
    └── global.css      # Global styles
```

## 🏗️ Kiến trúc OOP

### Models (Observable Pattern)
```typescript
// Kế thừa từ ObservableModel để có reactive updates
class CPUModel extends ObservableModel<CPUData> {
  // Validate data
  validate(): boolean { ... }
  
  // Convert to JSON
  toJSON(): object { ... }
  
  // Refresh with simulated data
  refresh(): void { ... }
  
  // Get status
  getStatus(): StatusLevel { ... }
}
```

### Services (Singleton Pattern)
```typescript
// MonitorService là singleton quản lý tất cả models
const service = MonitorService.getInstance();
service.cpu.data; // Access CPU data
service.refresh(); // Refresh all models
```

### Hooks
```typescript
// useMonitor - Full access to monitor service
const { cpu, gpu, ram, systemStatus, manualRefresh } = useMonitor();

// Individual hooks - Optimized for specific models
const { data, model } = useCPU();
```

## 🎨 Theme System

CSS Variables với hỗ trợ Dark/Light mode:

```css
:root {
  --bg-primary: #020617;
  --accent: #38bdf8;
  --text-primary: #e5e7eb;
  /* ... */
}

[data-theme="light"] {
  --bg-primary: #f0f4f8;
  /* ... */
}
```

## 📦 Dependencies

- **React 19** - UI Library
- **React Router 6** - Routing
- **Recharts** - Charts
- **Lucide React** - Icons
- **clsx** - Class utilities

## 🔄 Data Flow

1. `MonitorService` khởi tạo các Models
2. Auto-refresh mỗi 10 giây
3. Models notify subscribers qua Observable pattern
4. React hooks trigger re-render
5. UI cập nhật với data mới

## 🔌 API Architecture

Project có 2 thư mục API modules để kết nối đến 2 hệ thống:

### 1. `api/auth-server/` - Auth Server Connection
Kết nối đến máy chủ xác thực qua **HTTPS**

| Module | Chức năng |
|--------|-----------|
| `AuthModule` | Login, logout, refresh token, verify token |
| `UserModule` | Profile, 2FA, password, sessions |
| `SubscriptionModule` | Plans, devices, billing |

### 2. `api/agent/` - Agent Connection  
Kết nối đến agent trên máy cục bộ qua **SSE/HTTP**

### DTOs Structure
```
src/dtos/
├── common/          # ApiResponseDTO, PaginationDTO
├── auth/            # Auth server DTOs
│   ├── *ReqDTO.ts   # Request models
│   └── *ResDTO.ts   # Response models
└── agent/           # Agent DTOs
    ├── *ReqDTO.ts   # Request models  
    └── *ResDTO.ts   # Response models
```

📖 Chi tiết: Xem [src/api/README.md](src/api/README.md)

## 🔧 Environment Variables

```env
# Auth Server
VITE_AUTH_SERVER_URL=http://localhost:8080/api

# Agent
VITE_AGENT_URL=http://localhost:9000/api
VITE_AGENT_WS_URL=ws://localhost:9000/ws
```

## 📝 License

MIT
