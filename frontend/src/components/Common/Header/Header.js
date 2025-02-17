import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import LogoutModal from '../../Users/LogoutModal/LogoutModal';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          {user ? (
            <>
              <li><Link to="/series">Series</Link></li>
              <li><Link to="/perfil">{user.name}</Link></li>
              <li><button className="logout-link" onClick={() => setIsModalOpen(true)}>Logout</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/registro">Registro</Link></li>
            </>
          )}
        </ul>
      </nav>
      <LogoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
};

export default Header;