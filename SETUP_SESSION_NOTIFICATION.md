# Hướng dẫn Setup Tính năng Cảnh báo Đăng nhập

## Bước 1: Chạy Database Migrations

Vào **Supabase Dashboard → SQL Editor** và chạy 2 file migration:

### 1.1. Tạo bảng user_sessions
Chạy file: `database/migrations/create_user_sessions.sql`

### 1.2. Tạo database functions
Chạy file: `database/migrations/create_session_management_functions.sql`

## Bước 2: Deploy Edge Functions

### 2.1. Function: notify-new-login
- Nếu viết trên Dashboard: Click **"Deploy function"**
- Nếu viết local: 
  ```bash
  supabase functions deploy notify-new-login
  ```

### 2.2. Function: logout-session
- Tương tự như trên

## Bước 3: Cấu hình Environment Variables (Secrets)

Vào **Dashboard → Edge Functions → Secrets** và thêm:

| Key | Value | Mô tả |
|-----|-------|-------|
| `FRONTEND_URL` | `https://yourdomain.com` | URL của frontend app |
| `RESEND_API_KEY` | `re_xxxxx` | API key từ Resend (nếu dùng) |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` | Email gửi đi (phải verify domain) |

**Lưu ý:** 
- `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` đã tự động có sẵn
- Nếu không dùng Resend, có thể dùng Supabase SMTP (Settings → Auth → SMTP Settings)

## Bước 4: Setup Email Service

### Option A: Sử dụng Resend (Khuyến nghị)

1. Đăng ký tại https://resend.com
2. Verify domain hoặc dùng domain mặc định của Resend
3. Lấy API key từ dashboard
4. Thêm vào Secrets như bước 3

### Option B: Sử dụng Supabase SMTP

1. Vào **Dashboard → Settings → Auth → SMTP Settings**
2. Cấu hình SMTP server
3. Code sẽ tự động dùng SMTP này (cần update code)

## Bước 5: Test

### 5.1. Test Edge Function trực tiếp

Vào **Dashboard → Edge Functions → notify-new-login → Invoke function**

Payload test:
```json
{
  "userId": "user-uuid-here",
  "sessionId": "session-token-here",
  "frontendUrl": "http://localhost:5173",
  "deviceInfo": {
    "deviceName": "Windows 10 - Chrome 120",
    "browserName": "Chrome",
    "browserVersion": "120",
    "osName": "Windows",
    "osVersion": "10",
    "deviceType": "desktop"
  },
  "otherSessions": [
    {
      "id": "session-id",
      "device_name": "macOS - Safari 17",
      "browser_name": "Safari",
      "os_name": "macOS",
      "device_type": "desktop",
      "created_at": "2024-01-15T10:00:00Z",
      "logout_token": "uuid-token-here"
    }
  ]
}
```

### 5.2. Test từ Frontend

1. Đăng nhập trên thiết bị A (ví dụ: Chrome trên Windows)
2. Đăng nhập trên thiết bị B (ví dụ: Safari trên macOS)
3. Kiểm tra email cảnh báo
4. Click nút "Đăng xuất thiết bị này" trong email
5. Xác nhận thiết bị A đã bị logout

## Bước 6: Kiểm tra Logs

Vào **Dashboard → Edge Functions → Logs** để xem:
- Function có chạy không
- Có lỗi gì không
- Email có được gửi không

## Troubleshooting

### Email không được gửi
- Kiểm tra `RESEND_API_KEY` đã đúng chưa
- Kiểm tra `RESEND_FROM_EMAIL` đã verify domain chưa
- Xem logs trong Dashboard

### Function không chạy
- Kiểm tra function đã deploy chưa
- Kiểm tra frontend có gọi đúng function name không
- Xem logs để biết lỗi cụ thể

### Database errors
- Kiểm tra migrations đã chạy chưa
- Kiểm tra RLS policies
- Kiểm tra user có quyền truy cập không

