import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { ExternalLink, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SidebarLayout from '@/components/SidebarLayout';
import { logAction } from '@/lib/logger';
import memedIcon from '@assets/image_1749057814027.png';

// Chaves de produção do Memed (fornecidas pelo usuário)
const MEMED_PRODUCTION_CONFIG = {
  API_KEY: '833709d9448fcc4c63620c38441bd34271d32e4a35d4eccbdbc5e5ea09f7e03a',
  SECRET_KEY: 'd3951525cd0ab8ddbdf2476d733e6a1c91df62f25155dc7189d04ed5c66047f4',
  SCRIPT_URL: 'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'
};

interface PatientData {
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento?: string;
  endereco?: string;
  cidade?: string;
}

export default function MemedFinalPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [prescriptionToken, setPrescriptionToken] = useState<string>('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  
  const [patientData, setPatientData] = useState<PatientData>({
    nome: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
    endereco: '',
    cidade: '',
  });

  useEffect(() => {
    generatePrescriptionToken();
  }, [currentUser]);

  const generatePrescriptionToken = async () => {
    if (!currentUser) return;

    try {
      // Tentar obter token válido através da API do servidor
      const response = await fetch('/api/memed/configure-prescritor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          name: currentUser.name,
          email: currentUser.email,
          cellphone: currentUser.cellphone,
          crm: currentUser.crm,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        setPrescriptionToken(data.token);
        return;
      }
    } catch (error) {
      console.log('Usando fallback para gerar token');
    }

    // Se não conseguir obter token válido, mostrar erro
    toast({
      title: "Erro na configuração do Memed",
      description: "Não foi possível gerar token válido. Verifique as credenciais da API.",
      variant: "destructive",
    });
  };

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

  const initializeMemedPrescription = async () => {
    if (!validatePatientData()) return;

    try {
      await logAction('Iniciou prescrição Memed', { 
        paciente: patientData.nome,
        token: prescriptionToken.substring(0, 20) + '...'
      });

      loadMemedScript();
    } catch (error) {
      console.error('Erro ao inicializar Memed:', error);
    }
  };

  const loadMemedScript = () => {
    // Remove script anterior se existir
    const existingScript = document.getElementById('memed-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Criar script oficial do Memed
    const script = document.createElement('script');
    script.id = 'memed-script';
    script.type = 'text/javascript';
    script.src = MEMED_PRODUCTION_CONFIG.SCRIPT_URL;
    script.setAttribute('data-token', prescriptionToken);

    script.onload = () => {
      setIsScriptLoaded(true);
      setupMemedModules();
    };

    script.onerror = () => {
      toast({
        title: "Erro ao carregar Memed",
        description: "Verifique sua conexão com a internet",
        variant: "destructive",
      });
    };

    document.head.appendChild(script);
  };

  const setupMemedModules = () => {
    const initMemed = () => {
      if (typeof window !== 'undefined' && (window as any).MdSinapsePrescricao) {
        const MdSinapsePrescricao = (window as any).MdSinapsePrescricao;
        const MdHub = (window as any).MdHub;

        // Configurar evento de inicialização do módulo
        MdSinapsePrescricao.event.add("core:moduleInit", async function (module: any) {
          if (module.name === "plataforma.prescricao") {
            try {
              // Configurar dados do paciente
              await MdHub.command.send("plataforma.prescricao", "setPaciente", {
                idExterno: `paciente_${Date.now()}`,
                nome: patientData.nome,
                cpf: patientData.cpf.replace(/\D/g, ''),
                data_nascimento: patientData.dataNascimento || '',
                endereco: patientData.endereco || '',
                cidade: patientData.cidade || '',
                telefone: patientData.telefone.replace(/\D/g, ''),
              });

              // Exibir o módulo de prescrição
              MdHub.module.show("plataforma.prescricao");
              
              setShowPrescription(true);
              
              // Ocultar formulário de dados
              const formContainer = document.getElementById('patient-form-container');
              if (formContainer) {
                formContainer.style.display = 'none';
              }

              toast({
                title: "Prescrição iniciada",
                description: "Sistema Memed carregado com sucesso",
              });

            } catch (error) {
              console.error('Erro ao configurar paciente:', error);
              toast({
                title: "Erro na configuração",
                description: "Não foi possível configurar os dados do paciente",
                variant: "destructive",
              });
            }
          }
        });

        // Configurar outros eventos do Memed
        MdSinapsePrescricao.event.add("prescription:saved", function (data: any) {
          toast({
            title: "Prescrição salva",
            description: "A prescrição foi salva com sucesso no Memed",
          });
        });

      } else {
        // Aguardar o carregamento do script
        setTimeout(initMemed, 200);
      }
    };

    initMemed();
  };

  const resetPrescription = () => {
    // Remover script do Memed
    const script = document.getElementById('memed-script');
    if (script) {
      script.remove();
    }

    // Mostrar formulário novamente
    const formContainer = document.getElementById('patient-form-container');
    if (formContainer) {
      formContainer.style.display = 'block';
    }

    setIsScriptLoaded(false);
    setShowPrescription(false);

    // Limpar container do Memed
    const memedContainer = document.getElementById('memed-prescription-area');
    if (memedContainer) {
      memedContainer.innerHTML = '';
    }
  };

  const openMemedInNewWindow = () => {
    const memedUrl = `https://prescricao.memed.com.br/?token=${encodeURIComponent(prescriptionToken)}`;
    window.open(memedUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    toast({
      title: "Memed aberto",
      description: "Sistema de prescrição aberto em nova janela",
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
                Sistema oficial de prescrições digitais com validade legal nacional
              </p>
            </div>
          </div>
          
          {showPrescription && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={openMemedInNewWindow}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir em Nova Janela
              </Button>
              <Button variant="outline" onClick={resetPrescription}>
                Nova Prescrição
              </Button>
            </div>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            O Memed é o sistema oficial de prescrições digitais aprovado pelo Conselho Federal de Medicina (CFM). 
            Suas prescrições terão validade legal em todo território brasileiro.
          </AlertDescription>
        </Alert>

        <div id="patient-form-container">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Configure os dados do paciente para gerar a prescrição digital
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

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={initializeMemedPrescription}
                  disabled={!prescriptionToken}
                  className="min-w-[200px]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Iniciar Prescrição Digital
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Container onde o módulo Memed será renderizado */}
        <div id="memed-prescription-area" className="w-full min-h-[600px]">
          {/* O módulo de prescrição do Memed aparecerá aqui */}
        </div>
      </div>
    </SidebarLayout>
  );
}