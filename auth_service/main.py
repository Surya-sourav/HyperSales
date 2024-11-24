import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shared.utils import verify_token, create_token
from shared.database import users_collection
from bson import ObjectId
import bcrypt
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRegister(BaseModel):
    email: str
    password: str
    company_name: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/register")
async def register(user: UserRegister):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    new_user = {
        "email": user.email,
        "password": hashed_password,
        "company_name": user.company_name
    }
    result = users_collection.insert_one(new_user)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@app.post("/login")
async def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token({"user_id": str(db_user['_id'])})
    return {"token": token}

@app.get("/user")
async def get_user(token_payload: dict = Depends(verify_token)):
    user_id = token_payload["user_id"]
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user:
        return {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "company_name": user["company_name"]
        }
    raise HTTPException(status_code=404, detail="User not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
