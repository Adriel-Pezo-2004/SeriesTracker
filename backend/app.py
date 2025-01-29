from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuración de TMDB
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

# Rutas para series
@app.route('/api/search', methods=['GET'])
def search_shows():
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

@app.route('/api/show/<int:show_id>', methods=['GET'])
def get_show_details(show_id):
    response = requests.get(
        f'{TMDB_BASE_URL}/tv/{show_id}',
        params={
            'api_key': TMDB_API_KEY,
            'language': 'es-ES'
        }
    )
    return jsonify(response.json())

# Rutas para el tracking de usuario
@app.route('/api/user/shows', methods=['GET', 'POST'])
def user_shows():
    if request.method == 'GET':
        # TODO: Implementar obtención de series del usuario desde la base de datos
        return jsonify({'shows': []})
    
    if request.method == 'POST':
        data = request.json
        # TODO: Implementar guardado de series en la base de datos
        return jsonify({'message': 'Show added successfully'})

if __name__ == '__main__':
    app.run(debug=True)