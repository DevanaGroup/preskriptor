import OpenAI from "openai";
import multer from "multer";
import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuração do multer para upload de áudio
export const audioUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `audio-${uniqueSuffix}.webm`);
    }
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      const error: any = new Error('Apenas arquivos de áudio são permitidos');
      cb(error, false);
    }
  }
});

export interface AudioTranscriptionResult {
  transcription: string;
  duration: number;
  fileName: string;
  summary?: string;
  keyPoints?: string[];
}

export async function transcribeAudio(filePath: string): Promise<AudioTranscriptionResult> {
  try {
    const audioFile = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);
    
    // Transcrever usando Whisper com configurações mais precisas
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt", // Português
      response_format: "verbose_json",
      temperature: 0.0, // Reduzir temperatura para maior precisão
      prompt: "Esta é uma consulta médica em português. Transcreva apenas o que foi dito, sem adicionar ou inventar palavras." // Prompt específico para evitar alucinações
    });

    // Validar se a transcrição não contém apenas símbolos ou caracteres estranhos
    const cleanText = transcription.text.trim();
    if (cleanText.length < 3 || /^[^\w\s]*$/.test(cleanText)) {
      throw new Error('Transcrição inválida ou muito curta');
    }

    // Organizar e resumir o conteúdo transcrito usando GPT com instruções mais rígidas
    const organizationResponse = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `Você é um assistente especializado em organizar transcrições de áudio médico. 
          IMPORTANTE: Trabalhe APENAS com o texto fornecido. NÃO adicione, invente ou suponha nenhuma informação.
          
          Suas tarefas:
          1. Corrija apenas erros óbvios de transcrição (palavras mal formadas)
          2. Organize o conteúdo mantendo fidelidade ao texto original
          3. Identifique pontos-chave mencionados no texto
          4. Crie um resumo baseado SOMENTE no que foi dito
          
          Responda em formato JSON com as chaves: transcription_corrected, summary, key_points (array)`
        },
        {
          role: "user",
          content: `Organize esta transcrição médica (trabalhe APENAS com o texto fornecido, não adicione informações):\n\n${transcription.text}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Temperatura muito baixa para evitar criatividade
    });

    const organizationResult = JSON.parse(organizationResponse.choices[0].message.content || '{}');

    return {
      transcription: organizationResult.transcription_corrected || transcription.text,
      duration: transcription.duration || 0,
      fileName: path.basename(filePath),
      summary: organizationResult.summary,
      keyPoints: organizationResult.key_points || []
    };
  } catch (error) {
    console.error('Erro na transcrição de áudio:', error);
    throw new Error('Falha na transcrição do áudio');
  }
}

export function setupAudioRoutes(app: Express) {
  // Endpoint para upload e transcrição de áudio
  app.post('/api/audio/transcribe', audioUpload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo de áudio enviado' });
      }

      console.log('Arquivo de áudio recebido:', req.file.filename);
      
      const result = await transcribeAudio(req.file.path);
      
      // Limpar arquivo temporário após processamento
      fs.unlinkSync(req.file.path);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Erro no upload/transcrição de áudio:', error);
      
      // Limpar arquivo em caso de erro
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao limpar arquivo temporário:', unlinkError);
        }
      }
      
      res.status(500).json({
        error: error.message || 'Erro interno do servidor'
      });
    }
  });

  // Endpoint para processar áudio já existente
  app.post('/api/audio/process', async (req: Request, res: Response) => {
    try {
      const { audioPath } = req.body;
      
      if (!audioPath || !fs.existsSync(audioPath)) {
        return res.status(400).json({ error: 'Arquivo de áudio não encontrado' });
      }

      const result = await transcribeAudio(audioPath);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Erro no processamento de áudio:', error);
      res.status(500).json({
        error: error.message || 'Erro interno do servidor'
      });
    }
  });
}

export function validateAudioEnvironment(): boolean {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY não configurada para transcrição de áudio');
    return false;
  }
  console.log('✅ Serviço de áudio configurado com OpenAI Whisper');
  return true;
}