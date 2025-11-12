#!/bin/bash

# HKU 智能助手启动脚本

echo "======================================"
echo "  HKU 智能助手 - 启动脚本"
echo "======================================"

# 检查 Python 版本
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "Python 版本: $python_version"

# 创建必要的目录
echo "创建必要的目录..."
mkdir -p logs
mkdir -p storage/chroma
mkdir -p storage/uploads

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "警告: .env 文件不存在"
    echo "提示: 您可以参考文档创建 .env 文件"
    echo "继续使用默认配置启动..."
fi

# 启动应用
echo "正在启动应用..."
echo "======================================"

# 使用 python -m 确保找到 uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload

