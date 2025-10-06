import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const faqItems: FAQItem[] = [
    {
      question: "O sistema substitui o julgamento clínico do médico?",
      answer: "Absolutamente não. O Preskriptor é uma ferramenta de suporte à decisão clínica, projetada para auxiliar o médico, e não para substituí-lo. A decisão clínica final é insubstituível e soberana, cabendo sempre ao médico."
    },
    {
      question: "Como o sistema se mantém atualizado com as diretrizes?",
      answer: "Nossa equipe de especialistas monitora e atualiza continuamente a base de conhecimento da IA com as últimas diretrizes de sociedades médicas reconhecidas nacional e internacionalmente."
    },
    {
      question: "É necessário instalar algum software?",
      answer: "Não. O Preskriptor é uma plataforma 100% online, acessível de qualquer dispositivo com conexão à internet."
    },
    {
      question: "Como funciona o suporte técnico?",
      answer: "Oferecemos suporte técnico especializado por meio de canais dedicados, com o objetivo de garantir a melhor experiência possível ao usuário médico."
    },
    {
      question: "O Preskriptor funciona como um prontuário eletrônico?",
      answer: "Ainda não. Atualmente, o foco da plataforma é atuar como ferramenta de apoio à decisão clínica e ao aprendizado médico."
    }
  ];

  return (
    <section className="py-16 bg-white" id="faq">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Ainda tem dúvidas? Entre em <a href="#contact" className="text-primary hover:underline">contato com nossa equipe</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;