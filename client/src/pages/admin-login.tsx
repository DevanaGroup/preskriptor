import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  email: z.string().email({
    message: 'Por favor, insira um e-mail válido.',
  }),
  password: z.string().min(6, {
    message: 'A senha deve ter pelo menos 6 caracteres.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

const AdminLogin: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // Nota: Aqui realizaríamos uma verificação no banco de dados para confirmar
      // que o usuário logado é realmente um administrador
      setLocation('/admin/dashboard');
      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo ao painel administrativo.',
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast({
        title: 'Falha no login',
        description: 'Credenciais inválidas ou você não tem permissões de administrador.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-full">
              <i className="fas fa-user-shield text-white text-xl"></i>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Acesso Administrativo</h2>
          <p className="mt-2 text-sm text-gray-600">
            Área restrita para administradores do sistema.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Senha</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password"
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white py-2 rounded-md hover:bg-primaryDark transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </Form>
        
        <div className="text-center mt-4">
          <button 
            onClick={() => setLocation('/')}
            className="text-sm text-primary hover:underline"
          >
            Voltar para página inicial
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;