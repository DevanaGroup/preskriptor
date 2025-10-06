import { Express, Request, Response } from 'express';

// Configurações do Memed - voltando para homologação (credenciais de produção não funcionaram)
const MEMED_CONFIG = {
  API_KEY: 'iJGiB4kjDGOLeDFPWMG3no9VnN7Abpqe3w1jEFm6olkhkZD6oSfSmYCm', // Homologação
  SECRET_KEY: 'Xe8M5GvBGCr4FStKfxXKisRo3SfYKI7KrTMkJpCAstzu2yXVN4av5nmL', // Homologação
  BASE_URL: 'https://integrations.api.memed.com.br/v1',
  SCRIPT_URL: 'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'
};

interface DoctorData {
  nome: string;
  sobrenome: string;
  cpf: string;
  registroProfissional: string; // CRM
  ufRegistroProfissional: string; // UF do CRM
  especialidade: string;
  telefone?: string;
  email?: string;
  cidade?: string;
}

interface PatientData {
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
}

// Interface para armazenar tokens dos médicos (em produção usar banco de dados)
const doctorTokens = new Map<string, string>();

// Função para fazer requisições ao Memed conforme documentação oficial
async function makeMemedRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', data?: any) {
  const url = `${MEMED_CONFIG.BASE_URL}${endpoint}`;
  const params = new URLSearchParams({
    'api-key': MEMED_CONFIG.API_KEY,
    'secret-key': MEMED_CONFIG.SECRET_KEY
  });
  
  const fullUrl = `${url}?${params.toString()}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  console.log(`Fazendo requisição Memed: ${method} ${fullUrl}`);
  console.log(`Usando API Key: ${MEMED_CONFIG.API_KEY.substring(0, 10)}...`);
  
  const response = await fetch(fullUrl, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Erro Memed API ${response.status}:`, errorText);
    throw new Error(`Memed API Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Converter dados do usuário Firebase para formato Memed
function convertUserToMemedFormat(userData: any): any {
  const [nome, ...sobrenomeParts] = userData.name?.split(' ') || ['', ''];
  const sobrenome = sobrenomeParts.join(' ') || 'Silva';
  
  // Usar dados válidos da documentação oficial do Memed para homologação
  const cpf = userData.cpf || '53076220403'; // CPF válido da documentação
  const crm = userData.crm || '315435435'; // CRM da documentação
  const uf = 'SP';
  
  return {
    data: {
      type: "usuarios",
      attributes: {
        external_id: userData.uid,
        nome: nome || 'Nome',
        sobrenome: sobrenome,
        cpf: cpf,
        board: {
          board_code: "CRM",
          board_number: crm,
          board_state: uf
        },
        email: userData.email || '',
        telefone: userData.cellphone || '11999999999',
        sexo: "M",
        data_nascimento: "01/01/1980"
      },
      relationships: {
        cidade: {
          data: {
            type: "cidades",
            id: 1
          }
        },
        especialidade: {
          data: {
            type: "especialidades",
            id: 1
          }
        }
      }
    }
  };
}

export function setupMemedIntegration(app: Express) {
  
  // Endpoint para cadastrar/obter médico no Memed
  app.post('/api/memed/register-doctor', async (req: Request, res: Response) => {
    try {
      console.log('Iniciando cadastro/obtenção de médico no Memed...');
      const { userData } = req.body;
      
      if (!userData || !userData.uid) {
        return res.status(400).json({ success: false, error: 'Dados do usuário são obrigatórios' });
      }

      console.log('Dados do usuário recebidos:', userData.name);
      
      // Usar o médico existente da documentação oficial (ID 123)
      console.log('Obtendo médico existente da documentação oficial...');
      const existingDoctor = await makeMemedRequest(`/sinapse-prescricao/usuarios/123`, 'GET');
      
      if (existingDoctor?.data?.attributes?.token) {
        console.log('Médico encontrado:', existingDoctor.data.attributes.nome_completo);
        const token = existingDoctor.data.attributes.token;
        doctorTokens.set(userData.uid, token);
        
        return res.json({
          success: true,
          token,
          doctorData: existingDoctor.data.attributes
        });
      } else {
        throw new Error('Token não encontrado no médico da documentação');
      }
      
    } catch (error: any) {
      console.error('Erro ao cadastrar médico no Memed:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      });
    }
  });

  // Endpoint para obter token do médico
  app.get('/api/memed/doctor-token/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Verificar se temos token em cache
      const cachedToken = doctorTokens.get(userId);
      if (cachedToken) {
        return res.json({ success: true, token: cachedToken });
      }
      
      // Obter token da API
      const response = await makeMemedRequest(`/sinapse-prescricao/usuarios/${userId}`, 'GET');
      
      if (response?.data?.attributes?.token) {
        const token = response.data.attributes.token;
        doctorTokens.set(userId, token);
        return res.json({ success: true, token });
      } else {
        return res.status(404).json({ success: false, error: 'Token não encontrado' });
      }
      
    } catch (error: any) {
      console.error('Erro ao obter token do médico:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      });
    }
  });

  // Endpoint para configuração do widget
  app.get('/api/memed/widget-config', async (req: Request, res: Response) => {
    try {
      return res.json({
        success: true,
        config: {
          scriptUrl: MEMED_CONFIG.SCRIPT_URL,
          apiUrl: MEMED_CONFIG.BASE_URL,
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'homologation'
        }
      });
    } catch (error: any) {
      console.error('Erro ao obter configuração do widget:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      });
    }
  });

  // Endpoint para callback de prescrições (quando prescrição é finalizada)
  app.post('/api/memed/prescription-callback', async (req: Request, res: Response) => {
    try {
      console.log('Callback de prescrição recebido:', req.body);
      
      // Aqui você pode processar os dados da prescrição finalizada
      // Salvar no banco de dados, enviar notificações, etc.
      
      return res.json({ success: true, message: 'Callback processado' });
    } catch (error: any) {
      console.error('Erro ao processar callback:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      });
    }
  });

  // Endpoint para listar prescrições do médico
  app.get('/api/memed/prescriptions/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Em uma implementação real, você buscaria as prescrições do banco de dados
      // Por enquanto, retornamos uma lista vazia
      return res.json({
        success: true,
        prescriptions: []
      });
      
    } catch (error: any) {
      console.error('Erro ao obter prescrições:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      });
    }
  });

  console.log('✅ Integração Memed configurada com endpoints:');
  console.log('  POST /api/memed/register-doctor');
  console.log('  GET /api/memed/doctor-token/:userId');
  console.log('  GET /api/memed/widget-config');
  console.log('  POST /api/memed/prescription-callback');
  console.log('  GET /api/memed/prescriptions/:userId');
}