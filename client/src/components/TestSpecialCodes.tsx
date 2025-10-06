import React from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { Message } from '@/lib/openai';

// Componente de teste para verificar se os códigos especiais funcionam
export const TestSpecialCodes: React.FC = () => {
  const testMessage: Message = {
    role: 'assistant',
    content: 'Esta é uma mensagem de teste com código para nova conversa. #0001'
  };

  const handleNewConversation = () => {
    console.log('🎉 TestSpecialCodes: Nova conversa foi chamada com sucesso!');
    alert('Nova conversa foi acionada!');
  };

  const handleDisableInput = (disabled: boolean) => {
    console.log('🔒 TestSpecialCodes: Input disabled:', disabled);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Teste de Códigos Especiais</h2>
      <div className="border rounded-lg p-4">
        <ChatMessage
          message={testMessage}
          isLast={true}
          onNewConversation={handleNewConversation}
          onDisableInput={handleDisableInput}
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Esta mensagem contém o código #0001 que deve exibir o botão "Nova Conversa".</p>
        <p>Se o botão aparecer e funcionar, o sistema está correto.</p>
      </div>
    </div>
  );
};