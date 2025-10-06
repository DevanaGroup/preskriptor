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
        // Carregar pacientes
        const patients = await getPatients(currentUser.uid);
        setPatientCount(patients.length);
        
        // Pegar os 3 pacientes mais recentes
        const sortedPatients = patients.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setRecentPatients(sortedPatients.slice(0, 3));
        
        // Carregar consultas
        const consultations = await getConsultations(currentUser.uid);
        setConsultationCount(consultations.length);
        
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do dashboard",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, toast]);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {currentUser?.displayName || 'Doutor'}!
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientCount}</div>
              <p className="text-xs text-muted-foreground">
                Pacientes cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultationCount}</div>
              <p className="text-xs text-muted-foreground">
                Consultas com IA realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividade</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patientCount > 0 ? Math.round((consultationCount / patientCount) * 100) / 100 : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Consultas por paciente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ações rápidas */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/pacientes">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-900">Gerenciar Pacientes</p>
                    <p className="text-sm text-blue-700">Adicionar ou visualizar pacientes</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/consulta">
                <div className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                  <MessageSquare className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">Nova Consulta IA</p>
                    <p className="text-sm text-green-700">Iniciar consulta com inteligência artificial</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Pacientes recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Pacientes Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPatients.length > 0 ? (
                <div className="space-y-3">
                  {recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum paciente cadastrado ainda</p>
                  <Link href="/dashboard/pacientes">
                    <span className="text-primary hover:underline cursor-pointer">
                      Adicionar primeiro paciente
                    </span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;