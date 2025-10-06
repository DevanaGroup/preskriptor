import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Mail, FileText } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
                <p className="text-gray-600">Preskriptor - Protocolos Médicos Avançados</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao Início</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Política de Privacidade – Preskriptor</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-justify">
              A presente Política de Privacidade tem por finalidade demonstrar o compromisso da empresa 
              <strong> Protocolos Médicos Avançados Ltda.</strong>, inscrita no CNPJ sob nº 60.797.490/0001-20, 
              com a privacidade e a proteção dos dados pessoais tratados por meio da plataforma Preskriptor, 
              vinculada ao curso Doutores da Obesidade. Esta Política foi elaborada em conformidade com a 
              Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (LGPD), bem como demais normas aplicáveis.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">Definições Iniciais</h2>
            <p>Para os fins desta Política, aplicam-se as seguintes definições:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados Pessoais:</strong> informações que identifiquem ou possam identificar uma pessoa natural.</li>
              <li><strong>Dados Sensíveis:</strong> dados pessoais sobre saúde, como aqueles referentes aos pacientes inseridos na plataforma.</li>
              <li><strong>Usuário:</strong> médico devidamente inscrito no Conselho Regional de Medicina e autorizado a utilizar a plataforma.</li>
              <li><strong>Plataforma:</strong> ferramenta digital Preskriptor.</li>
              <li><strong>Controlador:</strong> Protocolos Médicos Avançados, Ltda.</li>
              <li><strong>Encarregado (DPO):</strong> pessoa indicada para atuar como canal de comunicação entre o controlador, os titulares e a ANPD.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Quais Dados Coletamos</h2>
            <p>Podemos coletar e armazenar:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados do médico usuário:</strong> nome, e-mail, CRM, CPF, localização de acesso (IP), histórico de uso na plataforma.</li>
              <li><strong>Dados de pacientes cadastrados pelos médicos usuários:</strong> nome, idade, sexo, medidas corporais, dados clínicos e qualquer outra informação inserida voluntariamente pelo médico durante o uso da ferramenta.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Finalidade</h2>
            <p>Os dados são utilizados para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e personalizar a experiência de uso da plataforma;</li>
              <li>Permitir que o médico acompanhe e organize casos clínicos de maneira educacional;</li>
              <li>Viabilizar sugestões clínicas automatizadas baseadas nas informações inseridas;</li>
              <li>Monitorar acessos, prevenir fraudes e garantir o uso ético da ferramenta;</li>
              <li>Aperfeiçoar o conteúdo técnico e educacional da plataforma;</li>
              <li>Cumprir obrigações legais ou regulatórias;</li>
              <li>Aprimorar a funcionalidade técnica e pedagógica da plataforma;</li>
              <li>Prevenir fraudes e garantir segurança no uso da plataforma.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Armazenamento e Segurança dos Dados</h2>
            <p>Adotamos medidas técnicas e administrativas para proteger os dados armazenados, incluindo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptografia de dados sensíveis;</li>
              <li>Monitoramento de acessos e comportamento de uso;</li>
              <li>Controles de acesso restrito aos dados armazenados;</li>
              <li>Armazenamento seguro em servidores com padrão de segurança internacional.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Compartilhamento de Dados</h2>
            <p>Não compartilhamos dados com terceiros, exceto:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Quando exigido por lei ou decisão judicial;</li>
              <li>Com parceiros operacionais necessários para o funcionamento da plataforma, sob acordos contratuais de confidencialidade;</li>
              <li>Com o próprio médico usuário, mediante login autorizado.</li>
            </ul>
            <p><strong>Jamais utilizamos dados de pacientes para fins publicitários ou fins não autorizados.</strong></p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Direitos do Titular dos Dados</h2>
            <p>Nos termos da LGPD, o usuário poderá, a qualquer tempo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Solicitar acesso aos dados pessoais que armazenamos;</li>
              <li>Corrigir ou atualizar seus dados;</li>
              <li>Solicitar a exclusão de sua conta e de todos os dados associados.</li>
            </ul>
            <p>Para isso, entre em contato por meio de: <a href="mailto:privacidade@preskriptor.com.br" className="text-primary hover:underline">privacidade@preskriptor.com.br</a></p>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Prazo de Retenção dos Dados</h2>
            <p>Os dados pessoais serão armazenados:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Enquanto perdurar a relação contratual;</li>
              <li>Pelo prazo necessário ao cumprimento de obrigações legais e regulatórias;</li>
              <li>Pelo prazo prescricional previsto na legislação civil, trabalhista ou fiscal, quando aplicável.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Encarregado pelo Tratamento (DPO)</h2>
            <p>Para assuntos relacionados à privacidade e proteção de dados, o contato deverá ser feito com:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Encarregado (DPO):</strong> Alex Santana Santos</p>
              <p className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span><strong>E-mail:</strong> <a href="mailto:privacidade@preskriptor.com.br" className="text-primary hover:underline">privacidade@preskriptor.com.br</a></span>
              </p>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Alterações desta Política</h2>
            <p>
              Esta Política poderá ser atualizada a qualquer tempo. Recomendamos que o usuário consulte 
              periodicamente este documento. Alterações relevantes serão comunicadas previamente, por 
              e-mail ou na plataforma.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Foro e Legislação Aplicável</h2>
            <p>
              Esta Política será interpretada conforme a legislação brasileira, especialmente a LGPD. 
              Fica eleito o foro da Comarca de Rio de Janeiro/RJ, com exclusão de qualquer outro, por 
              mais privilegiado que seja, para dirimir controvérsias oriundas deste instrumento.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <h3 className="font-semibold text-blue-900 mb-2">Dúvidas sobre esta Política?</h3>
              <p className="text-blue-800">
                Se você tiver alguma dúvida sobre nossa Política de Privacidade ou sobre como tratamos 
                seus dados pessoais, entre em contato conosco através do e-mail{' '}
                <a href="mailto:privacidade@preskriptor.com.br" className="underline">
                  privacidade@preskriptor.com.br
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}