import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Users, CreditCard, MessageSquare, BarChart, Layers } from 'lucide-react';
import AssinantesTab from '@/components/admin/AssinantesTab';
import FinanceiroTab from '@/components/admin/FinanceiroTab';
import MensagensTab from '@/components/admin/MensagensTab';
import EstatisticasTab from '@/components/admin/EstatisticasTab';
import ModulosTab from '@/components/admin/ModulosTab';
import FeedbackTab from '@/components/admin/FeedbackTab';

const AdminDashboard: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("assinantes");

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/admin');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <i className="fas fa-user-shield text-primary mr-2 text-xl"></i>
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 text-sm text-gray-600">
              <span>Olá, </span>
              <span className="font-medium">{currentUser.name || currentUser.displayName}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-700 border-gray-300"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="assinantes" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="assinantes" className="flex items-center justify-center">
              <Users className="h-4 w-4 mr-2" />
              Assinantes
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="flex items-center justify-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="flex items-center justify-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center justify-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedbacks
            </TabsTrigger>
            <TabsTrigger value="modulos" className="flex items-center justify-center">
              <Layers className="h-4 w-4 mr-2" />
              Módulos
            </TabsTrigger>
            <TabsTrigger value="estatisticas" className="flex items-center justify-center">
              <BarChart className="h-4 w-4 mr-2" />
              Estatísticas
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <TabsContent value="assinantes">
              <AssinantesTab />
            </TabsContent>
            
            <TabsContent value="financeiro">
              <FinanceiroTab />
            </TabsContent>
            
            <TabsContent value="mensagens">
              <MensagensTab />
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackTab />
            </TabsContent>

            <TabsContent value="modulos">
              <ModulosTab />
            </TabsContent>
            
            <TabsContent value="estatisticas">
              <EstatisticasTab />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-4">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 Preskriptor – Painel Administrativo
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;