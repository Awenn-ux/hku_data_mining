"""
向量存储服务 - 使用 ChromaDB
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict
from config import Config


class VectorStore:
    """向量存储管理"""
    
    def __init__(self):
        self.client = None
        self.collection = None
        
    def initialize(self):
        """初始化向量数据库"""
        self.client = chromadb.Client(Settings(
            persist_directory=Config.CHROMA_PERSIST_DIR,
            anonymized_telemetry=False
        ))
        
        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name=Config.CHROMA_COLLECTION_NAME,
            metadata={"description": "HKU 知识库"}
        )
        
    def add_documents(self, texts: List[str], metadatas: List[Dict], ids: List[str]):
        """添加文档到向量库"""
        if not self.collection:
            self.initialize()
            
        self.collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        
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

