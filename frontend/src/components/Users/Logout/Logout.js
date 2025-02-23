import React, { useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import LogoutModal from '../LogoutModal/LogoutModal';

const Logout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  useEffect(() => {
    handleLogout();
  }, [handleLogout]);

  return <LogoutModal isOpen={true} onClose={() => navigate(-1)} />;
};

export default Logout;