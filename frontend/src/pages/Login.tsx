import { useState } from 'react';
import { Button, Card, message } from 'antd';
import { motion } from 'framer-motion';
import { LogIn, TrendingUp, Mail, BookOpen, Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import apiService from '@/services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await apiService.getLoginUrl();
      // 跳转到 Microsoft OAuth 页面
      window.location.href = response.data.auth_url;
    } catch (error: any) {
      message.error(error.message || '获取登录链接失败，请使用开发者登录');
      setLoading(false);
    }
  };

  // 开发者登录（跳过OAuth）
  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const response = await apiService.devLogin();
      const { user } = response.data;

      // Session 认证，仅存储用户信息
      localStorage.setItem('user', JSON.stringify(user));

      // 更新用户状态（setUser 会自动设置 isAuthenticated）
      setUser(user);

      message.success('开发者登录成功');
      navigate('/chat');
    } catch (error: any) {
      message.error(error.message || '开发者登录失败');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hku-green via-hku-green-light to-hku-blue flex items-center justify-center p-4 overflow-hidden relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-hku-gold rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 relative z-10">
        {/* 左侧：品牌展示 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white flex flex-col justify-center p-8"
        >
          {/* 排名徽章 */}
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
            您的专属 AI 学习助手
            <br />
            智能整合学校资源与个人信息
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
                <div className="font-medium">邮箱智能集成</div>
                <div className="text-sm text-white/70">自动同步课程通知和重要邮件</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">知识库检索</div>
                <div className="text-sm text-white/70">海量学校文档智能搜索</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">AI 智能问答</div>
                <div className="text-sm text-white/70">基于 RAG 的精准回答</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* 右侧：登录卡片 */}
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
                欢迎使用智能助手
              </h2>
              <p className="text-gray-600">
                使用您的 Microsoft 账号登录
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
                Microsoft 账号登录
              </Button>

              {/* 开发者登录按钮 */}
              <Button
                size="large"
                block
                loading={devLoading}
                onClick={handleDevLogin}
                className="h-12 text-base border-hku-green text-hku-green hover:bg-hku-green hover:text-white"
                icon={<Code className="w-5 h-5" />}
              >
                开发者登录
              </Button>

              <div className="text-center text-xs text-gray-400 pt-2">
                <p>开发者登录用于测试，无需 Microsoft 账号</p>
              </div>

              <div className="text-center text-sm text-gray-500 pt-4">
                <p>登录即表示您同意我们的</p>
                <p className="text-hku-green">服务条款 · 隐私政策</p>
              </div>
            </div>

            {/* 底部装饰 */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <TrendingUp className="w-4 h-4 text-hku-green" />
                <span>QS 亚洲大学排名 #1 · 全球排名 #11</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 底部版权信息 */}
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

