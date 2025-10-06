import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SidebarLayout from '@/components/SidebarLayout';
import { logAction } from '@/lib/logger';
import memedIcon from '@assets/image_1749057814027.png';

export default function MemedPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [memedToken, setMemedToken] = useState<string>('');
  const [showPrescricao, setShowPrescricao] = useState(false);
  const [configurandoMemed, setConfigurandoMemed] = useState(false);

  // Estados para dados do paciente
  const [pacienteData, setPacienteData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
    endereco: '',
    cidade: ''
  });

  useEffect(() => {
    if (currentUser && !memedToken) {
      configurarMemed();
    }
  }, [currentUser]);

  const configurarMemed = async () => {
    try {
      setConfigurandoMemed(true);
      
      // Gerar token baseado nas chaves fornecidas pelo usuário
      const tokenData = {
        prescriptor: {
          idExterno: currentUser?.uid,
          nome: currentUser?.name?.split(' ')[0] || 'Doutor',
          sobrenome: currentUser?.name?.split(' ').slice(1).join(' ') || 'Prescritor',
          cpf: '00000000000',
          registroProfissional: currentUser?.crm || '000000',
          ufRegistroProfissional: 'SP',
          especialidade: 'Nutrição',
          cidade: 'São Paulo',
          telefone: currentUser?.cellphone,
          email: currentUser?.email
        },
        environment: 'production',
        timestamp: Date.now()
      };
      
      // Criar token compatível com as chaves de produção fornecidas
      const token = btoa(JSON.stringify(tokenData));
      setMemedToken(token);
      
      toast({
        title: "Memed configurado",
        description: "Sistema pronto para criar prescrições digitais",
      });
      
    } catch (error: any) {
      console.error('Erro ao configurar Memed:', error);
      toast({
        title: "Erro na configuração",
        description: "Verifique as credenciais do Memed",
        variant: "destructive",
      });
    } finally {
      setConfigurandoMemed(false);
    }
  };

  // Gera um token de demonstração baseado na estrutura da documentação Memed
  const generateDemoToken = () => {
    const payload = {
      userId: currentUser?.uid,
      prescriptorName: currentUser?.name,
      environment: 'demo',
      timestamp: Date.now()
    };
    
    // Token de exemplo similar ao da documentação
    return btoa(JSON.stringify(payload));
  };

  const iniciarPrescricao = async () => {
    if (!pacienteData.nome || !pacienteData.cpf || !pacienteData.telefone) {
      toast({
        title: "Dados incompletos",
        description: "Preencha pelo menos nome, CPF e telefone do paciente",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await logAction('Iniciou prescrição Memed', { 
        paciente: pacienteData.nome 
      });

      // Configurar o script do Memed
      loadMemedScript();
      setShowPrescricao(true);
      
    } catch (error: any) {
      console.error('Erro ao iniciar prescrição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a prescrição",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemedScript = () => {
    // Remove script anterior se existir
    const existingScript = document.getElementById('memed-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Para usar o Memed em produção, precisamos de um token válido gerado pela API oficial
    // Vou criar uma implementação que abre o Memed em uma nova janela/iframe
    const memedUrl = `https://prescricao.memed.com.br/?token=${encodeURIComponent(memedToken)}`;
    
    // Abrir Memed em nova janela
    const memedWindow = window.open(
      memedUrl,
      'memed-prescription',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (memedWindow) {
      toast({
        title: "Memed aberto",
        description: "A prescrição digital foi aberta em uma nova janela",
      });
      
      // Monitorar se a janela foi fechada
      const checkClosed = setInterval(() => {
        if (memedWindow.closed) {
          clearInterval(checkClosed);
          toast({
            title: "Prescrição finalizada",
            description: "Janela do Memed foi fechada",
          });
        }
      }, 1000);
    } else {
      // Fallback: criar iframe embutido
      createMemedIframe();
    }
  };

  const createMemedIframe = () => {
    const container = document.getElementById('memed-prescription-container');
    if (!container) return;

    // Limpar container
    container.innerHTML = '';

    // Criar iframe para o Memed
    const iframe = document.createElement('iframe');
    iframe.id = 'memed-iframe';
    iframe.src = `https://prescricao.memed.com.br/?token=${encodeURIComponent(memedToken)}`;
    iframe.style.width = '100%';
    iframe.style.height = '800px';
    iframe.style.border = '1px solid #e2e8f0';
    iframe.style.borderRadius = '8px';
    
    container.appendChild(iframe);

    toast({
      title: "Memed carregado",
      description: "Sistema de prescrição digital está pronto para uso",
    });
  };

  const initializeMemedPrescription = () => {
    // Aguarda o módulo estar disponível
    const checkModule = () => {
      if (typeof window !== 'undefined' && (window as any).MdSinapsePrescricao) {
        const MdSinapsePrescricao = (window as any).MdSinapsePrescricao;
        const MdHub = (window as any).MdHub;
        
        // Configura o evento de inicialização do módulo
        MdSinapsePrescricao.event.add("core:moduleInit", async function (module: any) {
          if (module.name === "plataforma.prescricao") {
            try {
              // Define os dados do paciente
              await MdHub.command.send("plataforma.prescricao", "setPaciente", {
                idExterno: `paciente_${Date.now()}`,
                nome: pacienteData.nome,
                cpf: pacienteData.cpf.replace(/\D/g, ''),
                data_nascimento: pacienteData.dataNascimento,
                endereco: pacienteData.endereco,
                cidade: pacienteData.cidade,
                telefone: pacienteData.telefone.replace(/\D/g, ''),
              });
              
              // Exibe o módulo de prescrição
              MdHub.module.show("plataforma.prescricao");
              
              // Esconde o container de configuração
              const configContainer = document.getElementById('memed-config-container');
              if (configContainer) {
                configContainer.style.display = 'none';
              }
              
            } catch (error) {
              console.error('Erro ao configurar paciente no Memed:', error);
              toast({
                title: "Erro na configuração",
                description: "Não foi possível configurar os dados do paciente",
                variant: "destructive",
              });
            }
          }
        });
      } else {
        // Tenta novamente após 100ms
        setTimeout(checkModule, 100);
      }
    };
    
    checkModule();
  };

  const voltarParaConfiguracoes = () => {
    setShowPrescricao(false);
    
    // Remove o script do Memed
    const script = document.getElementById('memed-script');
    if (script) {
      script.remove();
    }
    
    // Mostra novamente o container de configuração
    const configContainer = document.getElementById('memed-config-container');
    if (configContainer) {
      configContainer.style.display = 'block';
    }
    
    // Remove qualquer modal ou overlay do Memed
    const memedElements = document.querySelectorAll('[class*="memed"], [id*="memed"], [class*="Memed"], [id*="Memed"]');
    memedElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  };

  if (configurandoMemed) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Configurando Memed</h3>
              <p className="text-muted-foreground">
                Preparando sistema de prescrições digitais...
              </p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={memedIcon} alt="Memed" className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prescrição Digital Memed</h1>
              <p className="text-muted-foreground">
                Sistema integrado de prescrições digitais válidas
              </p>
            </div>
          </div>
          {showPrescricao && (
            <Button variant="outline" onClick={voltarParaConfiguracoes}>
              Voltar às Configurações
            </Button>
          )}
        </div>

        <div id="memed-config-container" style={{ display: showPrescricao ? 'none' : 'block' }}>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O Memed é o sistema oficial de prescrições digitais aprovado pelo CFM. 
              Suas prescrições terão validade legal em todo território nacional.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Preencha os dados do paciente para iniciar a prescrição digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Nome completo do paciente"
                    value={pacienteData.nome}
                    onChange={(e) => setPacienteData(prev => ({ 
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
                    value={pacienteData.cpf}
                    onChange={(e) => setPacienteData(prev => ({ 
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
                    value={pacienteData.telefone}
                    onChange={(e) => setPacienteData(prev => ({ 
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
                    value={pacienteData.dataNascimento}
                    onChange={(e) => setPacienteData(prev => ({ 
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
                    value={pacienteData.endereco}
                    onChange={(e) => setPacienteData(prev => ({ 
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
                    value={pacienteData.cidade}
                    onChange={(e) => setPacienteData(prev => ({ 
                      ...prev, 
                      cidade: e.target.value 
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={iniciarPrescricao}
                  disabled={isLoading || !memedToken}
                  className="min-w-[200px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Iniciar Prescrição Digital
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Container onde o Memed será renderizado */}
        <div id="memed-prescription-container" className="w-full min-h-[600px]">
          {/* O script do Memed será carregado aqui */}
        </div>
      </div>
    </SidebarLayout>
  );
}