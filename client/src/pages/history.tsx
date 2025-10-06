import React, { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import SidebarLayout from '@/components/SidebarLayout';
import { ChatMessage } from '@/components/ChatMessage';
import { Message } from '@/lib/openai';
import { 
  getConversationById,
  getConversationByHash,
  getUserConversations,
  type Conversation 
} from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageCircle, Calendar, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const [location, navigate] = useLocation();
  const searchString = useSearch();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Parse session ID from query string
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const sessionId = params.get('session');
    if (sessionId) {
      setSelectedSessionId(sessionId);
    }
  }, [searchString]);

  // Load specific conversation if session ID is provided
  useEffect(() => {
    const loadConversation = async () => {
      if (!currentUser || !selectedSessionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to load by ID first
        let conv = await getConversationById(selectedSessionId);
        
        // If not found by ID, try by hash
        if (!conv) {
          conv = await getConversationByHash(currentUser.uid, selectedSessionId);
        }

        if (conv) {
          setConversation(conv);
        } else {
          setError('Conversa não encontrada');
        }
      } catch (err) {
        console.error('Erro ao carregar conversa:', err);
        setError('Erro ao carregar conversa');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [currentUser, selectedSessionId]);

  // Load all conversations if no specific session is selected
  useEffect(() => {
    const loadAllConversations = async () => {
      if (!currentUser || selectedSessionId) {
        return;
      }

      setIsLoading(true);
      try {
        const userConvs = await getUserConversations(currentUser.uid, 20);
        setConversations(userConvs);
      } catch (err) {
        console.error('Erro ao carregar conversas:', err);
        setError('Erro ao carregar histórico');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllConversations();
  }, [currentUser, selectedSessionId]);

  const handleConversationSelect = (conv: Conversation) => {
    navigate(`/history?session=${conv.id}`);
  };

  const handleBackToList = () => {
    navigate('/history');
    setSelectedSessionId(null);
    setConversation(null);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Data desconhecida';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const convertChatMessageToMessage = (msg: any): Message => {
    return {
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
    };
  };

  if (!currentUser) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Faça login para visualizar o histórico
              </p>
              <Button 
                className="w-full mt-4" 
                onClick={() => navigate('/auth')}
              >
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-screen">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-500 mb-4">{error}</p>
              <Button 
                className="w-full" 
                onClick={() => navigate('/dashboard/consulta')}
              >
                Voltar ao Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  // Display specific conversation
  if (conversation && selectedSessionId) {
    return (
      <SidebarLayout>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold">{conversation.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {conversation.moduleTitle && `Módulo: ${conversation.moduleTitle} • `}
                    {formatDate(conversation.createdAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/consulta')}
              >
                Nova Conversa
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {conversation.messages && conversation.messages.length > 0 ? (
                conversation.messages.map((msg, index) => (
                  <ChatMessage
                    key={msg.id || index}
                    message={convertChatMessageToMessage(msg)}
                    isLast={index === conversation.messages.length - 1}
                    conversationHistory={conversation.messages.map(convertChatMessageToMessage)}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Nenhuma mensagem nesta conversa
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </SidebarLayout>
    );
  }

  // Display list of conversations
  return (
    <SidebarLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Histórico de Conversas</h1>
          <p className="text-muted-foreground mt-2">
            Visualize todas as suas conversas anteriores
          </p>
        </div>

        {conversations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleConversationSelect(conv)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{conv.title}</span>
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {conv.moduleTitle && (
                      <p className="text-sm text-muted-foreground">
                        Módulo: {conv.moduleTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(conv.createdAt)}</span>
                    </div>
                    <p className="text-sm">
                      {conv.messages?.length || 0} mensagens
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Você ainda não tem conversas no histórico
                </p>
                <Button onClick={() => navigate('/dashboard/consulta')}>
                  Iniciar Nova Conversa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}