// Supabase Edge Function: notify-new-login
// Gửi email cảnh báo khi user đăng nhập trên thiết bị mới

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
    const { userId, sessionId, deviceInfo, otherSessions, frontendUrl } =
      await req.json();

    if (!userId || !sessionId || !deviceInfo) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: userId, sessionId, deviceInfo'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Lấy frontend URL từ request hoặc env
    const appUrl =
      frontendUrl || Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Lấy email của user
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error('Error getting user email:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to get user email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const userEmail = userData.user.email;

    // Format device info
    const formatDeviceInfo = (info: any) => {
      const parts: string[] = [];
      if (info.deviceType && info.deviceType !== 'unknown') {
        parts.push(
          info.deviceType.charAt(0).toUpperCase() + info.deviceType.slice(1)
        );
      }
      if (info.osName && info.osName !== 'Unknown') {
        parts.push(
          `${info.osName}${info.osVersion ? ` ${info.osVersion}` : ''}`
        );
      }
      if (info.browserName && info.browserName !== 'Unknown') {
        parts.push(
          `${info.browserName}${
            info.browserVersion ? ` ${info.browserVersion}` : ''
          }`
        );
      }
      return parts.join(' • ') || 'Unknown Device';
    };

    const newDeviceInfo = formatDeviceInfo(deviceInfo);
    const currentTime = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Tạo email content
    let emailSubject = 'Cảnh báo: Đăng nhập từ thiết bị mới';
    let emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { padding: 20px; }
          .device-info { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background-color: #2563eb; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 10px 5px 10px 0; 
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .button:hover { 
            background-color: #1d4ed8; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
          .old-device { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Cảnh báo đăng nhập</h2>
          </div>
          <div class="content">
            <p>Xin chào,</p>
            <p>Chúng tôi phát hiện một đăng nhập mới vào tài khoản của bạn:</p>
            
            <div class="device-info">
              <strong>Thiết bị mới:</strong><br>
              ${newDeviceInfo}<br>
              <strong>Thời gian:</strong> ${currentTime}
            </div>

            ${
              otherSessions && otherSessions.length > 0
                ? `
              <p><strong>Các thiết bị đang đăng nhập khác:</strong></p>
              ${otherSessions
                .map(
                  (session: any) => `
                <div class="old-device">
                  <strong>${
                    session.device_name || formatDeviceInfo(session)
                  }</strong><br>
                  Đăng nhập lúc: ${new Date(session.created_at).toLocaleString(
                    'vi-VN',
                    {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )}
                  <br>
                  <a href="${appUrl}/logout-device?token=${
                    session.logout_token
                  }" class="button" style="background-color: #2563eb; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; font-weight: 600; margin-top: 10px;">
                    🔓 Đăng xuất thiết bị này
                  </a>
                </div>
              `
                )
                .join('')}
            `
                : ''
            }

            <p>Nếu đây không phải là bạn, vui lòng:</p>
            <ol>
              <li>Đổi mật khẩu ngay lập tức</li>
              <li>Đăng xuất khỏi các thiết bị không phải của bạn</li>
              <li>Liên hệ với chúng tôi nếu bạn nghi ngờ tài khoản bị xâm nhập</li>
            </ol>

            <p>Nếu đây là bạn, bạn có thể bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống Zappy. Vui lòng không trả lời email này.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Gửi email qua email service
    // Option 1: Sử dụng Resend (khuyến nghị - miễn phí 3000 emails/tháng)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@yourdomain.com',
            to: userEmail,
            subject: emailSubject,
            html: emailBody
          })
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error('Resend API error:', errorData);
          throw new Error(
            `Failed to send email: ${errorData.message || 'Unknown error'}`
          );
        }

        const resendData = await resendResponse.json();
        console.log('Email sent successfully via Resend:', resendData);
      } catch (emailError) {
        console.error('Error sending email via Resend:', emailError);
        // Không throw error, chỉ log để không block login flow
      }
    } else {
      // Option 2: Sử dụng Supabase's built-in email (nếu đã config SMTP)
      // Hoặc log để debug
      console.log('RESEND_API_KEY not found. Email not sent. Email details:', {
        to: userEmail,
        subject: emailSubject
        // body: emailBody.substring(0, 200) + '...' // Log một phần để debug
      });

      // Nếu muốn dùng Supabase SMTP, có thể gọi database function hoặc webhook
      // Ví dụ: await supabase.rpc('send_email_notification', { ... });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email notification queued',
        // Trả về thông tin để frontend có thể hiển thị
        emailInfo: {
          to: userEmail,
          subject: emailSubject
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in notify-new-login function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
