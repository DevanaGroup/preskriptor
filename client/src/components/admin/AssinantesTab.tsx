import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MoreVertical, 
  Download, 
  Mail, 
  UserX,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { getAssinantes, AdminAssinante } from '@/services/adminService';
import { setUserAsAdmin, checkIfUserIsAdmin } from '@/lib/adminUtils';

const AssinantesTab: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAssinante, setSelectedAssinante] = useState<string | null>(null);
  const [adminStatuses, setAdminStatuses] = useState<Record<string, boolean>>({});
  const itemsPerPage = 10;

  // Buscar dados reais do Firestore
  const { data: assinantes, isLoading, error, refetch } = useQuery<AdminAssinante[]>({
    queryKey: ['admin/assinantes'],
    queryFn: getAssinantes,
    staleTime: 60000,
  });
  
  // Use effect para verificar quais usuários são administradores
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!assinantes) return;
      
      const statusMap: Record<string, boolean> = {};
      
      for (const assinante of assinantes) {
        try {
          const isAdmin = await checkIfUserIsAdmin(assinante.id);
          statusMap[assinante.id] = isAdmin;
        } catch (error) {
          console.error(`Erro ao verificar status de admin para ${assinante.id}:`, error);
          statusMap[assinante.id] = false;
        }
      }
      
      setAdminStatuses(statusMap);
    };
    
    checkAdminStatus();
  }, [assinantes]);
  
  // Função para definir um usuário como administrador
  const handleSetAdmin = async (userId: string, userName: string) => {
    try {
      await setUserAsAdmin(userId);
      
      // Atualizar o estado local
      setAdminStatuses(prev => ({
        ...prev,
        [userId]: true
      }));
      
      toast({
        title: "Permissão concedida",
        description: `${userName} agora é um administrador.`,
      });
      
      // Recarregar os dados
      refetch();
    } catch (error) {
      console.error('Erro ao definir administrador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível conceder permissões de administrador.",
        variant: "destructive"
      });
    }
  };

  // Filtros e paginação
  const filteredAssinantes = assinantes
    ? assinantes.filter(assinante => {
        const matchesSearch = 
          assinante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assinante.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          statusFilter === 'todos' || 
          assinante.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  const paginatedAssinantes = filteredAssinantes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAssinantes.length / itemsPerPage);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Ativo
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Cancelado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleExportData = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados serão enviados para seu e-mail em instantes."
    });
  };

  const handleEnviarEmail = (email: string) => {
    toast({
      title: "E-mail para " + email,
      description: "Interface de e-mail aberta."
    });
  };

  const handleCancelarAssinatura = (id: string, nome: string) => {
    toast({
      title: "Confirmar cancelamento",
      description: `Deseja realmente cancelar a assinatura de ${nome}?`,
      variant: "destructive"
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        <h3 className="font-semibold">Erro ao carregar assinantes</h3>
        <p>Tente novamente mais tarde ou contate o suporte.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gerenciamento de Assinantes</h2>
        <Button 
          variant="outline" 
          onClick={handleExportData}
          className="flex items-center"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Adesão</TableHead>
              <TableHead>Valor Mensal</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAssinantes.length > 0 ? (
              paginatedAssinantes.map((assinante) => (
                <TableRow key={assinante.id}>
                  <TableCell className="font-medium">{assinante.nome}</TableCell>
                  <TableCell>{assinante.email}</TableCell>
                  <TableCell>{assinante.plano}</TableCell>
                  <TableCell>{getStatusBadge(assinante.status)}</TableCell>
                  <TableCell>{assinante.dataAssinatura}</TableCell>
                  <TableCell>R$ {assinante.valorMensal.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEnviarEmail(assinante.email)}>
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Enviar e-mail</span>
                        </DropdownMenuItem>
                        
                        {!adminStatuses[assinante.id] && (
                          <DropdownMenuItem 
                            onClick={() => handleSetAdmin(assinante.id, assinante.nome)}
                            className="text-blue-600"
                          >
                            <i className="fas fa-user-shield mr-2 h-4 w-4" />
                            <span>Tornar administrador</span>
                          </DropdownMenuItem>
                        )}
                        
                        {assinante.status !== 'cancelado' && (
                          <DropdownMenuItem 
                            onClick={() => handleCancelarAssinatura(assinante.id, assinante.nome)}
                            className="text-red-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            <span>Cancelar assinatura</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  {searchTerm || statusFilter !== 'todos' ? (
                    <p>Nenhum assinante corresponde aos filtros aplicados.</p>
                  ) : (
                    <p>Nenhum assinante registrado no sistema.</p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Mostrando {paginatedAssinantes.length} de {filteredAssinantes.length} resultados
          </div>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssinantesTab;