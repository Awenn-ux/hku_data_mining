"""
Email routes
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from database import db, User
from config import Config
from services.email_service import EmailService

email_bp = Blueprint('email', __name__)

# Initialize email service
email_service = EmailService(
    client_id=Config.GRAPH_CLIENT_ID,
    client_secret=Config.GRAPH_CLIENT_SECRET,
    tenant_id=Config.GRAPH_TENANT_ID
)


@email_bp.route('/search', methods=['POST'])
def search_emails():
    """Search emails"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': 'Not authenticated', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user or not user.email_connected:
        return jsonify({
            'code': 400,
            'message': 'Mailbox not connected',
            'data': None
        }), 400
    
    data = request.get_json()
    keyword = data.get('keyword', '')
    top = data.get('top', 10)
    
    if not keyword:
        return jsonify({'code': 400, 'message': 'Keyword cannot be empty', 'data': None}), 400
    
    try:
        # Refresh token if expired
        if user.token_expires_at and user.token_expires_at < datetime.utcnow():
            if user.refresh_token:
                token_result = email_service.refresh_access_token(
                    user.refresh_token,
                    Config.GRAPH_SCOPES
                )
                user.access_token = token_result['access_token']
                user.token_expires_at = datetime.fromtimestamp(
                    token_result['expires_in'] + datetime.now().timestamp()
                )
                db.session.commit()
            else:
                return jsonify({
                    'code': 401,
                    'message': 'Access token expired, please sign in again',
                    'data': None
                }), 401
        
        # Search emails
        emails = email_service.search_emails(user.access_token, keyword, top)
        
        # Update sync timestamp
        user.email_last_sync = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'code': 0,
            'message': 'OK',
            'data': {
                'emails': emails,
                'count': len(emails)
            }
        })
        
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'Failed to search emails: {str(e)}',
            'data': None
        }), 500


@email_bp.route('/recent', methods=['GET'])
def get_recent_emails():
    """Get recent emails"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': 'Not authenticated', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user or not user.email_connected:
        return jsonify({
            'code': 400,
            'message': 'Mailbox not connected',
            'data': None
        }), 400
    
    top = request.args.get('top', 50, type=int)
    
    try:
        print(f"Fetching emails for {user.email}...")
        print(f"access_token present: {bool(user.access_token)}")
        
        emails = email_service.get_recent_emails(user.access_token, top)
        
        print(f"Fetched {len(emails)} emails")
        
        return jsonify({
            'code': 0,
            'message': 'OK',
            'data': {
                'emails': emails,
                'count': len(emails)
            }
        })
        
    except Exception as e:
        print(f"Failed to fetch emails: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'code': 500,
            'message': f'Failed to retrieve emails: {str(e)}',
            'data': None
        }), 500


@email_bp.route('/status', methods=['GET'])
def get_email_status():
    """Get mailbox status"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': 'Not authenticated', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'message': 'User not found', 'data': None}), 404
    
    return jsonify({
        'code': 0,
        'message': 'OK',
        'data': {
            'connected': user.email_connected,
            'last_sync': user.email_last_sync.isoformat() if user.email_last_sync else None
        }
    })

