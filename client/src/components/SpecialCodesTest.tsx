import React from 'react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { Message } from '@/lib/openai';

// Componente de teste para demonstrar os códigos especiais
export const SpecialCodesTest: React.FC = () => {
  const testMessages: Message[] = [
    {
      role: 'assistant',
      content: 'Esta resposta inclui um código para feedback. Por favor, avalie se foi útil. #0002'
    },
    {
      role: 'assistant', 
      content: 'Esta consulta foi finalizada. Você pode iniciar uma nova conversa clicando no botão abaixo. #0001'
    }
  ];

  const handleNewConversation = () => {
    console.log('🔄 Nova conversa iniciada pelo código #0001');
    alert('Nova conversa iniciada! (Teste)');
  };

  const handleDisableInput = (disabled: boolean) => {
    console.log(`🔒 Input ${disabled ? 'desabilitado' : 'habilitado'} pelo código da IA`);
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold">Teste dos Códigos Especiais da IA</h3>
      <p className="text-sm text-gray-600">
        Estes são exemplos de como os códigos #0001 e #0002 funcionam nas respostas da IA:
      </p>
      
      <div className="space-y-4">
        {testMessages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isLast={index === testMessages.length - 1}
            onNewConversation={handleNewConversation}
            onDisableInput={handleDisableInput}
          />
        ))}
      </div>

      <div className="text-xs text-gray-500 mt-4">
        <p><strong>Códigos implementados:</strong></p>
        <ul className="list-disc list-inside">
          <li><code>#0001</code> - Exibe botão "Nova Conversa" e desabilita input</li>
          <li><code>#0002</code> - Exibe botões de feedback (útil/não útil)</li>
        </ul>
        <p className="mt-2"><strong>Comportamento atualizado:</strong></p>
        <ul className="list-disc list-inside">
          <li>Feedback positivo: remove botões, mostra confirmação e exibe "Nova Conversa"</li>
          <li>Feedback negativo: remove botões, abre dialog para reportar problema</li>
          <li>Botões de feedback não podem ser alterados após seleção</li>
        </ul>
      </div>
    </div>
  );
};