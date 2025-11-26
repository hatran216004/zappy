# Supabase Storage Setup Guide

## Manual Setup (Recommended)

### 1. Create Bucket via Dashboard
1. Go to Supabase Dashboard → Storage
2. Click "Create bucket"
3. Bucket name: `playlist-audio`
4. **Check "Public bucket"** ✅
5. Click "Create bucket"

### 2. Configure Bucket Settings
1. Click on `playlist-audio` bucket
2. Go to "Configuration" tab
3. Set:
   - **File size limit**: 50MB (52428800 bytes)
   - **Allowed MIME types**: 
     - `audio/mpeg`
     - `audio/mp3` 
     - `audio/wav`
     - `audio/ogg`
     - `audio/m4a`
     - `audio/aac`

### 3. Test Bucket Access
1. Upload a test audio file
2. Get public URL: `https://[project].supabase.co/storage/v1/object/public/playlist-audio/[filename]`
3. Test URL in browser - should download/play audio

### 4. Fix CORS Issues
**Method A: Supabase Dashboard**
1. Go to Settings → API
2. Add to "CORS origins":
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)

**Method B: SQL Fix**
Run `database/fix_storage_cors.sql` in SQL Editor

**Method C: Manual Bucket Settings**
1. Go to Storage → playlist-audio bucket
2. Settings → "Allow public access" ✅
3. CORS settings → Add origins

### 5. Test CORS Fix
After fixing CORS, the headers should show:
```json
{
  "access-control-allow-origin": "*"  // ✅ Should not be null
}
```

## SQL Verification
Run `database/check_storage_bucket.sql` to verify setup.

## Expected Results
- Bucket should be public
- Files should be accessible via public URLs
- Audio should load in browser
