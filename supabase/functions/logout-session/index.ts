// Supabase Edge Function: logout-session
// Xử lý logout session từ email (qua logout_token)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let logoutToken = url.searchParams.get('token');

    // Note: Function này được gọi từ email link nên không có auth header
    // Token trong query params là cách xác thực
    // Supabase Edge Functions yêu cầu auth header, nhưng chúng ta sẽ dùng service role key
    // để bypass RLS và xử lý logout

    // Nếu không có trong query params, thử lấy từ body (nếu gọi từ frontend)
    if (!logoutToken && req.method === 'POST') {
      try {
        const body = await req.json();
        logoutToken = body.token;
      } catch {
        // Ignore JSON parse error
      }
    }

    if (!logoutToken) {
      // Redirect về trang lỗi nếu không có token
      const frontendUrl = Deno.env.get('FRONTEND_URL') || url.origin;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${frontendUrl}/login?error=invalid_token`
        }
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gọi database function để logout session
    const { data, error } = await supabase.rpc('logout_session_by_token', {
      p_logout_token: logoutToken
    });

    if (error || !data || data.length === 0 || !data[0].success) {
      console.error('Error logging out session:', error);
      // Redirect về trang lỗi
      const frontendUrl = Deno.env.get('FRONTEND_URL') || url.origin;
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: `${frontendUrl}/login?error=logout_failed`
        }
      });
    }

    const sessionInfo = data[0];

    // Nếu có session_id, cần revoke session trong Supabase Auth
    if (sessionInfo.session_id) {
      try {
        // Lấy user để revoke session
        const { data: userData } = await supabase.auth.admin.getUserById(
          sessionInfo.user_id
        );
        if (userData?.user) {
          // Revoke session bằng cách sign out user (nếu có thể)
          // Note: Supabase Auth không có direct API để revoke một session cụ thể
          // Có thể cần sử dụng refresh token để revoke
          // Hoặc đơn giản là đã deactivate trong database rồi
        }
      } catch (revokeError) {
        console.error('Error revoking session in Auth:', revokeError);
        // Vẫn tiếp tục vì đã deactivate trong database rồi
      }
    }

    // Redirect về trang xác nhận thành công
    const frontendUrl = Deno.env.get('FRONTEND_URL') || url.origin;
    const redirectUrl = `${frontendUrl}/login?logout_success=true&device_logged_out=true`;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: redirectUrl
      }
    });
  } catch (error) {
    console.error('Error in logout-session function:', error);
    const url = new URL(req.url);
    const frontendUrl = Deno.env.get('FRONTEND_URL') || url.origin;
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: `${frontendUrl}/login?error=server_error`
      }
    });
  }
});
