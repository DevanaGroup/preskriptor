import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupOpenAIRoutes } from "./openai-api";
import { setupStripeRoutes } from "./stripe-api";
import { setupMemedIntegration } from "./memed-integration";
import { setupAudioRoutes, validateAudioEnvironment } from "./audio-service";
import { sendContactEmail } from "./mail-service";
import { memedBackendService, MemedBackendService } from "./memed-service";
import { upload, processFileWithOCR } from "./ocr-service";
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { db } from './firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';


export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar rotas da API OpenAI
  setupOpenAIRoutes(app);
  
  // Configurar rotas da API Stripe
  setupStripeRoutes(app);
  
  // Configurar rotas da integração Memed
  setupMemedIntegration(app);
  
  // Configurar rotas de áudio
  setupAudioRoutes(app);
  
  // Validar configuração de áudio
  validateAudioEnvironment();
  
  // Storage temporário em memória para feedbacks
  const feedbackStorage: Array<{
    id: string;
    type: string;
    feedbackText: string;
    messageContent: string;
    userInfo: any;
    timestamp: string;
    status: string;
  }> = [];

  // Rotas de feedback (admin)
  app.post('/api/feedback', async (req, res) => {
    try {
      console.log('🔥 Recebendo feedback via API:', req.body);
      
      const { type, feedbackText, messageContent, userInfo, timestamp, status } = req.body;

      if (!feedbackText || !messageContent || !userInfo) {
        console.error('❌ Dados obrigatórios ausentes:', { feedbackText, messageContent, userInfo });
        return res.status(400).json({ 
          error: 'Dados obrigatórios não fornecidos' 
        });
      }

      // Gerar ID único
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const feedbackData = {
        id: feedbackId,
        type,
        feedbackText,
        messageContent,
        userInfo,
        timestamp,
        status: status || 'novo'
      };

      // Salvar em memória (funciona imediatamente)
      feedbackStorage.push(feedbackData);
      
      console.log('✅ Feedback salvo em memória com ID:', feedbackId);
      console.log('📊 Total de feedbacks:', feedbackStorage.length);

      res.status(200).json({ 
        message: 'Feedback enviado com sucesso',
        id: feedbackId 
      });

    } catch (error) {
      console.error('❌ ERRO COMPLETO ao salvar feedback:', error);
      console.error('❌ Stack trace:', (error as Error).stack);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: (error as Error).message 
      });
    }
  });

  app.get('/api/admin/feedback', async (req, res) => {
    try {
      // Retornar feedbacks do storage em memória, ordenados por timestamp
      const sortedFeedbacks = feedbackStorage.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log('📋 Buscando feedbacks - Total encontrados:', sortedFeedbacks.length);

      res.status(200).json(sortedFeedbacks);

    } catch (error) {
      console.error('❌ Erro ao buscar feedbacks:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar feedbacks' 
      });
    }
  });

  app.patch('/api/admin/feedback/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['novo', 'analisando', 'concluido'].includes(status)) {
        return res.status(400).json({ 
          error: 'Status inválido' 
        });
      }

      // Encontrar e atualizar feedback na memória
      const feedbackIndex = feedbackStorage.findIndex(f => f.id === id);
      
      if (feedbackIndex === -1) {
        return res.status(404).json({ 
          error: 'Feedback não encontrado' 
        });
      }

      feedbackStorage[feedbackIndex].status = status;
      
      console.log('📝 Status do feedback atualizado:', id, '→', status);

      res.status(200).json({ 
        message: 'Status atualizado com sucesso' 
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar feedback:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar feedback' 
      });
    }
  });

  // Endpoint para verificar se CRM já existe (usado durante cadastro)
  app.post('/api/check-crm-exists', async (req, res) => {
    try {
      const { crm } = req.body;
      
      if (!crm || crm.trim() === '') {
        return res.json({ exists: false });
      }
      
      console.log('🔍 Verificando existência do CRM:', crm);
      
      // Importar funções do Firebase
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      // Fazer consulta no Firestore
      const usersRef = collection(db, 'users');
      const crmQuery = query(usersRef, where('crm', '==', crm.trim()));
      const querySnapshot = await getDocs(crmQuery);
      
      const exists = !querySnapshot.empty;
      
      // Log detalhado
      if (exists) {
        console.log('❌❌❌ CRM', crm, 'JÁ EXISTE NO BANCO! ❌❌❌');
        querySnapshot.forEach(doc => {
          console.log('📄 Documento encontrado:', doc.id, doc.data());
        });
      } else {
        console.log('✅ CRM', crm, 'está disponível');
      }
      
      res.json({ exists });
      
    } catch (error) {
      console.error('❌ Erro ao verificar CRM:', error);
      // EM CASO DE ERRO, RETORNAR TRUE PARA FORÇAR BLOQUEIO POR SEGURANÇA
      res.json({ exists: true, error: 'Erro na verificação' });
    }
  });

  // Endpoint de teste para simular atualização de assinatura
  app.post('/api/test-subscription-update', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      // Simular atualização para plano PRO
      const subscriptionData = {
        subscriptionPlan: 'pro',
        creditsLimit: 100,
        creditsUsed: 0,
        hasActiveSubscription: true,
        stripeCustomerId: 'test_customer_id',
        stripeSubscriptionId: 'test_subscription_id',
        subscriptionUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🧪 Teste: Atualizando dados de assinatura para usuário:', userId);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, subscriptionData);

      console.log('✅ Teste: Dados de assinatura atualizados no Firestore com sucesso');

      res.json({ 
        success: true, 
        message: 'Dados de assinatura atualizados com sucesso (teste)',
        data: subscriptionData
      });

    } catch (error) {
      console.error('❌ Erro no teste de atualização de assinatura:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para atualizar dados de assinatura do usuário (usado pelo webhook do Stripe)
  app.post('/api/update-user-subscription', async (req, res) => {
    try {
      const { 
        userId, 
        subscriptionPlan, 
        creditsLimit, 
        creditsUsed,
        hasActiveSubscription,
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionUpdatedAt
      } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      // Atualizar dados no Firestore
      console.log('Atualizando dados de assinatura para usuário:', userId, {
        subscriptionPlan,
        creditsLimit,
        creditsUsed,
        hasActiveSubscription,
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionUpdatedAt
      });

      // Atualizar documento do usuário no Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscriptionPlan,
        creditsLimit,
        creditsUsed,
        hasActiveSubscription,
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionUpdatedAt,
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Dados de assinatura atualizados no Firestore com sucesso');

      res.json({ 
        success: true, 
        message: 'Dados de assinatura atualizados com sucesso' 
      });

    } catch (error) {
      console.error('Erro ao atualizar dados de assinatura:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas da API Memed
  // Esquema para validação dos dados do prescritor
  const prescritSchema = z.object({
    uid: z.string(),
    name: z.string(),
    email: z.string().email(),
    cellphone: z.string().optional(),
    crm: z.string().optional(),
    ufCrm: z.string().optional(),
    especialidade: z.string().optional(),
    cidade: z.string().optional(),
    cpf: z.string().optional()
  });

  // Configurar prescritor na Memed
  app.post('/api/memed/configure-prescritor', async (req, res) => {
    try {
      // Validar dados do prescritor
      const userData = prescritSchema.parse(req.body);
      
      // Converter dados do usuário para formato Memed
      const prescritData = MemedBackendService.converterUsuarioParaPrescritor(userData);
      
      // Tentar obter dados do prescritor ou cadastrar novo
      let tokenResponse;
      try {
        tokenResponse = await memedBackendService.obterPrescritor(prescritData.idExterno);
      } catch (error) {
        // Se não encontrar, cadastrar novo prescritor
        tokenResponse = await memedBackendService.cadastrarPrescritor(prescritData);
      }

      return res.status(200).json({
        success: true,
        token: tokenResponse.token,
        expires_in: tokenResponse.expires_in
      });

    } catch (error: any) {
      console.error('Erro ao configurar prescritor Memed:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados do usuário inválidos',
          errors: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro ao configurar integração com Memed',
        error: error.message
      });
    }
  });

  // Buscar medicamentos na Memed
  app.get('/api/memed/medicamentos', async (req, res) => {
    try {
      const { token, q } = req.query;
      
      if (!token || !q) {
        return res.status(400).json({
          success: false,
          message: 'Token e termo de busca são obrigatórios'
        });
      }

      const medicamentos = await memedBackendService.buscarMedicamentos(token as string, q as string);
      
      return res.status(200).json({
        success: true,
        medicamentos
      });

    } catch (error: any) {
      console.error('Erro ao buscar medicamentos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar medicamentos',
        error: error.message
      });
    }
  });

  // Criar prescrição na Memed
  app.post('/api/memed/prescricao', async (req, res) => {
    try {
      const { token, receita } = req.body;
      
      if (!token || !receita) {
        return res.status(400).json({
          success: false,
          message: 'Token e dados da receita são obrigatórios'
        });
      }

      const resultado = await memedBackendService.criarPrescricao(token, receita);
      
      return res.status(200).json({
        success: true,
        prescricao: resultado
      });

    } catch (error: any) {
      console.error('Erro ao criar prescrição:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar prescrição',
        error: error.message
      });
    }
  });

  // Obter detalhes de uma prescrição
  app.get('/api/memed/prescricao/:id', async (req, res) => {
    try {
      const { token } = req.query;
      const { id } = req.params;
      
      if (!token || !id) {
        return res.status(400).json({
          success: false,
          message: 'Token e ID da prescrição são obrigatórios'
        });
      }

      const prescricao = await memedBackendService.obterPrescricao(token as string, id);
      
      return res.status(200).json({
        success: true,
        prescricao
      });

    } catch (error: any) {
      console.error('Erro ao obter prescrição:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter prescrição',
        error: error.message
      });
    }
  });
  
  // Define contact form schema
  const contactSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().min(10),
    message: z.string().min(10).optional(),
  });



  // Contact form submission endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      // Validate request body
      const validatedData = contactSchema.parse(req.body);
      
      console.log('Contact form submission:', validatedData);
      
      // Dados formatados para salvar
      const contactData = {
        ...validatedData,
        date: new Date().toISOString(),
        status: 'novo'
      };
      
      // Enviar e-mail usando Firebase Email Trigger
      try {
        await sendContactEmail(validatedData);
        console.log('E-mail de contato enviado com sucesso');
      } catch (emailError) {
        console.error('Erro ao enviar e-mail de contato:', emailError);
        // Continuamos o processo mesmo com erro no e-mail
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Mensagem recebida com sucesso',
        data: contactData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Dados inválidos', 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar solicitação' 
      });
    }
  });

  // Rotas para Upload e Processamento OCR
  // Verificar status das credenciais da OpenAI
  app.get('/api/ocr/status', (req, res) => {
    res.json({
      success: true,
      configured: true,
      message: 'OpenAI Vision API está configurada'
    });
  });

  // Upload de arquivo com processamento OCR
  app.post('/api/ocr/upload', upload.single('file'), async (req, res) => {
    console.log('🚀 Iniciando processamento de upload...');
    
    try {
      if (!req.file) {
        console.log('❌ Nenhum arquivo enviado');
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado'
        });
      }

      console.log('📁 Arquivo recebido:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Processar arquivo com OCR
      console.log('⚙️ Iniciando processamento OCR...');
      const ocrResult = await processFileWithOCR(req.file);
      
      console.log('✅ OCR processado com sucesso!');
      console.log('📄 TEXTO EXTRAÍDO COMPLETO:');
      console.log('================================');
      console.log(ocrResult.text);
      console.log('================================');

      res.json({
        success: true,
        message: 'Arquivo processado com sucesso',
        data: ocrResult
      });

    } catch (error: any) {
      console.error('❌ Erro no processamento OCR:', error);
      
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao processar arquivo',
        error: error.toString()
      });
    }
  });

  // Debug endpoint para listar processadores
  app.get('/api/ocr/processors', async (req, res) => {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
      const projectId = credentials.project_id || 'preskriptor-e8a69';
      
      console.log('🔧 DIAGNÓSTICO COMPLETO:');
      console.log('Project ID da chave:', credentials.project_id);
      console.log('Project ID usado:', projectId);
      console.log('Client email:', credentials.client_email);
      console.log('PROCESSOR_ID do .env:', process.env.DOCUMENT_AI_PROCESSOR_ID);
      
      const { DocumentProcessorServiceClient } = await import('@google-cloud/documentai');
      const client = new DocumentProcessorServiceClient({
        credentials: credentials,
        projectId: projectId
      });

      // Testar múltiplas regiões
      const regions = ['us', 'us-central1', 'europe-west4', 'asia-northeast1'];
      const allProcessors = [];
      
      for (const region of regions) {
        try {
          const parent = `projects/${projectId}/locations/${region}`;
          console.log('🔍 Verificando região:', region);
          
          const [processors] = await client.listProcessors({ parent });
          
          if (processors.length > 0) {
            console.log(`✅ Encontrados ${processors.length} processadores em ${region}`);
            allProcessors.push({
              region,
              parent,
              processors: processors.map((processor: any) => ({
                name: processor.name,
                displayName: processor.displayName,
                type: processor.type,
                state: processor.state,
                id: processor.name?.split('/').pop()
              }))
            });
          }
        } catch (regionError: any) {
          console.log(`❌ Erro na região ${region}:`, regionError.message);
        }
      }
      
      res.json({ 
        projectId, 
        totalRegions: regions.length,
        regionsWithProcessors: allProcessors.length,
        processors: allProcessors 
      });
    } catch (error: any) {
      console.log('❌ Erro ao listar processadores:', error.message);
      res.status(500).json({ 
        error: error.message,
        details: error.toString()
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
