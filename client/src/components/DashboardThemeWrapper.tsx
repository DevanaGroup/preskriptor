import React, { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface DashboardThemeWrapperProps {
  children: React.ReactNode;
}

const DashboardThemeWrapper: React.FC<DashboardThemeWrapperProps> = ({ children }) => {
  const { theme } = useTheme();

  useEffect(() => {
    // Aplicar tema apenas nas rotas do dashboard
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Cleanup - remover classe dark quando sair do dashboard
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  return <>{children}</>;
};

export default DashboardThemeWrapper;