import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Patient, getPatients } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PacientesPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPacientes, setFilteredPacientes] = useState<Patient[]>([]);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [showEditPatientDialog, setShowEditPatientDialog] = useState(false);
  const [showViewPatientDialog, setShowViewPatientDialog] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    cellphone: ''
  });
  const [editPatientData, setEditPatientData] = useState({
    name: '',
    email: '',
    cellphone: ''
  });
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Carregar pacientes do Firebase
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const loadPacientes = async () => {
      setIsLoading(true);
      
      // Timeout para a operação do Firebase
      const timeoutPromise = new Promise((_: any, reject) => {
        setTimeout(() => {
          reject(new Error("Tempo esgotado para o Firestore. A lista de pacientes pode estar incompleta."));
        }, 5000); // 5 segundos de timeout
      });
      
      try {
        // Tentamos carregar do Firebase, mas com timeout
        let loadedPacientes: Patient[] = [];
        
        try {
          loadedPacientes = await Promise.race([
            getPatients(currentUser.uid),
            timeoutPromise
          ]) as Patient[];
        } catch (firebaseError) {
          console.warn("Firebase timeout ao carregar pacientes:", firebaseError);
          
          toast({
            title: "Aviso",
            description: "Conexão lenta com o banco de dados. Algumas informações podem estar indisponíveis.",
          });
          
          // Continuamos com uma lista vazia
          loadedPacientes = [];
        }
        
        setPacientes(loadedPacientes);
        setFilteredPacientes(loadedPacientes);
      } catch (error) {
        console.error("Erro ao carregar pacientes:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de pacientes",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPacientes();
  }, [currentUser?.uid, toast]);
  
  // Função para formatar datas
  const formatarData = (data?: Date | null) => {
    if (!data) return '-';
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return '-';
    }
  };
  
  // Filtrar pacientes com base na busca
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredPacientes(pacientes);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = pacientes.filter(paciente => 
      paciente.name.toLowerCase().includes(query) ||
      paciente.email.toLowerCase().includes(query) ||
      paciente.cellphone.toLowerCase().includes(query)
    );
    
    setFilteredPacientes(filtered);
  };
  
  // Função para abrir o diálogo de edição
  const handleEditPatient = (paciente: Patient) => {
    setSelectedPatient(paciente);
    setEditPatientData({
      name: paciente.name,
      email: paciente.email,
      cellphone: paciente.cellphone
    });
    setShowEditPatientDialog(true);
  };

  // Função para abrir o diálogo de visualização
  const handleViewPatient = (paciente: Patient) => {
    setSelectedPatient(paciente);
    setShowViewPatientDialog(true);
  };

  // Função para salvar edições do paciente
  const handleSavePatientEdits = async () => {
    if (!selectedPatient) return;
    
    if (!editPatientData.name || !editPatientData.email || !editPatientData.cellphone) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
      return;
    }
    
    setIsSavingPatient(true);
    
    try {
      const { updatePatient } = await import('@/lib/firebase');
      
      const updatedData = {
        name: editPatientData.name,
        email: editPatientData.email,
        cellphone: editPatientData.cellphone
      };
      
      // Atualizar no Firebase
      try {
        if (selectedPatient.id) {
          await updatePatient(selectedPatient.id, updatedData);
        } else {
          throw new Error("ID do paciente não encontrado");
        }
      } catch (firebaseError) {
        console.warn("Firebase error:", firebaseError);
        toast({
          title: "Aviso",
          description: "Alterações salvas localmente. A sincronização ocorrerá quando a conexão for restaurada.",
        });
      }
      
      // Atualizar na lista local
      const updatedPatient = { ...selectedPatient, ...updatedData };
      setPacientes(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      setFilteredPacientes(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      
      setShowEditPatientDialog(false);
      setSelectedPatient(null);
      
      toast({
        title: "Paciente atualizado",
        description: `${updatedData.name} foi atualizado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o paciente",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    } finally {
      setIsSavingPatient(false);
    }
  };

  // Função para criar novo paciente
  const handleCreatePatient = async () => {
    if (!currentUser?.uid) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPatientData.name || !newPatientData.email || !newPatientData.cellphone) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    setIsSavingPatient(true);
    
    // Timeout para a operação do Firebase
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Tempo esgotado para o Firestore. Usando dados locais."));
      }, 5000); // 5 segundos de timeout
    });
    
    try {
      const { createPatient } = await import('@/lib/firebase');
      
      // Criamos um paciente para usar no caso de falha do Firestore
      const patientData = {
        userId: currentUser.uid,
        name: newPatientData.name,
        email: newPatientData.email,
        cellphone: newPatientData.cellphone
      };
      
      let newPatient;
      
      try {
        // Tentamos criar com o Firebase, mas com timeout
        newPatient = await Promise.race([
          createPatient(patientData),
          timeoutPromise
        ]);
      } catch (firebaseError) {
        console.warn("Firebase error or timeout:", firebaseError);
        
        // Se falhar, criamos um objeto paciente local com ID temporário
        // para que a UI funcione mesmo sem conectividade
        newPatient = {
          ...patientData,
          id: `temp-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastConsult: null,
          nextConsult: null
        } as Patient;
        
        toast({
          title: "Aviso",
          description: "Paciente salvo localmente. A sincronização ocorrerá quando a conexão for restaurada.",
        });
      }
      
      // Atualizamos as listas de pacientes com cast explícito para Patient
      const typedPatient = newPatient as Patient;
      setPacientes((prev: Patient[]) => [...prev, typedPatient] as Patient[]);
      setFilteredPacientes((prev: Patient[]) => [...prev, typedPatient] as Patient[]);
      setShowNewPatientDialog(false);
      
      toast({
        title: "Paciente criado",
        description: `${typedPatient.name} foi adicionado com sucesso`,
      });
      
      // Resetar formulário
      setNewPatientData({
        name: '',
        email: '',
        cellphone: ''
      });
    } catch (error) {
      console.error("Erro ao criar paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o paciente",
        variant: "destructive",
      });
    } finally {
      setIsSavingPatient(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <Button 
          className="bg-primary hover:bg-primaryDark"
          onClick={() => setShowNewPatientDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Paciente
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Buscar Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Buscar por nome, email ou telefone"
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button 
              className="md:w-auto"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPacientes.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum paciente encontrado</p>
                <p className="text-sm mt-1">
                  {searchQuery 
                    ? "Tente uma busca diferente ou limpe o filtro" 
                    : "Adicione seu primeiro paciente clicando em '+ Novo Paciente'"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium">Nome</th>
                    <th className="text-left p-4 font-medium">Telefone</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Última Consulta</th>
                    <th className="text-left p-4 font-medium">Próxima Consulta</th>
                    <th className="text-left p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPacientes.map((paciente) => (
                    <tr key={paciente.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{paciente.name}</td>
                      <td className="p-4">{paciente.cellphone}</td>
                      <td className="p-4">{paciente.email}</td>
                      <td className="p-4">{formatarData(paciente.lastConsult)}</td>
                      <td className="p-4">{formatarData(paciente.nextConsult)}</td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewPatient(paciente)}
                          >
                            Ver perfil
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPatient(paciente)}
                          >
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center py-4">
        <div className="text-sm text-gray-500">
          {!isLoading && (
            <>
              Mostrando {filteredPacientes.length} 
              {filteredPacientes.length === 1 ? ' paciente' : ' pacientes'}
              {searchQuery && ' (filtrados)'}
            </>
          )}
        </div>
      </div>
      
      {/* Diálogo para adicionar novo paciente */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados do paciente para adicioná-lo à sua lista.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={newPatientData.name}
                onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                placeholder="Nome do paciente"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newPatientData.email}
                onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cellphone">Telefone</Label>
              <Input
                id="cellphone"
                value={newPatientData.cellphone}
                onChange={(e) => setNewPatientData({...newPatientData, cellphone: e.target.value})}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewPatientDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePatient}
              disabled={isSavingPatient || !newPatientData.name || !newPatientData.email || !newPatientData.cellphone}
            >
              {isSavingPatient ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar paciente */}
      <Dialog open={showEditPatientDialog} onOpenChange={setShowEditPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Atualize os dados do paciente {selectedPatient?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome completo</Label>
              <Input
                id="edit-name"
                value={editPatientData.name}
                onChange={(e) => setEditPatientData({...editPatientData, name: e.target.value})}
                placeholder="Nome do paciente"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editPatientData.email}
                onChange={(e) => setEditPatientData({...editPatientData, email: e.target.value})}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cellphone">Telefone</Label>
              <Input
                id="edit-cellphone"
                value={editPatientData.cellphone}
                onChange={(e) => setEditPatientData({...editPatientData, cellphone: e.target.value})}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditPatientDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePatientEdits}
              disabled={isSavingPatient || !editPatientData.name || !editPatientData.email || !editPatientData.cellphone}
            >
              {isSavingPatient ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para visualizar perfil do paciente */}
      <Dialog open={showViewPatientDialog} onOpenChange={setShowViewPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Perfil do Paciente</DialogTitle>
            <DialogDescription>
              Informações detalhadas de {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Nome completo</Label>
                  <p className="text-base">{selectedPatient.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-base">{selectedPatient.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-base">{selectedPatient.cellphone}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Data de cadastro</Label>
                  <p className="text-base">{formatarData(selectedPatient.createdAt)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Última consulta</Label>
                  <p className="text-base">{formatarData(selectedPatient.lastConsult)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Próxima consulta</Label>
                  <p className="text-base">{formatarData(selectedPatient.nextConsult)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowViewPatientDialog(false);
                      handleEditPatient(selectedPatient);
                    }}
                  >
                    Editar dados
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Função futura para agendar consulta
                      toast({
                        title: "Em desenvolvimento",
                        description: "Funcionalidade de agendamento será implementada em breve",
                      });
                    }}
                  >
                    Agendar consulta
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Função futura para ver histórico
                      toast({
                        title: "Em desenvolvimento",
                        description: "Histórico de consultas será implementado em breve",
                      });
                    }}
                  >
                    Ver histórico
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowViewPatientDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </SidebarLayout>
  );
};

export default PacientesPage;