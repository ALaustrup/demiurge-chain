-- Music tracks table
CREATE TABLE IF NOT EXISTS music_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    file_url TEXT NOT NULL,
    duration_ms INT,
    genre VARCHAR(50),
    plays INT DEFAULT 0,
    likes INT DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_global BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    cover_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist tracks junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id)
);

-- User track likes
CREATE TABLE IF NOT EXISTS track_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, track_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_music_tracks_uploader ON music_tracks(uploader_id);
CREATE INDEX IF NOT EXISTS idx_music_tracks_genre ON music_tracks(genre);
CREATE INDEX IF NOT EXISTS idx_music_tracks_public ON music_tracks(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_playlists_owner ON playlists(owner_id);
CREATE INDEX IF NOT EXISTS idx_playlists_global ON playlists(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);

-- Create default global playlist
INSERT INTO playlists (id, name, description, is_global, is_public)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demiurge Radio',
    'The official community playlist - loops forever',
    true,
    true
) ON CONFLICT (id) DO NOTHING;
