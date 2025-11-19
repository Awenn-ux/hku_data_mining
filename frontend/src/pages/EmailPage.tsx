import { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Badge, Input } from 'antd';
import { motion } from 'framer-motion';
import {
  Mail,
  Search,
  Calendar,
  RefreshCw,
  Link as LinkIcon,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import apiService from '@/services/api';
import type { EmailMessage } from '@/types';

const EmailPage = () => {
  const { user } = useStore();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('EmailPage mounted, user:', user);
    console.log('email_connected:', user?.email_connected);
    
    // 只有在邮箱已连接时才加载邮件
    if (user?.email_connected) {
      console.log('开始加载邮件...');
      loadEmails();
    }
  }, [user?.email_connected]);

  const loadEmails = async () => {
    console.log('loadEmails 被调用');
    setLoading(true);
    setError(null);
    try {
      console.log('正在调用 API...');
      const response = await apiService.getEmails(50);
      console.log('API 响应:', response);
      
      if (response && response.data && response.data.emails) {
        console.log('成功获取邮件:', response.data.emails.length, '封');
        setEmails(response.data.emails);
      } else {
        console.log('响应数据格式不正确:', response);
        setEmails([]);
      }
    } catch (error: any) {
      console.error('加载邮件失败:', error);
      console.error('错误详情:', error.response || error);
      setError(error?.message || '加载邮件失败');
      setEmails([]);
    } finally {
      console.log('loadEmails 完成');
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // 获取Microsoft登录URL并跳转
      const response = await apiService.getLoginUrl();
      window.location.href = response.data.auth_url;
    } catch (error) {
      // message.error('连接邮箱失败');
      console.error('获取登录链接失败:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await apiService.searchEmails(searchQuery);
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error('搜索邮件失败:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  // 添加调试信息
  console.log('EmailPage render, user:', user, 'error:', error, 'loading:', loading, 'emails:', emails.length);

  // 如果用户未连接邮箱，显示连接提示
  if (!user?.email_connected) {
    console.log('用户未连接邮箱，显示连接提示');
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-hku text-white mb-6 shadow-hku">
            <Mail className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            连接您的邮箱
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            使用 Microsoft 账号登录后，AI 助手可以基于您的邮件内容提供更个性化的回答
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            💡 提示：开发者登录无法访问邮箱功能，请使用 Microsoft 账号登录
          </p>
          <Button
            type="primary"
            size="large"
            icon={<LinkIcon className="w-5 h-5" />}
            onClick={handleConnect}
            loading={connecting}
            className="h-12 px-8 bg-gradient-hku border-0"
          >
            使用 Microsoft 账号登录
          </Button>
        </motion.div>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-lg">⚠️ 加载失败</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => { setError(null); loadEmails(); }}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-hku-blue" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              邮箱集成
            </h1>
            <p className="text-sm text-gray-500">
              管理和查看您的学术邮件
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => {/* TODO: 显示日历事件 */}}
          >
            日历事件
          </Button>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={loadEmails}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <Card className="card-hku">
        <Input.Search
          placeholder="搜索邮件内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          size="large"
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          enterButton={
            <Button type="primary" className="bg-gradient-hku border-0">
              搜索
            </Button>
          }
        />
      </Card>

      {/* 邮件列表 */}
      <Card className="card-hku">
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : !Array.isArray(emails) || emails.length === 0 ? (
          <Empty
            description="暂无邮件"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="space-y-2">
            {emails.map((email, index) => (
              <div
                key={email.id || index}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-4 transition-colors cursor-pointer border-b last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-hku flex items-center justify-center text-white font-bold flex-shrink-0">
                    {email.sender?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {email.subject || '无主题'}
                      </span>
                      {email.is_academic && (
                        <Tag color="green" className="text-xs">
                          学术
                        </Tag>
                      )}
                      {email.importance === 'high' && (
                        <Badge status="error" text="重要" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      来自: {email.sender || '未知'} ({email.sender_email || ''})
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2 mb-1">
                      {email.body_preview || ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {email.received_at ? new Date(email.received_at).toLocaleString('zh-CN') : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailPage;

