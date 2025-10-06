import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Copy } from 'lucide-react';

export default function FirebaseSetup() {
  const currentUrl = window.location.origin;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configuração Firebase OAuth</h1>
        
        <Alert className="mb-6">
          <AlertDescription>
            Para resolver o erro "redirect_uri_mismatch", você precisa adicionar a URL atual aos domínios autorizados no Firebase.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. URL Atual para Autorizar</CardTitle>
              <CardDescription>
                Copie esta URL e adicione aos domínios autorizados no Firebase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <code className="flex-1 text-sm">{currentUrl.replace('https://', '')}</code>
                <button
                  onClick={() => copyToClipboard(currentUrl.replace('https://', ''))}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Copiar URL"
                >
                  <Copy size={16} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Passos no Firebase Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </span>
                <div>
                  <p className="font-medium">Acesse o Firebase Console</p>
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    console.firebase.google.com <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </span>
                <div>
                  <p className="font-medium">Selecione o projeto</p>
                  <p className="text-gray-600">Escolha o projeto "preskriptor-e8a69"</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </span>
                <div>
                  <p className="font-medium">Navegue até Authentication</p>
                  <p className="text-gray-600">Authentication → Settings → Authorized domains</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </span>
                <div>
                  <p className="font-medium">Adicione o domínio</p>
                  <p className="text-gray-600">Clique em "Add domain" e cole a URL copiada acima</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  5
                </span>
                <div>
                  <p className="font-medium">Salve as alterações</p>
                  <p className="text-gray-600">As mudanças podem levar alguns minutos para entrar em vigor</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Domínios Comuns para Adicionar</CardTitle>
              <CardDescription>
                Além da URL atual, considere adicionar estes domínios para futuras implantações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• localhost (para desenvolvimento local)</li>
                <li>• *.replit.dev (para diferentes URLs do Replit)</li>
                <li>• *.replit.app (para domínio de produção do Replit)</li>
                <li>• Seu domínio customizado (se houver)</li>
              </ul>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>Nota:</strong> Após adicionar o domínio no Firebase, aguarde alguns minutos e tente fazer login novamente. 
              Se o erro persistir, verifique se a URL foi adicionada corretamente.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}