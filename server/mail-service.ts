import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message?: string;
}

// Função para enviar e-mail usando a extensão Firebase Email Trigger
export async function sendContactEmail(contactData: ContactFormData): Promise<void> {
  try {
    // Carrega o template do e-mail
    const templatePath = path.join(__dirname, 'mail-templates', 'contact-template.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Substitui as variáveis no template
    template = template.replace('{{name}}', contactData.name);
    template = template.replace('{{email}}', contactData.email);
    template = template.replace('{{phone}}', contactData.phone);
    template = template.replace('{{message}}', contactData.message || 'Nenhuma mensagem fornecida');
    template = template.replace('{{date}}', format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR }));
    
    // Cria um documento na coleção "mail" para disparar o envio de e-mail
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to: ['atendimento@preskriptor.com.br'],
      message: {
        subject: `Novo contato de ${contactData.name} - Preskriptor`,
        html: template
      },
      timestamp: Timestamp.now()
    });
    
    console.log('E-mail de contato enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar e-mail de contato:', error);
    throw new Error('Falha ao enviar e-mail de contato');
  }
}