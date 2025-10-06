import React from 'react';

const StepCard: React.FC<{step: number; icon: string; title: string; description: string}> = ({
  step, icon, title, description
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      <div className="absolute -top-5 -left-5 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
        {step}
      </div>
      <div className="mb-4 text-center">
        <i className={`${icon} text-4xl text-primary`}></i>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
    </div>
  );
};

const ProductDemoSection: React.FC = () => {
  const steps = [
    {
      icon: 'fas fa-user',
      title: 'Insira os Dados do Paciente',
      description: 'De forma rápida e segura, adicione IMC, histórico e respostas clínicas relevantes.'
    },
    {
      icon: 'fas fa-robot',
      title: 'Análise Criteriosa por IA',
      description: 'Nossa IA processa os dados e verifica a elegibilidade para medicamentos conforme as diretrizes.'
    },
    {
      icon: 'fas fa-pills',
      title: 'Sugestões Personalizadas',
      description: 'Receba as melhores opções de medicamentos, com justificativas baseadas em evidências.'
    },
    {
      icon: 'fas fa-file-prescription',
      title: 'Geração Automática da Receita',
      description: 'A receita é criada instantaneamente, personalizada e pronta para ser entregue ao paciente.'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Prescrições Inteligentes em Quatro Passos Simples</h2>
          <p className="text-center text-gray-600 mb-12">Da Análise à Receita em Minutos.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {steps.map((step, index) => (
              <StepCard 
                key={index}
                step={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDemoSection;
