from pymongo import MongoClient
from bson import ObjectId
import jwt
from datetime import datetime, timedelta
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
                self.series_collection = self.db['Series']
                DatabaseManager._instance = self
                logger.info("Successfully connected to MongoDB")
            except Exception as e:
                logger.error(f"Error connecting to MongoDB: {str(e)}")
                raise
    
    def get_series_by_user(self, email, series_id):
        return self.series_collection.find_one({"email": email, "series.series_id": series_id}) is not None

    def add_series_to_user(self, email, series):
        try:
            if self.get_series_by_user(email, series['id']):
                return {'error': 'Esta serie ya ha sido agregada'}

            result = self.series_collection.update_one(
                {"email": email},
                {"$push": {"series": series}},
                upsert=True
            )
            return result
        except Exception as e:
            logger.error(f"Error adding series to user: {str(e)}")
            raise

    def register_user(self, email, password, name):
        if self.users_collection.find_one({"email": email}):
            return {"error": "User already exists"}
        user = {
            "email": email,
            "password": password,  
            "name": name,
            "created_at": datetime.utcnow()
        }
        self.users_collection.insert_one(user)
        return {"message": "User registered successfully"}

    def authenticate_user(self, email, password):
        user = self.users_collection.find_one({"email": email, "password": password})
        if user:
            return {"email": user["email"], "name": user["name"]}
        return None

    def get_user_series_by_email(self, email):
        try:
            user_series_doc = self.series_collection.find_one({"email": email})
            if user_series_doc:
                return user_series_doc['series']
            return []
        except Exception as e:
            logger.error(f"Error getting user series: {str(e)}")
            raise
    
    def update_episode_status(self, email, series_id, season_number, episode_number, watched):
        try:
            result = self.series_collection.update_one(
                {"email": email, "series.series_id": series_id, "series.seasons.season_number": season_number, "series.seasons.episodes.episode_number": episode_number},
                {"$set": {"series.$[series].seasons.$[season].episodes.$[episode].watched": watched}},
                array_filters=[{"series.series_id": series_id}, {"season.season_number": season_number}, {"episode.episode_number": episode_number}]
            )
            return result
        except Exception as e:
            logger.error(f"Error updating episode status: {str(e)}")
            raise

    def get_user_by_email(self, email):
        try:
            user = self.users_collection.find_one({'email': email})
            if user:
                return {'email': user['email'], 'name': user['name'], 'password': user['password']}
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            raise
    
    def update_user_info(self, email, password, name):
        try:
            # Aquí deberías actualizar la información del usuario en la base de datos
            result = self.users_collection.update_one(
                {'email': email},
                {'$set': {'password': password, 'name': name}}
            )
            if result.modified_count == 0:
                return {'error': 'Failed to update user info'}

            # Generar un nuevo token con el nuevo nombre
            token = jwt.encode({
                'email': email,
                'name': name,
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, 'your_secret_key', algorithm="HS256")

            return {'message': 'User info updated successfully', 'token': token}
        except Exception as e:
            logger.error(f"Error updating user info: {str(e)}")
            raise