import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import apiService from '@/services/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Fetch current user info (session should be ready after OAuth)
        const response = await apiService.getCurrentUser();
        if (response && response.code === 0 && response.data) {
          // Update auth state
          setUser(response.data);
          // Redirect to chat page
          navigate('/chat', { replace: true });
        } else {
          // Failed to get user info, redirect to login
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hku-green to-hku-blue">
      <div className="text-white text-center">
        <div className="text-2xl mb-4">Signing you in...</div>
        <div className="text-sm">Please wait</div>
      </div>
    </div>
  );
};

export default AuthCallback;

