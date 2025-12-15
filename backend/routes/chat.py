"""
Chat routes - Q&A
"""
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from database import db, User, QueryHistory
from config import Config
from services.vector_store import vector_store, email_vector_store
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
    
    # 用于收集处理步骤
    processing_steps = []
    
    def add_step(step: str, status: str = 'info'):
        """添加处理步骤"""
        processing_steps.append({
            'step': step,
            'status': status,  # 'info', 'success', 'warning', 'error'
            'timestamp': datetime.utcnow().isoformat()
        })
        print(f"[{status.upper()}] {step}")
    
    try:
        # Retrieval helpers
        def retrieve_knowledge(query):
            """Search knowledge base"""
            try:
                add_step(f"正在搜索知识库: '{query}'", 'info')
                results = vector_store.search(query, Config.TOP_K)
                add_step(f"知识库搜索完成，找到 {len(results)} 条相关文档", 'success')
                return results
            except Exception as e:
                add_step(f"知识库搜索失败: {str(e)}", 'error')
                print(f"Knowledge retrieval failed: {e}")
                return []
        
        def retrieve_emails(query):
            """Search mailbox using vector similarity (RAG)"""
            try:
                if not user.email_connected or not user.access_token:
                    add_step("邮件检索跳过: 用户邮箱未连接", 'warning')
                    return []
                
                # 使用向量相似度搜索邮件（RAG方式）
                add_step(f"使用向量搜索邮件，查询: '{query}'", 'info')
                # 不设置上限，返回所有符合条件的邮件
                emails = email_vector_store.search_emails(query, user_id, top_k=None)
                
                # 显示找到的邮件主题和相似度
                if emails:
                    email_info = ", ".join([f"{e.get('subject', '')[:30]}...({e.get('similarity', 0):.0%})" for e in emails[:3]])
                    add_step(f"向量搜索完成，找到 {len(emails)} 封相关邮件: {email_info}", 'success')
                else:
                    add_step(f"向量搜索完成，找到 {len(emails)} 封相关邮件", 'warning')
                
                # 如果向量搜索没有结果，尝试同步邮件后再搜索
                if not emails or len(emails) == 0:
                    add_step("向量搜索无结果，尝试同步邮件到向量库...", 'info')
                    try:
                        # 同步最近100封邮件到向量库
                        add_step("正在同步邮件到向量库...", 'info')
                        synced = email_vector_store.sync_user_emails(
                            email_service, user.access_token, user_id, limit=100
                        )
                        add_step(f"同步了 {synced} 封邮件到向量库", 'success')
                        
                        # 再次尝试向量搜索
                        add_step("同步后再次进行向量搜索...", 'info')
                        emails = email_vector_store.search_emails(query, user_id, top_k=None)
                        add_step(f"同步后向量搜索完成，找到 {len(emails)} 封相关邮件", 'success' if emails else 'warning')
                    except Exception as sync_error:
                        add_step(f"同步邮件失败: {str(sync_error)}", 'error')
                        print(f"同步邮件失败: {sync_error}")
                
                return emails
            except Exception as e:
                add_step(f"邮件检索失败: {str(e)}", 'error')
                print(f"邮件检索失败: {e}")
                import traceback
                traceback.print_exc()
                return []
        
        # Parallel retrieval
        add_step("开始并行检索知识库和邮箱...", 'info')
        retrieval_results = RAGService.parallel_retrieve(
            knowledge_retriever=retrieve_knowledge,
            email_retriever=retrieve_emails,
            question=question
        )
        
        knowledge_docs = retrieval_results['knowledge']
        email_docs = retrieval_results['emails']
        
        add_step(f"检索完成: 知识库 {len(knowledge_docs)} 条，邮箱 {len(email_docs)} 封", 'success')
        
        # Build context
        add_step("正在构建上下文...", 'info')
        context = RAGService.build_context(knowledge_docs, email_docs)
        
        # Generate answer
        add_step("正在生成回答...", 'info')
        generation_result = rag_service.generate_answer(question, context)
        answer = generation_result['answer']
        add_step("回答生成完成", 'success')
        
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
                'processing_steps': processing_steps,  # 添加处理步骤
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

