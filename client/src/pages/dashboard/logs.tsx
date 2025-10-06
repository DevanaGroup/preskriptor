import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import SidebarLayout from '@/components/SidebarLayout';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, Download, Filter, Calendar, User, Activity } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: Timestamp;
  details?: any;
}

const LogsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(50);

  // Carregar logs do Firestore
  const loadLogs = async () => {
    try {
      setIsLoading(true);
      
      let logsQuery = query(
        collection(db, 'logs'),
        orderBy('timestamp', 'desc'),
        limit(500) // Limitar para performance
      );

      // Aplicar filtro por usuário se selecionado
      if (selectedUser !== 'all') {
        logsQuery = query(
          collection(db, 'logs'),
          where('userId', '==', selectedUser),
          orderBy('timestamp', 'desc'),
          limit(500)
        );
      }

      const querySnapshot = await getDocs(logsQuery);
      const logsData: LogEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        logsData.push({
          id: doc.id,
          ...doc.data()
        } as LogEntry);
      });

      setLogs(logsData);
      
      // Extrair usuários únicos para o filtro
      const uniqueUsers = Array.from(
        new Map(logsData.map(log => [log.userId, { id: log.userId, name: log.userName }]))
        .values()
      );
      setUsers(uniqueUsers);
      
      // Extrair tipos de ação únicos
      const uniqueActions = Array.from(new Set(logsData.map(log => log.action)));
      setActionTypes(uniqueActions);
      
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isAdmin) {
      loadLogs();
    }
  }, [currentUser, selectedUser]);

  // Filtrar logs baseado na busca e filtros
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  });

  // Paginação
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Função para formatar timestamp
  const formatTimestamp = (timestamp: Timestamp) => {
    return format(timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  };

  // Função para obter cor da badge baseada na ação
  const getActionBadgeColor = (action: string) => {
    if (action.includes('Login') || action.includes('Logout')) return 'bg-blue-100 text-blue-800';
    if (action.includes('Criou') || action.includes('novo')) return 'bg-green-100 text-green-800';
    if (action.includes('Enviou')) return 'bg-purple-100 text-purple-800';
    if (action.includes('upload')) return 'bg-orange-100 text-orange-800';
    if (action.includes('receita')) return 'bg-red-100 text-red-800';
    if (action.includes('consulta')) return 'bg-cyan-100 text-cyan-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Função para exportar logs (básica)
  const exportLogs = () => {
    const csvContent = [
      ['Usuário', 'Ação', 'Data/Hora', 'Detalhes'],
      ...filteredLogs.map(log => [
        log.userName,
        log.action,
        formatTimestamp(log.timestamp),
        log.details ? JSON.stringify(log.details) : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminProtectedRoute>
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Logs do Sistema</h1>
            <Button onClick={exportLogs} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tipos de Ação</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{actionTypes.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Logs Filtrados</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por usuário, ação ou detalhes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Usuário</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuários</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Ação</label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      {actionTypes.map(action => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : currentLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum log encontrado
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {log.userName}
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionBadgeColor(log.action)}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatTimestamp(log.timestamp)}
                            </TableCell>
                            <TableCell>
                              {log.details ? (
                                <div className="text-sm text-gray-600">
                                  {typeof log.details === 'object' 
                                    ? Object.entries(log.details).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="font-medium">{key}:</span> {String(value)}
                                        </div>
                                      ))
                                    : String(log.details)
                                  }
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      
                      <span className="flex items-center px-4">
                        Página {currentPage} de {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    </AdminProtectedRoute>
  );
};

export default LogsPage;