import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface MemedWidgetProps {
  patientData?: {
    nome: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    dataNascimento?: string;
    idExterno?: string;
  };
  onPrescriptionComplete?: (prescriptionData: any) => void;
}

// Extend Window interface para tipos Memed
declare global {
  interface Window {
    MdSinapsePrescricao: any;
    MdHub: any;
  }
}

export const MemedWidget: React.FC<MemedWidgetProps> = ({ 
  patientData, 
  onPrescriptionComplete 
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorToken, setDoctorToken] = useState<string | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  // Registrar médico e obter token
  const registerDoctor = async () => {
    if (!currentUser) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      console.log('Cadastrando médico no Memed...');
      
      const response = await fetch('/api/memed/register-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.name,
            email: currentUser.email,
            cellphone: currentUser.cellphone,
            crm: currentUser.crm
          }
        }),
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        console.log('Médico cadastrado com sucesso, token obtido');
        setDoctorToken(data.token);
        return data.token;
      } else {
        throw new Error(data.error || 'Erro ao cadastrar médico');
      }
    } catch (error: any) {
      console.error('Erro ao registrar médico:', error);
      setError(`Erro ao registrar médico: ${error.message}`);
      return null;
    }
  };

  // Carregar script do Memed
  const loadMemedScript = async (token: string) => {
    if (scriptLoadedRef.current) return;

    try {
      // Obter configuração do widget
      const configResponse = await fetch('/api/memed/widget-config');
      const configData = await configResponse.json();
      
      if (!configData.success) {
        throw new Error('Erro ao obter configuração do widget');
      }

      const scriptUrl = configData.config.scriptUrl;
      console.log('Carregando script Memed:', scriptUrl);

      // Interceptar erros OAuth do Google antes de carregar o script
      const originalError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        if (typeof message === 'string' && 
            (message.includes('redirect_uri_mismatch') || 
             message.includes('oauth') || 
             message.includes('google'))) {
          console.warn('Erro OAuth detectado e ignorado:', message);
          return true; // Previne que o erro seja mostrado no console
        }
        if (originalError) {
          return originalError(message, source, lineno, colno, error);
        }
        return false;
      };

      // Remover script anterior se existir
      const existingScript = document.querySelector('script[data-memed-widget]');
      if (existingScript) {
        existingScript.remove();
      }

      // Criar e carregar novo script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = scriptUrl;
      script.setAttribute('data-token', token);
      script.setAttribute('data-memed-widget', 'true');
      
      script.onload = () => {
        console.log('Script Memed carregado');
        scriptLoadedRef.current = true;
        setupMemedEvents();
      };
      
      script.onerror = () => {
        console.error('Erro ao carregar script Memed');
        setError('Erro ao carregar widget Memed');
        setIsLoading(false);
      };

      document.head.appendChild(script);
      
    } catch (error: any) {
      console.error('Erro ao carregar script:', error);
      setError(`Erro ao carregar widget: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Configurar eventos do Memed
  const setupMemedEvents = () => {
    if (!window.MdSinapsePrescricao) {
      console.error('MdSinapsePrescricao não está disponível');
      setError('Widget Memed não carregou corretamente');
      setIsLoading(false);
      return;
    }

    console.log('Configurando eventos Memed...');

    // Evento de inicialização do módulo
    window.MdSinapsePrescricao.event.add("core:moduleInit", async (module: any) => {
      console.log('Módulo inicializado:', module.name);
      
      if (module.name === "plataforma.prescricao") {
        try {
          console.log('Módulo de prescrição carregado');
          
          // Configurar widget para evitar OAuth do Google
          if (window.MdHub) {
            try {
              // Desabilitar login automático com Google se disponível
              await window.MdHub.command.send("plataforma.prescricao", "setConfig", {
                disableGoogleAuth: true,
                skipOAuth: true
              });
            } catch (configError) {
              console.log('Configuração OAuth não aplicável nesta versão');
            }
          }
          
          // Definir dados do paciente se fornecidos
          if (patientData && window.MdHub) {
            console.log('Definindo dados do paciente:', patientData.nome);
            
            await window.MdHub.command.send("plataforma.prescricao", "setPaciente", {
              idExterno: patientData.idExterno || `paciente_${Date.now()}`,
              nome: patientData.nome,
              cpf: patientData.cpf || undefined,
              data_nascimento: patientData.dataNascimento || undefined,
              telefone: patientData.telefone || '11999999999',
              withoutCpf: !patientData.cpf // Se não tem CPF, marcar como true
            });
          }
          
          // Mostrar o widget
          if (window.MdHub) {
            console.log('Exibindo widget Memed');
            window.MdHub.module.show("plataforma.prescricao");
          }
          
          setIsLoading(false);
          
        } catch (error) {
          console.error('Erro ao configurar paciente:', error);
          setError('Erro ao configurar dados do paciente');
          setIsLoading(false);
        }
      }
    });

    // Evento de prescrição finalizada
    window.MdSinapsePrescricao.event.add("prescricao:finalizada", (prescriptionData: any) => {
      console.log('Prescrição finalizada:', prescriptionData);
      
      if (onPrescriptionComplete) {
        onPrescriptionComplete(prescriptionData);
      }
      
      // Enviar callback para o backend
      fetch('/api/memed/prescription-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionData,
          userId: currentUser?.uid,
          timestamp: new Date().toISOString()
        }),
      }).catch(error => {
        console.error('Erro ao enviar callback:', error);
      });
    });

    // Outros eventos úteis
    window.MdSinapsePrescricao.event.add("prescricao:salva", (data: any) => {
      console.log('Prescrição salva:', data);
    });

    window.MdSinapsePrescricao.event.add("error", (error: any) => {
      console.error('Erro no widget Memed:', error);
      
      // Verificar se é erro OAuth do Google e ignorar
      const errorMessage = error?.message || error?.detail || String(error);
      if (errorMessage.includes('redirect_uri_mismatch') || 
          errorMessage.includes('oauth') || 
          errorMessage.includes('google')) {
        console.warn('Erro OAuth do Google ignorado - widget continua funcionando');
        return;
      }
      
      setError('Erro no widget de prescrição');
    });

    // Interceptar erros globais relacionados ao OAuth do Google
    window.addEventListener('error', (event) => {
      if (event.message && 
          (event.message.includes('redirect_uri_mismatch') || 
           event.message.includes('oauth') ||
           event.message.includes('google'))) {
        console.warn('Erro OAuth global detectado e ignorado');
        event.preventDefault();
        event.stopPropagation();
      }
    });
  };

  // Inicializar widget
  useEffect(() => {
    const initializeWidget = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Primeiro registrar o médico e obter token
        const token = await registerDoctor();
        if (!token) return;
        
        // Então carregar o script com o token
        await loadMemedScript(token);
        
      } catch (error: any) {
        console.error('Erro ao inicializar widget:', error);
        setError(`Erro ao inicializar: ${error.message}`);
        setIsLoading(false);
      }
    };

    if (currentUser) {
      initializeWidget();
    }

    // Cleanup
    return () => {
      if (scriptLoadedRef.current) {
        const script = document.querySelector('script[data-memed-widget]');
        if (script) {
          script.remove();
        }
        scriptLoadedRef.current = false;
      }
    };
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Usuário não autenticado</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando widget Memed...</p>
          <p className="text-sm text-gray-500 mt-2">Aguarde enquanto configuramos a prescrição digital</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[600px]">
      <div 
        ref={widgetContainerRef}
        id="memed-widget-container"
        className="w-full h-full"
      >
        {/* O widget Memed será renderizado aqui automaticamente */}
      </div>
    </div>
  );
};