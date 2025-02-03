from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    _instance = None
    
    def __init__(self):
        if not DatabaseManager._instance:
            try:
                self.client = MongoClient('mongodb://localhost:27017')
                self.db = self.client['SeriesTracker']
                self.users_collection = self.db['Usuarios']
                self.series_collection = self.db['Series']  # Asegúrate de tener una colección para las series
                DatabaseManager._instance = self
                logger.info("Successfully connected to MongoDB")
            except Exception as e:
                logger.error(f"Error connecting to MongoDB: {str(e)}")
                raise

    def register_user(self, email, password):
        if self.users_collection.find_one({"email": email}):
            return {"error": "User already exists"}
        user = {
            "email": email,
            "password": password,  # Store password as plain text (not recommended for production)
            "created_at": datetime.utcnow()
        }
        self.users_collection.insert_one(user)
        return {"message": "User registered successfully"}

    def authenticate_user(self, email, password):
        user = self.users_collection.find_one({"email": email})
        if user and user['password'] == password:  # Compare plain text passwords
            return user
        return None
    
    def get_user_series(self, user_id):
        try:
            user_series = self.series_collection.find_one({"user_id": ObjectId(user_id)})
            if user_series:
                return user_series['series']
            return []
        except Exception as e:
            logger.error(f"Error getting user series: {str(e)}")
            raise