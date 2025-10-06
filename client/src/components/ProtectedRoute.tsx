import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import DashboardThemeWrapper from '@/components/DashboardThemeWrapper';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, userLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!userLoading) {
      setIsChecking(false);
      if (!currentUser) {
        setLocation('/auth');
      } else {
        // Verificar se o usuário tem email verificado
        const currentPath = window.location.pathname;
        
        // CRITICAL: Só redireciona se verified é explicitamente false
        // Undefined ou null não deve causar redirecionamento
        if (currentUser.verified === false && currentPath !== '/dashboard/verificacao') {
          setLocation('/dashboard/verificacao');
        } 
        // Se tem email verificado e está na página de verificação, redirecionar para consulta
        else if (currentUser.verified === true && currentPath === '/dashboard/verificacao') {
          setLocation('/dashboard/consulta');
        }
        // Se fez login e está verificado, mas está na rota /dashboard (que não deve existir), redirecionar para consulta
        else if (currentUser.verified === true && currentPath === '/dashboard') {
          setLocation('/dashboard/consulta');
        }
      }
    }
  }, [currentUser?.verified, userLoading, setLocation]);

  if (userLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se chegou aqui, usuário está autenticado
  return <DashboardThemeWrapper>{children}</DashboardThemeWrapper>;
};

export default ProtectedRoute;