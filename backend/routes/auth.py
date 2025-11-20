"""
Authentication routes
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from urllib.parse import quote
from database import db, User
from config import Config
from services.email_service import EmailService

auth_bp = Blueprint('auth', __name__)

# Initialize email service
email_service = EmailService(
    client_id=Config.GRAPH_CLIENT_ID,
    client_secret=Config.GRAPH_CLIENT_SECRET,
    tenant_id=Config.GRAPH_TENANT_ID
)


@auth_bp.route('/login', methods=['GET'])
def login():
    """Return Microsoft login URL"""
    try:
        auth_url = email_service.get_auth_url(
            redirect_uri=Config.GRAPH_REDIRECT_URI,
            scopes=Config.GRAPH_SCOPES
        )
        
        return jsonify({
            'code': 0,
            'message': 'OK',
            'data': {
                'auth_url': auth_url
            }
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'Failed to generate login URL: {str(e)}',
            'data': None
        }), 500


@auth_bp.route('/callback', methods=['GET'])
def callback():
    """OAuth callback"""
    try:
        code = request.args.get('code')
        if not code:
            from flask import redirect
            error_msg = quote('Missing authorization code')
            return redirect(f"{Config.FRONTEND_URL}/login?error={error_msg}")
        
        # Exchange authorization code for tokens
        token_result = email_service.get_token_from_code(
            code=code,
            redirect_uri=Config.GRAPH_REDIRECT_URI,
            scopes=Config.GRAPH_SCOPES
        )
        
        if 'error' in token_result:
            from flask import redirect
            error_msg = quote(token_result.get('error_description', 'Unknown error'))
            return redirect(f"{Config.FRONTEND_URL}/login?error={error_msg}")
        
        # Fetch user info
        access_token = token_result['access_token']
        user_info = email_service.get_user_info(access_token)
        
        # Find or create user
        user = User.query.filter_by(email=user_info['mail'] or user_info['userPrincipalName']).first()
        
        if not user:
            user = User(
                email=user_info['mail'] or user_info['userPrincipalName'],
                name=user_info['displayName'],
                microsoft_id=user_info['id']
            )
            db.session.add(user)
        
        # Persist tokens
        user.access_token = token_result['access_token']
        user.refresh_token = token_result.get('refresh_token')
        user.token_expires_at = datetime.fromtimestamp(token_result['expires_in'] + datetime.now().timestamp())
        user.email_connected = True
        user.last_login = datetime.utcnow()
        
        db.session.commit()
        
        # Save session
        session['user_id'] = user.id
        
        # Redirect to frontend callback
        from flask import redirect
        return redirect(f"{Config.FRONTEND_URL}/auth/callback")
        
    except Exception as e:
        db.session.rollback()
        from flask import redirect
        error_msg = quote(str(e))
        return redirect(f"{Config.FRONTEND_URL}/login?error={error_msg}")


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout"""
    session.pop('user_id', None)
    return jsonify({
        'code': 0,
        'message': 'Logged out',
        'data': None
    })


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user"""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({
            'code': 401,
            'message': 'Not authenticated',
            'data': None
        }), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            'code': 404,
            'message': 'User not found',
            'data': None
        }), 404
    
    return jsonify({
        'code': 0,
        'message': 'OK',
        'data': user.to_dict()
    })


@auth_bp.route('/dev-login', methods=['POST'])
def dev_login():
    """Developer login (debug only)"""
    if not Config.DEBUG:
        return jsonify({
            'code': 403,
            'message': 'Developer login is only available in debug mode',
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
            'message': 'Developer login successful',
            'data': {
                'user': user.to_dict(),
                'token': 'session'
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': f'Developer login failed: {str(e)}',
            'data': None
        }), 500

