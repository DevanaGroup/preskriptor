import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/components/ChatMessage';
import { Message, sendMessage, sendMessageStreaming } from '@/lib/openai';
import { FileUploadOCR } from '@/components/FileUploadOCR';
import { AudioRecorder } from '@/components/AudioRecorder';
import AudioRecorderBlindado from '@/components/AudioRecorderBlindado';
import ProntuarioBlindadoRecorder from '@/components/ProntuarioBlindadoRecorder';
import LoadingIndicator from '@/components/LoadingIndicator';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  Send, RefreshCw, User, Plus, FileText, Apple, MoveRight, ArrowLeft, Paperclip, Lock,
  // Ícones adicionais para módulos
  Activity, BookOpen, Brain, Calculator, Calendar, Camera, ChartBar, Clipboard, Clock,
  Database, FlaskConical, Heart, HeartPulse, Leaf, Microscope, Scale, Shield, Stethoscope,
  Target, TestTube, Thermometer, Users, Weight, Zap, Pill
} from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import { collection, query, where, getDocs, Timestamp, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Patient, getPatients, createPatient } from '@/lib/firebase';
import { 
  logCreatePatient, 
  logStartConsultation, 
  logSendMessage, 
  logFileUpload, 
  logGenerateReceipt 
} from '@/lib/logger';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Salad, Printer } from 'lucide-react';
import { useModuleConfig, ModuleConfig } from '@/hooks/useModuleConfig';
import { useLocation, useSearch } from 'wouter';
import ReactMarkdown from 'react-markdown';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';

// Interface para módulos na tela de consulta
interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  assistantId: string;
  enabled: boolean;
  tier?: 'Free' | 'PRO' | 'Premium';
  comingSoon?: boolean;
}

// Função para renderizar ícone baseado no nome do ícone
const renderIcon = (iconName: string): React.ReactNode => {
  const iconMap: Record<string, any> = {
    'activity': Activity,
    'apple': Apple,
    'book-open': BookOpen,
    'brain': Brain,
    'calculator': Calculator,
    'calendar': Calendar,
    'camera': Camera,
    'chart-bar': ChartBar,
    'clipboard': Clipboard,
    'clock': Clock,
    'database': Database,
    'file-text': FileText,
    'flask-conical': FlaskConical,
    'heart': Heart,
    'heart-pulse': HeartPulse,
    'leaf': Leaf,
    'lock': Lock,
    'microscope': Microscope,
    'pill': Pill,
    'scale': Scale,
    'shield': Shield,
    'stethoscope': Stethoscope,
    'target': Target,
    'test-tube': TestTube,
    'thermometer': Thermometer,
    'users': Users,
    'weight': Weight,
    'zap': Zap
  };
  
  const IconComponent = iconMap[iconName];
  if (!IconComponent) return null;
  
  return <IconComponent className="h-10 w-10 text-primary" />;
};

const ConsultaPage = () => {
  // Estados originais
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    cellphone: ''
  });
  const [threadId, setThreadId] = useState<string | null>(null);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  
  // Novos estados para gerenciar seleção de módulos e interface
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModuleSelection, setShowModuleSelection] = useState(true);
  const [showChat, setShowChat] = useState(false);
  
  // Carregar configurações de módulos do Firestore usando o hook
  const { isLoading: isLoadingModuleConfig, moduleConfigs, enabledModules } = useModuleConfig();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  
  // Hook para controlar acesso baseado no plano
  const { canAccessModule, canUseCredits, getRemainingCredits, getSubscriptionPlan } = useSubscriptionAccess();
  
  // Estados para gerenciar a geração de receita  
  const [receitaGerada, setReceitaGerada] = useState<string>('');
  const [showReceitaDialog, setShowReceitaDialog] = useState(false);
  const [isGerandoReceita, setIsGerandoReceita] = useState(false);
  
  // Estados para streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const streamingContentRef = useRef('');
  
  // Estado para input de mensagem nos chats
  const [inputMessage, setInputMessage] = useState('');
  
  // AbortController para cancelar requisições
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Flag para forçar nova cobrança de crédito
  const [forceNewCredit, setForceNewCredit] = useState(false);
  
  // Flag para controlar se a primeira mensagem foi automática
  const [isFirstMessageAutomatic, setIsFirstMessageAutomatic] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser, refreshUserData } = useAuth();
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  
  // Forçar atualização dos dados do usuário ao carregar a página
  useEffect(() => {
    if (currentUser?.uid) {
      refreshUserData();
    }
  }, [currentUser?.uid, refreshUserData]);
  
  // Função para iniciar nova conversa
  const handleNewConversation = () => {
    setMessages([]);
    setThreadId(null);
    setIsStreaming(false);
    setCurrentStreamingContent('');
    setInputMessage('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const irParaPaginaReceitas = () => {
    localStorage.setItem('receitaTemporaria', receitaGerada);
    localStorage.setItem('pacienteReceita', selectedPatient?.id || '');
    localStorage.setItem('pacienteNome', selectedPatient?.name || '');
    setShowReceitaDialog(false);
    navigate('/dashboard/receitas');
  };

  const handleGerarReceita = async () => {
    if (!selectedPatient) {
      toast({
        title: "Selecione um paciente",
        description: "É necessário selecionar um paciente para gerar uma receita",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }
    if (messages.length < 2) {
      toast({
        title: "Conversa insuficiente",
        description: "É necessário ter mais interações na consulta para gerar uma receita",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }
    if (currentUser?.uid && currentUser?.name) {
      logGenerateReceipt(currentUser.uid, currentUser.name, selectedPatient.name);
    }
    setIsGerandoReceita(true);
    try {
      const conversationHistory = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
      const promptMessage: Message = {
        role: 'user',
        content: `Com base nessa conversa entre nutricionista e paciente, gere uma prescrição médica nutricional formal e completa. Histórico da consulta: ${conversationHistory}`
      };
      const response = await sendMessage([...messages, promptMessage], selectedPatient, threadId || null);
      if (response && response.response) {
        setReceitaGerada(response.response);
        setShowReceitaDialog(true);
      } else {
        throw new Error("Resposta vazia do assistente");
      }
    } catch (error: any) {
      console.error("Erro ao gerar receita:", error);
      toast({
        title: "Erro ao gerar receita",
        description: error.message || "Não foi possível gerar a receita. Tente novamente.",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    } finally {
      setIsGerandoReceita(false);
    }
  };
  

  

  
  // Função para salvar consulta no Firestore
  const saveConsultation = async (consultationData: {
    userId: string;
    patientId: string;
    patientName: string;
    threadId: string;
    messages: any[];
    status: 'active' | 'completed' | 'archived';
  }) => {
    // Implementação com retry para maior confiabilidade
    let retries = 3;
    
    while (retries > 0) {
      try {
        console.log(`Tentativa de salvar consulta (${4-retries}/3)`);
        
        const now = Timestamp.now();
        const consultationWithTimestamp = {
          ...consultationData,
          createdAt: now,
          updatedAt: now,
          // Certifique-se de que timestamp está no formato correto para cada mensagem
          messages: consultationData.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? Timestamp.fromDate(msg.timestamp) : msg.timestamp
          }))
        };
        
        // Salvar no Firestore
        const docRef = await addDoc(collection(db, "consultations"), consultationWithTimestamp);
        
        // Também atualizar o paciente com a data da última consulta
        const patientRef = doc(db, "patients", consultationData.patientId);
        await updateDoc(patientRef, {
          lastConsult: now,
          updatedAt: now
        });
        
        console.log("Consulta salva com sucesso:", docRef.id);
        return docRef.id;
      } catch (error) {
        console.error(`Erro ao salvar consulta (tentativa ${4-retries}/3):`, error);
        retries--;
        if (retries === 0) {
          throw error;
        }
        // Espera exponencial entre tentativas
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 4-retries) * 500));
      }
    }
  };

  // Rolagem automática para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Função para lidar com texto extraído do OCR
  const handleTextExtracted = async (extractedText: string, fileName: string, attachmentMeta?: any) => {
    
    // Registrar log do upload de arquivo
    if (currentUser?.uid && currentUser?.name) {
      logFileUpload(currentUser.uid, currentUser.name, fileName, 'OCR');
    }
    
    // Remover requisito de paciente selecionado - pode processar documentos sem paciente

    // Criar mensagem visual no chat e enviar texto para IA
    const messageText = extractedText;
    
    // Criar mensagem do usuário para exibir no chat (visual)
    let userMessage: Message;

    if (attachmentMeta && attachmentMeta.type === 'ocr_attachment') {
      console.log('✅ Criando mensagem com attachment visual');
      // Criar mensagem especial para attachment OCR - mostra apenas a prévia visual
      userMessage = {
        role: 'user',
        content: messageText, // Texto será usado para enviar à IA
        attachment: {
          fileName: attachmentMeta.fileName,
          fileType: attachmentMeta.fileType,
          blobUrl: attachmentMeta.blobUrl,
          isImage: attachmentMeta.isImage,
          isPdf: attachmentMeta.isPdf
        }
      };
    } else {
      console.log('❌ Criando mensagem normal de texto');
      // Mensagem normal de texto
      userMessage = { 
        role: 'user', 
        content: messageText 
      };
    }



    // Adicionar mensagem com attachment visual ao chat
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setCurrentMessage('');
    setIsLoading(true);
    
    // Registrar log do envio da mensagem
    if (currentUser?.uid && currentUser?.name) {
      const patientName = selectedPatient?.name || 'Sem paciente selecionado';
      logSendMessage(currentUser.uid, currentUser.name, patientName, messageText.length);
    }
    
    // Enviar o texto extraído para a IA (nos bastidores)
    await processDocumentExtraction(messageText, updatedMessages);
  };

  // Função para processar a extração de documento e enviar para a IA
  const processDocumentExtraction = async (extractedText: string, updatedMessages: Message[]) => {
    try {
      // Adicionar mensagem temporária da IA imediatamente
      const tempAssistantMessage: Message = { 
        role: 'assistant', 
        content: '' 
      };
      
      const messagesWithTemp = [
        ...updatedMessages,
        tempAssistantMessage
      ];
      
      setMessages(messagesWithTemp);
      setIsStreaming(true);
      setCurrentStreamingContent('');
      streamingContentRef.current = '';
      
      let fullResponse = '';
      let finalMessages: Message[] = [];
      
      // Usar o streaming para receber a resposta em tempo real
      await sendMessageStreaming(
        updatedMessages, 
        selectedPatient || null, 
        threadId, 
        selectedModule?.assistantId,
        {
          onStart: (responseThreadId) => {
            if (responseThreadId && threadId !== responseThreadId) {
              setThreadId(responseThreadId);
            }
            streamingContentRef.current = '';
            setCurrentStreamingContent('');
          },
          onChunk: (chunk) => {
            fullResponse += chunk;
            
            // IMPORTANTE: Atualizar streamingContentRef e currentStreamingContent
            streamingContentRef.current = fullResponse;
            setCurrentStreamingContent(fullResponse);
            
            // Atualizar diretamente a última mensagem no array
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: fullResponse
              };
              return newMessages;
            });
          },
          onDone: (fullContent, responseThreadId) => {
            setIsStreaming(false);
            setCurrentStreamingContent('');
            streamingContentRef.current = '';
            
            // Criar mensagens finais
            finalMessages = [
              ...updatedMessages,
              { role: 'assistant', content: fullContent }
            ];
            
            // Garantir que a mensagem final está correta
            setMessages(finalMessages);
            
            // Salvar threadId
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
      
      // Salvar a conversa no Firestore
      if (selectedPatient?.id && currentUser?.uid && finalMessages.length > 0) {
        try {
          const messagesToSave = finalMessages.map((msg: Message) => ({
            ...msg,
            timestamp: new Date()
          }));
          
          // Salvar a consulta no Firestore
          await saveConsultation({
            userId: currentUser.uid,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            threadId: threadId || 'unknown',
            messages: messagesToSave,
            status: 'active'
          });
        } catch (saveError) {
          console.error("Erro ao salvar consulta no Firestore:", saveError);
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar extração:', error);
      toast({
        title: 'Erro na consulta',
        description: error.message || 'Não foi possível processar o documento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar lista de pacientes
  const loadPatients = async () => {
    if (!currentUser?.uid) return;
    
    setIsLoadingPatients(true);
    
    // Timeout mais longo para a operação do Firebase
    const timeoutPromise = new Promise((_: any, reject) => {
      setTimeout(() => {
        reject(new Error("Tempo esgotado para o Firestore. A lista de pacientes pode estar incompleta."));
      }, 8000); // 8 segundos de timeout (aumentado para dar mais tempo para os retries)
    });
    
    try {
      // Tentamos carregar do Firebase, mas com timeout
      let patientsList: Patient[] = [];
      
      try {
        patientsList = await Promise.race([
          getPatients(currentUser.uid),
          timeoutPromise
        ]) as Patient[];
        

      } catch (firebaseError: any) {
        console.warn("Firebase erro ao carregar pacientes:", firebaseError);
        
        // Mensagem de erro mais específica baseada no código de erro
        let errorMessage = "Conexão lenta com o banco de dados. Algumas informações podem estar indisponíveis.";
        
        if (firebaseError?.code === "failed-precondition") {
          errorMessage = "Erro de configuração do banco de dados. Tentando solução alternativa...";
          
          // Tentativa alternativa sem indexação
          try {
            const collectionRef = collection(db, "patients");
            const q = query(collectionRef, where("userId", "==", currentUser.uid));
            const snapshot = await getDocs(q);
            
            patientsList = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                userId: currentUser.uid,
                lastConsult: data.lastConsult instanceof Timestamp ? data.lastConsult.toDate() : data.lastConsult,
                nextConsult: data.nextConsult instanceof Timestamp ? data.nextConsult.toDate() : data.nextConsult,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
              } as Patient;
            });
            
            // Ordenar manualmente
            patientsList.sort((a, b) => a.name.localeCompare(b.name));
            
            console.log("Solução alternativa funcionou, pacientes carregados:", patientsList.length);
            
            if (patientsList.length > 0) {
              // Se tivemos sucesso, não mostrar a mensagem de erro
              setPatients(patientsList);
              setIsLoadingPatients(false);
              return;
            }
          } catch (alternativeError) {
            console.error("Tentativa alternativa também falhou:", alternativeError);
          }
        }
        
        toast({
          title: "Aviso",
          description: errorMessage,
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
        
        // Continuamos com uma lista vazia
        patientsList = [];
      }
      
      setPatients(patientsList);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pacientes",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    } finally {
      setIsLoadingPatients(false);
    }
  };

  // Criar novo paciente
  const handleCreatePatient = async () => {
    if (!currentUser?.uid) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }
    
    if (!newPatientData.name || !newPatientData.email || !newPatientData.cellphone) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }
    
    setIsSavingPatient(true);
    
    // Timeout para a operação do Firebase
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Tempo esgotado para o Firestore. Usando dados locais."));
      }, 5000); // 5 segundos de timeout
    });
    
    try {
      // Criamos um paciente para usar no caso de falha do Firestore
      const patientData = {
        userId: currentUser.uid,
        name: newPatientData.name,
        email: newPatientData.email,
        cellphone: newPatientData.cellphone
      };
      
      let newPatient;
      
      try {
        // Tentamos criar com o Firebase, mas com timeout
        newPatient = await Promise.race([
          createPatient(patientData),
          timeoutPromise
        ]);
      } catch (firebaseError) {
        console.warn("Firebase error or timeout:", firebaseError);
        
        // Se falhar, criamos um objeto paciente local com ID temporário
        // para que a UI funcione mesmo sem conectividade
        newPatient = {
          ...patientData,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastConsult: null,
          nextConsult: null
        } as Patient;
        
        toast({
          title: "Aviso",
          description: "Paciente salvo localmente. A sincronização ocorrerá quando a conexão for restaurada.",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
      }
      
      // Usando cast explícito para Patient para evitar erros de tipagem
      const typedPatient = newPatient as Patient;
      setPatients((prev: Patient[]) => [...prev, typedPatient] as Patient[]);
      setSelectedPatient(typedPatient as Patient);
      setShowNewPatientDialog(false);
      
      toast({
        title: "Paciente criado",
        description: `${typedPatient.name} foi adicionado com sucesso`,
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      
      // Registrar log da ação
      if (currentUser?.uid && currentUser?.name) {
        logCreatePatient(currentUser.uid, currentUser.name, typedPatient.name);
      }
      
      // Resetar formulário
      setNewPatientData({
        name: '',
        email: '',
        cellphone: ''
      });
    } catch (error) {
      console.error("Erro ao criar paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o paciente",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    } finally {
      setIsSavingPatient(false);
    }
  };

  // Efeito para carregar pacientes quando o componente montar
  useEffect(() => {
    if (currentUser?.uid) {
      loadPatients();
    }
  }, [currentUser?.uid]);

  // Efeito para carregar os módulos a partir do hook useModuleConfig
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    setIsLoadingModules(true);
    
    if (!isLoadingModuleConfig) {
      // Usar apenas os dados do Firestore
      const allModules = moduleConfigs.map(config => ({
        id: config.id,
        title: config.title,
        description: config.description,
        assistantId: config.assistantId,
        enabled: config.enabled,
        icon: (config as any).icon ? renderIcon((config as any).icon) : null,
        tier: config.tier || 'Free'
      })).sort((a, b) => {
        // Habilitados primeiro
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;
        
        // Se ambos têm o mesmo status (enabled/disabled), ordenar por tier
        const tierOrder = { 'Free': 1, 'PRO': 2, 'Premium': 3 };
        const aTierOrder = tierOrder[a.tier as keyof typeof tierOrder] || 4;
        const bTierOrder = tierOrder[b.tier as keyof typeof tierOrder] || 4;
        
        return aTierOrder - bTierOrder;
      });
      

      setModules(allModules);
      
      setIsLoadingModules(false);
    }
  }, [currentUser?.uid, isLoadingModuleConfig, moduleConfigs]);

  // Efeito para detectar módulo da URL e abrir automaticamente o chat
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams);
    const moduleIdFromUrl = urlParams.get('module');
    
    if (moduleIdFromUrl && modules.length > 0) {
      const moduleToSelect = modules.find(m => m.id === moduleIdFromUrl && m.enabled);
      
      if (moduleToSelect) {

        setSelectedModule(moduleToSelect);
        setShowModuleSelection(false);
        setShowChat(true);
        
        // Limpar o parâmetro da URL após processar
        navigate('/dashboard/consulta', { replace: true });
      }
    }
  }, [modules, searchParams, navigate]);
  


  // Efeito para focar no input
  useEffect(() => {
    // Focar no input após carregar a página
    if (showChat) {
      inputRef.current?.focus();
    }
  }, [selectedPatient, showChat, selectedModule]);

  // Função para iniciar uma consulta com o módulo selecionado
  const startConsultation = (module?: Module) => {
    const moduleToUse = module || selectedModule;
    
    if (!moduleToUse) {
      toast({
        title: "Selecione um módulo",
        description: "Por favor, selecione um módulo para iniciar a consulta.",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }

    // Verificar se o usuário tem acesso ao módulo baseado no plano
    if (!canAccessModule(moduleToUse.tier as 'Free' | 'PRO' | 'Premium')) {
      toast({
        title: "Acesso Restrito",
        description: `Este módulo requer o plano ${moduleToUse.tier === 'PRO' ? 'PRO' : 'Premium'}. Faça upgrade do seu plano para acessar.`,
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }

    // Verificar se o usuário tem créditos disponíveis
    if (!canUseCredits()) {
      const planName = getSubscriptionPlan() === 'freemium' ? 'Freemium (5 créditos)' : 'PRO (100 créditos)';
      toast({
        title: "Créditos Esgotados",
        description: `Você atingiu o limite do seu plano ${planName}. Faça upgrade ou aguarde a renovação mensal.`,
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }
    
    setSelectedModule(moduleToUse);
    setShowModuleSelection(false);
    setShowChat(true);
    
    // Reinicia a conversa com a mensagem específica do módulo selecionado
    setThreadId(null);
    setMessages([]);
    setIsFirstMessageAutomatic(false); // Resetar flag
    
    // Registrar log do início da consulta
    if (currentUser?.uid && currentUser?.name) {
      logStartConsultation(currentUser.uid, currentUser.name, moduleToUse.title);
    }
    
    // Enviar mensagem automática de "olá" imediatamente após selecionar módulo
    sendAutomaticHelloMessage(moduleToUse);
  };
  
  // Função para enviar mensagem automática de "olá" sem cobrança de créditos
  const sendAutomaticHelloMessage = async (module: Module) => {
    if (!currentUser?.uid || !module.assistantId) return;
    
    try {
      setIsLoading(true);
      setIsFirstMessageAutomatic(true);
      
      // Criar balão inicial vazio da IA IMEDIATAMENTE
      const emptyAssistantMessage = {
        role: 'assistant' as const,
        content: '',
        timestamp: new Date()
      };
      setMessages([emptyAssistantMessage]);
      setIsStreaming(true); // Ativar streaming imediatamente
      
      // Preparar callbacks para streaming
      let fullResponse = '';
      let currentThreadId = threadId;
      
      const streamingCallbacks = {
        onStart: (newThreadId: string) => {
          currentThreadId = newThreadId;
          setThreadId(newThreadId);
          setIsWaitingResponse(false);
          // Não precisamos criar balão aqui, já foi criado antes
        },
        onChunk: (chunk: string) => {
          fullResponse += chunk;
          setCurrentStreamingContent(fullResponse);
          streamingContentRef.current = fullResponse;
        },
        onDone: (finalContent: string, finalThreadId: string) => {
          setThreadId(finalThreadId);
          setIsStreaming(false);
          setCurrentStreamingContent('');
          streamingContentRef.current = '';
          
          // Atualizar a mensagem existente com o conteúdo final
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === 'assistant') {
              updatedMessages[updatedMessages.length - 1] = {
                ...updatedMessages[updatedMessages.length - 1],
                content: finalContent
              };
            }
            return updatedMessages;
          });
        },
        onError: (error: string) => {
          console.error('Erro no streaming automático:', error);
          setIsStreaming(false);
          setIsWaitingResponse(false);
          // Não mostrar toast de erro para mensagem automática
        }
      };
      
      // Usar sendMessageStreaming do openai.ts (importação já existe)
      await sendMessageStreaming(
        [{ role: 'user', content: 'Olá' }],
        selectedPatient,
        currentThreadId,
        module.assistantId,
        streamingCallbacks,
        currentUser.uid
      );
      
    } catch (error) {
      console.error('Erro ao enviar mensagem automática:', error);
      setIsFirstMessageAutomatic(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para voltar para a seleção de módulos
  const backToModuleSelection = () => {
    setShowChat(false);
    setShowModuleSelection(true);
    setSelectedPatient(null);
    setThreadId(null);
    setMessages([]);
    setIsFirstMessageAutomatic(false); // Resetar flag
  };
  
  // Função para processar áudio gravado
  const handleAudioRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      setIsLoading(true);
      
      // Criar FormData para envio do áudio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Enviar áudio para transcrição
      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erro na transcrição do áudio');
      }
      
      const result = await response.json();
      
      if (result.success && result.data.transcription) {
        const transcription = result.data.transcription;
        
        // Debug: verificar duração
        console.log('🎵 Audio duration received:', duration, 'seconds');
        
        // Criar mensagem do usuário com dados de áudio para exibir no chat
        const userMessage: Message = { 
          role: 'user', 
          content: transcription, // O texto será usado para enviar à IA
          audioData: {
            audioBlob: audioBlob,
            duration: duration,
            transcription: transcription
          }
        };
        
        // Adicionar mensagem com áudio ao chat
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setIsLoading(true);
        
        // Registrar log do envio da mensagem
        if (currentUser?.uid && currentUser?.name) {
          logSendMessage(currentUser.uid, currentUser.name, selectedPatient?.name || 'Sem paciente', transcription.length);
        }
        
        // Enviar a transcrição para a IA (nos bastidores)
        await processAudioTranscription(transcription, updatedMessages);
        
      } else {
        throw new Error('Falha na transcrição');
      }
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      toast({
        title: "Erro no áudio",
        description: error.message || "Não foi possível processar o áudio",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para processar a transcrição de áudio e enviar para a IA
  const processAudioTranscription = async (transcription: string, updatedMessages: Message[]) => {
    try {
      // Adicionar mensagem temporária da IA imediatamente
      const tempAssistantMessage: Message = { 
        role: 'assistant', 
        content: '' 
      };
      
      const messagesWithTemp = [
        ...updatedMessages,
        tempAssistantMessage
      ];
      
      setMessages(messagesWithTemp);
      setIsStreaming(true);
      setCurrentStreamingContent('');
      streamingContentRef.current = '';
      
      let finalMessages: Message[] = [];
      
      // Usar o streaming para receber a resposta em tempo real
      await sendMessageStreaming(
        updatedMessages, 
        selectedPatient, 
        threadId, 
        selectedModule?.assistantId,
        {
          onStart: (responseThreadId) => {
            if (responseThreadId && threadId !== responseThreadId) {
              setThreadId(responseThreadId);
            }
            streamingContentRef.current = '';
            setCurrentStreamingContent('');
          },
          onChunk: (chunk) => {
            // Acumular conteúdo
            streamingContentRef.current = streamingContentRef.current + chunk;
            setCurrentStreamingContent(streamingContentRef.current);
            
            // Atualizar mensagem em tempo real
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: streamingContentRef.current
                };
              }
              return newMessages;
            });
          },
          onDone: (fullContent, responseThreadId) => {
            setIsStreaming(false);
            setCurrentStreamingContent('');
            streamingContentRef.current = '';
            
            // Garantir mensagem final
            finalMessages = [
              ...updatedMessages,
              { role: 'assistant', content: fullContent }
            ];
            
            setMessages(finalMessages);
            
            // Salvar threadId
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
      
      // Salvar a conversa no Firestore
      if (selectedPatient?.id && currentUser?.uid) {
        try {
          const messagesToSave = finalMessages.map(msg => ({
            ...msg,
            timestamp: new Date()
          }));
          
          // Salvar a consulta no Firestore
          await saveConsultation({
            userId: currentUser.uid,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            threadId: threadId || 'unknown',
            messages: messagesToSave,
            status: 'active'
          });
        } catch (saveError) {
          console.error("Erro ao salvar consulta no Firestore:", saveError);
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar transcrição:', error);
      toast({
        title: "Erro na consulta",
        description: error.message || "Não foi possível processar a consulta",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    }
  };

  const resetConversation = () => {
    // Limpa o ID da thread para começar uma nova conversa
    setThreadId(null);
    
    // Reinicia a conversa com array vazio (sem mensagem inicial)
    setMessages([]);
    
    setCurrentMessage('');
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMessage.trim() || isLoading) return;
    
    // Verificar créditos antes de processar
    if (!canUseCredits()) {
      const planName = getSubscriptionPlan() === 'freemium' ? 'Freemium (5 créditos)' : 'PRO (100 créditos)';
      toast({
        title: "Créditos Esgotados",
        description: `Você atingiu o limite do seu plano ${planName}. Faça upgrade ou aguarde a renovação mensal.`,
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }

    // Consumir um crédito na primeira mensagem do chat OU quando forçado por nova conversa
    // Mas NÃO consumir se a primeira mensagem foi automática
    const isFirstMessage = messages.length === 0;
    const isFirstUserMessage = isFirstMessage && !isFirstMessageAutomatic;
    const shouldConsumeCredit = isFirstUserMessage || forceNewCredit;
    
    if (shouldConsumeCredit) {
      try {
        if (currentUser?.uid) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            creditsUsed: increment(1),
            lastCreditUsed: new Date().toISOString()
          });
          // Resetar flag após consumir crédito
          if (forceNewCredit) {
            setForceNewCredit(false);
          }
          // Atualizar dados do usuário em tempo real
          await refreshUserData();
        }
      } catch (creditError) {
        console.error('Erro ao consumir crédito:', creditError);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar créditos.",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
        return;
      }
    }
    
    // Cancelar requisição anterior se existir
    if (abortController) {
      abortController.abort();
    }
    
    // Criar novo AbortController para esta requisição
    const newController = new AbortController();
    setAbortController(newController);
    
    // Adiciona a mensagem do usuário
    const userMessage: Message = { 
      role: 'user', 
      content: currentMessage 
    };
    const updatedMessages = [
      ...messages,
      userMessage
    ];
    
    setMessages(updatedMessages);
    setCurrentMessage('');
    setIsLoading(true);
    
    // Registrar log do envio da mensagem
    if (currentUser?.uid && currentUser?.name) {
      logSendMessage(currentUser.uid, currentUser.name, selectedPatient?.name || 'Sem paciente', currentMessage.length);
    }
    
    try {
      // Adicionar mensagem vazia da IA imediatamente
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: '' 
      };
      
      const messagesWithAssistant = [...updatedMessages, assistantMessage];
      setMessages(messagesWithAssistant);
      setIsStreaming(true);
      setCurrentStreamingContent('');
      streamingContentRef.current = '';
      
      let finalMessages: Message[] = [];
      
      // Usar o streaming para receber a resposta em tempo real
      await sendMessageStreaming(
        updatedMessages, 
        selectedPatient, 
        threadId, 
        selectedModule?.assistantId,
        {
          onStart: (responseThreadId) => {
            streamingContentRef.current = '';
            setCurrentStreamingContent('');
            if (responseThreadId && threadId !== responseThreadId) {
              setThreadId(responseThreadId);
            }
          },
          onChunk: (chunk) => {
            // Acumular conteúdo
            streamingContentRef.current = streamingContentRef.current + chunk;
            setCurrentStreamingContent(streamingContentRef.current);
            
            // Atualizar mensagem em tempo real
            setMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: streamingContentRef.current
                };
              }
              return newMessages;
            });
          },
          onDone: (fullContent, responseThreadId) => {
            setIsStreaming(false);
            setCurrentStreamingContent('');
            streamingContentRef.current = '';
            
            // Garantir mensagem final
            finalMessages = [
              ...updatedMessages,
              { role: 'assistant', content: fullContent }
            ];
            
            setMessages(finalMessages);
            
            // Salvar threadId
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
      
      // Salvar a conversa no Firestore
      if (selectedPatient?.id && currentUser?.uid) {
        try {
          const messagesToSave = finalMessages.map(msg => ({
            ...msg,
            timestamp: new Date()
          }));
          
          // Salvar a consulta no Firestore
          await saveConsultation({
            userId: currentUser.uid,
            patientId: selectedPatient?.id || 'sem-paciente',
            patientName: selectedPatient?.name || 'Sem paciente',
            threadId: threadId || 'unknown',
            messages: messagesToSave,
            status: 'active'
          });
        } catch (saveError) {
          console.error("Erro ao salvar consulta no Firestore:", saveError);
          // Não mostrar erro para o usuário para não interromper o fluxo da conversa
        }
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      // Limpar AbortController em caso de erro
      setAbortController(null);
      
      // Se o erro não for de cancelamento, mostrar erro
      if (error.name !== 'AbortError') {
        toast({
          title: "Erro na conversa",
          description: "Não foi possível enviar sua mensagem. Tente novamente.",
          variant: "default",
          className: "bg-red-500 text-white border-red-600"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar mensagem no chat do Prontuário Blindado e Exames Laboratoriais
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    // Verificar créditos antes de processar
    if (!canUseCredits()) {
      const planName = getSubscriptionPlan() === 'freemium' ? 'Freemium (5 créditos)' : 'PRO (100 créditos)';
      toast({
        title: "Créditos Esgotados",
        description: `Você atingiu o limite do seu plano ${planName}. Faça upgrade ou aguarde a renovação mensal.`,
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }

    // Consumir um crédito apenas na primeira mensagem manual do chat (não automática)
    const isFirstManualMessage = messages.length > 0 && isFirstMessageAutomatic;
    if (isFirstManualMessage) {
      // Se a primeira mensagem foi automática, cobrar na segunda (primeira manual)
      setIsFirstMessageAutomatic(false); // Resetar flag após primeira mensagem manual
      try {
        if (currentUser?.uid) {
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            creditsUsed: increment(1),
            lastCreditUsed: new Date().toISOString()
          });
          // Atualizar dados do usuário em tempo real
          await refreshUserData();
        }
      } catch (creditError) {
        console.error('Erro ao consumir crédito:', creditError);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar créditos.",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
        return;
      }
    }
    
    // Adiciona a mensagem do usuário
    const userMessage: Message = { 
      role: 'user', 
      content: inputMessage 
    };
    const updatedMessages = [
      ...messages,
      userMessage
    ];
    
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);
    
    // Registrar log do envio da mensagem
    if (currentUser?.uid && currentUser?.name) {
      logSendMessage(currentUser.uid, currentUser.name, selectedPatient?.name || 'Sem paciente', inputMessage.length);
    }
    
    try {
      // Adicionar mensagem vazia da IA imediatamente
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: '' 
      };
      
      const messagesWithAssistant = [...updatedMessages, assistantMessage];
      setMessages(messagesWithAssistant);
      setIsWaitingResponse(true);
      setIsStreaming(false);
      setCurrentStreamingContent('');
      streamingContentRef.current = '';
      
      // Criar callbacks de streaming unificados
      const streamCallbacks = {
        onStart: (responseThreadId: string) => {
          streamingContentRef.current = '';
          setCurrentStreamingContent('');
          if (responseThreadId && threadId !== responseThreadId) {
            setThreadId(responseThreadId);
          }
          setIsWaitingResponse(false);
          setIsStreaming(true);
        },
        onChunk: (chunk: string) => {
          // Acumular conteúdo
          streamingContentRef.current = streamingContentRef.current + chunk;
          setCurrentStreamingContent(streamingContentRef.current);
          
          // Atualizar mensagem em tempo real
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: streamingContentRef.current
              };
            }
            return newMessages;
          });
        },
        onDone: (fullContent: string, responseThreadId: string) => {
          setIsStreaming(false);
          setCurrentStreamingContent('');
          streamingContentRef.current = '';
          
          // Garantir mensagem final
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: fullContent
              };
            }
            return newMessages;
          });
          
          // Salvar threadId
          if (responseThreadId && threadId !== responseThreadId) {
            setThreadId(responseThreadId);
          }
        },
        onError: (error: string) => {
          setIsWaitingResponse(false);
          setIsStreaming(false);
          setCurrentStreamingContent('');
          streamingContentRef.current = '';
          throw new Error(error);
        }
      };
      
      // Usar o streaming para receber a resposta em tempo real
      await sendMessageStreaming(
        updatedMessages, 
        selectedPatient, 
        threadId, 
        selectedModule?.assistantId,
        streamCallbacks
      );
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      // Adicionar mensagem de erro
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col h-screen p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            {!showModuleSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowChat(false);
                  setShowModuleSelection(true);
                  setSelectedModule(null);
                  setMessages([]);
                  setSelectedPatient(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {showModuleSelection ? "Selecione um módulo para começar" : (selectedModule?.title || "Consulta Nutricional")}
            </h1>
          </div>
          
          {/* Botão Nova Conversa no header */}
          {!showModuleSelection && selectedModule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔄 BOTÃO NOVA CONVERSA CLICADO - CANCELANDO REQUISIÇÕES E LIMPANDO CHAT');
                
                // 1. CANCELAR REQUISIÇÕES EM ANDAMENTO
                if (abortController) {
                  console.log('🚫 Cancelando requisição em andamento...');
                  abortController.abort();
                  setAbortController(null);
                }
                
                // 2. RESETAR TODOS OS ESTADOS
                setMessages([]);
                setThreadId(null);
                setCurrentMessage('');
                setIsLoading(false);
                setCurrentStreamingContent('');
                streamingContentRef.current = '';
                setIsStreaming(false);
                setForceNewCredit(true); // FORÇAR NOVA COBRANÇA
                setIsFirstMessageAutomatic(false); // Resetar flag
                
                // 3. ADICIONAR MENSAGEM DE BOAS-VINDAS
                setTimeout(() => {
                  if (selectedModule) {
                    const welcomeMsg = {
                      role: 'assistant' as const,
                      content: `🆕 **Nova conversa iniciada!**\n\n**Módulo:** ${selectedModule.title}\n\nComo posso ajudar você?`
                    };
                    setMessages([welcomeMsg]);
                  }
                }, 100);
                
                toast({
                  title: "Chat limpo!",
                  description: "Nova conversa iniciada. Próxima mensagem será cobrada.",
                  className: "bg-blue-500 text-white border-blue-600"
                });
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Nova Conversa
            </Button>
          )}
        </div>

        {/* Área de seleção de módulos */}
        {showModuleSelection && (
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isLoadingModules ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <Card 
                    key={module.id}
                    className={`cursor-pointer transition-all duration-300 h-full flex flex-col ${
                      !module.enabled 
                        ? 'opacity-60 grayscale hover:opacity-70 border-dashed' 
                        : 'hover:shadow-md transform hover:-translate-y-1'
                    }`}
                    onClick={() => {
                      if (module.enabled) {
                        startConsultation(module);
                      } else {
                        toast({
                          title: "Módulo desativado",
                          description: `O módulo ${module.title} está desativado. Entre em contato com o administrador para ativá-lo.`,
                        });
                      }
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-primary/10 rounded-lg">{module.icon}</div>
                        <div className="flex flex-col items-end gap-1">
                          {/* Badge do tier */}
                          {(module as any).tier && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              (module as any).tier === 'Free' 
                                ? 'bg-gray-100 text-gray-700' 
                                : (module as any).tier === 'PRO' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {(module as any).tier}
                            </span>
                          )}
                          {/* Badge de status */}
                          {module.enabled ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                              Desativado
                            </span>
                          )}
                        </div>
                      </div>
                      <CardTitle className="mt-4 text-xl">{module.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-gray-600 text-sm">{module.description}</p>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-end">
                      {module.enabled ? (
                        <Button variant="ghost" size="sm" className="text-primary">
                          Selecionar <MoveRight className="ml-1 h-4 w-4" />
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Aguardando ativação</p>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Área do módulo Exames Laboratoriais - upload inicial ou chat */}
        {showChat && selectedModule?.id === 'exames-laboratoriais' && (
          <motion.div 
            className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Exibir apenas upload se não houver mensagens */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col justify-center items-center p-8">
                {isLoading ? (
                  <LoadingIndicator type="document" />
                ) : (
                  <div className="text-center space-y-6 max-w-2xl">
                    <div className="mb-8">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293L16.707 6.707A1 1 0 0117 7.414V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Interpretação de Exames Laboratoriais</h2>
                      <p className="text-gray-600 text-lg">
                        Faça upload do exame para começar a análise inteligente
                      </p>
                    </div>
                    
                    {/* Área de upload destacada */}
                    <div className="w-full">
                      <FileUploadOCR
                        onTextExtracted={(text, fileName, attachmentMeta) => {
                          handleTextExtracted(text, fileName, attachmentMeta);
                        }}
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* Instruções complementares */}
                    <div className="bg-blue-50 rounded-lg p-4 text-left">
                      <h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Aceita arquivos PDF, JPEG, PNG, GIF e WEBP</li>
                        <li>• O sistema extrairá automaticamente o texto do exame</li>
                        <li>• A IA fornecerá interpretação detalhada dos resultados</li>
                        <li>• Recomendações nutricionais personalizadas serão geradas</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Exibir chat após upload */}
            {messages.length > 0 && (
              <>
                {/* Área de mensagens com scroll */}
                <div className="flex-1 overflow-auto p-6 pb-6 bg-gray-50">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((message, index) => {
                      const isLast = index === messages.length - 1;
                      const isAIMessage = message.role === 'assistant';
                      
                      // Use currentStreamingContent state (not ref)
                      const streamContent = isStreaming && isLast && isAIMessage 
                        ? currentStreamingContent 
                        : undefined;
                      
                      // Key estável - não muda durante streaming para evitar "piscar"
                      const messageKey = `msg-${index}-${message.role}`;
                      
                      return (
                        <ChatMessage 
                          key={messageKey} 
                          message={message} 
                          isLast={isLast} 
                          isStreaming={isStreaming && isLast && isAIMessage}
                          streamingContent={streamContent}
                          conversationHistory={messages}
                        />
                      );
                    })}
                    
                    {/* Indicador de carregamento */}
                    {isWaitingResponse && (
                      <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg animate-pulse">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-gray-600 text-sm">IA pensando...</span>
                      </div>
                    )}
                    {/* DEBUG: Visualizar streaming em tempo real */}
                    {isStreaming && currentStreamingContent && (
                      <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg mx-auto max-w-4xl">
                        <div className="text-xs font-mono text-yellow-800 mb-1">DEBUG: Streaming Content ({currentStreamingContent.length} chars)</div>
                        <div className="text-sm text-gray-800 debug-streaming-content whitespace-pre-wrap">{currentStreamingContent}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Área de input de chat */}
                <div className="border-t bg-white p-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Digite sua pergunta sobre o exame..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={handleSendMessage}
                          disabled={isLoading || !inputMessage.trim()}
                          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                        <FileUploadOCR
                          onTextExtracted={(text, fileName, attachmentMeta) => {
                            handleTextExtracted(text, fileName, attachmentMeta);
                          }}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Área do módulo Prontuário Blindado - gravação inicial ou chat */}
        {showChat && selectedModule?.id === 'Prontuário Blindado' && (
          <motion.div 
            className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Exibir apenas gravador se não houver mensagens */}
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col justify-center items-center p-8">
                {isLoading ? (
                  <LoadingIndicator type="audio" />
                ) : (
                  <div className="text-center space-y-6 max-w-2xl w-full">
                    <div className="mb-8">
                      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Prontuário Blindado</h2>
                      <p className="text-gray-600 text-lg">
                        Máxima privacidade e segurança para suas informações médicas
                      </p>
                    </div>
                    
                    {/* Gravador de áudio com botões de ação */}
                    <ProntuarioBlindadoRecorder 
                      onSendRecording={async (audioBlob) => {
                        setIsLoading(true);
                        try {
                          // Transcrever o áudio
                          const formData = new FormData();
                          formData.append('audio', audioBlob, 'recording.webm');
                          
                          const transcriptionResponse = await fetch('/api/audio/transcribe', {
                            method: 'POST',
                            body: formData,
                          });
                          
                          if (!transcriptionResponse.ok) {
                            throw new Error('Erro na transcrição');
                          }
                          
                          const transcriptionData = await transcriptionResponse.json();
                          const transcription = transcriptionData.data?.transcription || '';
                          
                          if (!transcription.trim()) {
                            throw new Error('Não foi possível transcrever o áudio');
                          }
                          
                          // Adicionar mensagem do usuário com player de áudio
                          const newUserMessage = {
                            role: 'user' as const,
                            content: transcription, // Apenas a transcrição limpa
                            audioData: {
                              audioBlob: audioBlob,
                              duration: 0, // Será calculado pelo componente
                              transcription: transcription
                            },
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, newUserMessage]);
                          
                          // Usar o assistante específico para Prontuário Blindado
                          const assistantId = selectedModule?.id === 'Prontuário Blindado' 
                            ? 'asst_j2C99aw2KyGDImkNPYcDURYT' 
                            : selectedModule?.assistantId;
                          
                          // Usar streaming para resposta da IA
                          let fullResponse = '';
                          let currentThreadId = threadId;
                          
                          const streamingCallbacks = {
                            onStart: (newThreadId: string) => {
                              currentThreadId = newThreadId;
                              setThreadId(newThreadId);
                            },
                            onChunk: (chunk: string) => {
                              fullResponse += chunk;
                              // Atualizar mensagem em tempo real de forma mais suave
                              setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage && lastMessage.role === 'assistant') {
                                  // Atualizar a última mensagem diretamente
                                  lastMessage.content = fullResponse;
                                  return [...prev];
                                } else {
                                  // Criar nova mensagem do assistente uma única vez
                                  return [...prev, {
                                    role: 'assistant' as const,
                                    content: fullResponse,
                                    timestamp: new Date()
                                  }];
                                }
                              });
                            },
                            onDone: (finalContent: string, finalThreadId: string) => {
                              setThreadId(finalThreadId);
                              // Finalizar o streaming
                              setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage && lastMessage.role === 'assistant') {
                                  lastMessage.content = finalContent;
                                  return [...prev];
                                }
                                return prev;
                              });
                            },
                            onError: (error: string) => {
                              console.error('Erro no streaming:', error);
                              throw new Error(error);
                            }
                          };
                          
                          // Usar sendMessageStreaming do openai.ts
                          await sendMessageStreaming(
                            [{ role: 'user', content: transcription }],
                            selectedPatient,
                            currentThreadId,
                            assistantId,
                            streamingCallbacks,
                            currentUser?.uid
                          );
                          
                        } catch (error) {
                          console.error('Erro ao processar gravação:', error);
                          // Adicionar mensagem de erro
                          const errorMessage = {
                            role: 'assistant' as const,
                            content: 'Desculpe, ocorreu um erro ao processar sua gravação. Tente novamente.',
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, errorMessage]);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Exibir chat após processamento da gravação */}
            {messages.length > 0 && (
              <>
                {/* Área de mensagens com scroll */}
                <div className="flex-1 overflow-auto p-6 pb-6 bg-gray-50">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((message, index) => (
                      <ChatMessage 
                        key={index} 
                        message={message} 
                        isLast={index === messages.length - 1} 
                        isStreaming={index === messages.length - 1 && message.role === 'assistant' && isStreaming}
                        conversationHistory={messages}
                      />
                    ))}
                    {/* Indicador de carregamento */}
                    {isWaitingResponse && (
                      <div className="flex items-center gap-2 p-4 bg-gray-100 rounded-lg animate-pulse">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-gray-600 text-sm">IA pensando...</span>
                      </div>
                    )}


                  </div>
                </div>

                {/* Área de input de chat com gravador adicional */}
                <div className="border-t bg-white p-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Digite sua pergunta ou grave um novo áudio..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={handleSendMessage}
                          disabled={isLoading || !inputMessage.trim()}
                          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                        <AudioRecorder
                          onAudioRecorded={handleAudioRecorded}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Área do chat normal para outros módulos */}
        {showChat && selectedModule?.id !== 'Prontuário Blindado' && selectedModule?.id !== 'exames-laboratoriais' && (
          <motion.div 
            className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Área de mensagens - ocupa todo o espaço disponível */}
            <div className="flex-1 overflow-auto p-6 pb-6 bg-gray-50 dark:bg-gray-900">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                        <div className="text-gray-400 mb-3">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {selectedModule?.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Digite <span className="font-semibold text-primary">"Oi"</span> para iniciar a interação
                        </p>
                        {selectedPatient && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Paciente: {selectedPatient.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {messages.map((message, index) => {
                  const isLast = index === messages.length - 1;
                  const isAIMessage = message.role === 'assistant';
                  
                  return (
                    <ChatMessage 
                      key={index} 
                      message={message} 
                      isLast={isLast} 
                      isStreaming={isStreaming && isLast && isAIMessage}
                      streamingContent={
                        isStreaming && isLast && isAIMessage 
                          ? currentStreamingContent 
                          : undefined
                      }
                      conversationHistory={messages}
                      onNewConversation={handleNewConversation}
                    />
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Área de upload de arquivos (aparece apenas quando solicitado) */}
            {showUploadArea && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                <FileUploadOCR
                  onTextExtracted={(text, fileName, attachmentMeta) => {
                    handleTextExtracted(text, fileName, attachmentMeta);
                    setShowUploadArea(false); // Fechar área após upload
                  }}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Input de mensagem */}
            <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 h-12"
                  />
                  <div className="flex space-x-2">
                    {/* Gravador de áudio */}
                    <AudioRecorder
                      onAudioRecorded={handleAudioRecorded}
                      disabled={isLoading}
                    />
                    
                    {/* Botão de anexar */}
                    <Button 
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => setShowUploadArea(!showUploadArea)}
                      className="h-12 w-12 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800"
                    >
                      <Paperclip size={18} />
                    </Button>
                  
                    <Button 
                      type="submit" 
                      disabled={isLoading || !currentMessage.trim()}
                      className="bg-primary hover:bg-primaryDark h-12"
                    >
                      {isLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Send size={18} />
                      )}
                    </Button>
                  </div>
                </form>
                

                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Preskriptor é uma ferramenta de apoio e educação médica. A decisão final da prescrição é sempre do médico.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      {/* Diálogo para mostrar a receita gerada */}
      <Dialog open={showReceitaDialog} onOpenChange={setShowReceitaDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receita Gerada</DialogTitle>
            <DialogDescription>
              Receita para {selectedPatient?.name || 'paciente'} gerada com base na consulta.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border rounded-lg p-4 max-h-[60vh] overflow-auto">
            <div className="prose prose-sm prose-blue max-w-none">
              <ReactMarkdown>{receitaGerada}</ReactMarkdown>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between mt-4">
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setShowReceitaDialog(false)}>
                Fechar
              </Button>
              <Button 
                variant="outline"
                className="border-blue-500 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={irParaPaginaReceitas}
              >
                <FileText className="mr-2 h-4 w-4" />
                Salvar como Receita
              </Button>
            </div>
            <Button 
              variant="default"
              className="bg-primary hover:bg-primaryDark"
              onClick={() => {
                // Implementar impressão direta
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Receita - ${selectedPatient?.name || 'Paciente'}</title>
                      <style>
                        body {
                          font-family: Arial, sans-serif;
                          line-height: 1.6;
                          max-width: 800px;
                          margin: 0 auto;
                          padding: 20px;
                        }
                        .header {
                          text-align: center;
                          margin-bottom: 20px;
                          padding-bottom: 10px;
                          border-bottom: 1px solid #ccc;
                        }
                        .header h1 {
                          color: #2563eb;
                          margin-bottom: 5px;
                        }
                        .content {
                          margin-bottom: 40px;
                        }
                        .footer {
                          margin-top: 40px;
                          text-align: center;
                          border-top: 1px solid #ccc;
                          padding-top: 20px;
                        }
                        .signature {
                          margin-top: 60px;
                          text-align: center;
                        }
                        @media print {
                          .no-print {
                            display: none;
                          }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>Prescrição Nutricional</h1>
                        <p>Dr(a). ${currentUser?.name || currentUser?.displayName || ''}</p>
                        <p>CRN: ${currentUser?.crm || '------'}</p>
                        <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                      </div>
                      
                      <div class="patient">
                        <p><strong>Paciente:</strong> ${selectedPatient?.name || ''}</p>
                      </div>
                      
                      <div class="content">
                        ${receitaGerada.replace(/\n/g, '<br>')}
                      </div>
                      
                      <div class="signature">
                        ________________________________<br>
                        ${currentUser?.name || currentUser?.displayName || ''}<br>
                        Nutricionista - CRN ${currentUser?.crm || '------'}
                      </div>
                      
                      <div class="footer">
                        <button class="no-print" onclick="window.print()">Imprimir</button>
                      </div>
                    </body>
                    </html>
                  `);
                  printWindow.document.close();
                  setTimeout(() => {
                    printWindow.print();
                  }, 500);
                }
              }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog para adicionar novo paciente */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados do paciente para criar um novo registro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Nome do paciente"
                value={newPatientData.name}
                onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cellphone">Telefone</Label>
              <Input
                id="cellphone"
                placeholder="(00) 00000-0000"
                value={newPatientData.cellphone}
                onChange={(e) => setNewPatientData({...newPatientData, cellphone: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPatientDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePatient} 
              disabled={isSavingPatient || !newPatientData.name || !newPatientData.email}
              className="bg-primary hover:bg-primaryDark"
            >
              {isSavingPatient ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : null}
              Adicionar Paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
};

export default ConsultaPage;