# Know Yourself - 后端服务

LLM API 代理服务，用于保护 API_KEY 安全。

## 快速开始

### 1. 安装依赖

```bash
cd server
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp env.example .env

# 编辑 .env 文件，填入真实的 API_KEY
```

`.env` 文件内容：
```
API_BASE_URL=https://api.openai.com/v1
API_KEY=sk-your-api-key-here
MODEL=gpt-4o-mini
MAX_TOKENS=8192
PORT=80
```

### 3. 启动服务

```bash
# macOS/Linux 使用 80 端口需要 sudo
sudo python main.py
```

服务将在 http://localhost 启动

### 4. API 文档

访问 http://localhost/docs 查看交互式 API 文档

## API 接口

### 健康检查
```
GET /health
```

### 聊天接口
```
POST /chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "stream": true
}
```

## 前端配置

在前端 `.env` 文件中配置后端地址：

```
VITE_SERVER_URL=http://localhost
```

## 部署

### Vercel / Railway / Render

1. 设置环境变量：
   - `API_BASE_URL`
   - `API_KEY`
   - `MODEL`
   - `MAX_TOKENS`

2. 部署后更新前端 `VITE_SERVER_URL` 为部署后的地址

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 80
CMD ["python", "main.py"]
```

