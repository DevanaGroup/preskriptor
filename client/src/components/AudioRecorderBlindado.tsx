import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderBlindadoProps {
  onAudioRecorded: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

const AudioRecorderBlindado: React.FC<AudioRecorderBlindadoProps> = ({
  onAudioRecorded,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const playAudio = () => {
    if (recordedAudio && !isPlaying) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        setDuration(Math.floor(audio.duration));
      };
      
      audio.ontimeupdate = () => {
        setCurrentTime(Math.floor(audio.currentTime));
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const sendAudio = () => {
    if (recordedAudio && onAudioRecorded) {
      console.log('🎵 AudioRecorderBlindado sending audio with duration:', duration, 'seconds');
      onAudioRecorded(recordedAudio, duration);
      
      // Resetar o estado após enviar
      setRecordedAudio(null);
      setDuration(0);
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Resetar gravação
  const resetRecording = () => {
    setRecordedAudio(null);
    setDuration(0);
    setCurrentTime(0);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Botão principal de gravação - Grande e vermelho */}
      {!recordedAudio && (
        <div className="relative">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            size="lg"
            className={`
              h-24 w-24 rounded-full text-white font-bold text-lg transition-all duration-300 transform hover:scale-105
              ${isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-300' 
                : 'bg-red-500 hover:bg-red-600 shadow-lg'
              }
            `}
          >
            {isRecording ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
          
          {/* Indicador visual de gravação */}
          {isRecording && (
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full animate-pulse">
              <div className="absolute inset-1 bg-white rounded-full"></div>
            </div>
          )}
        </div>
      )}

      {/* Status de gravação */}
      {isRecording && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-medium">Gravando...</span>
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono">
            {formatTime(duration)}
          </div>
        </div>
      )}

      {/* Texto explicativo quando não está gravando */}
      {!isRecording && !recordedAudio && (
        <div className="text-center space-y-2">
          <p className="text-gray-600 font-medium">Toque para gravar</p>
          <p className="text-sm text-gray-500">Máxima privacidade e segurança</p>
        </div>
      )}

      {/* Controles de reprodução quando há áudio gravado */}
      {recordedAudio && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4 w-full max-w-md">
          <div className="text-center">
            <h3 className="font-medium text-gray-800 mb-2">Gravação Concluída</h3>
            <div className="text-lg font-mono text-gray-600">
              {formatTime(duration)}
            </div>
          </div>
          
          {/* Controles de reprodução */}
          <div className="flex justify-center space-x-3">
            <Button
              onClick={isPlaying ? pauseAudio : playAudio}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
            </Button>
            
            <Button
              onClick={resetRecording}
              variant="outline"
              size="sm"
              className="text-gray-600"
            >
              Nova Gravação
            </Button>
          </div>
          
          {/* Botão de enviar */}
          <div className="flex justify-center">
            <Button
              onClick={sendAudio}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Salvar Gravação</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorderBlindado;