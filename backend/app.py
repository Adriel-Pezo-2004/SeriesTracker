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
            db_manager.get_user_by_id(data['user_id'])  # Verify user exists
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
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        result = db_manager.register_user(email, password)
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
            'user_id': str(user['_id']),
            'email': email,  # Incluir el email en el token
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'token': token})
    except Exception as e:
        logger.error(f"Error in /api/login: {str(e)}")
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

if __name__ == '__main__':
    app.run(debug=True)