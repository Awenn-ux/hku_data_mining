"""
Knowledge base routes
"""
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
import os
import uuid
from database import db, User, Document
from config import Config
from services.document_processor import document_processor
from services.vector_store import vector_store

knowledge_bp = Blueprint('knowledge', __name__)

# Initialize vector store
vector_store.initialize()


def allowed_file(filename):
    """Check whether file type is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


@knowledge_bp.route('/upload', methods=['POST'])
def upload_document():
    """Upload document to knowledge base (developer only)"""
    # Disabled for end users; docs managed via admin tooling
    return jsonify({
        'code': 403,
        'message': 'Document upload is disabled, please contact an administrator',
        'data': None
    }), 403
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': 'Not authenticated', 'data': None}), 401
    
    # Validate file
    if 'file' not in request.files:
        return jsonify({'code': 400, 'message': 'No file provided', 'data': None}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'code': 400, 'message': 'Filename is empty', 'data': None}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'code': 400,
            'message': f'Unsupported file type. Allowed: {", ".join(Config.ALLOWED_EXTENSIONS)}',
            'data': None
        }), 400
    
    try:
        # 保存文件
        filename = secure_filename(file.filename)
        file_path = os.path.join(Config.UPLOAD_FOLDER, f"{uuid.uuid4()}_{filename}")
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        file_type = filename.rsplit('.', 1)[1].lower()
        
        # 创建文档记录
        doc = Document(
            filename=filename,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
            uploaded_by=user_id
        )
        db.session.add(doc)
        db.session.commit()
        
        # 处理文档：提取文本并分块
        chunks = document_processor.process_document(
            file_path=file_path,
            filename=filename,
            chunk_size=Config.CHUNK_SIZE,
            overlap=Config.CHUNK_OVERLAP
        )
        
        # 添加到向量库
        texts = [chunk['text'] for chunk in chunks]
        metadatas = [
            {**chunk['metadata'], 'document_id': str(doc.id)}
            for chunk in chunks
        ]
        ids = [f"doc_{doc.id}_chunk_{i}" for i in range(len(chunks))]
        
        vector_store.add_documents(texts, metadatas, ids)
        
        # 更新文档状态
        doc.processed = True
        doc.chunks_count = len(chunks)
        db.session.commit()
        
        return jsonify({
            'code': 0,
            'message': '文档上传成功',
            'data': {
                'document': doc.to_dict(),
                'chunks_count': len(chunks)
            }
        })
        
    except Exception as e:
        db.session.rollback()
        # 删除已保存的文件
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return jsonify({
            'code': 500,
            'message': f'上传失败: {str(e)}',
            'data': None
        }), 500


@knowledge_bp.route('/documents', methods=['GET'])
def list_documents():
    """获取文档列表"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    try:
        # 获取所有文档（或只获取该用户上传的）
        documents = Document.query.order_by(Document.uploaded_at.desc()).all()
        
        return jsonify({
            'code': 0,
            'message': '成功',
            'data': {
                'documents': [doc.to_dict() for doc in documents],
                'total': len(documents)
            }
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'获取文档列表失败: {str(e)}',
            'data': None
        }), 500


@knowledge_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    """删除文档"""
    # 禁用用户端删除
    return jsonify({
        'code': 403,
        'message': '文档删除已禁用，请联系管理员',
        'data': None
    }), 403
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    try:
        doc = Document.query.get(doc_id)
        if not doc:
            return jsonify({'code': 404, 'message': '文档不存在', 'data': None}), 404
        
        # 从向量库删除
        vector_store.delete_by_document_id(str(doc_id))
        
        # 删除文件
        if doc.file_path and os.path.exists(doc.file_path):
            os.remove(doc.file_path)
        
        # 删除数据库记录
        db.session.delete(doc)
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


@knowledge_bp.route('/search', methods=['POST'])
def search_knowledge():
    """搜索知识库"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    data = request.get_json()
    query = data.get('query', '')
    top_k = data.get('top_k', Config.TOP_K)
    
    if not query:
        return jsonify({'code': 400, 'message': '查询内容不能为空', 'data': None}), 400
    
    try:
        results = vector_store.search(query, top_k)
        
        return jsonify({
            'code': 0,
            'message': '搜索成功',
            'data': {
                'results': results,
                'count': len(results)
            }
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'搜索失败: {str(e)}',
            'data': None
        }), 500


@knowledge_bp.route('/stats', methods=['GET'])
def get_stats():
    """获取知识库统计信息"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'code': 401, 'message': '未登录', 'data': None}), 401
    
    try:
        doc_count = Document.query.count()
        vector_count = vector_store.get_count()
        
        return jsonify({
            'code': 0,
            'message': '成功',
            'data': {
                'documents_count': doc_count,
                'vectors_count': vector_count
            }
        })
    except Exception as e:
        return jsonify({
            'code': 500,
            'message': f'获取统计信息失败: {str(e)}',
            'data': None
        }), 500

