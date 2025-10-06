import React from 'react';
import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  message?: string;
  type?: 'audio' | 'document' | 'general';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = 'Processando...', 
  type = 'general' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'audio':
        return (
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L16.707 6.707A1 1 0 0117 7.414V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const getLoadingMessage = () => {
    switch (type) {
      case 'audio':
        return 'Transcrevendo áudio e enviando para IA...';
      case 'document':
        return 'Extraindo texto do documento e analisando...';
      default:
        return message;
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-8 space-y-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Ícone animado */}
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
        />
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          {getIcon()}
        </div>
      </div>
      
      {/* Mensagem principal */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {getLoadingMessage()}
        </h3>
        <p className="text-sm text-gray-600">
          Aguarde enquanto processamos sua solicitação
        </p>
      </div>
      
      {/* Indicador de progresso animado */}
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ x: [-192, 192] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: '25%' }}
        />
      </div>
      
      {/* Pontos animados */}
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingIndicator;