import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const VerifyEmailPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { refreshUserData } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = urlParams.get('hash');

      if (!hash) {
        setVerificationStatus('error');
        setMessage('Link de verificação inválido.');
        return;
      }

      try {
        console.log('🔍 Hash recebido:', hash);
        
        // Decodificar hash - agora contém apenas o userId
        const userId = atob(hash);
        console.log('🔍 UserId decodificado:', userId);
        
        if (!userId || userId.length === 0) {
          console.error('❌ UserId inválido após decodificação');
          setVerificationStatus('error');
          setMessage('Link de verificação malformado.');
          return;
        }
        
        // Verificar se o usuário existe
        console.log('🔍 Buscando usuário no Firestore com ID:', userId);
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.error('❌ Usuário não encontrado no Firestore:', userId);
          setVerificationStatus('error');
          setMessage('Usuário não encontrado.');
          return;
        }
        
        console.log('✅ Usuário encontrado:', userDoc.data());

        // Atualizar usuário como verificado
        await updateDoc(userRef, {
          verified: true,
          verifiedAt: new Date().toISOString()
        });

        console.log('✅ Usuário verificado com sucesso, atualizando contexto...');
        
        // Atualizar dados do usuário no contexto para refletir a verificação
        await refreshUserData();

        setVerificationStatus('success');
        setMessage('Email verificado com sucesso! Redirecionando para o dashboard...');
        
        // Redirecionar para dashboard após 2 segundos
        setTimeout(() => {
          setLocation('/chat');
        }, 2000);

      } catch (error) {
        console.error('Erro ao verificar email:', error);
        setVerificationStatus('error');
        setMessage('Erro interno. Tente novamente mais tarde.');
      }
    };

    verifyEmail();
  }, [setLocation, refreshUserData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center">
            {verificationStatus === 'loading' && (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}
            {verificationStatus === 'success' && (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
            {verificationStatus === 'error' && (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {verificationStatus === 'loading' && 'Verificando Email...'}
            {verificationStatus === 'success' && 'Email Verificado!'}
            {verificationStatus === 'error' && 'Erro na Verificação'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-600">{message}</p>
          
          {verificationStatus === 'success' && (
            <p className="text-sm text-gray-500">
              Redirecionando para o dashboard...
            </p>
          )}
          
          {verificationStatus === 'error' && (
            <Button 
              onClick={() => setLocation('/auth')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Ir para Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;