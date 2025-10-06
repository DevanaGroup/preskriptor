import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, Mail, Shield } from 'lucide-react';
import { Link } from 'wouter';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
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
              <span>Termos de Uso – Preskriptor</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Última atualização: 29/05/2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <p className="text-justify">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma digital Preskriptor, 
              ferramenta de apoio à decisão clínica, desenvolvida e mantida por{' '}
              <strong>Protocolos Médicos Avançados, Ltda.</strong>, inscrita no CNPJ sob nº 60.797.490/0001-20, 
              vinculada ao curso Doutores da Obesidade, bem como outros cursos desenvolvidos por esta empresa.
            </p>
            <p className="text-justify">
              Ao acessar e utilizar a plataforma, o usuário declara ter lido, compreendido e concordado 
              integralmente com as disposições aqui contidas.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Definições</h2>
            <p>Para fins destes Termos de Uso, deverão ser entendidos os termos abaixo com os respectivos significados:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Plataforma:</strong> sistema digital denominado "Preskriptor".</li>
              <li><strong>Usuário:</strong> médico regularmente inscrito em Conselho Regional de Medicina, autorizado a utilizar a plataforma.</li>
              <li><strong>Empresa:</strong> Protocolos Médicos Avançados Ltda.</li>
              <li><strong>Conteúdo:</strong> textos, algoritmos, fluxos de decisão e materiais fornecidos pela plataforma.</li>
              <li><strong>Curso Vinculado:</strong> Doutores da Obesidade ou outro curso, mentoria ou programa de ensino ao qual a plataforma está associada.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Finalidade</h2>
            <p className="text-justify">
              A plataforma tem caráter exclusivamente educacional e destina-se a profissionais da medicina, 
              regularmente inscritos em seus respectivos conselhos regionais, com o objetivo de fornecer 
              sugestões terapêuticas e organizacionais baseadas em diretrizes clínicas e conteúdos atualizados.
            </p>
            <p className="text-justify">
              A Preskriptor não substitui o raciocínio clínico, o exame físico nem a autonomia profissional 
              do médico, servindo apenas como ferramenta para auxiliar e facilitar a gestão do dia a dia do médico.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Responsabilidade Médica</h2>
            <p className="text-justify">
              As informações fornecidas pela plataforma têm natureza orientativa e educacional. A decisão 
              clínica é de inteira responsabilidade do médico usuário, o qual deve avaliar individualmente 
              cada caso com base em seu julgamento profissional, experiência, recursos disponíveis e 
              diretrizes do Conselho Regional e Federal de Medicina.
            </p>
            <p className="text-justify">
              <strong>A Empresa e a plataforma não se responsabilizam por eventuais desfechos clínicos 
              adversos decorrentes da aplicação das sugestões fornecidas pela ferramenta.</strong>
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Propriedade Intelectual</h2>
            <p className="text-justify">
              Todo o conteúdo da plataforma é protegido por direitos autorais, sendo de titularidade exclusiva 
              da Protocolos Médicos Avançados Ltda. É vedada a reprodução, modificação, distribuição ou 
              compartilhamento, no todo ou em parte, de quaisquer conteúdos da plataforma sem autorização 
              prévia e expressa, sob pena de responsabilidade civil e criminal, conforme a legislação vigente.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Acesso à Plataforma</h2>
            <p>O acesso ao Preskriptor poderá ocorrer por:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Matrícula no curso "Doutores da Obesidade", conforme oferta comercial vigente;</li>
              <li>Aquisição direta do direito de uso da plataforma, de forma avulsa.</li>
            </ul>
            
            <div className="bg-red-50 p-4 rounded-lg my-4">
              <h3 className="font-semibold text-red-900 mb-2">Importante:</h3>
              <p className="text-red-800 text-sm">
                O uso da plataforma é pessoal, intransferível e vinculado ao CPF e/ou número de CRM do usuário. 
                É terminantemente proibido, sob pena de exclusão do acesso à plataforma, além das penalidades legais:
              </p>
              <ul className="list-disc pl-6 mt-2 text-red-800 text-sm">
                <li>Compartilhar login e senha com terceiros;</li>
                <li>Permitir acessos simultâneos não autorizados.</li>
              </ul>
            </div>

            <p className="text-justify">
              A Empresa realiza o monitoramento de IP, localização geográfica e demais mecanismos antifraude. 
              A constatação de acesso indevido resultará:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>No cancelamento imediato e definitivo do acesso à plataforma, sem direito a reembolso;</li>
              <li>Na apuração de responsabilidade civil e penal, nos termos da legislação brasileira.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">6. Modificações</h2>
            <p className="text-justify">
              A Protocolos Médicos Avançados Limitada reserva-se o direito de alterar estes Termos de Uso 
              a qualquer momento. As alterações serão publicadas nesta página e entram em vigor na data 
              de sua publicação.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">7. Cancelamento, Reembolso e Penalidades</h2>
            <p className="text-justify">
              O usuário que tenha adquirido o acesso de forma avulsa poderá solicitar o cancelamento do acesso, 
              conforme política comercial aplicável à aquisição sendo-lhe aplicado uma multa rescisória pelo 
              cancelamento de 30% (trinta por cento) do valor total pago e restituído o valor remanescente 
              em até 90 dias úteis.
            </p>
            <p className="text-justify">
              Para aqueles que adquirirem o Preskriptor em conjunto com um de nossos cursos, por se tratar 
              de uma aquisição gratuita (bônus), não haverá restituição de qualquer valor em caso de cancelamento.
            </p>
            
            <div className="bg-yellow-50 p-4 rounded-lg my-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Atenção:</h3>
              <p className="text-yellow-800 text-sm">
                Não haverá reembolso e o valor da multa compensatória será considerado como a totalidade 
                do contrato em caso de:
              </p>
              <ul className="list-disc pl-6 mt-2 text-yellow-800 text-sm">
                <li>Descumprimento destes Termos;</li>
                <li>Uso indevido ou fraudulento da plataforma;</li>
                <li>Compartilhamento de acesso.</li>
              </ul>
            </div>

            <p className="text-justify">
              A Empresa reserva-se o direito de suspender ou encerrar o acesso do usuário, a qualquer tempo, 
              em caso de violação às regras aqui previstas.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">8. Privacidade e Proteção de Dados</h2>
            <p className="text-justify">
              O tratamento de dados pessoais será regido pela{' '}
              <Link href="/privacy-policy" className="text-primary hover:underline">
                Política de Privacidade – Preskriptor
              </Link>
              . Ao utilizar a plataforma, o usuário concorda com os termos da referida política.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-4">9. Legislação Aplicável e Foro</h2>
            <p className="text-justify">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Fica eleito 
              o foro da Comarca de Rio de Janeiro/RJ, com renúncia expressa de qualquer outro, por mais 
              privilegiado que seja, para dirimir eventuais controvérsias.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Contato Legal
              </h3>
              <p className="text-blue-800">
                Para questões relacionadas a estes Termos de Uso ou sobre a plataforma Preskriptor, 
                entre em contato através do e-mail{' '}
                <a href="mailto:contato@preskriptor.com.br" className="underline">
                  contato@preskriptor.com.br
                </a>
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <p className="text-sm text-gray-600 text-center">
                <strong>Protocolos Médicos Avançados Ltda.</strong><br />
                CNPJ: 60.797.490/0001-20<br />
                Rio de Janeiro - RJ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}