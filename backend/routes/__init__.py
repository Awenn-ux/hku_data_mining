"""
路由模块
"""
from .auth import auth_bp
from .knowledge import knowledge_bp
from .email import email_bp
from .chat import chat_bp

__all__ = ['auth_bp', 'knowledge_bp', 'email_bp', 'chat_bp']

