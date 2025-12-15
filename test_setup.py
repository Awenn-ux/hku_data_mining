"""
项目结构和导入测试脚本
"""
import sys


def test_imports():
    """测试关键模块导入"""
    print("🧪 测试模块导入...\n")
    
    tests = [
        ("核心配置", "app.core.config", "settings"),
        ("日志系统", "app.core.logging", "log"),
        ("安全模块", "app.core.security", "create_access_token"),
        ("用户模型", "app.models.user", "User"),
        ("对话模型", "app.models.conversation", "Conversation"),
        ("文档模型", "app.models.document", "Document"),
        ("邮件模型", "app.models.email", "Email"),
        ("认证服务", "app.services.auth_service", "auth_service"),
        ("RAG 服务", "app.services.rag_service", "rag_service"),
        ("邮件服务", "app.services.email_service", "email_service"),
        ("知识库服务", "app.services.knowledge_service", "knowledge_service"),
        ("文档处理器", "app.utils.document_processor", "DocumentProcessor"),
        ("响应工具", "app.utils.response", "APIResponse"),
    ]
    
    passed = 0
    failed = 0
    
    for name, module, attr in tests:
        try:
            mod = __import__(module, fromlist=[attr])
            getattr(mod, attr)
            print(f"✅ {name}: 导入成功")
            passed += 1
        except Exception as e:
            print(f"❌ {name}: 导入失败 - {e}")
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"测试结果: {passed} 通过, {failed} 失败")
    print(f"{'='*50}\n")
    
    return failed == 0


def check_file_structure():
    """检查文件结构"""
    import os
    from pathlib import Path
    
    print("📁 检查文件结构...\n")
    
    required_files = [
        "requirements.txt",
        "README.md",
        "DEPLOYMENT.md",
        ".gitignore",
        "run.sh",
        "app/main.py",
        "app/__init__.py",
        "app/core/config.py",
        "app/core/logging.py",
        "app/core/security.py",
        "app/db/mongodb.py",
        "app/db/vector_store.py",
        "app/models/user.py",
        "app/models/conversation.py",
        "app/models/document.py",
        "app/models/email.py",
        "app/services/auth_service.py",
        "app/services/rag_service.py",
        "app/services/email_service.py",
        "app/services/knowledge_service.py",
        "app/api/deps.py",
        "app/api/routers/auth.py",
        "app/api/routers/chat.py",
        "app/api/routers/knowledge.py",
        "app/api/routers/email.py",
        "app/api/routers/system.py",
    ]
    
    missing = []
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - 文件不存在")
            missing.append(file_path)
    
    print(f"\n{'='*50}")
    if missing:
        print(f"❌ 缺少 {len(missing)} 个文件")
        print(f"{'='*50}\n")
        return False
    else:
        print(f"✅ 所有文件都存在")
        print(f"{'='*50}\n")
        return True


def print_summary():
    """打印项目摘要"""
    print("📊 项目摘要\n")
    print("项目名称: HKU 智能助手")
    print("版本: 1.0.0")
    print("后端框架: FastAPI")
    print("数据库: MongoDB + ChromaDB")
    print("\n主要功能:")
    print("  - ✅ 用户认证 (OAuth + JWT)")
    print("  - ✅ 智能问答 (RAG)")
    print("  - ✅ 知识库管理")
    print("  - ✅ 邮箱集成")
    print("  - ✅ 系统管理")
    print("\nAPI 文档: http://localhost:8000/api/docs")
    print("健康检查: http://localhost:8000/api/system/health")
    print("\n" + "="*50 + "\n")


if __name__ == "__main__":
    print("\n" + "="*50)
    print("  HKU 智能助手 - 项目测试")
    print("="*50 + "\n")
    
    # 检查文件结构
    files_ok = check_file_structure()
    
    # 测试导入
    imports_ok = test_imports()
    
    # 打印摘要
    print_summary()
    
    # 总结
    if files_ok and imports_ok:
        print("🎉 所有测试通过！项目设置正确。")
        print("\n下一步:")
        print("  1. 配置 .env 文件")
        print("  2. 安装依赖: pip install -r requirements.txt")
        print("  3. 启动应用: ./run.sh 或 uvicorn app.main:app --reload")
        sys.exit(0)
    else:
        print("⚠️  存在一些问题，请检查上面的错误信息。")
        sys.exit(1)

