import { useState, useEffect } from 'react';
import { Upload, Button, Card, Table, Tag, message, Popconfirm, Empty, Tooltip, Spin } from 'antd';
import { motion } from 'framer-motion';
import {
  Upload as UploadIcon,
  FileText,
  Trash2,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import type { UploadProps } from 'antd';
import { useStore } from '@/store/useStore';
import apiService from '@/services/api';
import type { Document } from '@/types';

const { Dragger } = Upload;

const KnowledgePage = () => {
  const { documents, setDocuments } = useStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await apiService.getDocuments();
      setDocuments(response.data);
    } catch (error) {
      message.error('加载文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.docx,.txt',
    customRequest: async ({ file, onSuccess, onError }) => {
      setUploading(true);
      try {
        const response = await apiService.uploadDocument(file as File);
        message.success(`${(file as File).name} 上传成功`);
        onSuccess?.(response);
        loadDocuments();
      } catch (error) {
        message.error('上传失败');
        onError?.(error as Error);
      } finally {
        setUploading(false);
      }
    },
    showUploadList: false,
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteDocument(id);
      message.success('文档删除成功');
      loadDocuments();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await apiService.reprocessDocument(id);
      message.success('正在重新处理文档');
      loadDocuments();
    } catch (error) {
      message.error('重新处理失败');
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'default',
      processing: 'processing',
      completed: 'success',
      failed: 'error',
    };
    return statusMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      pending: '等待处理',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
    };
    return textMap[status] || status;
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string) => (
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-hku-green" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type: string) => (
        <Tag color="blue">{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: '分块数',
      dataIndex: 'chunk_count',
      key: 'chunk_count',
      render: (count: number) => (
        <Tag color="green">{count} 块</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Document) => (
        <div className="flex items-center space-x-2">
          {record.status === 'failed' && (
            <Tooltip title="重新处理">
              <Button
                type="text"
                size="small"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => handleReprocess(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定删除此文档？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 className="w-4 h-4" />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center space-x-3">
        <BookOpen className="w-6 h-6 text-hku-green" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            知识库管理
          </h1>
          <p className="text-sm text-gray-500">
            上传和管理学校文档，构建您的专属知识库
          </p>
        </div>
      </div>

      {/* 上传区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="card-hku">
          <Dragger {...uploadProps} disabled={uploading}>
            <div className="py-8">
              <p className="ant-upload-drag-icon">
                <UploadIcon className="w-16 h-16 text-hku-green mx-auto" />
              </p>
              <p className="text-lg font-medium text-gray-800 dark:text-white mt-4">
                点击或拖拽文件到此区域上传
              </p>
              <p className="text-sm text-gray-500 mt-2">
                支持 PDF、DOCX、TXT 格式，单个文件不超过 10MB
              </p>
              {uploading && (
                <div className="mt-4">
                  <Spin tip="正在上传..." />
                </div>
              )}
            </div>
          </Dragger>
        </Card>
      </motion.div>

      {/* 统计信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: '总文档', value: documents.length, color: 'hku-green' },
          {
            label: '已处理',
            value: documents.filter((d) => d.status === 'completed').length,
            color: 'green-600',
          },
          {
            label: '处理中',
            value: documents.filter((d) => d.status === 'processing').length,
            color: 'blue-600',
          },
          {
            label: '总分块',
            value: documents.reduce((sum, d) => sum + d.chunk_count, 0),
            color: 'hku-gold',
          },
        ].map((stat, index) => (
          <Card key={index} className="text-center">
            <div className={`text-3xl font-bold text-${stat.color} mb-2`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </Card>
        ))}
      </motion.div>

      {/* 文档列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card
          title={
            <div className="flex items-center justify-between">
              <span>文档列表</span>
              <Button
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadDocuments}
                loading={loading}
              >
                刷新
              </Button>
            </div>
          }
          className="card-hku"
        >
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个文档`,
            }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无文档，请上传文件"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default KnowledgePage;

