import OpenAI from 'openai';
import { Express, Request, Response } from 'express';

// o modelo mais recente da OpenAI é "gpt-4o" que foi lançado em 13 de maio de 2024.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Interface para assistente OpenAI
export interface OpenAIAssistant {
  id: string;
  object: string;
  created_at: number;
  name: string;
  description: string | null;
  model: string;
  instructions: string | null;
  tools: any[];
  metadata: Record<string, any>;
}

const SYSTEM_PROMPT = `
Você é um assistente nutricional profissional e especializado chamado "Preskriptor IA". 
Sua função é ajudar a personalizar dietas e planos nutricionais com base nas necessidades e objetivos do paciente.

Aqui estão suas diretrizes:
1. Forneça recomendações nutricionais baseadas em evidências científicas atualizadas.
2. Seja detalhado, mas use linguagem acessível que pacientes possam entender.
3. Faça perguntas adicionais para obter informações necessárias: idade, peso, altura, atividade física, etc.
4. Quando recomendar algum alimento, explique seus benefícios nutricionais.
5. Sempre verifique sobre possíveis alergias, intolerâncias ou restrições alimentares.
6. Para casos complexos, recomende consulta presencial com nutricionista.

Responda sempre em português e de forma amigável e profissional.
`;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function setupOpenAIRoutes(app: Express) {
  // Endpoint para listar todos os assistentes
  app.get('/api/assistants', async (_req: Request, res: Response) => {
    try {
      // Lista todos os assistentes da conta
      const assistantsList = await openai.beta.assistants.list({
        limit: 100,
      });
      
      return res.json({
        success: true,
        assistants: assistantsList.data
      });
    } catch (error: any) {
      console.error("Erro ao listar assistentes OpenAI:", error);
      
      if (error.status === 401) {
        return res.status(401).json({ 
          success: false, 
          error: "Erro de autenticação com a OpenAI. Verifique a chave de API." 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: `Ocorreu um erro ao listar assistentes: ${error.message || "Erro desconhecido"}` 
      });
    }
  });

  // Endpoint para obter detalhes de um assistente específico
  app.get('/api/assistants/:assistantId', async (req: Request, res: Response) => {
    try {
      const { assistantId } = req.params;
      
      if (!assistantId) {
        return res.status(400).json({ 
          success: false, 
          error: "ID do assistente não fornecido" 
        });
      }
      
      // Obter detalhes do assistente
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      
      return res.json({
        success: true,
        assistant
      });
    } catch (error: any) {
      console.error(`Erro ao obter assistente ${req.params.assistantId}:`, error);
      
      if (error.status === 404) {
        return res.status(404).json({ 
          success: false, 
          error: "Assistente não encontrado" 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: `Ocorreu um erro ao obter assistente: ${error.message || "Erro desconhecido"}` 
      });
    }
  });

  // Endpoint para streaming de chat usando Server-Sent Events
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    try {
      const { message, messages, patientId, patientName, assistantId, userId, threadId } = req.body;
      
      // Aceitar tanto 'message' (string única) quanto 'messages' (array)
      let finalMessages;
      let messageContent;
      
      if (message && typeof message === 'string') {
        // Se recebeu uma string, criar um array com essa mensagem
        finalMessages = [{ role: 'user', content: message }];
        messageContent = message;
      } else if (messages && Array.isArray(messages)) {
        finalMessages = messages;
        const lastMessage = messages[messages.length - 1];
        messageContent = lastMessage?.content || '';
      } else {
        return res.status(400).json({ error: 'Formato inválido. É necessário uma mensagem ou array de mensagens.' });
      }

      // Configurar headers para Server-Sent Events com NO BUFFERING
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no', // Desabilitar buffering no nginx
        'X-Content-Type-Options': 'nosniff',
        'Transfer-Encoding': 'chunked'
      });
      
      // Forçar flush inicial múltiplas vezes para garantir
      res.write(':ok\n\n');
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
      res.write(':ping\n\n');
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
      (res as any).flush?.();

      // Usar o ID do assistente recebido do frontend
      const finalAssistantId = assistantId || "asst_IP63O2nevkiKSFOOwwwGfDCl";
      
      // Criar ou recuperar um thread existente
      const requestThreadId = threadId || null;
      let thread;
      
      if (requestThreadId) {
        try {
          thread = await openai.beta.threads.retrieve(requestThreadId);
        } catch (error) {
          thread = await openai.beta.threads.create({
            metadata: {
              patientId: patientId || "",
              patientName: patientName || "",
              createdAt: new Date().toISOString()
            }
          });
        }
      } else {
        thread = await openai.beta.threads.create({
          metadata: {
            patientId: patientId || "",
            patientName: patientName || "",
            createdAt: new Date().toISOString()
          }
        });
      }
      
      // Adicionar a mensagem ao thread
      if (messageContent && messageContent.trim()) {
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: messageContent
        });
      }
      
      // Executar o assistente com streaming
      const run = await openai.beta.threads.runs.createAndStream(thread.id, {
        assistant_id: finalAssistantId
      });

      let fullResponse = '';

      run.on('textCreated', (text) => {
        console.log('🚀 SERVER STREAM: textCreated event disparado');
        res.write(`data: ${JSON.stringify({ type: 'start', threadId: thread.id })}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      });

      run.on('textDelta', (textDelta, snapshot) => {
        const chunk = textDelta.value || '';
        console.log(`📡 SERVER STREAM: textDelta - chunk: "${chunk}" (${chunk.length} chars)`);
        fullResponse += chunk;
        
        // Enviar chunk IMEDIATAMENTE com múltiplos newlines para forçar flush
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        
        // Forçar flush múltiplas vezes para garantir envio
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
          (res as any).flush();
        }
        
        // Enviar um comentário vazio para forçar transmissão
        res.write(`:keepalive\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      });

      run.on('textDone', async (content) => {
        console.log(`✅ SERVER STREAM: textDone - resposta completa: ${fullResponse.length} chars`);
        res.write(`data: ${JSON.stringify({ 
          type: 'done', 
          threadId: thread.id,
          fullContent: fullResponse 
        })}\n\n`);
        res.end();
      });

      run.on('error', (error) => {
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          error: error.message 
        })}\n\n`);
        res.end();
      });

    } catch (error: any) {
      console.error("Erro no chat streaming:", error);
      if (!res.headersSent) {
        return res.status(500).json({ 
          success: false,
          error: error.message || "Erro desconhecido",
          message: error.message || "Erro ao processar chat" 
        });
      }
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: error.message || "Erro desconhecido" 
      })}\n\n`);
      res.end();
    }
  });

  // Endpoint para processar mensagens do chat usando um assistente específico
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { messages, patientId, patientName, assistantId, userId } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Formato inválido. É necessário um array de mensagens.' });
      }



      // Usar o ID do assistente recebido do frontend, ou um padrão se não fornecido
      const finalAssistantId = assistantId || "asst_IP63O2nevkiKSFOOwwwGfDCl";
      
      console.log("Usando assistente:", finalAssistantId);
      
      // Criar ou recuperar um thread existente
      const threadId = req.body.threadId || null;
      let thread;
      
      if (threadId) {
        try {
          thread = await openai.beta.threads.retrieve(threadId);
        } catch (error) {
          console.log("Thread não encontrado, criando um novo: ", error);
          thread = await openai.beta.threads.create({
            metadata: {
              patientId: patientId || "",
              patientName: patientName || "",
              createdAt: new Date().toISOString()
            }
          });
        }
      } else {
        thread = await openai.beta.threads.create({
          metadata: {
            patientId: patientId || "",
            patientName: patientName || "",
            createdAt: new Date().toISOString()
          }
        });
      }
      
      // Adicionar a mensagem mais recente do usuário ao thread
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: lastUserMessage.content
        });
      }
      
      // Executar o assistente
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: finalAssistantId
      });
      
      // Aguardar a conclusão do run
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      // Esperar até que o run seja concluído (com timeout de 30 segundos)
      const startTime = Date.now();
      while (runStatus.status !== "completed" && runStatus.status !== "failed" && 
             Date.now() - startTime < 30000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }
      
      if (runStatus.status === "failed") {
        throw new Error(`Run falhou: ${runStatus.last_error?.message || "Erro desconhecido"}`);
      }
      
      if (runStatus.status !== "completed") {
        throw new Error("Timeout ao processar a solicitação");
      }
      
      // Obter a resposta mais recente
      const threadMessages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessages = threadMessages.data
        .filter(msg => msg.role === "assistant")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      let responseText = "Desculpe, não consegui processar sua solicitação.";
      
      if (assistantMessages.length > 0) {
        const lastMessage = assistantMessages[0];
        if (lastMessage.content && lastMessage.content.length > 0) {
          const textContent = lastMessage.content.find(c => c.type === 'text');
          if (textContent && 'text' in textContent) {
            responseText = textContent.text.value;
          }
        }
      }
      
      return res.json({
        response: responseText,
        threadId: thread.id
      });
    } catch (error: any) {
      console.error("Erro na API da OpenAI:", error);
      
      if (error.status === 401) {
        return res.status(401).json({ error: "Erro de autenticação com a OpenAI. Verifique a chave de API." });
      }
      
      if (error.status === 429) {
        return res.status(429).json({ error: "Limite de requisições atingido. Tente novamente mais tarde." });
      }
      
      return res.status(500).json({ error: `Ocorreu um erro: ${error.message || "Erro desconhecido"}` });
    }
  });
}