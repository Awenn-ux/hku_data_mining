"""
RAG 服务 - 检索增强生成
"""

import time
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import openai
from openai import OpenAI


class RAGService:
    """RAG 服务"""
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        openai_model: str = "gpt-3.5-turbo",
        deepseek_api_key: Optional[str] = None,
        deepseek_model: str = "deepseek-chat",
        deepseek_base_url: str = "https://api.deepseek.com",
    ):
        self.provider = None
        self.model = openai_model
        self.client = None
        self.deepseek_base_url = deepseek_base_url

        if deepseek_api_key:
            # 优先使用 DeepSeek
            self.provider = "deepseek"
            self.model = deepseek_model
            self.client = OpenAI(
                api_key=deepseek_api_key,
                base_url=deepseek_base_url
            )
        elif openai_api_key:
            # 回退到 OpenAI
            self.provider = "openai"
            self.model = openai_model
            openai.api_key = openai_api_key
        else:
            # 未配置任何模型
            self.provider = None
            openai.api_key = None
    
    def generate_answer(self, question: str, context: str) -> Dict:
        """使用 LLM 生成答案"""
        start_time = time.time()
        
        if not self.provider:
            return {
                'answer': "抱歉，未配置可用的 LLM API Key。",
                'tokens_used': 0,
                'response_time': time.time() - start_time,
                'model': self.model,
                'error': 'missing_api_key'
            }
        
        # 构建提示词
        prompt = f"""你是 HKU（香港大学）的智能助手。请根据提供的上下文回答用户的问题。

上下文信息：
{context}

用户问题：{question}

请根据上下文信息回答问题。如果上下文中没有相关信息，请说明无法根据现有信息回答。
回答要清晰、准确、专业。"""

        try:
            # 调用 OpenAI API
            if self.provider == "deepseek":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "你是 HKU 的智能助手，帮助学生解答关于学校和个人邮箱的问题。"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                answer = response.choices[0].message.content if response.choices else ""
                usage = getattr(response, "usage", None)
                if isinstance(usage, dict):
                    tokens_used = usage.get("total_tokens", 0)
                else:
                    tokens_used = getattr(usage, "total_tokens", 0) if usage else 0
            else:
                response = openai.ChatCompletion.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "你是 HKU 的智能助手，帮助学生解答关于学校和个人邮箱的问题。"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                answer = response.choices[0].message.get("content", "") if response.choices else ""
                tokens_used = getattr(response.usage, "total_tokens", 0)
            
            response_time = time.time() - start_time
            
            return {
                'answer': answer,
                'tokens_used': tokens_used,
                'response_time': response_time,
                'model': self.model,
                'provider': self.provider
            }
            
        except Exception as e:
            return {
                'answer': f"抱歉，生成答案时出错: {str(e)}",
                'tokens_used': 0,
                'response_time': time.time() - start_time,
                'model': self.model,
                'error': str(e)
            }
    
    @staticmethod
    def parallel_retrieve(knowledge_retriever, email_retriever, question: str) -> Dict:
        """并行检索知识库和邮箱"""
        knowledge_results = []
        email_results = []
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            # 提交两个检索任务
            future_knowledge = executor.submit(knowledge_retriever, question)
            future_email = executor.submit(email_retriever, question)
            
            # 收集结果
            for future in as_completed([future_knowledge, future_email]):
                try:
                    result = future.result()
                    if future == future_knowledge:
                        knowledge_results = result
                    else:
                        email_results = result
                except Exception as e:
                    print(f"检索出错: {e}")
        
        return {
            'knowledge': knowledge_results,
            'emails': email_results
        }
    
    @staticmethod
    def build_context(knowledge_docs: List[Dict], email_docs: List[Dict]) -> str:
        """构建上下文"""
        context_parts = []
        
        # 添加知识库内容
        if knowledge_docs:
            context_parts.append("=== 知识库信息 ===")
            for i, doc in enumerate(knowledge_docs[:3], 1):  # 最多3个
                text = doc.get('text', '')
                source = doc.get('metadata', {}).get('filename', '未知')
                context_parts.append(f"\n[知识库 {i}] 来源: {source}\n{text}")
        
        # 添加邮件内容
        if email_docs:
            context_parts.append("\n\n=== 邮件信息 ===")
            for i, email in enumerate(email_docs[:3], 1):  # 最多3个
                subject = email.get('subject', '无主题')
                preview = email.get('preview', email.get('body', ''))[:300]
                from_addr = email.get('from', '未知')
                date = email.get('date', '')
                context_parts.append(
                    f"\n[邮件 {i}] 主题: {subject}\n发件人: {from_addr}\n日期: {date}\n内容: {preview}"
                )
        
        if not context_parts:
            return "没有找到相关信息。"
        
        return "\n".join(context_parts)

