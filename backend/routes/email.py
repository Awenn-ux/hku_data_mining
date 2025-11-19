"""
邮箱路由
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from database import db, User
from config import Config
from services.email_service import EmailService
from utils.email_token import ensure_valid_access_token

email_bp = Blueprint('email', __name__)

# 初始化邮箱服务
email_service = EmailService(
    client_id=Config.GRAPH_CLIENT_ID,
    client_secret=Config.GRAPH_CLIENT_SECRET,
    tenant_id=Config.GRAPH_TENANT_ID
)


@email_bp.route('/search', methods=['POST'])
def search_emails():
    """搜索邮件"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user or not user.email_connected:
        return jsonify({
            'code': 400,
            'message': '邮箱未连接',
            'data': None
        }), 400
    
    data = request.get_json()
    keyword = data.get('keyword', '')
    top = data.get('top', 10)
    
    if not keyword:
        return jsonify({'code': 400, 'message': '关键词不能为空', 'data': None}), 400
    
    try:
        ok, error_msg = ensure_valid_access_token(user, email_service)
        if not ok:
            return jsonify({
                'code': 401,
                'message': error_msg or 'Token 无效，请重新登录',
                'data': None
            }), 401

        # 搜索邮件
        emails = email_service.search_emails(user.access_token, keyword, top)
        
        # 更新最后同步时间
        user.email_last_sync = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'code': 0,
            'message': '搜索成功',
            'data': {
                'emails': emails,
                'count': len(emails)
            }
        })
        
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'搜索邮件失败: {str(e)}',
            'data': None
        }), 500


@email_bp.route('/recent', methods=['GET'])
def get_recent_emails():
    """获取最近的邮件"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user or not user.email_connected:
        return jsonify({
            'code': 400,
            'message': '邮箱未连接',
            'data': None
        }), 400
    
    top = request.args.get('top', 50, type=int)
    
    try:
        ok, error_msg = ensure_valid_access_token(user, email_service)
        if not ok:
            return jsonify({
                'code': 401,
                'message': error_msg or 'Token 无效，请重新登录',
                'data': None
            }), 401

        print(f"正在获取用户 {user.email} 的邮件...")
        print(f"access_token存在: {bool(user.access_token)}")
        
        emails = email_service.get_recent_emails(user.access_token, top)
        
        print(f"成功获取 {len(emails)} 封邮件")
        
        return jsonify({
            'code': 0,
            'message': '成功',
            'data': {
                'emails': emails,
                'count': len(emails)
            }
        })
        
    except Exception as e:
        print(f"获取邮件异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'code': 500,
            'message': f'获取邮件失败: {str(e)}',
            'data': None
        }), 500


@email_bp.route('/status', methods=['GET'])
def get_email_status():
    """获取邮箱连接状态"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'message': '用户不存在', 'data': None}), 404
    
    return jsonify({
        'code': 0,
        'message': '成功',
        'data': {
            'connected': user.email_connected,
            'last_sync': user.email_last_sync.isoformat() if user.email_last_sync else None
        }
    })

