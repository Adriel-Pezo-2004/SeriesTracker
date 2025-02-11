import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState(user.email);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Obtener la información del usuario desde el backend usando el email
    fetch(`http://localhost:5000/api/users?email=${user.email}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        setEmail(data.email);
      })
      .catch(error => console.error('Error al obtener la información del usuario:', error));
  }, [user.email]);

  const handleUpdate = (e) => {
    e.preventDefault();
    // Actualizar la información del usuario en el backend usando el email
    fetch(`http://localhost:5000/api/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ email, new_email: newEmail, password }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al actualizar la información del usuario');
        }
        return response.json();
      })
      .then(data => {
        alert('Información actualizada correctamente');
        console.log('Información actualizada:', data);

        // Guardar el nuevo token en el almacenamiento local
        localStorage.setItem('token', data.token);

        // Actualizar el estado del email
        setEmail(newEmail);
        setNewEmail('');
        setPassword('');
      })
      .catch(error => {
        alert('Error al actualizar la información del usuario');
        console.error(error);
      });
  };

  return (
    <div className="profile-container">
      <h1 className="profile-title">Mi Perfil</h1>
      <form className="profile-form" onSubmit={handleUpdate}>
        <div className="profile-field">
          <label className="profile-label">Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="profile-input"
            disabled
          />
        </div>
        <div className="profile-field">
          <label className="profile-label">Nuevo Email:</label>
          <input 
            type="email" 
            value={newEmail} 
            onChange={(e) => setNewEmail(e.target.value)} 
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
      </form>
    </div>
  );
};

export default Profile;