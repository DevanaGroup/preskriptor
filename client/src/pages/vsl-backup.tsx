import React, { useState, useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Stethoscope className="text-primary mr-2 text-xl" />
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
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h3 className="text-2xl font-semibold mb-2">
                      Demonstração do Preskriptor
                  </h3>
                  <p className="text-gray-300">
                    Veja a plataforma em funcionamento (3 min)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/cadastro')}
              className="bg-primary hover:bg-primaryDark text-white px-8 py-4 text-lg"
            >
              Começar Agora Grátis
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

      {/* Como Funciona */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Como o Preskriptor Funciona na Prática
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Veja o passo a passo de como nossa IA transforma sua consulta em prescrição segura
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Consulta com IA</h3>
                <p className="text-gray-600 mb-4">
                  Registre dados do paciente e converse com nossa IA especializada em nutrologia. 
                  Ela analisa sintomas, exames e histórico para sugerir o melhor tratamento.
                </p>
                <Badge className="bg-blue-100 text-blue-800">
                  ✓ IA treinada em guidelines médicas
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Upload de Exames</h3>
                <p className="text-gray-600 mb-4">
                  Faça upload de exames, relatórios ou documentos. Nossa tecnologia OCR 
                  extrai automaticamente os dados relevantes para análise.
                </p>
                <Badge className="bg-green-100 text-green-800">
                  ✓ OCR com 98% de precisão
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Prescrição Digital</h3>
                <p className="text-gray-600 mb-4">
                  Com base na análise da IA, gere prescrições digitais válidas automaticamente 
                  via integração Memed, prontas para o paciente.
                </p>
                <Badge className="bg-purple-100 text-purple-800">
                  ✓ Integração oficial Memed
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Módulos Especializados */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Módulos Especializados por Condição
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Cada módulo tem IA treinada especificamente para diferentes condições médicas
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-blue-600">Obesidade Adulta</h3>
                <p className="text-gray-600 mb-4">
                  IA especializada em protocolos de emagrecimento, medicamentos anti-obesidade 
                  e acompanhamento nutricional para adultos.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Protocolos GLP-1</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Sibutramina e Orlistat</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Dietas personalizadas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-green-600">Obesidade Infantil</h3>
                <p className="text-gray-600 mb-4">
                  Abordagem especializada para crianças e adolescentes, considerando 
                  crescimento, desenvolvimento e aspectos familiares.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Curvas de crescimento</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Educação alimentar</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Envolvimento familiar</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-purple-600">Diabetes e Obesidade</h3>
                <p className="text-gray-600 mb-4">
                  Manejo integrado de diabetes tipo 2 associado à obesidade, 
                  com foco em controle glicêmico e perda de peso.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Análise de HbA1c</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Medicações duais</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Monitoramento glicêmico</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-orange-600">Cirurgia Bariátrica</h3>
                <p className="text-gray-600 mb-4">
                  Acompanhamento pré e pós-operatório, suplementação adequada 
                  e prevenção de complicações nutricionais.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Protocolos pré-op</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Suplementação pós-op</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Acompanhamento nutricional</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-red-600">Transtornos Alimentares</h3>
                <p className="text-gray-600 mb-4">
                  Abordagem multidisciplinar para compulsão alimentar, 
                  anorexia, bulimia e outros transtornos relacionados.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Avaliação psicológica</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Planos terapêuticos</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Acompanhamento contínuo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-teal-500">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-teal-600">Nutrição Esportiva</h3>
                <p className="text-gray-600 mb-4">
                  Otimização da composição corporal para atletas e praticantes 
                  de atividade física, com foco em performance.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Bioimpedância</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Suplementação esportiva</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Periodização nutricional</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
              + Novos módulos sendo desenvolvidos mensalmente
            </Badge>
          </div>
        </div>
      </section>

      {/* Tecnologias e Integrações */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Tecnologias de Ponta Integradas
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Utilizamos as melhores ferramentas do mercado para garantir precisão e segurança
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center bg-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">OpenAI GPT-4</h3>
                <p className="text-gray-600 text-sm mb-4">
                  IA mais avançada do mundo para análise médica e sugestões de tratamento
                </p>
                <Badge className="bg-green-100 text-green-800 text-xs">
                  Atualizado continuamente
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center bg-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Google Document AI</h3>
                <p className="text-gray-600 text-sm mb-4">
                  OCR de última geração para extrair dados de exames e documentos médicos
                </p>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  98% de precisão
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center bg-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Memed Oficial</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Integração oficial com a maior plataforma de prescrição digital do Brasil
                </p>
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  CFM Aprovado
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center bg-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Firebase Security</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Segurança empresarial do Google para proteger dados dos pacientes
                </p>
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  LGPD Compliant
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demonstração Prática */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Veja uma Consulta Real em Ação
          </h2>
          
          <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Caso: Paciente com Obesidade Grau II</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Upload de Exames</p>
                        <p className="text-sm text-gray-600">Resultados de glicemia, perfil lipídico e bioimpedância</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-green-600 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Consulta com IA</p>
                        <p className="text-sm text-gray-600">IA analisa dados e sugere protocolo GLP-1 + dieta</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
                        <span className="text-purple-600 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Prescrição Automática</p>
                        <p className="text-sm text-gray-600">Receita digital gerada e enviada ao paciente</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-lg p-6 shadow-inner">
                    <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-3xl font-bold text-primary mb-2">12 min</div>
                    <p className="text-gray-600">Tempo total da consulta</p>
                    <p className="text-sm text-gray-500 mt-2">
                      vs. 45 min no método tradicional
                    </p>
                  </div>
                  <div className="mt-6">
                    <Badge className="bg-green-100 text-green-800">
                      73% mais rápido
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparativo Antes vs Depois */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Antes vs Depois do Preskriptor
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Antes */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-6 text-red-700 text-center">
                  ❌ Método Tradicional
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-red-600 text-xs">✗</span>
                    </div>
                    <div>
                      <p className="font-medium text-red-800">45 min por consulta</p>
                      <p className="text-sm text-red-600">Tempo perdido com burocracia</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-red-600 text-xs">✗</span>
                    </div>
                    <div>
                      <p className="font-medium text-red-800">Prescrições manuscritas</p>
                      <p className="text-sm text-red-600">Risco de erros e ilegibilidade</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-red-600 text-xs">✗</span>
                    </div>
                    <div>
                      <p className="font-medium text-red-800">Análise manual de exames</p>
                      <p className="text-sm text-red-600">Demora e possibilidade de erro</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-red-600 text-xs">✗</span>
                    </div>
                    <div>
                      <p className="font-medium text-red-800">Protocolos desatualizados</p>
                      <p className="text-sm text-red-600">Dificuldade de acompanhar novidades</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-red-600 text-xs">✗</span>
                    </div>
                    <div>
                      <p className="font-medium text-red-800">Gestão fragmentada</p>
                      <p className="text-sm text-red-600">Dados espalhados em sistemas diferentes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Depois */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-6 text-green-700 text-center">
                  ✅ Com Preskriptor
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">12 min por consulta</p>
                      <p className="text-sm text-green-600">73% mais rápido com IA</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Prescrições digitais Memed</p>
                      <p className="text-sm text-green-600">Aprovadas pelo CFM, sem erros</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">OCR automático de exames</p>
                      <p className="text-sm text-green-600">98% de precisão em segundos</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Guidelines sempre atualizadas</p>
                      <p className="text-sm text-green-600">IA treinada com dados mais recentes</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Plataforma única integrada</p>
                      <p className="text-sm text-green-600">Todos os dados em um só lugar</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="grid md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">73%</div>
                <p className="text-gray-600">Redução no tempo</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">98%</div>
                <p className="text-gray-600">Precisão no OCR</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <p className="text-gray-600">Prescrições digitais</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Comece Sua Transformação Hoje
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a centenas de médicos que já revolucionaram suas práticas
          </p>
          
          <Card className="bg-white text-gray-900 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-6">
                <Award className="h-12 w-12 text-primary mr-4" />
                <div className="text-left">
                  <h3 className="text-2xl font-bold">Teste Grátis por 14 Dias</h3>
                  <p className="text-gray-600">Sem cartão de crédito • Cancelamento a qualquer momento</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span>IA especializada incluída</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span>Prescrições ilimitadas</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span>Suporte personalizado</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/cadastro')}
              className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Começar Teste Grátis Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg"
            >
              Falar com Especialista
            </Button>
          </div>
          
          <p className="text-sm opacity-75 mt-6">
            🔒 Seus dados estão seguros e protegidos pela LGPD
          </p>
        </div>
      </section>
    </div>
  );
};

export default VSLPage;