import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; 


const SeriesWatch = () => {
  const [seriesData, setSeriesData] = useState([]);
  const token = localStorage.getItem('token');
  let userId = null;

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      userId = decodedToken.user_id;
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await axios.get(`/api/series/${userId}`);
        setSeriesData(response.data.series);
      } catch (error) {
        console.error('Error fetching series data:', error);
      }
    };

    if (userId) {
      fetchSeries();
    }
  }, [userId]);

  const handleEpisodeToggle = (seriesIndex, seasonIndex, episodeIndex) => {
    const updatedSeries = [...seriesData];
    updatedSeries[seriesIndex].seasons[seasonIndex].episodes[episodeIndex].watched = !updatedSeries[seriesIndex].seasons[seasonIndex].episodes[episodeIndex].watched;
    setSeriesData(updatedSeries);
    // Aquí puedes agregar una llamada a la API para actualizar el estado en la base de datos
  };

  return (
    <div>
      <h2>Checklist de Series</h2>
      {seriesData.map((serie, seriesIndex) => (
        <div key={serie.series_id}>
          <h3>{serie.name}</h3>
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
      ))}
    </div>
  );
};

export default SeriesWatch;