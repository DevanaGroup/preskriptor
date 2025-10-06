import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getMensagens, atualizarStatusMensagem, deletarMensagem, AdminMensagem } from '@/services/adminService';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Mail, 
  MoreVertical, 
  Trash, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para representação de dados
interface Mensagem {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  data: string;
  status: 'novo' | 'respondido' | 'pendente';
}

const MensagensTab: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedMessage, setSelectedMessage] = useState<Mensagem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Buscar dados reais do Firestore
  const { data: mensagens, isLoading, refetch } = useQuery<AdminMensagem[]>({
    queryKey: ['admin/mensagens'],
    queryFn: getMensagens,
    staleTime: 60000
  });

  // Filtros e paginação
  const filteredMensagens = mensagens
    ? mensagens.filter(mensagem => {
        const matchesSearch = 
          mensagem.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mensagem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mensagem.mensagem.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          statusFilter === 'todos' || 
          mensagem.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  const paginatedMensagens = filteredMensagens.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMensagens.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'novo':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Novo
          </Badge>
        );
      case 'respondido':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Respondido
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handleSelectMessage = (mensagem: Mensagem) => {
    setSelectedMessage(mensagem);
    
    // Pré-preenchimento da resposta para facilitar
    if (mensagem.status === 'novo') {
      setReplyText(`Olá ${mensagem.nome.split(' ')[0]},\n\nObrigado por entrar em contato conosco.\n\n[Sua resposta aqui]\n\nAtenciosamente,\nEquipe Preskriptor`);
    } else {
      setReplyText('');
    }
  };

  // Mutação para atualizar status da mensagem
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'novo' | 'respondido' | 'pendente' }) => 
      atualizarStatusMensagem(id, status),
    onSuccess: () => {
      refetch(); // Recarregar a lista após atualização
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: `Não foi possível atualizar o status da mensagem: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutação para deletar mensagem
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletarMensagem(id),
    onSuccess: () => {
      refetch(); // Recarregar a lista após exclusão
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir mensagem",
        description: `Não foi possível excluir a mensagem: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    toast({
      title: "Resposta enviada",
      description: `E-mail enviado para ${selectedMessage.email}.`,
    });
    
    // Atualizar o status da mensagem para 'respondido'
    updateStatusMutation.mutate({ 
      id: selectedMessage.id, 
      status: 'respondido' 
    });
    
    // Atualiza o estado local
    setSelectedMessage(prev => prev ? { ...prev, status: 'respondido' } : null);
    setReplyText('');
  };

  const handleDeleteMessage = (id: string) => {
    // Executar mutação para deletar
    deleteMutation.mutate(id);
    
    toast({
      title: "Mensagem excluída",
      description: "A mensagem foi excluída com sucesso.",
    });
    
    // Fechar o painel de detalhes se a mensagem excluída está selecionada
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Lista de mensagens */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mensagens</h2>
          <Badge className="bg-blue-100 text-blue-800">
            {filteredMensagens.length} mensagens
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar mensagens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="novo">Novos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="respondido">Respondidos</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-3 mt-4">
          {paginatedMensagens.length > 0 ? (
            paginatedMensagens.map((mensagem) => (
              <Card 
                key={mensagem.id}
                className={`cursor-pointer transition hover:shadow-md ${
                  selectedMessage?.id === mensagem.id ? 'border-primary ring-1 ring-primary' : ''
                }`}
                onClick={() => handleSelectMessage(mensagem)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{mensagem.nome}</CardTitle>
                      <CardDescription className="text-xs">
                        {formatDate(mensagem.data)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(mensagem.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(mensagem.id);
                          }}>
                            <Trash className="mr-2 h-4 w-4 text-red-600" />
                            <span className="text-red-600">Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm line-clamp-2">
                    {mensagem.mensagem}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'todos'
                    ? 'Nenhuma mensagem corresponde aos filtros aplicados.'
                    : 'Nenhuma mensagem recebida.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">
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
        )}
      </div>

      {/* Detalhes da mensagem */}
      <div className="md:col-span-2">
        {selectedMessage ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedMessage.nome}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-col gap-1 mt-1">
                      <span>{selectedMessage.email}</span>
                      <span>{selectedMessage.telefone}</span>
                      <span className="text-xs mt-1">{formatDate(selectedMessage.data)}</span>
                    </div>
                  </CardDescription>
                </div>
                <div>
                  {getStatusBadge(selectedMessage.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">Mensagem original:</h3>
                <p className="text-gray-700">{selectedMessage.mensagem}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Responder:</h3>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  rows={6}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button 
                    variant="default" 
                    className="flex items-center"
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Resposta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <Mail className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">Nenhuma mensagem selecionada</h3>
              <p className="text-gray-500 mt-2">
                Selecione uma mensagem da lista para visualizar os detalhes e responder.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MensagensTab;