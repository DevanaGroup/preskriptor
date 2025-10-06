import React from "react";
import { CheckIcon, XIcon } from "lucide-react";

const ComparisonRow = ({ criterion, traditional, preskriptor }: { criterion: string, traditional: string, preskriptor: string }) => {
  return (
    <tr className="border-b">
      <td className="py-3 px-4 font-medium">{criterion}</td>
      <td className="py-3 px-4">{traditional}</td>
      <td className="py-3 px-4">
        {preskriptor} 
        {preskriptor.includes("✅") && <CheckIcon className="inline-block ml-1 h-4 w-4 text-green-500" />}
      </td>
    </tr>
  );
};

const AboutSection: React.FC = () => {
  const comparisonData = [
    { criterion: "Tempo por Prescrição", traditional: "20-45 min", preskriptor: "5-10 min ✅" },
    { criterion: "Risco de Erros Manuais", traditional: "Moderado a Alto", preskriptor: "Reduzido ✅" },
    { criterion: "Atualização com Diretrizes", traditional: "Esforço contínuo", preskriptor: "Automática ✅" },
    { criterion: "Foco no Paciente", traditional: "Dividido com burocracia", preskriptor: "Ampliado ✅" }
  ];

  return (
    <section className="py-16 bg-neutral" id="about">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Método Tradicional vs. Preskriptor</h2>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-12">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Critério</th>
                  <th className="py-3 px-4 text-left">Método Tradicional</th>
                  <th className="py-3 px-4 text-left">Com Preskriptor</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <ComparisonRow 
                    key={index}
                    criterion={row.criterion}
                    traditional={row.traditional}
                    preskriptor={row.preskriptor}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 rounded-lg p-8 mb-12">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <i className="fas fa-shield-alt text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold">Segurança e Privacidade: Nosso Compromisso Inegociável</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Operamos em total conformidade com a LGPD, utilizando criptografia de ponta e servidores seguros para proteger integralmente seus dados e de seus pacientes. Sua tranquilidade é nossa prioridade.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white px-4 py-2 rounded-full flex items-center">
                <i className="fas fa-file-contract text-blue-600 mr-2"></i>
                <span className="font-medium">LGPD</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-full flex items-center">
                <i className="fas fa-lock text-blue-600 mr-2"></i>
                <span className="font-medium">Criptografia</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-full flex items-center">
                <i className="fas fa-server text-blue-600 mr-2"></i>
                <span className="font-medium">Servidores Seguros</span>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-xl md:text-2xl font-bold text-center mb-8">O Futuro da Assistência Clínica Inteligente Começa Aqui</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="bg-primary p-3 rounded-full mr-4 text-white">
                    <i className="fas fa-file-medical-alt"></i>
                  </div>
                  <h4 className="text-lg font-semibold">Redação Automática de Prontuários</h4>
                </div>
                <p className="text-gray-600">
                  Gere rascunhos de prontuários com IA, economizando tempo valioso.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="bg-primary p-3 rounded-full mr-4 text-white">
                    <i className="fas fa-microscope"></i>
                  </div>
                  <h4 className="text-lg font-semibold">Análise Inteligente de Exames</h4>
                </div>
                <p className="text-gray-600">
                  Insights de exames laboratoriais para apoiar suas decisões clínicas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
