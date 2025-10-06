import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { 
  CheckCircle, 
  ArrowRight, 
  Clock, 
  Shield, 
  Brain, 
  FileText, 
  Users, 
  TrendingUp,
  Play,
  Star,
  Award,
  Zap,
  Mic,
  Activity,
  Search,
  Lock,
  Target,
  Stethoscope,
  BarChart3,
  Sparkles,
  MessageSquare
} from 'lucide-react';

const VSLPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-notes-medical text-primary mr-2 text-xl"></i>
            <span className="text-xl font-bold text-primary">Preskriptor</span>
          </div>
          <Button 
            variant="outline"
            onClick={() => setLocation('/auth')}
            className="text-sm"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            🚀 Revolucione sua prática médica
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
            <span className="text-primary">Preskriptor:</span> Sua Prescrição Médica Assistida por IA
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Transcrição automática, prescrições inteligentes e interpretação de exames em segundos.
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
            Otimize seu consultório com prontuários automáticos, prescrições inteligentes e interpretação precisa de exames e bioimpedância.
          </p>
          
          {/* Video Section */}
          <div className="mb-8">
            <Card className="bg-gray-900 border-0 overflow-hidden">
              <CardContent className="p-0 relative">
                <div 
                  className="aspect-video relative"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/_pkyokrQ0Wg?modestbranding=1&controls=0&showinfo=0&rel=0&disablekb=1&fs=0&iv_load_policy=3&autoplay=${isVideoPlaying ? '1' : '0'}`}
                    title="Demonstração do Preskriptor"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; autoplay"
                    allowFullScreen={false}
                    className="w-full h-full absolute inset-0"
                    style={{ 
                      border: 'none',
                      pointerEvents: 'none'
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  
                  {/* Botão de Play - só aparece quando o vídeo não está tocando */}
                  {!isVideoPlaying && (
                    <div 
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all cursor-pointer"
                      onClick={() => setIsVideoPlaying(true)}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <div className="bg-white bg-opacity-90 rounded-full p-6 hover:bg-opacity-100 transition-all transform hover:scale-105">
                        <Play className="w-12 h-12 text-primary ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay para bloquear controles do YouTube após o play */}
                  {isVideoPlaying && (
                    <div 
                      className="absolute inset-0 z-10"
                      style={{ 
                        background: 'transparent',
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={(e) => e.preventDefault()}
                      onDoubleClick={(e) => e.preventDefault()}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseUp={(e) => e.preventDefault()}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/cadastro')}
              className="bg-primary hover:bg-primaryDark text-white px-8 py-4 text-lg"
            >
              Comece Agora Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg"
            >
              Agendar Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Principais Funcionalidades */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Principais Funcionalidades
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnologia de ponta para revolucionar sua prática médica
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-4 border-l-4 border-l-primary hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="bg-primary/10 p-3 rounded-lg mx-auto mb-4 w-fit">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Prontuário Blindado com Transcrição Automática
                </h3>
                <p className="text-sm text-gray-600">
                  Converte automaticamente áudios das suas consultas em prontuários claros, completos e organizados, oferecendo proteção jurídica ao médico.
                </p>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-lg mx-auto mb-4 w-fit">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Prescrição Anti-obesidade Guiada
                </h3>
                <p className="text-sm text-gray-600">
                  Sugere medicamentos anti-obesidade utilizando os protocolos ensinados na Formação Doutores da Obesidade, garantindo segurança e eficácia clínica.
                </p>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-lg mx-auto mb-4 w-fit">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Bioimpedância Convertida em Texto
                </h3>
                <p className="text-sm text-gray-600">
                  Gera automaticamente relatórios clínicos completos a partir dos resultados das balanças de bioimpedância (compatível com diversos modelos InBody).
                </p>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-lg mx-auto mb-4 w-fit">
                  <Search className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  Interpretação Inteligente de Exames
                </h3>
                <p className="text-sm text-gray-600">
                  Realiza análise clínica instantânea, destacando alterações relevantes e orientando sua conduta terapêutica.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Como o Preskriptor Funciona na Prática
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Veja o passo a passo de como nossa IA transforma sua consulta
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-4">
            {/* Passo 1 */}
            <div className="flex-1 text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Prontuário Blindado com Transcrição Automática
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Grave ou envie o áudio da consulta. Nossa IA converte automaticamente em prontuários claros, completos e organizados, oferecendo proteção jurídica ao médico.
              </p>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-600 font-medium">
                  Transcrição automática de consultas
                </span>
              </div>
            </div>

            {/* Seta 1 */}
            <div className="flex justify-center lg:block">
              <ArrowRight className="h-8 w-8 text-gray-400 rotate-90 lg:rotate-0" />
            </div>

            {/* Passo 2 */}
            <div className="flex-1 text-center">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Bioimpedância e Interpretação de Exames
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Converta automaticamente resultados de bioimpedância em relatórios completos e obtenha interpretação inteligente de exames laboratoriais.
              </p>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-600 font-medium">
                  Relatórios automáticos de bioimpedância
                </span>
              </div>
            </div>

            {/* Seta 2 */}
            <div className="flex justify-center lg:block">
              <ArrowRight className="h-8 w-8 text-gray-400 rotate-90 lg:rotate-0" />
            </div>

            {/* Passo 3 */}
            <div className="flex-1 text-center">
              <div className="bg-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Prescrição Anti-obesidade Guiada
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Gere prescrições de medicamentos anti-obesidade utilizando os protocolos ensinados na Formação Doutores da Obesidade.
              </p>
              <div className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-green-600 font-medium">
                  Protocolos da Formação Doutores da Obesidade
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Para quem é o Preskriptor?
            </h2>
            <p className="text-xl text-gray-600">
              Ideal para médicos que desejam otimizar sua prática
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <p className="text-gray-700">
                  Automatizar a documentação clínica e proteger-se juridicamente.
                </p>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <p className="text-gray-700">
                  Agilizar a prescrição de medicamentos anti-obesidade.
                </p>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <p className="text-gray-700">
                  Simplificar a interpretação e apresentação de resultados de bioimpedância.
                </p>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <p className="text-gray-700">
                  Ganhar tempo na análise clínica e interpretação de exames laboratoriais.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Planos de Preços */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Pronto para experimentar o futuro da prática clínica com IA?
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o plano ideal para você e transforme seu consultório.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Plano Grátis */}
            <Card className="relative">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-4xl font-black text-green-600">GRÁTIS</CardTitle>
                <p className="text-gray-600">Ideal para conhecer a ferramenta</p>
                <div className="mt-4">
                  <span className="text-6xl font-black text-gray-900">R$ 0,00</span>
                  <span className="text-2xl text-gray-600">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Não requer cartão de crédito</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Até 5 créditos de uso (5 interações)</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Acesso total aos módulos:</span>
                  </div>
                  <div className="ml-6 space-y-1 text-sm text-gray-600">
                    <p>• Indicação de Medicação Anti-Obesidade (MAO)</p>
                    <p>• Avaliação de indicação de Cirurgia Bariátrica</p>
                    <p>• Conversor de cliques Ozempic ↔ Wegovy</p>
                    <p>• Módulo de Conversão de Bioimpedância para texto (InBody)</p>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-red-500 mr-3" />
                    <span className="text-sm">Sem suporte ou comunidade</span>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => setLocation('/cadastro')}
                >
                  Comece Agora Gratuitamente
                </Button>
              </CardContent>
            </Card>

            {/* Plano PRO */}
            <Card className="relative border-primary border-2">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white px-4 py-1">
                  Mais Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">PRO</CardTitle>
                <p className="text-gray-600">Ideal para profissionais em crescimento</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">R$ 47,41</span>
                  <span className="text-gray-600">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">100 créditos/mês</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Prescrição de Medicamentos Anti-Obesidade (MAO)</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Interpretação de Exames Laboratoriais</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Prescrição de Fitoterápicos na Obesidade</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Reposição Hormonal Masculina</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Reposição de Vitaminas e Minerais</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Atualizações contínuas incluídas</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primaryDark"
                  onClick={() => setLocation('/cadastro')}
                >
                  Assinar plano
                </Button>
              </CardContent>
            </Card>

            {/* Plano Premium */}
            <Card className="relative">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Premium</CardTitle>
                <p className="text-gray-600">Solução completa com suporte exclusivo</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">R$ 115,81</span>
                  <span className="text-gray-600">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">200 créditos/mês</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Prontuário Blindado (transcreva e organize suas consultas)</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Reposição Hormonal Feminina</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Todos do Plano Pro mais:</span>
                  </div>
                  <div className="ml-6 space-y-1 text-sm text-gray-600">
                    <p>• Canal de suporte exclusivo via WhatsApp</p>
                  </div>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => setLocation('/cadastro')}
                >
                  Assinar plano
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 flex items-center justify-center">
              <Lock className="h-4 w-4 mr-2" />
              Seus dados estão seguros e protegidos pela LGPD
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="text-primary mr-2 text-xl" />
            <span className="text-xl font-bold">Preskriptor</span>
          </div>
          <p className="text-gray-400 mb-4">
            Revolucionando a prática médica com inteligência artificial
          </p>
          <div className="flex justify-center space-x-6">
            <Button variant="link" className="text-gray-400 hover:text-white">
              Termos de Uso
            </Button>
            <Button variant="link" className="text-gray-400 hover:text-white">
              Política de Privacidade
            </Button>
            <Button variant="link" className="text-gray-400 hover:text-white">
              Suporte
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VSLPage;