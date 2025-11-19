"""
认证路由
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from database import db, User
from config import Config
from services.email_service import EmailService

auth_bp = Blueprint('auth', __name__)

# 初始化邮箱服务
email_service = EmailService(
    client_id=Config.GRAPH_CLIENT_ID,
    client_secret=Config.GRAPH_CLIENT_SECRET,
    tenant_id=Config.GRAPH_TENANT_ID
)


@auth_bp.route('/login', methods=['GET'])
def login():
    """获取 Microsoft 登录 URL"""
    try:
        auth_url = email_service.get_auth_url(
            redirect_uri=Config.GRAPH_REDIRECT_URI,
            scopes=Config.GRAPH_SCOPES
        )
        
        return jsonify({
            'code': 0,
            'message': '成功',
            'data': {
                'auth_url': auth_url
            }
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'获取登录 URL 失败: {str(e)}',
            'data': None
        }), 500


@auth_bp.route('/callback', methods=['GET'])
def callback():
    """OAuth 回调"""
    try:
        code = request.args.get('code')
        if not code:
            # 重定向到前端登录页，带错误信息
            from flask import redirect
            return redirect(f"{Config.FRONTEND_URL}/login?error=missing_code")
        
        # 使用授权码获取 token
        token_result = email_service.get_token_from_code(
            code=code,
            redirect_uri=Config.GRAPH_REDIRECT_URI,
            scopes=Config.GRAPH_SCOPES
        )
        
        if 'error' in token_result:
            # 重定向到前端登录页，带错误信息
            from flask import redirect
            error_msg = token_result.get('error_description', '未知错误')
            return redirect(f"{Config.FRONTEND_URL}/login?error={error_msg}")
        
        # 获取用户信息
        access_token = token_result['access_token']
        user_info = email_service.get_user_info(access_token)
        
        # 查找或创建用户
        user = User.query.filter_by(email=user_info['mail'] or user_info['userPrincipalName']).first()
        
        if not user:
            user = User(
                email=user_info['mail'] or user_info['userPrincipalName'],
                name=user_info['displayName'],
                microsoft_id=user_info['id']
            )
            db.session.add(user)
        
        # 更新 token 信息
        user.access_token = token_result['access_token']
        user.refresh_token = token_result.get('refresh_token')
        user.token_expires_at = datetime.fromtimestamp(token_result['expires_in'] + datetime.now().timestamp())
        user.email_connected = True
        user.last_login = datetime.utcnow()
        
        db.session.commit()
        
        # 保存用户 ID 到 session
        session['user_id'] = user.id
        
        # 成功后重定向到前端回调页面，让前端重新获取用户信息
        from flask import redirect
        return redirect(f"{Config.FRONTEND_URL}/auth/callback")
        
    except Exception as e:
        db.session.rollback()
        # 重定向到前端登录页，带错误信息
        from flask import redirect
        return redirect(f"{Config.FRONTEND_URL}/login?error={str(e)}")


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """登出"""
    session.pop('user_id', None)
    return jsonify({
        'code': 0,
        'message': '登出成功',
        'data': None
    })


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """获取当前用户信息"""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({
            'code': 401,
            'message': '未登录',
            'data': None
        }), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            'code': 404,
            'message': '用户不存在',
            'data': None
        }), 404
    
    return jsonify({
        'code': 0,
        'message': '成功',
        'data': user.to_dict()
    })


@auth_bp.route('/dev-login', methods=['POST'])
def dev_login():
    """开发者登录（仅限调试环境使用）"""
    if not Config.DEBUG:
        return jsonify({
            'code': 403,
            'message': '开发者登录仅在调试模式下可用',
            'data': None
        }), 403

    try:
        dev_email = 'developer@test.hku'
        user = User.query.filter_by(email=dev_email).first()

        if not user:
            user = User(
                email=dev_email,
                name='Developer User',
                email_connected=False
            )
            db.session.add(user)
            db.session.commit()

        session['user_id'] = user.id

        return jsonify({
            'code': 0,
            'message': '开发者登录成功',
            'data': {
                'user': user.to_dict(),
                'token': 'session'
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': f'开发者登录失败: {str(e)}',
            'data': None
        }), 500

