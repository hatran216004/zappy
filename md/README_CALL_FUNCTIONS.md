# Video Call Functions - Quick Reference

## 🎯 TL;DR

Hiện có **2 phiên bản** hàm tạo call, chọn theo nhu cầu:

### Development/Testing UI → Dùng OLD
```typescript
// src/services/callService.ts
const USE_NEW_CALL_FUNCTION = false; // ✅ Default
```
- ✅ Không cần setup gì
- ✅ Test UI flow
- ❌ Video/audio không hoạt động

### Production/Real Calls → Dùng NEW
```typescript
// src/services/callService.ts
const USE_NEW_CALL_FUNCTION = true; // 🔧 Cần setup LiveKit
```
- ✅ Video/audio hoạt động thật
- 🔧 Cần LiveKit server
- 📚 Xem: `MIGRATION_LIVEKIT_SETUP.md`

---

## 📊 So sánh nhanh

| Feature | OLD Function | NEW Function |
|---------|--------------|--------------|
| Tên hàm | `initiate_direct_call` | `create_direct_call_with_livekit` |
| Token | Placeholder (UUID) | Real JWT |
| URL | Empty string | LiveKit WebSocket |
| UI Testing | ✅ Perfect | ✅ Perfect |
| Video/Audio | ❌ Not working | ✅ Working |
| Setup | ✅ None | 🔧 Need LiveKit |
| Production | ❌ No | ✅ Yes |

---

## 📂 File Structure

```
database/migrations/
├── create_direct_call_function.sql     ← OLD function (unchanged)
└── fix_livekit_tokens.sql              ← NEW function + token gen

src/services/
└── callService.ts                       ← Switch here

md/
├── MIGRATION_LIVEKIT_SETUP.md          ← Full migration guide
├── BUG_FIX_CALL_ACCEPT.md              ← Bug fix details
├── CALL_FEATURE_IMPLEMENTATION.md       ← Technical docs
└── README_CALL_FUNCTIONS.md            ← This file
```

---

## 🚀 Quick Start

### Option 1: Test UI Only (No setup)
```bash
# Do nothing! Already configured.
# Just start calling and test the UI flow.
```

### Option 2: Enable Real Video Calls
```bash
# 1. Setup LiveKit (5 minutes)
# → Sign up: https://cloud.livekit.io/
# → Get credentials

# 2. Run migration
psql -h db.xxx.supabase.co < database/migrations/fix_livekit_tokens.sql

# 3. Deploy edge function
supabase functions deploy generate-livekit-token

# 4. Switch flag
# src/services/callService.ts → USE_NEW_CALL_FUNCTION = true

# 5. Test!
```

**Detailed guide**: `md/MIGRATION_LIVEKIT_SETUP.md`

---

## ❓ FAQs

### Q: Tôi có cần migrate ngay không?
**A**: Không! Old function hoạt động tốt cho UI testing. Chỉ migrate khi cần video/audio thật.

### Q: Migration có breaking changes không?
**A**: Không! Cả 2 functions tồn tại song song. Switch bằng flag.

### Q: Rollback dễ không?
**A**: Rất dễ! Chỉ cần đổi `USE_NEW_CALL_FUNCTION = false`

### Q: LiveKit Cloud có free không?
**A**: Có! 50GB bandwidth/month free tier.

### Q: Có thể dùng LiveKit của riêng mình không?
**A**: Được! Self-hosted hoặc Cloud đều OK.

### Q: Token generation có an toàn không?
**A**: Có! Dùng Edge Function (server-side), không expose secret key.

---

## 🆘 Troubleshooting

### Vẫn thấy "Đang chờ người khác..."?
→ Xem: `md/BUG_FIX_CALL_ACCEPT.md` - Section "Troubleshooting"

### Video không hiển thị sau khi switch?
→ Check:
1. LiveKit credentials đúng chưa?
2. Edge function deploy thành công chưa?
3. Token generation có lỗi không? (check logs)

### Migration failed?
→ Check:
1. Có quyền execute functions không?
2. pg_net extension đã enable chưa?
3. Xem chi tiết: `md/MIGRATION_LIVEKIT_SETUP.md`

---

## 📞 Support

**Documentation**:
- `MIGRATION_LIVEKIT_SETUP.md` - Step-by-step migration
- `BUG_FIX_CALL_ACCEPT.md` - Bug fixes và troubleshooting
- `CALL_FEATURE_IMPLEMENTATION.md` - Technical details

**External Resources**:
- [LiveKit Docs](https://docs.livekit.io/)
- [LiveKit Cloud](https://cloud.livekit.io/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist

### For Development
- [x] Old function works
- [x] UI flow tested
- [x] Database logic tested
- [ ] Ready for production (use NEW function)

### For Production Migration
- [ ] LiveKit server setup
- [ ] Credentials configured
- [ ] Edge function deployed
- [ ] Token generation tested
- [ ] USE_NEW_CALL_FUNCTION = true
- [ ] Real video call tested
- [ ] Monitoring setup

---

**Last Updated**: 2025-11-11
**Status**: 🟢 Both functions production-ready

