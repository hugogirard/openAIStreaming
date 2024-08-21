import json
import os
from dotenv import load_dotenv
import azure.identity.aio
import openai

load_dotenv()

from quart import (
    Blueprint,
    stream_with_context,
    request,
    current_app,
    Response,
    Quart
)

app = Quart(__name__)
bp = Blueprint("app", __name__)

@bp.before_app_serving
async def configure_open_ai():
    bp.openai_client = openai.AsyncAzureOpenAI(
                        api_version="2024-02-15-preview",
                        azure_endpoint=os.getenv["OPENAI_AZURE_ENDPOINT"],
                        api_key=os.getenv["OPENAI_API_KEY"],
                       )
    bp.openai_model = os.getenv("OPENAI_MODEL")

@bp.after_app_serving
async def shutdown():
    bp.openai_client.close()

@bp.post('/chat/stream')        
async def chat_hanlder():
    prompt = (await request.get_json())["prompt"]

    @stream_with_context
    async def response_stream():
        all_messages = [
            { "roles": "system", "content": "You are an helpfull chat assitant" }
        ]

        all_messages.append({ "roles": "user", "content": prompt })

        #client: openai.AsyncAzureOpenAI = bp.openai_client
        chat_coroutine = bp.openai_client.chat.completions.create(
                            model=bp.openai_model,
                            messages=all_messages,
                            stream=True
                        )
        try:
            async for event in await chat_coroutine:
                event_dict = event.model_dump()
                if event["choices"]:
                    yield json.dumps(event_dict["choices"][0], ensure_ascii=False) + "\n"
        except Exception as e:
            current_app.logger.error(e)
            yield json.dumps({"error": str(e)}, ensure_ascii=False) + "\n"

    return Response(response_stream())

app.run(debug=True)