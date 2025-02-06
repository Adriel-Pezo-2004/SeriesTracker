import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './SeriesWatch.css';

const SeriesWatch = () => {
  const [seriesData, setSeriesData] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const [expandedSeason, setExpandedSeason] = useState(null);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const config = {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        };
    
        const response = await axios.get(`http://localhost:5000/api/series/${user.email}`, config);
        setSeriesData(response.data.series);
      } catch (error) {
        setError(`Failed to fetch series: ${error.response?.data?.error || error.message}`);
      }
    };

    if (user && user.email) {
      fetchSeries();
    }
  }, [user]);

  const handleEpisodeToggle = async (seriesIndex, seasonIndex, episodeIndex) => {
    const updatedSeries = [...seriesData];
    const episode = updatedSeries[seriesIndex].seasons[seasonIndex].episodes[episodeIndex];
    episode.watched = !episode.watched;
    setSeriesData(updatedSeries);

    try {
      const response = await axios.post('http://localhost:5000/api/series/update_episode', {
        email: user.email,
        series_id: updatedSeries[seriesIndex].series_id,
        season_number: updatedSeries[seriesIndex].seasons[seasonIndex].season_number,
        episode_number: episode.episode_number,
        watched: episode.watched
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.data.message) {
        throw new Error('Failed to update episode status');
      }
    } catch (error) {
      setError('Failed to update episode status');
    }
  };

  const toggleSeasonExpansion = (seriesIndex, seasonIndex) => {
    const key = `${seriesIndex}-${seasonIndex}`;
    setExpandedSeason(prev => (prev === key ? null : key));
  };

  const calculateProgress = (seasons) => {
    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    seasons.forEach(season => {
      season.episodes.forEach(episode => {
        totalEpisodes++;
        if (episode.watched) {
          watchedEpisodes++;
        }
      });
    });

    return totalEpisodes === 0 ? 0 : (watchedEpisodes / totalEpisodes) * 100;
  };

  return (
    <div className="app-container">
      <h2 className="main-title-profile">Mis Series</h2>
      <div className="results-container">
        {seriesData.map((serie, seriesIndex) => (
          <div key={serie.series_id} className="series-card-watch">
            <div className="series-poster-watch">
              {serie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${serie.poster_path}`}
                  alt={serie.name}
                  className="series-image-watch"
                />
              ) : (
                <div className="series-image-watch no-image">
                  No image available
                </div>
              )}
              <h3 className="series-title-watch">{serie.name}</h3>
            </div>
            <div className="series-content-watch">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${calculateProgress(serie.seasons)}%` }}
                ></div>
                <span className="progress-percentage">
                  {Math.round(calculateProgress(serie.seasons))}%
                </span>
              </div>
              {serie.seasons.map((season, seasonIndex) => (
                <div key={season.season_number} className="season-container">
                  <div 
                    className={`season-header ${expandedSeason === `${seriesIndex}-${seasonIndex}` ? 'expanded' : ''}`}
                    onClick={() => toggleSeasonExpansion(seriesIndex, seasonIndex)}
                  >
                    <span>Temporada {season.season_number}</span>
                    <span className="arrow">▼</span>
                  </div>
                  {expandedSeason === `${seriesIndex}-${seasonIndex}` && (
                    <div className="episodes-container">
                      {season.episodes.map((episode, episodeIndex) => (
                        <div key={episode.episode_number} className="episode-item">
                          <label>
                            <input
                              type="checkbox"
                              checked={episode.watched}
                              onChange={() => handleEpisodeToggle(seriesIndex, seasonIndex, episodeIndex)}
                            />
                            <span className="episode-name">{episode.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeriesWatch;