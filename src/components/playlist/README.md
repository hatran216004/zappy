# Playlist Cùng Nghe - Shared Music Playlist Feature

Tính năng "Playlist Cùng Nghe" cho phép người dùng trải nghiệm âm nhạc theo nhóm ngay trong cuộc trò chuyện. Mỗi phòng chat có thể bật một chế độ nghe chung, nơi mọi bài hát được phát sẽ được đồng bộ theo thời gian thực giữa tất cả thành viên.

## Tính năng chính

### 🎵 Đồng bộ thời gian thực
- Khi một người dùng thao tác (play, pause, skip, seek), tất cả thành viên khác sẽ tự động cập nhật
- Sử dụng Supabase Realtime để truyền sự kiện với độ trễ cực thấp
- Đồng bộ bằng timestamp server để đảm bảo độ chính xác

### 🎼 Hỗ trợ nhiều nguồn nhạc
- **YouTube**: Phát nhạc từ YouTube sử dụng IFrame Player API (KHÔNG cần API key)
- **Local Audio**: Upload và phát file âm thanh cục bộ (MP3, WAV, FLAC, etc.)

### 👥 Quản lý playlist nhóm
- Mọi thành viên đều có thể thêm bài hát
- Kéo thả để sắp xếp lại thứ tự
- Xem thông tin người thêm bài hát
- Xóa bài hát (chỉ người thêm hoặc admin)

### 🎛️ Điều khiển player đầy đủ
- Play/Pause đồng bộ
- Seek to position
- Next/Previous track
- Volume control (cá nhân)
- Hiển thị thời gian phát và tổng thời lượng

## Cấu trúc Components

### SharedPlaylistPanel
Component chính hiển thị toàn bộ playlist interface:
- Track list với drag & drop
- Player controls
- Add track modal
- Sync indicator

### PlaylistTrackList
Hiển thị danh sách bài hát với:
- Thumbnail và thông tin bài hát
- Trạng thái đang phát
- Menu actions (xóa, sắp xếp)
- Drag & drop reordering

### PlaylistControls
Player controls với:
- Play/pause button
- Progress bar với seek
- Volume slider
- Next/previous buttons
- Track information display

### AddTrackModal
Modal để thêm bài hát:
- Tab YouTube: tìm kiếm hoặc paste link
- Tab Local: upload file âm thanh
- Preview và add to playlist

### SyncIndicator
Hiển thị trạng thái đồng bộ:
- Connected/Synced status
- Last sync time
- Visual indicators

### PlaylistButton
Button trong ChatHeader để mở playlist:
- Active state indicator
- Track count badge
- Playing animation

## Hooks

### useSharedPlaylist
Hook chính quản lý playlist state:
- Initialize playlist for conversation
- Player controls (play, pause, seek, next, prev)
- Track management (add, remove, reorder)
- Realtime sync status

### useAudioPlayer
Hook quản lý audio playback:
- Load và play tracks
- Sync to server position
- Handle audio events
- Volume control

## Services

### playlistService
Service layer cho playlist operations:
- CRUD operations cho playlists và tracks
- Sync event management
- Realtime subscriptions
- Player control với sync

### youtubeService
YouTube IFrame Player integration:
- Load YouTube IFrame Player API (no API key needed)
- Create YouTube Player instances
- Get video info using oEmbed API
- Extract video ID từ URL
- Popular videos fallback for search

## Database Schema

### shared_playlists
```sql
- id: UUID (PK)
- conversation_id: UUID (FK)
- created_by: UUID (FK)
- is_active: boolean
- current_track_id: UUID (nullable)
- current_position_ms: integer
- is_playing: boolean
- server_timestamp: timestamp
```

### playlist_tracks
```sql
- id: UUID (PK)
- playlist_id: UUID (FK)
- added_by: UUID (FK)
- title: varchar(500)
- artist: varchar(300)
- duration_ms: integer
- source_type: enum('youtube', 'local')
- source_url: text
- source_id: varchar(200)
- thumbnail_url: text
- position: integer
```

### playlist_sync_events
```sql
- id: UUID (PK)
- playlist_id: UUID (FK)
- user_id: UUID (FK)
- event_type: enum('play', 'pause', 'seek', 'next', 'prev', 'add_track', 'remove_track', 'reorder')
- event_data: jsonb
- server_timestamp: timestamp
```

## Cài đặt

### 1. Database Migration
Chạy migration để tạo tables:
```sql
-- Chạy file database/migrations/create_shared_playlist.sql
```

### 2. Environment Variables
Không cần environment variables! YouTube IFrame Player hoạt động mà không cần API key.

### 3. Permissions
Đảm bảo RLS policies đã được setup cho:
- shared_playlists
- playlist_tracks  
- playlist_sync_events

## Sử dụng

### Trong ChatWindow
1. Click vào button "Playlist Cùng Nghe" trong header
2. Playlist panel sẽ mở ra
3. Thêm bài hát từ YouTube hoặc upload local
4. Điều khiển phát nhạc đồng bộ với nhóm

### Thêm bài hát
- **YouTube**: Paste link YouTube hoặc chọn từ danh sách phổ biến
- **Local**: Kéo thả hoặc chọn file âm thanh

### Điều khiển
- Click play/pause để điều khiển cho toàn nhóm
- Seek trên progress bar để nhảy đến vị trí
- Next/Previous để chuyển bài
- Volume chỉ ảnh hưởng cá nhân

## Technical Notes

### Realtime Sync
- Sử dụng Supabase Realtime channels
- Server timestamp để đồng bộ chính xác
- Compensation cho network latency
- Debounce để tránh spam events

### Audio Playback
- HTML5 Audio API
- Support CORS cho YouTube (cần proxy)
- Object URLs cho local files
- Error handling và fallbacks

### Performance
- Lazy loading components
- Efficient re-renders với React.memo
- Cleanup subscriptions properly
- Optimize database queries

### Security
- RLS policies cho data access
- Validate file types cho uploads
- Sanitize YouTube URLs
- Rate limiting cho API calls

## Troubleshooting

### YouTube không phát được
- YouTube IFrame Player tự động xử lý CORS
- Không cần proxy server
- Kiểm tra video có bị chặn embed không

### Sync không chính xác
- Kiểm tra network latency
- Server timestamp có đúng timezone
- Realtime connection stable

### File upload lỗi
- Kiểm tra file size limits
- Supported audio formats
- Storage permissions

## Future Enhancements

- [ ] Spotify integration
- [ ] Apple Music support
- [ ] Playlist import/export
- [ ] Queue management
- [ ] Lyrics display
- [ ] Audio effects/equalizer
- [ ] Voice chat integration
- [ ] Mobile app support
