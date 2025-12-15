# 邮件详情功能实现说明

## 功能概述

在 Email Hub 界面中，用户现在可以点击检索到的邮件，查看邮件的详细内容，包括：
- 完整的邮件主题
- 发件人、收件人、抄送信息
- 发送和接收时间
- 完整的邮件正文（支持 HTML 和纯文本）
- 附件列表（如果有）

## 实现内容

### 后端实现

#### 1. 邮件服务方法 (`backend/services/email_service.py`)

新增 `get_email_detail()` 方法：
- 使用 Microsoft Graph API 的 `/me/messages/{id}` 端点
- 获取完整的邮件信息，包括：
  - 基本信息（主题、发件人、收件人等）
  - 邮件正文（HTML 或纯文本）
  - 附件列表
  - 重要性标记、已读状态等

#### 2. API 路由 (`backend/routes/email.py`)

新增 `GET /api/email/<email_id>` 端点：
- 验证用户身份和邮箱连接状态
- 自动刷新过期的访问令牌
- 返回完整的邮件详情

**路由顺序**：将 `/status` 路由放在 `/<email_id>` 之前，避免路由冲突

### 前端实现

#### 1. API 服务 (`frontend/src/services/api.ts`)

更新 `getEmailDetail()` 方法：
```typescript
async getEmailDetail(id: string): Promise<ApiResponse<EmailMessage>> {
  return this.api.get(`/api/email/${id}`);
}
```

#### 2. 类型定义 (`frontend/src/types/index.ts`)

扩展 `EmailMessage` 接口，添加详情字段：
- `from`, `from_email` - 发件人信息
- `to`, `cc`, `bcc` - 收件人列表
- `body_content`, `body_type` - 完整正文
- `sent_at` - 发送时间
- `attachments` - 附件列表
- `is_read` - 已读状态

#### 3. EmailPage 组件 (`frontend/src/pages/EmailPage.tsx`)

主要更新：

1. **状态管理**：
   - `selectedEmail` - 当前选中的邮件
   - `emailDetail` - 邮件详情数据
   - `detailLoading` - 加载状态

2. **交互功能**：
   - `handleEmailClick()` - 点击邮件时加载详情
   - `handleCloseDetail()` - 关闭详情抽屉

3. **UI 改进**：
   - 邮件列表项添加点击效果（hover 动画）
   - 显示附件图标
   - 添加详情抽屉（Drawer）

4. **详情显示**：
   - 使用 Ant Design 的 `Drawer` 组件
   - 显示完整的邮件信息
   - 支持 HTML 邮件渲染
   - 显示附件列表和大小
   - 格式化日期和时间

## 使用方式

1. **查看邮件详情**：
   - 在 Email Hub 页面，点击任意邮件列表项
   - 右侧会弹出详情抽屉，显示完整邮件内容

2. **关闭详情**：
   - 点击抽屉右上角的关闭按钮
   - 或点击抽屉外的区域

## UI 特性

- **响应式设计**：详情抽屉宽度为 600px，适配不同屏幕
- **加载状态**：获取详情时显示加载动画
- **错误处理**：如果获取详情失败，会显示错误提示
- **HTML 支持**：自动识别并渲染 HTML 格式的邮件
- **附件显示**：显示附件名称、类型和大小
- **时间格式化**：友好的日期时间显示格式

## 技术细节

### 后端 API 响应格式

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": "email_id",
    "subject": "邮件主题",
    "from": "发件人姓名",
    "from_email": "sender@example.com",
    "to": ["recipient@example.com"],
    "cc": [],
    "bcc": [],
    "received_at": "2024-01-01T12:00:00Z",
    "sent_at": "2024-01-01T11:59:00Z",
    "body_content": "邮件正文内容",
    "body_type": "html",
    "importance": "normal",
    "is_read": true,
    "has_attachments": true,
    "attachment_count": 2,
    "attachments": [
      {
        "id": "att_id",
        "name": "document.pdf",
        "contentType": "application/pdf",
        "size": 1024000
      }
    ]
  }
}
```

### 前端组件结构

```
EmailPage
├── Header (搜索和刷新)
├── Email List
│   └── EmailItem (可点击)
└── Detail Drawer (右侧抽屉)
    ├── Header (主题和标签)
    ├── From/To/CC 信息
    ├── 时间信息
    ├── 附件列表
    └── 邮件正文
```

## 注意事项

1. **权限要求**：需要 `Mail.Read` 权限才能获取邮件详情
2. **令牌刷新**：如果访问令牌过期，系统会自动刷新
3. **HTML 安全**：使用 `dangerouslySetInnerHTML` 渲染 HTML，确保邮件来源可信
4. **性能考虑**：详情按需加载，不会预加载所有邮件详情

## 后续优化建议

1. **附件下载**：添加附件下载功能
2. **邮件操作**：添加标记已读、删除等操作
3. **回复/转发**：添加邮件回复和转发功能
4. **缓存机制**：缓存已加载的邮件详情
5. **搜索高亮**：在详情中高亮搜索关键词

