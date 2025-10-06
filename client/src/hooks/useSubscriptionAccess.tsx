import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionAccess {
  canAccessModule: (tier: 'Free' | 'PRO' | 'Premium') => boolean;
  canUseCredits: () => boolean;
  getRemainingCredits: () => number;
  getSubscriptionPlan: () => string;
  isFreemiumUser: () => boolean;
  isPROUser: () => boolean;
  isPremiumUser: () => boolean;
}

export const useSubscriptionAccess = (): SubscriptionAccess => {
  const { firestoreUser } = useAuth();
  const { toast } = useToast();

  const getSubscriptionPlan = (): string => {
    return firestoreUser?.subscriptionPlan || 'freemium';
  };

  const isFreemiumUser = (): boolean => {
    return getSubscriptionPlan() === 'freemium';
  };

  const isPROUser = (): boolean => {
    return getSubscriptionPlan() === 'pro';
  };

  const isPremiumUser = (): boolean => {
    return getSubscriptionPlan() === 'premium';
  };

  const canAccessModule = (tier: 'Free' | 'PRO' | 'Premium'): boolean => {
    const userPlan = getSubscriptionPlan();
    
    // Freemium pode acessar apenas módulos Free
    if (userPlan === 'freemium') {
      return tier === 'Free';
    }
    
    // PRO pode acessar Free e PRO
    if (userPlan === 'pro') {
      return tier === 'Free' || tier === 'PRO';
    }
    
    // Premium pode acessar todos
    if (userPlan === 'premium') {
      return true;
    }
    
    return false;
  };

  const canUseCredits = (): boolean => {
    if (!firestoreUser) return false;
    
    const creditsUsed = firestoreUser.creditsUsed || 0;
    const creditsLimit = firestoreUser.creditsLimit || 0;
    
    return creditsUsed < creditsLimit;
  };

  const getRemainingCredits = (): number => {
    if (!firestoreUser) return 0;
    
    const creditsUsed = firestoreUser.creditsUsed || 0;
    const creditsLimit = firestoreUser.creditsLimit || 0;
    
    return Math.max(0, creditsLimit - creditsUsed);
  };

  return {
    canAccessModule,
    canUseCredits,
    getRemainingCredits,
    getSubscriptionPlan,
    isFreemiumUser,
    isPROUser,
    isPremiumUser
  };
};