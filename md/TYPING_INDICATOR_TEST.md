# TYPING INDICATOR - TEST CASES & DEBUG GUIDE

## 🎯 Test Cases

### Test 1: Gõ ký tự đầu tiên
**Steps:**
1. Input rỗng ban đầu
2. Gõ "H"

**Expected Console Logs:**
```
📝 Input changed: { length: 1, trimmedLength: 1, isCurrentlyTyping: false }
✍️ Case 3: Has content
▶️ Turning ON typing (first time)
🔍 sendTypingIndicator called: isTyping=true, lastState=undefined
✅ Sent typing: START ▶️
```

**Expected Behavior:**
- ✅ Typing indicator xuất hiện NGAY LẬP TỨC
- ✅ Chỉ gửi 1 event `typing=true`

---

### Test 2: Tiếp tục gõ
**Steps:**
1. Gõ "H" (từ Test 1)
2. Gõ "e"
3. Gõ "l"
4. Gõ "l"
5. Gõ "o"

**Expected Console Logs (mỗi lần gõ):**
```
📝 Input changed: { length: 2, trimmedLength: 2, isCurrentlyTyping: true }
✍️ Case 3: Has content
⏩ Already typing, just reset timeout
🔍 sendTypingIndicator called: isTyping=true, lastState=true
⏭️ Skip: State unchanged (true)
```

**Expected Behavior:**
- ✅ Typing indicator VẪN HIỂN THỊ (không thay đổi)
- ✅ KHÔNG gửi thêm event nào
- ✅ Timeout được reset về 5s mỗi lần gõ

---

### Test 3: Xóa hết text
**Steps:**
1. Gõ "Hello" (từ Test 2)
2. Nhấn Backspace 5 lần để xóa hết

**Expected Console Logs (khi xóa ký tự cuối):**
```
📝 Input changed: { length: 0, trimmedLength: 0, isCurrentlyTyping: true }
📭 Case 1: Empty input
🛑 Turning OFF typing (empty)
🔍 sendTypingIndicator called: isTyping=false, lastState=true
✅ Sent typing: STOP ⏹️
```

**Expected Behavior:**
- ✅ Typing indicator biến mất NGAY LẬP TỨC
- ✅ Gửi event `typing=false`
- ✅ Timeout bị clear

---

### Test 4: Chỉ gõ khoảng trắng
**Steps:**
1. Input rỗng ban đầu
2. Gõ Space 3 lần

**Expected Console Logs:**
```
📝 Input changed: { length: 3, trimmedLength: 0, isCurrentlyTyping: false }
⬜ Case 2: Only whitespace
(không gọi sendTyping vì isTypingRef.current = false)
```

**Expected Behavior:**
- ✅ Typing indicator KHÔNG xuất hiện
- ✅ KHÔNG gửi event nào

---

### Test 5: Timeout 5s
**Steps:**
1. Gõ "Hello"
2. Đợi 5 giây (không gõ gì thêm)

**Expected Console Logs (sau 5s):**
```
⏰ 5s timeout reached
⏹️ Turning OFF typing (timeout)
🔍 sendTypingIndicator called: isTyping=false, lastState=true
✅ Sent typing: STOP ⏹️
```

**Expected Behavior:**
- ✅ Typing indicator biến mất SAU 5S
- ✅ Gửi event `typing=false`

---

### Test 6: Gửi tin nhắn
**Steps:**
1. Gõ "Hello"
2. Nhấn Enter hoặc click Send

**Expected Console Logs:**
```
📤 Sending message...
⏹️ Turning OFF typing (before send)
🔍 sendTypingIndicator called: isTyping=false, lastState=true
✅ Sent typing: STOP ⏹️
✅ Message sent successfully
```

**Expected Behavior:**
- ✅ Typing indicator biến mất TRƯỚC KHI tin nhắn được gửi
- ✅ Gửi event `typing=false`
- ✅ Input được clear

---

### Test 7: Chuyển conversation
**Steps:**
1. Gõ "Hello" trong conversation A (đang typing)
2. Chuyển sang conversation B

**Expected Console Logs:**
```
🔄 Conversation changed, resetting typing state
🧹 Cleanup: Clearing typing state
🛑 Turning OFF typing (cleanup)
🔍 sendTypingIndicator called: isTyping=false, lastState=true
✅ Sent typing: STOP ⏹️
```

**Expected Behavior:**
- ✅ Typing indicator trong conversation A biến mất
- ✅ Gửi event `typing=false` cho conversation A
- ✅ State được reset

---

## 🐛 Common Issues & Solutions

### Issue 1: Typing chỉ hiện khi gõ ký tự chẵn
**Root Cause:** Throttle logic trong `sendTypingIndicator` bị sai
**Solution:** Check `lastState !== undefined && lastState === isTyping` thay vì chỉ `lastState === isTyping`

### Issue 2: Xóa hết vẫn hiện typing
**Root Cause:** Logic check empty không chạy trước
**Solution:** Đặt check `newValue.length === 0` ở đầu tiên

### Issue 3: Không tắt sau 5s
**Root Cause:** Timeout bị clear nhưng không set lại
**Solution:** Luôn set timeout mới sau mỗi lần gõ

### Issue 4: Typing bị giật
**Root Cause:** Gửi quá nhiều events giống nhau
**Solution:** Chỉ gửi khi state thay đổi (true -> false hoặc false -> true)

---

## 📊 State Machine

```
[IDLE] ---(gõ ký tự đầu)---> [TYPING]
                              sendTyping(true)

[TYPING] ---(gõ thêm)---> [TYPING]
                          (reset timeout)

[TYPING] ---(xóa hết)---> [IDLE]
                          sendTyping(false)

[TYPING] ---(5s timeout)---> [IDLE]
                              sendTyping(false)

[TYPING] ---(gửi message)---> [IDLE]
                               sendTyping(false)

[TYPING] ---(chuyển conversation)---> [IDLE]
                                       sendTyping(false)
```

---

## 🔍 Debug Checklist

Khi typing indicator không hoạt động đúng, check:

1. ✅ Console logs có xuất hiện đúng thứ tự?
2. ✅ `isTypingRef.current` có đúng state?
3. ✅ `sendTyping()` có được gọi với đúng giá trị?
4. ✅ `sendTypingIndicator()` có gửi event thành công?
5. ✅ Channel có được tạo và subscribe đúng?
6. ✅ Receiver có nhận được event?
7. ✅ `useTypingIndicator` hook có update state đúng?
8. ✅ TypingIndicator component có render?

---

## ✅ Success Criteria

- [ ] Gõ ký tự bất kỳ → typing hiện ngay
- [ ] Gõ tiếp → typing vẫn hiện, không spam events
- [ ] Xóa hết → typing tắt ngay
- [ ] Chỉ gõ khoảng trắng → không hiện typing
- [ ] Đợi 5s → typing tự tắt
- [ ] Gửi message → typing tắt ngay
- [ ] Chuyển conversation → typing tắt
- [ ] Animation mượt mà, không giật

