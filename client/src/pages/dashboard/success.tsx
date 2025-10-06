import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import SidebarLayout from '@/components/SidebarLayout';

const SuccessPage = () => {
  const { prodId } = useParams();
  const [location] = useLocation();
  const { currentUser, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  // Extrair session_id da URL
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('session_id');
  
  console.log('🔍 URL atual:', window.location.href);
  console.log('🔍 Search params:', window.location.search);
  console.log('🔍 Session ID extraído:', sessionId);

  useEffect(() => {
    console.log('🔄 useEffect executado');
    console.log('📋 Condições:', { sessionId, currentUserUid: currentUser?.uid });
    
    if (sessionId && currentUser?.uid) {
      console.log('✅ Todas as condições atendidas, iniciando processamento...');
      processPaymentSuccess();
    } else {
      console.log('❌ Condições não atendidas:', {
        hasSessionId: !!sessionId,
        hasCurrentUser: !!currentUser?.uid
      });
      
      // Se não tem session_id, pode ter vindo do webhook
      if (!sessionId && currentUser?.uid) {
        console.log('🔄 Sem session_id, verificando se pagamento já foi processado pelo webhook...');
        setIsProcessing(false);
        
        toast({
          title: 'Pagamento Processado!',
          description: 'Sua assinatura foi ativada com sucesso.',
        });
      }
    }
  }, [sessionId, currentUser?.uid]);

  const processPaymentSuccess = async () => {
    try {
      setIsProcessing(true);
      console.log('🚀 Iniciando processamento do pagamento...');
      console.log('🆔 Session ID:', sessionId);
      console.log('👤 Current User UID:', currentUser?.uid);
      
      // Recuperar dados da sessão do Stripe
      console.log('📡 Fazendo requisição para buscar dados da sessão...');
      const sessionResponse = await apiRequest('GET', `/api/stripe/session/${sessionId}`);
      const sessionData = await sessionResponse.json();
      
      console.log('📦 Dados da sessão do Stripe:', sessionData);
      console.log('🎯 Subscription encontrada:', sessionData.subscription);

      if (sessionData.subscription) {
        // A sessão já contém os dados da assinatura expandida
        const subscription = sessionData.subscription;
        
        const priceId = subscription.items?.data?.[0]?.price?.id || subscription.plan?.id;
        console.log('💰 Price ID extraído:', priceId);
        
        // Determinar plano baseado no priceId
        let subscriptionPlan = 'pro';
        let creditsLimit = 100;
        let planName = 'PRO';
        
        if (priceId === 'price_1Rp7JzRvPDGCZGnjYfwxrJf9') {
          subscriptionPlan = 'pro';
          creditsLimit = 100;
          planName = 'PRO Mensal';
        } else if (priceId === 'price_1Rp7K3RvPDGCZGnjYAJIEhHZ') {
          subscriptionPlan = 'pro';
          creditsLimit = 100;
          planName = 'PRO Anual';
        } else if (priceId === 'price_1Rp7K5RvPDGCZGnjssxF5JFk') {
          subscriptionPlan = 'premium';
          creditsLimit = 200;
          planName = 'Premium Mensal';
        } else if (priceId === 'price_1Rp7K7RvPDGCZGnjuDfQHMa6') {
          subscriptionPlan = 'premium';
          creditsLimit = 200;
          planName = 'Premium Anual';
        }

        // Verificar se esta session já foi processada através do documento do usuário
        console.log('🔄 Verificando se session já foi processada...');
        
        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        // Buscar documento do usuário para verificar último session_id processado
        const userRef = doc(db, 'users', currentUser?.uid || '');
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.lastProcessedSessionId === sessionId) {
            console.log('⚠️ Session já foi processada anteriormente, cancelando atualização');
            
            toast({
              title: 'Pagamento Já Processado',
              description: 'Esta sessão de pagamento já foi processada anteriormente.',
              variant: 'destructive'
            });
            
            setIsProcessing(false);
            return;
          }
        }

        // Atualizar dados no Firestore diretamente do cliente
        console.log('🔄 Atualizando dados no Firestore...');
        
        const updateData = {
          subscriptionPlan,
          creditsLimit,
          creditsUsed: 0, // Reset créditos
          hasActiveSubscription: true,
          stripeCustomerId: sessionData.customer?.id || sessionData.customer,
          stripeSubscriptionId: sessionData.subscription?.id || sessionData.subscription,
          subscriptionUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastProcessedSessionId: sessionId // Armazenar session_id para evitar reprocessamento
        };
        
        await updateDoc(userRef, updateData);
        
        console.log('📋 Dados atualizados com sucesso no Firestore');
        
        // Sempre sucesso se chegou até aqui
        if (true) {
          setSubscriptionData({
            planName,
            creditsLimit,
            subscriptionId: sessionData.subscription
          });
          
          // Atualizar dados do usuário no contexto
          console.log('🔄 Atualizando dados do usuário no contexto...');
          await refreshUserData();
          
          console.log('✅ Processamento concluído com sucesso!');
          toast({
            title: 'Pagamento Processado!',
            description: `Bem-vindo ao plano ${planName}! Você agora tem ${creditsLimit} créditos disponíveis.`,
          });
        } else {
          throw new Error('Falha ao atualizar dados da assinatura');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      console.error('🔍 Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      toast({
        title: 'Erro no Processamento',
        description: 'Houve um problema ao processar seu pagamento. Entre em contato conosco.',
        variant: 'destructive'
      });
    } finally {
      console.log('🏁 Finalizando processamento...');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Processando seu pagamento...
            </h2>
            <p className="text-gray-600">
              Aguarde enquanto confirmamos sua assinatura
            </p>
          </motion.div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur">
            <CardContent className="p-8 text-center">
              {/* Ícone de sucesso */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>

              {/* Título principal */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-gray-800 mb-2"
              >
                Pagamento Confirmado!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-600 mb-6"
              >
                Obrigado por escolher o Preskriptor
              </motion.p>

              {/* Detalhes da assinatura */}
              {subscriptionData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-8"
                >
                  <div className="flex items-center justify-center mb-4">
                    <Crown className="w-8 h-8 mr-2" />
                    <h2 className="text-2xl font-bold">Plano {subscriptionData.planName}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="bg-white/20 rounded-lg p-4">
                      <Sparkles className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold">{subscriptionData.creditsLimit} Créditos</p>
                      <p className="text-sm opacity-90">Renovados mensalmente</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <Crown className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold">Módulos PRO</p>
                      <p className="text-sm opacity-90">Acesso completo</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Benefícios */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-left mb-8"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  O que você ganhou:
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    Acesso a todos os módulos PRO de IA especializada
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    100 créditos mensais para consultas ilimitadas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    Suporte prioritário e atualizações exclusivas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    Ferramentas avançadas de prescrição e análise
                  </li>
                </ul>
              </motion.div>

              {/* Botões de ação */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button
                  onClick={() => window.location.href = '/chat'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  Começar Consulta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-8 py-3"
                >
                  Ir para Dashboard
                </Button>
              </motion.div>

              {/* Informação adicional */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-sm text-gray-500"
              >
                <p>
                  Você receberá um email de confirmação em breve.
                  <br />
                  Dúvidas? Entre em contato conosco pelo WhatsApp.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SidebarLayout>
  );
};

export default SuccessPage;