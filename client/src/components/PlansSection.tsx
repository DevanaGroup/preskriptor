import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useModuleConfig, modulesList } from '@/hooks/useModuleConfig';
import { HelpCircle, Check, MessageCircle, Users } from 'lucide-react';

interface PricingPlanProps {
  title: string;
  description: string;
  price: string;
  yearlyPrice: string;
  features: string[];
  isPopular?: boolean;
  isFree?: boolean;
  isComingSoon?: boolean;
  consultations: string;
  freeModules: string[];
  proModules?: string[];
  productId?: string;
  priceId?: string;
  onSubscribe: (productId: string, priceId: string) => void;
  navigate: (path: string) => void;
}

const PricingPlan: React.FC<PricingPlanProps> = ({ 
  title, 
  description, 
  price, 
  yearlyPrice, 
  features, 
  isPopular = false,
  isFree = false,
  isComingSoon = false,
  consultations,
  freeModules,
  proModules,
  productId = '',
  priceId = '',
  onSubscribe,
  navigate
}) => {
  return (
    <Card className={`rounded-xl transition-shadow relative h-full flex flex-col border border-gray-200 ${
      isPopular 
        ? 'shadow-md hover:shadow-lg border-2 border-primary' 
        : 'shadow-sm hover:shadow-md'
    } ${isComingSoon ? 'opacity-75' : ''}`}>
      {isPopular && !isComingSoon && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-semibold py-1 px-4 rounded-full">
          Recomendado
        </div>
      )}
      {isComingSoon && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-semibold py-1 px-4 rounded-full">
          EM BREVE
        </div>
      )}
      <CardContent className="p-8 flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="mb-6">
          <span className="text-3xl font-bold">{price}</span>
          {!isFree && <span className="text-gray-500">/mês</span>}
        </div>
        <p className="text-gray-500 text-sm mb-1">{yearlyPrice}</p>
        <hr className="my-6" />
        
        {/* Consultas */}
        <div className="mb-4">
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-sm font-medium">{consultations}</span>
            {consultations.includes("100 créditos/mês") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="text-sm">
                      <p>Cada interação consome 1 crédito</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        
        {/* Módulos disponíveis */}
        {freeModules && freeModules.length > 0 && (
          <div className="mb-4">
            <div className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
              <div>
                <span className="text-sm font-medium">
                  {title === "Freemium" ? "Acesso total aos módulos:" : "Todos os do Freemium e mais:"}
                </span>
                <ul className="mt-1 space-y-1">
                  {freeModules.map((module, index) => (
                    <li key={index} className="text-xs text-gray-600">• {module}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Módulos PRO/Premium */}
        {proModules && proModules.length > 0 && (
          <div className="mb-4">
            <div className="flex items-start">
              <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
              <div>
                <ul className="space-y-1">
                  {proModules.map((module, index) => (
                    <li key={index} className="text-xs text-gray-600">• {module}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Outras funcionalidades */}
        <div className="flex-1">
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                <span className="text-sm">{feature}</span>
                {feature === "100 créditos/mês" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="text-sm">
                          <p>Cada interação consome 1 crédito</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto">
          <Button 
            variant={isPopular ? "default" : (isFree ? "default" : "outline")} 
            className={`w-full ${
              isPopular 
                ? 'bg-primary text-white hover:bg-primaryDark' 
                : isFree 
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'border-primary text-primary hover:bg-primaryLight'
            }`}
            onClick={() => isFree ? navigate('/cadastro') : onSubscribe(productId, priceId)}
            disabled={isComingSoon}
          >
            {isComingSoon ? "Em Breve" : isFree ? "Começar Grátis" : "Assinar plano"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const PlansSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { moduleConfigs } = useModuleConfig();
  const [isYearly, setIsYearly] = useState(false);

  // Função para iniciar o processo de assinatura
  const handleSubscribe = async (productId: string, priceId: string) => {
    try {
      // Para plano freemium, ir direto para cadastro
      if (productId === 'freemium') {
        navigate('/cadastro');
        return;
      }

      // Para planos pagos, salvar dados e ir para cadastro
      // Salvar os dados do plano no localStorage para recuperar após o login
      localStorage.setItem('selectedPlan', JSON.stringify({ productId, priceId }));
      
      // Se o usuário não estiver logado, redireciona para cadastro
      if (!currentUser) {
        navigate('/cadastro');
        return;
      }

      // Se o usuário já estiver logado, criar sessão de checkout
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

  // Função para criar uma sessão de checkout no Stripe
  const createCheckoutSession = async (productId: string, priceId: string) => {
    try {
      // URL de sucesso e cancelamento
      const successUrl = `${window.location.origin}/dashboard`;
      const cancelUrl = `${window.location.origin}`;

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

  // Obter módulos por tier
  const getFreeModules = () => {
    if (!moduleConfigs || moduleConfigs.length === 0) {
      return modulesList.slice(0, 3).map(module => module.title); // Primeiros 3 como fallback
    }
    return modulesList
      .filter(module => {
        const config = moduleConfigs.find(c => c.id === module.id);
        return !config?.tier || config.tier === 'Free';
      })
      .map(module => module.title);
  };

  const getProModules = () => {
    if (!moduleConfigs || moduleConfigs.length === 0) {
      return modulesList.slice(3, 6).map(module => module.title); // Módulos 4-6 como fallback
    }
    return modulesList
      .filter(module => {
        const config = moduleConfigs.find(c => c.id === module.id);
        return config?.tier === 'PRO';
      })
      .map(module => module.title);
  };

  interface Plan {
    title: string;
    description: string;
    price: string;
    yearlyPrice: string;
    features: string[];
    isPopular: boolean;
    isFree?: boolean;
    isComingSoon?: boolean;
    consultations: string;
    freeModules: string[];
    proModules?: string[];
    productId?: string;
    priceId?: string;
    yearlyProductId?: string;
    yearlyPriceId?: string;
  }

  const plans: Plan[] = [
    {
      title: "Grátis",
      description: "Ideal para conhecer a ferramenta",
      price: "R$ 0,00/mês",
      yearlyPrice: "Não requer cartão de crédito",
      consultations: "Até 5 créditos de uso (5 interações)",
      freeModules: [
        "Indicação de Medicação Anti-Obesidade (MAO)",
        "Avaliação de indicação de Cirurgia Bariátrica",
        "Conversor de cliques Ozempic ↔ Wegovy",
        "Módulo de Conversão de Bioimpedância para texto (InBody)"
      ],
      features: [
        "Sem suporte ou comunidade"
      ],
      isPopular: false,
      isFree: true
    },
    {
      title: "PRO",
      description: "Ideal para profissionais em crescimento",
      price: "R$ 47,41",
      yearlyPrice: "por mês",
      consultations: "100 créditos/mês",
      freeModules: [],
      proModules: [
        "Prescrição de Medicamentos Anti-Obesidade (MAO)",
        "Interpretação de Exames Laboratoriais",
        "Prescrição de Fitoterápicos na Obesidade",
        "Reposição Hormonal Masculina",
        "Reposição de Vitaminas e Minerais"
      ],
      features: [
        "Atualizações contínuas incluídas"
      ],
      isPopular: true,
      productId: "prod_SkcZuJhol5jCpa",
      priceId: "price_1Rp7K3RvPDGCZGnjYAJIEhHZ"
    },
    {
      title: "Premium",
      description: "Solução completa com suporte exclusivo",
      price: "R$ 115,81",
      yearlyPrice: "por mês",
      consultations: "200 créditos/mês",
      freeModules: [],
      proModules: [
        "Prontuário Blindado (transcreva e organize suas consultas)",
        "Reposição Hormonal Feminina"
      ],
      features: [
        "Todos do Plano Pro mais:",
        "Canal de suporte exclusivo via WhatsApp"
      ],
      isPopular: false,
      isComingSoon: false,
      productId: "prod_SkcZHENgejdXZI",
      priceId: "price_1Rp7K7RvPDGCZGnjuDfQHMa6", // Anual
      yearlyProductId: "prod_SkcZHENgejdXZI",
      yearlyPriceId: "price_1Rp7K7RvPDGCZGnjuDfQHMa6" // Anual
    }
  ];

  return (
    <section className="py-16 bg-primaryLight" id="plans">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Escolha o Plano que Melhor se Adapta à Sua Prática</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8">Comece agora mesmo a transformar o seu atendimento. Cancele quando quiser.</p>
        
        {/* Slider Mensal/Anual */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3 bg-white rounded-lg p-1 shadow-sm">
            <span className={`px-3 py-2 text-sm font-medium transition-colors ${!isYearly ? 'text-primary' : 'text-gray-600'}`}>
              Mensal
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`px-3 py-2 text-sm font-medium transition-colors ${isYearly ? 'text-primary' : 'text-gray-600'}`}>
              Anual
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2 text-xs">
                5% OFF
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingPlan
              key={index}
              title={plan.title}
              description={plan.description}
              price={plan.price}
              yearlyPrice={plan.yearlyPrice}
              consultations={plan.consultations}
              freeModules={plan.freeModules}
              proModules={plan.proModules}
              features={plan.features}
              isPopular={plan.isPopular}
              isFree={plan.isFree}
              isComingSoon={plan.isComingSoon}
              productId={isYearly ? plan.yearlyProductId : plan.productId}
              priceId={isYearly ? plan.yearlyPriceId : plan.priceId}
              onSubscribe={handleSubscribe}
              navigate={navigate}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
