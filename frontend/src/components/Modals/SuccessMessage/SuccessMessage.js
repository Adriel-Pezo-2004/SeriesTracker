import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react'; // Importar el ícono X de lucide-react
import './SucessMessage.css';

const SuccessMessage = ({ message, duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose(); // Llama a la función onClose para cerrar el mensaje
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className="success-message-overlay active">
      <div className="success-message-content">
        <button
          onClick={onClose} 
          className="close-button"
        >
          <X size={20} /> {}
        </button>
        <p className="success-message-text">{message}</p>
      </div>
    </div>
  );
};

export default SuccessMessage;