import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';

interface ProfessionalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfessionalDisclaimerModal: React.FC<ProfessionalDisclaimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal={true}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Sobre o Preskriptor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-700 leading-relaxed">
            <p>
              O Preskriptor é uma ferramenta de apoio à decisão clínica, desenvolvida com base no 
              conteúdo do curso Doutores da Obesidade e destinada exclusivamente a médicos 
              regularmente inscritos nos Conselhos Regionais de Medicina. As sugestões apresentadas 
              possuem caráter orientativo e não substituem o julgamento técnico-profissional do 
              médico, que permanece integralmente responsável pelas condutas adotadas e pelas 
              prescrições realizadas, nos termos do artigo 1º, inciso IX, do Código de Ética Médica.
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-4">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <label
              htmlFor="accept-terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Declaro que li, compreendi e concordo com os termos acima.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleAccept} 
            className="w-full"
            disabled={!accepted}
          >
            Acessar o Preskriptor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};