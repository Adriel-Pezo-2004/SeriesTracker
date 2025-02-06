import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Search, Plus, Check, Star } from 'lucide-react';
import './SeriesTracker.css';

const SeriesTracker = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [myShows, setMyShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const searchShows = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/search/tv`, {
        params: {
          api_key: '4e62a98e6cff448f769687990cc3be36',
          query: searchQuery,
          language: 'es-ES'
        }
      });
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToMyShows = async (show) => {
    try {
      const response = await axios.post('http://localhost:5000/api/series/add', {
        email: user.email,
        series_id: show.id
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.message) {
        setMyShows([...myShows, show]);
        alert('Series added successfully');
      } else {
        alert('Failed to add series');
      }
    } catch (error) {
      console.error('Error adding series:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <div className="search-section">
        <h1 className="main-title">¿Qué serie estás buscando?</h1>
        
        <form onSubmit={searchShows} className="search-form">
          <div className="search-wrapper">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar series..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              <Search size={25} />
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="loading-container">Cargando...</div>
      ) : (
        <div className="results-container">
          <div className="series-grid">
            {searchResults.map((show) => (
              <div key={show.id} className="series-card">
                <div className="series-image-container">
                  {show.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                      alt={show.name}
                      className="series-image"
                    />
                  ) : (
                    <div className="series-image no-image">
                      No image available
                    </div>
                  )}
                  <button
                    onClick={() => addToMyShows(show)}
                    className="add-button"
                    disabled={myShows.some((s) => s.id === show.id)}
                  >
                    {myShows.some((s) => s.id === show.id) ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <span className="text-blue-500">+</span>
                    )}
                  </button>
                </div>
                
                <div className="series-content">
                  <h3 className="series-title">{show.name}</h3>
                  <div className="series-metadata">
                    <span className="series-year">{show.first_air_date?.split('-')[0]}</span>
                    <span className="series-genre">Social drama</span>
                  </div>
                  <div className="series-rating">
                    <Star size={16} className="text-yellow-400" />
                    <span>{show.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesTracker;