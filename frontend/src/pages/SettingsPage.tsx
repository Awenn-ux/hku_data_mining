import { useState } from 'react';
import { Card, Form, Input, Select, Switch, Button, Divider, message } from 'antd';
import { motion } from 'framer-motion';
import { Settings, Save, Key, Palette, Bell, User } from 'lucide-react';
import { useStore } from '@/store/useStore';

const SettingsPage = () => {
  const { user, theme, toggleTheme } = useStore();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      // TODO: 调用 API 保存设置
      console.log('保存设置:', values);
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* 头部 */}
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6 text-hku-green" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            系统设置
          </h1>
          <p className="text-sm text-gray-500">
            个性化配置您的智能助手
          </p>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          model: 'gpt-4',
          topK: 5,
          temperature: 0.7,
          notifications: true,
        }}
      >
        {/* 个人信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>个人信息</span>
              </div>
            }
            className="card-hku"
          >
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  邮箱
                </div>
                <div className="font-medium">{user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  姓名
                </div>
                <div className="font-medium">{user?.name}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* AI 模型配置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>AI 模型配置</span>
              </div>
            }
            className="card-hku"
          >
            <Form.Item
              label="API Key"
              name="apiKey"
              extra="用于调用 AI 模型的密钥"
            >
              <Input.Password
                placeholder="sk-..."
                size="large"
                className="input-hku"
              />
            </Form.Item>

            <Form.Item
              label="模型选择"
              name="model"
            >
              <Select size="large" className="w-full">
                <Select.Option value="gpt-4">GPT-4</Select.Option>
                <Select.Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Select.Option>
                <Select.Option value="deepseek">DeepSeek</Select.Option>
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="检索文档数"
                name="topK"
                tooltip="从知识库检索的文档数量"
              >
                <Select size="large">
                  <Select.Option value={3}>3 个</Select.Option>
                  <Select.Option value={5}>5 个</Select.Option>
                  <Select.Option value={10}>10 个</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="创造性"
                name="temperature"
                tooltip="数值越高，回答越有创造性"
              >
                <Select size="large">
                  <Select.Option value={0.3}>保守 (0.3)</Select.Option>
                  <Select.Option value={0.7}>平衡 (0.7)</Select.Option>
                  <Select.Option value={1.0}>创新 (1.0)</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </Card>
        </motion.div>

        {/* 外观设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>外观设置</span>
              </div>
            }
            className="card-hku"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">暗色模式</div>
                <div className="text-sm text-gray-500">
                  护眼的夜间模式
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onChange={toggleTheme}
                checkedChildren="🌙"
                unCheckedChildren="☀️"
              />
            </div>

            <Divider />

            <Form.Item
              label="语言"
              name="language"
            >
              <Select size="large" defaultValue="zh-CN">
                <Select.Option value="zh-CN">简体中文</Select.Option>
                <Select.Option value="en-US">English</Select.Option>
                <Select.Option value="zh-HK">繁體中文</Select.Option>
              </Select>
            </Form.Item>
          </Card>
        </motion.div>

        {/* 通知设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>通知设置</span>
              </div>
            }
            className="card-hku"
          >
            <Form.Item
              name="notifications"
              valuePropName="checked"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium mb-1">桌面通知</div>
                  <div className="text-sm text-gray-500">
                    接收新消息提醒
                  </div>
                </div>
                <Switch />
              </div>
            </Form.Item>
          </Card>
        </motion.div>

        {/* 保存按钮 */}
        <div className="flex justify-end space-x-3">
          <Button size="large">
            重置
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<Save className="w-4 h-4" />}
            htmlType="submit"
            loading={saving}
            className="bg-gradient-hku border-0"
          >
            保存设置
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SettingsPage;

