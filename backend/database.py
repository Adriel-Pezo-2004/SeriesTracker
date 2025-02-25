import os
from pymongo import MongoClient
from bson import ObjectId
import jwt
from datetime import datetime, timedelta
import logging

import requests

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

            # Obtener las temporadas y episodios de la serie desde la API de TMDB
            series_id = series['id']
            TMDB_API_KEY = os.getenv('TMDB_API_KEY')
            response = requests.get(
                f'https://api.themoviedb.org/3/tv/{series_id}',
                params={
                    'api_key': TMDB_API_KEY,
                    'language': 'es-ES',
                    'append_to_response': 'seasons'  # Incluir las temporadas en la respuesta
                }
            )
            if response.status_code != 200:
                return {'error': 'No se pudieron obtener los detalles de la serie desde TMDB'}

            series_details = response.json()

            # Verificar si la respuesta contiene las temporadas
            if 'seasons' not in series_details:
                return {'error': 'No se pudieron obtener las temporadas de la serie'}

            # Preparar la estructura de la serie con temporadas y episodios
            series_data = {
                "series_id": series_details['id'],
                "name": series_details['name'],
                "poster_path": series_details['poster_path'],
                "seasons": []
            }

            # Obtener los episodios de cada temporada
            for season in series_details['seasons']:
                season_number = season['season_number']
                season_response = requests.get(
                    f'https://api.themoviedb.org/3/tv/{series_id}/season/{season_number}',
                    params={
                        'api_key': TMDB_API_KEY,
                        'language': 'es-ES'
                    }
                )
                if season_response.status_code != 200:
                    continue  # Saltar esta temporada si no se pueden obtener los episodios

                season_details = season_response.json()

                # Preparar la estructura de la temporada con episodios
                season_data = {
                    "season_number": season_number,
                    "episodes": []
                }

                # Agregar los episodios a la temporada
                for episode in season_details['episodes']:
                    episode_data = {
                        "episode_number": episode['episode_number'],
                        "name": episode['name'],
                        "air_date": episode.get('air_date', ''),  # Usar get para evitar errores si no hay fecha
                        "watched": False  # Por defecto, el episodio no está visto
                    }
                    season_data['episodes'].append(episode_data)

                series_data['seasons'].append(season_data)

            # Guardar la serie en la base de datos
            result = self.series_collection.update_one(
                {"email": email},
                {"$push": {"series": series_data}},
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
            update_fields = {'name': name}
            if password:
                update_fields['password'] = password

            result = self.users_collection.update_one(
                {'email': email},
                {'$set': update_fields}
            )

            if result.modified_count == 0:
                return {'error': 'No se realizaron cambios'}

            # Generar nuevo token con el nuevo nombre
            token = jwt.encode({
                'email': email,
                'name': name,
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, 'your_secret_key', algorithm="HS256")

            return {'message': 'Información actualizada correctamente', 'token': token}
        except Exception as e:
            logger.error(f"Error actualizando usuario: {str(e)}")
            return {'error': 'Error interno del servidor'}

    def update_series_rating(self, email, series_id, rating):
        try:
            result = self.series_collection.update_one(
                {"email": email, "series.series_id": series_id},
                {"$set": {"series.$.rating": rating}}
            )
            return result
        except Exception as e:
            logger.error(f"Error updating series rating: {str(e)}")
            raise