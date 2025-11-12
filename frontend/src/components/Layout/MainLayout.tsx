import React, { useState } from 'react';
import { Layout, Avatar, Dropdown, Badge, Button, Tooltip } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  BookOpen,
  Mail,
  Settings,
  Moon,
  Sun,
  Menu as MenuIcon,
  X,
  LogOut,
  User as UserIcon,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, user, isSidebarOpen, toggleSidebar } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/chat',
      icon: <MessageSquare className="w-5 h-5" />,
      label: '智能对话',
      description: 'AI 助手问答',
    },
    {
      key: '/email',
      icon: <Mail className="w-5 h-5" />,
      label: '邮件集成',
      description: '邮箱同步',
    },
    {
      key: '/settings',
      icon: <Settings className="w-5 h-5" />,
      label: '设置',
      description: '系统配置',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserIcon className="w-4 h-4" />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogOut className="w-4 h-4" />,
      label: '退出登录',
      onClick: () => {
        localStorage.clear();
        navigate('/login');
      },
      danger: true,
    },
  ];

  return (
    <Layout className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* 侧边栏 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed left-0 top-0 h-full z-40"
          >
            <Sider
              width={280}
              collapsed={collapsed}
              collapsible
              onCollapse={setCollapsed}
              className="h-full shadow-2xl"
              style={{
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
              }}
            >
              {/* Logo 区域 */}
              <div className="h-20 flex items-center justify-center px-4 border-b border-gray-200 dark:border-gray-700 hku-pattern">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center space-x-3"
                >
                  {!collapsed && (
                    <>
                      <div className="badge-rank text-sm">1st</div>
                      <div>
                        <h1 className="text-lg font-bold text-gradient-hku">
                          HKU Assistant
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          智能助手
                        </p>
                      </div>
                    </>
                  )}
                  {collapsed && <div className="badge-rank text-xs">1</div>}
                </motion.div>
              </div>

              {/* 菜单 */}
              <div className="py-4 space-y-2 px-3">
                {menuItems.map((item, index) => {
                  const isActive = location.pathname === item.key;
                  return (
                    <motion.div
                      key={item.key}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        onClick={() => navigate(item.key)}
                        className={`
                          flex items-center px-4 py-3 rounded-lg cursor-pointer
                          transition-all duration-200 group
                          ${
                            isActive
                              ? 'bg-gradient-hku text-white shadow-hku'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        <span className={`${collapsed ? 'mx-auto' : ''}`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <div className="ml-3 flex-1">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs opacity-75">
                              {item.description}
                            </div>
                          </div>
                        )}
                        {!collapsed && isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="w-1 h-8 bg-white rounded-full"
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 底部排名徽章 */}
              {!collapsed && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-20 left-0 right-0 px-4"
                >
                  <div className="card-hku text-center">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-hku-green" />
                      <span className="text-2xl font-bold text-gradient-hku">
                        #1
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      QS亚洲大学排名
                    </p>
                    <p className="text-xs text-hku-gold mt-1">
                      全球第11位
                    </p>
                  </div>
                </motion.div>
              )}
            </Sider>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区域 */}
      <Layout
        className="transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? (collapsed ? 80 : 280) : 0,
        }}
      >
        {/* 顶部导航栏 */}
        <Header
          className="bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 sticky top-0 z-30"
          style={{ height: 72 }}
        >
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={
                isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )
              }
              onClick={toggleSidebar}
              className="text-gray-600 dark:text-gray-300"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:block"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                欢迎回来，{user?.name || '同学'}
              </h2>
              <p className="text-sm text-gray-500">
                您的专属 AI 学习助手
              </p>
            </motion.div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 主题切换 */}
            <Tooltip title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}>
              <Button
                type="text"
                shape="circle"
                icon={
                  theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )
                }
                onClick={toggleTheme}
                className="text-gray-600 dark:text-gray-300"
              />
            </Tooltip>

            {/* 通知 */}
            <Badge count={3} size="small">
              <Button
                type="text"
                shape="circle"
                icon={<Mail className="w-5 h-5" />}
                className="text-gray-600 dark:text-gray-300"
              />
            </Badge>

            {/* 用户菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors">
                <Avatar
                  size={40}
                  src={user?.avatar_url}
                  style={{
                    backgroundColor: '#1B5E20',
                  }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

