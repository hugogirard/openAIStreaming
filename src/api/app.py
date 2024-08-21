import json
import os
from dotenv import load_dotenv
import azure.identity.aio
import openai
from quart_cors import cors

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
app = cors(app, allow_origin="http://localhost:3000", allow_methods=["*"])
bp = Blueprint("app", __name__)

@bp.before_app_serving
async def configure_open_ai():
    bp.openai_client = openai.AsyncAzureOpenAI(
                        api_version="2024-02-15-preview",
                        azure_endpoint=os.getenv("OPENAI_AZURE_ENDPOINT"),
                        api_key=os.getenv("OPENAI_API_KEY"),
                       )
    bp.openai_model = os.getenv("OPENAI_MODEL")

@bp.after_app_serving
async def shutdown():
    bp.openai_client.close()

@bp.post('/chat/stream')        
async def chat_handler():
    data = await request.get_json()
    if data is None or "prompt" not in data:
        return Response(json.dumps({"error": "Invalid request, JSON body with 'prompt' is required"}), status=400, mimetype='application/json')

    prompt = data["prompt"]

    @stream_with_context
    async def response_stream():
        all_messages = [
            { "role": "system", "content": "You are a helpful chat assistant" }
        ]

        all_messages.append({ "role": "user", "content": prompt })

        chat_coroutine = bp.openai_client.chat.completions.create(
                            model=bp.openai_model,
                            messages=all_messages,
                            stream=True
                        )
        try:
            async for event in await chat_coroutine:
                if event.choices:
                    yield json.dumps(event, ensure_ascii=False) + "\n"
        except Exception as e:
            current_app.logger.error(e)
            yield json.dumps({"error": str(e)}, ensure_ascii=False) + "\n"

    return Response(response_stream())

app.register_blueprint(bp)

app.run(debug=True)