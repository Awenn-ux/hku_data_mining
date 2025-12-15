## Flask 后端说明

本目录包含 HKU 智能助手后端服务，基于 Flask + SQLAlchemy 实现，负责认证、知识库管理、邮箱集成与问答流程。

## 环境配置

1. 复制环境变量模板：
   ```
   copy env_template.txt .env    # Windows
   # 或
   cp env_template.txt .env      # macOS/Linux
   ```
2. 按需填写 `.env` 中的字段：
   - `OPENAI_API_KEY` 或 `DEEPSEEK_API_KEY`（至少选其一）
   - `GRAPH_CLIENT_ID` / `GRAPH_CLIENT_SECRET` / `GRAPH_TENANT_ID`（使用邮箱功能时必填）
   - 其他字段可保持默认或按需调整。

## 启动方式

```bash
python -m venv venv          # 可选
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python run.py
```

或直接执行 `start.bat / start.sh` 一键启动。

启动后默认监听 `http://localhost:5000`，可访问 `/api/health` 检查健康状态。

## 核心模块

| 模块 | 说明 |
| --- | --- |
| `app.py` | Flask 应用入口，配置 Session、CORS、蓝图注册。 |
| `config.py` | 读取 .env，定义默认配置（数据库、LLM、Graph、RAG 参数等）。 |
| `database.py` | SQLAlchemy 初始化与模型定义（User、QueryHistory、Document）。 |
| `routes/` | 各业务路由（认证、知识库、邮箱、问答）。 |
| `services/` | 业务逻辑封装（向量库、文档处理、邮箱 API、LLM 调用）。 |
| `middleware/` | 可复用的装饰器，如登录校验。 |

## 数据模型

- **User**
  - email / name / microsoft_id
  - access_token / refresh_token / token_expires_at
  - email_connected / email_last_sync
  - created_at / updated_at / last_login
- **QueryHistory**
  - user_id
  - question / answer
  - knowledge_sources / email_sources（JSON）
  - model_used / tokens_used / response_time / created_at
- **Document**
  - filename / file_path / file_type / file_size
  - processed / chunks_count
  - uploaded_by / uploaded_at

## 主要接口

### 认证
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/auth/login` | 获取 Microsoft OAuth 登录地址 |
| GET | `/api/auth/callback` | OAuth 回调，完成授权并保存用户 |
| POST | `/api/auth/logout` | 登出，清理 Session |
| GET | `/api/auth/me` | 获取当前登录用户信息 |
| POST | `/api/auth/dev-login` | 开发者登录（仅 DEBUG 模式可用） |

### 知识库
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/knowledge/upload` | 上传文档（已禁用，仅供管理员通过脚本导入） |
| GET | `/api/knowledge/documents` | 文档列表（只读） |
| DELETE | `/api/knowledge/documents/{id}` | 删除文档（已禁用） |
| POST | `/api/knowledge/search` | 语义检索（用户可用） |
| GET | `/api/knowledge/stats` | 向量库统计 |

### 邮箱
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/email/search` | 关键词搜索邮件 |
| GET | `/api/email/recent` | 最近邮件列表 |
| GET | `/api/email/status` | 邮箱连接状态 |

### 问答
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/chat/ask` | 智能问答入口 |
| GET | `/api/chat/history` | 查询历史记录 |
| DELETE | `/api/chat/history/{id}` | 删除某条历史 |

### 系统
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/` | 基本信息 |

## 知识库文档导入


### 导入单个文档
```bash
python admin_import_documents.py /path/to/document.pdf
```

### 批量导入目录
```bash
python admin_import_documents.py knowledge_base/
```

导入脚本支持 PDF、DOCX、TXT 格式，会自动：
1. 复制文件到 `storage/uploads`
2. 提取文本并分块（Chunk Size: 1000, Overlap: 200）
3. 向量化并存入 ChromaDB
4. 在数据库中记录元信息

详细说明请参考 `knowledge_base/README.md`。


## 测试脚本

执行 `python test_api.py` 可快速验证基础接口：

```bash
python test_api.py
```


