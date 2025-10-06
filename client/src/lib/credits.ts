import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

export async function checkAndDeductCredit(
  userId: string,
  userName: string,
  forceNewCredit: boolean = false
): Promise<boolean> {
  if (!userId) return false;

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        console.error('Usuário não encontrado');
        return false;
      }
      
      const userData = userDoc.data();
      const creditsUsed = userData.creditsUsed || 0;
      const creditsLimit = userData.creditsLimit || 0;
      
      // Verificar se tem créditos disponíveis
      if (creditsUsed >= creditsLimit) {
        console.error('Créditos insuficientes');
        return false;
      }
      
      // Deduzir 1 crédito
      transaction.update(userRef, {
        creditsUsed: creditsUsed + 1,
        lastCreditUsed: new Date()
      });
      
      return true;
    });
  } catch (error) {
    console.error('Erro ao processar crédito:', error);
    return false;
  }
}

export async function getRemainingCredits(userId: string): Promise<number> {
  if (!userId) return 0;
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return 0;
    
    const userData = userDoc.data();
    const creditsUsed = userData.creditsUsed || 0;
    const creditsLimit = userData.creditsLimit || 0;
    
    return Math.max(0, creditsLimit - creditsUsed);
  } catch (error) {
    console.error('Erro ao buscar créditos:', error);
    return 0;
  }
}