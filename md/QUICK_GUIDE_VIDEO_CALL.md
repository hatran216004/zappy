# Hướng dẫn sử dụng chức năng Video/Audio Call

## Cách sử dụng cơ bản

### 1. Bắt đầu cuộc gọi

Trong cửa sổ chat với bạn bè:

1. Click vào icon **điện thoại** 📞 (audio call) hoặc **video** 📹 (video call) ở header
2. Hệ thống sẽ tự động gọi đến người đó
3. Bạn sẽ thấy màn hình "Connecting..." trong khi chờ đối phương accept

### 2. Nhận cuộc gọi

Khi có người gọi đến:

1. Màn hình cuộc gọi sẽ tự động hiển thị
2. Bạn thấy avatar và tên người gọi
3. Click nút **Accept** (màu xanh) để nhận cuộc gọi
4. Click nút **Reject** (màu đỏ) để từ chối

### 3. Trong cuộc gọi

**Control buttons** (thanh điều khiển ở dưới):

- 🎤 **Mic button**: Bật/tắt microphone
  - Icon mic → đang bật
  - Icon mic gạch → đang tắt (muted)

- 📹 **Camera button** (chỉ có trong video call): Bật/tắt camera
  - Icon camera → đang bật
  - Icon camera gạch → đang tắt

- 📞 **Hang up button** (màu đỏ): Kết thúc cuộc gọi

**Video layout**:
- **Main view** (toàn màn hình): Video của người đối diện
- **Small tile** (góc dưới bên phải): Video của bạn

### 4. Kết thúc cuộc gọi

Có 3 cách kết thúc:

1. **Chủ động**: Click nút "Hang up" (màu đỏ)
2. **Timeout**: Nếu không có ai join sau 30 giây → tự động ngắt
3. **All leave**: Nếu tất cả mọi người đã leave → tự động ngắt sau 10 giây

## Các tính năng đặc biệt

### Speaking Indicator
- Khi ai đó đang nói → viền màu xanh xuất hiện quanh video của họ
- Icon mic có animation pulse khi đang nói

### Connection Quality
- Indicator ở góc video hiển thị chất lượng kết nối:
  - 🟢 Green: Excellent
  - 🟡 Yellow: Good
  - 🔴 Red: Poor

### Avatar Fallback
- Khi camera tắt → hiển thị avatar thay vì video
- Tên người tham gia hiển thị ở dưới

## Lưu ý quan trọng

### Quyền truy cập
Trình duyệt sẽ yêu cầu quyền truy cập:
- 🎤 **Microphone**: Cho phép để nói chuyện
- 📹 **Camera**: Cho phép để bật video (chỉ với video call)

**Cách cấp quyền**:
1. Browser sẽ hiện popup khi join call
2. Click "Allow" / "Cho phép"
3. Nếu đã block → vào Settings browser để bật lại

### Yêu cầu hệ thống
- ✅ Kết nối internet ổn định
- ✅ Browser hiện đại (Chrome, Firefox, Edge, Safari)
- ✅ Microphone và camera hoạt động tốt

### Troubleshooting

**Không nghe thấy giọng**:
- Check volume trên máy tính
- Check mic của người đối diện có bị mute không
- Thử refresh page

**Không thấy video**:
- Check camera permission trong browser
- Check người đối diện có bật camera không
- Thử tắt/bật camera lại

**Cuộc gọi tự động ngắt**:
- Check kết nối internet
- Network không ổn định có thể gây ngắt kết nối
- Thử gọi lại

**Không call được**:
- Check hai người có phải bạn bè không
- Check có conversation chung không
- Thử refresh page và thử lại

## Tips & Tricks

### Để có trải nghiệm tốt nhất:

1. **Dùng headphones** 🎧
   - Tránh echo/feedback
   - Chất lượng audio tốt hơn

2. **Lighting tốt** 💡 (cho video call)
   - Ánh sáng phía trước mặt
   - Tránh backlight (ngược sáng)

3. **Background gọn gàng** 🏠
   - Nền đằng sau gọn gàng, tối giản
   - Tránh phân tán sự chú ý

4. **Kết nối ổn định** 📶
   - Dùng WiFi thay vì mobile data
   - Đảm bảo tín hiệu mạnh

5. **Đóng tab không cần thiết** 💻
   - Giải phóng RAM và CPU
   - Cuộc gọi mượt mà hơn

## Keyboard Shortcuts

Hiện tại chưa có keyboard shortcuts, nhưng có thể thêm trong tương lai:
- `M`: Toggle mic
- `V`: Toggle video
- `H`: Hang up
- `Esc`: End call

## FAQs

**Q: Có giới hạn thời gian cuộc gọi không?**
A: Không có giới hạn thời gian. Gọi bao lâu cũng được.

**Q: Có thể gọi nhóm không?**
A: Hiện tại đang phát triển. Sẽ có trong phiên bản tiếp theo.

**Q: Có mất phí gọi không?**
A: Không. Hoàn toàn miễn phí (chỉ tốn data internet).

**Q: Có thể gọi cho người không online không?**
A: Có thể khởi tạo cuộc gọi, nhưng họ phải online mới nhận được.

**Q: Có record cuộc gọi được không?**
A: Chưa có tính năng này. Sẽ cân nhắc thêm sau.

**Q: Dữ liệu có được mã hóa không?**
A: Có. WebRTC tự động mã hóa audio/video streams.

## Support

Nếu gặp vấn đề, vui lòng:
1. Check console logs (F12 → Console)
2. Screenshot lỗi (nếu có)
3. Báo cáo cho team qua Issues

---

**Lưu ý**: Chức năng video call đang được phát triển liên tục. Một số tính năng có thể thay đổi trong các phiên bản tương lai.

