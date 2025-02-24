import React, { useEffect } from 'react';
import './ConfirmationModal.css'; 

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'; // Evita el scroll cuando el modal está abierto
      } else {
        document.body.style.overflow = 'unset'; // Restaura el scroll cuando el modal está cerrado
      }
    }, [isOpen]);

  return (
    <div className={`confirmation-modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="confirmation-modal-content">
        <p className="confirmation-modal-message">{message}</p>
        <div className="confirmation-modal-buttons">
          <button
            onClick={onClose}
            className="confirmation-modal-button cancel"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="confirmation-modal-button confirm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;