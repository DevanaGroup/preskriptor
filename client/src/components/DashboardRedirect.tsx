import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const DashboardRedirect: React.FC = () => {
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectBasedOnPreference = async () => {
      if (!currentUser?.uid) {
        navigate('/auth');
        return;
      }

      try {
        // Buscar preferências do usuário
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        // Sempre redirecionar para consulta
        navigate('/dashboard/consulta');
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
        // Em caso de erro, usar o padrão (módulos)
        navigate('/dashboard/consulta');
      } finally {
        setLoading(false);
      }
    };

    redirectBasedOnPreference();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Carregando suas preferências...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardRedirect;