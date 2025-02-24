import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Search, Plus, Check, Star } from 'lucide-react';
import ErrorModal from '../Modals/ErrorModal/ErrorModal';
import ConfirmationModal from '../Modals/ConfirmationModal/ConfirmationModal';
import SuccessMessage from '../Modals/SuccessMessage/SuccessMessage';
import './SeriesTracker.css';

const SeriesTracker = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [myShows, setMyShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [currentRecommendation, setCurrentRecommendation] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchUserShows = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/series/${user.email}`);
        if (response.data.series) {
          setMyShows(response.data.series);
        }
      } catch (error) {
        console.error('Error fetching user shows:', error);
      }
    };
  
    if (user?.email) {
      fetchUserShows();
    }
  }, [user]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/recommendations');
        setRecommendations(response.data.recommendations);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
    };

    fetchRecommendations();
  }, []);

  useEffect(() => {
    let index = 0;
    let timeout;

    const typeWriterEffect = () => {
      if (index < recommendations.length) {
        const currentText = recommendations[index];
        const textLength = currentText.length;

        // Tiempo por letra: 0.1s para una escritura más suave
        const timePerLetter = 150;

        // Escribir el texto letra por letra
        let currentIndex = 0;
        const writeInterval = setInterval(() => {
          if (currentIndex <= textLength) {
            setCurrentRecommendation(currentText.slice(0, currentIndex));
            currentIndex++;
          } else {
            clearInterval(writeInterval);

            // Esperar 1 segundo después de escribir
            timeout = setTimeout(() => {
              // Borrar el texto letra por letra
              let deleteIndex = textLength;
              const deleteInterval = setInterval(() => {
                if (deleteIndex >= 0) {
                  setCurrentRecommendation(currentText.slice(0, deleteIndex));
                  deleteIndex--;
                } else {
                  clearInterval(deleteInterval);

                  // Pasar al siguiente texto
                  index++;
                  if (index >= recommendations.length) {
                    index = 0; // Reiniciar el índice si llegamos al final
                  }

                  // Iniciar el siguiente ciclo
                  typeWriterEffect();
                }
              }, timePerLetter); // Mismo tiempo por letra para borrar
            }, 1000); // Esperar 1 segundo después de escribir
          }
        }, timePerLetter); // Tiempo por letra para escribir
      }
    };

    // Iniciar el efecto
    typeWriterEffect();

    // Limpiar intervalos y timeouts al desmontar el componente
    return () => {
      clearTimeout(timeout);
    };
  }, [recommendations]);

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
    if (myShows.some((s) => s.id === show.id || s.series_id === show.id)) {
      setErrorMessage('Esta serie ya ha sido agregada.');
      setIsErrorModalOpen(true);
      return;
    }

    console.log('Opening modal...');
    setSelectedShow(show);
    setIsConfirmationModalOpen(true);
  };
  
  const confirmAddToMyShows = async () => {
    setIsConfirmationModalOpen(false);
  
    try {
      const response = await axios.post('http://localhost:5000/api/series/add', {
        email: user.email,
        series_id: selectedShow.id
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (response.data.message) {
        // Recargar las series del usuario después de añadir una nueva
        const updatedSeriesResponse = await axios.get(`http://localhost:5000/api/series/${user.email}`);
        if (updatedSeriesResponse.data.series) {
          setMyShows(updatedSeriesResponse.data.series);
        }
        setShowSuccessMessage(true);
      } else {
        setErrorMessage(response.data.error || 'Failed to add series');
        setIsErrorModalOpen(true);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'An error occurred. Please try again.');
      setIsErrorModalOpen(true);
    }
  };

  return (
    <div className="app-container">
      <div className="search-section">
        <h1 className="main-title">¿Qué serie estás buscando?</h1>
        <div className="recommendations">
          <span>{currentRecommendation}</span>
        </div>
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
                    className={`add-button ${
                      myShows.some((s) => s.id === show.id || s.series_id === show.id)
                        ? "checked"
                        : "plus"
                    }`}
                    disabled={myShows.some((s) => s.id === show.id || s.series_id === show.id)}
                  >
                    {myShows.some((s) => s.id === show.id || s.series_id === show.id) ? (
                      <Check size={16} />
                    ) : (
                      <Plus size={16} />
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

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={confirmAddToMyShows}
        message="¿Estás seguro de que quieres agregar esta serie?"
      />
      {showSuccessMessage && (
        <SuccessMessage
          message="Serie agregada exitosamente"
          onClose={() => setShowSuccessMessage(false)}
        />
      )}
    </div>
  );
};

export default SeriesTracker;