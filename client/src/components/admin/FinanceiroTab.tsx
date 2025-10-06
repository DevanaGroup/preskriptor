import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

// Tipos para representação de dados financeiros
interface FinanceiroMensal {
  mes: string;
  receita: number;
  novosAssinantes: number;
  cancelamentos: number;
}

interface Transacao {
  id: string;
  data: string;
  assinante: string;
  plano: string;
  valor: number;
  status: 'confirmado' | 'pendente' | 'falha';
}

const FinanceiroTab: React.FC = () => {
  const { toast } = useToast();
  const [periodoFiltro, setPeriodoFiltro] = useState('2025');
  
  // Mock data para demonstração
  const { data: financeiroData, isLoading: isLoadingFinanceiro } = useQuery<FinanceiroMensal[]>({
    queryKey: ['/api/admin/financeiro', periodoFiltro],
    queryFn: async () => {
      // Simular chamada à API
      return new Promise<FinanceiroMensal[]>((resolve) => {
        setTimeout(() => {
          resolve([
            { mes: 'Jan', receita: 25470, novosAssinantes: 12, cancelamentos: 3 },
            { mes: 'Fev', receita: 28950, novosAssinantes: 15, cancelamentos: 2 },
            { mes: 'Mar', receita: 32400, novosAssinantes: 18, cancelamentos: 4 },
            { mes: 'Abr', receita: 35600, novosAssinantes: 14, cancelamentos: 5 },
            { mes: 'Mai', receita: 38200, novosAssinantes: 20, cancelamentos: 3 },
          ]);
        }, 800);
      });
    },
    staleTime: 60000,
  });

  const { data: transacoes, isLoading: isLoadingTransacoes } = useQuery<Transacao[]>({
    queryKey: ['/api/admin/transacoes'],
    queryFn: async () => {
      // Simular chamada à API
      return new Promise<Transacao[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 'tx1',
              data: '05/05/2025',
              assinante: 'Dr. Carlos Mendes',
              plano: 'Anual',
              valor: 247.00,
              status: 'confirmado'
            },
            {
              id: 'tx2',
              data: '04/05/2025',
              assinante: 'Dra. Ana Souza',
              plano: 'Mensal',
              valor: 347.00,
              status: 'confirmado'
            },
            {
              id: 'tx3',
              data: '02/05/2025',
              assinante: 'Dr. Ricardo Silva',
              plano: 'Anual',
              valor: 247.00,
              status: 'pendente'
            },
            {
              id: 'tx4',
              data: '01/05/2025',
              assinante: 'Dr. André Oliveira',
              plano: 'Time',
              valor: 997.00,
              status: 'confirmado'
            },
            {
              id: 'tx5',
              data: '01/05/2025',
              assinante: 'Dra. Juliana Costa',
              plano: 'Mensal',
              valor: 347.00,
              status: 'falha'
            }
          ]);
        }, 1000);
      });
    },
    staleTime: 60000,
  });

  // Calcular métricas
  const calcularMetricas = () => {
    if (!financeiroData) return { 
      receitaTotal: 0,
      mediaAssinantes: 0, 
      taxaCrescimento: 0, 
      taxaRetencao: 0 
    };

    const receitaTotal = financeiroData.reduce((sum, item) => sum + item.receita, 0);
    const totalAssinantes = financeiroData.reduce((sum, item) => sum + item.novosAssinantes, 0);
    const totalCancelamentos = financeiroData.reduce((sum, item) => sum + item.cancelamentos, 0);
    
    // Calcular taxa de crescimento entre o primeiro e último mês
    const primeiraMes = financeiroData[0]?.receita || 0;
    const ultimoMes = financeiroData[financeiroData.length - 1]?.receita || 0;
    const taxaCrescimento = primeiraMes ? ((ultimoMes - primeiraMes) / primeiraMes) * 100 : 0;
    
    // Taxa de retenção
    const taxaRetencao = totalAssinantes > 0 
      ? (1 - (totalCancelamentos / totalAssinantes)) * 100 
      : 0;

    return {
      receitaTotal,
      mediaAssinantes: totalAssinantes / financeiroData.length,
      taxaCrescimento,
      taxaRetencao
    };
  };

  const metricas = calcularMetricas();

  const handleExportData = () => {
    toast({
      title: "Exportação de dados financeiros",
      description: "Relatório será enviado por e-mail em instantes."
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmado': return 'text-green-600';
      case 'pendente': return 'text-yellow-600';
      case 'falha': return 'text-red-600';
      default: return '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Análise Financeira</h2>
        <div className="flex gap-2">
          <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="ultimos6meses">Últimos 6 meses</SelectItem>
              <SelectItem value="ultimos12meses">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>
      
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-primary" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metricas.receitaTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Período selecionado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="w-4 h-4 mr-1 text-primary" />
              Novos Assinantes (média)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas.mediaAssinantes.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Por mês no período
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-primary" />
              Taxa de Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {metricas.taxaCrescimento > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                  <span className="text-green-600">+{metricas.taxaCrescimento.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                  <span className="text-red-600">{metricas.taxaCrescimento.toFixed(1)}%</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Comparado ao início do período
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="w-4 h-4 mr-1 text-primary" />
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricas.taxaRetencao.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assinantes mantidos
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingFinanceiro ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financeiroData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))} 
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="receita" fill="#4f46e5" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Tabela de Transações Recentes */}
      <div>
        <h3 className="text-lg font-medium mb-4">Transações Recentes</h3>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Assinante</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransacoes ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : transacoes?.length ? (
                transacoes.map((transacao) => (
                  <TableRow key={transacao.id}>
                    <TableCell>{transacao.data}</TableCell>
                    <TableCell className="font-medium">{transacao.assinante}</TableCell>
                    <TableCell>{transacao.plano}</TableCell>
                    <TableCell>{formatCurrency(transacao.valor)}</TableCell>
                    <TableCell className={getStatusColor(transacao.status)}>
                      {transacao.status === 'confirmado' && 'Confirmado'}
                      {transacao.status === 'pendente' && 'Pendente'}
                      {transacao.status === 'falha' && 'Falha'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <p>Nenhuma transação encontrada.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroTab;