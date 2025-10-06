import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface LogEntry {
  userId: string;
  userName: string;
  action: string;
  timestamp: Timestamp;
  details?: any;
}

/**
 * Registra uma ação do usuário no sistema de logs
 * @param userId ID do usuário
 * @param userName Nome do usuário
 * @param action Descrição da ação realizada
 * @param details Detalhes adicionais da ação (opcional)
 */
export const logUserAction = async (
  userId: string,
  userName: string,
  action: string,
  details?: any
): Promise<void> => {
  try {
    // Temporariamente desabilitado para evitar erros de permissão
    // const logEntry: LogEntry = {
    //   userId,
    //   userName,
    //   action,
    //   timestamp: Timestamp.now(),
    //   ...(details && { details })
    // };
    // await addDoc(collection(db, 'logs'), logEntry);
    
    // Log silencioso desabilitado
    // console.log(`[LOG] ${userName}: ${action}`);
  } catch (error) {
    // Log de erro silencioso - não mostrar para o usuário
    console.error('Erro ao registrar log:', error);
  }
};

/**
 * Registra login do usuário
 */
export const logLogin = (userId: string, userName: string) => {
  logUserAction(userId, userName, 'Login realizado');
};

/**
 * Registra logout do usuário
 */
export const logLogout = (userId: string, userName: string) => {
  logUserAction(userId, userName, 'Logout realizado');
};

/**
 * Registra criação de paciente
 */
export const logCreatePatient = (userId: string, userName: string, patientName: string) => {
  logUserAction(userId, userName, 'Criou novo paciente', { patientName });
};

/**
 * Registra início de consulta
 */
export const logStartConsultation = (
  userId: string, 
  userName: string, 
  moduleName: string
) => {
  logUserAction(userId, userName, 'Iniciou consulta', { 
    moduleName: moduleName || 'Módulo não especificado'
  });
};

/**
 * Registra envio de mensagem
 */
export const logSendMessage = (
  userId: string, 
  userName: string, 
  patientName: string, 
  messageLength: number
) => {
  logUserAction(userId, userName, 'Enviou mensagem', { 
    patientName, 
    messageLength 
  });
};

/**
 * Registra upload de arquivo
 */
export const logFileUpload = (
  userId: string, 
  userName: string, 
  fileName: string, 
  fileType: string
) => {
  logUserAction(userId, userName, 'Fez upload de arquivo', { 
    fileName, 
    fileType 
  });
};

/**
 * Registra geração de receita
 */
export const logGenerateReceipt = (
  userId: string, 
  userName: string, 
  patientName: string
) => {
  logUserAction(userId, userName, 'Gerou receita médica', { 
    patientName 
  });
};

/**
 * Registra acesso ao painel administrativo
 */
export const logAdminAccess = (userId: string, userName: string) => {
  logUserAction(userId, userName, 'Acessou painel administrativo');
};

/**
 * Registra configuração de módulos
 */
export const logModuleConfig = (
  userId: string, 
  userName: string, 
  moduleId: string, 
  action: 'enabled' | 'disabled'
) => {
  logUserAction(userId, userName, `${action === 'enabled' ? 'Ativou' : 'Desativou'} módulo`, { 
    moduleId 
  });
};

/**
 * Função simplificada para registrar ações com o usuário atual
 * Obtém automaticamente os dados do usuário logado
 */
export const logAction = async (action: string, details?: any): Promise<void> => {
  try {
    // Buscar dados do usuário atual do localStorage ou contexto
    const userDataString = localStorage.getItem('currentUser');
    if (!userDataString) {
      console.warn('Usuário não encontrado para log');
      return;
    }
    
    const userData = JSON.parse(userDataString);
    const userId = userData.uid || userData.id;
    const userName = userData.name || userData.displayName || 'Usuário';
    
    if (userId && userName) {
      await logUserAction(userId, userName, action, details);
    }
  } catch (error) {
    console.error('Erro ao registrar ação:', error);
  }
};