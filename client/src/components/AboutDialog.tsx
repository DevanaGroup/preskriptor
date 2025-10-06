import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sobre o Preskriptor</DialogTitle>
          <DialogDescription>
            Informações importantes sobre nossa plataforma
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 mb-3">
              O Preskriptor é uma ferramenta de apoio clínico baseada no curso Doutores da Obesidade, 
              destinada exclusivamente a médicos.
            </p>
            <p className="text-xs text-gray-600">
              As sugestões fornecidas não substituem o julgamento profissional, sendo o médico o único responsável 
              pelas decisões clínicas e prescrições realizadas (Código de Ética Médica, art. 1º, inciso IX).
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Recursos Principais</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Módulos de IA especializados em nutrição e obesidade</li>
              <li>• Integração com prescrições digitais Memed</li>
              <li>• OCR para análise automatizada de exames</li>
              <li>• Sistema completo de gestão de pacientes</li>
              <li>• Suporte técnico especializado</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Importante</h4>
            <p className="text-sm text-yellow-700">
              Esta ferramenta é um auxílio ao diagnóstico e tratamento, mas a responsabilidade 
              final pelas decisões clínicas permanece sempre com o médico responsável.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;