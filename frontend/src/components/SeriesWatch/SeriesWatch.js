import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './SeriesWatch.css';

const SeriesWatch = () => {
  const [seriesData, setSeriesData] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const config = {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        };
    
        console.log('Fetching series for email:', user.email);
    
        const response = await axios.get(`http://localhost:5000/api/series/${user.email}`, config);
        console.log('Response:', response.data);
        setSeriesData(response.data.series);
      } catch (error) {
        console.error('Full error:', error);
        console.error('Error response:', error.response);
        setError(`Failed to fetch series: ${error.response?.data?.error || error.message}`);
      }
    };

    if (user && user.email) {
      fetchSeries();
    }
  }, [user]);

  const handleEpisodeToggle = (seriesIndex, seasonIndex, episodeIndex) => {
    const updatedSeries = [...seriesData];
    updatedSeries[seriesIndex].seasons[seasonIndex].episodes[episodeIndex].watched = !updatedSeries[seriesIndex].seasons[seasonIndex].episodes[episodeIndex].watched;
    setSeriesData(updatedSeries);
    // Aquí puedes agregar una llamada a la API para actualizar el estado en la base de datos
  };

  return (
    <div className="app-container">
      <h2 className="main-title-profile">Mis Series</h2>
      <div className="results-container">
        <div className="series-grid">
          {seriesData.map((serie, seriesIndex) => (
            <div key={serie.series_id} className="series-card">
              <div className="series-image-container">
                {serie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${serie.poster_path}`}
                    alt={serie.name}
                    className="series-image"
                  />
                ) : (
                  <div className="series-image no-image">
                    No image available
                  </div>
                )}
              </div>
              <div className="series-content">
                <h3 className="series-title">{serie.name}</h3>
                {serie.seasons.map((season, seasonIndex) => (
                  <div key={season.season_number}>
                    <h4>Temporada {season.season_number}</h4>
                    <ul>
                      {season.episodes.map((episode, episodeIndex) => (
                        <li key={episode.episode_number}>
                          <label>
                            <input
                              type="checkbox"
                              checked={episode.watched}
                              onChange={() => handleEpisodeToggle(seriesIndex, seasonIndex, episodeIndex)}
                            />
                            {episode.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeriesWatch;