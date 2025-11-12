"""
管理员文档导入脚本
用于批量导入知识库文档（仅供开发者/管理员使用）
"""
import os
import sys
import uuid
from datetime import datetime

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(__file__))

from app import app
from database import db, Document
from config import Config
from services.document_processor import document_processor
from services.vector_store import vector_store


def import_document(file_path: str, user_id: int = 1) -> bool:
    """
    导入单个文档到知识库
    
    Args:
        file_path: 文档的完整路径
        user_id: 上传用户ID（默认1，可改为管理员ID）
        
    Returns:
        bool: 导入成功返回 True
    """
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False
    
    filename = os.path.basename(file_path)
    file_ext = os.path.splitext(filename)[1].lower()
    
    # 检查文件类型
    if file_ext.lstrip('.') not in Config.ALLOWED_EXTENSIONS:
        print(f"❌ 不支持的文件类型: {file_ext}")
        print(f"   支持的类型: {', '.join(Config.ALLOWED_EXTENSIONS)}")
        return False
    
    try:
        # 复制文件到 storage/uploads
        dest_filename = f"{uuid.uuid4()}_{filename}"
        dest_path = os.path.join(Config.UPLOAD_FOLDER, dest_filename)
        
        import shutil
        shutil.copy2(file_path, dest_path)
        print(f"✓ 文件已复制到: {dest_path}")
        
        file_size = os.path.getsize(dest_path)
        file_type = file_ext.lstrip('.')
        
        # 创建文档记录
        doc = Document(
            filename=filename,
            file_path=dest_path,
            file_type=file_type,
            file_size=file_size,
            uploaded_by=user_id,
            uploaded_at=datetime.utcnow()
        )
        db.session.add(doc)
        db.session.commit()
        print(f"✓ 数据库记录已创建 (ID: {doc.id})")
        
        # 处理文档：提取文本并分块
        print(f"⏳ 正在处理文档...")
        chunks = document_processor.process_document(
            file_path=dest_path,
            filename=filename,
            chunk_size=Config.CHUNK_SIZE,
            overlap=Config.CHUNK_OVERLAP
        )
        print(f"✓ 文档已分块，共 {len(chunks)} 个片段")
        
        # 添加到向量库
        print(f"⏳ 正在写入向量库...")
        texts = [chunk['text'] for chunk in chunks]
        metadatas = [
            {**chunk['metadata'], 'document_id': str(doc.id)}
            for chunk in chunks
        ]
        ids = [f"doc_{doc.id}_chunk_{i}" for i in range(len(chunks))]
        
        vector_store.add_documents(texts, metadatas, ids)
        print(f"✓ 向量已写入 ChromaDB")
        
        # 更新文档状态
        doc.processed = True
        doc.chunks_count = len(chunks)
        db.session.commit()
        
        print(f"✅ 导入成功: {filename}")
        print(f"   文档ID: {doc.id}, 分块数: {len(chunks)}")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ 导入失败: {str(e)}")
        # 清理已创建的文件
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False


def import_directory(directory: str) -> dict:
    """
    批量导入目录下的所有文档
    
    Args:
        directory: 文档目录路径
        
    Returns:
        dict: 导入统计信息
    """
    if not os.path.isdir(directory):
        print(f"❌ 目录不存在: {directory}")
        return {'success': 0, 'failed': 0}
    
    stats = {'success': 0, 'failed': 0, 'total': 0}
    
    print(f"\n📂 扫描目录: {directory}")
    print("=" * 60)
    
    for root, dirs, files in os.walk(directory):
        for filename in files:
            file_ext = os.path.splitext(filename)[1].lower()
            if file_ext.lstrip('.') in Config.ALLOWED_EXTENSIONS:
                file_path = os.path.join(root, filename)
                stats['total'] += 1
                
                print(f"\n[{stats['total']}] 导入: {filename}")
                if import_document(file_path):
                    stats['success'] += 1
                else:
                    stats['failed'] += 1
    
    print("\n" + "=" * 60)
    print(f"📊 导入统计:")
    print(f"   总文档数: {stats['total']}")
    print(f"   成功: {stats['success']}")
    print(f"   失败: {stats['failed']}")
    return stats


def main():
    """主函数"""
    print("=" * 60)
    print("HKU 智能助手 - 知识库文档导入工具")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("\n用法:")
        print("  导入单个文件:")
        print("    python admin_import_documents.py /path/to/document.pdf")
        print("\n  批量导入目录:")
        print("    python admin_import_documents.py /path/to/documents/")
        print("\n支持的文件类型:", ", ".join(Config.ALLOWED_EXTENSIONS))
        sys.exit(1)
    
    target = sys.argv[1]
    
    # 确保向量库已初始化
    vector_store.initialize()
    
    with app.app_context():
        if os.path.isfile(target):
            # 导入单个文件
            success = import_document(target)
            sys.exit(0 if success else 1)
        elif os.path.isdir(target):
            # 批量导入目录
            stats = import_directory(target)
            sys.exit(0 if stats['failed'] == 0 else 1)
        else:
            print(f"❌ 路径不存在: {target}")
            sys.exit(1)


if __name__ == '__main__':
    main()

