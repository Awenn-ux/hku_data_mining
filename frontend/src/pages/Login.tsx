import { useState, useEffect } from 'react';
import { Button, Card, message } from 'antd';
import { motion } from 'framer-motion';
import { LogIn, TrendingUp, Mail, BookOpen, Code } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import apiService from '@/services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  // Check if OAuth callback returned an error
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      message.error(`Login failed: ${decodeURIComponent(error)}`);
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLoginUrl();
      // Redirect to Microsoft OAuth page
      window.location.href = response.data.auth_url;
    } catch (error: any) {
      message.error(error.message || 'Unable to get login link, please try developer login');
      setLoading(false);
    }
  };

  // Developer login (skip OAuth)
  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const response = await apiService.devLogin();
      const { user } = response.data;
      
      // Session authentication, only store user info
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth state
      setUser(user);
      
      message.success('Developer login successful');
      navigate('/chat');
    } catch (error: any) {
      message.error(error.message || 'Developer login failed');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hku-green via-hku-green-light to-hku-blue flex items-center justify-center p-4 overflow-hidden relative">
          {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-hku-gold rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left: branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white flex flex-col justify-center p-8"
        >
          {/* Ranking badges */}
          <div className="flex items-center space-x-6 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-lg border-2 border-white/30 flex flex-col items-center justify-center shadow-2xl"
            >
              <div className="text-4xl font-bold">1<sup className="text-xl">st</sup></div>
              <div className="text-xs mt-1">IN ASIA</div>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-lg border-2 border-white/30 flex flex-col items-center justify-center shadow-2xl"
            >
              <div className="text-4xl font-bold">11<sup className="text-xl">th</sup></div>
              <div className="text-xs mt-1">GLOBALLY</div>
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl font-bold mb-4 font-serif"
          >
            HKU
            <br />
            Smart Assistant
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl mb-8 text-white/90"
          >
            Your dedicated AI study companion
            <br />
            Unified access to campus resources
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">Email Integration</div>
                <div className="text-sm text-white/70">Sync course notices and important emails</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">Knowledge Search</div>
                <div className="text-sm text-white/70">Intelligent lookup across university documents</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">AI Q&A</div>
                <div className="text-sm text-white/70">Contextual answers powered by RAG</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: login card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center"
        >
          <Card
            className="w-full max-w-md shadow-2xl border-0"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-hku text-white mb-4 shadow-hku"
              >
                <span className="text-3xl font-bold">HKU</span>
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Welcome to Smart Assistant
              </h2>
              <p className="text-gray-600">
                Sign in with your Microsoft account
              </p>
            </div>

            <div className="space-y-4">
              <Button
                type="primary"
                size="large"
                block
                loading={loading}
                onClick={handleLogin}
                className="h-12 text-base font-medium bg-gradient-hku border-0 hover:shadow-hku"
                icon={<LogIn className="w-5 h-5" />}
              >
                Sign in with Microsoft
              </Button>

              {/* Developer login button */}
              <Button
                size="large"
                block
                loading={devLoading}
                onClick={handleDevLogin}
                className="h-12 text-base border-hku-green text-hku-green hover:bg-hku-green hover:text-white"
                icon={<Code className="w-5 h-5" />}
              >
                Developer Login
              </Button>

              <div className="text-center text-xs text-gray-400 pt-2">
                <p>Developer login is for testing only and skips Microsoft auth</p>
              </div>

              <div className="text-center text-sm text-gray-500 pt-4">
                <p>By signing in you agree to our</p>
                <p className="text-hku-green">Terms of Service · Privacy Policy</p>
              </div>
            </div>

            {/* Footer accent */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <TrendingUp className="w-4 h-4 text-hku-green" />
                <span>QS Asia #1 · Global #11</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm"
      >
        © 2024 The University of Hong Kong. All rights reserved.
      </motion.div>
    </div>
  );
};

export default LoginPage;

