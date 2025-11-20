"""
Chat routes - Q&A
"""
from flask import Blueprint, request, jsonify, session
from database import db, User, QueryHistory
from config import Config
from services.vector_store import vector_store
from services.email_service import EmailService
from services.rag_service import RAGService

chat_bp = Blueprint('chat', __name__)

# Initialize services
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
    """Core Q&A endpoint"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': 'Not authenticated', 'data': None}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'message': 'User not found', 'data': None}), 404
    
    data = request.get_json()
    question = data.get('question', '').strip()
    
    if not question:
        return jsonify({'code': 400, 'message': 'Question cannot be empty', 'data': None}), 400
    
    try:
        # Retrieval helpers
        def retrieve_knowledge(query):
            """Search knowledge base"""
            try:
                return vector_store.search(query, Config.TOP_K)
            except Exception as e:
                print(f"Knowledge retrieval failed: {e}")
                return []
        
        def retrieve_emails(query):
            """Search mailbox"""
            try:
                if not user.email_connected or not user.access_token:
                    return []
                return email_service.search_emails(user.access_token, query, top=5)
            except Exception as e:
                print(f"Email retrieval failed: {e}")
                return []
        
        # Parallel retrieval
        retrieval_results = RAGService.parallel_retrieve(
            knowledge_retriever=retrieve_knowledge,
            email_retriever=retrieve_emails,
            question=question
        )
        
        knowledge_docs = retrieval_results['knowledge']
        email_docs = retrieval_results['emails']
        
        # Build context
        context = RAGService.build_context(knowledge_docs, email_docs)
        
        # Generate answer
        generation_result = rag_service.generate_answer(question, context)
        answer = generation_result['answer']
        
        # Save history
        query_history = QueryHistory(
            user_id=user_id,
            question=question,
            answer=answer,
            knowledge_sources=[
                {
                    'text': doc['text'][:200],
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
            'message': 'OK',
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
            'message': f'Failed to process question: {str(e)}',
            'data': None
        }), 500


@chat_bp.route('/history', methods=['GET'])
def get_history():
    """Fetch chat history"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': 'Not authenticated', 'data': None}), 401
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    try:
        pagination = QueryHistory.query.filter_by(user_id=user_id)\
            .order_by(QueryHistory.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'code': 0,
            'message': 'OK',
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
            'message': f'Failed to fetch history: {str(e)}',
            'data': None
        }), 500


@chat_bp.route('/history/<int:history_id>', methods=['DELETE'])
def delete_history(history_id):
    """Delete a history entry"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': 'Not authenticated', 'data': None}), 401
    
    try:
        history = QueryHistory.query.filter_by(id=history_id, user_id=user_id).first()
        if not history:
            return jsonify({'code': 404, 'message': 'Record not found', 'data': None}), 404
        
        db.session.delete(history)
        db.session.commit()
        
        return jsonify({
            'code': 0,
            'message': 'Deleted',
            'data': None
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'code': 500,
            'message': f'Failed to delete history: {str(e)}',
            'data': None
        }), 500

