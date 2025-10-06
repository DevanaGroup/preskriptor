import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Interfaces para os tipos de dados do admin
export interface AdminAssinante {
  id: string;
  nome: string;
  email: string;
  plano: string;
  status: 'ativo' | 'pendente' | 'cancelado';
  dataAssinatura: string;
  valorMensal: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface AdminFinanceiro {
  id: string;
  data: string;
  assinante: string;
  assinanteId: string;
  plano: string;
  valor: number;
  status: 'confirmado' | 'pendente' | 'falha';
  stripePaymentIntentId?: string;
}

export interface AdminMensagem {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  data: string;
  status: 'novo' | 'respondido' | 'pendente';
}

// Funções para obter dados do Firestore
export const getAssinantes = async (): Promise<AdminAssinante[]> => {
  try {
    // Buscar usuários que possuem informações de assinatura
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const assinantes: AdminAssinante[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Verificar se o usuário tem informações de assinatura
      if (userData.stripeCustomerId || userData.plano) {
        const dataAssinatura = userData.dataAssinatura 
          ? (userData.dataAssinatura instanceof Timestamp 
            ? userData.dataAssinatura.toDate().toLocaleDateString('pt-BR')
            : new Date(userData.dataAssinatura).toLocaleDateString('pt-BR'))
          : 'N/A';
          
        assinantes.push({
          id: doc.id,
          nome: userData.name || userData.displayName || 'Usuário',
          email: userData.email || 'Sem e-mail',
          plano: userData.plano || 'Não definido',
          status: userData.statusAssinatura || 'pendente',
          dataAssinatura: dataAssinatura,
          valorMensal: userData.valorMensal || 0,
          stripeCustomerId: userData.stripeCustomerId,
          stripeSubscriptionId: userData.stripeSubscriptionId
        });
      }
    });
    
    return assinantes;
  } catch (error) {
    console.error('Erro ao buscar assinantes:', error);
    throw error;
  }
};

export const getTransacoes = async (): Promise<AdminFinanceiro[]> => {
  try {
    // Buscar transações financeiras
    const transacoesRef = collection(db, 'transacoes');
    const querySnapshot = await getDocs(transacoesRef);
    
    const transacoes: AdminFinanceiro[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const transacaoData = docSnapshot.data();
      
      // Se for uma transação de assinatura
      if (transacaoData.tipo === 'assinatura') {
        let assinanteNome = 'Usuário desconhecido';
        
        // Buscar nome do assinante
        if (transacaoData.userId) {
          try {
            const userDocRef = doc(db, 'users', transacaoData.userId);
            const userSnapshot = await getDoc(userDocRef);
            
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              assinanteNome = userData.name || userData.displayName || 'Usuário';
            }
          } catch (e) {
            console.error('Erro ao buscar dados do usuário:', e);
          }
        }
        
        const data = transacaoData.data 
          ? (transacaoData.data instanceof Timestamp 
            ? transacaoData.data.toDate().toLocaleDateString('pt-BR')
            : new Date(transacaoData.data).toLocaleDateString('pt-BR'))
          : 'N/A';
          
        transacoes.push({
          id: docSnapshot.id,
          data: data,
          assinante: assinanteNome,
          assinanteId: transacaoData.userId || '',
          plano: transacaoData.plano || 'Não especificado',
          valor: transacaoData.valor || 0,
          status: transacaoData.status || 'pendente',
          stripePaymentIntentId: transacaoData.stripePaymentIntentId
        });
      }
    }
    
    return transacoes;
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
};

export const getMensagens = async (): Promise<AdminMensagem[]> => {
  try {
    // Tentar buscar mensagens do Firestore primeiro
    try {
      // Buscar de 'messages' (nova coleção) primeiro
      const messagesRef = collection(db, 'messages');
      const messagesSnapshot = await getDocs(
        query(messagesRef, orderBy('date', 'desc'))
      );
      
      if (!messagesSnapshot.empty) {
        const mensagens: AdminMensagem[] = [];
        
        messagesSnapshot.forEach((doc) => {
          const mensagemData = doc.data();
          
          mensagens.push({
            id: doc.id,
            nome: mensagemData.name || 'Não informado',
            email: mensagemData.email || 'Não informado',
            telefone: mensagemData.phone || 'Não informado',
            mensagem: mensagemData.message || '',
            data: mensagemData.date || new Date().toISOString(),
            status: mensagemData.status || 'novo'
          });
        });
        
        console.log(`Encontradas ${mensagens.length} mensagens na coleção 'messages'`);
        return mensagens;
      }
      
      // Se não encontrou na coleção 'messages', tenta na coleção 'mensagens' (antiga)
      const mensagensRef = collection(db, 'mensagens');
      const mensagensSnapshot = await getDocs(
        query(mensagensRef, orderBy('data', 'desc'))
      );
      
      if (!mensagensSnapshot.empty) {
        const mensagens: AdminMensagem[] = [];
        
        mensagensSnapshot.forEach((doc) => {
          const mensagemData = doc.data();
          
          const data = mensagemData.data 
            ? (mensagemData.data instanceof Timestamp 
              ? mensagemData.data.toDate().toISOString()
              : new Date(mensagemData.data).toISOString())
            : new Date().toISOString();
            
          mensagens.push({
            id: doc.id,
            nome: mensagemData.nome || 'Não informado',
            email: mensagemData.email || 'Não informado',
            telefone: mensagemData.telefone || 'Não informado',
            mensagem: mensagemData.mensagem || '',
            data: data,
            status: mensagemData.status || 'novo'
          });
        });
        
        console.log(`Encontradas ${mensagens.length} mensagens na coleção 'mensagens'`);
        return mensagens;
      }
    } catch (firestoreError) {
      console.error('Erro ao buscar mensagens do Firestore:', firestoreError);
      // Continua para buscar do localStorage como fallback
    }
    
    // Se chegou aqui, tenta buscar mensagens do localStorage
    const storedMessages = localStorage.getItem('contactMessages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        
        const mensagens: AdminMensagem[] = parsedMessages.map((msg: any, index: number) => ({
          id: `local-${index}`,
          nome: msg.name || 'Não informado',
          email: msg.email || 'Não informado',
          telefone: msg.phone || 'Não informado',
          mensagem: msg.message || '',
          data: msg.date || new Date().toISOString(),
          status: msg.status || 'novo'
        }));
        
        console.log(`Encontradas ${mensagens.length} mensagens no localStorage`);
        return mensagens;
      } catch (e) {
        console.error('Erro ao parsear mensagens do localStorage:', e);
      }
    }
    
    console.log('Nenhuma mensagem encontrada');
    return [];
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return [];
  }
};

// Métodos para atualizar status de mensagem
export const atualizarStatusMensagem = async (id: string, status: 'novo' | 'respondido' | 'pendente'): Promise<void> => {
  try {
    // Se o ID começa com "local-", é uma mensagem do localStorage
    if (id.startsWith('local-')) {
      const index = parseInt(id.replace('local-', ''));
      const storedMessages = localStorage.getItem('contactMessages');
      
      if (storedMessages) {
        const messages = JSON.parse(storedMessages);
        if (messages[index]) {
          messages[index].status = status;
          messages[index].updatedAt = new Date().toISOString();
          localStorage.setItem('contactMessages', JSON.stringify(messages));
          console.log(`Status da mensagem ${id} atualizado no localStorage`);
        }
      }
      return;
    }
    
    // Tenta atualizar na coleção 'messages' primeiro
    try {
      const mensagemRef = doc(db, 'messages', id);
      await updateDoc(mensagemRef, { 
        status,
        updatedAt: new Date().toISOString() 
      });
      console.log(`Status da mensagem ${id} atualizado na coleção 'messages'`);
      return;
    } catch (error) {
      console.error(`Erro ao atualizar mensagem na coleção 'messages':`, error);
      // Tenta na coleção 'mensagens' como fallback
    }
    
    // Tenta atualizar na coleção 'mensagens'
    const mensagemRef = doc(db, 'mensagens', id);
    await updateDoc(mensagemRef, { 
      status,
      dataAtualizacao: new Date().toISOString() 
    });
    console.log(`Status da mensagem ${id} atualizado na coleção 'mensagens'`);
  } catch (error) {
    console.error('Erro ao atualizar status da mensagem:', error);
    throw error;
  }
};

// Deletar mensagem
export const deletarMensagem = async (id: string): Promise<void> => {
  try {
    // Se o ID começa com "local-", é uma mensagem do localStorage
    if (id.startsWith('local-')) {
      const index = parseInt(id.replace('local-', ''));
      const storedMessages = localStorage.getItem('contactMessages');
      
      if (storedMessages) {
        const messages = JSON.parse(storedMessages);
        messages.splice(index, 1);
        localStorage.setItem('contactMessages', JSON.stringify(messages));
        console.log(`Mensagem ${id} removida do localStorage`);
      }
      return;
    }
    
    // Tenta deletar da coleção 'messages' primeiro
    try {
      const mensagemRef = doc(db, 'messages', id);
      await deleteDoc(mensagemRef);
      console.log(`Mensagem ${id} removida da coleção 'messages'`);
      return;
    } catch (error) {
      console.error(`Erro ao deletar mensagem da coleção 'messages':`, error);
      // Tenta na coleção 'mensagens' como fallback
    }
    
    // Tenta deletar da coleção 'mensagens'
    const mensagemRef = doc(db, 'mensagens', id);
    await deleteDoc(mensagemRef);
    console.log(`Mensagem ${id} removida da coleção 'mensagens'`);
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    throw error;
  }
};

// Obter estatísticas
export const getEstatisticas = async () => {
  try {
    // Buscar total de usuários
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const totalUsuarios = usersSnapshot.size;
    
    // Buscar usuários com assinatura
    const usuariosComAssinatura = usersSnapshot.docs.filter(
      doc => doc.data().stripeCustomerId || doc.data().plano
    ).length;
    
    // Dados de exemplo para estatísticas
    return {
      usuariosAtivos: {
        total: totalUsuarios,
        novos: Math.floor(totalUsuarios * 0.1), // 10% como novos
        taxa: usuariosComAssinatura / totalUsuarios * 100,
        porPlano: {
          mensal: Math.floor(usuariosComAssinatura * 0.3), // 30% dos assinantes
          anual: Math.floor(usuariosComAssinatura * 0.6), // 60% dos assinantes
          time: Math.floor(usuariosComAssinatura * 0.1)  // 10% dos assinantes
        }
      },
      engajamento: {
        mediaDiaria: Math.floor(totalUsuarios * 0.7),
        taxaRetencao: 87.2,
        tempoMedio: 26.8,
        funcionalidadesMaisUsadas: [
          { nome: 'Prescrições', usos: 8547 },
          { nome: 'Consultas', usos: 5213 },
          { nome: 'Pacientes', usos: 4102 },
          { nome: 'Financeiro', usos: 2145 },
          { nome: 'Agenda', usos: 1876 }
        ]
      },
      dispositivos: {
        desktop: 63,
        mobile: 28,
        tablet: 9
      },
      crescimentoMensal: [
        { mes: 'Jan', usuarios: Math.floor(totalUsuarios * 0.7) },
        { mes: 'Fev', usuarios: Math.floor(totalUsuarios * 0.75) },
        { mes: 'Mar', usuarios: Math.floor(totalUsuarios * 0.82) },
        { mes: 'Abr', usuarios: Math.floor(totalUsuarios * 0.91) },
        { mes: 'Mai', usuarios: totalUsuarios }
      ]
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    throw error;
  }
};