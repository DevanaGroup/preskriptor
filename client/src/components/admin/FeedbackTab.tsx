import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye,
  User,
  Mail,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedbackItem {
  id: string;
  type: 'negative' | 'positive';
  feedbackText: string;
  messageContent: string;
  userInfo: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  status: 'novo' | 'analisando' | 'concluido';
  chatHistory?: any[];
}

const FeedbackTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Buscar feedbacks do backend
  const { data: feedbacks, isLoading, error } = useQuery<FeedbackItem[]>({
    queryKey: ['admin/feedback'],
    queryFn: async () => {
      const response = await fetch('/api/admin/feedback');
      if (!response.ok) {
        throw new Error('Erro ao buscar feedbacks');
      }
      return response.json();
    },
    staleTime: 60000,
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin/feedback'] });
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso',
        variant: 'default',
        className: 'bg-green-500 text-white border-green-600',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do feedback',
        variant: 'destructive',
      });
    },
  });

  // Filtros
  const filteredFeedbacks = feedbacks
    ? feedbacks.filter(feedback => {
        const matchesSearch = 
          feedback.userInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.userInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.feedbackText.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          statusFilter === 'todos' || 
          feedback.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  const paginatedFeedbacks = filteredFeedbacks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);

  // Badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'novo':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Novo
          </Badge>
        );
      case 'analisando':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" /> Analisando
          </Badge>
        );
      case 'concluido':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Concluído
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

  const handleStatusChange = (feedbackId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: feedbackId, status: newStatus });
  };

  const handleViewDetails = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
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
      <div className="flex flex-col items-center justify-center p-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">Erro ao carregar feedbacks</h3>
        <p className="text-gray-500 text-center">
          Ocorreu um erro ao buscar os feedbacks. Tente recarregar a página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredFeedbacks.filter(f => f.status === 'novo').length}
                </p>
                <p className="text-sm text-gray-600">Novos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredFeedbacks.filter(f => f.status === 'analisando').length}
                </p>
                <p className="text-sm text-gray-600">Em Análise</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredFeedbacks.filter(f => f.status === 'concluido').length}
                </p>
                <p className="text-sm text-gray-600">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{filteredFeedbacks.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Buscar por nome, email ou texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="analisando">Em Análise</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>Feedbacks Negativos</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">Nenhum feedback encontrado</h3>
              <p className="text-gray-500 mt-2">
                Não há feedbacks que correspondam aos filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{feedback.userInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{feedback.userInfo.email}</span>
                        </div>
                        {getStatusBadge(feedback.status)}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        <strong>Feedback:</strong> {feedback.feedbackText}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(feedback.timestamp)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(feedback)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      
                      <Select
                        value={feedback.status}
                        onValueChange={(value) => handleStatusChange(feedback.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="analisando">Analisar</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredFeedbacks.length)} de {filteredFeedbacks.length} feedbacks
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Feedback</DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6">
              {/* Informações do usuário */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações do Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome</label>
                      <p className="text-gray-900">{selectedFeedback.userInfo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedFeedback.userInfo.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data</label>
                      <p className="text-gray-900">{formatDate(selectedFeedback.timestamp)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedFeedback.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback do usuário */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Feedback do Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.feedbackText}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Mensagem da IA que recebeu feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Mensagem da IA (Problema Relatado)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.messageContent}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Select
                  value={selectedFeedback.status}
                  onValueChange={(value) => {
                    handleStatusChange(selectedFeedback.id, value);
                    setSelectedFeedback({ ...selectedFeedback, status: value as any });
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="analisando">Em Análise</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={() => setSelectedFeedback(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackTab;