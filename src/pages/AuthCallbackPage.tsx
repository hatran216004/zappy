import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/stores/user';
import profileServices from '@/services/profileServices';
import toast from 'react-hot-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('handleAuthCallback');
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setStatus('error');
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (data.session && data.session.user) {
          const user = data.session.user;

          // Check if profile exists, if not create one for OAuth users (similar to register)
          let profile;
          try {
            profile = await profileServices.getProfile(user.id);
          } catch (profileError: unknown) {
            // Profile doesn't exist, create one for OAuth user (similar to register function)
            const error = profileError as { code?: string };
            if (error.code === 'PGRST116') {
              console.log(
                'Profile not found, creating new profile for OAuth user'
              );

              // Extract profile data from user_metadata.profile (similar to register function)
              // In register, profile is stored in options.data.profile
              const profileData = user.user_metadata?.profile as
                | {
                    username?: string;
                    display_name?: string;
                    gender?: number;
                  }
                | undefined;

              // Extract information - prioritize profile data from metadata (like register)
              const displayName =
                profileData?.display_name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                'User';

              // Generate username - ensure it's never null or empty
              // Helper function to ensure username is always valid
              const generateUsername = (): string => {
                // Try profile.username from metadata (like register)
                if (profileData?.username?.trim()) {
                  return profileData.username.trim();
                }
                // Try preferred_username from Google
                if (user.user_metadata?.preferred_username?.trim()) {
                  return user.user_metadata.preferred_username.trim();
                }
                // Try username from Google
                if (user.user_metadata?.username?.trim()) {
                  return user.user_metadata.username.trim();
                }
                // Try email prefix
                if (user.email) {
                  const emailPrefix = user.email.split('@')[0]?.trim();
                  if (emailPrefix && emailPrefix.length > 0) {
                    return emailPrefix;
                  }
                }
                // Final fallback - always generate from user ID (guaranteed to exist)
                return `user_${user.id.slice(0, 8)}`;
              };

              const username = generateUsername();

              // Get gender from profile data (like register: 1 for male, 0 for female)
              // Default to false (0 = female) if not provided
              const gender =
                profileData?.gender !== undefined
                  ? profileData.gender === 1
                  : false;

              // Get avatar from Google if available
              const avatarUrl =
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                '';

              const now = new Date().toISOString();

              // Final validation - username should never be null/empty at this point
              const finalUsername =
                username && username.trim()
                  ? username.trim()
                  : `user_${user.id.slice(0, 8)}`;

              // Debug: Log username before insert
              console.log(
                'Creating profile with username:',
                finalUsername,
                'for user:',
                user.id,
                'email:',
                user.email
              );

              // Create profile (similar to register function structure)
              const profileInsertData = {
                id: user.id,
                display_name: displayName,
                username: finalUsername, // Guaranteed to be non-null, non-empty string
                gender: gender, // From profile data or default to false
                avatar_url: avatarUrl,
                bio: '',
                status: 'offline' as const,
                is_disabled: false,
                created_at: now,
                status_updated_at: now
              };

              console.log('Profile insert data:', {
                id: profileInsertData.id,
                username: profileInsertData.username,
                display_name: profileInsertData.display_name,
                username_type: typeof profileInsertData.username,
                username_length: profileInsertData.username.length
              });

              const { error: createError } = await supabase
                .from('profiles')
                .insert(profileInsertData);

              if (createError) {
                console.error('Error creating profile:', createError);
                throw createError;
              }

              // Fetch the newly created profile
              profile = await profileServices.getProfile(user.id);
            } else {
              throw profileError;
            }
          }

          // Check if user is disabled
          if (profile.is_disabled) {
            await supabase.auth.signOut();
            setUser(null);
            setStatus('error');
            toast.error(
              'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin qua email: hieuntadmin@gmail.com để được hỗ trợ.',
              { duration: 10000 }
            );
            setTimeout(() => navigate('/login'), 2000);
            return;
          }

          setUser(user);
          setStatus('success');
          toast.success('Đăng nhập thành công!');
          navigate('/chat');
        } else {
          setStatus('error');
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        setStatus('error');
        toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-2">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        <div className="text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600">Đang xử lý đăng nhập...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Đăng nhập thành công!</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Đăng nhập thất bại.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
