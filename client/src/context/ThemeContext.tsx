import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getUserSettings, updateUserSettings } from '@/lib/firebase';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Carregar tema do usuário quando fizer login
  useEffect(() => {
    const loadTheme = async () => {
      if (currentUser?.uid) {
        const settings = await getUserSettings(currentUser.uid);
        setTheme(settings.theme);
        // Não aplicar tema globalmente aqui
      }
    };
    loadTheme();
  }, [currentUser]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Salvar no Firebase se o usuário estiver logado
    if (currentUser?.uid) {
      try {
        await updateUserSettings(currentUser.uid, { theme: newTheme });
      } catch (error) {
        console.error('Erro ao salvar tema:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};