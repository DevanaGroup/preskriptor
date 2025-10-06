import multer from 'multer';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

// Configurações do Document AI
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'preskriptor-e8a69';
const DOCUMENT_AI_LOCATION = 'us';
const PROCESSOR_ID = process.env.DOCUMENT_AI_PROCESSOR_ID;

// Configurar Google Document AI com autenticação
let documentAIClient: DocumentProcessorServiceClient;

// Inicializar cliente com credenciais
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    documentAIClient = new DocumentProcessorServiceClient({
      credentials,
      projectId: credentials.project_id || GOOGLE_PROJECT_ID,
    });
    console.log('✅ Google Document AI configurado com chave de serviço');
  } else {
    documentAIClient = new DocumentProcessorServiceClient();
    console.log('⚠️ Google Document AI usando credenciais padrão');
  }
} catch (error) {
  console.error('❌ Erro ao configurar Google Document AI:', error);
  documentAIClient = new DocumentProcessorServiceClient();
}

// Configurar multer para upload de arquivos
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

export interface OCRResult {
  text: string;
  confidence: number;
  fileName: string;
  fileType: string;
}

// Função rápida com Google Document AI
export async function extractTextWithDocumentAI(fileBuffer: Buffer, mimeType: string): Promise<string> {
  console.log('🔧 DEBUG Document AI - Iniciando...');
  console.log('🔧 PROCESSOR_ID:', PROCESSOR_ID ? 'Configurado' : 'NÃO CONFIGURADO');
  console.log('🔧 GOOGLE_PROJECT_ID:', GOOGLE_PROJECT_ID);
  console.log('🔧 DOCUMENT_AI_LOCATION:', DOCUMENT_AI_LOCATION);
  console.log('🔧 File mime type:', mimeType);
  console.log('🔧 File size:', fileBuffer.length, 'bytes');
  console.log('🔧 Service Account configurado:', !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  // Verificar se as credenciais são válidas e usar o project ID correto
  let actualProjectId = GOOGLE_PROJECT_ID;
  let credentials;
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
    console.log('🔧 Project ID da chave:', credentials.project_id);
    console.log('🔧 Client email:', credentials.client_email);
    
    // Usar o project ID da chave de serviço (mais confiável)
    if (credentials.project_id) {
      actualProjectId = credentials.project_id;
      console.log('✅ Usando Project ID da chave:', actualProjectId);
    } else {
      console.log('⚠️ Usando Project ID hardcoded:', actualProjectId);
    }
  } catch (e) {
    console.log('❌ Erro ao parsear service account key');
  }
  
  try {
    if (!PROCESSOR_ID) {
      console.log('❌ Document AI não configurado - PROCESSOR_ID ausente');
      throw new Error('PROCESSOR_ID não configurado');
    }

    const name = `projects/${actualProjectId}/locations/${DOCUMENT_AI_LOCATION}/processors/${PROCESSOR_ID}`;
    console.log('🔧 Processor name construído:', name);
    
    const request = {
      name,
      rawDocument: {
        content: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
      // Ativar imageless mode para processar até 30 páginas
      imagelessMode: true,
      processOptions: {
        ocrConfig: {
          enableImageQualityScores: false,
          enableSymbol: false,
          enableNativePdfParsing: true,
        },
      },
    };

    console.log('🚀 Enviando para Google Document AI...');
    const startTime = Date.now();
    
    const [result] = await documentAIClient.processDocument(request);
    
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Document AI processou em ${processingTime}ms`);
    
    const document = result.document;
    if (!document?.text) {
      throw new Error('Document AI retornou documento vazio');
    }

    console.log('✅ Document AI extraiu', document.text.length, 'caracteres');
    return document.text;
  } catch (error: any) {
    console.error('❌ Document AI falhou completamente:');
    console.error('Erro tipo:', error.constructor.name);
    console.error('Erro message:', error.message);
    console.error('Erro code:', error.code);
    console.error('Erro details:', error.details);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Função para processar arquivo - APENAS Google Document AI
export async function processFileWithOCR(file: Express.Multer.File): Promise<OCRResult> {
  console.log(`🚀 Processando ${file.originalname} com Document AI (${file.size} bytes)`);
  
  const extractedText = await extractTextWithDocumentAI(file.buffer, file.mimetype);
  
  console.log(`✅ Document AI concluído: ${extractedText.length} caracteres`);
  
  return {
    text: extractedText,
    confidence: 0.95,
    fileName: file.originalname,
    fileType: file.mimetype
  };
}

// Função para validar se as credenciais da OpenAI estão configuradas
export function validateOpenAICredentials(): boolean {
  return !!process.env.OPENAI_API_KEY;
}