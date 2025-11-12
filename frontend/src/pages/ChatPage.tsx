import { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, Empty, Tag, Tooltip, Drawer } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  Trash2,
  Clock,
  FileText,
  Mail as MailIcon,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import apiService from '@/services/api';
import type { Message } from '@/types';

const { TextArea } = Input;

const ChatPage = () => {
  const { messages, addMessage, clearMessages, user } = useStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.sendMessage({
        question: userMessage.content,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date(),
        sources: response.data.sources,
      };

      addMessage(assistantMessage);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，出现了错误。请稍后再试。',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    clearMessages();
  };

  return (
    <div className="h-[calc(100vh-144px)] flex flex-col">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-6 h-6 text-hku-green" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              智能对话
            </h1>
            <p className="text-sm text-gray-500">
              基于知识库和邮箱的个性化 AI 助手
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Tooltip title="查看历史对话">
            <Button
              icon={<Clock className="w-4 h-4" />}
              onClick={() => setShowHistory(true)}
            >
              历史
            </Button>
          </Tooltip>

          <Tooltip title="新建对话">
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleNewChat}
              className="bg-gradient-hku border-0"
            >
              新对话
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center max-w-2xl">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-hku text-white mb-6 shadow-hku">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                您好，{user?.name || '同学'}！
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                我是您的 HKU 智能助手。您可以问我关于课程、活动、邮件等任何问题。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                {[
                  '如何注册下学期的课程？',
                  '图书馆的开放时间是什么？',
                  '我最近有哪些重要的邮件？',
                  '本周有什么学术活动？',
                ].map((q, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <Card
                      hoverable
                      size="small"
                      onClick={() => setInput(q)}
                      className="cursor-pointer hover:shadow-hku transition-all"
                    >
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {q}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 pb-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                    {/* 消息气泡 */}
                    <div
                      className={`message-bubble ${
                        message.role === 'user'
                          ? 'message-user'
                          : 'message-assistant'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {/* 时间戳 */}
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* 来源引用 */}
                    {message.sources && message.sources.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 space-y-2"
                      >
                        <div className="text-xs text-gray-500 mb-2">
                          📚 参考来源：
                        </div>
                        {message.sources.map((source, idx) => (
                          <Card
                            key={idx}
                            size="small"
                            className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start space-x-2">
                              {source.type === 'knowledge_base' ? (
                                <FileText className="w-4 h-4 text-hku-green mt-0.5" />
                              ) : (
                                <MailIcon className="w-4 h-4 text-hku-blue mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-sm mb-1">
                                  {source.title}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {source.content}
                                </div>
                                <div className="mt-1">
                                  <Tag color={source.type === 'knowledge_base' ? 'green' : 'blue'} className="text-xs">
                                    相关度: {(source.relevance_score * 100).toFixed(0)}%
                                  </Tag>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 加载动画 */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="message-bubble message-assistant">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-end space-x-3">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="输入您的问题...（Shift + Enter 换行，Enter 发送）"
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="flex-1 input-hku"
            disabled={loading}
          />

          <Button
            type="primary"
            size="large"
            icon={<Send className="w-5 h-5" />}
            onClick={handleSend}
            loading={loading}
            disabled={!input.trim()}
            className="h-11 px-6 bg-gradient-hku border-0 hover:shadow-hku"
          >
            发送
          </Button>
        </div>

        {messages.length > 0 && (
          <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
            <div>当前对话包含 {messages.length} 条消息</div>
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 className="w-3 h-3" />}
              onClick={handleNewChat}
            >
              清空对话
            </Button>
          </div>
        )}
      </div>

      {/* 历史对话抽屉 */}
      <Drawer
        title="历史对话"
        placement="right"
        onClose={() => setShowHistory(false)}
        open={showHistory}
        width={400}
      >
        <Empty description="暂无历史对话" />
      </Drawer>
    </div>
  );
};

export default ChatPage;

