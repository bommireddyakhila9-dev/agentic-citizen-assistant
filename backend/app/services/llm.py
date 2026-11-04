import os
import ssl

# Inject Windows native certificate store so Python recognizes system certificates
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings


def get_gemini_llm():
    """
    Returns an initialized LangChain ChatGoogleGenerativeAI instance.
    """
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise ValueError(
            "GEMINI_API_KEY is not configured. Please add your key to backend/.env"
        )

    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=api_key,
        temperature=0.2,
    )


def test_gemini_connection(user_prompt: str = "Explain your role as an Agentic Citizen Assistant in 2 sentences."):
    """
    Test utility to verify that the Gemini API is reachable and responding.
    """
    llm = get_gemini_llm()
    response = llm.invoke(user_prompt)
    
    # Extract clean text from response content
    content = response.content
    if isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict):
        text_content = content[0].get("text", str(content))
    elif isinstance(content, list):
        text_content = " ".join(str(item) for item in content)
    else:
        text_content = str(content)

    return {
        "model": settings.GEMINI_MODEL,
        "prompt": user_prompt,
        "response": text_content,
        "status": "connected",
    }
