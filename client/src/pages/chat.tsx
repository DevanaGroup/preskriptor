import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useModuleConfig, MODULE_CATEGORIES, ModuleCategory } from '@/hooks/useModuleConfig';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { ChatMessage } from '@/components/ChatMessage';
import { Message } from '@/lib/openai';
import { sendMessageStreaming } from '@/lib/openai';
import { logSendMessage } from '@/lib/logger';
import { 
  createConversation, 
  saveMessageToConversation,
  getConversationByHash,
  type Conversation,
  type ChatMessage as FirebaseChatMessage 
} from '@/lib/firebase';

interface Module {
  id: string;
  title: string;
  assistantId: string;
}

export default function Chat() {
  const { currentUser } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Estados principais
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const streamingContentRef = useRef('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [creditDeducted, setCreditDeducted] = useState(false);
  
  // Estado para controlar a visualização (categorias ou módulos)
  const [viewState, setViewState] = useState<'categories' | 'modules' | 'all-modules'>('categories');
  const [selectedCategoryForView, setSelectedCategoryForView] = useState<string | null>(null);
  
  // Estados para gerenciamento de conversas
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Função auxiliar para salvar mensagem no Firebase
  const saveMessageToFirebase = async (
    message: Message, 
    conversationId?: string,
    moduleInfo?: { id?: string; title?: string }
  ) => {
    const convId = conversationId || currentConversation?.id;
    if (!convId || !currentUser) {
      console.warn('Não é possível salvar mensagem sem conversa ativa');
      return;
    }
    
    try {
      // Usar moduleInfo passado ou selectedModule como fallback
      const module = moduleInfo || selectedModule;
      
      const firebaseMessage: Omit<FirebaseChatMessage, 'id'> = {
        content: message.content,
        role: message.role === 'user' ? 'user' : 'assistant',
        timestamp: message.timestamp || new Date(),
        moduleId: module?.id,
        moduleTitle: module?.title
      };
      
      console.log('🔄 Salvando mensagem:', { 
        conversationId: convId, 
        role: firebaseMessage.role,
        contentLength: firebaseMessage.content.length,
        moduleId: module?.id,
        moduleTitle: module?.title
      });
      
      await saveMessageToConversation(convId, firebaseMessage);
      console.log('✅ Mensagem salva com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar mensagem no Firebase:', error);
      // Não mostrar erro ao usuário para não interromper a conversa
    }
  };
  
  // Hook para módulos e acesso
  const { moduleConfigs, enabledModules, getModulesByCategory } = useModuleConfig();
  const { canUseCredits, getRemainingCredits } = useSubscriptionAccess();
  
  // Ref para scroll automático e textarea
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Carregar módulos disponíveis
  const availableModules = React.useMemo(() => {
    if (!moduleConfigs || !enabledModules) {
      return [];
    }
    
    // Verificar se moduleConfigs é array ou objeto
    let modules = [];
    if (Array.isArray(moduleConfigs)) {
      modules = moduleConfigs
        .filter(config => config.enabled && config.assistantId) // Só módulos com assistantId
        .map(config => ({
          id: config.id,
          title: config.title,
          assistantId: config.assistantId
        }));
      
      // Se enabledModules existir como array de objetos, usar IDs para filtrar
      if (enabledModules && enabledModules.length > 0) {
        const enabledIds = Array.isArray(enabledModules) && 
          enabledModules.length > 0 && 
          typeof enabledModules[0] === 'object' && 
          enabledModules[0] !== null
          ? enabledModules.map((mod: any) => mod.id)
          : (enabledModules as unknown as string[]);
        modules = modules.filter(config => enabledIds.includes(config.id));
      }
    } else {
      const enabledIds = Array.isArray(enabledModules) && 
        enabledModules.length > 0 && 
        typeof enabledModules[0] === 'object' && 
        enabledModules[0] !== null
        ? enabledModules.map((mod: any) => mod.id)
        : (enabledModules as unknown as string[]);
      modules = Object.entries(moduleConfigs)
        .filter(([key]) => enabledIds.includes(key))
        .map(([key, config]: [string, any]) => ({
          id: key,
          title: config.title,
          assistantId: config.assistantId
        }));
    }
      
    return modules;
  }, [moduleConfigs, enabledModules]);
  
  // Estado para controlar se a mensagem inicial já foi enviada
  const [initialMessageSent, setInitialMessageSent] = useState(false);

  // NÃO criar mensagem inicial automaticamente - aguardar primeira mensagem do usuário
  
  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingContent]);
  
  // Função para selecionar categoria na visualização inicial
  const handleCategoryGridSelect = (categoryValue: string) => {
    setSelectedCategoryForView(categoryValue);
    setViewState('modules');
  };
  
  // Função para mostrar todos os módulos
  const handleShowAllModules = () => {
    setViewState('all-modules');
    setSelectedCategoryForView(null);
  };
  
  // Função para voltar às categorias
  const handleBackToCategories = () => {
    setViewState('categories');
    setSelectedCategoryForView(null);
  };

  // Função para selecionar categoria
  const handleSelectCategory = async (categoryValue: string) => {
    const category = categoryValue as ModuleCategory;
    setSelectedCategory(category);
    
    // Adicionar mensagem do usuário mostrando a categoria escolhida
    const categoryData = MODULE_CATEGORIES.find(cat => cat.value === category);
    const userChoiceMessage: Message = {
      role: 'user',
      content: categoryData?.label || category,
      timestamp: new Date()
    };
    
    const categoryModules = getModulesByCategory(category);
    
    if (categoryModules.length === 0) {
      const noModulesMessage: Message = {
        role: 'assistant',
        content: `Não há módulos habilitados na categoria **${categoryData?.label}** no momento.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userChoiceMessage, noModulesMessage]);
      return;
    }
    
    // Mostrar módulos da categoria selecionada
    const categoryMessage: Message = {
      role: 'assistant',
      content: `Categoria **${categoryData?.label}** selecionada! Escolha um módulo:`,
      modules: categoryModules.map(mod => ({
        id: mod.id,
        title: mod.title,
        assistantId: mod.assistantId,
        category: mod.category
      })),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userChoiceMessage, categoryMessage]);
  };

  // Função para selecionar módulo
  const handleSelectModule = async (module: Module) => {
    setSelectedModule(module);
    setSelectedCategory(null); // Limpar categoria quando módulo é selecionado
    setViewState('categories'); // Resetar visualização
    setSelectedCategoryForView(null); // Limpar categoria da visualização
    
    // Criar nova conversa no Firebase
    let conversationId: string | null = null;
    if (currentUser) {
      try {
        const conversation = await createConversation(
          currentUser.uid,
          module.id,
          module.title
        );
        setCurrentConversation(conversation);
        conversationId = conversation.id || null; // Guardar o ID para usar imediatamente
        
        // Atualizar URL com hash da sessão
        if (conversation.conversationHash) {
          updateSessionUrl(conversation.conversationHash);
        }
      } catch (error) {
        console.error('Erro ao criar conversa:', error);
        toast({
          title: "Erro",
          description: "Não foi possível iniciar a conversa. Tente novamente.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    // Adicionar mensagem do usuário mostrando o módulo escolhido
    const userChoiceMessage: Message = {
      role: 'user',
      content: module.title,
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, userChoiceMessage];
    setMessages(updatedMessages);
    
    // Salvar mensagem do usuário no Firebase usando o ID recém criado e módulo
    if (conversationId) {
      saveMessageToFirebase(userChoiceMessage, conversationId, module);
    }
    
    // Automaticamente processar resposta do agente de IA
    setIsLoading(true);
    
    // Log
    if (currentUser?.uid && currentUser?.name) {
      logSendMessage(currentUser.uid, currentUser.name, module.title, module.title.length);
    }
    
    try {
      // Inicializar estados de streaming
      setIsStreaming(true);
      setCurrentStreamingContent('');
      streamingContentRef.current = '';
      
      await sendMessageStreaming(
        updatedMessages,
        null,
        threadId,
        module.assistantId,
        {
          onStart: (responseThreadId) => {
            streamingContentRef.current = '';
            setCurrentStreamingContent('');
            
            // Adicionar mensagem vazia para streaming
            const assistantMessage: Message = { 
              role: 'assistant', 
              content: '',
              timestamp: new Date()
            };
            setMessages([...updatedMessages, assistantMessage]);
            
            if (responseThreadId && threadId !== responseThreadId) {
              setThreadId(responseThreadId);
            }
          },
          onChunk: (chunk) => {
            streamingContentRef.current = streamingContentRef.current + chunk;
            setCurrentStreamingContent(streamingContentRef.current);
          },
          onDone: (fullContent, responseThreadId) => {
            setIsStreaming(false);
            setCurrentStreamingContent('');
            streamingContentRef.current = '';
            
            // Criar mensagem da IA completa
            const assistantMessage: Message = {
              role: 'assistant',
              content: fullContent,
              timestamp: new Date()
            };
            
            // Atualizar a última mensagem com o conteúdo final
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = assistantMessage;
              }
              return newMessages;
            });
            
            // Salvar mensagem da IA no Firebase usando o ID da conversa recém criada e módulo
            if (conversationId) {
              saveMessageToFirebase(assistantMessage, conversationId, module);
            } else if (currentConversation?.id) {
              saveMessageToFirebase(assistantMessage, currentConversation.id, module);
            }
            
            if (responseThreadId && threadId !== responseThreadId) {
              setThreadId(responseThreadId);
            }
          },
          onError: (error) => {
            setIsStreaming(false);
            setCurrentStreamingContent('');
            streamingContentRef.current = '';
            throw new Error(error);
          }
        }
      );
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Erro",
          description: "Não foi possível processar o módulo selecionado.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
    
    return true;
  };
  
  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const message = inputText.trim();
    setInputText('');
    
    // Se não há módulo selecionado, verificar se a mensagem é para selecionar categoria ou módulo
    if (!selectedModule) {
      // Adicionar mensagem do usuário primeiro
      const userMsg: Message = { 
        role: 'user', 
        content: message,
        timestamp: new Date()
      };
      
      // Verificar se a mensagem corresponde a uma categoria
      const foundCategory = MODULE_CATEGORIES.find(cat => 
        cat.label.toLowerCase().includes(message.toLowerCase()) ||
        message.toLowerCase().includes(cat.label.toLowerCase()) ||
        cat.value.toLowerCase() === message.toLowerCase()
      );
      
      if (foundCategory) {
        setMessages(prev => [...prev, userMsg]);
        handleSelectCategory(foundCategory.value);
        return;
      }
      
      // Se não é categoria, verificar se é um módulo específico
      const foundModule = availableModules.find(mod => 
        mod.title.toLowerCase().includes(message.toLowerCase()) ||
        message.toLowerCase().includes(mod.title.toLowerCase())
      );
      
      if (foundModule) {
        setMessages(prev => [...prev, userMsg]);
        handleSelectModule(foundModule);
        return;
      }
      
      // Primeira mensagem genérica, mostrar abas com módulos categorizados
      const categorizedModules: { [category: string]: any[] } = {};
      
      MODULE_CATEGORIES.forEach(category => {
        const categoryModules = getModulesByCategory(category.value);
        if (categoryModules && categoryModules.length > 0) {
          categorizedModules[category.value] = categoryModules.map(mod => ({
            id: mod.id,
            title: mod.title,
            assistantId: mod.assistantId,
            category: mod.category
          }));
        }
      });

      console.log('🔍 Módulos categorizados:', categorizedModules);

      const aiResponse: Message = {
        role: 'assistant',
        content: `Olá, Dr. ${currentUser?.name || 'Doutor'}! Sou **Preskriptor**, sua assistente médica especializada.\n\nEscolha uma categoria e selecione o módulo desejado:`,
        categorizedModules,
        timestamp: new Date()
      };
      
      console.log('🚀 Enviando resposta da IA com abas:', aiResponse);
      
      setMessages(prev => [...prev, userMsg, aiResponse]);
      return;
    }
    
    // Cancelar requisição anterior
    if (abortController) {
      abortController.abort();
    }
    
    const newController = new AbortController();
    setAbortController(newController);
    
    // Adicionar mensagem do usuário
    const userMessage: Message = { 
      role: 'user', 
      content: message,
      timestamp: new Date()
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    // Salvar mensagem do usuário no Firebase
    if (currentConversation?.id) {
      saveMessageToFirebase(userMessage, currentConversation.id, selectedModule);
    }
    
    // Log
    if (currentUser?.uid && currentUser?.name) {
      logSendMessage(currentUser.uid, currentUser.name, selectedModule.title, message.length);
    }
    
    try {
      // Inicializar estados de streaming
      setIsStreaming(true);
      setCurrentStreamingContent('');
      streamingContentRef.current = '';
      
      await sendMessageStreaming(
        updatedMessages,
        null,
        threadId,
        selectedModule.assistantId,
        {
          onStart: (responseThreadId) => {
            streamingContentRef.current = '';
            setCurrentStreamingContent('');
            
            // Adicionar mensagem vazia para streaming AQUI no onStart
            const assistantMessage: Message = { 
              role: 'assistant', 
              content: '',
              timestamp: new Date()
            };
            setMessages([...updatedMessages, assistantMessage]);
            
            if (responseThreadId && threadId !== responseThreadId) {
              setThreadId(responseThreadId);
            }
          },
          onChunk: (chunk) => {
            streamingContentRef.current = streamingContentRef.current + chunk;
            setCurrentStreamingContent(streamingContentRef.current);
          },
          onDone: (fullContent, responseThreadId) => {
            setIsStreaming(false);
            setCurrentStreamingContent('');
            streamingContentRef.current = '';
            
            // Criar mensagem da IA completa
            const assistantMessage: Message = {
              role: 'assistant',
              content: fullContent,
              timestamp: new Date()
            };
            
            // Atualizar a última mensagem com o conteúdo final
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = assistantMessage;
              }
              return newMessages;
            });
            
            // Salvar mensagem da IA no Firebase
            if (currentConversation?.id) {
              saveMessageToFirebase(assistantMessage, currentConversation.id, selectedModule);
            }
            
            if (responseThreadId && threadId !== responseThreadId) {
              setThreadId(responseThreadId);
            }
          },
          onError: (error) => {
            setIsStreaming(false);
            setCurrentStreamingContent('');
            streamingContentRef.current = '';
            throw new Error(error);
          }
        }
      );
      
      // Log da mensagem enviada
      if (currentUser?.uid && currentUser?.name) {
        logSendMessage(currentUser.uid, currentUser.name, selectedModule.title, message.length);
      }
    } catch (error: any) {
      setAbortController(null);
      
      if (error.name !== 'AbortError') {
        toast({
          title: "Erro",
          description: "Não foi possível processar sua mensagem.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para limpar URL
  const clearSessionUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.replaceState(null, '', url.toString());
  };

  // Função para atualizar URL com hash da sessão
  const updateSessionUrl = (sessionHash: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('session', sessionHash);
    window.history.replaceState(null, '', url.toString());
  };

  // Função para resetar conversa (Nova conversa)
  const handleNewConversation = () => {
    
    // Resetar todos os estados
    setMessages([]);
    setSelectedModule(null);
    setSelectedCategory(null);
    setThreadId(null);
    setCurrentConversation(null);
    setIsStreaming(false);
    setCurrentStreamingContent('');
    setInputText('');
    setViewState('categories');
    setSelectedCategoryForView(null);
    
    // Navegar para /chat sem parâmetros (isso vai limpar a session automaticamente)
    navigate('/chat');
    
    // Focar no textarea após um delay
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Função para carregar conversa por hash
  const loadConversationByHash = async (sessionHash: string) => {
    if (!currentUser) return;

    setIsLoadingConversation(true);
    try {
      const conversation = await getConversationByHash(currentUser.uid, sessionHash);
      
      if (conversation) {
        // Carregar estado da conversa
        setCurrentConversation(conversation);
        
        // Converter mensagens do Firestore para o formato do chat
        const chatMessages: Message[] = conversation.messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }));
        
        setMessages(chatMessages);
        
        // Definir módulo se disponível
        if (conversation.moduleId && conversation.moduleTitle) {
          const moduleConfig = availableModules.find(m => m.id === conversation.moduleId);
          if (moduleConfig) {
            setSelectedModule(moduleConfig);
          }
        }
      } else {
        // Limpar URL se conversa não existir
        clearSessionUrl();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversa:', error);
      clearSessionUrl();
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Carregar conversa da URL ao inicializar (apenas uma vez)
  useEffect(() => {
    if (!currentUser || initialLoadDone || availableModules.length === 0) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionHash = urlParams.get('session');
    
    if (sessionHash && sessionHash.trim() !== '') {
      loadConversationByHash(sessionHash);
    }
    
    setInitialLoadDone(true);
  }, [currentUser, availableModules.length]); // Quando o usuário muda ou módulos carregam

  // Detectar mudanças na URL para carregar nova conversa
  useEffect(() => {
    if (!currentUser || !initialLoadDone) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionHash = urlParams.get('session');
    
    if (sessionHash && sessionHash.trim() !== '') {
      // Só carregar se não for a conversa atual
      if (!currentConversation || currentConversation.conversationHash !== sessionHash) {
        loadConversationByHash(sessionHash);
      }
    } else {
      // Se não há session na URL, limpar conversa atual
      if (currentConversation) {
        handleNewConversation();
      }
    }
  }, [location]); // Monitora mudanças na URL

  // Redirecionamento
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  if (!currentUser) return null;
  
  // Mostrar loading quando carregando conversa
  if (isLoadingConversation) {
    return (
      <SidebarLayout onNewConversation={handleNewConversation}>
        <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600 dark:text-gray-400">Carregando conversa...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }
  
  return (
    <SidebarLayout onNewConversation={handleNewConversation}>
      <div className="flex flex-col h-[calc(100vh-2rem)]">
        {/* Se não há mensagens, mostrar interface inicial */}
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl px-4">
              {/* Logo centralizado */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-primary rounded-2xl mb-4">
                  <i className="fas fa-notes-medical text-white text-4xl"></i>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Preskriptor</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Sua assistente médica especializada</p>
              </div>

              {/* Campo de entrada principal */}
              <div className="relative max-w-2xl mx-auto mb-8">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Olá, Dr. ${currentUser?.name || 'Doutor'}! Como posso lhe ajudar?`}
                  className="w-full min-h-[80px] p-4 pr-12 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  size="icon"
                  className="absolute bottom-3 right-3 rounded-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {viewState === 'categories' ? (
                /* Abas de Categorias */
                <>
                  <div className="max-w-2xl mx-auto">
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {MODULE_CATEGORIES.slice(0, 5).map((category) => (
                        <button
                          key={category.value}
                          onClick={() => handleCategoryGridSelect(category.value)}
                          className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-center"
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={handleShowAllModules}
                        className="text-sm text-primary hover:underline"
                      >
                        Ver todos os módulos
                      </button>
                    </div>
                  </div>
                </>
              ) : viewState === 'all-modules' ? (
                /* Lista de Todos os Módulos */
                <>
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-4">
                      <button
                        onClick={handleBackToCategories}
                        className="inline-flex items-center text-primary hover:underline text-sm mb-2"
                      >
                        ← Voltar às categorias
                      </button>
                      <h3 className="font-medium text-gray-800 dark:text-gray-100">
                        Todos os módulos disponíveis
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {availableModules.map((module) => (
                        <button
                          key={module.id}
                          onClick={() => handleSelectModule(module)}
                          className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm transition-all text-left"
                        >
                          <h4 className="font-medium text-gray-800 dark:text-gray-100">
                            {module.title}
                          </h4>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Lista de Módulos da Categoria Selecionada */
                <>
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-4">
                      <button
                        onClick={handleBackToCategories}
                        className="inline-flex items-center text-primary hover:underline text-sm mb-2"
                      >
                        ← Voltar às categorias
                      </button>
                      <h3 className="font-medium text-gray-800 dark:text-gray-100">
                        {MODULE_CATEGORIES.find(cat => cat.value === selectedCategoryForView)?.label}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedCategoryForView && getModulesByCategory(selectedCategoryForView as any).map((module) => (
                        <button
                          key={module.id}
                          onClick={() => handleSelectModule(module)}
                          className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm transition-all text-left"
                        >
                          <h4 className="font-medium text-gray-800 dark:text-gray-100">
                            {module.title}
                          </h4>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Interface de chat quando há conversa */
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  message={message}
                  isLast={index === messages.length - 1}
                  isStreaming={index === messages.length - 1 && isStreaming}
                  streamingContent={currentStreamingContent}
                  conversationHistory={messages}
                  onModuleSelect={handleSelectModule}
                  onCategorySelect={handleSelectCategory}
                />
              ))}
              
              {isLoading && !isStreaming && (
                <div className="flex items-center gap-2 text-gray-500 mb-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Área de input para chat */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    selectedModule 
                      ? "Digite sua pergunta..." 
                      : "Digite o nome da categoria ou sua pergunta..."
                  }
                  className="flex-1 min-h-[60px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  size="lg"
                  className="px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              
              {/* Créditos e nova conversa */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={handleNewConversation}
                  className="text-sm text-primary hover:underline"
                >
                  Nova conversa
                </button>
                <div className="text-sm text-gray-500">
                  Créditos disponíveis: {getRemainingCredits()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}