import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Message } from './openai';

interface ConsultationData {
  userId: string;
  patientId: string;
  patientName: string;
  threadId: string;
  messages: Array<Message & { timestamp: Date }>;
  status: 'active' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

export async function saveConsultation(data: ConsultationData): Promise<string> {
  try {
    const consultationData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'consultations'), consultationData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar consulta:', error);
    throw error;
  }
}

export async function getConsultations(userId: string, patientId?: string) {
  try {
    let q;
    
    if (patientId) {
      q = query(
        collection(db, 'consultations'),
        where('userId', '==', userId),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'consultations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const consultations: any[] = [];
    
    querySnapshot.forEach((doc) => {
      consultations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return consultations;
  } catch (error) {
    console.error('Erro ao buscar consultas:', error);
    return [];
  }
}

export async function updateConsultationStatus(consultationId: string, status: 'active' | 'completed') {
  try {
    const consultationRef = doc(db, 'consultations', consultationId);
    await updateDoc(consultationRef, {
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar status da consulta:', error);
    throw error;
  }
}