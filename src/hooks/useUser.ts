import authServices from '@/services/authServices';
import { useQuery } from '@tanstack/react-query';

function useUser() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['current-user'],
    queryFn: authServices.getCurrentUser
  });

  return {
    user: data?.user,
    isError,
    isLoading,
    isAuthenticated: data?.user.role === 'authenticated'
  };
}

export default useUser;
