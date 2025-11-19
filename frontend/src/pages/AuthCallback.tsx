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
        // 获取当前用户信息（OAuth回调后session已经设置好了）
        const response = await apiService.getCurrentUser();
        if (response && response.code === 0 && response.data) {
          // 更新用户状态
          setUser(response.data);
          // 跳转到聊天页面
          navigate('/chat', { replace: true });
        } else {
          // 获取用户信息失败，跳转到登录页
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hku-green to-hku-blue">
      <div className="text-white text-center">
        <div className="text-2xl mb-4">正在登录...</div>
        <div className="text-sm">请稍候</div>
      </div>
    </div>
  );
};

export default AuthCallback;

