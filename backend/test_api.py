"""
简单的 API 测试脚本
"""
import requests

BASE_URL = "http://localhost:5000"

def test_health():
    """测试健康检查"""
    print("测试健康检查...")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.json()}")
    print()

def test_root():
    """测试根路径"""
    print("测试根路径...")
    response = requests.get(f"{BASE_URL}/")
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.json()}")
    print()

def test_login_url():
    """测试获取登录 URL"""
    print("测试获取登录 URL...")
    response = requests.get(f"{BASE_URL}/api/auth/login")
    print(f"状态码: {response.status_code}")
    data = response.json()
    print(f"响应: {data}")
    if data.get('code') == 0:
        print(f"登录 URL: {data['data']['auth_url']}")
    print()

def main():
    """运行所有测试"""
    print("=" * 50)
    print("HKU 智能助手 API 测试")
    print("=" * 50)
    print()
    
    try:
        test_health()
        test_root()
        test_login_url()
        
        print("=" * 50)
        print("所有基础测试完成！")
        print("=" * 50)
    except requests.exceptions.ConnectionError:
        print("错误: 无法连接到服务器")
        print("请确保后端服务正在运行: python run.py")
    except Exception as e:
        print(f"测试出错: {e}")

if __name__ == "__main__":
    main()

