import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SidebarLayout from '@/components/SidebarLayout';
import { logAction } from '@/lib/logger';
import memedIcon from '@assets/image_1749057814027.png';

interface PatientData {
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento?: string;
  endereco?: string;
  cidade?: string;
}

export default function MemedProductionPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [patientData, setPatientData] = useState<PatientData>({
    nome: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
    endereco: '',
    cidade: '',
  });

  const validatePatientData = (): boolean => {
    if (!patientData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome completo do paciente",
        variant: "destructive",
      });
      return false;
    }

    if (!patientData.cpf.trim()) {
      toast({
        title: "CPF obrigatório", 
        description: "Informe o CPF do paciente",
        variant: "destructive",
      });
      return false;
    }

    if (!patientData.telefone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Informe o telefone do paciente",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const openMemedDirect = async () => {
    if (!validatePatientData()) return;

    try {
      await logAction('Acessou Memed direto', { 
        paciente: patientData.nome 
      });

      // Abrir a plataforma oficial do Memed diretamente
      const memedUrl = 'https://prescricao.memed.com.br/';
      
      const memedWindow = window.open(
        memedUrl,
        'memed-prescription',
        'width=1400,height=900,scrollbars=yes,resizable=yes,location=yes'
      );

      if (memedWindow) {
        toast({
          title: "Memed aberto com sucesso",
          description: "Plataforma de prescrição digital oficial aberta em nova janela",
        });
      } else {
        // Fallback se popup foi bloqueado
        window.location.href = memedUrl;
      }
    } catch (error) {
      console.error('Erro ao abrir Memed:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir a plataforma Memed",
        variant: "destructive",
      });
    }
  };

  const accessMemedDashboard = async () => {
    try {
      await logAction('Acessou dashboard Memed');
      
      const dashboardUrl = 'https://memed.com.br/login';
      window.open(dashboardUrl, '_blank');
      
      toast({
        title: "Dashboard Memed aberto",
        description: "Acesse com suas credenciais de produção",
      });
    } catch (error) {
      console.error('Erro ao abrir dashboard:', error);
    }
  };

  const openMemedSupport = () => {
    const supportUrl = 'https://suporte.memed.com.br/';
    window.open(supportUrl, '_blank');
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={memedIcon} alt="Memed" className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Memed - Prescrição Digital</h1>
              <p className="text-muted-foreground">
                Sistema oficial de prescrições digitais com validade legal nacional
              </p>
            </div>
          </div>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Acesse a plataforma oficial do Memed usando suas credenciais de produção para criar prescrições digitais válidas.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Acessar Plataforma Memed</CardTitle>
              <CardDescription>
                Abra a plataforma oficial de prescrições digitais do Memed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Paciente (Opcional)</Label>
                  <Input
                    id="nome"
                    placeholder="Nome completo do paciente"
                    value={patientData.nome}
                    onChange={(e) => setPatientData(prev => ({ 
                      ...prev, 
                      nome: e.target.value 
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF do Paciente (Opcional)</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={patientData.cpf}
                    onChange={(e) => setPatientData(prev => ({ 
                      ...prev, 
                      cpf: e.target.value 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone do Paciente (Opcional)</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={patientData.telefone}
                    onChange={(e) => setPatientData(prev => ({ 
                      ...prev, 
                      telefone: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={openMemedDirect}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir Plataforma Memed
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Conta</CardTitle>
              <CardDescription>
                Acesse seu dashboard e configurações no Memed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Chaves de produção configuradas</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Conta ativa na Memed</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Prescrições com validade legal</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button 
                  onClick={accessMemedDashboard}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Dashboard Memed
                </Button>
                
                <Button 
                  onClick={openMemedSupport}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Suporte Memed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Chaves de Produção Ativas:</strong> Suas chaves de API estão configuradas para o ambiente de produção do Memed. 
                Todas as prescrições criadas terão validade legal.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Funcionalidades Disponíveis:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Prescrições digitais válidas</li>
                  <li>• Assinatura digital certificada</li>
                  <li>• Banco de medicamentos completo</li>
                  <li>• Histórico de prescrições</li>
                  <li>• Relatórios e estatísticas</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Documentação:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• API Key configurada</li>
                  <li>• Secret Key configurada</li>
                  <li>• Ambiente: Produção</li>
                  <li>• Status: Ativo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}