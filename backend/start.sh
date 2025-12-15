#!/bin/bash

# HKU 智能助手 - 后端启动脚本

echo "================================"
echo "HKU 智能助手 - 启动后端服务"
echo "================================"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python 3"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "警告: 未找到 .env 文件"
    echo "请复制 .env.example 为 .env 并配置必要的环境变量"
    cp .env.example .env
    echo "已创建 .env 文件，请编辑后重新运行"
    exit 1
fi

# 创建存储目录
mkdir -p storage/chroma storage/uploads

# 启动服务
echo ""
echo "启动 Flask 服务..."
echo "访问地址: http://localhost:5000"
echo "API 文档: http://localhost:5000/api/health"
echo ""
python run.py

