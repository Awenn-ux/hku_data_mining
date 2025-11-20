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

