import CryptoJS from 'crypto-js';

// Classe para gerenciar criptografia de dados sensíveis
class EncryptionService {
  private secretKey: string;

  constructor() {
    // Em produção, esta chave deve vir de uma fonte segura (variável de ambiente, key management service)
    this.secretKey = this.getOrCreateSecretKey();
  }

  private getOrCreateSecretKey(): string {
    // Verificar se há uma chave no ambiente
    const envKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (envKey) {
      return envKey;
    }

    // Para desenvolvimento, gerar uma chave baseada no projeto
    // Em produção, isso deve ser substituído por uma chave segura
    const projectKey = 'preskriptor-2025-secure-key-v1';
    return CryptoJS.SHA256(projectKey).toString();
  }

  // Criptografar um valor
  encrypt(value: string | null | undefined): string {
    if (!value || value === '') {
      return '';
    }
    
    try {
      const encrypted = CryptoJS.AES.encrypt(value, this.secretKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      return value; // Em caso de erro, retorna o valor original
    }
  }

  // Descriptografar um valor
  decrypt(encryptedValue: string | null | undefined): string {
    if (!encryptedValue || encryptedValue === '') {
      return '';
    }

    try {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey);
      const decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);
      return decrypted || encryptedValue; // Se falhar, retorna o valor original
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      return encryptedValue; // Em caso de erro, retorna o valor criptografado
    }
  }

  // Verificar se um valor está criptografado (heurística simples)
  isEncrypted(value: string): boolean {
    if (!value || value.length < 10) return false;
    
    // Valores criptografados com AES geralmente têm caracteres específicos
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(value) && value.length > 20;
  }

  // Criptografar um objeto seletivamente
  encryptObject<T extends Record<string, any>>(obj: T, fieldsToEncrypt: (keyof T)[]): T {
    const encrypted = { ...obj };
    
    fieldsToEncrypt.forEach(field => {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.encrypt(encrypted[field] as string) as T[keyof T];
      }
    });

    return encrypted;
  }

  // Descriptografar um objeto seletivamente
  decryptObject<T extends Record<string, any>>(obj: T, fieldsToDecrypt: (keyof T)[]): T {
    const decrypted = { ...obj };
    
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        decrypted[field] = this.decrypt(decrypted[field] as string) as T[keyof T];
      }
    });

    return decrypted;
  }

  // Gerar hash para busca (para campos que precisam ser pesquisáveis)
  generateSearchHash(value: string): string {
    if (!value) return '';
    return CryptoJS.SHA256(value.toLowerCase().trim()).toString().substring(0, 16);
  }
}

// Instância singleton do serviço de criptografia
const encryptionService = new EncryptionService();

// Função auxiliar para criptografar dados de paciente
export function encryptPatientData(patient: any): any {
  const encrypted = encryptionService.encryptObject(patient, ['name', 'cellphone', 'email']);
  // Adicionar hash para busca pelo nome
  if (patient.name) {
    encrypted.nameHash = encryptionService.generateSearchHash(patient.name);
  }
  return encrypted;
}

// Função auxiliar para descriptografar dados de paciente
export function decryptPatientData(encryptedPatient: any): any {
  return encryptionService.decryptObject(encryptedPatient, ['name', 'cellphone', 'email']);
}

// Função auxiliar para criptografar dados de usuário
export function encryptUserData(user: any): any {
  const encrypted = encryptionService.encryptObject(user, ['name', 'email', 'cellphone']);
  // Adicionar hash para busca pelo nome
  if (user.name) {
    encrypted.nameHash = encryptionService.generateSearchHash(user.name);
  }
  return encrypted;
}

// Função auxiliar para descriptografar dados de usuário
export function decryptUserData(encryptedUser: any): any {
  return encryptionService.decryptObject(encryptedUser, ['name', 'email', 'cellphone']);
}

// Função auxiliar para criptografar dados de receita
export function encryptReceitaData(receita: any): any {
  return encryptionService.encryptObject(receita, ['patientName', 'content']);
}

// Função auxiliar para descriptografar dados de receita
export function decryptReceitaData(encryptedReceita: any): any {
  return encryptionService.decryptObject(encryptedReceita, ['patientName', 'content']);
}

// Função auxiliar para criptografar dados de consulta
export function encryptConsultationData(consultation: any): any {
  const encrypted = { ...consultation };
  
  // Criptografar mensagens individuais
  if (encrypted.messages && Array.isArray(encrypted.messages)) {
    encrypted.messages = encrypted.messages.map((message: any) => ({
      ...message,
      content: encryptionService.encrypt(message.content)
    }));
  }
  
  // Criptografar outros campos sensíveis
  return encryptionService.encryptObject(encrypted, ['patientName', 'summary']);
}

// Função auxiliar para descriptografar dados de consulta
export function decryptConsultationData(encryptedConsultation: any): any {
  const decrypted = { ...encryptedConsultation };
  
  // Descriptografar mensagens individuais
  if (decrypted.messages && Array.isArray(decrypted.messages)) {
    decrypted.messages = decrypted.messages.map((message: any) => ({
      ...message,
      content: encryptionService.decrypt(message.content)
    }));
  }
  
  // Descriptografar outros campos sensíveis
  return encryptionService.decryptObject(decrypted, ['patientName', 'summary']);
}

// Função auxiliar para criptografar dados de transação
export function encryptTransactionData(transaction: any): any {
  return encryptionService.encryptObject(transaction, ['patientName', 'description']);
}

// Função auxiliar para descriptografar dados de transação
export function decryptTransactionData(encryptedTransaction: any): any {
  return encryptionService.decryptObject(encryptedTransaction, ['patientName', 'description']);
}

export { encryptionService };