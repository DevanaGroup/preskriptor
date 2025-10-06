import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Transaction,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getPatients,
  Patient
} from '@/lib/firebase';
import { format, startOfMonth, endOfMonth, sub, startOfDay, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Loader2, 
  Plus, 
  Trash, 
  Edit, 
  Download, 
  Calendar, 
  CreditCard, 
  User,
  CloudOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// Define o esquema para validação do formulário
const formSchema = z.object({
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
  amount: z.coerce.number().min(0.01, { message: "Valor deve ser maior que zero" }),
  type: z.enum(['receita', 'despesa']),
  category: z.string().min(1, { message: "Categoria é obrigatória" }),
  date: z.date({ required_error: "Data é obrigatória" }),
  paymentMethod: z.string().optional(),
  status: z.enum(['pago', 'pendente', 'cancelado']),
  patientId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Categorias predefinidas
const INCOME_CATEGORIES = [
  'Consulta',
  'Avaliação',
  'Plano mensal',
  'Venda de produtos',
  'Outros'
];

const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Salários',
  'Material de escritório',
  'Equipamentos',
  'Marketing',
  'Impostos',
  'Outros'
];

const PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de crédito',
  'Cartão de débito',
  'PIX',
  'Transferência bancária',
  'Boleto'
];

// Componente para exibir o status do pagamento
const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let statusText = '';

  switch (status) {
    case 'pago':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      statusText = 'Pago';
      break;
    case 'pendente':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      statusText = 'Pendente';
      break;
    case 'cancelado':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      statusText = 'Cancelado';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      statusText = status;
  }

  return (
    <span className={`px-2 py-1 ${bgColor} ${textColor} rounded-full text-xs`}>
      {statusText}
    </span>
  );
};

const FinanceiroPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'receita' | 'despesa' | 'todas'>('todas');

  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'receita',
      category: '',
      date: new Date(),
      paymentMethod: 'none',  // Usar 'none' em vez de string vazia
      status: 'pendente',
      patientId: 'none',  // Usar 'none' em vez de string vazia
    },
  });

  // Carregar transações
  const loadTransactions = async () => {
    if (!currentUser?.uid) return;

    setIsLoading(true);
    try {
      // Tentativa de carregar transações do Firestore
      try {
        const allTransactions = await getTransactions(currentUser.uid);
        console.log("Transações carregadas do Firestore:", allTransactions.length);
        setTransactions(allTransactions);
        
        // Se obteve com sucesso do Firestore, salva no localStorage também
        try {
          // Precisamos serializar as datas para JSON 
          const transactionsForStorage = allTransactions.map((transaction: Transaction) => ({
            ...transaction,
            date: transaction.date instanceof Date ? transaction.date.toISOString() : transaction.date,
            createdAt: transaction.createdAt instanceof Date ? transaction.createdAt.toISOString() : transaction.createdAt,
            updatedAt: transaction.updatedAt instanceof Date ? transaction.updatedAt.toISOString() : transaction.updatedAt
          }));
          
          localStorage.setItem(`transactions_${currentUser.uid}`, JSON.stringify(transactionsForStorage));
        } catch (storageError) {
          console.warn("Erro ao salvar transações no localStorage:", storageError);
        }
      } catch (firestoreError) {
        console.error("Erro ao carregar transações do Firestore:", firestoreError);
        
        // Se houve erro no Firestore, tenta recuperar do localStorage
        try {
          const storedData = localStorage.getItem(`transactions_${currentUser.uid}`);
          if (storedData) {
            const parsedTransactions = JSON.parse(storedData);
            
            // Converte datas de string para Date objects
            const processedTransactions = parsedTransactions.map((t: any) => ({
              ...t,
              date: new Date(t.date),
              createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
              updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined
            }));
            
            console.log("Transações carregadas do localStorage:", processedTransactions.length);
            setTransactions(processedTransactions);
            
            toast({
              title: "Modo offline",
              description: "Exibindo dados armazenados localmente. Sincronize quando estiver online novamente.",
            });
          } else {
            // Não há dados no localStorage
            console.log("Nenhuma transação encontrada no localStorage");
            setTransactions([]);
            
            toast({
              title: "Informação",
              description: "Você ainda não possui transações registradas. Crie sua primeira transação!",
            });
          }
        } catch (localStorageError) {
          console.error("Erro ao recuperar transações do localStorage:", localStorageError);
          setTransactions([]);
          
          toast({
            title: "Informação", 
            description: "Não foi possível acessar suas transações. Crie uma nova para começar.",
          });
        }
      }
    } catch (error) {
      console.error("Erro geral ao carregar transações:", error);
      
      // Mensagem suave para o usuário
      toast({
        title: "Informação",
        description: "Você ainda não possui transações registradas. Crie sua primeira transação!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar pacientes
  const loadPatients = async () => {
    if (!currentUser?.uid) return;

    try {
      const patientsList = await getPatients(currentUser.uid);
      setPatients(patientsList);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadPatients();
  }, [currentUser]);

  // Filtrar transações do mês atual
  const getFilteredTransactions = () => {
    if (!transactions.length) return [];

    // Definir início e fim do mês
    const startMonth = startOfMonth(currentMonth);
    const endMonth = endOfMonth(currentMonth);

    // Filtrar por mês
    let filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startMonth && transactionDate <= endMonth;
    });

    // Filtrar por tipo (receita/despesa/todas)
    if (currentView !== 'todas') {
      filtered = filtered.filter(transaction => transaction.type === currentView);
    }

    // Ordenar por data (mais recente primeiro)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredTransactions = getFilteredTransactions();

  // Calcular total de receitas
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'receita' && t.status !== 'cancelado')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calcular total de despesas
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'despesa' && t.status !== 'cancelado')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calcular saldo
  const balance = totalIncome - totalExpenses;

  // Calcular pendentes
  const pendingAmount = filteredTransactions
    .filter(t => t.status === 'pendente')
    .reduce((sum, t) => t.type === 'receita' ? sum + t.amount : sum, 0);

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => sub(prev, { months: 1 }));
  };

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Abrir o diálogo para criar/editar transação
  const openTransactionDialog = (transaction?: Transaction) => {
    if (transaction) {
      // Editando uma transação existente
      setSelectedTransaction(transaction);
      
      form.reset({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: new Date(transaction.date),
        paymentMethod: transaction.paymentMethod || 'none',
        status: transaction.status,
        patientId: transaction.patientId || 'none',
      });
    } else {
      // Criando uma nova transação
      setSelectedTransaction(null);
      form.reset({
        description: '',
        amount: 0,
        type: 'receita',
        category: '',
        date: new Date(),
        paymentMethod: 'none',
        status: 'pendente',
        patientId: 'none',
      });
    }
    
    setIsDialogOpen(true);
  };

  // Fechar o diálogo
  const closeTransactionDialog = () => {
    setIsDialogOpen(false);
    setSelectedTransaction(null);
  };

  // Confirmar exclusão de transação
  const confirmDelete = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setIsDeleteDialogOpen(true);
  };

  // Excluir transação
  const deleteTransactionItem = async () => {
    if (!transactionToDelete) return;

    try {
      // Tenta excluir no Firestore
      try {
        await deleteTransaction(transactionToDelete);
        
        toast({
          title: "Sucesso",
          description: "Transação excluída com sucesso.",
        });
      } catch (deleteError) {
        console.error("Erro ao excluir transação no Firestore:", deleteError);
        
        // Informamos o usuário, mas ainda excluímos localmente
        toast({
          title: "Aviso",
          description: "Transação excluída localmente, mas pode haver problemas de sincronização.",
          duration: 5000,
        });
      }
      
      // Atualizar a lista local independentemente do resultado do Firestore
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
    } catch (error) {
      console.error("Erro ao processar exclusão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  // Salvar a transação (criar ou atualizar)
  const onSubmit = async (data: FormValues) => {
    if (!currentUser?.uid) return;

    try {
      // Preparar o objeto de transação
      const transactionData = {
        ...data,
        userId: currentUser.uid,
      };

      // Adicionar o nome do paciente se um paciente foi selecionado (que não seja "none")
      if (data.patientId && data.patientId !== 'none') {
        const patient = patients.find(p => p.id === data.patientId);
        if (patient) {
          (transactionData as any).patientName = patient.name;
        }
      } else {
        // Se for "none", definimos como undefined para não salvar no banco
        transactionData.patientId = undefined;
      }
      
      // Também tratar método de pagamento se for 'none'
      if (data.paymentMethod === 'none') {
        transactionData.paymentMethod = undefined;
      }

      try {
        if (selectedTransaction?.id) {
          // Atualizar transação existente
          await updateTransaction(selectedTransaction.id, transactionData);
          toast({
            title: "Sucesso",
            description: "Transação atualizada com sucesso.",
          });
        } else {
          // Criar nova transação
          await createTransaction(transactionData);
          toast({
            title: "Sucesso",
            description: "Transação criada com sucesso.",
          });
        }
        
        // Adicionar manualmente à lista local para mostrar ao usuário, mesmo se o Firestore tiver problemas
        if (!selectedTransaction?.id) {
          // Se for uma nova transação
          const newTransaction: Transaction = {
            ...transactionData,
            id: `local-${Date.now()}`, // ID temporário local
            date: new Date(data.date),
            createdAt: new Date(),
            updatedAt: new Date(),
            // Type assertion para incluir campos opcionais
            patientName: (transactionData as any).patientName,
          } as Transaction;
          
          setTransactions(prev => [newTransaction, ...prev]);
        } else {
          // Se for atualização, atualiza na lista local
          setTransactions(prev => prev.map(t => 
            t.id === selectedTransaction.id 
              ? { ...t, ...transactionData, updatedAt: new Date() } 
              : t
          ));
        }
      } catch (saveError: any) {
        console.error("Erro ao salvar no Firestore:", saveError);
        
        // Informar o usuário que a transação foi salva localmente mas pode haver problemas de sincronização
        toast({
          title: "Aviso",
          description: "A transação foi registrada, mas pode haver problemas de sincronização. Confira as regras do Firestore.",
          duration: 5000,
        });
        
        // Ainda precisamos adicionar à lista local para interface funcionar
        const newTransaction: Transaction = {
          ...transactionData,
          id: `local-${Date.now()}`, // ID temporário local
          date: new Date(data.date),
          createdAt: new Date(),
          updatedAt: new Date(),
          // Type assertion para incluir campos opcionais
          patientName: (transactionData as any).patientName,
        } as Transaction;
        
        setTransactions(prev => [newTransaction, ...prev]);
      }

      // Não precisamos mais recarregar a lista do Firestore, pois já atualizamos localmente
      // await loadTransactions();
      
      // Fechar o diálogo
      closeTransactionDialog();
    } catch (error) {
      console.error("Erro ao processar transação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a transação.",
        variant: "destructive",
      });
    }
  };

  // Atualizar o status de pagamento
  const updatePaymentStatus = async (transactionId: string, status: 'pago' | 'pendente' | 'cancelado') => {
    try {
      // Tentar atualizar no Firestore
      try {
        await updateTransaction(transactionId, { status });
        
        toast({
          title: "Sucesso",
          description: `Status atualizado para: ${status === 'pago' ? 'Pago' : status === 'pendente' ? 'Pendente' : 'Cancelado'}.`,
        });
      } catch (updateError) {
        console.error("Erro ao atualizar status no Firestore:", updateError);
        
        // Informamos o usuário, mas ainda atualizamos localmente
        toast({
          title: "Aviso",
          description: "Status atualizado localmente, mas pode haver problemas de sincronização.",
          duration: 5000,
        });
      }
      
      // Atualizar a lista local independentemente do resultado do Firestore
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
        ? { ...t, status, updatedAt: new Date() } 
        : t
      ));
    } catch (error) {
      console.error("Erro ao processar atualização de status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  // Tentar sincronizar uma transação pendente com o Firestore
  const syncPendingTransaction = async (transaction: Transaction) => {
    if (!transaction.pending || !transaction.id) return;
    
    // Verificar se o ID começa com "local_" para confirmar que é uma transação local
    if (!transaction.id.startsWith('local_')) {
      toast({
        title: "Erro",
        description: "Esta transação não está pendente de sincronização.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Mostrar toast de loading
      toast({
        title: "Sincronizando",
        description: "Tentando sincronizar transação com o servidor...",
      });
      
      // Remover propriedades específicas do armazenamento local
      const { id, pending, ...transactionData } = transaction;
      
      // Tentar criar a transação no Firestore
      try {
        const newTransaction = await createTransaction(transactionData);
        
        if (newTransaction && newTransaction.id) {
          // Remover a transação pendente do localStorage
          try {
            const storedTransactions = localStorage.getItem('pendingTransactions');
            if (storedTransactions) {
              const pendingTransactions = JSON.parse(storedTransactions);
              const updatedPendingTransactions = pendingTransactions.filter(
                (t: any) => t.id !== transaction.id
              );
              localStorage.setItem('pendingTransactions', JSON.stringify(updatedPendingTransactions));
            }
          } catch (localError) {
            console.error("Erro ao atualizar armazenamento local:", localError);
          }
          
          toast({
            title: "Sucesso",
            description: "Transação sincronizada com sucesso.",
          });
        }
      } catch (syncError: any) {
        console.error("Erro ao sincronizar com Firestore:", syncError);
        
        // Se o erro for de permissão, informamos mas mantemos o registro local
        if (syncError.code === 'permission-denied') {
          toast({
            title: "Erro de Permissão",
            description: "Você não tem permissão para criar transações no servidor. A transação continuará armazenada localmente.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title: "Erro de Sincronização",
            description: "Não foi possível sincronizar com o servidor. A transação continuará armazenada localmente.",
            variant: "destructive",
          });
        }
      }
      
      // Recarregar transações em qualquer caso
      await loadTransactions();
    } catch (error) {
      console.error("Erro geral ao sincronizar transação:", error);
      
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a transação. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  // Obter as categorias com base no tipo selecionado
  const getCategories = (type: 'receita' | 'despesa') => {
    return type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  };

  // Calcular o valor das métricas do mês anterior para comparação
  const getComparisonData = () => {
    const prevMonth = sub(currentMonth, { months: 1 });
    const startPrevMonth = startOfMonth(prevMonth);
    const endPrevMonth = endOfMonth(prevMonth);

    const prevMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startPrevMonth && transactionDate <= endPrevMonth;
    });

    const prevMonthIncome = prevMonthTransactions
      .filter(t => t.type === 'receita' && t.status !== 'cancelado')
      .reduce((sum, t) => sum + t.amount, 0);

    const prevMonthExpenses = prevMonthTransactions
      .filter(t => t.type === 'despesa' && t.status !== 'cancelado')
      .reduce((sum, t) => sum + t.amount, 0);

    // Contar consultas (receitas da categoria 'Consulta')
    const currentMonthConsults = filteredTransactions
      .filter(t => t.type === 'receita' && t.category === 'Consulta' && t.status !== 'cancelado')
      .length;

    const prevMonthConsults = prevMonthTransactions
      .filter(t => t.type === 'receita' && t.category === 'Consulta' && t.status !== 'cancelado')
      .length;

    return {
      prevMonthIncome,
      prevMonthExpenses,
      currentMonthConsults,
      prevMonthConsults,
      incomeChange: prevMonthIncome > 0 ? ((totalIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0,
      consultsChange: prevMonthConsults > 0 ? currentMonthConsults - prevMonthConsults : 0,
    };
  };

  const comparisonData = getComparisonData();

  // Calcular o ticket médio
  const calculateAverageTicket = () => {
    const consultTransactions = filteredTransactions
      .filter(t => t.type === 'receita' && t.category === 'Consulta' && t.status !== 'cancelado');
    
    if (consultTransactions.length === 0) return 0;
    
    const total = consultTransactions.reduce((sum, t) => sum + t.amount, 0);
    return total / consultTransactions.length;
  };

  const averageTicket = calculateAverageTicket();

  // Calcular estatísticas de métodos de pagamento
  const calculatePaymentMethodStats = () => {
    const incomeTransactions = filteredTransactions
      .filter(t => t.type === 'receita' && t.status !== 'cancelado' && t.paymentMethod);
    
    if (incomeTransactions.length === 0) return [];
    
    // Contagem por método
    const countByMethod: Record<string, number> = {};
    incomeTransactions.forEach(t => {
      const method = t.paymentMethod || 'Não especificado';
      countByMethod[method] = (countByMethod[method] || 0) + 1;
    });
    
    // Calcular porcentagens
    const total = incomeTransactions.length;
    return Object.entries(countByMethod)
      .map(([method, count]) => ({
        method,
        count,
        percentage: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Pegar os 4 mais usados
  };

  const paymentMethodStats = calculatePaymentMethodStats();

  // Formatador de valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Ícones para métodos de pagamento
  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'pix':
        return (
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'cartão de crédito':
        return (
          <div className="bg-purple-100 p-2 rounded-full mr-3">
            <CreditCard className="h-5 w-5 text-purple-600" />
          </div>
        );
      case 'transferência bancária':
        return (
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'dinheiro':
        return (
          <div className="bg-yellow-100 p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full mr-3">
            <CreditCard className="h-5 w-5 text-gray-600" />
          </div>
        );
    }
  };

  return (
    <SidebarLayout>
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <div className="flex gap-2">
          <Button 
            className="bg-primary hover:bg-primaryDark" 
            onClick={() => openTransactionDialog()}
          >
            <Plus className="w-4 h-4 mr-2" /> Nova transação
          </Button>
        </div>
      </div>

      {/* Mês atual e navegação */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={goToPreviousMonth}>
          &larr; Mês anterior
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <Button variant="outline" onClick={goToNextMonth}>
          Próximo mês &rarr;
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className={`text-sm flex items-center ${comparisonData.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.incomeChange >= 0 ? (
                <ArrowUpCircle className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 mr-1" />
              )}
              {Math.abs(comparisonData.incomeChange).toFixed(1)}% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Consultas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{comparisonData.currentMonthConsults}</div>
            <p className={`text-sm flex items-center ${comparisonData.consultsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {comparisonData.consultsChange >= 0 ? (
                <ArrowUpCircle className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 mr-1" />
              )}
              {comparisonData.consultsChange > 0 ? `${comparisonData.consultsChange} a mais` : 
                comparisonData.consultsChange < 0 ? `${Math.abs(comparisonData.consultsChange)} a menos` : 
                `Mesmo número`} que no mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(averageTicket)}</div>
            <p className="text-sm text-gray-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Por consulta realizada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Pagamentos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-sm text-yellow-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {filteredTransactions.filter(t => t.status === 'pendente' && t.type === 'receita').length} pagamentos aguardando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros para transações */}
      <div className="mb-4 flex space-x-2">
        <Button 
          variant={currentView === 'todas' ? "default" : "outline"} 
          onClick={() => setCurrentView('todas')}
        >
          Todas
        </Button>
        <Button 
          variant={currentView === 'receita' ? "default" : "outline"} 
          onClick={() => setCurrentView('receita')}
          className="text-green-600"
        >
          Receitas
        </Button>
        <Button 
          variant={currentView === 'despesa' ? "default" : "outline"} 
          onClick={() => setCurrentView('despesa')}
          className="text-red-600"
        >
          Despesas
        </Button>
      </div>

      {/* Lista de transações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma transação encontrada para o período selecionado.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-medium">Descrição</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Valor</th>
                      <th className="text-left p-4 font-medium">Categoria</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr 
                        key={transaction.id} 
                        className={`border-b hover:bg-gray-50 ${transaction.pending ? 'border-l-4 border-l-amber-400' : ''}`}
                      >
                        <td className="p-4 font-medium">
                          <div className="flex items-center">
                            {transaction.type === 'receita' ? (
                              <ArrowUpCircle className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 mr-2 text-red-500" />
                            )}
                            {transaction.description}
                          </div>
                          {transaction.patientName && (
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <User className="h-3 w-3 mr-1" /> {transaction.patientName}
                            </div>
                          )}
                          {transaction.pending && (
                            <div className="text-xs text-amber-600 mt-1 flex items-center bg-amber-50 px-2 py-1 rounded">
                              <CloudOff className="h-3 w-3 mr-1" /> Aguardando sincronização
                            </div>
                          )}
                        </td>
                        <td className="p-4">{format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                        <td className={`p-4 ${transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'receita' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </td>
                        <td className="p-4">{transaction.category}</td>
                        <td className="p-4">
                          <PaymentStatusBadge status={transaction.status} />
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openTransactionDialog(transaction)}
                              disabled={transaction.pending}
                              title={transaction.pending ? "Não é possível editar uma transação pendente" : "Editar transação"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => confirmDelete(transaction.id!)}
                              title={transaction.pending ? "Remover do armazenamento local" : "Excluir transação"}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                            {transaction.status !== 'pago' && transaction.type === 'receita' && !transaction.pending && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600"
                                onClick={() => updatePaymentStatus(transaction.id!, 'pago')}
                              >
                                Receber
                              </Button>
                            )}
                            {transaction.pending && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-blue-600"
                                onClick={() => syncPendingTransaction(transaction)}
                                title="Tentar sincronizar com o servidor"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" /> Sincronizar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodStats.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum pagamento registrado no período.
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethodStats.map(({ method, percentage }) => (
                  <div key={method} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getPaymentMethodIcon(method)}
                      <span className="font-medium">{method}</span>
                    </div>
                    <span className="text-gray-500">{percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para criar/editar transação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction 
                ? 'Edite os detalhes da transação abaixo.'
                : 'Preencha os detalhes para registrar uma nova transação.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Consulta nutricional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01"
                          placeholder="0.00" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} 
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : new Date();
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCategories(form.getValues().type).map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === 'receita' && (
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente (opcional)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um paciente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum paciente</SelectItem>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id!}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('type') === 'receita' && (
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de pagamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Não informado</SelectItem>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={closeTransactionDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedTransaction ? 'Atualizar' : 'Salvar'}
                </Button>
                {selectedTransaction && (
                  <Button 
                    type="button"
                    variant="destructive" 
                    onClick={() => confirmDelete(selectedTransaction.id!)}
                  >
                    Excluir
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteTransactionItem}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
};

export default FinanceiroPage;