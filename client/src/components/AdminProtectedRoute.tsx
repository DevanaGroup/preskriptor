import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { currentUser, userLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminPermission = async () => {
      if (!currentUser) {
        setIsChecking(false);
        return;
      }

      try {
        // Verificar no Firestore se o usuário tem permissão de administrador
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissões de administrador para acessar esta página.",
            variant: "destructive"
          });
          
          // Redirecionar para a página inicial se não for admin
          setLocation('/');
        }
      } catch (error) {
        console.error("Erro ao verificar permissões de administrador:", error);
        toast({
          title: "Erro de verificação",
          description: "Ocorreu um erro ao verificar suas permissões. Por favor, tente novamente.",
          variant: "destructive"
        });
        setLocation('/');
      } finally {
        setIsChecking(false);
      }
    };

    if (!userLoading) {
      if (!currentUser) {
        setLocation('/admin');
      } else {
        checkAdminPermission();
      }
    }
  }, [currentUser, userLoading, setLocation, toast]);

  if (userLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Só renderiza o conteúdo se o usuário for administrador
  return isAdmin ? <>{children}</> : null;
};

export default AdminProtectedRoute;