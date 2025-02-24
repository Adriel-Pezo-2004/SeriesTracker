import React, { useEffect, useState } from 'react';

const SuccessMessage = ({ message, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="success-message">
      <p>{message}</p>
    </div>
  );
};

export default SuccessMessage;