import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { FaWhatsapp } from 'react-icons/fa';

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'O nome deve ter pelo menos 3 caracteres.',
  }),
  email: z.string().email({
    message: 'Insira um e-mail válido.',
  }),
  phone: z.string().min(10, {
    message: 'O telefone deve ter pelo menos 10 dígitos.',
  }),
  message: z.string().min(10, {
    message: 'A mensagem deve ter pelo menos 10 caracteres.',
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Função para formatar o telefone enquanto o usuário digita
const formatPhoneNumber = (value: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = value.replace(/\D/g, '');
  
  // Aplicar a máscara conforme o usuário digita
  if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 6) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
  } else {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
  }
};

const ContactSection: React.FC = () => {
  const { toast } = useToast();
  const [phoneValue, setPhoneValue] = useState('');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await apiRequest('POST', '/api/contact', data);
      const responseData = await response.json();
      
      // Se a solicitação for bem-sucedida, salvar no Firestore
      if (responseData.success && responseData.data) {
        try {
          // Importar dinamicamente os módulos do Firestore
          const { getFirestore, collection, addDoc } = await import('firebase/firestore');
          const db = getFirestore();
          
          // Salvar a mensagem no Firestore
          await addDoc(collection(db, 'messages'), {
            ...responseData.data,
            createdAt: new Date().toISOString()
          });
          
          console.log('Mensagem salva no Firestore com sucesso');
        } catch (firestoreError) {
          console.error('Erro ao salvar mensagem no Firestore:', firestoreError);
          // Salvar no localStorage como backup quando o Firestore falhar
          try {
            const existingMessages = localStorage.getItem('contactMessages');
            const messages = existingMessages ? JSON.parse(existingMessages) : [];
            
            messages.push({
              ...responseData.data,
              createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('contactMessages', JSON.stringify(messages));
            console.log('Mensagem salva no localStorage como backup');
          } catch (localStorageError) {
            console.error('Erro ao salvar no localStorage:', localStorageError);
          }
          
          // Ainda consideramos o envio bem-sucedido, pois o servidor recebeu a mensagem
        }
      }
      
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Em breve entraremos em contato.',
      });
      
      form.reset();
      setPhoneValue(''); // Limpa o campo de telefone com máscara
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Por favor tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="py-16 bg-neutral" id="contact">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">Pronto para Transformar Sua Prática Clínica?</h2>
          <p className="text-center text-gray-600 mb-4 max-w-2xl mx-auto">
            Não perca mais tempo com prescrições manuais e documentação excessiva. Junte-se a centenas de médicos que estão revolucionando seu atendimento.
          </p>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto font-medium">
            Preenchimento em menos de 1 minuto. Resposta no mesmo dia.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Por que nos escolher:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                    <span>Desenvolvimento por médicos para médicos</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                    <span>Suporte técnico dedicado e ágil</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                    <span>Tecnologia de ponta em IA para prescrições</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                    <span>100% seguro e em conformidade com LGPD</span>
                  </li>
                </ul>
              </div>
            
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <i className="fas fa-envelope text-primary mt-1 mr-4 w-5 text-center"></i>
                  <p>contato@preskriptor.com.br</p>
                </div>
                
                <div className="flex items-start">
                  <FaWhatsapp className="text-green-500 mt-1 mr-4 w-5 h-5" />
                  <p>(21) 99592-9293</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Nome completo</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">E-mail</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Telefone</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="(00) 00000-0000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                            value={phoneValue}
                            onChange={(e) => {
                              const formattedValue = formatPhoneNumber(e.target.value);
                              setPhoneValue(formattedValue);
                              // Enviar apenas os números para o campo do formulário
                              field.onChange(e.target.value.replace(/\D/g, ''));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Mensagem</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary text-white font-medium py-6 rounded-lg hover:bg-primaryDark transition-colors text-lg"
                  >
                    Quero Experimentar o Preskriptor
                  </Button>
                  <p className="text-center text-gray-500 text-sm mt-4">
                    Sem compromisso. Cancele quando quiser.
                  </p>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
