import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Shield, FileText, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SidebarLayout from '@/components/SidebarLayout';
import { MemedWidget } from '@/components/MemedWidget';
import { getPatients, Patient } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import memedIcon from '@assets/image_1749057814027.png';

export default function MemedOficialPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Carregar lista de pacientes
  useEffect(() => {
    const loadPatients = async () => {
      if (!currentUser?.uid) return;
      
      setIsLoadingPatients(true);
      try {
        const patientsList = await getPatients(currentUser.uid);
        setPatients(patientsList);
      } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de pacientes",
          variant: "default",
          className: "bg-blue-500 text-white border-blue-600"
        });
      } finally {
        setIsLoadingPatients(false);
      }
    };

    loadPatients();
  }, [currentUser]);

  // Callback quando prescrição é concluída
  const handlePrescriptionComplete = (prescriptionData: any) => {
    console.log('Prescrição concluída:', prescriptionData);
    toast({
      title: "Prescrição criada",
      description: `Prescrição digital criada com sucesso para ${selectedPatient?.name}`,
    });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescrições Digitais Memed</h1>
            <p className="text-gray-600 mt-1">Sistema integrado para criar prescrições digitais</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações e seleção de paciente */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card do Memed */}
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <img 
                    src={memedIcon} 
                    alt="Memed" 
                    className="h-12 w-auto"
                  />
                </div>
                <CardTitle className="text-lg">Sistema Memed</CardTitle>
                <CardDescription>
                  Prescrições digitais válidas
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Seleção de paciente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Selecionar Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="patient-select">Paciente para prescrição</Label>
                  <Select
                    value={selectedPatient?.id || ''}
                    onValueChange={(value) => {
                      const patient = patients.find(p => p.id === value);
                      setSelectedPatient(patient || null);
                    }}
                  >
                    <SelectTrigger id="patient-select">
                      <SelectValue placeholder="Selecione um paciente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id || ''}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedPatient && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm">
                        <p className="font-medium">{selectedPatient.name}</p>
                        <p className="text-gray-600">{selectedPatient.email}</p>
                        {selectedPatient.cellphone && (
                          <p className="text-gray-600">{selectedPatient.cellphone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações sobre o Memed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Sobre o Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Prescrições com validade jurídica</p>
                  <p>• Integração com farmácias</p>
                  <p>• Assinatura digital certificada</p>
                  <p>• Histórico de prescrições</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widget do Memed */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Prescritor Digital
                </CardTitle>
                <CardDescription>
                  {selectedPatient ? 
                    `Criando prescrição para ${selectedPatient.name}` : 
                    'Selecione um paciente para começar'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemedWidget
                  patientData={selectedPatient ? {
                    nome: selectedPatient.name,
                    cpf: '', // CPF não está na interface Patient atual
                    email: selectedPatient.email,
                    telefone: selectedPatient.cellphone,
                    dataNascimento: '' // birthDate não está na interface Patient atual
                  } : undefined}
                  onPrescriptionComplete={handlePrescriptionComplete}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}