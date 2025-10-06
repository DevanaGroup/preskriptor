import { motion } from 'framer-motion';
import { Check, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import SidebarLayout from '@/components/SidebarLayout';
import { useState } from 'react';

const PlanosPage = () => {
  const { currentUser, refreshUserData } = useAuth();
  const { getSubscriptionPlan } = useSubscriptionAccess();
  const { toast } = useToast();
  const currentPlan = getSubscriptionPlan();
  const [isYearly, setIsYearly] = useState(false);

  // Função para criar uma sessão de checkout no Stripe
  const createCheckoutSession = async (productId: string, priceId: string) => {
    try {
      // URL de sucesso e cancelamento com produto específico
      const successUrl = `${window.location.origin}/dashboard/success/${productId}`;
      const cancelUrl = `${window.location.origin}/dashboard/planos`;

      // Criar sessão de checkout
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', {
        priceId,
        successUrl,
        cancelUrl,
        email: currentUser?.email || '',
        userId: currentUser?.uid || ''
      });

      const { url } = await response.json();

      // Redirecionar para o Stripe Checkout
      if (url) {
        window.location.href = url;
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível iniciar o checkout. Tente novamente.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleSubscribe = async (productId: string, priceId: string) => {
    try {
      await createCheckoutSession(productId, priceId);
    } catch (error) {
      console.error('Erro ao iniciar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Função de teste para simular atualização de assinatura
  const testSubscriptionUpdate = async () => {
    try {
      if (!currentUser?.uid) {
        toast({
          title: 'Erro',
          description: 'Usuário não encontrado',
          variant: 'destructive'
        });
        return;
      }

      const response = await apiRequest('POST', '/api/test-subscription-update', {
        userId: currentUser.uid
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Teste Concluído',
          description: 'Assinatura atualizada para PRO. Atualizando dados...',
        });
        
        // Atualizar dados do usuário imediatamente
        await refreshUserData();
        
        toast({
          title: 'Sucesso!',
          description: 'Você agora tem acesso aos módulos PRO com 100 créditos!',
        });
      } else {
        throw new Error(result.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: 'Erro no Teste',
        description: 'Não foi possível testar a atualização de assinatura.',
        variant: 'destructive'
      });
    }
  };

  // Função para simular webhook do Stripe
  const testStripeWebhook = async () => {
    try {
      if (!currentUser?.uid) {
        toast({
          title: 'Erro',
          description: 'Usuário não encontrado',
          variant: 'destructive'
        });
        return;
      }

      // Simular dados de checkout completo do Stripe
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_simulation',
            customer: 'cus_test_customer',
            subscription: 'sub_test_subscription',
            metadata: {
              userId: currentUser.uid
            }
          }
        }
      };

      const response = await apiRequest('POST', '/api/stripe/webhook', webhookPayload);

      toast({
        title: 'Webhook Simulado',
        description: 'Webhook do Stripe processado. Atualizando dados...',
      });
      
      // Atualizar dados do usuário
      setTimeout(async () => {
        await refreshUserData();
        toast({
          title: 'Dados Atualizados',
          description: 'Verificação concluída!',
        });
      }, 1000);

    } catch (error) {
      console.error('Erro no teste de webhook:', error);
      toast({
        title: 'Erro no Webhook',
        description: 'Não foi possível simular o webhook do Stripe.',
        variant: 'destructive'
      });
    }
  };

  const plans = [
    {
      id: 'pro',
      name: 'PRO',
      monthlyPrice: 'R$ 49,90',
      yearlyPrice: 'R$ 47,50',
      yearlyTotal: 'R$ 570,00',
      description: 'Ideal para profissionais em crescimento',
      productId: 'prod_SkcZNTUuWC1lsa',
      monthlyPriceId: 'price_1Rp7JzRvPDGCZGnjYfwxrJf9',
      yearlyPriceId: 'price_1Rp7K3RvPDGCZGnjYAJIEhHZ',
      credits: '100 créditos/mês',
      tier: 'PRO',
      discount: '5%',
      freeModules: [
        'Indicação de Medicação Anti-Obesidade (MAO)',
        'Avaliação de indicação de Cirurgia Bariátrica',
        'Conversor de cliques Ozempic ↔ Wegovy',
        'Módulo de Conversão de Bioimpedância para texto (InBody)'
      ],
      proModules: [
        'Prescrição de Medicamentos Anti-Obesidade (MAO)',
        'Interpretação de Exames Laboratoriais',
        'Prescrição de Fitoterápicos na Obesidade',
        'Reposição Hormonal Masculina',
        'Reposição de Vitaminas e Minerais'
      ],
      features: [
        'Atualizações contínuas incluídas'
      ],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 'R$ 115,81',
      yearlyPrice: 'R$ 110,00',
      yearlyTotal: 'R$ 1.320,00',
      description: 'Solução completa com suporte exclusivo',
      productId: 'prod_SkcZoJTwLxm7Rr',
      monthlyPriceId: 'price_1Rp7K5RvPDGCZGnjssxF5JFk', // Mensal
      yearlyPriceId: 'price_1Rp7K7RvPDGCZGnjuDfQHMa6', // Anual
      credits: '200 créditos/mês',
      tier: 'Premium',
      discount: '5%',
      freeModules: [
        'Indicação de Medicação Anti-Obesidade (MAO)',
        'Avaliação de indicação de Cirurgia Bariátrica',
        'Conversor de cliques Ozempic ↔ Wegovy',
        'Módulo de Conversão de Bioimpedância para texto (InBody)'
      ],
      proModules: [
        'Prescrição de Medicamentos Anti-Obesidade (MAO)',
        'Interpretação de Exames Laboratoriais',
        'Prescrição de Fitoterápicos na Obesidade',
        'Reposição Hormonal Masculina',
        'Reposição de Vitaminas e Minerais'
      ],
      premiumModules: [
        'Prontuário Blindado (transcreva e organize suas consultas)',
        'Reposição Hormonal Feminina'
      ],
      features: [
        'Todos do Plano Pro mais:',
        'Canal de suporte exclusivo via WhatsApp'
      ],
      popular: false
    }
  ];

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Upgrade Seu Plano
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Desbloqueie todo o potencial da plataforma com acesso aos módulos PRO
              e créditos suficientes para sua prática médica.
            </p>
            
            {/* Toggle Mensal/Anual */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-lg font-medium ${!isYearly ? 'text-blue-600' : 'text-gray-500'}`}>
                Mensal
              </span>
              <div className="relative">
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <span className={`text-lg font-medium ${isYearly ? 'text-green-600' : 'text-gray-500'}`}>
                Anual
              </span>

            </div>
            
            {/* Badge de desconto centralizado */}
            {isYearly && (
              <div className="flex justify-center mt-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-md opacity-60 animate-ping"></div>
                  <Badge className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white font-black px-6 py-3 text-lg shadow-2xl border-2 border-yellow-300 transform animate-bounce">
                    🔥 ECONOMIZE 5%! 🔥
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Plano Atual */}
            <div className="mt-6">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Plano Atual: {currentPlan === 'freemium' ? 'Freemium' : currentPlan.toUpperCase()}
              </Badge>
            </div>
          </motion.div>

          {/* Cards dos Planos */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full ${
                  plan.popular 
                    ? 'ring-2 ring-blue-500 shadow-xl' 
                    : 'shadow-lg hover:shadow-xl'
                } transition-all duration-300`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      {plan.tier === 'PRO' ? (
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Crown className="w-8 h-8 text-white" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <Zap className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </CardTitle>
                    
                    <div className="flex items-baseline justify-center mt-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-lg text-gray-500 ml-1">
                        /mês
                      </span>
                    </div>
                    
                    {isYearly && (
                      <div className="text-center mt-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm text-gray-500 line-through">
                            R$ {(parseFloat(plan.monthlyPrice.replace('R$ ', '').replace(',', '.')) * 12).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {plan.yearlyTotal}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">cobrados anualmente</span>
                        <div className="mt-2">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold px-4 py-2 shadow-lg border-2 border-white transform hover:scale-105 transition-transform">
                            💰 ECONOMIZE {plan.discount}!
                          </Badge>
                        </div>
                      </div>
                    )}
                    

                    
                    <p className="text-gray-600 mt-2">
                      {plan.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Créditos */}
                    <div className="mb-6">
                      <div className="flex items-center mb-2">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">{plan.credits}</span>
                      </div>
                    </div>

                    {/* Módulos Gratuitos */}
                    {plan.freeModules && plan.freeModules.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium">Todos os módulos Freemium:</span>
                            <ul className="mt-2 space-y-1">
                              {plan.freeModules.map((module, idx) => (
                                <li key={idx} className="text-xs text-gray-600">• {module}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Módulos PRO */}
                    {plan.proModules && plan.proModules.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium">Módulos PRO exclusivos:</span>
                            <ul className="mt-2 space-y-1">
                              {plan.proModules.map((module, idx) => (
                                <li key={idx} className="text-xs text-gray-600">• {module}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Features adicionais */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="mb-6">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start mb-2">
                            <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button
                      onClick={() => handleSubscribe(plan.productId, isYearly ? plan.yearlyPriceId : plan.monthlyPriceId)}
                      disabled={currentPlan !== 'freemium'}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                          : 'bg-gray-800 hover:bg-gray-900'
                      } text-white py-3 text-lg font-semibold`}
                    >
                      {currentPlan === 'freemium' ? 'Assinar Agora' : 'Plano Atual'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>


        </div>
      </div>
    </SidebarLayout>
  );
};

export default PlanosPage;