"""
RAG service - Retrieval Augmented Generation
"""

import time
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import openai
from openai import OpenAI


class RAGService:
    """RAG service"""
    
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
        """Generate answer via LLM"""
        start_time = time.time()
        
        if not self.provider:
            return {
                'answer': "Sorry, no LLM API key is configured.",
                'tokens_used': 0,
                'response_time': time.time() - start_time,
                'model': self.model,
                'error': 'missing_api_key'
            }
        
        # Build prompt
        prompt = f"""You are the HKU smart assistant.

Primary goal:
1. Search the provided context and combine it with your own general knowledge to answer the user.
2. If possible, cross-check conclusions across sources and produce a coherent summary in English.
3. If the context lacks relevant data, rely on general knowledge but mention that campus-specific details were not found.

Context:
{context}

User question: {question}

Answer requirements:
- Provide a concise yet complete explanation.
- Highlight how the final conclusion was reached (mention if it came from the supplied documents, user emails, or your prior knowledge).
- If multiple sources give similar conclusions, summarize them into a unified statement.
- If information conflicts, point it out and explain the reasoning you trust most.
- Always respond in English."""

        try:
            # Call LLM provider
            if self.provider == "deepseek":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are the HKU smart assistant, helping students with campus information and personal mailbox content."},
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
                        {"role": "system", "content": "You are the HKU smart assistant, helping students with campus information and personal mailbox content."},
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
                'answer': f"Sorry, failed to generate an answer: {str(e)}",
                'tokens_used': 0,
                'response_time': time.time() - start_time,
                'model': self.model,
                'error': str(e)
            }
    
    @staticmethod
    def parallel_retrieve(knowledge_retriever, email_retriever, question: str) -> Dict:
        """Retrieve knowledge base and email in parallel"""
        knowledge_results = []
        email_results = []
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            # Submit tasks
            future_knowledge = executor.submit(knowledge_retriever, question)
            future_email = executor.submit(email_retriever, question)
            
            # Gather results
            for future in as_completed([future_knowledge, future_email]):
                try:
                    result = future.result()
                    if future == future_knowledge:
                        knowledge_results = result
                    else:
                        email_results = result
                except Exception as e:
                    print(f"Retrieval error: {e}")
        
        return {
            'knowledge': knowledge_results,
            'emails': email_results
        }
    
    @staticmethod
    def build_context(knowledge_docs: List[Dict], email_docs: List[Dict]) -> str:
        """Build context string"""
        context_parts = []
        
        # Knowledge documents
        if knowledge_docs:
            context_parts.append("=== Knowledge Base ===")
            for i, doc in enumerate(knowledge_docs[:3], 1):  # up to 3
                text = doc.get('text', '')
                source = doc.get('metadata', {}).get('filename', 'unknown')
                context_parts.append(f"\n[Knowledge {i}] Source: {source}\n{text}")
        
        # Email content
        if email_docs:
            context_parts.append("\n\n=== Emails ===")
            for i, email in enumerate(email_docs[:3], 1):  # up to 3
                subject = email.get('subject', 'No Subject')
                preview = email.get('preview', email.get('body', ''))[:300]
                from_addr = email.get('from', 'Unknown Sender')
                date = email.get('date', '')
                context_parts.append(
                    f"\n[Email {i}] Subject: {subject}\nFrom: {from_addr}\nDate: {date}\nContent: {preview}"
                )
        
        if not context_parts:
            return "No relevant context found."
        
        return "\n".join(context_parts)

