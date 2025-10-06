import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useToast } from './use-toast';

// Definição das categorias de módulos
export const MODULE_CATEGORIES = [
  { value: 'receitas', label: 'Receitas' },
  { value: 'calculadoras', label: 'Calculadoras' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'exames', label: 'Exames' },
  { value: 'seguranca', label: 'Segurança' }
] as const;

export type ModuleCategory = typeof MODULE_CATEGORIES[number]['value'];

// Tipo para a configuração de módulos
export interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  assistantId: string;
  enabled: boolean;
  tier?: 'Free' | 'PRO' | 'Premium';
  icon?: string;
  category?: ModuleCategory;
}

// Lista padrão de módulos disponíveis no sistema
export const modulesList = [
  {
    id: 'fitoterapia-obesidade',
    title: 'Fitoterapia na Obesidade',
    description: 'Aborde a utilização de plantas medicinais de forma eficaz',
    icon: 'leaf'
  },
  {
    id: 'conversor-cliques-semaglutida',
    title: 'Conversor de Cliques – Semaglutida',
    description: 'Converta doses semanais entre canetas Ozempic® e Wegovy® com base matemática precisa',
    icon: 'syringe'
  },
  {
    id: 'algoritmo-indicacao-antiobesidade',
    title: 'Algoritmo - Indicação de Medicação Antiobesidade (MAO)',
    description: 'Veja se o seu paciente preenche critérios para a terapia medicamentosa da obesidade conforme as diretrizes',
    icon: 'scale'
  },
  {
    id: 'algoritmo-indicacao-cirurgia-bariatrica',
    title: 'Algoritmo - Indicação de Cirurgia Bariátrica',
    description: 'Conforme a Resolução CFM 2429/25',
    icon: 'hospital'
  },
  {
    id: 'prontuario-blindado',
    title: 'Prontuário Blindado',
    description: 'Transcreva suas consultas com IA e não deixe escapar nada',
    icon: 'lock'
  },
  {
    id: 'obesidade-sobrepeso',
    title: 'Obesidade e Sobrepeso',
    description: 'Prescrições para tratamento de obesidade e sobrepeso com foco em emagrecimento saudável',
    icon: 'weight-scale'
  },
  {
    id: 'terapia-hormonal-feminina',
    title: 'Terapia Hormonal Feminina',
    description: 'Abordagem nutricional para equilíbrio hormonal feminino e questões relacionadas',
    icon: 'venus'
  },
  {
    id: 'terapia-hormonal-masculina',
    title: 'Terapia Hormonal Masculina',
    description: 'Orientações nutricionais para otimização hormonal masculina',
    icon: 'mars'
  },
  {
    id: 'pre-diabetes',
    title: 'Pré-Diabetes',
    description: 'Intervenções nutricionais para prevenir a progressão para diabetes tipo 2',
    icon: 'droplet'
  },
  {
    id: 'diabetes-tipo-2',
    title: 'Diabetes Tipo 2',
    description: 'Planos alimentares para controle glicêmico e manejo do diabetes',
    icon: 'activity'
  },
  {
    id: 'exames-laboratoriais',
    title: 'Interpretação de Exames Laboratoriais',
    description: 'Análise e orientação nutricional baseada em resultados de exames',
    icon: 'clipboard-list'
  },
  {
    id: 'reposicao-vitaminas-minerais',
    title: 'Reposição de Vitaminas e Minerais',
    description: 'Orientações para correção de deficiências nutricionais',
    icon: 'pill'
  },
  {
    id: 'exames-hormonais',
    title: 'Interpretação Avançada de Exames Hormonais',
    description: 'Análise detalhada de perfis hormonais e recomendações nutricionais personalizadas',
    icon: 'microscope'
  },
  {
    id: 'bioimpedancia',
    title: 'Bioimpedância',
    description: 'Análise de composição corporal e interpretação de resultados',
    icon: 'activity'
  },
  {
    id: 'medicina-canabinoide',
    title: 'Medicina Canabinóide',
    description: 'Adapte a posologia às queixas de seu paciente de forma segura',
    icon: 'leaf'
  },
  {
    id: 'medicacoes-impacto-peso',
    title: 'Medicações em Uso × Impacto no Peso',
    description: 'As medicações em uso estão fazendo seu paciente ganhar peso?',
    icon: 'pill'
  }
];

// Hook personalizado para acessar configurações de módulos
export function useModuleConfig() {
  const [isLoading, setIsLoading] = useState(true);
  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfig[]>([]);
  const { toast } = useToast();

  // Função para buscar configurações de módulos exclusivamente do Firestore
  const fetchModuleConfigs = async () => {
    try {
      setIsLoading(true);

      
      const modulesRef = collection(db, "modules");
      const modulesSnapshot = await getDocs(modulesRef);
      
      const configs: ModuleConfig[] = [];
      
      modulesSnapshot.forEach(doc => {
        const data = doc.data();

        configs.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          assistantId: data.assistantId || '',
          enabled: data.enabled || false,
          tier: data.tier || 'Free',
          icon: data.icon || '',
          category: data.category || 'receitas'
        });
      });
      

      
      setModuleConfigs(configs);
    } catch (error) {
      console.error("❌ Erro ao carregar módulos:", error);
      // Silent fail - modules will be empty but no toast error shown
      setModuleConfigs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleConfigs();
  }, []);

  return {
    isLoading,
    moduleConfigs,
    enabledModules: moduleConfigs.filter(mod => mod.enabled),
    getModulesByCategory: (category: ModuleCategory) => 
      moduleConfigs.filter(mod => mod.enabled && mod.category === category),
    refreshModuleConfigs: fetchModuleConfigs
  };
}