import { supabase } from '@/lib/supabase';
import { DeviceInfo, getDeviceInfo } from '@/utils/deviceInfo';

export interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  device_name: string | null;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown' | null;
  ip_address: string | null;
  user_agent: string | null;
  last_active_at: string;
  created_at: string;
  is_active: boolean;
  logout_token: string;
  expires_at: string | null;
}

/**
 * Lưu session mới khi user đăng nhập
 */
export const createUserSession = async (
  userId: string,
  sessionId: string,
  deviceInfo?: DeviceInfo
): Promise<UserSession> => {
  const info = deviceInfo || getDeviceInfo();

  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      device_name: info.deviceName,
      browser_name: info.browserName,
      browser_version: info.browserVersion,
      os_name: info.osName,
      os_version: info.osVersion,
      device_type: info.deviceType,
      user_agent: info.userAgent,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user session: ${error.message}`);
  }

  return data;
};

/**
 * Lấy tất cả sessions active của user
 */
export const getActiveUserSessions = async (userId: string): Promise<UserSession[]> => {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user sessions: ${error.message}`);
  }

  return data || [];
};

/**
 * Lấy session theo session_id
 */
export const getSessionBySessionId = async (sessionId: string): Promise<UserSession | null> => {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get session: ${error.message}`);
  }

  return data;
};

/**
 * Deactivate session (logout)
 */
export const deactivateSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .update({ is_active: false, last_active_at: new Date().toISOString() })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to deactivate session: ${error.message}`);
  }
};

/**
 * Deactivate session bằng logout_token (từ email)
 */
export const deactivateSessionByToken = async (logoutToken: string): Promise<{ success: boolean; sessionId?: string }> => {
  // Lấy session theo logout_token
  const { data: session, error: fetchError } = await supabase
    .from('user_sessions')
    .select('session_id, user_id')
    .eq('logout_token', logoutToken)
    .eq('is_active', true)
    .single();

  if (fetchError || !session) {
    return { success: false };
  }

  // Deactivate session
  const { error: updateError } = await supabase
    .from('user_sessions')
    .update({ is_active: false, last_active_at: new Date().toISOString() })
    .eq('logout_token', logoutToken);

  if (updateError) {
    throw new Error(`Failed to deactivate session: ${updateError.message}`);
  }

  // Cần logout khỏi Supabase Auth nữa - sẽ gọi từ Edge Function hoặc backend
  return { success: true, sessionId: session.session_id };
};

/**
 * Cập nhật last_active_at cho session
 */
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('is_active', true);

  if (error) {
    // Không throw error vì đây là operation không critical
    console.warn('Failed to update session activity:', error);
  }
};

/**
 * Xóa session (hard delete)
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
};

/**
 * Lấy sessions cũ (active) của user (trừ session hiện tại)
 */
export const getOtherActiveSessions = async (
  userId: string,
  currentSessionId: string
): Promise<UserSession[]> => {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('session_id', currentSessionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get other active sessions: ${error.message}`);
  }

  return data || [];
};

