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
      message.error('Failed to load documents');
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
        message.success(`${(file as File).name} uploaded successfully`);
        onSuccess?.(response);
        loadDocuments();
      } catch (error) {
        message.error('Upload failed');
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
      message.success('Document deleted');
      loadDocuments();
    } catch (error) {
      message.error('Failed to delete document');
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await apiService.reprocessDocument(id);
      message.success('Reprocessing document...');
      loadDocuments();
    } catch (error) {
      message.error('Failed to reprocess document');
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
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
    };
    return textMap[status] || status;
  };

  const columns = [
    {
      title: 'Filename',
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
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type: string) => (
        <Tag color="blue">{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: 'Chunks',
      dataIndex: 'chunk_count',
      key: 'chunk_count',
      render: (count: number) => (
        <Tag color="green">{count} chunks</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_: any, record: Document) => (
        <div className="flex items-center space-x-2">
          {record.status === 'failed' && (
            <Tooltip title="Reprocess">
              <Button
                type="text"
                size="small"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => handleReprocess(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Delete this document?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
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
      {/* Header */}
      <div className="flex items-center space-x-3">
        <BookOpen className="w-6 h-6 text-hku-green" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Knowledge Base
          </h1>
          <p className="text-sm text-gray-500">
            Upload and manage campus documents to build your private corpus
          </p>
        </div>
      </div>

      {/* Upload area */}
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
                Click or drag files here to upload
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports PDF, DOCX, TXT up to 10 MB each
              </p>
              {uploading && (
                <div className="mt-4">
                  <Spin tip="Uploading..." />
                </div>
              )}
            </div>
          </Dragger>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total documents', value: documents.length, color: 'hku-green' },
          {
            label: 'Processed',
            value: documents.filter((d) => d.status === 'completed').length,
            color: 'green-600',
          },
          {
            label: 'Processing',
            value: documents.filter((d) => d.status === 'processing').length,
            color: 'blue-600',
          },
          {
            label: 'Total chunks',
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

      {/* Document list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card
          title={
            <div className="flex items-center justify-between">
              <span>Documents</span>
              <Button
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadDocuments}
                loading={loading}
              >
                Refresh
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
              showTotal: (total) => `Total ${total} documents`,
            }}
            locale={{
              emptyText: (
                <Empty
                  description="No documents yet — upload files to begin"
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

