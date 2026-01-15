# SSE Protocol Documentation

## Tổng quan

SSE (Server-Sent Events) là giao thức một chiều từ Server → Client. **Client KHÔNG cần gửi request báo hiệu**.

## Format gói tin SSE

Server gửi các event theo format chuẩn SSE:

```
event: <event-type>
data: <json-data>

```

Ví dụ:
```
event: connected
data: {"client_id":"client_123","message":"Connected to SSE stream","timestamp":1234567890}

event: heartbeat
data: {"type":"heartbeat","timestamp":1234567890}

```

## Cách Client phân biệt các loại gói tin

### 1. Sử dụng Event Type

Mỗi gói tin có một **event type** riêng. Client listen từng event type:

```javascript
// Listen event cụ thể: "connected"
eventSource.addEventListener('connected', function(e) {
    const data = JSON.parse(e.data);
    console.log('Connected event:', data);
});

// Listen event cụ thể: "heartbeat"
eventSource.addEventListener('heartbeat', function(e) {
    const data = JSON.parse(e.data);
    console.log('Heartbeat event:', data);
});

// Listen event tùy chỉnh: "telemetry"
eventSource.addEventListener('telemetry', function(e) {
    const data = JSON.parse(e.data);
    console.log('Telemetry data:', data);
});
```

### 2. Sử dụng onmessage (fallback)

`onmessage` chỉ nhận các message **không có event type** hoặc có event type là `"message"`:

```javascript
eventSource.onmessage = function(e) {
    // e.type = "message" (mặc định)
    console.log('Generic message:', e.data);
};
```

## Event Types hiện có

| Event Type | Mô tả | Khi nào gửi |
|------------|-------|-------------|
| `connected` | Thông báo kết nối thành công | Khi client mới kết nối |
| `heartbeat` | Ping định kỳ | Mỗi 30 giây (mặc định) |
| `message` | Message mặc định | Khi không chỉ định event type |

## Ví dụ: Gửi event từ Server

### Trong Go code:

```go
// Gửi event "connected"
sseServer.SendMessage("connected", map[string]interface{}{
    "client_id": "client_123",
    "message": "Connected",
})

// Gửi event "telemetry"
sseServer.SendMessage("telemetry", map[string]interface{}{
    "cpu_usage": 45.2,
    "memory_usage": 60.1,
})

// Gửi event "alert"
sseServer.SendMessage("alert", map[string]interface{}{
    "level": "warning",
    "message": "High CPU usage detected",
})
```

### Client sẽ nhận:

```javascript
// Event "connected" → trigger addEventListener('connected', ...)
// Event "telemetry" → trigger addEventListener('telemetry', ...)
// Event "alert" → trigger addEventListener('alert', ...)
```

## Thêm Event Type mới

### 1. Server: Gửi event với type mới

```go
sseServer.SendMessage("custom_event", map[string]interface{}{
    "field1": "value1",
    "field2": "value2",
})
```

### 2. Client: Listen event mới

```javascript
eventSource.addEventListener('custom_event', function(e) {
    const data = JSON.parse(e.data);
    // Xử lý data
    console.log('Custom event:', data);
});
```

## Lưu ý

1. **Event type phân biệt chữ hoa/thường**: `"Connected"` ≠ `"connected"`
2. **Mỗi event type cần listener riêng**: Nếu không có listener, event sẽ bị bỏ qua
3. **onmessage chỉ nhận event không có type**: Nếu server gửi `event: heartbeat`, `onmessage` sẽ KHÔNG nhận
4. **Client không cần gửi request**: SSE là một chiều, chỉ server → client

## Debugging

Để debug, bạn có thể log tất cả events:

```javascript
// Log tất cả events (kể cả không có listener)
const originalAddEventListener = EventSource.prototype.addEventListener;
EventSource.prototype.addEventListener = function(type, listener) {
    console.log('Listening for event type:', type);
    return originalAddEventListener.call(this, type, function(e) {
        console.log('Received event:', type, e.data);
        return listener(e);
    });
};
```

