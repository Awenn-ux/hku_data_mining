"""
数据库模型和初始化
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


def init_db(app):
    """初始化数据库"""
    db.init_app(app)
    with app.app_context():
        db.create_all()


class User(db.Model):
    """用户表"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    
    # Microsoft 账号信息
    microsoft_id = db.Column(db.String(100), unique=True, index=True)
    
    # OAuth Token 信息
    access_token = db.Column(db.Text)
    refresh_token = db.Column(db.Text)
    token_expires_at = db.Column(db.DateTime)
    
    # 邮箱集成状态
    email_connected = db.Column(db.Boolean, default=False)
    email_last_sync = db.Column(db.DateTime)
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # 关系
    query_history = db.relationship('QueryHistory', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'email_connected': self.email_connected,
            'email_last_sync': self.email_last_sync.isoformat() if self.email_last_sync else None,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class QueryHistory(db.Model):
    """检索历史表"""
    __tablename__ = 'query_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # 问答内容
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    
    # 检索来源
    knowledge_sources = db.Column(db.JSON)  # 知识库来源
    email_sources = db.Column(db.JSON)      # 邮件来源
    
    # 元数据
    model_used = db.Column(db.String(50))   # 使用的模型
    tokens_used = db.Column(db.Integer)     # 使用的 token 数
    response_time = db.Column(db.Float)     # 响应时间（秒）
    
    # 时间戳
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'question': self.question,
            'answer': self.answer,
            'knowledge_sources': self.knowledge_sources,
            'email_sources': self.email_sources,
            'created_at': self.created_at.isoformat()
        }


class Document(db.Model):
    """文档表（用于跟踪上传的文档）"""
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500))
    file_type = db.Column(db.String(10))
    file_size = db.Column(db.Integer)
    
    # 处理状态
    processed = db.Column(db.Boolean, default=False)
    chunks_count = db.Column(db.Integer, default=0)
    
    # 上传信息
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'processed': self.processed,
            'chunks_count': self.chunks_count,
            'uploaded_at': self.uploaded_at.isoformat()
        }

