## 项目简介

HKU 智能助手是一个基于 Flask + React 的问答系统，通过检索增强生成（RAG）整合学校知识库文档与个人邮箱信息，为用户提供智能问答服务。本版本专注于以下核心能力：

- 文档上传 → 文本提取 → 分块向量化 → 存储到 ChromaDB。
- Microsoft 邮箱 OAuth 授权与关键词检索。
- 并行检索知识库与邮箱，并交给 LLM（OpenAI / DeepSeek）生成答案。

## 功能概览

- **智能对话**：输入问题后，系统会同时从知识库与邮箱检索相关内容，再由 LLM 生成回答。
- **知识库检索**：预先导入 PDF / DOCX / TXT 文档，系统自动完成解析、分块与向量化，用户只能使用语义检索进行问答。
- **邮箱集成**：通过 Microsoft Graph API 获取邮件，支持关键词检索（需要在 `.env` 中配置客户端信息）。
- **开发者登录**：在调试模式下可使用开发者账号快速体验，无需 Microsoft 授权。
- **用户会话**：通过服务器端 Session 保存登录状态。

## 技术栈

- **后端**：Python 3.12、Flask、Flask-Session、SQLAlchemy、ChromaDB、MSAL、OpenAI SDK（兼容 DeepSeek）
- **前端**：React 18、Vite、TypeScript、Ant Design、TailwindCSS
- **数据库/存储**：SQLite（用户与历史记录）、ChromaDB（向量存储）、本地文件系统（上传文件）

## 目录结构

```
.
├── backend/                 # Flask 后端
│   ├── app.py               # 应用入口（含 Session 与路由注册）
│   ├── config.py            # 配置项（读取环境变量、常量设置）
│   ├── database.py          # SQLAlchemy 模型与初始化
│   ├── routes/              # 路由：auth / knowledge / email / chat
│   ├── services/            # 业务服务：向量库、文档处理、邮箱、RAG
│   ├── middleware/          # 登录校验等中间件
│   ├── requirements.txt     # 后端依赖
│   ├── run.py               # 启动脚本（python run.py）
│   ├── start.bat / start.sh # 一键启动脚本
│   └── env_template.txt     # 环境变量模板（请复制为 .env 后填写）
├── frontend/                # React 前端
│   ├── src/                 # 页面、组件、服务、状态管理
│   ├── package.json         # 前端依赖
│   └── vite.config.ts       # 开发代理 → `http://localhost:5000`
├── requirements.txt         # 根目录 Python 依赖（若保留旧环境可忽略）
└── README.md                # 当前文档
```

## 环境准备

1. **Python 3.10+**（推荐 3.12）  
2. **Node.js 18+/npm**  
3. OpenAI API Key（或 DeepSeek API Key）
4. Microsoft Azure 应用（邮箱功能）

### 复制环境变量模板

```
cd backend
copy env_template.txt .env   # Windows
# 或
cp env_template.txt .env     # macOS/Linux
```

请根据实际情况填写 `.env` 中的字段：

| 配置项 | 说明 | 是否必填 |
| --- | --- | --- |
| OPENAI_API_KEY | OpenAI API 密钥 | 与 DEEPSEEK 二选一 |
| OPENAI_MODEL | 默认 `gpt-3.5-turbo`，可根据需要调整 | 可选 |
| DEEPSEEK_API_KEY | DeepSeek API 密钥（填写后优先生效） | 与 OPENAI 二选一 |
| DEEPSEEK_MODEL | 默认 `deepseek-chat`，可根据需要调整 | 可选 |
| DEEPSEEK_BASE_URL | 默认 `https://api.deepseek.com` | 可选 |
| GRAPH_CLIENT_ID | Microsoft Azure 应用的 Client ID | ⚠️ 邮箱功能需要 |
| GRAPH_CLIENT_SECRET | Microsoft Azure 应用的 Client Secret | ⚠️ 邮箱功能需要 |
| GRAPH_TENANT_ID | 租户 ID，公共应用可用 `common` | ⚠️ 邮箱功能需要 |
| GRAPH_REDIRECT_URI | 默认 `http://localhost:5000/api/auth/callback` | ⚠️ 邮箱功能需要 |
| DATABASE_URL | 默认 `sqlite:///hku_assistant.db` | 可选 |

## 快速启动

### 1. 启动后端（Flask）

```bash
cd backend
python -m venv venv          # 可选：创建虚拟环境
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python3 run.py
```

运行后访问 `http://localhost:5000/api/health` 可查看健康检查。

> 也可以使用 `start.bat(start.sh)` 自动创建虚拟环境并安装依赖。

### 2. 启动前端（Vite）

```bash
cd frontend
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`。

Vite 已配置代理 `/api → http://localhost:5000`，确保后端同时运行。

## 功能使用说明

### 登录方式

- **Microsoft 登录**：点击"Microsoft 账号登录"，按照浏览器指引完成 OAuth 授权（需要正确配置 `.env` 中 Graph 字段）。
- **开发者登录**：在调试模式 (`DEBUG=True`) 下，可使用"开发者登录"快速体验，后端会创建 `developer@test.hku` 测试账号并写入 Session。

### 知识库文档导入（仅开发者/管理员）

**注意**：普通用户无法上传文档，仅能通过问答功能检索已导入的知识库。

#### 导入单个文档
```bash
cd backend
python admin_import_documents.py /path/to/document.pdf
```

#### 批量导入目录
```bash
cd backend
python admin_import_documents.py /path/to/documents/
```

导入脚本会自动：
1. 复制文件到 `storage/uploads`
2. 提取文本并分块（默认 1000 字符，重叠 200）
3. 向量化并写入 ChromaDB
4. 在数据库中记录文档元信息

**支持的文件格式**：PDF、DOCX、TXT

### 邮箱集成

1. 在登录阶段完成 Microsoft OAuth。
2. 进入“邮件集成”页面可查看最近邮件、执行关键词搜索。
3. 若访问令牌过期，后端会尝试自动刷新。失败时需重新登录。

### 问答流程

1. 在“智能对话”页面输入问题。
2. 后端并行检索：
   - 知识库：语义搜索向量库。
   - 邮箱：关键词检索（可扩展为向量化）。
3. 将检索结果组装成上下文，调用 LLM（OpenAI / DeepSeek）生成回答。
4. 返回答案与引用的知识库/邮件片段，并记录历史。

## 常见问题

| 问题 | 解决办法 |
| --- | --- |
| 前端提示无法连接 `/api/...` | 确保后端已运行，并且 `frontend/vite.config.ts` 中代理指向 `http://localhost:5000`。 |
| 开发者登录失败 | 确认后端 `DEBUG=True`，并且已重启后端加载新配置。 |
| 邮箱功能无法使用 | 检查 `.env` 中 Graph 字段是否填写正确，Azure 应用是否配置了回调地址与权限 (`User.Read`, `Mail.Read`)。 |
| 文档上传失败 | 确认文件类型/大小符合要求，查看后端日志排查。 |

## 后续计划
-邮箱的api的检索
- 将邮箱检索升级为向量化语义搜索。
- 支持更多文档格式与异步处理。
- 接入更多 LLM 模型（如 DeepSeek）。
