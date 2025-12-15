"""
中间件模块
"""
from flask import session, jsonify
from functools import wraps


def login_required(f):
    """登录验证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({
                'code': 401,
                'message': '请先登录',
                'data': None
            }), 401
        return f(*args, **kwargs)
    return decorated_function


__all__ = ['login_required']

