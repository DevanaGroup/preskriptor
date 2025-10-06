import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, User, Phone, Mail, CreditCard, Calendar, Crown, Edit, Loader2, Settings, MonitorSmartphone, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import SidebarLayout from '@/components/SidebarLayout';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PerfilPage: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const { getSubscriptionPlan, getRemainingCredits } = useSubscriptionAccess();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || currentUser?.name || '',
    phoneNumber: currentUser?.cellphone || '',
    photoURL: currentUser?.photoURL || ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [defaultView, setDefaultView] = useState<'chat' | 'modules'>('modules');
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Carregar preferências do usuário
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.preferences?.defaultView) {
            setDefaultView(userData.preferences.defaultView);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      } finally {
        setLoadingPreferences(false);
      }
    };

    loadUserPreferences();
  }, [currentUser]);

  // Salvar preferência de visualização
  const handleViewChange = async (view: 'chat' | 'modules') => {
    if (!currentUser?.uid) return;
    
    setDefaultView(view);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        'preferences.defaultView': view,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Preferência salva",
        description: `Visualização padrão definida como ${view === 'chat' ? 'Chat AI' : 'Módulos'}.`,
      });
    } catch (error) {
      console.error('Erro ao salvar preferência:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar sua preferência.",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
        return;
      }

      setSelectedFile(file);
      
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          photoURL: dataUrl
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToStorage = async (file: File, userId: string): Promise<string> => {
    const storage = getStorage();
    const timestamp = Date.now();
    const fileName = `profile-photos/${userId}-${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  };

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    
    setIsLoading(true);
    try {
      let photoURL = formData.photoURL;
      
      // Upload da nova imagem se foi selecionada
      if (selectedFile) {
        photoURL = await uploadImageToStorage(selectedFile, currentUser.uid);
      }
      
      // Atualizar dados no Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: formData.displayName,
        cellphone: formData.phoneNumber,
        photoURL: photoURL,
        updatedAt: new Date().toISOString()
      });

      // Atualizar dados do usuário no contexto em tempo real
      if (refreshUserData) {
        await refreshUserData();
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      
      setIsEditing(false);
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao atualizar seu perfil. Tente novamente.",
        variant: "default",
        className: "bg-blue-500 text-white border-blue-600"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    // Resetar dados para o estado original
    setFormData({
      displayName: currentUser?.displayName || currentUser?.name || '',
      phoneNumber: currentUser?.cellphone || '',
      photoURL: currentUser?.photoURL || ''
    });
  };

  const getSubscriptionStatus = () => {
    const plan = getSubscriptionPlan();
    const credits = getRemainingCredits();
    
    return {
      plan: plan === 'freemium' ? 'Freemium' : plan === 'pro' ? 'PRO' : 'Premium',
      credits,
      color: plan === 'freemium' ? 'gray' : plan === 'pro' ? 'blue' : 'purple'
    };
  };

  const subscriptionInfo = getSubscriptionStatus();

  return (
    <SidebarLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e configurações da conta</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Informações Pessoais */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={formData.photoURL} />
                      <AvatarFallback className="text-2xl">
                        {formData.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {isEditing ? 'Clique no ícone para alterar a foto' : 'Foto do perfil'}
                  </p>
                </div>

                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome Completo</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Digite seu nome completo"
                    disabled={!isEditing}
                  />
                </div>

                {/* Email (apenas leitura) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">O email não pode ser alterado</p>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="(34) 99999-9999"
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3">
                  {!isEditing ? (
                    <div className="text-center space-y-2">
                      <Button
                        onClick={handleEdit}
                        className="w-full"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <p className="text-xs text-gray-500">
                        Clique no botão acima para editar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Salvar Alterações
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full"
                      >
                        Cancelar
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Modifique as informações e clique em salvar
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status da Assinatura */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Plano Atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Plano Atual</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      {subscriptionInfo.plan === 'Premium' && <Crown className="w-5 h-5 text-purple-500" />}
                      <h3 className="text-xl font-bold">{subscriptionInfo.plan}</h3>
                      <Badge 
                        className={`${
                          subscriptionInfo.color === 'gray' ? 'bg-gray-100 text-gray-800' :
                          subscriptionInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {subscriptionInfo.plan === 'Freemium' ? 'Gratuito' : 'Pago'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {subscriptionInfo.credits} créditos restantes
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso dos Créditos */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Créditos utilizados</span>
                    <span>
                      {subscriptionInfo.plan === 'Freemium' ? 5 - subscriptionInfo.credits : 
                       subscriptionInfo.plan === 'PRO' ? 100 - subscriptionInfo.credits : 
                       200 - subscriptionInfo.credits} / {
                      subscriptionInfo.plan === 'Freemium' ? 5 : 
                      subscriptionInfo.plan === 'PRO' ? 100 : 200
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        subscriptionInfo.color === 'gray' ? 'bg-gray-400' :
                        subscriptionInfo.color === 'blue' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`}
                      style={{
                        width: `${
                          subscriptionInfo.plan === 'Freemium' ? 
                          ((5 - subscriptionInfo.credits) / 5) * 100 :
                          subscriptionInfo.plan === 'PRO' ? 
                          ((100 - subscriptionInfo.credits) / 100) * 100 :
                          ((200 - subscriptionInfo.credits) / 200) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>

                {/* Ações do Plano */}
                {subscriptionInfo.plan === 'Freemium' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Upgrade seu plano</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Tenha acesso a mais créditos e módulos exclusivos
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/dashboard/planos'}
                    >
                      Ver Planos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações da Conta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Informações da Conta</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Membro desde:</span>
                  <span className="font-medium">
                    {currentUser?.createdAt ? 
                      new Date(currentUser.createdAt).toLocaleDateString('pt-BR') : 
                      currentUser?.metadata?.creationTime ?
                      new Date(currentUser.metadata.creationTime).toLocaleDateString('pt-BR') :
                      'Não disponível'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Último acesso:</span>
                  <span className="font-medium">
                    {currentUser?.updatedAt ? 
                      new Date(currentUser.updatedAt).toLocaleDateString('pt-BR') :
                      currentUser?.metadata?.lastSignInTime ?
                      new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('pt-BR') :
                      'Hoje'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-green-100 text-green-800">
                    Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Preferências do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Preferências do Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Visualização Padrão */}
                <div className="space-y-2">
                  <Label htmlFor="defaultView">Visualização Padrão</Label>
                  <Select
                    value={defaultView}
                    onValueChange={(value: 'chat' | 'modules') => handleViewChange(value)}
                    disabled={loadingPreferences}
                  >
                    <SelectTrigger id="defaultView" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">
                        <div className="flex items-center space-x-2">
                          <MonitorSmartphone className="w-4 h-4" />
                          <span>Chat AI Generativo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="modules">
                        <div className="flex items-center space-x-2">
                          <LayoutGrid className="w-4 h-4" />
                          <span>Módulos em Grade</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Define qual visualização será exibida ao fazer login no sistema
                  </p>
                </div>

                {/* Informação sobre o Tema */}
                <div className="space-y-2">
                  <Label>Tema do Sistema</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Use o botão no menu lateral para alternar entre tema claro e escuro
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default PerfilPage;