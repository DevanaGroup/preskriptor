import { db } from './firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

/**
 * Define um usuário como administrador no Firestore
 * @param userId ID do usuário a ser definido como administrador
 */
export const setUserAsAdmin = async (userId: string): Promise<void> => {
  try {
    // Verifica se o documento do usuário existe
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error(`Usuário com ID ${userId} não encontrado`);
    }
    
    // Atualiza o usuário para ser administrador
    await updateDoc(userRef, {
      isAdmin: true,
      updatedAt: new Date()
    });
    
    console.log(`Usuário ${userId} definido como administrador com sucesso`);
  } catch (error) {
    console.error('Erro ao definir usuário como administrador:', error);
    throw error;
  }
};

/**
 * Verifica se o usuário atual é administrador
 * @returns Promise<boolean> - true se o usuário for administrador, false caso contrário
 */
export const checkIfUserIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }
    
    const userData = userSnap.data();
    return userData.isAdmin === true;
  } catch (error) {
    console.error('Erro ao verificar se o usuário é administrador:', error);
    return false;
  }
};