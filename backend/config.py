"""
应用配置
"""
import os
from datetime import timedelta


class Config:
    """应用配置类"""
    
    # 基础配置
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///hku_assistant.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT 配置
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    
    # OpenAI API 配置
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')

    # DeepSeek API 配置
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
    DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')
    DEEPSEEK_BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
    
    # Microsoft Graph API 配置
    GRAPH_CLIENT_ID = os.getenv('GRAPH_CLIENT_ID', '')
    GRAPH_CLIENT_SECRET = os.getenv('GRAPH_CLIENT_SECRET', '')
    GRAPH_TENANT_ID = os.getenv('GRAPH_TENANT_ID', 'common')
    GRAPH_REDIRECT_URI = os.getenv('GRAPH_REDIRECT_URI', 'http://localhost:5000/api/auth/callback')
    GRAPH_SCOPES = ['User.Read', 'Mail.Read']
    
    # 向量数据库配置（使用 ChromaDB）
    CHROMA_PERSIST_DIR = os.getenv('CHROMA_PERSIST_DIR', './storage/chroma')
    CHROMA_COLLECTION_NAME = 'hku_knowledge_base'
    
    # 文档处理配置
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './storage/uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
    
    # RAG 配置
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    TOP_K = 5
    
    # 确保必要的目录存在
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

