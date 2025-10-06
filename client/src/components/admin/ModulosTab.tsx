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
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  MoreVertical, 
  ChevronDown, 
  RefreshCw,
  Save,
  Plus,
  Edit,
  Trash2,
  // Ícones disponíveis para módulos
  Activity,
  Apple,
  BookOpen,
  Brain,
  Calculator,
  Calendar,
  Camera,
  ChartBar,
  Clipboard,
  Clock,
  Database,
  FileText,
  FlaskConical,
  GraduationCap,
  Heart,
  HeartPulse,
  Leaf,
  Lock,
  Microscope,
  Pill,
  Scale,
  Shield,
  Stethoscope,
  Target,
  TestTube,
  Thermometer,
  Users,
  Weight,
  Zap
} from 'lucide-react';
import { collection, doc, getDocs, updateDoc, setDoc, query, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Lista de ícones disponíveis para módulos
const availableIcons = [
  { name: 'activity', icon: Activity, label: 'Atividade' },
  { name: 'apple', icon: Apple, label: 'Maçã' },
  { name: 'book-open', icon: BookOpen, label: 'Livro' },
  { name: 'brain', icon: Brain, label: 'Cérebro' },
  { name: 'calculator', icon: Calculator, label: 'Calculadora' },
  { name: 'calendar', icon: Calendar, label: 'Calendário' },
  { name: 'camera', icon: Camera, label: 'Câmera' },
  { name: 'chart-bar', icon: ChartBar, label: 'Gráfico' },
  { name: 'clipboard', icon: Clipboard, label: 'Prancheta' },
  { name: 'clock', icon: Clock, label: 'Relógio' },
  { name: 'database', icon: Database, label: 'Banco de Dados' },
  { name: 'file-text', icon: FileText, label: 'Documento' },
  { name: 'flask-conical', icon: FlaskConical, label: 'Laboratório' },
  { name: 'graduation-cap', icon: GraduationCap, label: 'Formatura' },
  { name: 'heart', icon: Heart, label: 'Coração' },
  { name: 'heart-pulse', icon: HeartPulse, label: 'Pulso' },
  { name: 'leaf', icon: Leaf, label: 'Folha' },
  { name: 'lock', icon: Lock, label: 'Cadeado' },
  { name: 'microscope', icon: Microscope, label: 'Microscópio' },
  { name: 'pill', icon: Pill, label: 'Pílula' },
  { name: 'scale', icon: Scale, label: 'Balança' },
  { name: 'shield', icon: Shield, label: 'Escudo' },
  { name: 'stethoscope', icon: Stethoscope, label: 'Estetoscópio' },
  { name: 'target', icon: Target, label: 'Alvo' },
  { name: 'test-tube', icon: TestTube, label: 'Tubo de Ensaio' },
  { name: 'thermometer', icon: Thermometer, label: 'Termômetro' },
  { name: 'users', icon: Users, label: 'Usuários' },
  { name: 'weight', icon: Weight, label: 'Peso' },
  { name: 'zap', icon: Zap, label: 'Raio' }
];

// Função para obter o componente do ícone
const getIconComponent = (iconName: string) => {
  const iconData = availableIcons.find(icon => icon.name === iconName);
  if (!iconData) return null;
  const IconComponent = iconData.icon;
  return <IconComponent className="h-5 w-5" />;
};

// Lista de módulos disponíveis no sistema
const modulesList = [
  {
    id: 'fitoterapia-obesidade',
    title: 'Fitoterapia na Obesidade',
    description: 'Aborde a utilização de plantas medicinais de forma eficaz'
  },
  {
    id: 'conversor-cliques-semaglutida',
    title: 'Conversor de Cliques – Semaglutida',
    description: 'Converta doses semanais entre canetas Ozempic® e Wegovy® com base matemática precisa'
  },
  {
    id: 'algoritmo-indicacao-antiobesidade',
    title: 'Algoritmo - Indicação de Medicação Antiobesidade (MAO)',
    description: 'Veja se o seu paciente preenche critérios para a terapia medicamentosa da obesidade conforme as diretrizes'
  },
  {
    id: 'algoritmo-indicacao-cirurgia-bariatrica',
    title: 'Algoritmo - Indicação de Cirurgia Bariátrica',
    description: 'Conforme a Resolução CFM 2429/25'
  },
  {
    id: 'prontuario-blindado',
    title: 'Prontuário Blindado',
    description: 'Transcreva suas consultas com IA e não deixe escapar nada'
  },
  {
    id: 'obesidade-sobrepeso',
    title: 'Obesidade e Sobrepeso',
    description: 'Prescrições para tratamento de obesidade e sobrepeso com foco em emagrecimento saudável'
  },
  {
    id: 'terapia-hormonal-feminina',
    title: 'Terapia Hormonal Feminina',
    description: 'Abordagem nutricional para equilíbrio hormonal feminino e questões relacionadas'
  },
  {
    id: 'terapia-hormonal-masculina',
    title: 'Terapia Hormonal Masculina',
    description: 'Orientações nutricionais para otimização hormonal masculina'
  },
  {
    id: 'pre-diabetes',
    title: 'Pré-Diabetes',
    description: 'Intervenções nutricionais para prevenir a progressão para diabetes tipo 2'
  },
  {
    id: 'diabetes-tipo-2',
    title: 'Diabetes Tipo 2',
    description: 'Planos alimentares para controle glicêmico e manejo do diabetes'
  },
  {
    id: 'exames-laboratoriais',
    title: 'Interpretação de Exames Laboratoriais',
    description: 'Análise e orientação nutricional baseada em resultados de exames'
  },
  {
    id: 'reposicao-vitaminas-minerais',
    title: 'Reposição de Vitaminas e Minerais',
    description: 'Orientações para correção de deficiências nutricionais'
  },
  {
    id: 'exames-hormonais',
    title: 'Interpretação Avançada de Exames Hormonais',
    description: 'Análise detalhada de perfis hormonais e recomendações nutricionais personalizadas'
  }
];

// Definição das categorias de módulos
const MODULE_CATEGORIES = [
  { value: 'receitas', label: 'Receitas' },
  { value: 'calculadoras', label: 'Calculadoras' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'exames', label: 'Exames' },
  { value: 'seguranca', label: 'Segurança' }
] as const;

type ModuleCategory = typeof MODULE_CATEGORIES[number]['value'];

interface Assistant {
  id: string;
  name: string;
  description: string | null;
  model: string;
}

interface ModuleConfig {
  id: string;
  title: string;
  assistantId: string;
  enabled: boolean;
  description: string;
  tier?: 'Free' | 'PRO' | 'Premium';
  icon?: string;
  category?: ModuleCategory;
}

const ModulosTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(true);
  
  // Estados para edição/criação de módulos
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    assistantId: '',
    enabled: false,
    tier: 'Free' as 'Free' | 'PRO' | 'Premium',
    icon: '',
    category: 'receitas' as ModuleCategory
  });

  const { toast } = useToast();

  // Carregar assistentes da API OpenAI
  const fetchAssistants = async () => {
    setIsLoadingAssistants(true);
    try {
      const response = await fetch('/api/assistants');
      if (!response.ok) {
        throw new Error('Falha ao carregar assistentes da OpenAI');
      }
      const data = await response.json();
      setAssistants(data.assistants || []);
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os assistentes da OpenAI',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAssistants(false);
    }
  };

  // Carregar configuração de módulos exclusivamente do Firestore
  const fetchModuleConfigs = async () => {
    setIsLoading(true);
    try {
      // Verificar se existe uma coleção de módulos no Firestore
      const modulesRef = collection(db, "modules");
      const modulesSnapshot = await getDocs(modulesRef);
      
      let savedConfigs: ModuleConfig[] = [];
      
      if (!modulesSnapshot.empty) {
        // Se houver módulos salvos, carregar
        savedConfigs = modulesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            assistantId: data.assistantId || '',
            enabled: data.enabled || false,
            description: data.description || '',
            tier: data.tier || 'Free',
            icon: data.icon || '',
            category: data.category || 'receitas'
          };
        });
        
        console.log("Configurações de módulos carregadas do Firestore:", savedConfigs.length);
      } else {
        // Caso contrário, inicializar com a lista padrão
        savedConfigs = modulesList.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          assistantId: '',  // Inicialmente sem assistente vinculado
          enabled: false,    // Inicialmente desabilitado
          tier: 'Free' as const,
          icon: '',  // Inicialmente sem ícone
          category: 'receitas' as ModuleCategory  // Categoria padrão
        }));
        
        console.log("Inicializando configurações padrão de módulos");
      }
      
      setModuleConfigs(savedConfigs);
    } catch (error) {
      console.error("Erro ao carregar configurações de módulos:", error);
      toast({
        title: "Erro de Permissão",
        description: "Não foi possível acessar o banco de dados. Verifique se as regras de segurança foram atualizadas no console do Firebase.",
        variant: "destructive",
      });
      
      // Usar lista padrão como fallback temporário
      const defaultConfigs = modulesList.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description,
        assistantId: '',
        enabled: false,
        tier: 'Free' as const,
        icon: '',
        category: 'receitas' as ModuleCategory
      }));
      setModuleConfigs(defaultConfigs);
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchAssistants();
    fetchModuleConfigs();
  }, []);

  // Função para salvar configurações exclusivamente no Firestore
  const saveModuleConfigs = async () => {
    setIsSaving(true);
    
    try {
      // Validar se módulos habilitados têm assistente
      const invalidModules = moduleConfigs.filter(mod => mod.enabled && !mod.assistantId);
      
      if (invalidModules.length > 0) {
        toast({
          title: "Configuração inválida",
          description: "Todos os módulos habilitados devem ter um assistente vinculado",
          variant: "destructive",
        });
        return;
      }
      
      // Salvar cada módulo como um documento separado no Firestore
      for (const module of moduleConfigs) {
        const moduleRef = doc(db, "modules", module.id);
        await setDoc(moduleRef, module);
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações de módulos salvas com sucesso no banco de dados",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações no Firestore:", error);
      toast({
        title: "Erro de Permissão",
        description: "Não foi possível salvar no banco de dados. Verifique se as regras de segurança foram atualizadas no console do Firebase.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Função para atualizar o status de um módulo
  const handleStatusChange = (moduleId: string, enabled: boolean) => {
    setModuleConfigs(prev => prev.map(module => {
      if (module.id === moduleId) {
        // Se estiver habilitando e não tiver assistente, mostra alerta
        if (enabled && !module.assistantId) {
          toast({
            title: "Selecione um assistente",
            description: "É necessário vincular um assistente antes de habilitar o módulo",
            variant: "destructive",
          });
          return module; // Mantém desabilitado
        }
        return { ...module, enabled };
      }
      return module;
    }));
  };

  // Função para atualizar o assistente de um módulo
  const handleAssistantChange = (moduleId: string, assistantId: string) => {
    setModuleConfigs(prev => prev.map(module => {
      if (module.id === moduleId) {
        return { ...module, assistantId };
      }
      return module;
    }));
  };

  // Função para abrir diálogo de edição
  const openEditDialog = (module: ModuleConfig) => {
    setEditingModule(module);
    setFormData({
      id: module.id,
      title: module.title,
      description: module.description,
      assistantId: module.assistantId,
      enabled: module.enabled,
      tier: module.tier || 'Free',
      icon: module.icon || 'none',
      category: module.category || 'receitas'
    });
    setIsCreatingNew(false);
    setIsEditDialogOpen(true);
  };

  // Função para abrir diálogo de criação
  const openCreateDialog = () => {
    setEditingModule(null);
    setFormData({
      id: '',
      title: '',
      description: '',
      assistantId: '',
      enabled: false,
      tier: 'Free',
      icon: 'none',
      category: 'receitas'
    });
    setIsCreatingNew(true);
    setIsEditDialogOpen(true);
  };

  // Função para salvar módulo (criar ou editar)
  const saveModule = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título do módulo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (isCreatingNew && !formData.id.trim()) {
      toast({
        title: "Erro",
        description: "O ID do módulo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Verificar se ID já existe (apenas para novos módulos)
    if (isCreatingNew && moduleConfigs.some(m => m.id === formData.id)) {
      toast({
        title: "Erro",
        description: "Já existe um módulo com este ID",
        variant: "destructive",
      });
      return;
    }

    try {
      const moduleData = {
        id: formData.id,
        title: formData.title,
        description: formData.description,
        assistantId: formData.assistantId,
        enabled: formData.enabled,
        tier: formData.tier,
        icon: formData.icon === 'none' ? '' : formData.icon,
        category: formData.category
      };

      // Salvar no Firestore
      const moduleRef = doc(db, "modules", formData.id);
      await setDoc(moduleRef, moduleData);

      // Atualizar estado local
      if (isCreatingNew) {
        setModuleConfigs(prev => [...prev, moduleData]);
      } else {
        setModuleConfigs(prev => prev.map(module => 
          module.id === formData.id ? moduleData : module
        ));
      }

      toast({
        title: "Sucesso",
        description: `Módulo ${isCreatingNew ? 'criado' : 'atualizado'} com sucesso`,
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar módulo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o módulo",
        variant: "destructive",
      });
    }
  };

  // Função para deletar módulo
  const deleteModule = async (moduleId: string) => {
    if (!confirm("Tem certeza que deseja deletar este módulo? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      // Deletar do Firestore
      const moduleRef = doc(db, "modules", moduleId);
      await deleteDoc(moduleRef);

      // Atualizar estado local
      setModuleConfigs(prev => prev.filter(module => module.id !== moduleId));

      toast({
        title: "Sucesso",
        description: "Módulo deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar módulo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o módulo",
        variant: "destructive",
      });
    }
  };

  // Filtrar módulos com base na busca
  const filteredModules = moduleConfigs.filter(module => 
    module.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Configuração de Módulos</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={openCreateDialog}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Buscar módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full md:w-64"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              fetchAssistants();
              fetchModuleConfigs();
            }}
            disabled={isLoading || isLoadingAssistants}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isLoadingAssistants ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={saveModuleConfigs} 
            disabled={isSaving}
            className="bg-primary hover:bg-primaryDark"
          >
            {isSaving ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">Ícone</TableHead>
              <TableHead className="w-[200px]">Nome do Módulo</TableHead>
              <TableHead className="w-[120px]">Categoria</TableHead>
              <TableHead className="w-[200px]">Assistente OpenAI</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[100px] text-center">Plano</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[120px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredModules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhum módulo encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredModules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="text-center">
                    {module.icon ? getIconComponent(module.icon) : 
                      <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                        -
                      </div>
                    }
                  </TableCell>
                  <TableCell className="font-medium">{module.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {MODULE_CATEGORIES.find(cat => cat.value === module.category)?.label || 'Receitas'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={module.assistantId}
                      onValueChange={(value) => handleAssistantChange(module.id, value)}
                      disabled={isLoadingAssistants}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um assistente" />
                      </SelectTrigger>
                      <SelectContent>
                        {assistants.map((assistant) => (
                          <SelectItem key={assistant.id} value={assistant.id}>
                            {assistant.name || assistant.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={module.enabled}
                        onCheckedChange={(checked) => handleStatusChange(module.id, checked)}
                        disabled={!module.assistantId}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={
                      module.tier === 'Free' ? 'secondary' : 
                      module.tier === 'PRO' ? 'default' : 'destructive'
                    }>
                      {module.tier || 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {module.description}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(module)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteModule(module.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
        <p className="text-yellow-800 text-sm">
          <strong>Nota:</strong> Os módulos habilitados estarão visíveis para os usuários na página de consulta. 
          Cada módulo habilitado deve ter um assistente OpenAI vinculado.
        </p>
      </div>

      {/* Diálogo para editar/criar módulo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isCreatingNew ? 'Criar Novo Módulo' : 'Editar Módulo'}
            </DialogTitle>
            <DialogDescription>
              {isCreatingNew 
                ? 'Preencha as informações para criar um novo módulo especializado.'
                : 'Edite as informações do módulo selecionado.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="module-id">ID do Módulo</Label>
              <Input
                id="module-id"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                placeholder="ex: obesidade-infantil"
                disabled={!isCreatingNew}
                className={!isCreatingNew ? 'bg-gray-100' : ''}
              />
              <p className="text-xs text-gray-500">
                {isCreatingNew 
                  ? 'Use um identificador único em minúsculas com hífens'
                  : 'O ID não pode ser alterado após a criação'
                }
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="module-title">Título do Módulo</Label>
              <Input
                id="module-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ex: Obesidade Infantil"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="module-description">Descrição</Label>
              <Textarea
                id="module-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo e funcionalidades do módulo..."
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="module-category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ModuleCategory) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="module-assistant">Assistente OpenAI</Label>
              <Select
                value={formData.assistantId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assistantId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um assistente" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name || assistant.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="module-tier">Plano de Acesso</Label>
              <Select
                value={formData.tier}
                onValueChange={(value: 'Free' | 'PRO' | 'Premium') => setFormData(prev => ({ ...prev, tier: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free">Free - Gratuito</SelectItem>
                  <SelectItem value="PRO">PRO - Plano Profissional</SelectItem>
                  <SelectItem value="Premium">Premium - Plano Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="module-icon">Ícone do Módulo</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone">
                    {formData.icon && (
                      <div className="flex items-center gap-2">
                        {getIconComponent(formData.icon)}
                        <span>{availableIcons.find(i => i.name === formData.icon)?.label}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-400">-</div>
                      <span>Sem ícone</span>
                    </div>
                  </SelectItem>
                  {availableIcons.map((iconData) => {
                    const IconComponent = iconData.icon;
                    return (
                      <SelectItem key={iconData.name} value={iconData.name}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          <span>{iconData.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Se nenhum ícone for selecionado, nenhum será exibido
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="module-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="module-enabled">Módulo habilitado</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveModule}>
              {isCreatingNew ? 'Criar Módulo' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModulosTab;