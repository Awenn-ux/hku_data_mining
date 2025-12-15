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
      // TODO: call API to persist settings
      console.log('Saving settings:', values);
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6 text-hku-green" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            System Settings
          </h1>
          <p className="text-sm text-gray-500">
            Personalize your smart assistant
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
          language: 'en-US',
        }}
      >
        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile</span>
              </div>
            }
            className="card-hku"
          >
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Email
                </div>
                <div className="font-medium">{user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Name
                </div>
                <div className="font-medium">{user?.name}</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* AI model configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>AI Model Configuration</span>
              </div>
            }
            className="card-hku"
          >
            <Form.Item
              label="API Key"
              name="apiKey"
              extra="Used to call AI models"
            >
              <Input.Password
                placeholder="sk-..."
                size="large"
                className="input-hku"
              />
            </Form.Item>

            <Form.Item
              label="Model"
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
                label="Documents retrieved"
                name="topK"
                tooltip="Number of knowledge-base documents to fetch"
              >
                <Select size="large">
                  <Select.Option value={3}>3 items</Select.Option>
                  <Select.Option value={5}>5 items</Select.Option>
                  <Select.Option value={10}>10 items</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Creativity"
                name="temperature"
                tooltip="Higher values produce more creative answers"
              >
                <Select size="large">
                  <Select.Option value={0.3}>Conservative (0.3)</Select.Option>
                  <Select.Option value={0.7}>Balanced (0.7)</Select.Option>
                  <Select.Option value={1.0}>Creative (1.0)</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Appearance</span>
              </div>
            }
            className="card-hku"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium mb-1">Dark mode</div>
                <div className="text-sm text-gray-500">
                  Eye-friendly night theme
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
              label="Language"
              name="language"
            >
              <Select size="large">
                <Select.Option value="zh-CN">Simplified Chinese</Select.Option>
                <Select.Option value="en-US">English</Select.Option>
                <Select.Option value="zh-HK">Traditional Chinese</Select.Option>
              </Select>
            </Form.Item>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            title={
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
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
                  <div className="font-medium mb-1">Desktop notifications</div>
                  <div className="text-sm text-gray-500">
                    Receive alerts for new activity
                  </div>
                </div>
                <Switch />
              </div>
            </Form.Item>
          </Card>
        </motion.div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <Button size="large">
            Reset
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<Save className="w-4 h-4" />}
            htmlType="submit"
            loading={saving}
            className="bg-gradient-hku border-0"
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SettingsPage;

