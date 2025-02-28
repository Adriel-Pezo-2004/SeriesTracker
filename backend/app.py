from flask import Flask, request, jsonify
from flask_cors import CORS
from bson import ObjectId
import requests
import os
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta
from bson.errors import InvalidId
from database import DatabaseManager
import jwt  
from functools import wraps

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'  # Asegúrate de tener una clave secreta configurada

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuración de TMDB
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database manager
db_manager = DatabaseManager()

# Error handler for invalid ObjectId
@app.errorhandler(InvalidId)
def handle_invalid_id(error):
    return jsonify({'error': 'Invalid requirement ID format'}), 400

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 403
        try:
            token = token.split(" ")[1]  # Remove 'Bearer' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            db_manager.get_user_by_email(data['email'])  # Verify user exists
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid!'}), 403
        except Exception as e:
            logger.error(f"Token error: {str(e)}")
            return jsonify({'error': 'Token is invalid!'}), 403
        return f(*args, **kwargs)
    return decorated

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        if not email or not password or not name:
            return jsonify({'error': 'Email, password, and name are required'}), 400
        result = db_manager.register_user(email, password, name)
        return jsonify(result), 201 if 'message' in result else 400
    except Exception as e:
        logger.error(f"Error in /api/register: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500
    
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        user = db_manager.authenticate_user(email, password)
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        token = jwt.encode({
            'email': email,
            'name': user['name'],  # Incluir el nombre en el token
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'token': token, 'name': user['name']})
    except Exception as e:
        logger.error(f"Error in /api/login: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/series/add', methods=['POST'])
def add_series():
    try:
        data = request.get_json()
        email = data.get('email')
        series_id = data.get('series_id')
        
        if not email or not series_id:
            return jsonify({'error': 'Email and series_id are required'}), 400

        # Obtener detalles de la serie desde la API de TMDB
        response = requests.get(
            f'{TMDB_BASE_URL}/tv/{series_id}',
            params={'api_key': TMDB_API_KEY, 'language': 'es-ES'}
        )
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch series details from TMDB'}), 500

        series_data = response.json()
        
        genres = [genre['name'] for genre in series_data.get('genres', [])]
        series_data['genres'] = genres  # Agregar géneros

        result = db_manager.add_series_to_user(email, series_data)
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to add series'}), 400

        return jsonify({'message': 'Series added successfully'})
    except Exception as e:
        logging.error(f"Error in /api/series/add: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/api/series/<email>', methods=['GET'])
def get_user_series(email):
    try:
        logger.info(f"Received request for email: {email}")
        user_series = db_manager.get_user_series_by_email(email)
        
        if not user_series:
            logger.info(f"No series found for email: {email}")
            return jsonify({'series': []})
        
        logger.info(f"Found series for user: {len(user_series)} series")
        return jsonify({'series': user_series})
    except Exception as e:
        logger.error(f"Error in /api/series/{email}: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500
    
@app.route('/api/show/<int:show_id>', methods=['GET'])
def get_show_details(show_id):
    try:
        response = requests.get(
            f'{TMDB_BASE_URL}/tv/{show_id}',
            params={
                'api_key': TMDB_API_KEY,
                'language': 'es-ES'
            }
        )
        return jsonify(response.json())
    except Exception as e:
        logger.error(f"Error in /api/show/{show_id}: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/search', methods=['GET'])
def search_shows():
    try:
        query = request.args.get('query', '')
        if not query:
            return jsonify({'error': 'Query parameter is required'}), 400
        
        response = requests.get(
            f'{TMDB_BASE_URL}/search/tv',
            params={
                'api_key': TMDB_API_KEY,
                'query': query,
                'language': 'es-ES'
            }
        )
        return jsonify(response.json())
    except Exception as e:
        logger.error(f"Error in /api/search: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

# Rutas para el tracking de usuario
@app.route('/api/user/shows', methods=['GET', 'POST'])
def user_shows():
    try:
        if request.method == 'GET':
            # TODO: Implementar obtención de series del usuario desde la base de datos
            return jsonify({'shows': []})
        
        if request.method == 'POST':
            data = request.json
            # TODO: Implementar guardado de series en la base de datos
            return jsonify({'message': 'Show added successfully'})
    except Exception as e:
        logger.error(f"Error in /api/user/shows: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/series/update_episode', methods=['POST'])
@token_required
def update_episode():
    try:
        data = request.get_json()
        email = data.get('email')
        series_id = data.get('series_id')
        season_number = data.get('season_number')
        episode_number = data.get('episode_number')
        watched = data.get('watched')

        if not email or not series_id or not season_number or not episode_number or watched is None:
            return jsonify({'error': 'Missing required fields'}), 400

        result = db_manager.update_episode_status(email, series_id, season_number, episode_number, watched)
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to update episode status'}), 400

        return jsonify({'message': 'Episode status updated successfully'})
    except Exception as e:
        logger.error(f"Error in /api/series/update_episode: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    try:
        response = requests.get(
            f'{TMDB_BASE_URL}/tv/popular',
            params={
                'api_key': TMDB_API_KEY,
                'language': 'es-ES',
                'page': 1
            }
        )
        data = response.json()
        recommendations = [show['name'] for show in data['results']]
        return jsonify({'recommendations': recommendations})
    except Exception as e:
        logger.error(f"Error in /api/recommendations: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/users', methods=['GET'])
@token_required
def get_user_info():
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user = db_manager.get_user_by_email(email)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'email': user['email'], 'name': user['name'], 'password': user['password']})
    except Exception as e:
        logger.error(f"Error in /api/users: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500
    
@app.route('/api/users', methods=['PUT'])
@token_required
def update_user_info():
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name')
        password = data.get('password')

        if not email or not name:
            return jsonify({'error': 'Email and name are required'}), 400

        # Llamar a la función de actualización en database.py
        result = db_manager.update_user_info(email, password, name)
        if 'error' in result:
            return jsonify(result), 400

        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in /api/users: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/series/update_rating', methods=['POST'])
@token_required
def update_rating():
    try:
        data = request.get_json()
        email = data.get('email')
        series_id = data.get('series_id')
        rating = data.get('rating')

        if not email or not series_id or rating is None:
            return jsonify({'error': 'Missing required fields'}), 400

        result = db_manager.update_series_rating(email, series_id, rating)
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to update series rating'}), 400

        return jsonify({'message': 'Series rating updated successfully'})
    except Exception as e:
        logger.error(f"Error in /api/series/update_rating: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/user/stats', methods=['GET'])
@token_required
def get_user_stats():
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user_series = db_manager.get_user_series_by_email(email)
        if not user_series:
            return jsonify({'error': 'No series found for this user'}), 404

        total_series = len(user_series)
        total_episodes = 0
        watched_episodes = 0
        completed_series = 0

        for series in user_series:
            for season in series['seasons']:
                total_episodes += len(season['episodes'])
                watched_episodes += sum(1 for episode in season['episodes'] if episode['watched'])

            # Check if the series is completed (all episodes watched)
            if all(episode['watched'] for season in series['seasons'] for episode in season['episodes']):
                completed_series += 1

        if total_episodes == 0:
            watched_percentage = 0
        else:
            watched_percentage = (watched_episodes / total_episodes) * 100

        return jsonify({
            'total_series': total_series,
            'watched_percentage': round(watched_percentage, 2),
            'completed_series': completed_series
        })
    except Exception as e:
        logger.error(f"Error in /api/user/stats: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/api/user/genre_stats', methods=['GET'])
@token_required
def get_genre_stats():
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user_series = db_manager.get_user_series_by_email(email)
        if not user_series:
            return jsonify({'error': 'No series found for this user'}), 404

        # Count genres
        genre_counts = {}
        for series in user_series:
            for genre in series.get('genres', []):
                if genre in genre_counts:
                    genre_counts[genre] += 1
                else:
                    genre_counts[genre] = 1
        
        # Convert to list of objects for the frontend
        genre_data = [{"name": genre, "count": count} for genre, count in genre_counts.items()]
        
        return jsonify({
            'genres': genre_data
        })
    except Exception as e:
        logger.error(f"Error in /api/user/genre_stats: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    app.run(debug=True)

