import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Patient, getPatients } from '@/lib/firebase';
import { FileText, Trash2, Edit, Calendar, Plus, Users, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import RichTextEditor from '@/components/RichTextEditor';

// Interface para a receita
interface Receita {
  id?: string;
  userId: string;  // ID do médico que criou
  patientId: string;
  patientName: string;
  content: string;  // Conteúdo da receita em formato markdown
  data: Date;
  modelo?: string;  // Nome do modelo usado (se houver)
  opcoes: {
    salvarImprimir: boolean;
    salvarModelo: boolean;
    enviarEmail: boolean;
    controleEspecial: boolean;
  };
  focoReceita?: string;  // Campo opcional para especificar o foco da receita
  enviarFarmacias?: string[];  // Lista de farmácias para enviar
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para modelos de receitas
interface ModeloReceita {
  id?: string;
  userId: string;
  nome: string;
  content: string;
  createdAt?: Date;
}

const ReceitasPage = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Estados para gerenciar receitas e modelos
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [modelos, setModelos] = useState<ModeloReceita[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para edição e criação de receitas
  const [showReceitaDialog, setShowReceitaDialog] = useState(false);
  const [currentReceita, setCurrentReceita] = useState<Receita | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Estado para visualização da receita
  const [viewReceita, setViewReceita] = useState<Receita | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  // Estado para o formulário de nova receita
  const [novaReceita, setNovaReceita] = useState<Receita>({
    userId: currentUser?.uid || '',
    patientId: '',
    patientName: '',
    content: '',
    data: new Date(),
    opcoes: {
      salvarImprimir: true,
      salvarModelo: false,
      enviarEmail: false,
      controleEspecial: false
    },
    focoReceita: ''
  });
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (currentUser) {
      loadInitialData();
    }
  }, [currentUser]);
  
  // Efeito para verificar se há uma receita temporária no localStorage
  useEffect(() => {
    const receitaTemp = localStorage.getItem('receitaTemporaria');
    const pacienteId = localStorage.getItem('pacienteReceita');
    const pacienteNome = localStorage.getItem('pacienteNome');
    
    if (receitaTemp && pacienteId && pacienteNome) {
      // Criar nova receita a partir dos dados do localStorage
      setNovaReceita({
        ...novaReceita,
        content: receitaTemp,
        patientId: pacienteId,
        patientName: pacienteNome
      });
      
      // Abrir o diálogo de edição
      setEditMode(false);
      setShowReceitaDialog(true);
      
      // Limpar localStorage
      localStorage.removeItem('receitaTemporaria');
      localStorage.removeItem('pacienteReceita');
      localStorage.removeItem('pacienteNome');
    }
  }, []);
  
  // Função para carregar dados iniciais
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Carregar pacientes
      if (currentUser) {
        const loadedPatients = await getPatients(currentUser.uid);
        setPatients(loadedPatients);
      }
      
      // Carregar receitas
      await loadReceitas();
      
      // Carregar modelos
      await loadModelos();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as receitas e modelos',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para carregar receitas do Firestore
  const loadReceitas = async () => {
    if (!currentUser) return;
    
    try {
      const receitasRef = collection(db, 'receitas');
      const q = query(
        receitasRef, 
        where('userId', '==', currentUser.uid),
        orderBy('data', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const loadedReceitas: Receita[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedReceitas.push({
          id: doc.id,
          userId: data.userId,
          patientId: data.patientId,
          patientName: data.patientName,
          content: data.content,
          data: data.data?.toDate() || new Date(),
          modelo: data.modelo,
          opcoes: data.opcoes || {
            salvarImprimir: true,
            salvarModelo: false,
            enviarEmail: false,
            controleEspecial: false
          },
          focoReceita: data.focoReceita,
          enviarFarmacias: data.enviarFarmacias,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      
      setReceitas(loadedReceitas);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as receitas',
        variant: 'destructive'
      });
    }
  };
  
  // Função para carregar modelos de receitas
  const loadModelos = async () => {
    if (!currentUser) return;
    
    try {
      const modelosRef = collection(db, 'modelosReceitas');
      const q = query(
        modelosRef,
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const loadedModelos: ModeloReceita[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedModelos.push({
          id: doc.id,
          userId: data.userId,
          nome: data.nome,
          content: data.content,
          createdAt: data.createdAt?.toDate()
        });
      });
      
      setModelos(loadedModelos);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    }
  };
  
  // Função para salvar uma nova receita
  const salvarReceita = async () => {
    if (!currentUser || !novaReceita.patientId || !novaReceita.content) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const receitaData: Receita = {
        ...novaReceita,
        userId: currentUser.uid,
        data: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Salvar receita no Firestore
      const receitasRef = collection(db, 'receitas');
      await addDoc(receitasRef, {
        ...receitaData,
        data: Timestamp.fromDate(receitaData.data),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // Se a opção de salvar como modelo estiver marcada
      if (receitaData.opcoes.salvarModelo) {
        const modelosRef = collection(db, 'modelosReceitas');
        await addDoc(modelosRef, {
          userId: currentUser.uid,
          nome: `Modelo para ${receitaData.patientName}`,
          content: receitaData.content,
          createdAt: Timestamp.fromDate(new Date())
        });
      }
      
      toast({
        title: 'Receita salva',
        description: 'A receita foi salva com sucesso',
        variant: 'default'
      });
      
      // Recarregar receitas e modelos
      await loadReceitas();
      if (receitaData.opcoes.salvarModelo) {
        await loadModelos();
      }
      
      // Limpar o formulário e fechar o diálogo
      resetForm();
      setShowReceitaDialog(false);
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a receita',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Função para excluir uma receita
  const excluirReceita = async (receitaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta receita?')) {
      return;
    }
    
    try {
      const receitaRef = doc(db, 'receitas', receitaId);
      await deleteDoc(receitaRef);
      
      toast({
        title: 'Receita excluída',
        description: 'A receita foi excluída com sucesso',
        variant: 'default'
      });
      
      // Recarregar receitas
      await loadReceitas();
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a receita',
        variant: 'destructive'
      });
    }
  };
  
  // Função para visualizar uma receita
  const visualizarReceita = (receita: Receita) => {
    setViewReceita(receita);
    setShowViewDialog(true);
  };
  
  // Função para editar uma receita
  const editarReceita = (receita: Receita) => {
    setNovaReceita(receita);
    setEditMode(true);
    setShowReceitaDialog(true);
  };
  
  // Função para aplicar um modelo
  const aplicarModelo = (modelo: ModeloReceita) => {
    setNovaReceita({
      ...novaReceita,
      content: modelo.content,
      modelo: modelo.nome
    });
  };
  
  // Função para imprimir receita
  const imprimirReceita = (receita: Receita) => {
    // Criar um elemento temporário para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a janela de impressão',
        variant: 'destructive'
      });
      return;
    }
    
    // Cabeçalho HTML com estilos CSS para impressão
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receita Médica - ${receita.patientName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .receita-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
          }
          .receita-header h1 {
            margin-bottom: 5px;
            color: #2563eb;
          }
          .receita-header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .receita-paciente {
            margin-bottom: 20px;
          }
          .receita-paciente p {
            margin: 5px 0;
            font-weight: bold;
          }
          .receita-conteudo {
            margin-bottom: 40px;
          }
          .receita-footer {
            margin-top: 40px;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          .receita-assinatura {
            margin-top: 80px;
            text-align: center;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #2563eb;
          }
          ul, ol {
            padding-left: 20px;
          }
          @media print {
            body {
              font-size: 12pt;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receita-header">
          <h1>Prescrição Nutricional</h1>
          <p>Dr(a). ${currentUser?.name || currentUser?.displayName || ''}</p>
          <p>CRN: ${currentUser?.crm || '------'}</p>
          <p>Data: ${format(receita.data, 'dd/MM/yyyy', { locale: ptBR })}</p>
        </div>
        
        <div class="receita-paciente">
          <p>Paciente: ${receita.patientName}</p>
        </div>
        
        <div class="receita-conteudo">
          ${receita.content}
        </div>
        
        <div class="receita-assinatura">
          ________________________________<br>
          ${currentUser?.name || currentUser?.displayName || ''}<br>
          Nutricionista - CRN ${currentUser?.crm || '------'}
        </div>
        
        <div class="receita-footer">
          <p>Esta prescrição foi gerada pelo Preskriptor</p>
          <button class="no-print" onclick="window.print()">Imprimir</button>
        </div>
      </body>
      </html>
    `);
    
    // Fechar o document após impressão
    printWindow.document.close();
    printWindow.focus();
    
    // Imprimir automaticamente
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  // Função para resetar o formulário
  const resetForm = () => {
    setNovaReceita({
      userId: currentUser?.uid || '',
      patientId: '',
      patientName: '',
      content: '',
      data: new Date(),
      opcoes: {
        salvarImprimir: true,
        salvarModelo: false,
        enviarEmail: false,
        controleEspecial: false
      },
      focoReceita: ''
    });
    setEditMode(false);
  };
  
  // Função para abrir diálogo de nova receita
  const abrirNovaReceita = () => {
    resetForm();
    setShowReceitaDialog(true);
  };
  
  return (
    <SidebarLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gerenciamento de Receitas</h1>
          <Button onClick={abrirNovaReceita}>
            <Plus className="mr-2 h-4 w-4" /> Nova Receita
          </Button>
        </div>
        
        <Tabs defaultValue="receitas">
          <TabsList className="mb-4">
            <TabsTrigger value="receitas">Minhas Receitas</TabsTrigger>
            <TabsTrigger value="modelos">Modelos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="receitas">
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {receitas.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-lg text-gray-600">Nenhuma receita encontrada</p>
                    <p className="text-gray-500">Crie sua primeira receita clicando no botão "Nova Receita"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {receitas.map((receita) => (
                      <Card key={receita.id} className="overflow-hidden">
                        <CardHeader className="bg-gray-50">
                          <CardTitle className="flex justify-between items-center">
                            <span className="text-lg truncate">{receita.patientName}</span>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => visualizarReceita(receita)}
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => editarReceita(receita)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => excluirReceita(receita.id || '')}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{format(receita.data, 'dd/MM/yyyy', { locale: ptBR })}</span>
                            </div>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="h-32 overflow-hidden text-sm text-gray-700">
                            {receita.content.substring(0, 150)}...
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 border-t p-3 flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => imprimirReceita(receita)}
                          >
                            Imprimir
                          </Button>
                          <div className="flex items-center text-xs text-gray-500">
                            {receita.opcoes.controleEspecial && (
                              <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs ml-2">
                                Controle Especial
                              </span>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="modelos">
            {isLoading ? (
              <div className="flex justify-center my-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {modelos.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-lg text-gray-600">Nenhum modelo encontrado</p>
                    <p className="text-gray-500">Salve receitas como modelos para reutilizá-las</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modelos.map((modelo) => (
                      <Card key={modelo.id}>
                        <CardHeader>
                          <CardTitle>{modelo.nome}</CardTitle>
                          <CardDescription>
                            Criado em {modelo.createdAt ? format(modelo.createdAt, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-32 overflow-hidden text-sm text-gray-700">
                            {modelo.content.substring(0, 150)}...
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              aplicarModelo(modelo);
                              setShowReceitaDialog(true);
                            }}
                          >
                            Usar Modelo
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Diálogo para nova receita/edição */}
      <Dialog open={showReceitaDialog} onOpenChange={setShowReceitaDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Edite as informações da receita abaixo.' : 'Preencha as informações para criar uma nova receita.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente">Paciente</Label>
                  <Select
                    value={novaReceita.patientId}
                    onValueChange={(value) => {
                      const patient = patients.find(p => p.id === value);
                      setNovaReceita({
                        ...novaReceita,
                        patientId: value,
                        patientName: patient?.name || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id || ''}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="foco">Foco da Receita (opcional)</Label>
                  <Input
                    id="foco"
                    value={novaReceita.focoReceita || ''}
                    onChange={(e) => setNovaReceita({...novaReceita, focoReceita: e.target.value})}
                    placeholder="Ex: Suplementação, Restrição, etc."
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Opções</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="opcao-imprimir"
                        checked={novaReceita.opcoes.salvarImprimir}
                        onCheckedChange={(checked) => 
                          setNovaReceita({
                            ...novaReceita, 
                            opcoes: {...novaReceita.opcoes, salvarImprimir: !!checked}
                          })
                        }
                      />
                      <Label htmlFor="opcao-imprimir">Imprimir após salvar</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="opcao-modelo"
                        checked={novaReceita.opcoes.salvarModelo}
                        onCheckedChange={(checked) => 
                          setNovaReceita({
                            ...novaReceita, 
                            opcoes: {...novaReceita.opcoes, salvarModelo: !!checked}
                          })
                        }
                      />
                      <Label htmlFor="opcao-modelo">Salvar como modelo</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="opcao-email"
                        checked={novaReceita.opcoes.enviarEmail}
                        onCheckedChange={(checked) => 
                          setNovaReceita({
                            ...novaReceita, 
                            opcoes: {...novaReceita.opcoes, enviarEmail: !!checked}
                          })
                        }
                      />
                      <Label htmlFor="opcao-email">Enviar por e-mail</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="opcao-controle"
                        checked={novaReceita.opcoes.controleEspecial}
                        onCheckedChange={(checked) => 
                          setNovaReceita({
                            ...novaReceita, 
                            opcoes: {...novaReceita.opcoes, controleEspecial: !!checked}
                          })
                        }
                      />
                      <Label htmlFor="opcao-controle">Receita de controle especial</Label>
                    </div>
                  </div>
                </div>
                
                {modelos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Usar Modelo</Label>
                    <Select
                      onValueChange={(value) => {
                        const modelo = modelos.find(m => m.id === value);
                        if (modelo) {
                          aplicarModelo(modelo);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelos.map((modelo) => (
                          <SelectItem key={modelo.id} value={modelo.id || ''}>
                            {modelo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo da Receita</Label>
              <RichTextEditor
                value={novaReceita.content}
                onChange={(value) => setNovaReceita({...novaReceita, content: value})}
                placeholder="Digite o conteúdo da receita..."
                className="border-input"
              />
              <p className="text-xs text-gray-500">
                Use as ferramentas de formatação acima para personalizar sua receita.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceitaDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={salvarReceita}
              disabled={isSaving || !novaReceita.patientId || !novaReceita.content}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                  Salvando...
                </>
              ) : (
                <>Salvar Receita</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para visualizar receita */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receita para {viewReceita?.patientName}</DialogTitle>
            <DialogDescription>
              Criada em {viewReceita?.createdAt 
                ? format(viewReceita.createdAt, 'dd/MM/yyyy', { locale: ptBR }) 
                : format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg p-6 bg-white">
            <div className="text-center mb-6 pb-4 border-b">
              <h2 className="text-xl font-bold text-primary">Prescrição Nutricional</h2>
              <p className="text-sm">Dr(a). {currentUser?.name || currentUser?.displayName}</p>
              <p className="text-sm">CRN: {currentUser?.crm || '------'}</p>
              <p className="text-sm">Data: {viewReceita 
                ? format(viewReceita.data, 'dd/MM/yyyy', { locale: ptBR }) 
                : format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            
            <div className="mb-4 pb-2 border-b">
              <p className="font-semibold">Paciente: {viewReceita?.patientName}</p>
              {viewReceita?.focoReceita && (
                <p className="text-sm text-gray-600">Foco: {viewReceita.focoReceita}</p>
              )}
            </div>
            
            <div 
              className="prose prose-blue max-w-none" 
              dangerouslySetInnerHTML={{ __html: viewReceita?.content || '' }}
            />
            
            <div className="mt-12 text-center pt-8 border-t">
              <p className="text-sm">_________________________________</p>
              <p className="text-sm">{currentUser?.name || currentUser?.displayName}</p>
              <p className="text-sm">Nutricionista - CRN {currentUser?.crm || '------'}</p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Fechar
            </Button>
            <Button 
              variant="default" 
              onClick={() => viewReceita && imprimirReceita(viewReceita)}
            >
              Imprimir
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                if (viewReceita) {
                  editarReceita(viewReceita);
                  setShowViewDialog(false);
                }
              }}
            >
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
};

export default ReceitasPage;