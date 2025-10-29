-- Migration: Add location sharing support to messages table
-- Description: Add columns for storing location data (latitude, longitude, address)

-- Add location columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create index for location queries (if needed for future features like nearby messages)
CREATE INDEX IF NOT EXISTS idx_messages_location 
ON messages (location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN messages.location_latitude IS 'Latitude of shared location (-90 to 90)';
COMMENT ON COLUMN messages.location_longitude IS 'Longitude of shared location (-180 to 180)';
COMMENT ON COLUMN messages.location_address IS 'Human-readable address or place name for the location';

-- Example usage:
-- INSERT INTO messages (conversation_id, sender_id, content_type, location_latitude, location_longitude, location_address)
-- VALUES ('conv-id', 'user-id', 'location', 21.028511, 105.804817, 'Hà Nội, Việt Nam');

