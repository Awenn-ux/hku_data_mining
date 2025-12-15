# HKU 智能助手 - 前端开发指南




## 项目结构

```
frontend/
├── src/
│   ├── components/          # React 组件
│   │   ├── Layout/         # 布局组件
│   │   │   └── MainLayout.tsx
│   │   ├── Chat/           # 聊天组件
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── InputBox.tsx
│   │   │   └── SourceCard.tsx
│   │   ├── Knowledge/      # 知识库组件
│   │   │   ├── UploadZone.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── DocumentCard.tsx
│   │   ├── Email/          # 邮件组件
│   │   │   ├── EmailList.tsx
│   │   │   └── EmailCard.tsx
│   │   └── Common/         # 通用组件
│   │       ├── LoadingDots.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   ├── pages/              # 页面组件
│   │   ├── Login.tsx
│   │   ├── ChatPage.tsx
│   │   ├── KnowledgePage.tsx
│   │   ├── EmailPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/           # API 服务
│   │   └── api.ts
│   ├── store/              # 状态管理
│   │   └── useStore.ts
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── useTheme.ts
│   ├── types/              # TypeScript 类型
│   │   └── index.ts
│   ├── utils/              # 工具函数
│   │   └── helpers.ts
│   ├── assets/             # 静态资源
│   │   ├── images/
│   │   └── styles/
│   │       └── global.css
│   ├── App.tsx             # 主应用
│   └── main.tsx            # 入口文件
├── public/                 # 公共资源
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

##  开发流程

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 3. 构建生产版本

```bash
npm run build
```


### 响应式设计

```css
/* 手机端 */
@media (max-width: 640px) {
  - 侧边栏自动隐藏
  - 消息气泡宽度 90%
  - 简化顶部栏
}

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) {
  - 侧边栏可折叠
  - 双列布局
}

/* 桌面端 */
@media (min-width: 1025px) {
  - 完整侧边栏
  - 三列布局
}
```

### 暗色模式

通过 Tailwind 的 `dark:` 前缀实现：

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  内容
</div>
```

### 动画效果

使用 Framer Motion:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  内容
</motion.div>
```

### 加载状态

```tsx
<div className="loading-dots">
  <span></span>
  <span></span>
  <span></span>
</div>
```

API 集成

### 使用示例

```typescript
import { apiService } from '@/services/api';

// 发送消息
const sendMessage = async (question: string) => {
  try {
    const response = await apiService.sendMessage({
      question,
      conversation_id: currentConversationId,
    });
    // 处理响应
  } catch (error) {
    // 错误处理
  }
};
```

### 错误处理

所有 API 调用都包含自动错误处理：
- 401: 自动刷新 token
- 400: 显示错误提示
- 500: 显示系统错误

## 下一步开发

### 待实现页面

1. **登录页 (Login.tsx)**
   - Microsoft OAuth 按钮
   - HKU 品牌展示
   - 动画效果

2. **聊天页 (ChatPage.tsx)**
   - 完整对话界面
   - 历史记录侧边栏
   - 来源引用展示

3. **知识库页 (KnowledgePage.tsx)**
   - 文档上传界面
   - 文档列表管理
   - 处理状态显示

4. **邮件页 (EmailPage.tsx)**
   - 邮件列表
   - 邮件详情
   - 日历事件

5. **设置页 (SettingsPage.tsx)**
   - API 配置
   - 模型选择
   - 个人偏好







