import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy, Check, Info } from 'lucide-react';

export const FirebaseOAuthGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const currentDomain = window.location.hostname;
  
  const copyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Configuração necessária para Google OAuth
        </CardTitle>
        <CardDescription>
          Para usar login com Google no Replit, você precisa autorizar este domínio no Firebase Console
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            O Replit gera URLs dinâmicas a cada reinicialização. Para o Google OAuth funcionar, 
            o domínio atual precisa estar nos domínios autorizados do Firebase.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Domínio atual para autorizar:</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                {currentDomain}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyDomain}
                className="flex items-center gap-1"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Passos para configurar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a></li>
              <li>Selecione o projeto "preskriptor-e8a69"</li>
              <li>Vá em Authentication → Settings → Authorized domains</li>
              <li>Clique em "Add domain" e cole o domínio copiado acima</li>
              <li>Salve as alterações e aguarde alguns minutos</li>
            </ol>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Dica:</strong> Você também pode adicionar "*.replit.dev" como domínio autorizado 
              para evitar ter que reconfigurar a cada reinicialização.
            </AlertDescription>
          </Alert>

          <div className="pt-2">
            <p className="text-sm text-gray-600">
              Enquanto isso, você pode usar o <strong>login com email e senha</strong> que funciona normalmente.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};