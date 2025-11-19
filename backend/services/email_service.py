"""
邮箱服务 - Microsoft Graph API 集成
"""
import requests
from typing import List, Dict, Optional
from datetime import datetime
import msal


class EmailService:
    """邮箱服务"""
    
    GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0'
    AUTHORITY = 'https://login.microsoftonline.com'
    
    def __init__(self, client_id: str, client_secret: str, tenant_id: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.tenant_id = tenant_id
        
    def get_auth_url(self, redirect_uri: str, scopes: List[str]) -> str:
        """获取授权 URL"""
        app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=f"{self.AUTHORITY}/{self.tenant_id}",
        )
        
        auth_url = app.get_authorization_request_url(
            scopes=scopes,
            redirect_uri=redirect_uri
        )
        
        return auth_url
    
    def get_token_from_code(self, code: str, redirect_uri: str, scopes: List[str]) -> Dict:
        """使用授权码获取 token"""
        app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=f"{self.AUTHORITY}/{self.tenant_id}",
        )
        
        result = app.acquire_token_by_authorization_code(
            code=code,
            scopes=scopes,
            redirect_uri=redirect_uri
        )
        
        return result
    
    def refresh_access_token(self, refresh_token: str, scopes: List[str]) -> Dict:
        """刷新访问令牌"""
        app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=f"{self.AUTHORITY}/{self.tenant_id}",
        )
        
        result = app.acquire_token_by_refresh_token(
            refresh_token=refresh_token,
            scopes=scopes
        )
        
        return result
    
    def get_user_info(self, access_token: str) -> Dict:
        """获取用户信息"""
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(
            f'{self.GRAPH_API_ENDPOINT}/me',
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    def search_emails(self, access_token: str, keyword: str, top: int = 10) -> List[Dict]:
        """关键词搜索邮件"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        # 使用 Microsoft Graph 的搜索 API
        params = {
            '$search': f'"{keyword}"',
            '$top': top,
            '$select': 'subject,from,receivedDateTime,bodyPreview,body'
        }
        
        response = requests.get(
            f'{self.GRAPH_API_ENDPOINT}/me/messages',
            headers=headers,
            params=params
        )
        
        if response.status_code != 200:
            return []
        
        data = response.json()
        emails = []
        
        for item in data.get('value', []):
            emails.append({
                'id': item.get('id'),
                'subject': item.get('subject', ''),
                'from': item.get('from', {}).get('emailAddress', {}).get('address', ''),
                'date': item.get('receivedDateTime', ''),
                'preview': item.get('bodyPreview', ''),
                'body': item.get('body', {}).get('content', ''),
                'source': 'email'
            })
        
        return emails
    
    def get_recent_emails(self, access_token: str, top: int = 50) -> List[Dict]:
        """获取最近的邮件"""
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            
            params = {
                '$top': top,
                '$select': 'subject,from,receivedDateTime,bodyPreview,importance',
                '$orderby': 'receivedDateTime DESC'
            }
            
            response = requests.get(
                f'{self.GRAPH_API_ENDPOINT}/me/messages',
                headers=headers,
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"获取邮件失败: HTTP {response.status_code}")
                print(f"响应内容: {response.text}")
                return []
            
            data = response.json()
            emails = []
            
            for item in data.get('value', []):
                sender_info = item.get('from', {}).get('emailAddress', {})
                emails.append({
                    'id': item.get('id'),
                    'subject': item.get('subject', '无主题'),
                    'sender': sender_info.get('name', '未知发件人'),
                    'sender_email': sender_info.get('address', ''),
                    'received_at': item.get('receivedDateTime', ''),
                    'body_preview': item.get('bodyPreview', ''),
                    'importance': item.get('importance', 'normal'),
                    'is_academic': False,  # 示例，可以添加关键词判断
                    'source': 'email'
                })
                
            return emails
        except Exception as e:
            print(f"获取邮件异常: {str(e)}")
            return []


def keyword_search_in_emails(emails: List[Dict], keywords: List[str]) -> List[Dict]:
    """在邮件列表中进行关键词搜索（本地搜索）"""
    results = []
    
    for email in emails:
        # 搜索主题和内容
        text = f"{email.get('subject', '')} {email.get('preview', '')} {email.get('body', '')}"
        text_lower = text.lower()
        
        # 检查是否包含任何关键词
        for keyword in keywords:
            if keyword.lower() in text_lower:
                results.append(email)
                break
    
    return results

