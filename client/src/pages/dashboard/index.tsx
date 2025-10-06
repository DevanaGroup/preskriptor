import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfessionalDisclaimerModal } from '@/components/ProfessionalDisclaimerModal';
import { useAuth } from '@/context/AuthContext';

const Dashboard: React.FC = () => {
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const { currentUser, userLoading } = useAuth();

  // Show disclaimer modal when user first accesses dashboard
  useEffect(() => {
    // Only check after user data is loaded
    if (!userLoading && currentUser) {
      console.log('Checking disclaimer for user:', currentUser.uid);
      const disclaimerKey = `preskriptor-disclaimer-seen-${currentUser.uid}`;
      const hasSeenDisclaimer = localStorage.getItem(disclaimerKey);
      console.log('Has seen disclaimer:', hasSeenDisclaimer);
      
      if (!hasSeenDisclaimer) {
        console.log('Showing disclaimer modal');
        setShowDisclaimerModal(true);
      }
    }
  }, [currentUser, userLoading]);

  const handleDisclaimerClose = () => {
    if (!currentUser) return;
    
    console.log('Disclaimer modal closed, setting localStorage');
    setShowDisclaimerModal(false);
    const disclaimerKey = `preskriptor-disclaimer-seen-${currentUser.uid}`;
    localStorage.setItem(disclaimerKey, 'true');
    console.log('localStorage set to:', localStorage.getItem(disclaimerKey));
  };

  return (
    <SidebarLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card de resumo 1 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-500 font-medium">Pacientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">48</div>
            <p className="text-sm text-gray-500 mt-1">+12% comparado ao mês anterior</p>
          </CardContent>
        </Card>

        {/* Card de resumo 2 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-500 font-medium">Consultas Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">12</div>
            <p className="text-sm text-gray-500 mt-1">Para os próximos 7 dias</p>
          </CardContent>
        </Card>

        {/* Card de resumo 3 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-500 font-medium">Prescrições Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">32</div>
            <p className="text-sm text-gray-500 mt-1">Neste mês</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Atividade recente */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Consulta agendada</p>
                  <p className="text-xs text-gray-500">Maria Silva - 15/05/2025 às 14:00</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Prescrição gerada</p>
                  <p className="text-xs text-gray-500">João Pereira - Hoje às 10:30</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Novo paciente cadastrado</p>
                  <p className="text-xs text-gray-500">Ana Santos - Ontem às 15:30</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Faturamento (Mês)</div>
                  <div className="text-2xl font-bold text-gray-800">R$ 8.750</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Consultas Realizadas</div>
                  <div className="text-2xl font-bold text-gray-800">37</div>
                </div>
              </div>
              <div className="pt-4">
                <div className="text-sm font-medium mb-2">Evolução Últimos 3 Meses</div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-primary rounded-full w-3/4"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Março</span>
                  <span>Abril</span>
                  <span>Maio</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <ProfessionalDisclaimerModal 
        isOpen={showDisclaimerModal} 
        onClose={handleDisclaimerClose} 
      />
    </SidebarLayout>
  );
};

export default Dashboard;