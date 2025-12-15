"""
向量存储服务 - 使用 ChromaDB
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict
from config import Config
import logging

logger = logging.getLogger(__name__)


class VectorStore:
    """向量存储管理"""
    
    def __init__(self):
        self.client = None
        self.collection = None
        
    def initialize(self):
        """初始化向量数据库"""
        try:
            # ChromaDB 0.4.22 使用 PersistentClient 支持持久化存储
            # 尝试使用 PersistentClient（推荐方式）
            try:
                self.client = chromadb.PersistentClient(
                    path=Config.CHROMA_PERSIST_DIR
                )
            except (AttributeError, TypeError):
                # 如果 PersistentClient 不存在或参数不匹配，尝试使用 Client + Settings
                self.client = chromadb.Client(Settings(
                    persist_directory=Config.CHROMA_PERSIST_DIR,
                    anonymized_telemetry=False
                ))
            
            # 获取或创建集合
            self.collection = self.client.get_or_create_collection(
                name=Config.CHROMA_COLLECTION_NAME,
                metadata={"description": "HKU 知识库"}
            )
            logger.info(f"ChromaDB 初始化成功，集合: {Config.CHROMA_COLLECTION_NAME}")
        except Exception as e:
            logger.error(f"ChromaDB 初始化失败: {str(e)}")
            raise
        
    def add_documents(self, texts: List[str], metadatas: List[Dict], ids: List[str]):
        """添加文档到向量库"""
        if not self.collection:
            self.initialize()
        
        # 验证输入
        if not texts or len(texts) == 0:
            raise ValueError("文本列表不能为空")
        
        if len(texts) != len(metadatas) or len(texts) != len(ids):
            raise ValueError("texts、metadatas 和 ids 的长度必须一致")
        
        # 过滤空文本
        valid_texts = []
        valid_metadatas = []
        valid_ids = []
        
        for i, text in enumerate(texts):
            if text and text.strip():  # 确保文本不为空
                valid_texts.append(text.strip())
                valid_metadatas.append(metadatas[i])
                valid_ids.append(ids[i])
            else:
                logger.warning(f"跳过空文本块，ID: {ids[i]}")
        
        if not valid_texts:
            raise ValueError("所有文本块都为空，无法添加到向量库")
        
        try:
            self.collection.add(
                documents=valid_texts,
                metadatas=valid_metadatas,
                ids=valid_ids
            )
            logger.info(f"成功添加 {len(valid_texts)} 个文档块到向量库")
        except Exception as e:
            logger.error(f"添加文档到向量库失败: {str(e)}")
            raise
        
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """语义搜索"""
        if not self.collection:
            self.initialize()
            
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )
        
        # 格式化结果
        documents = []
        if results['documents'] and len(results['documents']) > 0:
            for i, doc in enumerate(results['documents'][0]):
                documents.append({
                    'text': doc,
                    'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                    'distance': results['distances'][0][i] if results['distances'] else 0
                })
                
        return documents
    
    def delete_by_document_id(self, document_id: str):
        """根据文档ID删除所有相关的chunks"""
        if not self.collection:
            self.initialize()
            
        # ChromaDB 支持通过 where 条件删除
        self.collection.delete(
            where={"document_id": document_id}
        )
    
    def get_count(self) -> int:
        """获取向量库中的文档数量"""
        if not self.collection:
            self.initialize()
        return self.collection.count()


# 全局实例
vector_store = VectorStore()


class EmailVectorStore:
    """邮件向量存储管理 - 使用独立的 ChromaDB 集合存储邮件"""
    
    def __init__(self):
        self.client = None
        self.collection = None
        self.collection_name = 'hku_emails'
        
    def initialize(self):
        """初始化邮件向量数据库"""
        try:
            try:
                self.client = chromadb.PersistentClient(
                    path=Config.CHROMA_PERSIST_DIR
                )
            except (AttributeError, TypeError):
                self.client = chromadb.Client(Settings(
                    persist_directory=Config.CHROMA_PERSIST_DIR,
                    anonymized_telemetry=False
                ))
            
            # 获取或创建邮件集合
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "HKU 邮件向量库"}
            )
            logger.info(f"邮件向量库初始化成功，集合: {self.collection_name}")
        except Exception as e:
            logger.error(f"邮件向量库初始化失败: {str(e)}")
            raise
    
    def add_email(self, email_id: str, subject: str, body: str, from_email: str, 
                  received_at: str, user_id: int, metadata: Dict = None):
        """添加邮件到向量库"""
        if not self.collection:
            self.initialize()
        
        # 构建邮件文本（用于向量化）
        email_text = f"{subject}\n{body}".strip()
        
        if not email_text:
            logger.warning(f"邮件 {email_id} 内容为空，跳过向量化")
            return
        
        # 构建元数据
        email_metadata = {
            'email_id': email_id,
            'subject': subject,
            'from': from_email,
            'received_at': received_at,
            'user_id': str(user_id),
            'type': 'email'
        }
        if metadata:
            email_metadata.update(metadata)
        
        try:
            # 使用 email_id 作为唯一标识
            doc_id = f"email_{user_id}_{email_id}"
            self.collection.add(
                documents=[email_text],
                metadatas=[email_metadata],
                ids=[doc_id]
            )
            logger.info(f"成功添加邮件到向量库: {email_id}")
        except Exception as e:
            logger.error(f"添加邮件到向量库失败: {str(e)}")
            # 如果已存在，尝试更新
            try:
                self.collection.update(
                    ids=[doc_id],
                    documents=[email_text],
                    metadatas=[email_metadata]
                )
            except:
                pass
    
    def search_emails(self, query: str, user_id: int, top_k: int = None) -> List[Dict]:
        """使用向量相似度搜索邮件
        
        Args:
            query: 搜索查询
            user_id: 用户ID
            top_k: 返回的邮件数量上限，None 表示不设上限（返回所有符合条件的）
        """
        if not self.collection:
            self.initialize()
        
        try:
            # 先检查向量库中有多少邮件
            total_count = self.collection.count()
            logger.info(f"向量库中共有 {total_count} 封邮件")
            
            # 如果 top_k 为 None，获取所有符合条件的邮件（最多30封）
            n_results = top_k * 3 if top_k else 30
            
            # 搜索并过滤用户ID
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,  # 获取更多结果以便过滤和排序
                where={"user_id": str(user_id)}  # 只搜索当前用户的邮件
            )
            
            # 格式化结果
            emails = []
            if results['documents'] and len(results['documents']) > 0:
                # 创建带相似度的列表，然后排序
                email_candidates = []
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results['metadatas'] else {}
                    distance = results['distances'][0][i] if results['distances'] else 1.0
                    
                    # ChromaDB 使用余弦距离，范围通常是 [0, 2]
                    # 对于余弦距离，相似度 = 1 - distance，但需要归一化
                    # 如果 distance > 1，说明相似度很低
                    # 使用更合理的相似度计算：similarity = max(0, 1 - distance)
                    # 或者使用归一化：similarity = 1 / (1 + distance)
                    similarity = 1.0 / (1.0 + distance)  # 使用归一化公式，范围 [0, 1]
                    
                    email_candidates.append({
                        'id': metadata.get('email_id', ''),
                        'subject': metadata.get('subject', ''),
                        'from': metadata.get('from', ''),
                        'date': metadata.get('received_at', ''),
                        'preview': doc[:200] if doc else '',
                        'body': doc,
                        'source': 'email',
                        'similarity': similarity,
                        'distance': distance
                    })
                
                # 按相似度排序（从高到低）
                email_candidates.sort(key=lambda x: x['similarity'], reverse=True)
                
                # 记录搜索结果
                logger.info(f"查询: '{query}' - 找到 {len(email_candidates)} 封邮件")
                log_count = top_k if top_k else min(10, len(email_candidates))
                for i, email in enumerate(email_candidates[:log_count]):
                    logger.info(f"  邮件 {i+1}: {email['subject'][:50]}... (相似度: {email['similarity']:.2%}, 距离: {email['distance']:.4f})")
                
                # 调整阈值：降低阈值以返回更多相关邮件
                # 使用较低的阈值，让更多邮件通过过滤
                min_similarity_threshold = 0.05  # 5% 相似度阈值（降低阈值）
                filtered_emails = [e for e in email_candidates if e['similarity'] >= min_similarity_threshold]
                
                # 如果设置了 top_k，按相似度排序后取前 top_k 个
                # 如果没有设置 top_k，返回所有通过阈值的邮件
                if top_k and len(filtered_emails) > top_k:
                    # 如果过滤后的邮件太多，只返回相似度最高的 top_k 个
                    filtered_emails = filtered_emails[:top_k]
                    logger.info(f"相似度阈值过滤后找到 {len(email_candidates)} 封邮件，返回相似度最高的 {top_k} 封")
                elif filtered_emails:
                    logger.info(f"相似度阈值过滤后找到 {len(filtered_emails)} 封邮件（阈值: {min_similarity_threshold:.0%}）")
                
                # 如果所有邮件相似度都很低，至少返回相似度最高的几个
                if not filtered_emails and email_candidates:
                    fallback_count = top_k if top_k else min(10, len(email_candidates))
                    filtered_emails = email_candidates[:fallback_count]
                    logger.warning(f"所有邮件相似度都低于阈值（<{min_similarity_threshold:.0%}），返回相似度最高的 {len(filtered_emails)} 封")
                
                # 如果 top_k 为 None，返回所有过滤后的邮件；否则返回前 top_k 个
                if top_k:
                    emails = filtered_emails[:top_k]
                else:
                    emails = filtered_emails  # 返回所有符合条件的邮件
            
            return emails
        except Exception as e:
            logger.error(f"向量搜索邮件失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def sync_user_emails(self, email_service, access_token: str, user_id: int, limit: int = 50):
        """同步用户邮件到向量库"""
        try:
            # 获取最近邮件
            recent_emails = email_service.get_recent_emails(access_token, limit)
            
            synced_count = 0
            for email in recent_emails:
                # 获取邮件详情（包含完整正文）
                email_id = email.get('id')
                if not email_id:
                    continue
                
                # 获取完整邮件内容
                email_detail = email_service.get_email_detail(access_token, email_id)
                if not email_detail:
                    continue
                
                # 添加到向量库
                self.add_email(
                    email_id=email_id,
                    subject=email_detail.get('subject', ''),
                    body=email_detail.get('body_content', email_detail.get('body_preview', '')),
                    from_email=email_detail.get('from_email', ''),
                    received_at=email_detail.get('received_at', ''),
                    user_id=user_id
                )
                synced_count += 1
            
            logger.info(f"同步了 {synced_count} 封邮件到向量库")
            return synced_count
        except Exception as e:
            logger.error(f"同步邮件到向量库失败: {str(e)}")
            return 0
    
    def delete_user_emails(self, user_id: int):
        """删除用户的所有邮件向量"""
        if not self.collection:
            self.initialize()
        
        try:
            self.collection.delete(
                where={"user_id": str(user_id)}
            )
            logger.info(f"删除用户 {user_id} 的所有邮件向量")
        except Exception as e:
            logger.error(f"删除邮件向量失败: {str(e)}")


# 全局邮件向量存储实例
email_vector_store = EmailVectorStore()

