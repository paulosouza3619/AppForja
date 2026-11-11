export type ModuleKey =
  | "todo"
  | "habitos"
  | "treino"
  | "agua"
  | "dieta"
  | "leitura"
  | "skill"
  | "paz"
  | "fin"
  | "plano"
  | "inv"
  | "metas"
  | "inicio"
  | "config";

export interface ModuleMeta {
  key: ModuleKey;
  name: string;
  description: string;
  group: string;
}

export const MODULES: ModuleMeta[] = [
  { key: "todo", name: "Tarefas", description: "Organize compromissos e entregas", group: "Organização" },
  { key: "habitos", name: "Hábitos", description: "Construa consistência e reduza comportamentos que atrapalham", group: "Organização" },
  { key: "metas", name: "Missões", description: "Acompanhe objetivos de maior prazo", group: "Organização" },
  { key: "treino", name: "Treino", description: "Acompanhe sua atividade física", group: "Saúde e energia" },
  { key: "agua", name: "Água", description: "Acompanhe sua hidratação", group: "Saúde e energia" },
  { key: "dieta", name: "Alimentação", description: "Registre refeições e metas nutricionais", group: "Saúde e energia" },
  { key: "leitura", name: "Leitura", description: "Acompanhe seu aprendizado", group: "Aprendizado e equilíbrio" },
  { key: "skill", name: "Habilidades", description: "Pratique competências", group: "Aprendizado e equilíbrio" },
  { key: "paz", name: "Equilíbrio", description: "Registre momentos de pausa e reflexão", group: "Aprendizado e equilíbrio" },
  { key: "fin", name: "Finanças", description: "Entenda entradas, despesas e comportamento financeiro", group: "Vida financeira" },
  { key: "plano", name: "Orçamento", description: "Planeje o uso do dinheiro", group: "Vida financeira" },
  { key: "inv", name: "Investimentos", description: "Organize seus registros de investimentos", group: "Vida financeira" },
  { key: "inicio", name: "Progresso", description: "Veja seu histórico, XP e indicadores atuais", group: "Conta" },
  { key: "config", name: "Configurações", description: "Preferências, conta e backup", group: "Conta" },
];

export const MODULE_GROUPS = ["Organização", "Saúde e energia", "Aprendizado e equilíbrio", "Vida financeira"] as const;

export const MODULE_IMAGES: Record<string, string> = {
  todo: "https://images.pexels.com/photos/5717416/pexels-photo-5717416.jpeg?auto=compress&cs=tinysrgb&w=800",
  habitos: "https://images.pexels.com/photos/8556607/pexels-photo-8556607.jpeg?auto=compress&cs=tinysrgb&w=800",
  treino: "https://images.pexels.com/photos/16576530/pexels-photo-16576530/free-photo-of-man-practicing-with-dumbbell-at-gym.jpeg?auto=compress&cs=tinysrgb&w=800",
  agua: "https://images.pexels.com/photos/33743597/pexels-photo-33743597/free-photo-of-close-up-of-water-pouring-into-glass.png?auto=compress&cs=tinysrgb&w=800",
  dieta: "https://images.pexels.com/photos/6740508/pexels-photo-6740508.jpeg?auto=compress&cs=tinysrgb&w=800",
  leitura: "https://images.pexels.com/photos/8327938/pexels-photo-8327938.jpeg?auto=compress&cs=tinysrgb&w=800",
  skill: "https://images.pexels.com/photos/5717416/pexels-photo-5717416.jpeg?auto=compress&cs=tinysrgb&w=800",
  paz: "https://images.pexels.com/photos/8556607/pexels-photo-8556607.jpeg?auto=compress&cs=tinysrgb&w=800",
  fin: "https://images.pexels.com/photos/6962993/pexels-photo-6962993.jpeg?auto=compress&cs=tinysrgb&w=800",
  plano: "https://images.pexels.com/photos/5717416/pexels-photo-5717416.jpeg?auto=compress&cs=tinysrgb&w=800",
  inv: "https://images.pexels.com/photos/6962993/pexels-photo-6962993.jpeg?auto=compress&cs=tinysrgb&w=800",
  metas: "https://images.pexels.com/photos/5717416/pexels-photo-5717416.jpeg?auto=compress&cs=tinysrgb&w=800",
  inicio: "https://images.pexels.com/photos/5717416/pexels-photo-5717416.jpeg?auto=compress&cs=tinysrgb&w=800",
  config: "https://images.pexels.com/photos/5717416/pexels-photo-5717416.jpeg?auto=compress&cs=tinysrgb&w=800",
};

export function moduleByKey(key: string): ModuleMeta | undefined {
  return MODULES.find((m) => m.key === key);
}

export const EXPENSE_CATEGORIES = ["Alimentação", "Transporte", "Lazer", "Saúde", "Moradia", "Estudos", "Investimento", "Outros"];
export const INCOME_CATEGORIES = ["Salário", "Freelance", "Vendas", "Rendimentos", "Outros"];
export const QUICK_EXPENSE = ["Alimentação", "Transporte", "Lazer", "Saúde", "Moradia", "Estudos", "Outros"];
export const QUICK_INCOME = ["Salário", "Freelance", "Vendas", "Rendimentos", "Outros"];

export const TRAIN_GROUPS = ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Glúteos", "Abdômen", "Antebraço", "Full body"];
export const CARDIO_MODES = ["Esteira", "Corrida", "Bicicleta", "Elíptico", "Escada", "Pular corda", "Caminhada", "Natação"];
export const EXERCISES = [
  "Supino reto",
  "Supino inclinado",
  "Crucifixo",
  "Puxada frontal",
  "Remada curvada",
  "Remada baixa",
  "Barra fixa",
  "Levantamento terra",
  "Desenvolvimento",
  "Elevação lateral",
  "Rosca direta",
  "Rosca martelo",
  "Tríceps pulley",
  "Tríceps testa",
  "Agachamento",
  "Leg press",
  "Cadeira extensora",
  "Mesa flexora",
  "Stiff",
  "Afundo",
  "Panturrilha",
  "Abdominal",
  "Prancha",
];

export const TOGGLEABLE_MODULES: [ModuleKey, string, string][] = [
  ["inicio", "Perfil e relatório", "XP, nível e radar"],
  ["todo", "Tarefas", "Calendário e tarefas do dia"],
  ["habitos", "Hábitos", "Checklist, hábitos e chefões"],
  ["treino", "Treino", ""],
  ["agua", "Água", ""],
  ["dieta", "Dieta", ""],
  ["leitura", "Leitura", ""],
  ["skill", "Habilidades", ""],
  ["paz", "Paz", ""],
  ["fin", "Finanças", ""],
  ["plano", "Orçamento do mês", ""],
  ["inv", "Investimentos", ""],
  ["metas", "Missões", ""],
];
