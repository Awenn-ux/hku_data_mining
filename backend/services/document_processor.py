"""
文档处理服务 - 文本提取和分块
"""
import os
import logging
from typing import List, Dict
from PyPDF2 import PdfReader
from docx import Document as DocxDocument

logger = logging.getLogger(__name__)


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
        """从PDF提取文本，支持多种提取方法"""
        text = ""
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PdfReader(file)
                num_pages = len(pdf_reader.pages)
                logger.info(f"PDF文件共有 {num_pages} 页: {file_path}")
                
                for i, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                        else:
                            logger.warning(f"第 {i+1} 页无法提取文本（可能是扫描版PDF）")
                    except Exception as e:
                        logger.warning(f"提取第 {i+1} 页文本时出错: {str(e)}")
                        continue
                
                # 如果提取的文本为空，尝试使用extract_text(extraction_mode="layout")
                if not text.strip():
                    logger.info("尝试使用布局模式提取PDF文本...")
                    with open(file_path, 'rb') as file:
                        pdf_reader = PdfReader(file)
                        for i, page in enumerate(pdf_reader.pages):
                            try:
                                # 尝试使用不同的提取模式
                                page_text = page.extract_text(extraction_mode="layout")
                                if page_text:
                                    text += page_text + "\n"
                            except Exception as e:
                                logger.warning(f"使用布局模式提取第 {i+1} 页失败: {str(e)}")
                                continue
                
                if not text.strip():
                    logger.error(f"无法从PDF提取任何文本: {file_path}，可能是扫描版PDF或加密PDF")
                    raise ValueError(f"PDF文件无法提取文本，可能是扫描版（图片格式）或加密PDF: {file_path}")
                
                logger.info(f"成功从PDF提取 {len(text)} 个字符的文本")
                return text
                
        except Exception as e:
            logger.error(f"提取PDF文本失败: {file_path}, 错误: {str(e)}")
            raise
    
    @staticmethod
    def _extract_from_docx(file_path: str) -> str:
        """从DOCX提取文本"""
        doc = DocxDocument(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    
    @staticmethod
    def _extract_from_txt(file_path: str) -> str:
        """从TXT文件读取文本，支持多种编码"""
        # 尝试的编码列表（按优先级排序）
        encodings = ['utf-8', 'gbk', 'gb2312', 'gb18030', 'big5', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    text = file.read()
                    logger.info(f"成功使用 {encoding} 编码读取文件: {file_path}")
                    return text
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logger.warning(f"使用 {encoding} 编码读取文件失败: {str(e)}")
                continue
        
        # 如果所有编码都失败，尝试使用错误处理策略
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as file:
                text = file.read()
                logger.warning(f"使用 UTF-8 编码（错误替换模式）读取文件: {file_path}")
                return text
        except Exception as e:
            raise ValueError(f"无法读取文件 {file_path}，所有编码尝试均失败: {str(e)}")
    
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

