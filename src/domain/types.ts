export interface GoalEntry {
  id: number;
  d: string;
  nome?: string;
  termo?: string;
  prazo?: string;
  done?: boolean;
  txt?: string;
}

export interface HabitBattle {
  d: string;
  res: "win" | "lose" | string;
  xp: number;
}

export interface LogEntry {
  id: number;
  d: string;
  tipo?: string;
  nome?: string;
  min?: number;
  obs?: string;
  ml?: number;
  kcal?: number;
  p?: number;
  c?: number;
  f?: number;
  dif?: string;
  area?: string;
  termo?: string;
  ini?: number;
  alvo?: number;
  atual?: number;
  un?: string;
  prazo?: string;
  cat?: string;
  desc?: string;
  valor?: number;
  rec?: string;
  m?: string;
  ativo?: string;
  livro?: string;
  pgs?: number;
  total?: number;
  skill?: string;
  nivel?: number;
  nota?: string;
  txt?: string;
  done?: boolean;
  rep?: "Diária" | "Semanal" | "Mensal" | string;
  wd?: number;
  dm?: number;
  ico?: string;
  grupo?: string;
  series?: number;
  reps?: number;
  carga?: number;
  dist?: number;
  quick?: number;
  bat?: HabitBattle[];
  bs?: string;
  dur?: number;
  falhas?: number | string;
  foto?: string;
}

export interface ForjaAction {
  id: string;
  title: string;
  area: string;
  duration: string;
  module: string;
  frequency: string;
}

export interface ForjaReview {
  good?: string;
  block?: string;
  change?: string;
}

export interface ForjaState {
  onboarded: boolean;
  step: number;
  reason: string;
  focus: string;
  priorities: string[];
  selectedTools: string[];
  time: string;
  cycleStart: string;
  cycleDays: number;
  cycleTitle: string;
  goal?: string;
  actions: ForjaAction[];
  done: Record<string, Record<string, boolean>>;
  reviewAt: string;
  notes: string;
  view?: string;
  module?: string;
  review?: ForjaReview | null;
}

export interface Goals {
  water: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  pages: number;
}

export interface AppData {
  d: Record<string, LogEntry[]>;
  g: Goals;
  hc: Record<string, Record<string, boolean>>;
  cc: Record<string, Record<string, boolean>>;
  off: Record<string, boolean>;
  ut?: number;
  av?: string;
  lb?: string;
  forja?: ForjaState;
  ob?: { sk?: number; done?: number; area?: string; bonus?: number };
  ob2?: { x?: number };
  tpl?: { id: number; nome: string; it: LogEntry[] }[];
}

export const STORAGE_KEY = "disc1";

export const DEFAULT_GOALS: Goals = {
  water: 2500,
  kcal: 2500,
  p: 150,
  c: 280,
  f: 70,
  pages: 10,
};

export function defaultForja(): ForjaState {
  return {
    onboarded: false,
    step: 0,
    reason: "",
    focus: "",
    priorities: [],
    selectedTools: [],
    time: "",
    cycleStart: "",
    cycleDays: 30,
    cycleTitle: "",
    actions: [],
    done: {},
    reviewAt: "",
    notes: "",
    view: "hoje",
  };
}

export function defaultAppData(): AppData {
  return {
    d: {},
    g: { ...DEFAULT_GOALS },
    hc: {},
    cc: {},
    off: {},
  };
}

export function normalizeAppData(raw: unknown): AppData {
  const base = defaultAppData();
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Partial<AppData>;
  return {
    ...base,
    ...src,
    d: src.d && typeof src.d === "object" ? src.d : {},
    g: { ...DEFAULT_GOALS, ...(src.g || {}) },
    hc: src.hc && typeof src.hc === "object" ? src.hc : {},
    cc: src.cc && typeof src.cc === "object" ? src.cc : {},
    off: src.off && typeof src.off === "object" ? src.off : {},
    forja: src.forja ? { ...defaultForja(), ...src.forja } : undefined,
  };
}
