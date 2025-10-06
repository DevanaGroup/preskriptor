import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <Card className="bg-white hover:shadow-md transition-shadow border-none">
      <CardContent className="p-8">
        <div className="w-16 h-16 bg-primaryLight rounded-full flex items-center justify-center mb-6 mx-auto">
          <i className={`${icon} text-primary text-2xl`}></i>
        </div>
        <h3 className="text-xl font-semibold text-center mb-4">{title}</h3>
        <p className="text-gray-600 text-center">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: 'far fa-clock',
      title: 'Otimização Radical do Seu Tempo',
      description: 'Reduza drasticamente o tempo gasto em prescrições com nossa IA que automatiza análises e a geração de receitas.'
    },
    {
      icon: 'fas fa-bullseye',
      title: 'Precisão Clínica Aumentada',
      description: 'Prescrições baseadas nas mais recentes diretrizes médicas, minimizando erros e elevando a qualidade das suas decisões.'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Segurança Ampliada para o Paciente',
      description: 'Indicações personalizadas que consideram o perfil individual do paciente, aumentando a segurança do tratamento.'
    },
    {
      icon: 'fas fa-heartbeat',
      title: 'Foco Total no Paciente',
      description: 'Mais tempo para o cuidado direto e atendimento humanizado, enquanto nossa IA cuida da burocracia.'
    },
    {
      icon: 'fas fa-desktop',
      title: 'Interface Intuitiva e Moderna',
      description: 'Fácil de usar, com aprendizado rápido, projetada por médicos para médicos.'
    },
    {
      icon: 'fas fa-lightbulb',
      title: 'Modernização da Sua Prática',
      description: 'Adote a inovação e destaque-se na sua especialidade com tecnologia de ponta.'
    }
  ];

  return (
    <section className="py-16 bg-neutral" id="features">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Transforme Sua Prática Clínica</h2>
        <p className="text-center text-gray-600 mb-12">Mais Tempo, Precisão e Segurança na Luta Contra a Obesidade.</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
