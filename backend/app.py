"""
HKU 智能助手
"""
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
from datetime import datetime, timedelta
import uuid
import os

from config import Config
from database import db, init_db
from routes import auth_bp, knowledge_bp, email_bp, chat_bp

# 创建 Flask 应用
app = Flask(__name__)
app.config.from_object(Config)

# Session 配置
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './storage/sessions'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # 开发环境设为 False，生产环境设为 True

# 确保 session 目录存在
os.makedirs('./storage/sessions', exist_ok=True)

# 初始化 Session
Session(app)

# 初始化 CORS（支持 credentials）
CORS(app, resources={r"/api/*": {
    "origins": "*",
    "supports_credentials": True
}})

# 初始化数据库
init_db(app)


# 请求拦截器 - 添加请求 ID
@app.before_request
def before_request():
    request.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))


# 响应拦截器 - 添加请求 ID
@app.after_request
def after_request(response):
    if hasattr(request, 'request_id'):
        response.headers['X-Request-ID'] = request.request_id
    return response


# 全局错误处理
@app.errorhandler(Exception)
def handle_error(error):
    """统一错误处理"""
    code = getattr(error, 'code', 500)
    message = str(error) if app.debug else '服务器内部错误'
    
    return jsonify({
        'code': code,
        'message': message,
        'data': None,
        'trace_id': getattr(request, 'request_id', None)
    }), code


# 注册路由
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(knowledge_bp, url_prefix='/api/knowledge')
app.register_blueprint(email_bp, url_prefix='/api/email')
app.register_blueprint(chat_bp, url_prefix='/api/chat')


# 健康检查
@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'code': 0,
        'message': 'OK',
        'data': {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        }
    })


# 根路径
@app.route('/')
def index():
    """根路径"""
    return jsonify({
        'code': 0,
        'message': 'HKU 智能助手 API',
        'data': {
            'service': 'HKU Smart Assistant',
            'version': '1.0.0',
            'status': 'running'
        }
    })


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )

