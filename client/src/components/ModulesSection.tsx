import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Leaf, Syringe, Scale, Hospital, FileText, Weight, User, Users, Droplet, Activity, ClipboardList, Pill, Microscope } from 'lucide-react';
import { useModuleConfig, modulesList } from '@/hooks/useModuleConfig';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
  tier?: 'Free' | 'PRO' | 'Premium';
  enabled?: boolean;
  onAccess?: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  title, 
  description, 
  icon, 
  comingSoon = false,
  tier = 'Free',
  enabled = false,
  onAccess
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center h-full relative overflow-hidden">
      {/* Badge de tier no topo esquerdo */}
      <div className="absolute top-3 left-3">
        <Badge variant={
          tier === 'Free' ? 'secondary' : 
          tier === 'PRO' ? 'default' : 'destructive'
        } className="text-xs">
          {tier}
        </Badge>
      </div>

      {/* Badge de status no topo direito */}
      <div className="absolute top-3 right-3">
        {enabled ? (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Ativo
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
            Em breve
          </Badge>
        )}
      </div>
      
      <div className="text-4xl mb-4 mt-4">{icon}</div>
      
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4 flex-grow">{description}</p>
      
      {!enabled ? (
        <div className="w-full mt-2">
          <div className="text-gray-400 text-sm">Disponível em breve.</div>
          <div className="mt-2 inline-flex items-center justify-center">
            <Lock className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-gray-400 text-xs">Aguarde</span>
          </div>
        </div>
      ) : (
        <Button 
          variant="default" 
          className="mt-2"
          onClick={onAccess}
        >
          Acessar
        </Button>
      )}
    </div>
  );
};

// Função para mapear ícones dos módulos
const getModuleIcon = (iconKey: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    'leaf': <Leaf className="h-8 w-8 text-green-600" />,
    'syringe': <Syringe className="h-8 w-8 text-blue-600" />,
    'scale': <Scale className="h-8 w-8 text-purple-600" />,
    'hospital': <Hospital className="h-8 w-8 text-red-600" />,
    'notes': <FileText className="h-8 w-8 text-indigo-600" />,
    'weight-scale': <Weight className="h-8 w-8 text-orange-600" />,
    'venus': <User className="h-8 w-8 text-pink-600" />,
    'mars': <Users className="h-8 w-8 text-blue-700" />,
    'droplet': <Droplet className="h-8 w-8 text-cyan-600" />,
    'activity': <Activity className="h-8 w-8 text-red-500" />,
    'clipboard-list': <ClipboardList className="h-8 w-8 text-teal-600" />,
    'pill': <Pill className="h-8 w-8 text-green-500" />,
    'microscope': <Microscope className="h-8 w-8 text-purple-500" />
  };
  
  return iconMap[iconKey] || <FileText className="h-8 w-8 text-gray-600" />;
};

const ModulesSection: React.FC = () => {
  const { moduleConfigs, isLoading } = useModuleConfig();



  // Se não conseguimos carregar do banco por problemas de permissão,
  // usamos um fallback onde os primeiros 5 módulos estão habilitados
  const hasValidConfigs = moduleConfigs.length > 0;
  
  const displayModules = modulesList.map((moduleInfo, index) => {
    if (hasValidConfigs) {
      // Usar dados do banco quando disponíveis
      const moduleConfig = moduleConfigs.find(config => 
        config.id === moduleInfo.id || 
        config.title === moduleInfo.title ||
        config.id.toLowerCase().includes(moduleInfo.id.replace(/-/g, '')) ||
        moduleInfo.id.toLowerCase().includes(config.id.toLowerCase().replace(/\s+/g, '-'))
      );
      
      const isEnabled = moduleConfig?.enabled ?? false;
      const tier = moduleConfig?.tier ?? 'Free';
      

      
      return {
        id: moduleInfo.id,
        title: moduleConfig?.title ?? moduleInfo.title,
        description: moduleConfig?.description || moduleInfo.description,
        icon: getModuleIcon(moduleInfo.icon),
        comingSoon: !isEnabled,
        enabled: isEnabled,
        tier: tier as 'Free' | 'PRO' | 'Premium'
      };
    } else {
      // Fallback: primeiros 5 módulos especializados habilitados
      const isEnabled = index < 5;
      
      return {
        id: moduleInfo.id,
        title: moduleInfo.title,
        description: moduleInfo.description,
        icon: getModuleIcon(moduleInfo.icon),
        comingSoon: !isEnabled,
        enabled: isEnabled,
        tier: 'Free' as const
      };
    }
  });

  const handleAccessModule = (moduleTitle: string) => {
    console.log(`Acessando módulo: ${moduleTitle}`);
    // Redirecionar para a página de login caso não esteja autenticado
    // ou para o módulo específico caso já esteja
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Expanda sua prática clínica com inteligência
        </h2>
        <h3 className="text-xl md:text-2xl font-semibold text-center mb-8">Veja tudo que o Preskriptor oferece e o que está por vir</h3>
        
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
          Nossa plataforma está em constante evolução para transformar sua prática médica com decisões clínicas mais precisas, rápidas e seguras.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayModules.map((module) => (
            <ModuleCard
              key={module.id}
              title={module.title}
              description={module.description}
              icon={module.icon}
              comingSoon={module.comingSoon}
              tier={module.tier}
              enabled={module.enabled}
              onAccess={() => handleAccessModule(module.title)}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center text-primary">
          <p>Ao adquirir agora, você terá acesso antecipado aos novos módulos assim que forem lançados.</p>
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;