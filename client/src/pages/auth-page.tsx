import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const AuthPage: React.FC = () => {
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Auth context and navigation
  const { login, currentUser, userLoading } = useAuth();
  const [_, setLocation] = useLocation();

  // Function to handle checkout after login
  const { toast } = useToast();
  
  const handleCheckoutAfterLogin = async () => {
    if (!currentUser) return false;
    
    try {
      // Check if there's a selected plan in localStorage
      const selectedPlanData = localStorage.getItem('selectedPlan');
      if (selectedPlanData) {
        const { productId, priceId } = JSON.parse(selectedPlanData);
        
        // Clear the localStorage item to prevent repeated checkouts
        localStorage.removeItem('selectedPlan');
        
        if (productId && priceId) {
          // Create checkout session with Stripe
          const successUrl = `${window.location.origin}/dashboard`;
          const cancelUrl = `${window.location.origin}`;
          
          const response = await apiRequest('POST', '/api/stripe/create-checkout-session', {
            priceId,
            successUrl,
            cancelUrl,
            email: currentUser.email || '',
            userId: currentUser.uid || ''
          });
          
          const data = await response.json();
          
          // Redirect to Stripe Checkout
          if (data.url) {
            window.location.href = data.url;
            return true; // Indicate that we're redirecting to checkout
          }
        }
      }
      return false; // No checkout needed
    } catch (error) {
      console.error('Error handling checkout after login:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar seu pedido. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && !userLoading) {
      // Check if we need to redirect to checkout
      handleCheckoutAfterLogin().then(redirectingToCheckout => {
        // Verificar se o usuário tem email verificado
        if (!redirectingToCheckout) {
          if (currentUser?.verified) {
            setLocation('/dashboard/consulta'); // Redireciona direto para consulta
          } else {
            setLocation('/dashboard/verificacao');
          }
        }
      });
    } else if (!currentUser && !userLoading) {
      // Se não há usuário logado, limpar localStorage para evitar redirects indevidos
      localStorage.removeItem('selectedPlan');
    }
  }, [currentUser, userLoading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    
    try {
      setIsLoggingIn(true);
      console.log("Attempting login with:", loginEmail);
      await login(loginEmail, loginPassword);
      console.log("Login successful");
      // No need to redirect here, the useEffect will handle it
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };





  // Show loading state while checking authentication - com timeout para evitar carregamento infinito
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);
  
  useEffect(() => {
    // Se loading estiver ativo por mais de 3 segundos, mostrar mensagem mais informativa
    let timeoutId: NodeJS.Timeout;
    if (userLoading) {
      timeoutId = setTimeout(() => {
        setShowLoadingTimeout(true);
      }, 3000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userLoading]);
  
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        {showLoadingTimeout && (
          <div className="text-center max-w-md">
            <p className="text-gray-600 mb-2">Estamos com dificuldades para se conectar ao servidor.</p>
            <p className="text-gray-500 text-sm">
              Você pode tentar{" "}
              <button 
                className="text-primary underline font-medium"
                onClick={() => window.location.reload()}
              >
                recarregar a página
              </button>
              {" "}ou continuar aguardando.
            </p>
          </div>
        )}
      </div>
    );
  }

  // If already logged in, the useEffect will handle redirect
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#EEF6FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input 
                  id="login-email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input 
                  id="login-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primaryDark"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
            


            <div className="text-center mt-6 space-y-2">
              <p className="text-sm text-gray-600">
                Ainda não tem uma conta?{' '}
                <Link href="/cadastro" className="text-primary hover:underline font-medium">
                  Criar conta grátis
                </Link>
              </p>
              <Button 
                variant="link" 
                className="text-sm text-gray-500"
                onClick={() => setLocation('/')}
              >
                Voltar para a página inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;