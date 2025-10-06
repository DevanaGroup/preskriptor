import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Plus, FileText, Calendar, Search, Eye, Download, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import SidebarLayout from '@/components/SidebarLayout';
import { logAction } from '@/lib/logger';
import memedIcon from '@assets/image_1749057814027.png';

interface MemedMedicamento {
  id: string;
  nome: string;
  dosagem?: string;
  unidade?: string;
  quantidade?: number;
  posologia?: string;
  orientacoes?: string;
}

interface MemedReceita {
  paciente: {
    nome: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    dataNascimento?: string;
  };
  medicamentos: MemedMedicamento[];
  observacoes?: string;
  dataVencimento?: string;
  tipo: 'COMUM' | 'CONTROLADO' | 'ESPECIAL';
}

interface Prescricao {
  id: string;
  pacienteNome: string;
  medicamentos: string[];
  data: string;
  status: 'ativa' | 'expirada' | 'cancelada';
  observacoes?: string;
  url?: string;
}

export default function PrescricoesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [prescricoes, setPrescricoes] = useState<Prescricao[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNovaReceita, setShowNovaReceita] = useState(false);
  const [memedToken, setMemedToken] = useState<string>('');
  const [configurandoMemed, setConfigurandoMemed] = useState(false);
  
  // Estados para nova prescrição
  const [novaReceita, setNovaReceita] = useState<MemedReceita>({
    paciente: {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
    },
    medicamentos: [],
    observacoes: '',
    tipo: 'COMUM'
  });
  
  const [medicamentoAtual, setMedicamentoAtual] = useState<MemedMedicamento>({
    id: '',
    nome: '',
    dosagem: '',
    unidade: '',
    quantidade: 1,
    posologia: '',
    orientacoes: ''
  });
  
  const [buscaMedicamento, setBuscaMedicamento] = useState('');
  const [medicamentosEncontrados, setMedicamentosEncontrados] = useState<MemedMedicamento[]>([]);
  const [buscandoMedicamentos, setBuscandoMedicamentos] = useState(false);

  // Configurar integração com Memed ao carregar a página
  useEffect(() => {
    if (currentUser && !memedToken) {
      configurarMemed();
    }
  }, [currentUser]);

  const configurarMemed = async () => {
    try {
      setConfigurandoMemed(true);
      
      const response = await fetch('/api/memed/configure-prescritor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser?.uid,
          name: currentUser?.name,
          email: currentUser?.email,
          cellphone: currentUser?.cellphone,
          crm: currentUser?.crm,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMemedToken(data.token);
        toast({
          title: "Integração Memed configurada",
          description: "Pronto para criar prescrições digitais!",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Erro ao configurar Memed:', error);
      toast({
        title: "Erro na configuração",
        description: "Não foi possível configurar a integração com Memed.",
        variant: "destructive",
      });
    } finally {
      setConfigurandoMemed(false);
    }
  };

  const buscarMedicamentos = async () => {
    if (!buscaMedicamento.trim() || !memedToken) return;
    
    try {
      setBuscandoMedicamentos(true);
      
      const response = await fetch(`/api/memed/medicamentos?token=${memedToken}&q=${encodeURIComponent(buscaMedicamento)}`);
      const data = await response.json();
      
      if (data.success) {
        setMedicamentosEncontrados(data.medicamentos || []);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Erro ao buscar medicamentos:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar medicamentos.",
        variant: "destructive",
      });
    } finally {
      setBuscandoMedicamentos(false);
    }
  };

  const selecionarMedicamento = (medicamento: MemedMedicamento) => {
    setMedicamentoAtual({
      ...medicamento,
      quantidade: 1,
      posologia: '',
      orientacoes: ''
    });
    setMedicamentosEncontrados([]);
    setBuscaMedicamento('');
  };

  const adicionarMedicamento = () => {
    if (!medicamentoAtual.nome) {
      toast({
        title: "Medicamento obrigatório",
        description: "Selecione um medicamento antes de adicionar.",
        variant: "destructive",
      });
      return;
    }

    setNovaReceita(prev => ({
      ...prev,
      medicamentos: [...prev.medicamentos, { ...medicamentoAtual, id: Date.now().toString() }]
    }));
    
    setMedicamentoAtual({
      id: '',
      nome: '',
      dosagem: '',
      unidade: '',
      quantidade: 1,
      posologia: '',
      orientacoes: ''
    });
  };

  const removerMedicamento = (index: number) => {
    setNovaReceita(prev => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((_, i) => i !== index)
    }));
  };

  const criarPrescricao = async () => {
    try {
      setIsLoading(true);
      
      if (!novaReceita.paciente.nome || novaReceita.medicamentos.length === 0) {
        toast({
          title: "Dados incompletos",
          description: "Preencha o nome do paciente e adicione pelo menos um medicamento.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/memed/prescricao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: memedToken,
          receita: novaReceita
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Prescrição criada!",
          description: "Prescrição digital criada com sucesso na plataforma Memed.",
        });
        
        await logAction('Criou nova prescrição Memed', { 
          paciente: novaReceita.paciente.nome,
          medicamentos: novaReceita.medicamentos.length 
        });
        
        // Adicionar à lista local
        const novaPrescricao: Prescricao = {
          id: data.prescricao.id,
          pacienteNome: novaReceita.paciente.nome,
          medicamentos: novaReceita.medicamentos.map(m => `${m.nome} ${m.dosagem || ''}`),
          data: new Date().toISOString().split('T')[0],
          status: 'ativa',
          observacoes: novaReceita.observacoes,
          url: data.prescricao.url
        };
        
        setPrescricoes(prev => [novaPrescricao, ...prev]);
        setShowNovaReceita(false);
        resetForm();
        
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('Erro ao criar prescrição:', error);
      toast({
        title: "Erro ao criar prescrição",
        description: "Não foi possível criar a prescrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNovaReceita({
      paciente: {
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
      },
      medicamentos: [],
      observacoes: '',
      tipo: 'COMUM'
    });
    setMedicamentoAtual({
      id: '',
      nome: '',
      dosagem: '',
      unidade: '',
      quantidade: 1,
      posologia: '',
      orientacoes: ''
    });
  };

  const handleNovaPrescricao = async () => {
    await logAction('Clicou em Nova Prescrição Memed');
    setShowNovaReceita(true);
  };

  const filteredPrescricoes = prescricoes.filter(prescricao =>
    prescricao.pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescricao.medicamentos.some(med => med.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800';
      case 'expirada': return 'bg-yellow-100 text-yellow-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (configurandoMemed) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Configurando integração Memed</h3>
              <p className="text-muted-foreground">
                Preparando sua conta para criar prescrições digitais...
              </p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (showNovaReceita) {
    return (
      <SidebarLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={memedIcon} alt="Memed" className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Nova Prescrição Digital</h1>
                <p className="text-muted-foreground">
                  Crie uma prescrição digital válida através da plataforma Memed
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowNovaReceita(false)}
            >
              Voltar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
              <CardDescription>
                Informações do paciente para a prescrição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente">Nome do Paciente *</Label>
                  <Input 
                    id="paciente" 
                    placeholder="Digite o nome completo" 
                    value={novaReceita.paciente.nome}
                    onChange={(e) => setNovaReceita(prev => ({
                      ...prev,
                      paciente: { ...prev.paciente, nome: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF do Paciente</Label>
                  <Input 
                    id="cpf" 
                    placeholder="000.000.000-00" 
                    value={novaReceita.paciente.cpf}
                    onChange={(e) => setNovaReceita(prev => ({
                      ...prev,
                      paciente: { ...prev.paciente, cpf: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail do Paciente</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="paciente@email.com" 
                    value={novaReceita.paciente.email}
                    onChange={(e) => setNovaReceita(prev => ({
                      ...prev,
                      paciente: { ...prev.paciente, email: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    placeholder="(00) 00000-0000" 
                    value={novaReceita.paciente.telefone}
                    onChange={(e) => setNovaReceita(prev => ({
                      ...prev,
                      paciente: { ...prev.paciente, telefone: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medicamentos</CardTitle>
              <CardDescription>
                Busque e adicione medicamentos à prescrição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="busca-medicamento">Buscar Medicamento</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="busca-medicamento" 
                      placeholder="Digite o nome do medicamento" 
                      value={buscaMedicamento}
                      onChange={(e) => setBuscaMedicamento(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && buscarMedicamentos()}
                    />
                    <Button 
                      type="button" 
                      onClick={buscarMedicamentos}
                      disabled={buscandoMedicamentos || !memedToken}
                    >
                      {buscandoMedicamentos ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {medicamentosEncontrados.length > 0 && (
                  <div className="border rounded-md p-4 space-y-2">
                    <Label>Medicamentos encontrados:</Label>
                    {medicamentosEncontrados.map((med, index) => (
                      <div 
                        key={index}
                        className="p-2 hover:bg-gray-50 cursor-pointer rounded border"
                        onClick={() => selecionarMedicamento(med)}
                      >
                        <div className="font-medium">{med.nome}</div>
                        {med.dosagem && <div className="text-sm text-gray-600">{med.dosagem}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {medicamentoAtual.nome && (
                  <div className="border rounded-md p-4 space-y-4">
                    <Label>Configurar medicamento: {medicamentoAtual.nome}</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantidade">Quantidade *</Label>
                        <Input 
                          id="quantidade" 
                          type="number" 
                          placeholder="Ex: 30" 
                          value={medicamentoAtual.quantidade}
                          onChange={(e) => setMedicamentoAtual(prev => ({
                            ...prev,
                            quantidade: parseInt(e.target.value) || 1
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unidade">Unidade</Label>
                        <Input 
                          id="unidade" 
                          placeholder="Ex: comprimidos" 
                          value={medicamentoAtual.unidade}
                          onChange={(e) => setMedicamentoAtual(prev => ({
                            ...prev,
                            unidade: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="posologia">Posologia *</Label>
                        <Input 
                          id="posologia" 
                          placeholder="Ex: 1x ao dia" 
                          value={medicamentoAtual.posologia}
                          onChange={(e) => setMedicamentoAtual(prev => ({
                            ...prev,
                            posologia: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="orientacoes-med">Orientações de Uso</Label>
                      <Textarea 
                        id="orientacoes-med" 
                        placeholder="Ex: Tomar após as refeições, com água"
                        rows={2}
                        value={medicamentoAtual.orientacoes}
                        onChange={(e) => setMedicamentoAtual(prev => ({
                          ...prev,
                          orientacoes: e.target.value
                        }))}
                      />
                    </div>
                    
                    <Button onClick={adicionarMedicamento}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Medicamento
                    </Button>
                  </div>
                )}
              </div>

              {novaReceita.medicamentos.length > 0 && (
                <div className="space-y-4">
                  <Label>Medicamentos adicionados:</Label>
                  {novaReceita.medicamentos.map((med, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="space-y-1">
                        <div className="font-medium">{med.nome} {med.dosagem}</div>
                        <div className="text-sm text-gray-600">
                          {med.quantidade} {med.unidade} - {med.posologia}
                        </div>
                        {med.orientacoes && (
                          <div className="text-sm text-gray-500">{med.orientacoes}</div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerMedicamento(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações da Prescrição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo-receita">Tipo de Receita</Label>
                <Select
                  value={novaReceita.tipo}
                  onValueChange={(value: 'COMUM' | 'CONTROLADO' | 'ESPECIAL') => 
                    setNovaReceita(prev => ({ ...prev, tipo: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMUM">Receita Comum</SelectItem>
                    <SelectItem value="CONTROLADO">Receita Controlada</SelectItem>
                    <SelectItem value="ESPECIAL">Receita Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes-gerais">Observações Gerais</Label>
                <Textarea 
                  id="observacoes-gerais" 
                  placeholder="Observações adicionais sobre a prescrição"
                  rows={3}
                  value={novaReceita.observacoes}
                  onChange={(e) => setNovaReceita(prev => ({
                    ...prev,
                    observacoes: e.target.value
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowNovaReceita(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={criarPrescricao} 
              disabled={isLoading || !memedToken}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Prescrição Digital'
              )}
            </Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={memedIcon} alt="Memed" className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Prescrições Memed</h1>
              <p className="text-muted-foreground">
                Gerencie suas prescrições digitais através da plataforma Memed
              </p>
            </div>
          </div>
          <Button onClick={handleNovaPrescricao} disabled={!memedToken}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Prescrição
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar prescrições..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid gap-6">
          {filteredPrescricoes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <img src={memedIcon} alt="Memed" className="h-16 w-16 opacity-50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma prescrição encontrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? 'Não encontramos prescrições com os termos pesquisados.' 
                    : 'Você ainda não criou nenhuma prescrição digital.'}
                </p>
                <Button onClick={handleNovaPrescricao} disabled={!memedToken}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira prescrição
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPrescricoes.map((prescricao) => (
              <Card key={prescricao.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium">{prescricao.pacienteNome}</h3>
                        <Badge className={getStatusColor(prescricao.status)}>
                          {prescricao.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        {new Date(prescricao.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {prescricao.url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(prescricao.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Medicamentos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {prescricao.medicamentos.map((medicamento, index) => (
                        <Badge key={index} variant="secondary">
                          {medicamento}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {prescricao.observacoes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-1">Observações:</h4>
                      <p className="text-sm text-muted-foreground">{prescricao.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}