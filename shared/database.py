from pymongo import MongoClient
import os

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Create a new client and connect to the server
client = MongoClient(MONGO_URI)

# Access the database
db = client["chatbot_db"]

# Access the collections
knowledge_collection = db["knowledge"]
