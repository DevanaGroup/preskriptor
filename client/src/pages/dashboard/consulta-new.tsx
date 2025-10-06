import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, TypingIndicator } from '@/components/ChatMessage';
import { Message, sendMessage } from '@/lib/openai';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { doc, updateDoc, increment, collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Send, RefreshCw, User, Plus, FileText, Apple, MoveRight } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
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
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Pill, Weight, Stethoscope, HeartPulse, Brain, Salad } from 'lucide-react';

// Definição dos tipos de módulos e assistentes
interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  assistantId: string;
  enabled: boolean;
  comingSoon?: boolean;
}

// Lista de módulos disponíveis no sistema
const modulesList: Module[] = [
  {
    id: 'anti-obesidade',
    title: 'Anti-Obesidade',
    description: 'Prescrições para tratamento de obesidade e sobrepeso com foco em emagrecimento saudável',
    icon: <Weight className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl', // ID do assistente específico para este módulo
    enabled: true
  },
  {
    id: 'nutricao-esportiva',
    title: 'Nutrição Esportiva',
    description: 'Planos nutricionais para atletas e praticantes de atividades físicas',
    icon: <Stethoscope className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl', // Usando o mesmo assistente por enquanto
    enabled: true
  },
  {
    id: 'doencas-cronicas',
    title: 'Doenças Crônicas',
    description: 'Abordagens nutricionais para diabetes, hipertensão e outras condições crônicas',
    icon: <HeartPulse className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl', // Usando o mesmo assistente por enquanto
    enabled: true
  },
  {
    id: 'saude-mental',
    title: 'Saúde Mental',
    description: 'Nutrição voltada para saúde cerebral e bem-estar mental',
    icon: <Brain className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false,
    comingSoon: true
  },
  {
    id: 'nutricao-pediatrica',
    title: 'Nutrição Pediátrica',
    description: 'Prescrições e orientações para crianças e adolescentes',
    icon: <Apple className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false,
    comingSoon: true
  },
  {
    id: 'alergias-intolerancias',
    title: 'Alergias e Intolerâncias',
    description: 'Planos alimentares para pessoas com restrições alimentares',
    icon: <Pill className="h-10 w-10 text-primary" />,
    assistantId: 'asst_IP63O2nevkiKSFOOwwwGfDCl',
    enabled: false,
    comingSoon: true
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
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  
  // Novos estados para gerenciar seleção de módulos e interface
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModuleSelection, setShowModuleSelection] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [modules, setModules] = useState<Module[]>(modulesList);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [chatKey, setChatKey] = useState<string>(Date.now().toString()); // Chave única para forçar re-renderização
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser, refreshUserData } = useAuth();
  const { canUseCredits, getRemainingCredits } = useSubscriptionAccess();

  // Função para iniciar nova conversa - versão simplificada e robusta
  const handleNewConversation = async () => {
    console.log('🔄 Iniciando nova conversa...');
    
    if (!canUseCredits()) {
      toast({
        title: "Sem créditos",
        description: "Você não possui créditos suficientes para iniciar uma nova conversa.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModule || !selectedPatient || !currentUser?.uid) {
      toast({
        title: "Erro",
        description: "Selecione um módulo e paciente para continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Consumir crédito primeiro
      console.log('💳 Consumindo crédito...');
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        creditsUsed: increment(1),
        lastCreditUsed: new Date().toISOString()
      });
      
      // 2. Atualizar dados do usuário
      await refreshUserData();
      
      // 3. Reset completo e imediato de todo o estado do chat
      console.log('🧹 Limpando chat...');
      setMessages([]); // Limpar mensagens primeiro
      setThreadId(null);
      setCurrentMessage('');
      setIsLoading(false);
      setInputDisabled(false);
      
      // 4. Forçar re-renderização com nova chave
      const newChatKey = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔑 Nova chave:', newChatKey);
      setChatKey(newChatKey);
      
      // 5. Aguardar um pouco e então adicionar mensagem de boas-vindas
      setTimeout(() => {
        console.log('👋 Adicionando mensagem de boas-vindas...');
        const welcomeMessage: Message = {
          role: 'assistant',
          content: `🆕 **Nova conversa iniciada!**\n\n**Paciente:** ${selectedPatient.name}\n**Módulo:** ${selectedModule.title}\n\nComo posso ajudar você hoje?`
        };
        
        setMessages([welcomeMessage]);
        
        // Focar no input após um pequeno delay
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }, 150);
      
      // 6. Mostrar feedback de sucesso
      toast({
        title: "✅ Nova conversa iniciada",
        description: `Crédito consumido. Restam ${getRemainingCredits() - 1} créditos.`,
      });
      
      console.log('✅ Nova conversa iniciada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar nova conversa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar nova conversa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para controlar estado do input
  const handleDisableInput = (disabled: boolean) => {
    setInputDisabled(disabled);
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

  // Event listener para resetar APENAS o chat (sem voltar para módulos)
  useEffect(() => {
    const handleResetChatOnly = (event: Event) => {
      console.log('📢 Evento resetChatOnly recebido!');
      resetChatMessages();
    };

    window.addEventListener('resetChatOnly', handleResetChatOnly);
    
    return () => {
      window.removeEventListener('resetChatOnly', handleResetChatOnly);
    };
  }, [selectedModule, selectedPatient]);

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

  // Efeito para carregar os módulos disponíveis do Firestore (se necessário)
  useEffect(() => {
    async function loadModulesFromFirestore() {
      if (!currentUser?.uid) return;
      
      setIsLoadingModules(true);
      
      try {
        // Verificar se existe uma coleção de módulos no Firestore
        const modulesRef = collection(db, "modules");
        const q = query(modulesRef, where("enabled", "==", true));
        
        try {
          const modulesSnapshot = await getDocs(q);
          
          if (!modulesSnapshot.empty) {
            // Se houver módulos configurados no Firestore, usá-los
            const firestoreModules = modulesSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title,
                description: data.description,
                assistantId: data.assistantId,
                enabled: data.enabled,
                comingSoon: data.comingSoon || false,
                // O ícone precisa ser definido manualmente com base no ID do módulo
                icon: getModuleIcon(doc.id)
              } as Module;
            });
            
            setModules(firestoreModules);
            console.log("Módulos carregados do Firestore:", firestoreModules.length);
          } else {
            // Se não houver módulos no Firestore, usar a lista padrão
            console.log("Nenhum módulo encontrado no Firestore. Usando lista padrão.");
            setModules(modulesList);
          }
        } catch (error) {
          console.warn("Erro ao carregar módulos do Firestore:", error);
          // Em caso de erro, usar a lista padrão
          setModules(modulesList);
        }
      } catch (error) {
        console.error("Erro ao verificar módulos:", error);
        toast({
          title: "Aviso",
          description: "Usando módulos padrão devido a problemas de conexão",
        });
      } finally {
        setIsLoadingModules(false);
      }
    }
    
    // Carregar módulos ao inicializar
    loadModulesFromFirestore();
  }, [currentUser?.uid]);
  
  // Função auxiliar para obter o ícone correto com base no ID do módulo
  const getModuleIcon = (moduleId: string) => {
    switch(moduleId) {
      case 'anti-obesidade':
        return <Weight className="h-10 w-10 text-primary" />;
      case 'nutricao-esportiva':
        return <Stethoscope className="h-10 w-10 text-primary" />;
      case 'doencas-cronicas':
        return <HeartPulse className="h-10 w-10 text-primary" />;
      case 'saude-mental':
        return <Brain className="h-10 w-10 text-primary" />;
      case 'nutricao-pediatrica':
        return <Apple className="h-10 w-10 text-primary" />;
      case 'alergias-intolerancias':
        return <Pill className="h-10 w-10 text-primary" />;
      default:
        return <Salad className="h-10 w-10 text-primary" />;
    }
  };

  // Efeito para mensagem de boas-vindas e focar no input
  useEffect(() => {
    // Mensagem de boas-vindas quando a página é carregada
    if (showChat && messages.length === 0 && selectedModule) {
      setMessages([
        {
          role: 'assistant',
          content: `Olá${currentUser?.displayName ? ' ' + currentUser.displayName : ''}! Você selecionou o módulo ${selectedModule.title}. ${selectedPatient ? `Estou pronto para conversar sobre ${selectedPatient.name}.` : 'Por favor, selecione um paciente para começarmos.'}`
        }
      ]);
    }

    // Focar no input após carregar a página
    if (showChat) {
      inputRef.current?.focus();
    }
  }, [selectedPatient, showChat, selectedModule]);

  // Função para iniciar uma consulta com o módulo selecionado
  const startConsultation = () => {
    if (!selectedModule) {
      toast({
        title: "Selecione um módulo",
        description: "Por favor, selecione um módulo para iniciar a consulta.",
        variant: "destructive",
      });
      return;
    }
    
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
  
  const resetChatMessages = () => {
    console.log('✅ BOTÃO NOVA CONVERSA FUNCIONANDO!');
    console.log('🧹 Limpando chat e reiniciando conversa...');
    
    // Limpar tudo
    setMessages([]);
    setThreadId(null);
    setCurrentMessage('');
    setIsLoading(false);
    setInputDisabled(false);
    
    // Nova chave para forçar re-render
    const newKey = `chat_${Date.now()}`;
    setChatKey(newKey);
    
    // Adicionar mensagem inicial
    setTimeout(() => {
      if (selectedModule && selectedPatient) {
        const welcomeMsg = {
          role: 'assistant' as const,
          content: `🆕 **Nova conversa iniciada!**\n\n**Paciente:** ${selectedPatient.name}\n**Módulo:** ${selectedModule.title}\n\nComo posso ajudar você?`
        };
        setMessages([welcomeMsg]);
        
        // Focar no input após limpar
        inputRef.current?.focus();
      }
    }, 100);
    
    // Toast de confirmação
    toast({
      title: "Chat limpo com sucesso!",
      description: "Nova conversa iniciada no mesmo módulo.",
    });
  };

  const resetConversation = () => {
    // Limpa o ID da thread para começar uma nova conversa
    setThreadId(null);
    
    // Constrói a mensagem de boas-vindas com base no paciente e módulo selecionados
    let welcomeMessage = `Olá${currentUser?.displayName ? ' ' + currentUser.displayName : ''}!`;
    
    if (selectedModule) {
      welcomeMessage += ` Você está utilizando o módulo ${selectedModule.title}.`;
    }
    
    if (selectedPatient) {
      welcomeMessage += ` Iniciei uma nova consulta para ${selectedPatient.name}. Como posso ajudar com as necessidades nutricionais deste paciente?`;
    } else {
      welcomeMessage += ` Selecione um paciente para iniciar uma nova consulta nutricional.`;
    }
    
    // Reinicia a conversa
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage
      }
    ]);
    
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

    // Verificar se é a primeira mensagem da conversa para consumir crédito
    const isFirstMessage = messages.length <= 1; // <= 1 porque pode ter mensagem de boas-vindas
    
    if (isFirstMessage && !canUseCredits()) {
      toast({
        title: "Sem créditos",
        description: "Você não possui créditos suficientes para iniciar uma nova consulta.",
        variant: "destructive",
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
    
    // Consumir crédito se for a primeira mensagem
    if (isFirstMessage && currentUser?.uid) {
      try {
        console.log('Consumindo crédito para nova consulta...');
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          creditsUsed: increment(1),
          lastCreditUsed: new Date().toISOString()
        });
        console.log('Crédito consumido com sucesso');
        // Atualizar dados do usuário em tempo real
        await refreshUserData();
      } catch (creditError) {
        console.error('Erro ao consumir crédito:', creditError);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar créditos.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }
    
    try {
      // Envia a mensagem para a API usando o serviço de OpenAI com informações do paciente e threadId
      const chatResponse = await sendMessage(updatedMessages, selectedPatient, threadId);
      
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
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {showModuleSelection ? "Selecione o Tipo de Consulta" : "Consulta Nutricional"}
          </h1>
          <div className="flex gap-2">
            {showChat && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={backToModuleSelection}
                  className="flex items-center gap-1"
                >
                  <RefreshCw size={14} /> 
                  Trocar módulo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNewPatientDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Plus size={14} />
                  Novo paciente
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetConversation}
                  className="flex items-center gap-1"
                >
                  <RefreshCw size={14} /> 
                  Nova consulta
                </Button>
              </>
            )}
          </div>
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
                      module.comingSoon 
                        ? 'opacity-60 grayscale hover:opacity-70' 
                        : 'hover:shadow-md transform hover:-translate-y-1'
                    }`}
                    onClick={() => {
                      if (!module.comingSoon && module.enabled) {
                        setSelectedModule(module);
                        startConsultation();
                      } else if (module.comingSoon) {
                        toast({
                          title: "Em breve",
                          description: `O módulo ${module.title} estará disponível em breve.`,
                        });
                      }
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-primary/10 rounded-lg">{module.icon}</div>
                        {module.comingSoon && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Em breve
                          </span>
                        )}
                      </div>
                      <CardTitle className="mt-4 text-xl">{module.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-gray-600 text-sm">{module.description}</p>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-end">
                      {!module.comingSoon && module.enabled && (
                        <Button variant="ghost" size="sm" className="text-primary">
                          Selecionar <MoveRight className="ml-1 h-4 w-4" />
                        </Button>
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
            {/* Informações do módulo e seleção de paciente */}
            <div className="border-b p-3 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-3">
                {selectedModule && (
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-primary/10 rounded-lg">
                      {selectedModule.icon}
                    </div>
                    <span className="font-medium">{selectedModule.title}</span>
                  </div>
                )}
                <div className="flex-grow">
                  <Select
                    value={selectedPatient?.id || ''}
                    onValueChange={(id) => {
                      const patient = patients.find(p => p.id === id);
                      setSelectedPatient(patient || null);
                      // Reinicia a conversa ao trocar de paciente
                      if (threadId) {
                        setThreadId(null);
                        resetConversation();
                      }
                    }}
                    disabled={isLoadingPatients}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id || ''}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isLoadingPatients && (
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                )}
                
                {/* BOTÃO NOVA CONVERSA - SEMPRE VISÍVEL E DESTACADO */}
                <Button 
                  onClick={() => {
                    console.log('🆕 BOTÃO NOVA CONVERSA CLICADO!');
                    resetChatMessages();
                  }}
                  variant="default"
                  size="default"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 border-2 border-red-800 shadow-lg"
                >
                  🔄 NOVA CONVERSA
                </Button>
              </div>
            </div>

            {/* Área de chat com chave única para forçar re-renderização */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4" key={chatKey}>
                {messages.map((message, index) => (
                  <ChatMessage 
                    key={`msg_${index}_${message.content?.slice(0, 10) || 'empty'}`}
                    message={message} 
                    isLast={index === messages.length - 1}
                    onNewConversation={resetChatMessages}
                    onDisableInput={handleDisableInput}
                  />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Área de input */}
            <div className="border-t p-3">
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  onClick={() => {
                    console.log('🔄 BOTÃO LIMPAR CHAT CLICADO!');
                    resetChatMessages();
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2"
                >
                  🔄 LIMPAR CHAT
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  disabled={isLoading || !selectedPatient || inputDisabled}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !currentMessage.trim() || !selectedPatient || inputDisabled}
                  className="bg-primary hover:bg-primaryDark"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </div>

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