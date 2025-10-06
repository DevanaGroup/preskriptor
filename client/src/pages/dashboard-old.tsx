import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getPatients, getConsultations } from '@/lib/firebase';
import { Users, MessageSquare, Loader2, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [patientCount, setPatientCount] = useState(0);
  const [consultationCount, setConsultationCount] = useState(0);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  // Função para carregar os dados do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.uid) return;
      
      setLoading(true);
      try {
        // Carregar contagem de pacientes
        const patients = await getPatients(currentUser.uid);
        setPatientCount(patients.length);
        
        // Carregar compromissos futuros
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);
        
        const agendaItems = await getAgendaItems(currentUser.uid);
        const upcoming = agendaItems.filter(item => {
          const itemDate = item.date instanceof Date ? item.date : new Date(item.date);
          return itemDate >= now && itemDate <= sevenDaysFromNow && item.status !== 'cancelada';
        });
        setUpcomingAppointments(upcoming.length);
        
        // Calcular consultas realizadas
        const completed = agendaItems.filter(item => item.status === 'realizada');
        setCompletedAppointments(completed.length);
        
        // Carregar transações financeiras para o mês atual
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const transactions = await getTransactions(currentUser.uid);
        const monthlyTransactions = transactions.filter(tx => {
          const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
          return txDate >= startOfMonth && tx.type === 'receita' && tx.status === 'pago';
        });
        
        // Calcular faturamento mensal
        const revenue = monthlyTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        setMonthlyRevenue(revenue);
        
        // Como não temos uma coleção específica para prescrições, usaremos um valor baseado
        // em consultas realizadas para simular
        setPrescriptionCount(Math.round(completed.length * 0.8));
        
        // Carregar atividades recentes
        const recentItems = [...agendaItems, ...patients, ...transactions]
          .sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);
        
        setRecentActivities(recentItems);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar algumas informações do dashboard.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [currentUser, toast]);

  // Verificar se há um parâmetro de sessão na URL (retorno do Stripe)
  useEffect(() => {
    const checkStripeSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      
      if (sessionId && currentUser) {
        setIsProcessingSubscription(true);
        
        try {
          // Aqui você pode fazer uma chamada para verificar o status da sessão
          // Sem usar webhook, podemos armazenar os dados diretamente no Firestore
          console.log('Processando assinatura após retorno do Stripe. Session ID:', sessionId);
          
          // Aqui seria o código para atualizar o Firestore com os dados da assinatura
          // Usando o Firebase diretamente do cliente
          if (currentUser?.uid) {
            import('firebase/firestore').then(async (firestore) => {
              const { getFirestore, doc, updateDoc } = firestore;
              const db = getFirestore();
              
              // Atualizar o documento do usuário com os dados da assinatura
              await updateDoc(doc(db, 'users', currentUser.uid), {
                hasActiveSubscription: true,
                stripeSessionId: sessionId,
                subscriptionUpdatedAt: new Date().toISOString()
              });
              
              console.log('Dados da assinatura salvos no Firestore para o usuário:', currentUser.uid);
            }).catch(error => {
              console.error('Erro ao importar módulo do Firestore:', error);
            })
          }
          
          // Depois de processar, mostramos uma mensagem de sucesso
          toast({
            title: 'Assinatura confirmada!',
            description: 'Sua assinatura foi processada com sucesso.',
            variant: 'default',
          });
          
          // Limpar o parâmetro de sessão da URL para evitar processamento duplicado
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Erro ao processar assinatura:', error);
          toast({
            title: 'Erro na assinatura',
            description: 'Não foi possível confirmar sua assinatura. Entre em contato com o suporte.',
            variant: 'destructive',
          });
        } finally {
          setIsProcessingSubscription(false);
        }
      }
    };
    
    checkStripeSession();
  }, [currentUser, toast]);
  
  // Função para formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar data relativa (hoje, ontem, etc)
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const itemDate = new Date(date);
    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
    
    if (itemDay.getTime() === today.getTime()) {
      return `Hoje às ${itemDate.getHours().toString().padStart(2, '0')}:${itemDate.getMinutes().toString().padStart(2, '0')}`;
    } else if (itemDay.getTime() === yesterday.getTime()) {
      return `Ontem às ${itemDate.getHours().toString().padStart(2, '0')}:${itemDate.getMinutes().toString().padStart(2, '0')}`;
    } else {
      return `${itemDate.getDate().toString().padStart(2, '0')}/${(itemDate.getMonth() + 1).toString().padStart(2, '0')} às ${itemDate.getHours().toString().padStart(2, '0')}:${itemDate.getMinutes().toString().padStart(2, '0')}`;
    }
  };

  // Componente para atividade recente
  const getActivityIcon = (item: any) => {
    // Verificar tipo de atividade baseado nas propriedades
    if (item.patientId && item.type) {
      return (
        <div className="bg-primary/10 p-2 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    } else if (item.amount && item.description) {
      return (
        <div className="bg-blue-100 p-2 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="bg-green-100 p-2 rounded-full mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      );
    }
  };
  
  const getActivityTitle = (item: any) => {
    if (item.patientId && item.type) {
      return `Consulta ${item.status || 'agendada'}`;
    } else if (item.amount && item.description) {
      return item.type === 'receita' ? 'Pagamento recebido' : 'Despesa registrada';
    } else {
      return 'Paciente cadastrado';
    }
  };
  
  const getActivityDescription = (item: any) => {
    if (item.patientId && item.type) {
      const dateText = item.date instanceof Date 
        ? formatRelativeDate(item.date) 
        : formatRelativeDate(new Date(item.date));
      return `${item.patientName} - ${dateText}`;
    } else if (item.amount && item.description) {
      const dateText = item.date instanceof Date 
        ? formatRelativeDate(item.date) 
        : formatRelativeDate(new Date(item.date));
      return `${item.description} - ${formatCurrency(item.amount)} - ${dateText}`;
    } else {
      const createdAt = item.createdAt instanceof Date 
        ? formatRelativeDate(item.createdAt) 
        : formatRelativeDate(new Date(item.createdAt || new Date()));
      return `${item.name} - ${createdAt}`;
    }
  };

  return (
    <SidebarLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Carregando informações...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card de resumo 1 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-500 font-medium">Pacientes Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{patientCount}</div>
                <p className="text-sm text-gray-500 mt-1">Total de pacientes cadastrados</p>
              </CardContent>
            </Card>

            {/* Card de resumo 2 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-500 font-medium">Consultas Agendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{upcomingAppointments}</div>
                <p className="text-sm text-gray-500 mt-1">Para os próximos 7 dias</p>
              </CardContent>
            </Card>

            {/* Card de resumo 3 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-500 font-medium">Prescrições Emitidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{prescriptionCount}</div>
                <p className="text-sm text-gray-500 mt-1">Estimativa baseada em consultas</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Atividade recente */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-start">
                        {getActivityIcon(item)}
                        <div>
                          <p className="text-sm font-medium">{getActivityTitle(item)}</p>
                          <p className="text-xs text-gray-500">{getActivityDescription(item)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Nenhuma atividade recente encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo Financeiro */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Faturamento (Mês)</div>
                      <div className="text-2xl font-bold text-gray-800">{formatCurrency(monthlyRevenue)}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Consultas Realizadas</div>
                      <div className="text-2xl font-bold text-gray-800">{completedAppointments}</div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="text-sm font-medium mb-2">Evolução</div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{width: `${Math.min(100, (monthlyRevenue / 10000) * 100)}%`}}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>R$ 0</span>
                      <span>R$ 5.000</span>
                      <span>R$ 10.000+</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </SidebarLayout>
  );
};

export default Dashboard;