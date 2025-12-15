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
            # client_credential=self.client_secret
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
            # client_credential=self.client_secret
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
            # client_credential=self.client_secret
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
        """
        关键词搜索邮件
        
        注意：Microsoft Graph API 的 /me/messages 端点不支持 $search 参数
        我们使用两种方法：
        1. 先尝试使用 Microsoft Search API (推荐)
        2. 如果失败，回退到获取最近邮件然后本地过滤
        """
        headers = {'Authorization': f'Bearer {access_token}'}
        
        # 方法1: 尝试使用 Microsoft Search API
        try:
            search_url = f'{self.GRAPH_API_ENDPOINT}/search/query'
            search_payload = {
                "requests": [
                    {
                        "entityTypes": ["message"],
                        "query": {
                            "queryString": keyword
                        },
                        "from": 0,
                        "size": top
                    }
                ]
            }
            
            response = requests.post(
                search_url,
                headers=headers,
                json=search_payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                emails = []
                
                # 解析搜索结果
                if 'value' in data and len(data['value']) > 0:
                    hits = data['value'][0].get('hitsContainers', [{}])[0].get('hits', [])
                    
                    for hit in hits:
                        resource = hit.get('resource', {})
                        emails.append({
                            'id': resource.get('id'),
                            'subject': resource.get('subject', ''),
                            'from': resource.get('from', {}).get('emailAddress', {}).get('address', ''),
                            'date': resource.get('receivedDateTime', ''),
                            'preview': resource.get('bodyPreview', ''),
                            'body': resource.get('body', {}).get('content', ''),
                            'source': 'email'
                        })
                    
                    if emails:
                        print(f"使用 Search API 找到 {len(emails)} 封相关邮件")
                        return emails
        except Exception as e:
            print(f"Search API 失败，尝试备用方法: {str(e)}")
        
        # 方法2: 回退方案 - 获取最近邮件然后本地过滤
        try:
            print(f"使用备用方法：获取最近邮件并本地搜索关键词 '{keyword}'")
            # 获取更多邮件以提高找到相关邮件的概率
            recent_count = min(top * 10, 100)  # 最多获取100封
            
            params = {
                '$top': recent_count,
                '$select': 'id,subject,from,receivedDateTime,bodyPreview,body',
                '$orderby': 'receivedDateTime DESC'
            }
            
            response = requests.get(
                f'{self.GRAPH_API_ENDPOINT}/me/messages',
                headers=headers,
                params=params,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"获取邮件失败: HTTP {response.status_code}, 响应: {response.text[:200]}")
                return []
            
            data = response.json()
            all_emails = []
            
            # 先获取所有邮件
            for item in data.get('value', []):
                all_emails.append({
                    'id': item.get('id'),
                    'subject': item.get('subject', ''),
                    'from': item.get('from', {}).get('emailAddress', {}).get('address', ''),
                    'date': item.get('receivedDateTime', ''),
                    'preview': item.get('bodyPreview', ''),
                    'body': item.get('body', {}).get('content', ''),
                    'source': 'email'
                })
            
            # 本地关键词过滤
            keyword_lower = keyword.lower()
            matched_emails = []
            
            for email in all_emails:
                # 在主题、预览和正文中搜索关键词
                search_text = f"{email.get('subject', '')} {email.get('preview', '')} {email.get('body', '')}".lower()
                if keyword_lower in search_text:
                    matched_emails.append(email)
                    if len(matched_emails) >= top:
                        break
            
            print(f"本地搜索找到 {len(matched_emails)} 封相关邮件（从 {len(all_emails)} 封中筛选）")
            return matched_emails
            
        except Exception as e:
            print(f"邮件搜索异常: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
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


    def get_email_detail(self, access_token: str, email_id: str) -> Optional[Dict]:
        """获取邮件详细信息"""
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            
            # 获取完整邮件信息
            response = requests.get(
                f'{self.GRAPH_API_ENDPOINT}/me/messages/{email_id}',
                headers=headers,
                params={
                    '$select': 'id,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,body,bodyPreview,importance,isRead,hasAttachments,attachments'
                },
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"获取邮件详情失败: HTTP {response.status_code}, 响应: {response.text[:200]}")
                return None
            
            item = response.json()
            
            # 解析发件人
            from_info = item.get('from', {}).get('emailAddress', {})
            
            # 解析收件人
            to_recipients = [r.get('emailAddress', {}).get('address', '') for r in item.get('toRecipients', [])]
            cc_recipients = [r.get('emailAddress', {}).get('address', '') for r in item.get('ccRecipients', [])]
            bcc_recipients = [r.get('emailAddress', {}).get('address', '') for r in item.get('bccRecipients', [])]
            
            # 获取附件信息（如果需要）
            has_attachments = item.get('hasAttachments', False)
            attachment_count = 0
            attachments = []
            
            if has_attachments:
                # 获取附件列表
                att_response = requests.get(
                    f'{self.GRAPH_API_ENDPOINT}/me/messages/{email_id}/attachments',
                    headers=headers,
                    timeout=10
                )
                if att_response.status_code == 200:
                    att_data = att_response.json()
                    attachments = [
                        {
                            'id': att.get('id'),
                            'name': att.get('name', ''),
                            'contentType': att.get('contentType', ''),
                            'size': att.get('size', 0)
                        }
                        for att in att_data.get('value', [])
                    ]
                    attachment_count = len(attachments)
            
            # 解析邮件正文（可能是 HTML 或纯文本）
            body = item.get('body', {})
            body_content = body.get('content', '')
            body_type = body.get('contentType', 'text')
            
            return {
                'id': item.get('id'),
                'subject': item.get('subject', 'No Subject'),
                'from': from_info.get('name', 'Unknown'),
                'from_email': from_info.get('address', ''),
                'to': to_recipients,
                'cc': cc_recipients,
                'bcc': bcc_recipients,
                'received_at': item.get('receivedDateTime', ''),
                'sent_at': item.get('sentDateTime', ''),
                'body_preview': item.get('bodyPreview', ''),
                'body_content': body_content,
                'body_type': body_type,  # 'html' or 'text'
                'importance': item.get('importance', 'normal'),
                'is_read': item.get('isRead', False),
                'has_attachments': has_attachments,
                'attachment_count': attachment_count,
                'attachments': attachments,
                'source': 'email'
            }
            
        except Exception as e:
            print(f"获取邮件详情异常: {str(e)}")
            import traceback
            traceback.print_exc()
            return None


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

