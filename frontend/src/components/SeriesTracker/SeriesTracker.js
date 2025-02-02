import { useState } from 'react';
import { Search, Plus, Check, Star } from 'lucide-react';
import './SeriesTracker.css';

const SeriesTracker = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [myShows, setMyShows] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchShows = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToMyShows = async (show) => {
    try {
      const response = await fetch('http://localhost:5000/api/user/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(show),
      });
      if (response.ok) {
        setMyShows([...myShows, show]);
      }
    } catch (error) {
      console.error('Error adding show:', error);
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
                      <Plus size={16} className="text-blue-500" />
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