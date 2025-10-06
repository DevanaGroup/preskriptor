import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play, Pause, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob, duration: number) => void;
  onTranscriptionReceived?: (transcription: string) => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioRecorded,
  onTranscriptionReceived,
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
      console.log('🎵 AudioRecorder sending audio with duration:', duration, 'seconds');
      onAudioRecorded(recordedAudio, duration);
      
      // Limpar estado após envio
      setRecordedAudio(null);
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const discardAudio = () => {
    setRecordedAudio(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordedAudio) {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={isPlaying ? pauseAudio : playAudio}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={discardAudio}
            className="h-8"
          >
            Descartar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={sendAudio}
            className="h-8 bg-blue-600 hover:bg-blue-700"
            disabled={disabled}
          >
            <Send className="h-3 w-3 mr-1" />
            Enviar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isRecording ? (
        <>
          <Button
            type="button"
            onClick={stopRecording}
            className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 animate-pulse"
          >
            <Square className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-red-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Gravando... {formatTime(duration)}
            </span>
          </div>
        </>
      ) : (
        <Button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700"
          title="Gravar áudio"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};