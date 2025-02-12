import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [name, setName] = useState(user.name || '');
  const [isEditing, setIsEditing] = useState(false);

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
        setName(data.name);
        setPassword(data.password); // Establecer la contraseña
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
      body: JSON.stringify({ email, password, name }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { throw new Error(err.error); });
        }
        return response.json();
      })
      .then(data => {
        alert('Información actualizada correctamente');
        console.log('Información actualizada:', data);

        // Actualizar el usuario y el token en el contexto
        updateUser({ email, name }, data.token);

        // Limpiar los campos de contraseña
        setPassword('');
        setIsEditing(false);
      })
      .catch(error => {
        alert(`Error al actualizar la información del usuario: ${error.message}`);
        console.error('Error:', error);
      });
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