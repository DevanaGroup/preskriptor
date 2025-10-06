import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, TypingIndicator } from '@/components/ChatMessage';
import { Message, sendMessage } from '@/lib/openai';
import { FileUploadOCR } from '@/components/FileUploadOCR';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Send, RefreshCw, User, Plus, FileText, Apple, MoveRight, ArrowLeft, Paperclip } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import { collection, query, where, getDocs, Timestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
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
import { Pill, Weight, Stethoscope, HeartPulse, Brain, Salad, Printer } from 'lucide-react';
import { useModuleConfig, ModuleConfig } from '@/hooks/useModuleConfig';
import { useLocation } from 'wouter';
import ReactMarkdown from 'react-markdown';

// Interface para módulos na tela de consulta
interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  assistantId: string;
  enabled: boolean;
  comingSoon?: boolean;
}

// Lista de ícones para os módulos
const moduleIcons: Record<string, React.ReactNode> = {
  'obesidade': <Weight className="h-10 w-10 text-primary" />,
  'obesidade-sobrepeso': <Weight className="h-10 w-10 text-primary" />,
  'hormonal-fem': <HeartPulse className="h-10 w-10 text-primary" />,
  'terapia-hormonal-feminina': <HeartPulse className="h-10 w-10 text-primary" />,
  'hormonal-masc': <HeartPulse className="h-10 w-10 text-primary" />,
  'terapia-hormonal-masculina': <HeartPulse className="h-10 w-10 text-primary" />,
  'pre-diabetes': <Apple className="h-10 w-10 text-primary" />,
  'diabetes': <Apple className="h-10 w-10 text-primary" />,
  'exames': <FileText className="h-10 w-10 text-primary" />,
  'vitaminas': <Pill className="h-10 w-10 text-primary" />,
  'exames-hormonais': <Brain className="h-10 w-10 text-primary" />
};

// Lista padrão de módulos (será substituída pelas configurações do Firestore)
const modulesList: Module[] = [
  {
    id: 'obesidade-sobrepeso',
    title: 'Obesidade e Sobrepeso',
    description: 'Prescrições para tratamento de obesidade e sobrepeso com foco em emagrecimento saudável',
    icon: <Weight className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  },
  {
    id: 'terapia-hormonal-feminina',
    title: 'Terapia Hormonal Feminina',
    description: 'Abordagem nutricional para equilíbrio hormonal feminino e questões relacionadas',
    icon: <Stethoscope className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  },
  {
    id: 'terapia-hormonal-masculina',
    title: 'Terapia Hormonal Masculina',
    description: 'Orientações nutricionais para otimização hormonal masculina',
    icon: <HeartPulse className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  },
  {
    id: 'pre-diabetes',
    title: 'Pré-Diabetes',
    description: 'Intervenções nutricionais para prevenir a progressão para diabetes tipo 2',
    icon: <Pill className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  },
  {
    id: 'diabetes-tipo-2',
    title: 'Diabetes Tipo 2',
    description: 'Planos alimentares para controle glicêmico e manejo do diabetes',
    icon: <Pill className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  },
  {
    id: 'exames-laboratoriais',
    title: 'Interpretação de Exames Laboratoriais',
    description: 'Análise e orientação nutricional baseada em resultados de exames',
    icon: <FileText className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  },
  {
    id: 'reposicao-vitaminas-minerais',
    title: 'Reposição de Vitaminas e Minerais',
    description: 'Orientações para correção de deficiências nutricionais',
    icon: <Apple className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  },
  {
    id: 'exames-hormonais',
    title: 'Interpretação Avançada de Exames Hormonais',
    description: 'Análise detalhada de perfis hormonais e recomendações nutricionais personalizadas',
    icon: <Brain className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false
  }
];

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
  

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  

  

  
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
    console.log('🔍 handleTextExtracted chamado:', { 
      extractedText: extractedText.substring(0, 50) + '...', 
      fileName, 
      hasAttachmentMeta: !!attachmentMeta, 
      attachmentMeta 
    });
    
    // Registrar log do upload de arquivo
    if (currentUser?.uid && currentUser?.name) {
      logFileUpload(currentUser.uid, currentUser.name, fileName, 'OCR');
    }
    
    // Verificar se um paciente está selecionado antes de enviar
    if (!selectedPatient) {
      toast({
        title: 'Selecione um paciente',
        description: 'Por favor, selecione um paciente antes de enviar o arquivo.',
        variant: 'destructive',
      });
      // Apenas preenche a caixa de texto se não houver paciente selecionado
      setCurrentMessage(prev => prev ? `${prev}\n\n${extractedText}` : extractedText);
      return;
    }

    // Se há paciente selecionado, enviar automaticamente
    const messageText = extractedText;
    
    // Adiciona a mensagem do usuário
    let userMessage: Message;

    if (attachmentMeta && attachmentMeta.type === 'ocr_attachment') {
      console.log('✅ Criando mensagem com attachment');
      // Criar mensagem especial para attachment OCR
      userMessage = {
        role: 'user',
        content: messageText, // Conteúdo real para o GPT
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

    console.log('📝 Mensagem criada:', { 
      hasAttachment: !!userMessage.attachment, 
      fileName: userMessage.attachment?.fileName 
    });

    const updatedMessages = [
      ...messages,
      userMessage
    ];
    
    setMessages(updatedMessages);
    setCurrentMessage('');
    setIsLoading(true);
    
    // Registrar log do envio da mensagem
    if (currentUser?.uid && currentUser?.name) {
      logSendMessage(currentUser.uid, currentUser.name, selectedPatient.name, messageText.length);
    }
    
    try {
      // Envia a mensagem para a API usando o serviço de OpenAI com informações do paciente e threadId
      const chatResponse = await sendMessage(updatedMessages, selectedPatient, threadId, selectedModule?.assistantId);
      
      // Salvar o threadId para continuidade da conversa
      const responseThreadId = chatResponse.threadId || threadId;
      if (responseThreadId && threadId !== responseThreadId) {
        setThreadId(responseThreadId);
      }
      
      // Criar a mensagem de resposta da IA
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: chatResponse.response 
      };
      
      // Adiciona a resposta da IA à conversa
      const finalMessages = [
        ...updatedMessages,
        assistantMessage
      ];
      
      setMessages(finalMessages);
      
      // Salvar a conversa no Firestore
      if (selectedPatient.id && currentUser?.uid) {
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
            threadId: responseThreadId || 'unknown',
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
      toast({
        title: 'Erro na consulta',
        description: error.message || 'Não foi possível obter resposta da IA. Tente novamente.',
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
        
        console.log(`Pacientes carregados: ${patientsList.length}`);
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
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }
    
    if (!newPatientData.name || !newPatientData.email || !newPatientData.cellphone) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
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
        variant: "destructive",
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
      // Combinar configurações do Firestore com a lista padrão
      const allModules = modulesList.map(defaultModule => {
        // Buscar configuração correspondente no Firestore
        const firestoreConfig = moduleConfigs.find(config => config.id === defaultModule.id);
        
        return {
          id: defaultModule.id,
          title: defaultModule.title,
          description: defaultModule.description,
          assistantId: firestoreConfig?.assistantId || '',
          enabled: firestoreConfig?.enabled || false, // Usar status do Firestore ou false como padrão
          icon: moduleIcons[defaultModule.id] || <FileText className="h-10 w-10 text-primary" />
        } as Module;
      }).sort((a, b) => {
        // Ativos primeiro
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;
        return 0;
      });
      
      console.log("Módulos carregados (todos):", allModules.length);
      console.log("Módulos ativos:", allModules.filter(m => m.enabled).length);
      setModules(allModules);
      
      setIsLoadingModules(false);
    }
  }, [currentUser?.uid, isLoadingModuleConfig, moduleConfigs]);
  
  // Função auxiliar para obter o ícone correto com base no ID do módulo
  const getModuleIcon = (moduleId: string) => {
    switch(moduleId) {
      case 'obesidade-sobrepeso':
        return <Weight className="h-10 w-10 text-primary" />;
      case 'terapia-hormonal-feminina':
      case 'terapia-hormonal-masculina':
        return <Stethoscope className="h-10 w-10 text-primary" />;
      case 'pre-diabetes':
      case 'diabetes-tipo-2':
        return <HeartPulse className="h-10 w-10 text-primary" />;
      case 'exames-hormonais':
        return <Brain className="h-10 w-10 text-primary" />;
      case 'reposicao-vitaminas-minerais':
        return <Apple className="h-10 w-10 text-primary" />;
      case 'exames-laboratoriais':
        return <FileText className="h-10 w-10 text-primary" />;
      default:
        return <Salad className="h-10 w-10 text-primary" />;
    }
  };

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
        variant: "destructive",
      });
      return;
    }
    
    setSelectedModule(moduleToUse);
    setShowModuleSelection(false);
    setShowChat(true);
    
    // Reinicia a conversa com a mensagem específica do módulo selecionado
    setThreadId(null);
    setMessages([]);
  };
  
  // Função para voltar para a seleção de módulos
  const backToModuleSelection = () => {
    setShowChat(false);
    setShowModuleSelection(true);
    setSelectedPatient(null);
    setThreadId(null);
    setMessages([]);
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
    
    // Verificar se um paciente está selecionado
    if (!selectedPatient) {
      toast({
        title: 'Selecione um paciente',
        description: 'Por favor, selecione um paciente antes de iniciar a consulta.',
        variant: 'destructive',
      });
      return;
    }
    
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
      logSendMessage(currentUser.uid, currentUser.name, selectedPatient.name, currentMessage.length);
    }
    
    try {
      // Envia a mensagem para a API usando o serviço de OpenAI com informações do paciente e threadId
      const chatResponse = await sendMessage(updatedMessages, selectedPatient, threadId, selectedModule?.assistantId);
      
      // Salvar o threadId para continuidade da conversa
      const responseThreadId = chatResponse.threadId || threadId;
      if (responseThreadId && threadId !== responseThreadId) {
        setThreadId(responseThreadId);
      }
      
      // Criar a mensagem de resposta da IA
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: chatResponse.response 
      };
      
      // Adiciona a resposta da IA à conversa
      const finalMessages = [
        ...updatedMessages,
        assistantMessage
      ];
      
      setMessages(finalMessages);
      
      // Salvar a conversa no Firestore
      if (selectedPatient.id && currentUser?.uid) {
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
            threadId: responseThreadId || 'unknown',
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
      toast({
        title: 'Erro na consulta',
        description: error.message || 'Não foi possível obter resposta da IA. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {showModuleSelection ? "Selecione o Tipo de Consulta" : (selectedModule?.title || "Consulta Nutricional")}
          </h1>

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
                        {!module.enabled && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            Desativado
                          </span>
                        )}
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

        {/* Área do chat */}
        {showChat && (
          <motion.div 
            className="bg-white shadow-sm border rounded-lg flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cabeçalho simplificado */}
            <div className="border-b px-4 py-3 bg-white">
              <div className="flex items-center space-x-3">
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
                <h1 className="text-lg font-medium text-gray-900">
                  Consulta Personalizada
                </h1>
              </div>
            </div>

            {/* Área de chat otimizada */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message, index) => (
                  <ChatMessage 
                    key={index} 
                    message={message} 
                    isLast={index === messages.length - 1} 
                  />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Área de upload de arquivos (aparece apenas quando solicitado) */}
            {showUploadArea && (
              <div className="border-t border-gray-200 p-3 bg-gray-50">
                <FileUploadOCR
                  onTextExtracted={(text, fileName, attachmentMeta) => {
                    handleTextExtracted(text, fileName, attachmentMeta);
                    setShowUploadArea(false); // Fechar área após upload
                  }}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Área de input otimizada */}
            <div className="border-t bg-white p-4">
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
                    {/* Botão de anexar */}
                    <Button 
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => setShowUploadArea(!showUploadArea)}
                      className="h-12 w-12 border-gray-300 hover:bg-gray-50"
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
                <p className="text-xs text-gray-500 text-center mt-2">
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