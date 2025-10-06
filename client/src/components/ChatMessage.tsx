import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Message } from '@/lib/openai';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/context/AuthContext';
import { FileText, Image, ExternalLink, Mic, Play, Pause, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  isStreaming?: boolean;
  onNewConversation?: () => void;
  onDisableInput?: (disabled: boolean) => void;
  conversationHistory?: Message[];
  streamingContent?: string;
  onModuleSelect?: (module: { id: string; title: string; assistantId: string }) => void;
  onCategorySelect?: (category: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isLast, 
  isStreaming, 
  onNewConversation, 
  onDisableInput, 
  conversationHistory,
  streamingContent,
  onModuleSelect,
  onCategorySelect
}) => {
  const { currentUser } = useAuth();
  const isUser = message.role === 'user';
  const [displayedText, setDisplayedText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Ref para scroll automático
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isUser) {
      setDisplayedText(message.content);
      return;
    }

    if (isStreaming && streamingContent !== undefined) {
      setDisplayedText(streamingContent);
    } else {
      setDisplayedText(message.content || '');
    }
  }, [message.content, isUser, isStreaming, streamingContent]);

  // Auto-scroll durante streaming
  useEffect(() => {
    if (isStreaming && isLast && messageRef.current) {
      messageRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    }
  }, [displayedText, isStreaming, isLast]);

  const formatTime = (date?: Date) => {
    const now = date || new Date();
    return now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAudioTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = () => {
    if (message.audioData && audioRef) {
      audioRef.play();
      setIsPlayingAudio(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef) {
      audioRef.pause();
      setIsPlayingAudio(false);
    }
  };

  // Configurar áudio se disponível
  useEffect(() => {
    if (message.audioData && !audioRef) {
      const audio = new Audio(URL.createObjectURL(message.audioData.audioBlob));
      
      audio.addEventListener('timeupdate', () => {
        setCurrentAudioTime(audio.currentTime);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlayingAudio(false);
        setCurrentAudioTime(0);
      });
      
      setAudioRef(audio);
      
      return () => {
        audio.pause();
        audio.src = '';
        URL.revokeObjectURL(audio.src);
      };
    }
  }, [message.audioData, audioRef]);

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[80%] gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          {isUser ? (
            <>
              <AvatarImage src={currentUser?.photoURL || ""} />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {currentUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-blue-100 text-blue-600">P</AvatarFallback>
          )}
        </Avatar>

        {/* Mensagem */}
        <div className={cn(
          "rounded-lg px-4 py-3 relative",
          isUser 
            ? "bg-primary text-white" 
            : "bg-gray-100 text-gray-900"
        )}>
          {/* Conteúdo da mensagem */}
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {displayedText}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="prose prose-sm max-w-none text-gray-900">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 last:mb-0 ml-4 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 last:mb-0 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">{children}</code>,
                    pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-sm overflow-x-auto">{children}</pre>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic">{children}</blockquote>,
                    h1: ({ children }) => <h1 className="text-lg font-bold text-primary mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold text-primary mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold text-primary mb-1">{children}</h3>,
                  }}
                >
                  {displayedText}
                </ReactMarkdown>
                {isStreaming && isLast && <span className="typing-cursor"></span>}
              </div>
              
              {/* Sistema de abas com módulos categorizados */}
              {message.categorizedModules && (
                <div className="mt-4">
                  <Tabs defaultValue={Object.keys(message.categorizedModules)[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 min-h-[44px]">
                      {Object.keys(message.categorizedModules).map((category) => (
                        <TabsTrigger key={category} value={category} className="text-xs min-w-0 flex-1">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {Object.entries(message.categorizedModules).map(([category, modules]) => (
                      <TabsContent key={category} value={category} className="mt-4">
                        <div className="space-y-2 min-h-[400px]">
                          {modules.map((module) => (
                            <Button
                              key={module.id}
                              variant="outline"
                              onClick={() => onModuleSelect?.(module)}
                              className="w-full h-auto p-4 bg-white border-gray-200 hover:bg-gray-50 text-gray-900 hover:text-primary text-left justify-start transition-all hover:shadow-sm"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium block">{module.title}</span>
                                </div>
                              </div>
                            </Button>
                          ))}
                          {modules.length === 0 && (
                            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                              Nenhum módulo disponível nesta categoria
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}

              {/* Botões de seleção de categorias (fallback) */}
              {message.categories && message.categories.length > 0 && !message.categorizedModules && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    {message.categories.map((category) => (
                      <Button
                        key={category.value}
                        variant="outline"
                        onClick={() => onCategorySelect?.(category.value)}
                        className="w-full h-auto p-4 bg-white border-gray-200 hover:bg-gray-50 text-gray-900 hover:text-primary text-left justify-start transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium block">{category.label}</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de seleção de módulos (fallback) */}
              {message.modules && message.modules.length > 0 && !message.categorizedModules && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    {message.modules.map((module) => (
                      <Button
                        key={module.id}
                        variant="outline"
                        onClick={() => onModuleSelect?.(module)}
                        className="w-full h-auto p-4 bg-white border-gray-200 hover:bg-gray-50 text-gray-900 hover:text-primary text-left justify-start transition-all hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium block">{module.title}</span>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "text-xs mt-2 opacity-70",
            isUser ? "text-white/70" : "text-gray-500"
          )}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};