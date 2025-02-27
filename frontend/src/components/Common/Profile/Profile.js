import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalSeries: 0,
    watchedPercentage: 0,
    completedSeries: 0
  });

  useEffect(() => {
    document.body.classList.add('profile-background');

    const fetchUserData = async () => {
      if (!user?.email) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/users?email=${user.email}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener la información del usuario');
        }

        const data = await response.json();
        setEmail(data.email);
        setName(data.name || '');
      } catch (error) {
        console.error('Error al obtener la información del usuario:', error);
      }
    };

    const fetchUserStats = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch(`http://localhost:5000/api/user/stats?email=${user.email}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener las estadísticas del usuario');
        }

        const data = await response.json();
        setStats({
          totalSeries: data.total_series,
          watchedPercentage: data.watched_percentage,
          completedSeries: data.completed_series
        });
      } catch (error) {
        console.error('Error al obtener las estadísticas del usuario:', error);
      }
    };

    fetchUserData();
    fetchUserStats();

    return () => {
      document.body.classList.remove('profile-background');
    };
  }, [user?.email]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const updatedData = { email, name };
    if (password) {
      updatedData.password = password;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la información del usuario');
      }

      const data = await response.json();
      updateUser({ email, name }, data.token);
      setPassword('');
      setIsEditing(false);
      alert('Información actualizada correctamente');
    } catch (error) {
      alert(`Error al actualizar la información del usuario: ${error.message}`);
      console.error('Error:', error);
    }
  };

  // Componente CircularProgress para mostrar gráficos circulares
  const CircularProgress = ({ percentage, label, color }) => {
    return (
      <div className="circular-progress-container">
        <div className="circular-progress" style={{ '--percentage': `${percentage}%`, '--color': color }}>
          <div className="circular-progress-inner">
            <span className="circular-progress-value">{percentage}%</span>
          </div>
        </div>
        <p className="circular-progress-label">{label}</p>
      </div>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1 className="profile-title">Mi Perfil</h1>
        <i className="fas fa-user profile-icon"></i>
        {isEditing ? (
          <form className="profile-form" onSubmit={handleUpdate}>
            <div className="profile-field">
              <label className="profile-label">Email:</label>
              <input
                type="email"
                value={email}
                className="profile-input"
                disabled
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Nombre:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-input"
              />
            </div>
            <div className="profile-field">
              <label className="profile-label">Contraseña:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="profile-input"
              />
            </div>
            <button type="submit" className="profile-button">Actualizar</button>
            <button type="button" className="profile-button" onClick={() => setIsEditing(false)}>Cancelar</button>
          </form>
        ) : (
          <div className="profile-info">
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Nombre:</strong> {name}</p>
            <button className="profile-button" onClick={() => setIsEditing(true)}>Editar</button>
          </div>
        )}
      </div>

      <div className="stats-dashboard-container">
        <h2 className="stats-dashboard-title">Mi Progreso de Series</h2>
        <div className="stats-dashboard-content">
          <CircularProgress 
            percentage={stats.watchedPercentage} 
            label="Episodios Vistos" 
            color="#1db954" 
          />
          <CircularProgress 
            percentage={(stats.completedSeries / stats.totalSeries) * 100 || 0} 
            label="Series Completadas" 
            color="#2e77d0" 
          />
          <div className="stats-dashboard-numbers">
            <div className="stats-number-item">
              <span className="stats-number">{stats.totalSeries}</span>
              <span className="stats-label">Series Totales</span>
            </div>
            <div className="stats-number-item">
              <span className="stats-number">{stats.completedSeries}</span>
              <span className="stats-label">Series Completadas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;