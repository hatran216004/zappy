-- Create shared playlist tables for "Playlist Cùng Nghe" feature

-- Table to store playlist sessions for each conversation
CREATE TABLE IF NOT EXISTS shared_playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    current_track_id UUID NULL,
    current_position_ms INTEGER DEFAULT 0,
    is_playing BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id)
);

-- Table to store individual tracks in playlists
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES shared_playlists(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    artist VARCHAR(300),
    duration_ms INTEGER,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('youtube', 'local')),
    source_url TEXT,
    source_id VARCHAR(200), -- YouTube video ID or local file path
    thumbnail_url TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    position INTEGER NOT NULL DEFAULT 0
);

-- Table to track playlist sync events for realtime coordination
CREATE TABLE IF NOT EXISTS playlist_sync_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES shared_playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('play', 'pause', 'seek', 'next', 'prev', 'add_track', 'remove_track', 'reorder')),
    event_data JSONB,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_playlists_conversation_id ON shared_playlists(conversation_id);
CREATE INDEX IF NOT EXISTS idx_shared_playlists_active ON shared_playlists(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_sync_events_playlist_id ON playlist_sync_events(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_sync_events_timestamp ON playlist_sync_events(server_timestamp DESC);

-- RLS Policies
ALTER TABLE shared_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_sync_events ENABLE ROW LEVEL SECURITY;

-- Shared playlists policies - only conversation participants can access
CREATE POLICY "Users can view playlists for their conversations" ON shared_playlists
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

CREATE POLICY "Users can create playlists for their conversations" ON shared_playlists
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update playlists for their conversations" ON shared_playlists
    FOR UPDATE USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Playlist tracks policies
CREATE POLICY "Users can view tracks for accessible playlists" ON playlist_tracks
    FOR SELECT USING (
        playlist_id IN (
            SELECT sp.id 
            FROM shared_playlists sp
            JOIN conversation_participants cp ON sp.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL
        )
    );

CREATE POLICY "Users can add tracks to accessible playlists" ON playlist_tracks
    FOR INSERT WITH CHECK (
        playlist_id IN (
            SELECT sp.id 
            FROM shared_playlists sp
            JOIN conversation_participants cp ON sp.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL
        )
        AND added_by = auth.uid()
    );

CREATE POLICY "Users can update tracks in accessible playlists" ON playlist_tracks
    FOR UPDATE USING (
        playlist_id IN (
            SELECT sp.id 
            FROM shared_playlists sp
            JOIN conversation_participants cp ON sp.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL
        )
    );

CREATE POLICY "Users can delete their own tracks" ON playlist_tracks
    FOR DELETE USING (
        added_by = auth.uid()
        OR playlist_id IN (
            SELECT sp.id 
            FROM shared_playlists sp
            JOIN conversation_participants cp ON sp.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL AND cp.role = 'admin'
        )
    );

-- Sync events policies
CREATE POLICY "Users can view sync events for accessible playlists" ON playlist_sync_events
    FOR SELECT USING (
        playlist_id IN (
            SELECT sp.id 
            FROM shared_playlists sp
            JOIN conversation_participants cp ON sp.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL
        )
    );

CREATE POLICY "Users can create sync events for accessible playlists" ON playlist_sync_events
    FOR INSERT WITH CHECK (
        playlist_id IN (
            SELECT sp.id 
            FROM shared_playlists sp
            JOIN conversation_participants cp ON sp.conversation_id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL
        )
        AND user_id = auth.uid()
    );

-- Function to update playlist timestamp on track changes
CREATE OR REPLACE FUNCTION update_playlist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shared_playlists 
    SET updated_at = NOW(), server_timestamp = NOW()
    WHERE id = COALESCE(NEW.playlist_id, OLD.playlist_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update playlist timestamp
CREATE TRIGGER update_playlist_on_track_change
    AFTER INSERT OR UPDATE OR DELETE ON playlist_tracks
    FOR EACH ROW EXECUTE FUNCTION update_playlist_timestamp();

-- Function to auto-update server timestamp on playlist changes
CREATE OR REPLACE FUNCTION update_server_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.server_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_playlist_server_timestamp
    BEFORE UPDATE ON shared_playlists
    FOR EACH ROW EXECUTE FUNCTION update_server_timestamp();
