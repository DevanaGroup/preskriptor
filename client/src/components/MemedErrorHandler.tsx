import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface MemedErrorHandlerProps {
  error: string;
  onRetry: () => void;
  onFallback?: () => void;
}

export const MemedErrorHandler: React.FC<MemedErrorHandlerProps> = ({ 
  error, 
  onRetry, 
  onFallback 
}) => {
  const isOAuthError = error.toLowerCase().includes('oauth') || 
                       error.toLowerCase().includes('redirect_uri') ||
                       error.toLowerCase().includes('google');

  if (isOAuthError) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="space-y-3">
            <p className="font-medium">Problema de configuração OAuth detectado</p>
            <p className="text-sm">
              O widget Memed está tentando usar autenticação Google, mas o domínio não está 
              autorizado no Google Cloud Console do Memed.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="border-orange-300 hover:bg-orange-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar Novamente
              </Button>
              {onFallback && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onFallback}
                  className="border-orange-300 hover:bg-orange-100"
                >
                  Modo Alternativo
                </Button>
              )}
            </div>
            <p className="text-xs text-orange-600">
              Este é um problema de configuração do servidor Memed, não do nosso sistema.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="space-y-3">
          <p className="font-medium">Erro no widget Memed</p>
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar Novamente
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};