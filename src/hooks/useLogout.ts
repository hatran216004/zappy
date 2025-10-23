import authServices from '@/services/authServices';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

function useLogout() {
  const navigate = useNavigate();

  const {
    mutate: logout,
    isPending,
    isError
  } = useMutation({
    mutationFn: authServices.logout,
    onError: () => {
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau');
    },
    onSettled: () => {
      navigate('/login');
    }
  });

  return { logout, isPending, isError };
}

export default useLogout;
