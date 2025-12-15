import { Database } from '@/types/supabase.type';
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Helper function to get avatar URL from avatars bucket
export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => {
  if (!avatarPath) return null;

  // If the avatar is already a full URL (e.g., Google OAuth avatar), return it as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Avatar path is in format: userId.jpg?ts=... or groups\groupId.jpg?ts=...
  // Construct the full URL for Supabase storage
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`;
};

// Helper function to get group photo URL from avatars bucket
export const getGroupPhotoUrl = (photoPath: string | null | undefined): string | null => {
  if (!photoPath) return null;

  // Group photo path is in format: groups\groupId.jpg?ts=...
  // Convert backslash to forward slash for URL
  const normalizedPath = photoPath.replace(/\\/g, '/');
  return `${supabaseUrl}/storage/v1/object/public/avatars/${normalizedPath}`;
};