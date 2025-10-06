import React, { useState, useEffect } from 'react';
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
  idExterno: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento?: string;
  endereco?: string;
  cidade?: string;
  nomeMae?: string;
  peso?: number;
  altura?: number;
}

export default function MemedIntegrationPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState(false);
  const [memedToken, setMemedToken] = useState<string>('');
  
  const [patientData, setPatientData] = useState<PatientData>({
    idExterno: '',
    nome: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
    endereco: '',
    cidade: '',
  });

  useEffect(() => {
    configureMemed();
  }, [currentUser]);

  const configureMemed = async () => {
    try {
      const response = await fetch('/api/memed/configure-prescritor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser?.uid,
          name: currentUser?.name,
          email: currentUser?.email,
          cellphone: currentUser?.cellphone,
          crm: currentUser?.crm,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        setMemedToken(data.token);
        setIsConfigured(true);
        toast({
          title: "Memed configurado com sucesso",
          description: "Sistema pronto para criar prescrições digitais",
        });
      } else {
        throw new Error(data.message || 'Falha na configuração');
      }
    } catch (error: any) {
      console.error('Erro ao configurar Memed:', error);
      toast({
        title: "Erro na configuração do Memed",
        description: "Verifique se as chaves API estão corretas. Entre em contato com o suporte se o problema persistir.",
        variant: "destructive",
      });
    }
  };

  const initializeMemed = () => {
    if (!patientData.nome || !patientData.cpf || !patientData.telefone) {
      toast({
        title: "Dados obrigatórios",
        description: "Preencha nome, CPF e telefone do paciente",
        variant: "destructive",
      });
      return;
    }

    // Gerar ID único para o paciente
    const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPatientData(prev => ({ ...prev, idExterno: patientId }));

    // Configurar e carregar o script oficial do Memed
    loadMemedScript(patientId);
  };

  const loadMemedScript = (patientId: string) => {
    // Remove script anterior
    const existingScript = document.getElementById('memed-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Criar script oficial do Memed
    const script = document.createElement('script');
    script.id = 'memed-script';
    script.type = 'text/javascript';
    script.src = 'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js';
    script.setAttribute('data-token', memedToken);

    script.onload = () => {
      initializeMemedModules(patientId);
    };

    script.onerror = () => {
      toast({
        title: "Erro ao carregar Memed",
        description: "Não foi possível carregar o sistema de prescrição. Verifique sua conexão.",
        variant: "destructive",
      });
    };

    document.head.appendChild(script);
  };

  const initializeMemedModules = (patientId: string) => {
    const checkMemed = () => {
      if (typeof window !== 'undefined' && (window as any).MdSinapsePrescricao && (window as any).MdHub) {
        const MdSinapsePrescricao = (window as any).MdSinapsePrescricao;
        const MdHub = (window as any).MdHub;

        // Configurar evento de inicialização
        MdSinapsePrescricao.event.add("core:moduleInit", async function (module: any) {
          if (module.name === "plataforma.prescricao") {
            try {
              // Configurar dados do paciente
              await MdHub.command.send("plataforma.prescricao", "setPaciente", {
                idExterno: patientId,
                nome: patientData.nome,
                cpf: patientData.cpf.replace(/\D/g, ''),
                data_nascimento: patientData.dataNascimento || undefined,
                endereco: patientData.endereco || undefined,
                cidade: patientData.cidade || undefined,
                telefone: patientData.telefone.replace(/\D/g, ''),
                peso: patientData.peso || undefined,
                altura: patientData.altura || undefined,
                nome_mae: patientData.nomeMae || undefined,
              });

              // Mostrar o módulo de prescrição
              MdHub.module.show("plataforma.prescricao");

              // Ocultar o formulário de configuração
              const configForm = document.getElementById('patient-config-form');
              if (configForm) {
                configForm.style.display = 'none';
              }

              // Registrar ação no log
              await logAction('Iniciou prescrição Memed', { 
                paciente: patientData.nome,
                patientId: patientId 
              });

              toast({
                title: "Prescrição iniciada",
                description: "Sistema Memed carregado com os dados do paciente",
              });

            } catch (error) {
              console.error('Erro ao configurar paciente:', error);
              toast({
                title: "Erro na configuração",
                description: "Não foi possível configurar os dados do paciente no Memed",
                variant: "destructive",
              });
            }
          }
        });

        // Configurar outros eventos importantes
        MdSinapsePrescricao.event.add("prescription:saved", function (data: any) {
          toast({
            title: "Prescrição salva",
            description: "A prescrição foi salva no sistema Memed",
          });
        });

      } else {
        // Tentar novamente após 100ms
        setTimeout(checkMemed, 100);
      }
    };

    checkMemed();
  };

  const resetForm = () => {
    // Remover script do Memed
    const script = document.getElementById('memed-script');
    if (script) {
      script.remove();
    }

    // Mostrar novamente o formulário
    const configForm = document.getElementById('patient-config-form');
    if (configForm) {
      configForm.style.display = 'block';
    }

    // Limpar dados do paciente
    setPatientData({
      idExterno: '',
      nome: '',
      cpf: '',
      telefone: '',
      dataNascimento: '',
      endereco: '',
      cidade: '',
    });
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
                Sistema oficial de prescrições digitais com validade legal
              </p>
            </div>
          </div>
        </div>

        {!isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configurando integração com Memed. Se a configuração falhar, verifique se as chaves API estão corretas.
            </AlertDescription>
          </Alert>
        )}

        {isConfigured && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Memed configurado com sucesso. Preencha os dados do paciente para iniciar uma prescrição digital.
            </AlertDescription>
          </Alert>
        )}

        <div id="patient-config-form">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Configure os dados do paciente para iniciar a prescrição digital no Memed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
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
                  <Label htmlFor="cpf">CPF *</Label>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={patientData.dataNascimento}
                    onChange={(e) => setPatientData(prev => ({ 
                      ...prev, 
                      dataNascimento: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, complemento"
                    value={patientData.endereco}
                    onChange={(e) => setPatientData(prev => ({ 
                      ...prev, 
                      endereco: e.target.value 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={patientData.cidade}
                    onChange={(e) => setPatientData(prev => ({ 
                      ...prev, 
                      cidade: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Limpar Dados
                </Button>
                <Button 
                  onClick={initializeMemed}
                  disabled={!isConfigured}
                  className="min-w-[200px]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Iniciar Prescrição Memed
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Container onde o Memed será renderizado */}
        <div id="memed-container" className="w-full min-h-[600px] border rounded-lg">
          {/* O módulo Memed será carregado aqui */}
        </div>
      </div>
    </SidebarLayout>
  );
}