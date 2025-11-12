"""
文档处理服务 - 文本提取和分块
"""
import os
from typing import List, Dict
from PyPDF2 import PdfReader
from docx import Document as DocxDocument


class DocumentProcessor:
    """文档处理器"""
    
    @staticmethod
    def extract_text(file_path: str) -> str:
        """从文件中提取文本"""
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == '.pdf':
            return DocumentProcessor._extract_from_pdf(file_path)
        elif ext == '.docx':
            return DocumentProcessor._extract_from_docx(file_path)
        elif ext == '.txt':
            return DocumentProcessor._extract_from_txt(file_path)
        else:
            raise ValueError(f"不支持的文件类型: {ext}")
    
    @staticmethod
    def _extract_from_pdf(file_path: str) -> str:
        """从PDF提取文本"""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    @staticmethod
    def _extract_from_docx(file_path: str) -> str:
        """从DOCX提取文本"""
        doc = DocxDocument(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    
    @staticmethod
    def _extract_from_txt(file_path: str) -> str:
        """从TXT文件读取文本"""
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """将文本分块"""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # 如果不是最后一块，尝试在句子边界处分割
            if end < len(text):
                # 寻找最近的句号、问号或感叹号
                for sep in ['\n\n', '。', '！', '？', '.', '!', '?', '\n']:
                    last_sep = text.rfind(sep, start, end)
                    if last_sep != -1:
                        end = last_sep + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # 下一个块的起始位置（带重叠）
            start = end - overlap if end < len(text) else end
            
        return chunks
    
    @staticmethod
    def process_document(file_path: str, filename: str, chunk_size: int = 1000, 
                        overlap: int = 200) -> List[Dict]:
        """处理文档：提取文本并分块"""
        # 提取文本
        text = DocumentProcessor.extract_text(file_path)
        
        # 分块
        chunks = DocumentProcessor.chunk_text(text, chunk_size, overlap)
        
        # 构建元数据
        documents = []
        for i, chunk in enumerate(chunks):
            documents.append({
                'text': chunk,
                'metadata': {
                    'filename': filename,
                    'chunk_index': i,
                    'total_chunks': len(chunks),
                    'source': 'document'
                }
            })
        
        return documents


# 全局实例
document_processor = DocumentProcessor()

