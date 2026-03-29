import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


def call_gemini(prompt: str) -> str:
    """
    Send a prompt to Gemini 2.0 Flash and return the text response.
    Returns an error string if the API call fails — never raises.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return "Error: GEMINI_API_KEY is not set in environment variables."

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1024,
                temperature=0.4,
            ),
        )
        return response.text.strip()
    except Exception as e:
        return f"Error: Gemini API call failed — {str(e)}"
