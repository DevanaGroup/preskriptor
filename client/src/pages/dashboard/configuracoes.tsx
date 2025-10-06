import React, { useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Info, Copy, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

// Interface para assistente da OpenAI
interface OpenAIAssistant {
  id: string;
  object: string;
  created_at: number;
  name: string;
  description: string | null;
  model: string;
  instructions: string | null;
}

const ConfiguracoesPage: React.FC = () => {
  const [assistants, setAssistants] = useState<OpenAIAssistant[]>([]);
  const [isLoadingAssistants, setIsLoadingAssistants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para obter lista de assistentes
  const fetchAssistants = async () => {
    setIsLoadingAssistants(true);
    setError(null);
    
    try {
      const response = await fetch('/api/assistants');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar assistentes');
      }
      
      setAssistants(data.assistants || []);
    } catch (err: any) {
      console.error('Erro ao buscar assistentes:', err);
      setError(err.message || 'Erro ao carregar assistentes da OpenAI');
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os assistentes da OpenAI',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingAssistants(false);
    }
  };

  // Buscar assistentes ao montar o componente
  useEffect(() => {
    fetchAssistants();
  }, []);

  // Função para copiar o ID do assistente para o clipboard
  const copyAssistantId = (id: string) => {
    navigator.clipboard.writeText(id)
      .then(() => {
        toast({
          title: 'ID copiado',
          description: 'ID do assistente copiado para a área de transferência'
        });
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível copiar o ID do assistente',
          variant: 'destructive'
        });
      });
  };

  // Formatar data de Unix timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SidebarLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="consultorio">Consultório</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="integracao">Integrações</TabsTrigger>
          <TabsTrigger value="assistentes">Assistentes</TabsTrigger>
        </TabsList>

        {/* Aba de Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e profissionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" defaultValue="Dr. Noé Nutricionista" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="dr.noe@preskriptor.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" defaultValue="(11) 99999-8888" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidade">Especialidade</Label>
                    <Input id="especialidade" defaultValue="Nutrologia" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM/CRN</Label>
                    <Input id="crm" defaultValue="CRM 123456" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" defaultValue="123.456.789-10" />
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primaryDark">Salvar Alterações</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Atualize sua senha de acesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha-atual">Senha Atual</Label>
                  <Input id="senha-atual" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input id="nova-senha" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                  <Input id="confirmar-senha" type="password" />
                </div>
                <Button variant="outline">Alterar Senha</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Consultório */}
        <TabsContent value="consultorio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Consultório</CardTitle>
              <CardDescription>
                Configure os dados do seu consultório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome-consultorio">Nome do Consultório</Label>
                    <Input id="nome-consultorio" defaultValue="Clínica Preskriptor" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone-consultorio">Telefone</Label>
                    <Input id="telefone-consultorio" defaultValue="(11) 5555-8888" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-consultorio">Email</Label>
                    <Input id="email-consultorio" type="email" defaultValue="contato@preskriptor.com" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Input id="endereco" defaultValue="Av. Paulista, 1000, Sala 101 - Bela Vista - São Paulo - SP" />
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primaryDark">Salvar Alterações</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário de Atendimento</CardTitle>
              <CardDescription>
                Configure os dias e horários disponíveis para agendamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Segunda-feira</p>
                      <p className="text-sm text-gray-500">8:00 - 18:00</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Terça-feira</p>
                      <p className="text-sm text-gray-500">8:00 - 18:00</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quarta-feira</p>
                      <p className="text-sm text-gray-500">8:00 - 18:00</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quinta-feira</p>
                      <p className="text-sm text-gray-500">8:00 - 18:00</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sexta-feira</p>
                      <p className="text-sm text-gray-500">8:00 - 18:00</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sábado</p>
                      <p className="text-sm text-gray-500">8:00 - 12:00</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <Button variant="outline" className="mt-4">Editar Horários</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Conta */}
        <TabsContent value="conta" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plano e Assinatura</CardTitle>
              <CardDescription>
                Gerencie seu plano e assinatura do Preskriptor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-lg">Plano Premium</h3>
                      <p className="text-sm text-gray-600">Assinatura mensal - R$ 99,90/mês</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Ativo
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Próxima cobrança em 15/06/2025</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline">Mudar Plano</Button>
                  <Button variant="ghost" className="text-red-500 hover:text-red-700">Cancelar Assinatura</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações de Pagamento</CardTitle>
              <CardDescription>
                Atualize seus dados de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-gray-500">**** **** **** 1234</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Principal
                  </div>
                </div>
                <Button variant="outline">Adicionar Novo Método de Pagamento</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Notificações */}
        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como deseja receber as notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Notificações por Email</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Novas consultas</p>
                        <p className="text-sm text-gray-500">Receba alertas quando houver novos agendamentos</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Lembretes de consulta</p>
                        <p className="text-sm text-gray-500">Receba lembretes de consultas no dia anterior</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Relatórios semanais</p>
                        <p className="text-sm text-gray-500">Receba um resumo semanal das atividades</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Notificações por SMS/WhatsApp</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Alertas de consulta</p>
                        <p className="text-sm text-gray-500">Receba SMS 30 minutos antes da consulta</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Cancelamentos</p>
                        <p className="text-sm text-gray-500">Receba alertas quando houver cancelamentos</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primaryDark">Salvar Preferências</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Integrações */}
        <TabsContent value="integracao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrações com Terceiros</CardTitle>
              <CardDescription>
                Conecte o Preskriptor a outros sistemas e aplicativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Business</p>
                      <p className="text-sm text-gray-500">Envie lembretes e comunique-se com pacientes</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Google Calendar</p>
                      <p className="text-sm text-gray-500">Sincronize sua agenda com o Google Calendar</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Plataformas de Pagamento</p>
                      <p className="text-sm text-gray-500">Integre com PagSeguro, Mercado Pago ou Stripe</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-2 rounded-full mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Sistemas de Prontuário Eletrônico</p>
                      <p className="text-sm text-gray-500">Integre com outros sistemas de prontuário</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Assistentes */}
        <TabsContent value="assistentes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistentes OpenAI</CardTitle>
              <CardDescription>
                Visualize e gerencie os assistentes inteligentes da OpenAI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoadingAssistants ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Carregando assistentes...</span>
                  </div>
                ) : error ? (
                  <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                    <p>{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={fetchAssistants}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : assistants.length === 0 ? (
                  <div className="text-center p-8 border rounded-md">
                    <p className="text-muted-foreground">Nenhum assistente encontrado na sua conta OpenAI.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assistants.map((assistant) => (
                          <TableRow key={assistant.id}>
                            <TableCell className="font-medium">
                              {assistant.name || "Assistente sem nome"}
                              {assistant.description && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 ml-1 text-muted-foreground inline cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs">{assistant.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {assistant.id}
                            </TableCell>
                            <TableCell>{assistant.model}</TableCell>
                            <TableCell>{formatDate(assistant.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => copyAssistantId(assistant.id)}
                                  title="Copiar ID do assistente"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Ver no console OpenAI"
                                  onClick={() => window.open(`https://platform.openai.com/assistants/${assistant.id}`, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={fetchAssistants}
                    disabled={isLoadingAssistants}
                    className="mr-2"
                  >
                    {isLoadingAssistants && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Atualizar lista
                  </Button>
                  <Button
                    onClick={() => window.open('https://platform.openai.com/assistants', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Gerenciar no console OpenAI
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
};

export default ConfiguracoesPage;