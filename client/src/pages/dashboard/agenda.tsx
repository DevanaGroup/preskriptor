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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl,
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Agenda, 
  getAgendaItems, 
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  getPatients,
  Patient
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Clock, Video, User, Plus, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format, startOfDay, endOfDay, endOfWeek, startOfWeek, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DatePickerWithPresets } from '@/components/ui/date-picker-with-presets';
import { 
  createTransaction, 
  Transaction 
} from '@/lib/firebase';

// Define o esquema para validação do formulário
const formSchema = z.object({
  patientId: z.string().min(1, { message: "Paciente obrigatório" }),
  date: z.date({ required_error: "Data obrigatória" }),
  time: z.string().min(1, { message: "Horário obrigatório" }),
  type: z.string().min(1, { message: "Tipo obrigatório" }),
  status: z.enum(['agendada', 'realizada', 'cancelada']).default('agendada'),
  linkVirtual: z.string().optional(),
  // Campos para integração financeira
  createFinancialEntry: z.boolean().default(false),
  appointmentValue: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Componente para exibir o status do agendamento
const AgendaStatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  let bgColor = 'bg-blue-100';
  let textColor = 'text-blue-800';
  let statusText = 'Agendada';

  switch (status) {
    case 'realizada':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      statusText = 'Realizada';
      break;
    case 'cancelada':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      statusText = 'Cancelada';
      break;
    default:
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      statusText = 'Agendada';
  }

  return (
    <span className={`px-2 py-1 ${bgColor} ${textColor} rounded-full text-xs`}>
      {statusText}
    </span>
  );
};

const AgendaPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Agenda[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Agenda | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [period, setPeriod] = useState<string>('todos');
  const [typeFilter, setTypeFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const { currentUser } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      date: new Date(),
      time: '',
      type: '',
      status: 'agendada',
      linkVirtual: '',
      createFinancialEntry: false,
      appointmentValue: 0,
    },
  });

  // Carrega os compromissos da agenda
  const loadAppointments = async () => {
    if (!currentUser?.uid) return;
    
    setIsLoading(true);
    try {
      // Tenta carregar compromissos do Firestore primeiro
      try {
        const items = await getAgendaItems(currentUser.uid);
        console.log("Compromissos carregados do Firestore:", items.length);
        setAppointments(items);
        
        // Se obteve com sucesso do Firestore, salva no localStorage
        try {
          // Precisamos serializar as datas para JSON
          const appointmentsForStorage = items.map((item: Agenda) => ({
            ...item,
            date: item.date instanceof Date ? item.date.toISOString() : item.date,
            createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
            updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt
          }));
          
          localStorage.setItem(`agenda_${currentUser.uid}`, JSON.stringify(appointmentsForStorage));
        } catch (storageError) {
          console.warn("Erro ao salvar compromissos no localStorage:", storageError);
        }
      } catch (firestoreError) {
        console.error("Erro ao carregar compromissos do Firestore:", firestoreError);
        
        // Se houve erro no Firestore, tenta recuperar do localStorage
        try {
          const storedData = localStorage.getItem(`agenda_${currentUser.uid}`);
          if (storedData) {
            const parsedAppointments = JSON.parse(storedData);
            
            // Converte datas de string para Date objects
            const processedAppointments = parsedAppointments.map((item: any) => ({
              ...item,
              date: new Date(item.date),
              createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
            }));
            
            console.log("Compromissos carregados do localStorage:", processedAppointments.length);
            setAppointments(processedAppointments);
            
            toast({
              title: "Modo offline",
              description: "Exibindo compromissos armazenados localmente. Sincronize quando estiver online.",
            });
          } else {
            // Não há dados no localStorage
            console.log("Nenhum compromisso encontrado no localStorage");
            setAppointments([]);
            
            toast({
              title: "Informação",
              description: "Você ainda não possui compromissos agendados. Crie um novo para começar!",
            });
          }
        } catch (localStorageError) {
          console.error("Erro ao recuperar compromissos do localStorage:", localStorageError);
          setAppointments([]);
          
          toast({
            title: "Informação",
            description: "Não foi possível acessar seus compromissos. Crie um novo para começar.",
          });
        }
      }
    } catch (error) {
      console.error("Erro geral ao carregar compromissos:", error);
      setAppointments([]);
      
      toast({
        title: "Informação",
        description: "Você ainda não possui compromissos agendados. Crie um novo para começar!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega a lista de pacientes para o select
  const loadPatients = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const patientsList = await getPatients(currentUser.uid);
      setPatients(patientsList);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pacientes.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, [currentUser]);

  // Filtra os compromissos com base nos critérios selecionados
  const getFilteredAppointments = () => {
    if (!appointments.length) return [];
    
    // Log para depuração - verificar os dados antes da filtragem
    console.log("Total de compromissos antes da filtragem:", appointments.length);
    console.log("Exemplo de compromisso:", appointments[0]);
    
    let filteredItems = [...appointments];
    
    // Convertemos todas as datas para garantir que sejam objetos Date
    filteredItems = filteredItems.map(item => ({
      ...item,
      date: item.date instanceof Date ? item.date : new Date(item.date)
    }));
    
    // Filtro de período
    switch (period) {
      case 'hoje':
        const today = new Date();
        filteredItems = filteredItems.filter(item => {
          try {
            return isToday(item.date);
          } catch (e) {
            console.error("Erro ao verificar se é hoje:", e, item.date);
            return false;
          }
        });
        break;
      case 'semana':
        const startWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
        const endWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
        filteredItems = filteredItems.filter(item => {
          try {
            return item.date >= startWeek && item.date <= endWeek;
          } catch (e) {
            console.error("Erro ao filtrar por semana:", e, item.date);
            return false;
          }
        });
        break;
      case 'mes':
        const startMonth = startOfMonth(new Date());
        const endMonth = endOfMonth(new Date());
        filteredItems = filteredItems.filter(item => {
          try {
            return item.date >= startMonth && item.date <= endMonth;
          } catch (e) {
            console.error("Erro ao filtrar por mês:", e, item.date);
            return false;
          }
        });
        break;
      case 'todos':
      default:
        // Se filtro for 'todos' ou nenhum filtro selecionado, mostrar todos
        console.log("Mostrando todos os compromissos, sem filtro de período");
        break;
    }
    
    // Filtro de tipo
    if (typeFilter !== 'todas') {
      filteredItems = filteredItems.filter(item => item.type === typeFilter);
    }
    
    // Filtro de status
    if (statusFilter !== 'todos') {
      filteredItems = filteredItems.filter(item => item.status === statusFilter);
    }
    
    // Log para depuração - verificar resultado da filtragem
    console.log("Compromissos após filtragem:", filteredItems.length);
    
    return filteredItems;
  };

  // Próximos compromissos (futuros)
  const upcomingAppointments = getFilteredAppointments()
    .filter((item: Agenda) => new Date(item.date) >= startOfDay(new Date()))
    .sort((a: Agenda, b: Agenda) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compromissos passados
  const pastAppointments = getFilteredAppointments()
    .filter((item: Agenda) => new Date(item.date) < startOfDay(new Date()))
    .sort((a: Agenda, b: Agenda) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Apenas os 5 mais recentes

  // Abrir o diálogo para criar/editar compromisso
  const openAppointmentDialog = (appointment?: Agenda) => {
    if (appointment) {
      // Editando um compromisso existente
      setSelectedAppointment(appointment);
      
      // Corrigir problema de timezone na data
      const rawDate = new Date(appointment.date);
      // Adicionar um dia para corrigir o problema de timezone
      rawDate.setDate(rawDate.getDate() + 1);
      
      const year = rawDate.getFullYear();
      const month = rawDate.getMonth();
      const day = rawDate.getDate();
      const hours = rawDate.getHours();
      const minutes = rawDate.getMinutes();
      
      // Criar uma nova data no fuso horário local para exibição correta
      const date = new Date(year, month, day, hours, minutes, 0);
      
      // Formatar hora para exibição
      const hoursStr = hours.toString().padStart(2, '0');
      const minutesStr = minutes.toString().padStart(2, '0');
      
      form.reset({
        patientId: appointment.patientId,
        date: date,
        time: `${hoursStr}:${minutesStr}`,
        type: appointment.type,
        status: appointment.status as 'agendada' | 'realizada' | 'cancelada',
        linkVirtual: appointment.linkVirtual || '',
        createFinancialEntry: !!(appointment as any).createFinancialEntry,
        appointmentValue: (appointment as any).appointmentValue || 0,
      });
    } else {
      // Criando um novo compromisso
      setSelectedAppointment(null);
      form.reset({
        patientId: '',
        date: new Date(),
        time: '',
        type: '',
        status: 'agendada',
        linkVirtual: '',
        createFinancialEntry: false,
        appointmentValue: 0,
      });
    }
    
    setIsDialogOpen(true);
  };

  // Fechar o diálogo
  const closeAppointmentDialog = () => {
    setIsDialogOpen(false);
    setSelectedAppointment(null);
  };

  // Salvar o compromisso (criar ou atualizar)
  const onSubmit = async (data: FormValues) => {
    if (!currentUser?.uid) return;

    try {
      // Combinar data e hora, ajustando o timezone
      const [hours, minutes] = data.time.split(':').map(Number);
      
      // Usar a data diretamente do componente DatePickerWithPresets
      // Ele já garante que a data esteja no fuso local correto
      const selectedDate = data.date;
      
      if (!selectedDate) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma data válida.",
          variant: "destructive",
        });
        return;
      }
      
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      
      // Criar nova data combinando a data selecionada com a hora informada
      const combinedDate = new Date(year, month, day, hours, minutes, 0);

      // Obter o nome do paciente
      const patient = patients.find(p => p.id === data.patientId);
      if (!patient) {
        toast({
          title: "Erro",
          description: "Paciente não encontrado.",
          variant: "destructive",
        });
        return;
      }

      if (selectedAppointment?.id) {
        // Atualizar compromisso existente
        await updateAgendaItem(selectedAppointment.id, {
          patientId: data.patientId,
          patientName: patient.name,
          date: combinedDate,
          type: data.type,
          status: data.status,
          linkVirtual: data.linkVirtual,
          userId: currentUser.uid,
          createFinancialEntry: data.createFinancialEntry,
          appointmentValue: data.appointmentValue,
        });

        // Se o status foi alterado para "realizada" e tem criação financeira habilitada,
        // criar a transação financeira
        if (data.status === 'realizada' && data.createFinancialEntry && (data.appointmentValue || 0) > 0) {
          try {
            await createTransaction({
              userId: currentUser.uid,
              patientId: data.patientId,
              patientName: patient.name,
              date: combinedDate,
              description: `Consulta - ${data.type} - ${patient.name}`,
              amount: data.appointmentValue || 0,
              type: 'receita',
              category: 'consulta',
              paymentMethod: 'none', // Será tratado como undefined no backend
              status: 'pago',
            });
            
            toast({
              title: "Sucesso",
              description: "Compromisso atualizado e lançamento financeiro criado.",
            });
          } catch (error) {
            console.error("Erro ao criar transação financeira:", error);
            toast({
              title: "Atenção",
              description: "Compromisso foi atualizado, mas ocorreu um erro ao criar o lançamento financeiro.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Sucesso",
            description: "Compromisso atualizado com sucesso.",
          });
        }
      } else {
        // Criar novo compromisso
        await createAgendaItem({
          patientId: data.patientId,
          patientName: patient.name,
          date: combinedDate,
          type: data.type,
          status: data.status,
          linkVirtual: data.linkVirtual,
          userId: currentUser.uid,
          createFinancialEntry: data.createFinancialEntry,
          appointmentValue: data.appointmentValue,
        });

        // Se o status já for "realizada" e tem criação financeira habilitada,
        // criar a transação financeira imediatamente
        if (data.status === 'realizada' && data.createFinancialEntry && (data.appointmentValue || 0) > 0) {
          try {
            await createTransaction({
              userId: currentUser.uid,
              patientId: data.patientId,
              patientName: patient.name,
              date: combinedDate,
              description: `Consulta - ${data.type} - ${patient.name}`,
              amount: data.appointmentValue || 0,
              type: 'receita',
              category: 'consulta',
              paymentMethod: 'none', // Será tratado como undefined no backend
              status: 'pago',
            });
            
            toast({
              title: "Sucesso",
              description: "Compromisso criado e lançamento financeiro registrado.",
            });
          } catch (error) {
            console.error("Erro ao criar transação financeira:", error);
            toast({
              title: "Atenção",
              description: "Compromisso foi criado, mas ocorreu um erro ao criar o lançamento financeiro.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Sucesso",
            description: "Compromisso criado com sucesso.",
          });
        }
      }

      // Recarregar a lista e fechar o diálogo
      await loadAppointments();
      closeAppointmentDialog();
    } catch (error) {
      console.error("Erro ao salvar compromisso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o compromisso.",
        variant: "destructive",
      });
    }
  };

  // Confirmar exclusão de compromisso
  const confirmDelete = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId);
    setIsDeleteDialogOpen(true);
  };

  // Excluir compromisso
  const deleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      await deleteAgendaItem(appointmentToDelete);
      
      toast({
        title: "Sucesso",
        description: "Compromisso excluído com sucesso.",
      });
      
      // Recarregar a lista e fechar o diálogo
      await loadAppointments();
    } catch (error) {
      console.error("Erro ao excluir compromisso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o compromisso.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  // Atualizar o status de um compromisso
  const updateAppointmentStatus = async (appointmentId: string, status: 'agendada' | 'realizada' | 'cancelada') => {
    try {
      // Buscar o compromisso atual para verificar se tem configuração financeira
      const appointments = await getAgendaItems(currentUser!.uid);
      const appointment = appointments.find((a: Agenda) => a.id === appointmentId);
      
      if (!appointment) {
        throw new Error("Compromisso não encontrado");
      }
      
      // Atualizar o status
      await updateAgendaItem(appointmentId, { status });
      
      // Se o status for alterado para "realizada" e a opção de criar lançamento financeiro estiver ativada
      if (status === 'realizada' && appointment.createFinancialEntry && appointment.appointmentValue && appointment.appointmentValue > 0) {
        try {
          // Criar o lançamento financeiro
          await createTransaction({
            userId: currentUser!.uid,
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            date: appointment.date,
            description: `Consulta - ${appointment.type} - ${appointment.patientName}`,
            amount: appointment.appointmentValue,
            type: 'receita',
            category: 'consulta',
            paymentMethod: 'none', // Será tratado como undefined no backend
            status: 'pago',
          });
          
          toast({
            title: "Sucesso",
            description: `Status atualizado para: Realizada e lançamento financeiro criado automaticamente.`,
          });
        } catch (financialError) {
          console.error("Erro ao criar lançamento financeiro:", financialError);
          toast({
            title: "Atenção",
            description: "Status foi atualizado, mas ocorreu um erro ao criar o lançamento financeiro.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: `Status atualizado para: ${status === 'realizada' ? 'Realizada' : status === 'cancelada' ? 'Cancelada' : 'Agendada'}.`,
        });
      }
      
      // Recarregar a lista
      await loadAppointments();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do compromisso.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarLayout>
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button 
          className="bg-primary hover:bg-primaryDark" 
          onClick={() => openAppointmentDialog()}
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Consulta
        </Button>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Lista de Próximas Consultas */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Próximas Consultas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum compromisso encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-medium">Paciente</th>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Horário</th>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((appointment) => {
                      const appointmentDate = new Date(appointment.date);
                      return (
                        <tr key={appointment.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{appointment.patientName}</td>
                          <td className="p-4">{format(appointmentDate, 'dd/MM/yyyy', { locale: ptBR })}</td>
                          <td className="p-4">{format(appointmentDate, 'HH:mm', { locale: ptBR })}</td>
                          <td className="p-4">{appointment.type}</td>
                          <td className="p-4">
                            <AgendaStatusBadge status={appointment.status} />
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              {appointment.status !== 'realizada' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(appointment.id!, 'realizada')}
                                >
                                  Concluir
                                </Button>
                              )}
                              {appointment.status !== 'cancelada' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => updateAppointmentStatus(appointment.id!, 'cancelada')}
                                >
                                  Cancelar
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openAppointmentDialog(appointment)}
                              >
                                Editar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Período</label>
                <Select 
                  value={period} 
                  onValueChange={setPeriod}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de consulta</label>
                <Select 
                  value={typeFilter} 
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Primeira consulta">Primeira consulta</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                    <SelectItem value="Avaliação nutricional">Avaliação nutricional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Consultas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pastAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma consulta recente encontrada.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium">Paciente</th>
                    <th className="text-left p-4 font-medium">Data</th>
                    <th className="text-left p-4 font-medium">Horário</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pastAppointments.map((appointment) => {
                    const appointmentDate = new Date(appointment.date);
                    return (
                      <tr key={appointment.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{appointment.patientName}</td>
                        <td className="p-4">{format(appointmentDate, 'dd/MM/yyyy', { locale: ptBR })}</td>
                        <td className="p-4">{format(appointmentDate, 'HH:mm', { locale: ptBR })}</td>
                        <td className="p-4">
                          <AgendaStatusBadge status={appointment.status} />
                        </td>
                        <td className="p-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAppointmentDialog(appointment)}
                          >
                            Ver detalhes
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para criar/editar compromisso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment 
                ? 'Edite os detalhes do compromisso abaixo.'
                : 'Preencha os detalhes para agendar uma nova consulta.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <DatePickerWithPresets
                          date={field.value}
                          setDate={(date) => field.onChange(date)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Consulta</FormLabel>
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
                        <SelectItem value="Primeira consulta">Primeira consulta</SelectItem>
                        <SelectItem value="Retorno">Retorno</SelectItem>
                        <SelectItem value="Avaliação nutricional">Avaliação nutricional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="agendada">Agendada</SelectItem>
                        <SelectItem value="realizada">Realizada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkVirtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link para Consulta Virtual (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://meet.google.com/..." 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Informações Financeiras</h4>
                
                <FormField
                  control={form.control}
                  name="createFinancialEntry"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Lançar no Financeiro
                        </FormLabel>
                        <FormDescription>
                          Quando a consulta for concluída, será criado um lançamento financeiro automaticamente.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("createFinancialEntry") && (
                  <FormField
                    control={form.control}
                    name="appointmentValue"
                    render={({ field }) => (
                      <FormItem className="mt-3">
                        <FormLabel>Valor da Consulta (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={closeAppointmentDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {selectedAppointment ? 'Atualizar' : 'Agendar'}
                </Button>
                {selectedAppointment && (
                  <Button 
                    type="button"
                    variant="destructive" 
                    onClick={() => confirmDelete(selectedAppointment.id!)}
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
              Tem certeza que deseja excluir este compromisso? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteAppointment}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
};

export default AgendaPage;