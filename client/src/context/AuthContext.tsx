import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  auth, 
  db,
  onAuthStateChanged, 
  FirebaseUser, 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  logoutUser,
  getUserProfile,
  User
} from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// Interface para os dados combinados do usuário (Firebase Auth + Firestore)
interface CombinedUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  name?: string;
  cellphone?: string;
  crm?: string;
  firestoreId?: string;
  photoURL?: string | null;
  isAdmin?: boolean;
  verified?: boolean;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  currentUser: CombinedUserData | null;
  firestoreUser: User | null;
  userLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, cellphone?: string, crm?: string, termsAccepted?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CombinedUserData | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {

    
    // Timeout para evitar bloqueio indefinido da UI
    const timeoutId = setTimeout(() => {
      if (userLoading) {

        setUserLoading(false);
        toast({
          title: "Aviso",
          description: "Conexão com o servidor limitada. Algumas funcionalidades podem estar indisponíveis.",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
      }
    }, 5000);
    
    // Listener para mudanças no estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      
      if (user) {
        try {

          
          // Race entre o Firestore e um timeout para prevenir bloqueio
          const firestorePromise = Promise.race([
            getUserProfile(user.uid),
            new Promise<null>((resolve) => {
              setTimeout(() => {
                // Timeout reached
                resolve(null);
              }, 3000);
            })
          ]);
          
          const userProfile = await firestorePromise;
          // User profile retrieved
          
          if (userProfile) {
            // Se temos dados do Firestore, usamos eles
            setFirestoreUser(userProfile);
            const fullUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              name: userProfile.name,
              cellphone: userProfile.cellphone,
              crm: userProfile.crm,
              firestoreId: userProfile.id,
              photoURL: user.photoURL,
              verified: userProfile.verified || false
            };
            setCurrentUser(fullUserData);
            // Log completo do usuário
            console.log("🔐 USUÁRIO LOGADO - DADOS COMPLETOS:", fullUserData);
            console.log("📋 Detalhes do perfil Firestore:", userProfile);
            console.log("🔥 Dados básicos do Firebase Auth:", {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            });
            // User data updated with Firestore profile
          } else {
            // Se não, usamos apenas os dados básicos do Auth
            console.log("No Firestore profile found or timeout, using basic user data");
            const basicUserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              verified: false // Por padrão, novos usuários não estão verificados
            };
            setCurrentUser(basicUserData);
            console.log("🔐 USUÁRIO LOGADO - DADOS BÁSICOS (SEM FIRESTORE):", basicUserData);
            
            // Tentativa em background de criar perfil no Firestore
            try {
              console.log("Attempting to create Firestore profile for new user (background)");
              setDoc(doc(db, "users", user.uid), {
                name: user.displayName || user.email?.split("@")[0] || "Usuário",
                email: user.email || "",
                uid: user.uid,
                cellphone: user.phoneNumber || "",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              }).then(() => {
                console.log("Created Firestore profile successfully (background)");
              }).catch(err => {
                console.error("Failed to create Firestore profile in background:", err);
              });
            } catch (createError) {
              console.error("Failed to initiate Firestore profile creation:", createError);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Modo offline",
            description: "Operando com dados básicos devido a problemas de conexão",
            variant: "default",
            className: "bg-blue-500 text-white border-blue-600"
          });
          
          // Mesmo com erro, definimos os dados básicos
          // CRITICAL: Incluir verified: true para usuários autenticados com erro de Firestore
          const errorUserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            verified: true // Assumir verificado se já está autenticado
          };
          setCurrentUser(errorUserData);
          console.log("🔐 USUÁRIO LOGADO - MODO OFFLINE (ERRO FIRESTORE):", errorUserData);
        }
      } else {
        console.log("Clearing user data on logout");
        setCurrentUser(null);
        setFirestoreUser(null);
      }
      
      // Finalização do processo
      clearTimeout(timeoutId);
      setUserLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [toast]);

  // Função de login com email e senha
  const login = async (email: string, password: string) => {
    try {
      await loginWithEmail(email, password);
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Falha ao fazer login. Tente novamente.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
      }
      
      toast({
        title: "Erro de login",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função de registro de novo usuário
  const register = async (email: string, password: string, displayName: string, cellphone: string = "", crm: string = "", termsAccepted: boolean = false) => {
    try {
      await registerWithEmail(email, password, displayName, cellphone, crm, termsAccepted);
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada com sucesso.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Falha ao criar conta. Tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este email já está em uso.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.message === 'CRM_ALREADY_EXISTS') {
        throw error;
      }
      
      toast({
        title: "Erro no registro",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função de login com Google
  const googleLogin = async () => {
    try {
      await loginWithGoogle();
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo!",
      });
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Erro ao fazer login com Google",
        description: "Não foi possível fazer login com Google. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await logoutUser();
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Não foi possível sair. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Função para recarregar dados do usuário
  const refreshUserData = async () => {
    if (!auth.currentUser) return;

    try {
      const userProfile = await getUserProfile(auth.currentUser.uid);
      
      if (userProfile) {
        setFirestoreUser(userProfile);
        
        // Atualizar dados combinados
        setCurrentUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: userProfile.name || auth.currentUser.displayName,
          name: userProfile.name,
          cellphone: userProfile.cellphone,
          crm: userProfile.crm || "",
          firestoreId: userProfile.id,
          photoURL: userProfile.photoURL || auth.currentUser.photoURL,
          isAdmin: userProfile.isAdmin || false,
          verified: userProfile.verified || false
        });
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Objecto de contexto exportado
  const value = {
    currentUser,
    firestoreUser,
    userLoading,
    login,
    register,
    loginWithGoogle: googleLogin,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};