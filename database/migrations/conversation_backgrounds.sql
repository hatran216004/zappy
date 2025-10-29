-- Migration: Add background customization to conversations
-- Allows users to customize chat background with colors, gradients, or images

-- Add background columns to conversations table
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS background_type VARCHAR(20) DEFAULT 'color',
  ADD COLUMN IF NOT EXISTS background_value TEXT DEFAULT '#FFFFFF';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_background ON conversations(background_type);

-- Add comments for documentation
COMMENT ON COLUMN conversations.background_type IS 
  'Type of background: color, gradient, or image';
COMMENT ON COLUMN conversations.background_value IS 
  'Background value: hex color, gradient CSS, or image URL';

-- Update existing conversations to have default white background
UPDATE conversations 
SET background_type = 'color', 
    background_value = '#FFFFFF' 
WHERE background_type IS NULL;

