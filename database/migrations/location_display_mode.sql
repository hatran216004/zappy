-- Add location display mode to messages table
-- 'interactive' = Show map directly in app (Zalo/Messenger style)
-- 'static' = Current implementation (static preview + Google Maps link)

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS location_display_mode TEXT DEFAULT 'interactive'
CHECK (location_display_mode IN ('interactive', 'static'));

COMMENT ON COLUMN messages.location_display_mode IS 'How to display location: interactive (embedded map) or static (link to Google Maps)';

