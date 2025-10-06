import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

const HeroSection: React.FC = () => {
  const [_, setLocation] = useLocation();

  return (
    <section className="min-h-screen pt-20 flex items-center bg-gradient-to-b from-white to-[#EEF6FF]" id="hero">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-darkText leading-tight">
            <span className="text-primary">Prescrição Inteligente:</span> Otimize Seu Tempo e Eleve a Precisão Clínica com IA
          </h1>
          <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-3xl mx-auto">
            Para médicos que buscam agilidade e segurança: nossa plataforma analisa dados do paciente, sugere os medicamentos anti-obesidade mais adequados conforme diretrizes atualizadas e gera receitas personalizadas automaticamente. Menos burocracia, mais foco no paciente.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button 
              onClick={() => setLocation('/vsl')}
              className="bg-primary text-white font-medium rounded-lg px-6 py-6 hover:bg-primaryDark transition-colors text-base"
            >
              Veja o Preskriptor em ação
            </Button>
            <Button 
              variant="outline" 
              className="border-primary text-primary font-medium rounded-lg px-6 py-6 hover:bg-primaryLight transition-colors text-base"
              onClick={() => setLocation('/cadastro')}
            >
              Teste gratuitamente
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Transforme Sua Prática Clínica: Mais Tempo, Precisão e Segurança na Luta Contra a Obesidade
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
