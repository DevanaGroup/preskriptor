import { apiRequest } from './queryClient';
import { Patient } from './firebase';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachment?: {
    fileName: string;
    fileType: string;
    blobUrl: string;
    isImage: boolean;
    isPdf: boolean;
  };
  audioData?: {
    audioBlob: Blob;
    duration: number;
    transcription: string;
  };
  modules?: {
    id: string;
    title: string;
    assistantId: string;
    category?: string;
  }[];
  categories?: {
    value: string;
    label: string;
  }[];
  categorizedModules?: {
    [category: string]: {
      id: string;
      title: string;
      assistantId: string;
      category?: string;
    }[];
  };
  timestamp?: Date;
}

export interface ChatResponse {
  response: string;
  threadId: string;
}

export interface StreamingCallbacks {
  onStart?: (threadId: string) => void;
  onChunk?: (chunk: string) => void;
  onDone?: (fullContent: string, threadId: string) => void;
  onError?: (error: string) => void;
}

// Função para limpar referências de citação da resposta da IA
export function cleanAIResponse(response: string): string {
  // Remove referências do tipo 【5:0†source】, 【12:1†documento】, etc.
  let cleaned = response.replace(/【\d+:\d+†[^】]*】/g, '');
  
  // Remove outros padrões de referência comuns
  cleaned = cleaned.replace(/\[\d+:\d+†[^\]]*\]/g, ''); // [5:0†source]
  cleaned = cleaned.replace(/\(\d+:\d+†[^\)]*\)/g, ''); // (5:0†source)
  cleaned = cleaned.replace(/【[^】]*†[^】]*】/g, '');     // 【qualquer†coisa】
  
  // Remove apenas espaços duplos, mas preserva quebras de linha
  cleaned = cleaned.replace(/ +/g, ' ').trim();
  
  return cleaned;
}

// Função para enviar uma nova mensagem e obter resposta
export async function sendMessage(
  messages: Message[], 
  patient?: Patient | null,
  threadId?: string | null,
  assistantId?: string
): Promise<ChatResponse> {
  try {
    // Adiciona mensagens de log para diagnóstico
    console.log("Enviando mensagem para API com:", {
      messagesCount: messages.length,
      patientId: patient?.id,
      threadId,
      assistantId
    });
    
    // Envia a requisição para o backend em vez de chamar a OpenAI diretamente
    const payload = {
      messages,
      ...(patient ? {
        patientId: patient.id,
        patientName: patient.name
      } : {}),
      ...(threadId ? { threadId } : {}),
      ...(assistantId ? { assistantId } : {})
    };
    
    // Chama a API através do wrapper de apiRequest
    const response = await apiRequest('POST', '/api/chat', payload);
    
    // Verifica se a resposta é válida
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resposta da API com erro:", errorText);
      throw new Error(
        `API retornou status ${response.status}: ${errorText || 'Erro desconhecido'}`
      );
    }
    
    // Converte a resposta para JSON
    const data = await response.json();
    console.log("Resposta da API recebida:", {
      responseLength: data.response?.length,
      threadId: data.threadId
    });
    
    // Log para debug da limpeza de referências
    if (data.response && data.response.includes('†')) {
      console.log("🧹 Limpando referências da resposta:", {
        original: data.response.substring(0, 200) + '...',
        cleaned: cleanAIResponse(data.response).substring(0, 200) + '...'
      });
    }
    
    return {
      response: cleanAIResponse(data.response || "Não foi possível obter uma resposta do assistente."),
      threadId: data.threadId
    };
  } catch (error: any) {
    console.error("Erro ao enviar mensagem para a API:", error);
    throw new Error(`Ocorreu um erro na consulta: ${error.message || "Erro desconhecido"}`);
  }
}

// Função para enviar mensagem com streaming usando EventSource
export async function sendMessageStreaming(
  messages: Message[], 
  patient?: Patient | null,
  threadId?: string | null,
  assistantId?: string,
  callbacks?: StreamingCallbacks,
  userId?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const payload = {
        messages,
        patientId: patient?.id || null,
        patientName: patient?.name || null,
        threadId,
        assistantId,
        userId
      };



      // Primeiro, enviar os dados via POST para iniciar o streaming
      fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        // Processar chunks em tempo real
        const processChunk = () => {
          reader.read().then(({ done, value }) => {
            if (done) {

              resolve();
              return;
            }

            // Decodificar e processar IMEDIATAMENTE
            const text = decoder.decode(value, { stream: true });
            buffer += text;

            // Processar todas as linhas completas no buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Manter última linha incompleta no buffer

            for (const line of lines) {
              if (line.trim() === '' || line.startsWith(':')) continue;
              
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  
                  switch (data.type) {
                    case 'start':
                      console.log('🟢 STREAMING INICIADO NO OPENAI.TS');
                      callbacks?.onStart?.(data.threadId);
                      break;
                    case 'chunk':
                      // Processar chunk IMEDIATAMENTE
                      console.log('🔸 CHUNK NO OPENAI.TS:', data.content);
                      if (callbacks?.onChunk) {
                        console.log('📨 CHAMANDO onChunk callback com:', data.content, 'tipo:', typeof data.content);
                        try {
                          callbacks.onChunk(data.content);
                          console.log('✅ onChunk callback EXECUTADO COM SUCESSO');
                        } catch (e) {
                          console.error('❌ ERRO AO EXECUTAR onChunk:', e);
                        }
                      } else {
                        console.log('⚠️ onChunk callback NÃO EXISTE!');
                      }
                      break;
                    case 'done':
                      console.log('✅ STREAMING FINALIZADO NO OPENAI.TS:', data.fullContent?.length, 'caracteres');
                      callbacks?.onDone?.(cleanAIResponse(data.fullContent), data.threadId);
                      resolve();
                      return;
                    case 'error':
                      callbacks?.onError?.(data.error);
                      reject(new Error(data.error));
                      return;
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }

            // Continuar lendo próximo chunk IMEDIATAMENTE
            processChunk();
          }).catch(error => {
            console.error('❌ FRONTEND STREAM: Erro na leitura:', error);
            callbacks?.onError?.(error.message);
            reject(error);
          });
        };

        // Iniciar processamento
        processChunk();

      }).catch(error => {
        console.error('❌ FRONTEND STREAM: Erro na requisição:', error);
        callbacks?.onError?.(error.message);
        reject(error);
      });

    } catch (error: any) {
      console.error("❌ FRONTEND STREAM: Erro geral:", error);
      callbacks?.onError?.(error.message || "Erro desconhecido");
      reject(error);
    }
  });
}