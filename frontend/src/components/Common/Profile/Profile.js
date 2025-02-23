import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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

    fetchUserData();

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

  return (
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
  );
};

export default Profile;