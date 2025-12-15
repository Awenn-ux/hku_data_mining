@echo off
REM HKU 智能助手 - Windows 启动脚本

echo ================================
echo HKU 智能助手 - 启动后端服务
echo ================================
echo.

REM 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Python
    exit /b 1
)

REM 检查虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
echo 激活虚拟环境...
call venv\Scripts\activate.bat

REM 安装依赖
echo 安装依赖...
pip install -r requirements.txt

REM 检查 .env 文件
if not exist ".env" (
    echo 警告: 未找到 .env 文件
    echo 请复制 .env.example 为 .env 并配置必要的环境变量
    copy .env.example .env
    echo 已创建 .env 文件，请编辑后重新运行
    pause
    exit /b 1
)

REM 创建存储目录
if not exist "storage\chroma" mkdir storage\chroma
if not exist "storage\uploads" mkdir storage\uploads

REM 启动服务
echo.
echo 启动 Flask 服务...
echo 访问地址: http://localhost:5000
echo API 文档: http://localhost:5000/api/health
echo.
python run.py

