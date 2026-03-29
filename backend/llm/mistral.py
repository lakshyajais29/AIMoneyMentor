import os
from mistralai.client import Mistral
from dotenv import load_dotenv

load_dotenv()

# ── Model to use ───────────────────────────────────────────────────────────
# mistral-small-latest  → fast, affordable, great for structured text
# mistral-large-latest  → more powerful, swap here if needed
_MODEL = "mistral-small-latest"


def call_llm(prompt: str) -> str:
    """
    Send a prompt to Mistral AI and return the text response.
    Returns an error string if the API call fails — never raises.

    This is the single entry-point for all LLM calls in the project.
    To swap the LLM provider in the future, only this file needs to change.
    """
    api_key = os.getenv("MISTRAL_API_KEY", "")
    if not api_key:
        return "Error: MISTRAL_API_KEY is not set in environment variables."

    try:
        client = Mistral(api_key=api_key)
        response = client.chat.complete(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.4,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: Mistral API call failed — {str(e)}"
