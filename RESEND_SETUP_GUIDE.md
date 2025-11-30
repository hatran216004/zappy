# Hướng dẫn Setup Resend API cho Email Notifications

## Bước 1: Đăng ký Resend

1. Truy cập https://resend.com
2. Đăng ký tài khoản (miễn phí 3000 emails/tháng)
3. Xác thực email

## Bước 2: Lấy API Key

1. Vào **API Keys** trong Resend Dashboard
2. Click **"Create API Key"**
3. Đặt tên (ví dụ: "Zappy Production")
4. Copy API key (bắt đầu bằng `re_`)
   - ⚠️ **Lưu ý**: Chỉ hiển thị 1 lần, hãy lưu lại ngay!

## Bước 3: Verify Domain (Optional nhưng khuyến nghị)

### Option A: Dùng domain mặc định (Chỉ để test)

- Email sẽ gửi từ: `onboarding@resend.dev`
- Không cần verify
- ⚠️ Chỉ dùng được cho testing, không dùng production

### Option B: Verify domain của bạn (Production)

1. Vào **Domains** trong Resend Dashboard
2. Click **"Add Domain"**
3. Nhập domain (ví dụ: `yourdomain.com`)
4. Thêm DNS records vào domain của bạn:
   ```
   Type: TXT
   Name: @
   Value: [giá trị từ Resend]
   
   Type: MX
   Name: @
   Value: feedback-smtp.resend.com
   Priority: 10
   ```
5. Chờ verify (thường vài phút đến vài giờ)
6. Sau khi verify, có thể dùng email như: `noreply@yourdomain.com`

## Bước 4: Cấu hình Supabase Secrets

1. Vào **Supabase Dashboard → Edge Functions → Secrets**
2. Thêm các secrets sau:

| Key | Value | Ví dụ |
|-----|-------|-------|
| `RESEND_API_KEY` | API key từ Resend | `re_1234567890abcdef` |
| `RESEND_FROM_EMAIL` | Email gửi đi | `onboarding@resend.dev` hoặc `noreply@yourdomain.com` |
| `FRONTEND_URL` | URL frontend | `https://yourdomain.com` |

**Lưu ý:**
- `RESEND_FROM_EMAIL` phải là email đã verify trên Resend
- Nếu dùng domain mặc định: `onboarding@resend.dev`
- Nếu đã verify domain: `noreply@yourdomain.com`

## Bước 5: Deploy Edge Function

### Nếu viết trên Dashboard:
1. Click **"Deploy function"** (góc dưới bên phải)
2. Đợi deploy xong

### Nếu viết local:
```bash
supabase functions deploy notify-new-login
```

## Bước 6: Test

### Test 1: Test Edge Function trực tiếp

1. Vào **Dashboard → Edge Functions → notify-new-login**
2. Click **"Invoke function"**
3. Nhập payload test:
```json
{
  "userId": "your-user-id-here",
  "sessionId": "test-session-id",
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
      "id": "session-1",
      "device_name": "macOS - Safari 17",
      "browser_name": "Safari",
      "os_name": "macOS",
      "device_type": "desktop",
      "created_at": "2024-01-15T10:00:00Z",
      "logout_token": "test-logout-token"
    }
  ]
}
```
4. Click **"Invoke"**
5. Kiểm tra email inbox

### Test 2: Test từ Frontend

1. Đăng nhập trên thiết bị A (ví dụ: Chrome trên Windows)
2. Đăng nhập trên thiết bị B (ví dụ: Safari trên macOS)
3. Kiểm tra email cảnh báo trong inbox của user
4. Click nút "Đăng xuất thiết bị này" trong email
5. Xác nhận thiết bị A đã bị logout

## Troubleshooting

### Email không được gửi

**Kiểm tra:**
1. ✅ `RESEND_API_KEY` đã đúng chưa?
2. ✅ `RESEND_FROM_EMAIL` đã verify chưa?
3. ✅ Function đã deploy chưa?
4. ✅ Xem logs trong **Dashboard → Edge Functions → Logs**

**Lỗi thường gặp:**
- `Invalid API key`: Kiểm tra lại API key
- `Domain not verified`: Verify domain hoặc dùng `onboarding@resend.dev`
- `Rate limit exceeded`: Đã vượt quá 3000 emails/tháng (free plan)

### Function không chạy

**Kiểm tra:**
1. ✅ Function đã deploy chưa?
2. ✅ Frontend có gọi đúng function name không?
3. ✅ Xem logs để biết lỗi cụ thể

### Email vào spam

**Giải pháp:**
1. Verify domain của bạn (không dùng `onboarding@resend.dev`)
2. Setup SPF, DKIM records (Resend sẽ hướng dẫn)
3. Warm up domain (gửi email dần dần, không spam)

## Tài liệu tham khảo

- Resend Documentation: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference/emails/send-email
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

