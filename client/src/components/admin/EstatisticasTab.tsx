import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, Activity } from 'lucide-react';

// Tipos para representação de dados estatísticos
interface EstatsData {
  usuariosAtivos: {
    total: number;
    novos: number;
    taxa: number;
    porPlano: {
      mensal: number;
      anual: number;
      time: number;
    };
  };
  engajamento: {
    mediaDiaria: number;
    taxaRetencao: number;
    tempoMedio: number;
    funcionalidadesMaisUsadas: {
      nome: string;
      usos: number;
    }[];
  };
  dispositivos: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  crescimentoMensal: {
    mes: string;
    usuarios: number;
  }[];
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

const EstatisticasTab: React.FC = () => {
  // Mock data para demonstração
  const { data: stats, isLoading } = useQuery<EstatsData>({
    queryKey: ['/api/admin/estatisticas'],
    queryFn: async () => {
      // Simular chamada à API
      return new Promise<EstatsData>((resolve) => {
        setTimeout(() => {
          resolve({
            usuariosAtivos: {
              total: 687,
              novos: 42,
              taxa: 95.3,
              porPlano: {
                mensal: 204,
                anual: 382,
                time: 101
              }
            },
            engajamento: {
              mediaDiaria: 482,
              taxaRetencao: 87.2,
              tempoMedio: 26.8,
              funcionalidadesMaisUsadas: [
                { nome: 'Prescrições', usos: 8547 },
                { nome: 'Consultas', usos: 5213 },
                { nome: 'Pacientes', usos: 4102 },
                { nome: 'Financeiro', usos: 2145 },
                { nome: 'Agenda', usos: 1876 }
              ]
            },
            dispositivos: {
              desktop: 63,
              mobile: 28,
              tablet: 9
            },
            crescimentoMensal: [
              { mes: 'Jan', usuarios: 487 },
              { mes: 'Fev', usuarios: 512 },
              { mes: 'Mar', usuarios: 558 },
              { mes: 'Abr', usuarios: 626 },
              { mes: 'Mai', usuarios: 687 }
            ]
          });
        }, 800);
      });
    },
    staleTime: 60000,
  });

  const handleExportData = () => {
    // Implementar exportação de dados
    console.log('Exportando dados de estatísticas');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Formatar dados para gráfico de pizza
  const pieData = stats ? [
    { name: 'Mensal', value: stats.usuariosAtivos.porPlano.mensal },
    { name: 'Anual', value: stats.usuariosAtivos.porPlano.anual },
    { name: 'Time', value: stats.usuariosAtivos.porPlano.time }
  ] : [];

  // Formatar dados para gráfico de barras (recursos mais usados)
  const barData = stats?.engajamento.funcionalidadesMaisUsadas;

  // Formatar dados para gráfico de dispositivos
  const deviceData = stats ? [
    { name: 'Desktop', value: stats.dispositivos.desktop },
    { name: 'Mobile', value: stats.dispositivos.mobile },
    { name: 'Tablet', value: stats.dispositivos.tablet }
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Estatísticas da Plataforma</h2>
        <div className="flex gap-2">
          <Select defaultValue="ultimo-mes">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ultimo-mes">Último mês</SelectItem>
              <SelectItem value="ultimo-trimestre">Último trimestre</SelectItem>
              <SelectItem value="ultimo-ano">Último ano</SelectItem>
              <SelectItem value="desde-inicio">Desde o início</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="w-4 h-4 mr-1 text-primary" />
              Total de Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.usuariosAtivos.total}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+{stats?.usuariosAtivos.novos} novos este mês</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="w-4 h-4 mr-1 text-primary" />
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.engajamento.taxaRetencao}%
            </div>
            <Progress 
              value={stats?.engajamento.taxaRetencao} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="w-4 h-4 mr-1 text-primary" />
              Logins Diários (média)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.engajamento.mediaDiaria}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats?.engajamento.mediaDiaria ?? 0) / (stats?.usuariosAtivos.total ?? 1) * 100).toFixed(1)}% de usuários ativos por dia
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="w-4 h-4 mr-1 text-primary" />
              Tempo Médio de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.engajamento.tempoMedio} min
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por sessão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crescimento mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento Mensal de Usuários</CardTitle>
            <CardDescription>
              Evolução do total de usuários ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.crescimentoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="usuarios"
                    stroke="#4f46e5"
                    activeDot={{ r: 8 }}
                    name="Usuários Ativos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por plano */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
            <CardDescription>
              Porcentagem de usuários por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} usuários`, 'Total']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades mais usadas */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Mais Utilizadas</CardTitle>
            <CardDescription>
              Número de acessos por módulo do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usos" fill="#4f46e5" name="Número de Acessos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por dispositivo */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso por Dispositivo</CardTitle>
            <CardDescription>
              Porcentagem de acessos por tipo de dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Porcentagem']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstatisticasTab;