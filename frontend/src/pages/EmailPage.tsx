import { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Empty, Badge, Input, Drawer, Spin, Divider } from 'antd';
import { motion } from 'framer-motion';
import {
  Mail,
  Search,
  Calendar,
  RefreshCw,
  Link as LinkIcon,
  X,
  Paperclip,
  Clock,
  User,
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
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [emailDetail, setEmailDetail] = useState<EmailMessage | null>(null);

  useEffect(() => {
    console.log('EmailPage mounted, user:', user);
    console.log('email_connected:', user?.email_connected);
    
    // Only load emails when mailbox is connected
    if (user?.email_connected) {
      console.log('Start loading emails...');
      loadEmails();
    }
  }, [user?.email_connected]);

  const loadEmails = async () => {
    console.log('loadEmails invoked');
    setLoading(true);
    setError(null);
    try {
      console.log('Calling email API...');
      const response = await apiService.getEmails(50);
      console.log('API response:', response);
      
      if (response && response.data && response.data.emails) {
        console.log('Fetched emails:', response.data.emails.length);
        setEmails(response.data.emails);
      } else {
        console.log('Unexpected response format:', response);
        setEmails([]);
      }
    } catch (error: any) {
      console.error('Failed to load emails:', error);
      console.error('Error detail:', error.response || error);
      setError(error?.message || 'Failed to load emails');
      setEmails([]);
    } finally {
      console.log('loadEmails finished');
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Get Microsoft login URL and redirect
      const response = await apiService.getLoginUrl();
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Failed to get login link:', error);
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
      console.error('Failed to search emails:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (email: EmailMessage) => {
    setSelectedEmail(email);
    setDetailLoading(true);
    setEmailDetail(null);
    
    try {
      const response = await apiService.getEmailDetail(email.id);
      setEmailDetail(response.data);
    } catch (error: any) {
      console.error('Failed to load email detail:', error);
      // 如果获取详情失败，使用列表中的基本信息
      setEmailDetail(email);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEmail(null);
    setEmailDetail(null);
  };

  const formatEmailList = (emails?: string[]): string => {
    if (!emails || emails.length === 0) return 'None';
    return emails.join(', ');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Debug info
  console.log('EmailPage render, user:', user, 'error:', error, 'loading:', loading, 'emails:', emails.length);

  // Prompt user to connect mailbox
  if (!user?.email_connected) {
    console.log('Mailbox not connected, showing prompt');
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
            Connect your email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in with Microsoft so the assistant can tailor answers with your inbox context.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
            💡 Developer login cannot access mailbox data—use Microsoft sign-in instead.
          </p>
          <Button
            type="primary"
            size="large"
            icon={<LinkIcon className="w-5 h-5" />}
            onClick={handleConnect}
            loading={connecting}
            className="h-12 px-8 bg-gradient-hku border-0"
          >
            Sign in with Microsoft
          </Button>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-lg">⚠️ Failed to load</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => { setError(null); loadEmails(); }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-hku-blue" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Email Integration
            </h1>
            <p className="text-sm text-gray-500">
              Manage and review your academic inbox
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            icon={<Calendar className="w-4 h-4" />}
            onClick={() => {/* TODO: open calendar view */}}
          >
            Calendar
          </Button>
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={loadEmails}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="card-hku">
        <Input.Search
          placeholder="Search email content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          size="large"
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          enterButton={
            <Button type="primary" className="bg-gradient-hku border-0">
              Search
            </Button>
          }
        />
      </Card>

      {/* Email list */}
      <Card className="card-hku">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : !Array.isArray(emails) || emails.length === 0 ? (
          <Empty
            description="No emails yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="space-y-2">
            {emails.map((email, index) => {
              const senderName = email.sender || email.from || 'Unknown';
              const senderEmail = email.sender_email || email.from_email || '';
              const displayName = senderName !== 'Unknown' ? senderName : (senderEmail || '?');
              
              return (
                <motion.div
                  key={email.id || index}
                  whileHover={{ scale: 1.01 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-4 transition-colors cursor-pointer border-b last:border-b-0"
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-hku flex items-center justify-center text-white font-bold flex-shrink-0">
                      {displayName[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {email.subject || 'No subject'}
                        </span>
                        {email.is_academic && (
                          <Tag color="green" className="text-xs">
                            Academic
                          </Tag>
                        )}
                        {email.importance === 'high' && (
                          <Badge status="error" text="Important" />
                        )}
                        {email.has_attachments && (
                          <Paperclip className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        From: {senderName} {senderEmail && `(${senderEmail})`}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 mb-1">
                        {email.body_preview || ''}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {email.received_at ? new Date(email.received_at).toLocaleString('en-US') : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Email Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Email Detail</span>
            <Button
              type="text"
              icon={<X className="w-4 h-4" />}
              onClick={handleCloseDetail}
            />
          </div>
        }
        placement="right"
        onClose={handleCloseDetail}
        open={selectedEmail !== null}
        width={800}
        className="email-detail-drawer"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
          </div>
        ) : emailDetail ? (
          <div className="space-y-4 flex flex-col h-full">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {emailDetail.subject || 'No Subject'}
              </h2>
              <div className="flex items-center space-x-2 mb-4">
                {emailDetail.importance === 'high' && (
                  <Tag color="red">Important</Tag>
                )}
                {emailDetail.is_academic && (
                  <Tag color="green">Academic</Tag>
                )}
                {emailDetail.has_attachments && (
                  <Tag icon={<Paperclip className="w-3 h-3" />}>
                    {emailDetail.attachment_count || 0} Attachment(s)
                  </Tag>
                )}
              </div>
            </div>

            <Divider />

            {/* From */}
            <div className="flex items-start space-x-2">
              <User className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">From</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {emailDetail.from || emailDetail.sender || 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {emailDetail.from_email || emailDetail.sender_email || ''}
                </div>
              </div>
            </div>

            {/* To */}
            {emailDetail.to && emailDetail.to.length > 0 && (
              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">To</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {formatEmailList(emailDetail.to)}
                  </div>
                </div>
              </div>
            )}

            {/* CC */}
            {emailDetail.cc && emailDetail.cc.length > 0 && (
              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">CC</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {formatEmailList(emailDetail.cc)}
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-gray-400 mt-1" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Received</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {emailDetail.received_at
                    ? new Date(emailDetail.received_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Unknown'}
                </div>
                {emailDetail.sent_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    Sent: {new Date(emailDetail.sent_at).toLocaleString('en-US')}
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            {emailDetail.attachments && emailDetail.attachments.length > 0 && (
              <>
                <Divider />
                <div>
                  <div className="text-xs text-gray-500 mb-2">Attachments</div>
                  <div className="space-y-2">
                    {emailDetail.attachments.map((att, idx) => (
                      <Card key={idx} size="small" className="bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {att.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {att.contentType} • {formatFileSize(att.size)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Divider />

            {/* Body Content */}
            <div className="flex-1 flex flex-col min-h-0 -mx-4 px-4">
              <div className="text-xs text-gray-500 mb-2">Content</div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 overflow-y-auto" style={{ minHeight: '500px', maxHeight: 'calc(100vh - 450px)' }}>
                {emailDetail.body_type === 'html' ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: emailDetail.body_content || emailDetail.body_preview || '' }}
                  />
                ) : (
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {emailDetail.body_content || emailDetail.body_preview || 'No content'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Empty description="Failed to load email detail" />
        )}
      </Drawer>
    </div>
  );
};

export default EmailPage;

