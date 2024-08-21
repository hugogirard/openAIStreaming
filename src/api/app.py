import json
import os

import azure.identity.aio
import openai

from quart import (
    Blueprint,
    stream_with_context
)

bp = Blueprint("app", __name__)

@bp.before_app_serving
async def configure_open_ai():
    bp.openai_client = openai.AsyncAzureOpenAI(
                        api_version="2024-02-15-preview",
                        azure_endpoint=os.environ["OPENAI_AZURE_ENDPOINT"],
                        api_key=os.environ["OPENAI_API_KEY"],
                       )