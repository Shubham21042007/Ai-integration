import os

from openai import OpenAI


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing from .env")

    return OpenAI(api_key=api_key)


def generate_response(message: str, model: str):
    client = get_openai_client()

    response = client.responses.create(
        model=model,
        input=message
    )

    return response.output_text