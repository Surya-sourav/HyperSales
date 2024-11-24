import sys
import os
from pathlib import Path
import secrets
import httpx 
# Add the parent directory to the Python path
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
import logging
from shared.database import knowledge_collection
import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatbotCreationRequest(BaseModel):
    user_id: str
    chatbot_name: str
    website_url: str
    scraped_data: dict

class ExternalChatRequest(BaseModel):
    message: str

def generate_api_key():
    return secrets.token_urlsafe(32)

@app.post("/create-chatbot")
async def create_chatbot(request: ChatbotCreationRequest):
    try:
        api_key = generate_api_key()
        chatbot_data = {
            "_id": ObjectId(),
            "user_id": request.user_id,
            "chatbot_name": request.chatbot_name,
            "website_url": request.website_url,
            "scraped_data": request.scraped_data,
            "api_key": api_key,
            "created_at": datetime.datetime.utcnow()
        }

        result = knowledge_collection.insert_one(chatbot_data)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create chatbot in database")

        logger.info(f"Created chatbot with ID: {result.inserted_id}")
        return {
            "message": "Chatbot created successfully",
            "chatbot_id": str(result.inserted_id),
            "api_key": api_key
        }

    except Exception as e:
        logger.error(f"Error creating chatbot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-chatbots/{user_id}")
async def get_chatbots(user_id: str):
    try:
        chatbots = list(knowledge_collection.find({"user_id": user_id}))
        if not chatbots:
            logger.warning(f"No chatbots found for user_id: {user_id}")
            return []
        
        for chatbot in chatbots:
            chatbot["_id"] = str(chatbot["_id"])
        
        logger.info(f"Retrieved {len(chatbots)} chatbots for user_id: {user_id}")
        return chatbots

    except Exception as e:
        logger.error(f"Error fetching chatbots: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/external-chat/{api_key}")
async def external_chat(api_key: str, request: ExternalChatRequest):
    try:
        # Find the chatbot by API key
        chatbot = knowledge_collection.find_one({"api_key": api_key})
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found")

        # Forward the request to the chat service
        chat_service_url = "http://localhost:8003/chat"
        
        chat_request = {
            "chatbot_id": str(chatbot["_id"]),
            "message": request.message
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                chat_service_url,
                json=chat_request
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Chat service error"
                )
            
            return response.json()

    except Exception as e:
        logger.error(f"Error in external chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
