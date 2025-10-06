import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SidebarLayout from '@/components/SidebarLayout';

const EmailVerificationPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const generateVerificationHash = (userId: string, email: string): string => {
    // Usar o mesmo formato simples do firebase.ts: apenas userId em base64
    return btoa(userId);
  };

  const handleResendVerification = async () => {
    if (!currentUser?.uid || !currentUser?.email) {
      toast({
        title: "Erro",
        description: "Dados do usuário não encontrados.",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }

    setIsResending(true);
    
    try {
      const verificationHash = generateVerificationHash(currentUser.uid, currentUser.email);
      const name = currentUser.displayName || currentUser.name || 'Doutor(a)';
      const verificationLink = `${window.location.origin}/verify-email?hash=${verificationHash}`;
      
      console.log('📧 Dados do reenvio:');
      console.log('- UID:', currentUser.uid);
      console.log('- Hash gerado:', verificationHash);
      console.log('- Link:', verificationLink);
      
      // Template HTML atualizado - mesmo usado no primeiro envio
      const templateHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação de Email - Preskriptor</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .header {
            background-color: #2563eb;
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: white;
        }
        .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
            color: white;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .cta-container {
            text-align: center;
            margin: 30px 0;
        }
        .cta-button {
            background-color: #2563eb;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            display: inline-block;
            transition: background-color 0.3s ease;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .security-notice {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }
        .security-notice p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .cta-button {
                display: block;
                margin: 16px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="background-color: #2563eb; color: white;">
            <h1 style="color: white; margin: 0;">Preskriptor</h1>
            <p style="color: white; margin: 8px 0 0 0;">Prescrição Médica Segura e Inteligente com IA</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Olá, ${name}!
            </div>
            
            <div class="message">
                Bem-vindo(a) ao <strong>Preskriptor</strong>! Para garantir a segurança da sua conta e começar a usar nossa plataforma de prescrição médica inteligente, precisamos verificar seu endereço de email.
            </div>
            
            <div class="cta-container">
                <a href="${verificationLink}" class="cta-button" style="background-color: #2563eb !important; color: white !important; text-decoration: none !important;">
                    Verificar Meu Email
                </a>
            </div>
            
            <div class="security-notice">
                <p><strong>Importante:</strong> Este link de verificação é válido por 24 horas por motivos de segurança. Se precisar de um novo link, acesse sua conta e solicite o reenvio.</p>
            </div>
            
            <div class="message">
                Após a verificação, você terá acesso completo a todos os recursos da plataforma, incluindo nossos módulos de IA especializados em medicina e nutrição.
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Preskriptor</strong> - Transformando a prática médica com inteligência artificial</p>
            <p style="margin-top: 8px;">Esta é uma mensagem automática, não responda este email.</p>
        </div>
    </div>
</body>
</html>`;
      
      // Criar documento na coleção mail para trigger do Firebase - formato correto
      await addDoc(collection(db, 'mail'), {
        to: currentUser.email,
        message: {
          subject: 'Verificação de Email - Preskriptor',
          html: templateHtml
        }
      });

      toast({
        title: "Email reenviado",
        description: "Verifique sua caixa de entrada e spam.",
        variant: "default",
        className: "bg-green-500 text-white border-green-600"
      });
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o email. Tente novamente.",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verificação de Email
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                Enviamos um email de verificação para:
              </p>
              <p className="font-medium text-gray-900">
                {currentUser?.email}
              </p>
              <p className="text-sm text-gray-500">
                Clique no link do email para ativar sua conta e acessar o sistema.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reenviar Email
                  </>
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default EmailVerificationPage;