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
@token_required
def add_series():
    try:
        data = request.get_json()
        email = data.get('email')
        series_id = data.get('series_id')

        if not email or not series_id:
            return jsonify({'error': 'Email and series_id are required'}), 400

        # Verificar si la serie ya ha sido añadida por el usuario
        if db_manager.get_series_by_user(email, series_id):
            return jsonify({'error': 'Esta serie ya ha sido agregada'}), 400

        # Obtener detalles de la serie desde la API de TMDB
        response = requests.get(
            f'https://api.themoviedb.org/3/tv/{series_id}',
            params={'api_key': TMDB_API_KEY, 'language': 'es-ES'}
        )
        series_data = response.json()

        if 'id' not in series_data:
            return jsonify({'error': 'Invalid series ID'}), 400

        # Agregar la serie a la base de datos
        result = db_manager.add_series_to_user(email, series_data)
        if result.modified_count == 0:
            return jsonify({'error': 'Failed to add series'}), 400

        return jsonify({'message': 'Series added successfully'})
    except Exception as e:
        logger.error(f"Error in /api/series/add: {str(e)}")
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
        password = data.get('password')
        name = data.get('name')

        if not email or not password or not name:
            return jsonify({'error': 'Email, password, and name are required'}), 400

        result = db_manager.update_user_info(email, password, name)
        if 'error' in result:
            return jsonify(result), 400

        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in /api/users: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    app.run(debug=True)

