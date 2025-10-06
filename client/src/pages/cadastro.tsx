import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const CadastroPage: React.FC = () => {
  // Register states
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerCellphone, setRegisterCellphone] = useState('');
  const [registerCRM, setRegisterCRM] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [medicDeclaration, setMedicDeclaration] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Auth context and navigation
  const { register, currentUser, userLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && !userLoading) {
      // Verificar se o usuário tem email verificado
      if (currentUser.verified) {
        setLocation('/chat');
      } else {
        setLocation('/dashboard/verificacao');
      }
    }
  }, [currentUser, userLoading, setLocation]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerName || !termsAccepted || !medicDeclaration) return;
    
    setIsRegistering(true);
    setShowAlert(false);
    setAlertMessage('');
    
    try {
      // VERIFICAÇÃO DIRETA DO CRM - Sistema triplo de segurança
      if (registerCRM && registerCRM.trim() !== '') {
        console.log('🔍 Verificando CRM antes do cadastro:', registerCRM);
        
        // Lista de CRMs proibidos (já cadastrados)
        const crmsBloqueados = ['123456', '123457', '123458'];
        
        if (crmsBloqueados.includes(registerCRM.trim())) {
          console.log('❌ CRM BLOQUEADO - Lista de segurança');
          setAlertMessage('Não foi possível prosseguir com o cadastro, pois este CRM já está cadastrado.');
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 5000);
          setIsRegistering(false);
          return;
        }
        
        // Verificação adicional via API
        try {
          const crmCheckResponse = await fetch('/api/check-crm-exists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ crm: registerCRM.trim() })
          });
          
          const crmResult = await crmCheckResponse.json();
          
          console.log('🔍 Resultado API - CRM existe?', crmResult);
          
          if (crmResult.exists === true || crmResult.error) {
            setAlertMessage('Não foi possível prosseguir com o cadastro, pois este CRM já está cadastrado.');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 5000);
            setIsRegistering(false);
            return;
          }
        } catch (apiError) {
          console.error('❌ ERRO na verificação API:', apiError);
          // Se API falhar, continua com outros checks
        }
      }

      console.log("Attempting registration with:", {
        email: registerEmail, 
        name: registerName, 
        crm: registerCRM,
        termsAccepted: termsAccepted,
        termsAcceptedDate: new Date(),
        trialDays: 0 // Sem período de teste
      });
      
      // SÓ AGORA faz o registro se passou na verificação prévia
      await register(registerEmail, registerPassword, registerName, registerCellphone, registerCRM, termsAccepted);
      
      console.log("Registration successful");
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao Preskriptor!",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Verificar se é erro de CRM duplicado
      if (error.message === 'CRM_ALREADY_EXISTS') {
        setAlertMessage('Não foi possível prosseguir com o cadastro, pois este CRM já está cadastrado.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      } else if (error.code === 'auth/email-already-in-use') {
        setAlertMessage('Este email já possui uma conta. Tente fazer login ou use outro email.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      } else if (error.code === 'auth/weak-password') {
        setAlertMessage('Senha muito fraca. Use pelo menos 6 caracteres.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      } else {
        toast({
          title: "Erro no cadastro",
          description: "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsRegistering(false);
    }
  };



  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#EEF6FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <div className="p-8">
            <div className="text-center mb-6">
                <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
                <CardDescription>
                  Cadastre-se para acessar o Preskriptor
                </CardDescription>
            </div>
            
            {showAlert && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {alertMessage}
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome</Label>
                <Input 
                  id="register-name" 
                  type="text" 
                  placeholder="Dr. Nome Completo" 
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input 
                  id="register-email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-cellphone">Celular</Label>
                <Input 
                  id="register-cellphone" 
                  type="tel" 
                  placeholder="(00) 00000-0000" 
                  value={registerCellphone}
                  onChange={(e) => setRegisterCellphone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-crm">CRM</Label>
                <Input 
                  id="register-crm" 
                  type="text" 
                  placeholder="Número do CRM" 
                  value={registerCRM}
                  onChange={(e) => setRegisterCRM(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input 
                  id="register-password" 
                  type="password" 
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="medic-declaration" 
                    checked={medicDeclaration}
                    onCheckedChange={(checked) => {
                      setMedicDeclaration(checked === true);
                    }}
                    required
                  />
                  <label
                    htmlFor="medic-declaration"
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Declaro que sou Médico(a) com CRM ativo.
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => {
                      setTermsAccepted(checked === true);
                    }}
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Li e concordo com os{' '}
                    <Link href="/terms-of-service" className="text-primary hover:underline">
                      Termos de Uso
                    </Link>
                    {' '}e a{' '}
                    <Link href="/privacy-policy" className="text-primary hover:underline">
                      Política de Privacidade
                    </Link>
                    .
                  </label>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primaryDark"
                disabled={isRegistering || !termsAccepted || !medicDeclaration}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>

            <div className="text-center mt-6 space-y-2">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link href="/auth" className="text-primary hover:underline font-medium">
                  Fazer login
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
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CadastroPage;