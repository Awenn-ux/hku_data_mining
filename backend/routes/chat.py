"""
聊天路由 - 问答功能
"""
from flask import Blueprint, request, jsonify, session
from database import db, User, QueryHistory
from config import Config
from services.vector_store import vector_store
from services.email_service import EmailService
from services.rag_service import RAGService
from utils.email_token import ensure_valid_access_token

chat_bp = Blueprint('chat', __name__)

# 初始化服务
email_service = EmailService(
    client_id=Config.GRAPH_CLIENT_ID,
    client_secret=Config.GRAPH_CLIENT_SECRET,
    tenant_id=Config.GRAPH_TENANT_ID
)

rag_service = RAGService(
    openai_api_key=Config.OPENAI_API_KEY,
    openai_model=Config.OPENAI_MODEL,
    deepseek_api_key=Config.DEEPSEEK_API_KEY,
    deepseek_model=Config.DEEPSEEK_MODEL,
    deepseek_base_url=Config.DEEPSEEK_BASE_URL
)


@chat_bp.route('/ask', methods=['POST'])
def ask_question():
    """提问接口 - 核心问答流程"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'message': '用户不存在', 'data': None}), 404
    
    data = request.get_json()
    question = data.get('question', '').strip()
    
    if not question:
        return jsonify({'code': 400, 'message': '问题不能为空', 'data': None}), 400
    
    try:
        # 定义检索函数
        def retrieve_knowledge(query):
            """检索知识库"""
            try:
                return vector_store.search(query, Config.TOP_K)
            except Exception as e:
                print(f"知识库检索出错: {e}")
                return []
        
        ok_token = False
        token_error = None
        if user.email_connected:
            ok_token, token_error = ensure_valid_access_token(user, email_service)

        def retrieve_emails(query):
            """检索邮箱"""
            try:
                if not user.email_connected or not user.access_token or not ok_token:
                    return []
                return email_service.search_emails(user.access_token, query, top=5)
            except Exception as e:
                print(f"邮箱检索出错: {e}")
                return []
        
        # 并行检索知识库和邮箱
        retrieval_results = RAGService.parallel_retrieve(
            knowledge_retriever=retrieve_knowledge,
            email_retriever=retrieve_emails,
            question=question
        )
        
        knowledge_docs = retrieval_results['knowledge']
        email_docs = retrieval_results['emails']
        if user.email_connected and not ok_token and token_error:
            print(f"邮箱检索跳过：{token_error}")
        
        # 构建上下文
        context = RAGService.build_context(knowledge_docs, email_docs)
        
        # 使用 LLM 生成答案
        generation_result = rag_service.generate_answer(question, context)
        answer = generation_result['answer']
        
        # 保存到历史记录
        query_history = QueryHistory(
            user_id=user_id,
            question=question,
            answer=answer,
            knowledge_sources=[
                {
                    'text': doc['text'][:200],  # 只保存前200字符
                    'source': doc.get('metadata', {}).get('filename', 'unknown')
                }
                for doc in knowledge_docs[:3]
            ],
            email_sources=[
                {
                    'subject': email.get('subject', ''),
                    'from': email.get('from', ''),
                    'preview': email.get('preview', '')[:200]
                }
                for email in email_docs[:3]
            ],
            model_used=generation_result.get('model'),
            tokens_used=generation_result.get('tokens_used'),
            response_time=generation_result.get('response_time')
        )
        db.session.add(query_history)
        db.session.commit()
        
        return jsonify({
            'code': 0,
            'message': '成功',
            'data': {
                'answer': answer,
                'sources': {
                    'knowledge': [
                        {
                            'source': doc.get('metadata', {}).get('filename', 'unknown'),
                            'text': doc['text'][:200] + '...' if len(doc['text']) > 200 else doc['text']
                        }
                        for doc in knowledge_docs[:3]
                    ],
                    'emails': [
                        {
                            'subject': email.get('subject', ''),
                            'from': email.get('from', ''),
                            'date': email.get('date', ''),
                            'preview': email.get('preview', '')[:150] + '...' if len(email.get('preview', '')) > 150 else email.get('preview', '')
                        }
                        for email in email_docs[:3]
                    ]
                },
                'metadata': {
                    'model': generation_result.get('model'),
                    'tokens_used': generation_result.get('tokens_used'),
                    'response_time': round(generation_result.get('response_time', 0), 2)
                }
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': f'问答失败: {str(e)}',
            'data': None
        }), 500


@chat_bp.route('/history', methods=['GET'])
def get_history():
    """获取聊天历史"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    try:
        pagination = QueryHistory.query.filter_by(user_id=user_id)\
            .order_by(QueryHistory.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'code': 0,
            'message': '成功',
            'data': {
                'history': [item.to_dict() for item in pagination.items],
                'total': pagination.total,
                'page': page,
                'per_page': per_page,
                'pages': pagination.pages
            }
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'获取历史记录失败: {str(e)}',
            'data': None
        }), 500


@chat_bp.route('/history/<int:history_id>', methods=['DELETE'])
def delete_history(history_id):
    """删除历史记录"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    try:
        history = QueryHistory.query.filter_by(id=history_id, user_id=user_id).first()
        if not history:
            return jsonify({'code': 404, 'message': '记录不存在', 'data': None}), 404
        
        db.session.delete(history)
        db.session.commit()
        
        return jsonify({
            'code': 0,
            'message': '删除成功',
            'data': None
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': f'删除失败: {str(e)}',
            'data': None
        }), 500

