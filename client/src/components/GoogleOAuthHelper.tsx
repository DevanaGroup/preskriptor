import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';

interface GoogleOAuthHelperProps {
  onDismiss?: () => void;
}

export const GoogleOAuthHelper: React.FC<GoogleOAuthHelperProps> = ({ onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const currentDomain = window.location.hostname;
  const isReplitDomain = currentDomain.includes('replit.dev') || currentDomain.includes('replit.app');

  const copyDomain = async () => {
    try {
      await navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentDomain;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isReplitDomain) return null;

  return (
    <Card className="w-full border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Configuração Google OAuth
        </CardTitle>
        <CardDescription className="text-orange-700">
          Para usar login com Google no Replit, configure este domínio no Firebase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-300 bg-orange-100">
          <AlertDescription className="text-orange-800">
            <strong>Domínio atual:</strong> O Replit gera URLs dinâmicas. Este domínio precisa ser adicionado aos domínios autorizados no Firebase Console.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-orange-800">Copie este domínio:</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-3 py-2 bg-white border rounded text-sm font-mono">
                {currentDomain}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyDomain}
                className="border-orange-300 hover:bg-orange-100"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-orange-200">
            <h4 className="font-medium text-orange-800 mb-2">Passos rápidos:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-orange-700">
              <li>
                Acesse{' '}
                <a 
                  href="https://console.firebase.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Firebase Console <ExternalLink size={12} />
                </a>
              </li>
              <li>Projeto: <code className="bg-gray-100 px-1 rounded">preskriptor-e8a69</code></li>
              <li>Authentication → Settings → Authorized domains</li>
              <li>Add domain → Cole o domínio copiado → Save</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDismiss}
              className="border-orange-300 hover:bg-orange-100"
            >
              Usar Email/Senha
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
              className="border-orange-300 hover:bg-orange-100"
            >
              Abrir Firebase
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};