import React, { useEffect } from 'react';
import './LogoutModal.css';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Evita el scroll cuando el modal está abierto
    } else {
      document.body.style.overflow = 'unset'; // Restaura el scroll cuando el modal está cerrado
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-content">
        <h2>Confirmar Cierre de Sesión</h2>
        <p>¿Estás seguro de que deseas cerrar sesión?</p>
        <div className="modal-buttons">
          <button onClick={handleConfirm} className="confirm-button">Sí</button>
          <button onClick={onClose} className="cancel-button">No</button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;