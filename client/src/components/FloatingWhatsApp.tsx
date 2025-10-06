import React from 'react';

const FloatingWhatsApp: React.FC = () => {
  return (
    <a 
      href="https://wa.me/5521995929293" 
      className="fixed bottom-6 right-6 bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contato via WhatsApp"
    >
      <i className="fab fa-whatsapp text-2xl"></i>
    </a>
  );
};

export default FloatingWhatsApp;
