import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook que reseta o scroll para o topo sempre que a rota mudar
 */
export const useScrollToTop = () => {
  const [location] = useLocation();
  
  useEffect(() => {
    // Scroll para o topo da página quando a rota mudar
    window.scrollTo(0, 0);
  }, [location]);
};