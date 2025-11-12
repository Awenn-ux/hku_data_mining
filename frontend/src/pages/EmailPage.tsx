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

  useEffect(() => {
    if (user?.email_connected) {
      loadEmails();
    }
  }, [user]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const response = await apiService.getEmails(50);
      setEmails(response.data);
    } catch (error) {
      // message.error('加载邮件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await apiService.connectEmail();
      loadEmails();
    } catch (error) {
      // message.error('连接邮箱失败');
    } finally {
      setConnecting(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await apiService.searchEmails(searchQuery);
      setEmails(response.data);
    } catch (error) {
      // message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.email_connected) {
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
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            连接 Outlook 邮箱后，AI 助手可以基于您的邮件内容提供更个性化的回答
          </p>
          <Button
            type="primary"
            size="large"
            icon={<LinkIcon className="w-5 h-5" />}
            onClick={handleConnect}
            loading={connecting}
            className="h-12 px-8 bg-gradient-hku border-0"
          >
            连接 Outlook 邮箱
          </Button>
        </motion.div>
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
        <List
          loading={loading}
          dataSource={emails}
          locale={{
            emptyText: (
              <Empty
                description="暂无邮件"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          renderItem={(email, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <List.Item
                className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-4 transition-colors cursor-pointer"
              >
                <List.Item.Meta
                  avatar={
                    <div className="w-10 h-10 rounded-full bg-gradient-hku flex items-center justify-center text-white font-bold">
                      {email.sender[0]?.toUpperCase()}
                    </div>
                  }
                  title={
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{email.subject}</span>
                      {email.is_academic && (
                        <Tag color="green" className="text-xs">
                          学术
                        </Tag>
                      )}
                      {email.importance === 'high' && (
                        <Badge status="error" text="重要" />
                      )}
                    </div>
                  }
                  description={
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        来自: {email.sender} ({email.sender_email})
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {email.body_preview}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(email.received_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            </motion.div>
          )}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 封邮件`,
          }}
        />
      </Card>
    </div>
  );
};

export default EmailPage;

