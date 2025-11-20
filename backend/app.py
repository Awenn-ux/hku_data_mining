"""
HKU Smart Assistant
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

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Session configuration
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './storage/sessions'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production

# Ensure session directory exists
os.makedirs('./storage/sessions', exist_ok=True)

# Initialize session store
Session(app)

# Enable CORS with credentials
CORS(app, resources={r"/api/*": {
    "origins": "*",
    "supports_credentials": True
}})

# Initialize database
init_db(app)


# Request hook - add request ID
@app.before_request
def before_request():
    request.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))


# Response hook - append request ID header
@app.after_request
def after_request(response):
    if hasattr(request, 'request_id'):
        response.headers['X-Request-ID'] = request.request_id
    return response


# Global error handler
@app.errorhandler(Exception)
def handle_error(error):
    """Centralized error handling"""
    code = getattr(error, 'code', 500)
    message = str(error) if app.debug else 'Internal server error'
    
    return jsonify({
        'code': code,
        'message': message,
        'data': None,
        'trace_id': getattr(request, 'request_id', None)
    }), code


# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(knowledge_bp, url_prefix='/api/knowledge')
app.register_blueprint(email_bp, url_prefix='/api/email')
app.register_blueprint(chat_bp, url_prefix='/api/chat')


# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'code': 0,
        'message': 'Service healthy',
        'data': {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        }
    })


# Root endpoint
@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        'code': 0,
        'message': 'HKU Smart Assistant API',
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

