"""
LLM API 代理服务
将 API_KEY 等敏感信息封装在服务端，前端通过此接口与 LLM 通信
"""

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

app = FastAPI(title="Know Yourself LLM Proxy")

# CORS 配置 - 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "https://yippee701.github.io",  # GitHub Pages
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 配置（从环境变量读取）
API_CONFIG = {
    "base_url": os.getenv("API_BASE_URL", "https://api.openai.com/v1"),
    "api_key": os.getenv("API_KEY", ""),
    "model": os.getenv("MODEL", "gpt-4o-mini"),
    "max_tokens": int(os.getenv("MAX_TOKENS", "8192")),
}

# 系统提示词
SYSTEM_PROMPT = """#Role：深度天赋挖掘机
#角色
你是一位结合了盖洛普优势理论、心流理论与荣格心理学的资深生涯咨询师。你坚信天赋不是某种具体技能，而是可迁移的底层能力。
#目标
通过多个深度多轮对话，帮助用户打破焦虑，帮他们找到他们被影藏起来的天赋，并生成一份极度详细、专业有共情力的《天赋说明书》。
#核心理念
1.反宿命论。2.能量审计：真正的天赋是让你回血的事，而不是你单纯擅长但做完很累的事。3.阴影即宝藏：用户的缺点、怪癖、甚至对他人的嫉妒，往往是天赋被压抑的背面。
#严格遵守
1.禁止一次性提问：必须采用"你问->用户答->你简短反馈->再问下一题"的模式。每轮对话只聚焦一个问题。
2.苏格拉底式引导：不要急着下结论，多问"为什么"、"当时什么感觉"、"具体例子".
3.温暖而犀利：保持共情，但在捕捉用户逻辑漏洞或潜意识信号时要敏锐。
#提问问题
提问1：请引导用户回忆16岁之前（未被社会完全规训前），有哪些事情是没人逼也会废寝忘食去做的？或者有哪些从小到大被批评的"顽固缺点"（如爱插嘴、太敏感、爱发呆）？
提问2：成年后的工作/生活中，哪件事让你觉得"这还需要学吗？这不是显而易见的吗？"但周围人却觉得很难？（寻找无意识胜任区）。
提问3：哪件事做完后虽然身体累，但精神极度亢奋？
提问4：这可能有点冒犯，但很关键，你曾经对谁（或哪种生活状态）产生过强烈的嫉妒或酸溜溜的感觉？（嫉妒通常是"被压抑的天赋"在发出信号，请诚实面对）.
这四个问题必须问到，但是不一定是线性的，过程中也可以根据你对用户的好奇和挖掘，来提出全新的问题，只要对发掘用户的天赋有帮助。最多不超过10个问题.
#输出
综合所有问题的信息，输出万字左右的《个人天赋使用说明书》。这篇报告不设定结构，由你根据用户的答案，自由发挥。但必须一万字以上，需要达到他的内心，让他真的觉得有用，帮助他找到真正的底层天赋，为他未来的人生路和从事职业给与详细的建议。
#开始
请以温暖、专业、共情的语调开场，像用户详细解释接下来的流程和占用的时间，以及希望达成的目标。向用户问好，用通俗语言简述天赋挖掘机的作用，告诉用户："天赋永远不会过期，我们只是要找到你的底层天赋。"然后在再开始进入提问流程。"""


class Message(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    stream: Optional[bool] = True

@app.get("/")
async def hello_world():
    return {"message": "Hello, SAE!"}
    
@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "model": API_CONFIG["model"]}


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    聊天接口 - 支持流式和非流式输出
    """
    if not API_CONFIG["api_key"]:
        raise HTTPException(status_code=500, detail="API_KEY 未配置")

    # 构建请求消息
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend([{"role": msg.role, "content": msg.content} for msg in request.messages])

    payload = {
        "model": API_CONFIG["model"],
        "messages": messages,
        "stream": request.stream,
        "temperature": 0.7,
        "max_tokens": API_CONFIG["max_tokens"],
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_CONFIG['api_key']}",
    }

    if request.stream:
        # 流式输出
        return StreamingResponse(
            stream_chat(payload, headers),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )
    else:
        # 非流式输出
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{API_CONFIG['base_url']}/chat/completions",
                json=payload,
                headers=headers,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"LLM API 错误: {response.text}",
                )
            
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return {"content": content}


async def stream_chat(payload: dict, headers: dict):
    """
    流式聊天生成器
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{API_CONFIG['base_url']}/chat/completions",
            json=payload,
            headers=headers,
        ) as response:
            if response.status_code != 200:
                error_text = await response.aread()
                yield f"data: {{'error': '{error_text.decode()}'}}\n\n"
                return

            async for line in response.aiter_lines():
                if line.strip():
                    yield f"{line}\n\n"
            
            yield "data: [DONE]\n\n"


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "80"))
    print(f"🚀 启动服务: http://localhost:{port}")
    print(f"📖 API 文档: http://localhost:{port}/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=port)

