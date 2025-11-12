import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/Login';
import ChatPage from './pages/ChatPage';
import EmailPage from './pages/EmailPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const { theme, isAuthenticated } = useStore();

  useEffect(() => {
    // 初始化主题
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // 路由守卫
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 受保护的路由 */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/email" element={<EmailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

