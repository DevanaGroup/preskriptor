// Configurações da Memed (ambiente de homologação)
export const MEMED_CONFIG = {
  // URLs de homologação
  API_URL: 'https://integrations.api.memed.com.br/v1',
  SCRIPT_URL: 'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js',
  
  // Chaves de homologação (fixas conforme documentação)
  API_KEY: 'iJGiB4kjDGOLeDFPWMG3no9VnN7Abpqe3w1jEFm6olkhkZD6oSfSmYCm',
  SECRET_KEY: 'Xe8M5GvBGCr4FStKfxXKisRo3SfYKI7KrTMkJpCAstzu2yXVN4av5nmL'
};

// Interface para dados do prescritor
export interface MemedPrescritor {
  idExterno: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  registroProfissional: string;
  ufRegistroProfissional: string;
  especialidade: string;
  cidade: string;
  telefone?: string;
  email?: string;
}

// Interface para dados do paciente
export interface MemedPaciente {
  idExterno: string;
  nome: string;
  cpf?: string;
  withoutCpf?: boolean;
  data_nascimento?: string;
  nome_social?: string;
  endereco?: string;
  cidade?: string;
  telefone: string;
  peso?: number;
  altura?: number;
  nome_mae?: string;
  dificuldade_locomocao?: boolean;
}

// Interface para resposta da API
export interface MemedTokenResponse {
  token: string;
  expires_in: number;
}

// Classe para gerenciar integração com Memed
export class MemedService {
  private baseUrl: string;
  private apiKey: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = MEMED_CONFIG.API_URL;
    this.apiKey = MEMED_CONFIG.API_KEY;
    this.secretKey = MEMED_CONFIG.SECRET_KEY;
  }

  /**
   * Configura prescritor via backend (novo método seguro)
   */
  async configurarPrescritor(userData: any): Promise<MemedTokenResponse> {
    try {
      const response = await fetch('/api/memed/configure-prescritor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao configurar prescritor: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        token: data.token,
        expires_in: data.expires_in
      };
    } catch (error) {
      console.error('Erro na integração com Memed:', error);
      throw error;
    }
  }

  /**
   * Carrega o script da Memed dinamicamente
   */
  loadMemedScript(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se o script já foi carregado
      const existingScript = document.querySelector(`script[src="${MEMED_CONFIG.SCRIPT_URL}"]`);
      if (existingScript) {
        console.log('Script da Memed já carregado');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = MEMED_CONFIG.SCRIPT_URL;
      script.setAttribute('data-token', token);
      
      script.onload = () => {
        console.log('Script da Memed carregado com sucesso');
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Erro ao carregar script da Memed'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Inicializa o módulo de prescrição da Memed
   */
  initializeMemedModule(paciente?: MemedPaciente): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se o objeto MdSinapsePrescricao está disponível
      if (typeof (window as any).MdSinapsePrescricao === 'undefined') {
        reject(new Error('Script da Memed não foi carregado corretamente'));
        return;
      }

      const MdSinapsePrescricao = (window as any).MdSinapsePrescricao;
      const MdHub = (window as any).MdHub;

      // Adicionar listener para quando o módulo estiver pronto
      MdSinapsePrescricao.event.add("core:moduleInit", async (module: any) => {
        if (module.name === "plataforma.prescricao") {
          try {
            // Se há dados do paciente, configurá-los
            if (paciente) {
              await MdHub.command.send("plataforma.prescricao", "setPaciente", paciente);
            }
            
            // Mostrar o módulo de prescrição
            MdHub.module.show("plataforma.prescricao");
            
            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  /**
   * Converte dados do usuário do Firebase para formato Memed
   */
  static converterUsuarioParaPrescritor(usuario: any): MemedPrescritor {
    return {
      idExterno: usuario.uid,
      nome: usuario.name?.split(' ')[0] || 'Nome',
      sobrenome: usuario.name?.split(' ').slice(1).join(' ') || 'Sobrenome',
      cpf: usuario.cpf || '00000000000', // CPF será necessário para produção
      registroProfissional: usuario.crm || '000000',
      ufRegistroProfissional: usuario.ufCrm || 'SP',
      especialidade: usuario.especialidade || 'Nutrição',
      cidade: usuario.cidade || 'São Paulo',
      telefone: usuario.cellphone,
      email: usuario.email
    };
  }

  /**
   * Converte dados do paciente do Firebase para formato Memed
   */
  static converterPacienteParaMemed(paciente: any): MemedPaciente {
    return {
      idExterno: paciente.id,
      nome: paciente.name,
      cpf: paciente.cpf,
      withoutCpf: !paciente.cpf,
      data_nascimento: paciente.dataNascimento,
      telefone: paciente.cellphone,
      endereco: paciente.endereco,
      cidade: paciente.cidade,
      peso: paciente.peso,
      altura: paciente.altura,
      nome_mae: paciente.nomeMae
    };
  }
}

export const memedService = new MemedService();