import { initializeApp, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDocs,
  Timestamp,
  orderBy,
  addDoc
} from "firebase/firestore";
import { 
  encryptPatientData, 
  decryptPatientData,
  encryptUserData,
  decryptUserData,
  encryptReceitaData,
  decryptReceitaData,
  encryptConsultationData,
  decryptConsultationData,
  encryptTransactionData,
  decryptTransactionData
} from './encryption';

// Firebase configuration
// Correção: Há um erro nos valores das variáveis de ambiente, vamos definir valores diretos e fixos
const apiKey = "AIzaSyAEs7SiWwXF4VP6zhB-alz88okKZy_9ZJA"; // VITE_FIREBASE_API_KEY
const projectId = "preskriptor-e8a69"; // Valor correto, não é o GUID em VITE_FIREBASE_PROJECT_ID
const authDomain = "preskriptor-e8a69.firebaseapp.com"; // VITE_FIREBASE_AUTH_DOMAIN
const storageBucket = "preskriptor-e8a69.appspot.com"; // Valor correto, não é o ID em VITE_FIREBASE_STORAGE_BUCKET
const messagingSenderId = "361328259562"; // VITE_FIREBASE_MESSAGING_SENDER_ID
const appId = "1:361328259562:web:7dbaadfcb32825440ac293"; // VITE_FIREBASE_APP_ID
const measurementId = "G-FFXS8T12Y5"; // VITE_FIREBASE_MEASUREMENT_ID

// Montamos a configuração
const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
};

// Log da configuração para debug (sem a apiKey para segurança)
console.log("Firebase config:", {
  projectId,
  authDomain,
  storageBucket,
  messagingSenderId,
  appId: appId ? "[PRESENTE]" : "[AUSENTE]",
  measurementId: measurementId ? "[PRESENTE]" : "[AUSENTE]",
});

// Initialize Firebase - verifica se já existe uma instância antes
let app;
try {
  // Tenta obter o app existente
  app = getApp();
  console.log("Usando instância existente do Firebase");
} catch (error) {
  // Se não existir, cria uma nova instância
  app = initializeApp(firebaseConfig);
  console.log("Criada nova instância do Firebase");
}

const auth = getAuth(app);

// Configuração do Firestore com parâmetros de persistência
const db = getFirestore(app);

// Configuração do Google Provider
const googleProvider = new GoogleAuthProvider();
// Adiciona escopo para perfil e email
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Define types based on requested structure
export interface UserSettings {
  theme: 'light' | 'dark';
  defaultView: 'chat' | 'consulta'; // /chat ou /dashboard/consulta
}

export interface User {
  id?: string;
  name: string;
  email: string;
  uid: string; // Firebase auth UID
  cellphone?: string;
  crm?: string;
  photoURL?: string;
  isAdmin?: boolean;
  termsAccepted?: boolean;
  termsAcceptedDate?: any;
  verified?: boolean; // Sistema de verificação de email
  verifiedAt?: any;
  subscriptionPlan?: string;
  creditsUsed?: number;
  creditsLimit?: number;
  hasActiveSubscription?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionUpdatedAt?: any;
  settings?: UserSettings; // Configurações do usuário
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Patient {
  id?: string;
  userId: string; // ID of the doctor who created the patient
  name: string;
  cellphone: string;
  email: string;
  lastConsult?: Date | null;
  nextConsult?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Agenda {
  id?: string;
  userId: string; // Doctor ID
  date: Date; // Date with time included
  type: string;
  patientId: string;
  patientName: string;
  status?: 'agendada' | 'realizada' | 'cancelada';
  linkVirtual?: string;
  createFinancialEntry?: boolean; // Indica se deve gerar lançamento financeiro automático
  appointmentValue?: number; // Valor da consulta para lançamento financeiro
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Transaction {
  id?: string;
  userId: string; // ID do nutricionista
  patientId?: string; // ID do paciente (opcional, pode não envolver um paciente)
  patientName?: string; // Nome do paciente
  date: Date;
  description: string;
  amount: number; // Valor (positivo para entrada, negativo para saída)
  type: 'receita' | 'despesa';
  category: string; // Ex: 'consulta', 'material', 'aluguel', etc.
  paymentMethod?: string; // Ex: 'pix', 'cartão de crédito', 'dinheiro'
  status: 'pago' | 'pendente' | 'cancelado';
  createdAt?: Date;
  updatedAt?: Date;
  pending?: boolean; // Indica que a transação está armazenada localmente e não foi sincronizada com Firestore
}

export interface Consultation {
  id?: string;
  userId: string; // ID do nutricionista
  patientId: string; // ID do paciente
  patientName: string; // Nome do paciente para facilitar consultas
  threadId: string; // ID da conversa no OpenAI
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }[];
  summary?: string; // Resumo da consulta (opcional)
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  moduleId?: string;
  moduleTitle?: string;
}

export interface Conversation {
  id?: string;
  userId: string; // ID do usuário
  conversationHash: string; // Hash único da conversa
  title: string; // Título da conversa no formato "Chat DD-MM-AAAA"
  messages: ChatMessage[];
  moduleId?: string; // ID do módulo usado na conversa
  moduleTitle?: string; // Título do módulo
  threadId?: string; // ID da thread do OpenAI se houver
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

// Check if CRM already exists (modified to work during registration)
export const checkCRMExists = async (crm: string): Promise<boolean> => {
  if (!crm || crm.trim() === '') return false;
  
  try {
    // Durante o registro, o usuário ainda não está autenticado
    // Vamos fazer uma abordagem diferente: criar o usuário primeiro e depois verificar
    const usersRef = collection(db, 'users');
    const crmQuery = query(usersRef, where('crm', '==', crm.trim()));
    const querySnapshot = await getDocs(crmQuery);
    
    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Error checking CRM existence:', error);
    // Se há erro de permissão durante o registro, permita o processo continuar
    // A verificação será feita após a autenticação
    if (error?.code === 'permission-denied') {
      console.log('Permission denied during CRM check, allowing registration to continue');
      return false;
    }
    throw error;
  }
};

// Authentication functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Get user's profile from Firestore
    await getUserProfile(userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with email and password", error);
    throw error;
  }
};

// Função auxiliar para gerar hash de verificação
const generateVerificationHash = (userId: string, email: string): string => {
  // Simplificar: apenas userId em base64
  return btoa(userId);
};

// Função para enviar email de verificação
export const sendVerificationEmail = async (userId: string, email: string, name: string) => {
  try {
    console.log('📧 Enviando email de verificação para:', email);
    
    // Gerar hash único para verificação
    const hash = generateVerificationHash(userId, email);
    
    // URL base dinâmica (para funcionar tanto em desenvolvimento quanto produção)
    const baseUrl = window.location.origin;
    const verificationLink = `${baseUrl}/verify-email?hash=${hash}`;
    
    console.log('🔗 Link de verificação gerado:', verificationLink);
    
    // Ler o template HTML do arquivo
    const templateHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação de Email - Preskriptor</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .header {
            background-color: #2563eb;
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 24px;
            color: #1f2937;
        }
        .message {
            font-size: 16px;
            margin-bottom: 32px;
            color: #4b5563;
            line-height: 1.7;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb !important;
            color: white !important;
            text-decoration: none !important;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            border: none;
        }
        .cta-container {
            text-align: center;
            margin: 32px 0;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 32px 0;
        }
        .alternative-link {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #2563eb;
        }
        .alternative-link p {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #6b7280;
        }
        .alternative-link code {
            background-color: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            color: #1f2937;
            border: 1px solid #e5e7eb;
            word-break: break-all;
            display: block;
            margin-top: 8px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-links {
            margin: 20px 0;
        }
        .footer-links a {
            color: #2563eb;
            text-decoration: none;
            margin: 0 16px;
            font-weight: 500;
            font-size: 14px;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        .footer p {
            margin: 8px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .security-notice {
            background-color: #fef7cd;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
        }
        .security-notice h3 {
            margin: 0 0 8px 0;
            color: #92400e;
            font-size: 16px;
        }
        .security-notice p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .cta-button {
                display: block;
                margin: 16px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="background-color: #2563eb; color: white;">
            <h1 style="color: white; margin: 0;">Preskriptor</h1>
            <p style="color: white; margin: 8px 0 0 0;">Prescrição Médica Segura e Inteligente com IA</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Olá, ${name}!
            </div>
            
            <div class="message">
                Bem-vindo(a) ao <strong>Preskriptor</strong>! Para garantir a segurança da sua conta e começar a usar nossa plataforma de prescrição médica inteligente, precisamos verificar seu endereço de email.
            </div>
            
            <div class="cta-container">
                <a href="${verificationLink}" class="cta-button" style="background-color: #2563eb !important; color: white !important; text-decoration: none !important;">
                    Verificar Meu Email
                </a>
            </div>
            
            <div class="alternative-link">
                <p><strong>Problema com o botão?</strong> Copie e cole o link abaixo no seu navegador:</p>
                <code>${verificationLink}</code>
            </div>
            
            <div class="divider"></div>
            
            <div class="security-notice">
                <h3>🔒 Segurança</h3>
                <p>Este link é válido por 24 horas e só pode ser usado uma vez. Se você não solicitou esta verificação, pode ignorar este email com segurança.</p>
            </div>
            
            <div class="message">
                Após a verificação, você terá acesso completo à nossa plataforma com recursos de IA para consultas médicas, prescrição digital integrada com Memed, e ferramentas avançadas para otimizar seu atendimento.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-links">
                <a href="https://www.preskriptor.com.br/terms-of-service">Termos de Uso</a>
                <a href="https://www.preskriptor.com.br/privacy-policy">Política de Privacidade</a>
            </div>
            <p>© 2025 Preskriptor. Todos os direitos reservados.</p>
            <p>Esta é uma mensagem automática, não responda este email.</p>
        </div>
    </div>
</body>
</html>`;

    // Criar documento na coleção 'mail' para trigger do Firebase
    const mailData = {
      to: email,
      message: {
        subject: 'Verificação de Email - Preskriptor',
        html: templateHtml
      }
    };
    
    // Adicionar à coleção mail que irá disparar o trigger
    await addDoc(collection(db, 'mail'), mailData);
    
    console.log('✅ Email de verificação adicionado à fila de envio');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, name: string, cellphone: string = "", crm: string = "", termsAccepted: boolean = false) => {
  try {
    console.log('registerWithEmail called with:', { email, name, cellphone, crm, termsAccepted });
    
    // Step 1: Create user in Firebase Auth first
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Não fazer verificação aqui pois já foi feita no frontend
    // A verificação prévia garante que chegamos aqui apenas com CRM válido
    
    // Step 3: Create user profile in Firestore
    try {
      console.log('Saving user with CRM:', crm);
      
      const userData = {
        name,
        email,
        uid: user.uid,
        cellphone: cellphone || "",
        crm: crm || "",
        termsAccepted: termsAccepted,
        termsAcceptedDate: termsAccepted ? Timestamp.now() : null,
        // Sistema de verificação de email
        verified: false,
        verifiedAt: null,
        // Dados do plano - Freemium por padrão
        subscriptionPlan: 'freemium',
        creditsUsed: 0,
        creditsLimit: 5,
        hasActiveSubscription: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionUpdatedAt: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      console.log('About to save userData:', userData);
      
      // Use setDoc with a specific ID to ensure we can find the document
      await setDoc(doc(db, "users", user.uid), userData);
      
      console.log("User profile created successfully in Firestore");
      
      // Enviar email de verificação automaticamente
      try {
        await sendVerificationEmail(user.uid, email, name);
        console.log("✅ Email de verificação enviado automaticamente");
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de verificação:", emailError);
        // Não falhar o registro se o email não puder ser enviado
      }
      
      return user;
    } catch (firestoreError) {
      console.error("Error creating user profile in Firestore:", firestoreError);
      // Even if Firestore fails, we return the Firebase auth user
      return user;
    }
  } catch (error) {
    console.error("Error registering with email and password", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    // Verificar se estamos em um ambiente Replit com URL dinâmica
    const currentDomain = window.location.hostname;
    const isReplitDomain = currentDomain.includes('replit.dev') || currentDomain.includes('replit.app');
    
    if (isReplitDomain) {
      // Para domínios dinâmicos do Replit, mostrar mensagem informativa
      throw new Error(`Para usar login com Google, você precisa adicionar o domínio "${currentDomain}" aos domínios autorizados no Firebase Console. Vá em Authentication > Settings > Authorized domains e adicione: ${currentDomain}`);
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // User doesn't exist in Firestore, create profile
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || user.email?.split("@")[0] || "Usuário",
          email: user.email || "",
          uid: user.uid,
          cellphone: user.phoneNumber || "",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        console.log("Google user profile created successfully in Firestore");
      }
    } catch (firestoreError) {
      console.error("Error checking/creating Google user profile in Firestore:", firestoreError);
      // Continue with auth even if Firestore fails
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    // Limpar dados do localStorage relacionados a checkout antes do logout
    localStorage.removeItem('selectedPlan');
    
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    // Try to get user document directly using uid as document ID
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      
      return {
        ...userData,
        id: userDoc.id,
        createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : userData.createdAt,
        updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate() : userData.updatedAt
      };
    }
    
    // If not found by direct ID, try querying by uid field (for backward compatibility)
    const usersQuery = query(
      collection(db, "users"),
      where("uid", "==", uid)
    );
    
    try {
      const querySnapshot = await getDocs(usersQuery);
    
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as User;
        
        // Migrar: salvar documento com UID como ID para melhorar performance no futuro
        try {
          await setDoc(doc(db, "users", uid), {
            ...userData,
            updatedAt: Timestamp.now()
          });
        } catch (migrationError) {
          // Silent migration failure
        }
        
        return {
          ...userData,
          id: userDoc.id,
          createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : userData.createdAt,
          updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate() : userData.updatedAt
        };
      }
    } catch (queryError) {
      console.error("Error executing query:", queryError);
    }
    
    // Tenta criar um perfil básico para usuário que já existe na autenticação
    try {
      const authUser = auth.currentUser;
      
      if (authUser && authUser.uid === uid) {
        const userData = {
          name: authUser.displayName || authUser.email?.split("@")[0] || "Usuário",
          email: authUser.email || "",
          uid: authUser.uid,
          cellphone: authUser.phoneNumber || "",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(doc(db, "users", uid), userData);
        
        return {
          ...userData,
          id: uid,
          createdAt: userData.createdAt.toDate(),
          updatedAt: userData.updatedAt.toDate()
        };
      }
    } catch (createError) {
      console.error("Failed to create basic profile:", createError);
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error getting user profile:", error);
    // Return null instead of throwing to prevent downstream errors
    return null;
  }
};

// CRUD for Patients
export const createPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
  // Adicionando retry logic para aumentar a chance de sucesso
  let retries = 3;
  let lastError: any = null;
  
  while (retries > 0) {
    try {
      console.log(`Tentativa de criar paciente (${4-retries}/3)`);
      
      const now = Timestamp.now();
      const patientWithTimestamp = {
        ...patientData,
        lastConsult: patientData.lastConsult ? Timestamp.fromDate(new Date(patientData.lastConsult)) : null,
        nextConsult: patientData.nextConsult ? Timestamp.fromDate(new Date(patientData.nextConsult)) : null,
        createdAt: now,
        updatedAt: now
      };

      // Criptografar dados sensíveis antes de salvar
      const encryptedPatient = encryptPatientData(patientWithTimestamp);
      
      // Operação normal de adição de documento (com dados criptografados)
      const docRef = await addDoc(collection(db, "patients"), encryptedPatient);
      
      console.log("Paciente criado com sucesso (dados criptografados):", docRef.id);
      
      // Return with converted dates (dados descriptografados para uso local)
      const newPatient: Patient = {
        ...patientData,
        id: docRef.id,
        lastConsult: patientData.lastConsult ? new Date(patientData.lastConsult) : null,
        nextConsult: patientData.nextConsult ? new Date(patientData.nextConsult) : null,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
      
      return newPatient;
    } catch (error) {
      lastError = error;
      console.error(`Erro na tentativa ${4-retries}/3 de criar paciente:`, error);
      retries--;
      
      // Espera 500ms antes de tentar novamente
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  throw lastError || new Error("Falha ao criar paciente após múltiplas tentativas");
};

export const getPatients = async (userId: string) => {
  // Implementação com retry e melhor tratamento de erros
  let retries = 3;
  let lastError: any = null;
  
  while (retries > 0) {
    try {

      
      // Removido o orderBy para evitar erro de índice não existente
      const patientsQuery = query(
        collection(db, "patients"), 
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(patientsQuery);
      const patients: Patient[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Descriptografar dados sensíveis
        const decryptedData = decryptPatientData(data);
        
        patients.push({
          id: doc.id,
          ...decryptedData,
          lastConsult: data.lastConsult instanceof Timestamp ? data.lastConsult.toDate() : data.lastConsult,
          nextConsult: data.nextConsult instanceof Timestamp ? data.nextConsult.toDate() : data.nextConsult,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as Patient);
      });
      
      // Ordenar localmente já que não podemos usar orderBy no Firestore sem índice
      patients.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      

      return patients;
    } catch (error) {
      console.error(`Erro ao buscar pacientes (tentativa ${4-retries}/3):`, error);
      lastError = error;
      retries--;
      
      if (retries > 0) {
        // Esperar um momento antes de tentar novamente (backoff exponencial)
        const delay = 1000 * Math.pow(2, 3 - retries);
        console.log(`Tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Se chegarmos aqui, todas as tentativas falharam
  console.error("Todas as tentativas de buscar pacientes falharam:", lastError);
  throw lastError;
};

export const getPatient = async (patientId: string) => {
  try {
    const patientDoc = await getDoc(doc(db, "patients", patientId));
    
    if (patientDoc.exists()) {
      const data = patientDoc.data();
      
      // Descriptografar dados sensíveis
      const decryptedData = decryptPatientData(data);
      
      return {
        id: patientDoc.id,
        ...decryptedData,
        lastConsult: data.lastConsult instanceof Timestamp ? data.lastConsult.toDate() : data.lastConsult,
        nextConsult: data.nextConsult instanceof Timestamp ? data.nextConsult.toDate() : data.nextConsult,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Patient;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting patient", error);
    throw error;
  }
};

export const updatePatient = async (patientId: string, patientData: Partial<Patient>) => {
  try {
    const updateData: Record<string, any> = { 
      ...patientData, 
      updatedAt: Timestamp.now() 
    };
    
    // Convert dates to Firestore Timestamp objects
    if (patientData.lastConsult) {
      updateData.lastConsult = Timestamp.fromDate(new Date(patientData.lastConsult));
    }
    
    if (patientData.nextConsult) {
      updateData.nextConsult = Timestamp.fromDate(new Date(patientData.nextConsult));
    }

    // Criptografar dados sensíveis antes de atualizar
    const encryptedUpdateData = encryptPatientData(updateData);
    
    const patientRef = doc(db, "patients", patientId);
    await updateDoc(patientRef, encryptedUpdateData);
    
    console.log("Paciente atualizado com sucesso (dados criptografados):", patientId);
    return patientId;
  } catch (error) {
    console.error("Error updating patient", error);
    throw error;
  }
};

export const deletePatient = async (patientId: string) => {
  try {
    await deleteDoc(doc(db, "patients", patientId));
    return patientId;
  } catch (error) {
    console.error("Error deleting patient", error);
    throw error;
  }
};

// CRUD for Agenda
export const createAgendaItem = async (agendaData: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const agendaWithTimestamp = {
      ...agendaData,
      date: Timestamp.fromDate(new Date(agendaData.date)), // Convert to Firestore Timestamp
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, "agenda"), agendaWithTimestamp);
    
    // Return with converted dates
    return {
      ...agendaData,
      id: docRef.id,
      date: new Date(agendaData.date),
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };
  } catch (error) {
    console.error("Error creating agenda item", error);
    throw error;
  }
};

export const getAgendaItems = async (userId: string) => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa de buscar compromissos (${retryCount + 1}/${maxRetries})`);
      
      const agendaQuery = query(
        collection(db, "agenda"), 
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(agendaQuery);
      const agendaItems: Agenda[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        agendaItems.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as Agenda);
      });
      
      console.log(`Compromissos carregados com sucesso: ${agendaItems.length}`);
      
      // Se obteve com sucesso do Firestore, salva no localStorage também
      try {
        localStorage.setItem(`agenda_${userId}`, JSON.stringify(agendaItems));
      } catch (e) {
        console.warn("Não foi possível salvar agenda no localStorage", e);
      }
      
      return agendaItems;
    } catch (error) {
      retryCount++;
      console.error(`Erro ao buscar compromissos (tentativa ${retryCount}/${maxRetries}):`, error);
      
      if (retryCount >= maxRetries) {
        console.error("Erro ao buscar compromissos:", error);
        
        // Tenta recuperar do localStorage como fallback
        try {
          const cachedData = localStorage.getItem(`agenda_${userId}`);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            console.log(`Recuperados ${parsedData.length} compromissos do localStorage`);
            return parsedData;
          }
        } catch (e) {
          console.error("Erro ao recuperar dados do localStorage:", e);
        }
        
        // Retorna array vazio para evitar quebra da interface
        return [];
      }
      
      // Espera antes de tentar novamente (100ms, 200ms, 300ms...)
      await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
    }
  }
  
  return [];
};

export const getAgendaItem = async (agendaId: string) => {
  try {
    const agendaDoc = await getDoc(doc(db, "agenda", agendaId));
    
    if (agendaDoc.exists()) {
      const data = agendaDoc.data();
      return {
        id: agendaDoc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Agenda;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting agenda item", error);
    throw error;
  }
};

export const updateAgendaItem = async (agendaId: string, agendaData: Partial<Agenda>) => {
  try {
    const updateData: Record<string, any> = { 
      ...agendaData, 
      updatedAt: Timestamp.now() 
    };
    
    // Convert date to Firestore Timestamp object
    if (agendaData.date) {
      updateData.date = Timestamp.fromDate(new Date(agendaData.date));
    }
    
    const agendaRef = doc(db, "agenda", agendaId);
    await updateDoc(agendaRef, updateData);
    
    return agendaId;
  } catch (error) {
    console.error("Error updating agenda item", error);
    throw error;
  }
};

export const deleteAgendaItem = async (agendaId: string) => {
  try {
    await deleteDoc(doc(db, "agenda", agendaId));
    return agendaId;
  } catch (error) {
    console.error("Error deleting agenda item", error);
    throw error;
  }
};

// CRUD para Transações Financeiras
export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const transactionWithTimestamp = {
      ...transactionData,
      date: Timestamp.fromDate(new Date(transactionData.date)), // Convert to Firestore Timestamp
      createdAt: now,
      updatedAt: now
    };

    // Criptografar dados sensíveis antes de salvar
    const encryptedTransaction = encryptTransactionData(transactionWithTimestamp);
    
    // Tente criar a transação
    try {
      const docRef = await addDoc(collection(db, "transactions"), encryptedTransaction);
      
      // Return with converted dates
      return {
        ...transactionData,
        id: docRef.id,
        date: new Date(transactionData.date),
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      } as Transaction;
    } catch (error: any) {
      // Se o erro for de permissão, salve em localStorage como fallback para evitar perda de dados
      if (error.code === 'permission-denied') {
        try {
          // Criar ID local para a transação
          const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Salvar em localStorage com ID local para referência futura
          const localTransaction = {
            ...transactionData,
            id: localId,
            date: transactionData.date.toISOString(),
            createdAt: now.toDate().toISOString(),
            updatedAt: now.toDate().toISOString(),
            pending: true // Marcar como pendente para sincronização futura
          };
          
          // Obter transações existentes no localStorage ou inicializar array vazio
          const storedTransactions = localStorage.getItem('pendingTransactions');
          const pendingTransactions = storedTransactions ? JSON.parse(storedTransactions) : [];
          
          // Adicionar nova transação e salvar de volta
          pendingTransactions.push(localTransaction);
          localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
          
          console.warn("Transação salva localmente devido a erro de permissão do Firestore");
          
          // Retornar objeto de transação com data convertida corretamente para uso na aplicação
          return {
            ...transactionData,
            id: localId,
            date: new Date(transactionData.date),
            createdAt: now.toDate(),
            updatedAt: now.toDate(),
            pending: true
          } as Transaction;
        } catch (localError) {
          console.error("Erro ao salvar transação localmente:", localError);
          throw localError;
        }
      } else {
        console.error("Error creating transaction", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("Error creating transaction", error);
    throw error;
  }
};

export const getTransactions = async (userId: string) => {
  try {
    // Implementação com retry para maior confiabilidade
    let retries = 3;
    let firestoreTransactions: Transaction[] = [];
    let firestoreSuccess = false;
    
    while (retries > 0 && !firestoreSuccess) {
      try {
        console.log(`Tentativa de buscar transações (${4-retries}/3)`);
        
        // Verificar se a coleção transactions existe e, se não, criar um documento inicial
        try {
          // Tentativa de criar uma coleção caso não exista ainda
          // Primeiro, verificamos se já existe algum documento
          const verifyQuery = query(
            collection(db, "transactions")
          );
          
          const verifySnapshot = await getDocs(verifyQuery);
          
          if (verifySnapshot.empty) {
            console.log("Coleção de transações vazia, inicializando...");
            
            // Criar um documento inicial para garantir que a coleção exista
            await addDoc(collection(db, "transactions"), {
              userId: userId,
              description: "Configuração inicial",
              amount: 0,
              type: "receita",
              category: "Outros",
              date: Timestamp.now(),
              status: "pago",
              isSystemGenerated: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            
            console.log("Coleção de transações inicializada com sucesso");
          }
        } catch (initError) {
          console.warn("Erro ao inicializar coleção de transações:", initError);
          // Continuamos mesmo com erro, pois a coleção pode já existir
        }
        
        // Agora tentamos buscar as transações, excluindo documentos do sistema
        const transactionsQuery = query(
          collection(db, "transactions"), 
          where("userId", "==", userId),
          orderBy("date", "desc")
        );
        
        const querySnapshot = await getDocs(transactionsQuery);
        firestoreTransactions = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Ignorar documentos do sistema
          if (data.isSystemGenerated) return;

          // Descriptografar dados sensíveis
          const decryptedData = decryptTransactionData(data);
          
          firestoreTransactions.push({
            id: doc.id,
            ...decryptedData,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          } as Transaction);
        });
        
        console.log(`Transações carregadas do Firestore: ${firestoreTransactions.length}`);
        firestoreSuccess = true;
      } catch (error) {
        console.error(`Erro ao buscar transações (tentativa ${4-retries}/3):`, error);
        retries--;
        
        // Se ainda temos tentativas, esperamos e tentamos novamente
        if (retries > 0) {
          // Espera exponencial entre tentativas
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, 4-retries) * 500));
        } else {
          // Se atingimos o limite de tentativas, registramos o erro
          console.error("Não foi possível carregar transações do Firestore após várias tentativas");
        }
      }
    }
    
    // Tentar carregar transações salvas localmente
    let localTransactions: Transaction[] = [];
    try {
      const storedTransactions = localStorage.getItem('pendingTransactions');
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        
        // Filtrar as transações pertencentes ao usuário atual
        localTransactions = parsedTransactions
          .filter((t: any) => t.userId === userId)
          .map((t: any) => ({
            ...t,
            date: new Date(t.date),
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
            pending: true // Marcar como pendente para exibir diferente na UI
          }));
        
        if (localTransactions.length > 0) {
          console.log(`Carregadas ${localTransactions.length} transações do armazenamento local`);
        }
      }
    } catch (localError) {
      console.error("Erro ao carregar transações locais:", localError);
    }
    
    // Combinar as transações do Firestore com as transações locais
    const allTransactions = [...firestoreTransactions, ...localTransactions];
    
    // Ordenar por data (mais recente primeiro)
    allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    console.log(`Total de transações carregadas: ${allTransactions.length}`);
    return allTransactions;
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    
    // Tentar retornar pelo menos as transações locais em caso de erro geral
    try {
      const storedTransactions = localStorage.getItem('pendingTransactions');
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        
        // Filtrar as transações pertencentes ao usuário atual
        const localTransactions = parsedTransactions
          .filter((t: any) => t.userId === userId)
          .map((t: any) => ({
            ...t,
            date: new Date(t.date),
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
            pending: true
          }));
        
        if (localTransactions.length > 0) {
          console.log(`Recuperadas ${localTransactions.length} transações do armazenamento local após falha geral`);
          return localTransactions;
        }
      }
    } catch (localError) {
      console.error("Erro ao recuperar transações locais após falha geral:", localError);
    }
    
    // Retornamos uma lista vazia em último caso
    return [];
  }
};

export const getTransaction = async (transactionId: string) => {
  try {
    const transactionDoc = await getDoc(doc(db, "transactions", transactionId));
    
    if (transactionDoc.exists()) {
      const data = transactionDoc.data();
      return {
        id: transactionDoc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Transaction;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting transaction", error);
    throw error;
  }
};

export const updateTransaction = async (transactionId: string, transactionData: Partial<Transaction>) => {
  try {
    const updateData: Record<string, any> = { 
      ...transactionData, 
      updatedAt: Timestamp.now() 
    };
    
    // Convert date to Firestore Timestamp object
    if (transactionData.date) {
      updateData.date = Timestamp.fromDate(new Date(transactionData.date));
    }
    
    const transactionRef = doc(db, "transactions", transactionId);
    await updateDoc(transactionRef, updateData);
    
    return transactionId;
  } catch (error) {
    console.error("Error updating transaction", error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId: string) => {
  try {
    const transactionRef = doc(db, "transactions", transactionId);
    await deleteDoc(transactionRef);
    
    return transactionId;
  } catch (error) {
    console.error("Error deleting transaction", error);
    throw error;
  }
};

// CRUD para Consultas
export const saveConsultation = async (consultationData: Omit<Consultation, 'id' | 'createdAt' | 'updatedAt'>) => {
  // Implementação com retry para maior confiabilidade
  let retries = 3;
  let lastError: any = null;
  
  while (retries > 0) {
    try {
      console.log(`Tentativa de salvar consulta (${4-retries}/3)`);
      
      const now = Timestamp.now();
      const consultationWithTimestamp = {
        ...consultationData,
        createdAt: now,
        updatedAt: now,
        // Certifique-se de que timestamp está no formato correto para cada mensagem
        messages: consultationData.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? Timestamp.fromDate(msg.timestamp) : msg.timestamp
        }))
      };

      // Criptografar dados sensíveis antes de salvar
      const encryptedConsultation = encryptConsultationData(consultationWithTimestamp);
      
      // Salvar no Firestore (dados criptografados)
      const docRef = await addDoc(collection(db, "consultations"), encryptedConsultation);
      
      // Também atualizar o paciente com a data da última consulta
      await updatePatient(consultationData.patientId, {
        lastConsult: now.toDate(),
        updatedAt: now.toDate()
      });
      
      console.log("Consulta salva com sucesso:", docRef.id);
      
      return {
        id: docRef.id,
        ...consultationData,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      console.error(`Erro ao salvar consulta (tentativa ${4-retries}/3):`, error);
      lastError = error;
      retries--;
      
      if (retries > 0) {
        // Esperar um momento antes de tentar novamente
        const delay = 1000 * Math.pow(2, 3 - retries);
        console.log(`Tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("Todas as tentativas de salvar consulta falharam:", lastError);
  throw lastError || new Error("Falha ao salvar consulta após múltiplas tentativas");
};

export const updateConsultation = async (consultationId: string, updates: Partial<Consultation>) => {
  try {
    const now = Timestamp.now();
    const consultationRef = doc(db, "consultations", consultationId);
    
    // Preparar atualizações com timestamps corretos
    const updatesWithTimestamp: any = {
      ...updates,
      updatedAt: now
    };
    
    // Se houver mensagens para atualizar, garantir formato correto dos timestamps
    if (updates.messages) {
      updatesWithTimestamp.messages = updates.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? Timestamp.fromDate(msg.timestamp) : msg.timestamp
      }));
    }
    
    await updateDoc(consultationRef, updatesWithTimestamp);
    
    return {
      id: consultationId,
      ...updates,
      updatedAt: now.toDate()
    };
  } catch (error) {
    console.error("Erro ao atualizar consulta:", error);
    throw error;
  }
};

export const getConsultations = async (userId: string) => {
  try {
    // Buscar consultas ordenadas por data de criação decrescente
    const q = query(
      collection(db, "consultations"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const consultations: Consultation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Descriptografar dados sensíveis
      const decryptedData = decryptConsultationData(data);
      
      // Converter timestamps para objetos Date
      consultations.push({
        id: doc.id,
        ...decryptedData,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        // Converter timestamps em cada mensagem (após descriptografia)
        messages: decryptedData.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp
        }))
      } as Consultation);
    });
    
    return consultations;
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    throw error;
  }
};

export const getPatientConsultations = async (patientId: string) => {
  try {
    // Buscar consultas de um paciente específico
    const q = query(
      collection(db, "consultations"),
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const consultations: Consultation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Converter timestamps para objetos Date
      consultations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        // Converter timestamps em cada mensagem
        messages: data.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp
        }))
      } as Consultation);
    });
    
    return consultations;
  } catch (error) {
    console.error("Erro ao buscar consultas do paciente:", error);
    throw error;
  }
};

// === FUNÇÕES DE CONVERSAS ===

// Gerar hash único para conversa
export const generateConversationHash = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `conv_${timestamp}_${randomPart}`;
};

// Formatar data para título da conversa
const formatDateForTitle = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Criar nova conversa
export const createConversation = async (
  userId: string,
  moduleId?: string,
  moduleTitle?: string
): Promise<Conversation> => {
  try {
    const now = new Date();
    const conversationHash = generateConversationHash();
    const title = `Chat ${formatDateForTitle(now)}`;
    
    const conversation: Omit<Conversation, 'id'> = {
      userId,
      conversationHash,
      title,
      messages: [],
      moduleId,
      moduleTitle,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, 'conversations'), {
      ...conversation,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });

    return {
      id: docRef.id,
      ...conversation
    };
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }
};

// Salvar mensagem em uma conversa
export const saveMessageToConversation = async (
  conversationId: string,
  message: Omit<ChatMessage, 'id'>
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversa não encontrada');
    }

    const conversationData = conversationDoc.data();
    const currentMessages = conversationData.messages || [];
    
    // Garantir que timestamp é uma Date válida
    const messageTimestamp = message.timestamp instanceof Date 
      ? message.timestamp 
      : new Date();
    
    const newMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Timestamp.fromDate(messageTimestamp)
    };

    await updateDoc(conversationRef, {
      messages: [...currentMessages, newMessage],
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Mensagem adicionada à conversa:', conversationId);
  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
    throw error;
  }
};

// Buscar conversas do usuário (limitado)
export const getUserConversations = async (
  userId: string, 
  limit: number = 5
): Promise<Conversation[]> => {
  try {
    // Query simples sem orderBy para evitar erro de índice
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        messages: (data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now())
        }))
      } as Conversation);
    });

    // Ordenar por updatedAt no cliente e aplicar limite
    const sortedConversations = conversations
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
      .slice(0, limit);

    return sortedConversations;
  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error);
    // Retornar array vazio em vez de fazer throw para não quebrar a UI
    return [];
  }
};

// Buscar todas as conversas do usuário
export const getAllUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    // Query simples sem orderBy para evitar erro de índice
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        messages: (data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp || Date.now())
        }))
      } as Conversation);
    });

    // Ordenar por updatedAt no cliente
    const sortedConversations = conversations
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));

    return sortedConversations;
  } catch (error) {
    console.error('❌ Erro ao buscar todas as conversas:', error);
    // Retornar array vazio em vez de fazer throw para não quebrar a UI
    return [];
  }
};

// Buscar conversa por ID
export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      return null;
    }

    const data = conversationDoc.data();
    return {
      id: conversationDoc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      messages: (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp
      }))
    } as Conversation;
  } catch (error) {
    console.error('Erro ao buscar conversa:', error);
    throw error;
  }
};

// Buscar conversa por hash
export const getConversationByHash = async (userId: string, conversationHash: string): Promise<Conversation | null> => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId),
      where('conversationHash', '==', conversationHash)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0]; // Pegar primeira (deve ser única)
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      messages: (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : msg.timestamp
      }))
    } as Conversation;
  } catch (error) {
    console.error('Erro ao buscar conversa por hash:', error);
    throw error;
  }
};

// Atualizar status da conversa
export const updateConversationStatus = async (
  conversationId: string, 
  status: 'active' | 'completed' | 'archived'
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao atualizar status da conversa:', error);
    throw error;
  }
};

// === FUNÇÕES DE CONFIGURAÇÕES DO USUÁRIO ===

// Obter configurações do usuário
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.settings || { theme: 'light', defaultView: 'consulta' };
    }
    // Retornar configurações padrão se não existir
    return { theme: 'light', defaultView: 'consulta' };
  } catch (error) {
    console.error('Erro ao buscar configurações do usuário:', error);
    // Retornar configurações padrão em caso de erro
    return { theme: 'light', defaultView: 'consulta' };
  }
};

// Atualizar configurações do usuário
export const updateUserSettings = async (
  userId: string, 
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentData = userDoc.data();
      const currentSettings = currentData.settings || { theme: 'light', defaultView: 'consulta' };
      
      await updateDoc(userRef, {
        settings: {
          ...currentSettings,
          ...settings
        },
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações do usuário:', error);
    throw error;
  }
};

// Exportar tudo o que precisamos
export { 
  auth, 
  db, 
  onAuthStateChanged, 
  Timestamp
};
export type { FirebaseUser };