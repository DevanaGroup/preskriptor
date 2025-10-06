import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProntuarioBlindadoRecorderProps {
  onSendRecording: (audioBlob: Blob) => void;
  disabled?: boolean;
}

const ProntuarioBlindadoRecorder: React.FC<ProntuarioBlindadoRecorderProps> = ({
  onSendRecording,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Limpar timers ao desmontar o componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setRecordedAudio(audioBlob);
        setHasRecording(true);
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      // Timer para contagem do tempo
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast({
        title: "Erro de Áudio",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    setRecordedAudio(null);
    setHasRecording(false);
    setDuration(0);
  };

  const sendRecording = () => {
    if (recordedAudio) {
      onSendRecording(recordedAudio);
      // Limpar após enviar
      setRecordedAudio(null);
      setHasRecording(false);
      setDuration(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Botão principal de gravação */}
      <div className="relative flex flex-col items-center">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || hasRecording}
          className={`
            w-24 h-24 rounded-full transition-all duration-300 border-4
            ${isRecording 
              ? 'bg-red-600 hover:bg-red-700 border-red-300 animate-pulse shadow-lg shadow-red-500/50' 
              : hasRecording
                ? 'bg-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 border-red-200 hover:shadow-lg hover:shadow-red-500/30'
            }
          `}
        >
          {isRecording ? (
            <MicOff className="h-8 w-8 text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>
        
        {/* Timer */}
        <div className="mt-3 text-center">
          <div className="text-lg font-mono font-bold text-gray-700">
            {formatTime(duration)}
          </div>
          <div className="text-sm text-gray-500">
            {isRecording ? 'Gravando...' : hasRecording ? 'Gravação concluída' : 'Clique para gravar'}
          </div>
        </div>
      </div>

      {/* Botões de ação após gravação */}
      {hasRecording && !isRecording && (
        <div className="flex space-x-4 animate-in fade-in-50 duration-300">
          <Button
            onClick={discardRecording}
            variant="outline"
            className="flex items-center space-x-2 border-red-200 text-red-600 hover:bg-red-50"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
            <span>Descartar</span>
          </Button>
          
          <Button
            onClick={sendRecording}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
            disabled={disabled}
          >
            <Send className="h-4 w-4" />
            <span>Enviar</span>
          </Button>
        </div>
      )}

      {/* Instruções */}
      <div className="text-center max-w-md">
        <p className="text-sm text-gray-600">
          {!hasRecording 
            ? "Clique no botão vermelho para iniciar a gravação do prontuário"
            : "Escolha se deseja enviar a gravação para análise ou descartá-la"
          }
        </p>
      </div>
    </div>
  );
};

export default ProntuarioBlindadoRecorder;