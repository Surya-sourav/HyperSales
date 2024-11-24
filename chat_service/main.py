#chat_service/main.py
import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shared.database import knowledge_collection
import logging
from cerebras.cloud.sdk import Cerebras
import textwrap
from bson import ObjectId

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    chatbot_id: str
    message: str

CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")

# Initialize Cerebras client
client = Cerebras(api_key=CEREBRAS_API_KEY)

# Log to verify the environment variables (without showing the API key)
logger.info(f"Cerebras API Key set: {'Yes' if CEREBRAS_API_KEY else 'No'}")

def preprocess_content(content, max_length: int = 8192) -> str:
    if isinstance(content, dict):
        content = content.get("text", "")
    if not isinstance(content, str):
        logger.error("Content is not a string. Cannot proceed with preprocessing.")
        raise ValueError("Content must be a string.")
    paragraphs = content.split('\n')
    wrapped_paragraphs = [textwrap.shorten(paragraph, width=300, placeholder="...") for paragraph in paragraphs]
    concise_content = " ".join(wrapped_paragraphs)
    return concise_content[:max_length]

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Fetching chatbot with id: {request.chatbot_id}")

        # Convert chatbot_id to ObjectId
        if not ObjectId.is_valid(request.chatbot_id):
            logger.error("Invalid chatbot ID format.")
            raise HTTPException(status_code=400, detail="Invalid chatbot ID format")

        chatbot = knowledge_collection.find_one({"_id": ObjectId(request.chatbot_id)})
        
        if not chatbot:
            logger.error(f"Chatbot not found for id: {request.chatbot_id}")
            raise HTTPException(status_code=404, detail="Chatbot not found")

        # Access the nested scraped_data correctly
        scraped_data = chatbot.get("scraped_data", {})
        if isinstance(scraped_data, dict) and "scraped_data" in scraped_data:
            scraped_data = scraped_data["scraped_data"]
        
        # Get the text content
        context = ""
        if isinstance(scraped_data, dict):
            context = scraped_data.get("text", "")
        elif isinstance(scraped_data, str):
            context = scraped_data

        if not context:
            logger.error("Scraped content is empty. Cannot proceed with chat.")
            raise HTTPException(status_code=400, detail="Scraped content is empty. Cannot proceed with chat.")

        # Preprocess content to make it concise
        concise_context = preprocess_content(context)

        # Prepare prompts for chat
        system_prompt = (
            "You are an intelligent and concise chatbot designed to assist users by answering their questions based on the provided website content. "
    "You should always follow the rules strictly to ensure precision and relevance in your responses."
        )
        user_prompt = f"""
*Rules for your response:*  
1. **If the user's input is a greeting (e.g., "Hi", "Hello"), respond politely in 1-2 sentences.**  
2. **If the user's input is a question, answer in 2-3 sentences based on the scraped website content.**  
3. **Use the context from the website content to provide precise and relevant information.**  
4. **If the website content doesn't answer the question, respond with:** "I'm sorry, I couldn't find this information on the website. Can I help with something else?"  
5. **Do not provide generic, unrelated, or overly long responses.**

*Website Content (Knowledge Base):*  
{concise_context}

*User Question:*  
{request.message}

*Your Response:*
"""

        # Get response from Cerebras LLM
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama3.1-8b",
            max_tokens=800,
            temperature=0.7,
            top_p=1
        )

        if response and response.choices:
            chatbot_response = response.choices[0].message.content
            logger.info(f"Chatbot response: {chatbot_response}")
            return {"response": chatbot_response}
        else:
            logger.error("Failed to get response from Cerebras API")
            raise HTTPException(status_code=500, detail="Failed to get response from Cerebras API")
    except HTTPException as http_exc:
        logger.error(f"HTTP Exception occurred: {str(http_exc)}")
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/try-chatbot")
async def try_chatbot(request: ChatRequest):
    try:
        logger.info(f"Testing chatbot with id: {request.chatbot_id}")
        return await chat(request)
    except HTTPException as http_exc:
        logger.error(f"HTTP Exception occurred while testing chatbot: {str(http_exc)}")
        raise http_exc
    except Exception as e:
        logger.error(f"Unexpected error occurred while testing chatbot: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
