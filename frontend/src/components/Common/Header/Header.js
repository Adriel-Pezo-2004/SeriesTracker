import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="header">
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          {user ? (
            <>
              <li><Link to="/series">Series</Link></li>
              <li><Link to="/perfil">{user.email}</Link></li>
              <li><Link to="/logout">Logout</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/registro">Registro</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;