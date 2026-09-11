export interface FeedbackType {
  code: string;
  label: string;
}

export interface ProcessArea {
  code: string;
  label: string;
}

export interface AppConfig {
  /** "owner/repo" — onde as issues são criadas. */
  repo: string;
  /** Allowlist exata de Origin (esquema + host + porta). */
  origins: string[];
  /** Kill switch por app. */
  enabled: boolean;
  feedback_types?: FeedbackType[];
  process_areas?: ProcessArea[];
}

const DEFAULT_FEEDBACK_TYPES: FeedbackType[] = [
  { code: "BUG", label: "Bug — algo está quebrado" },
  { code: "CHANGE_REQUEST", label: "Pedido de mudança" },
  { code: "IDEA", label: "Ideia" },
  { code: "QUESTION", label: "Dúvida" },
];

const DEFAULT_PROCESS_AREAS: ProcessArea[] = [
  { code: "EMAIL", label: "E-mail" },
  { code: "DOCUMENTS", label: "Documentos" },
  { code: "DATA", label: "Dados" },
  { code: "OTHER", label: "Outro" },
];

let cachedRegistry: Record<string, AppConfig> | null = null;

/**
 * Lê e valida FEEDBACK_APPS uma vez por instância de função. Um valor
 * malformado falha fechado (registry vazio = tudo desabilitado) em vez de
 * derrubar a API.
 */
export function getRegistry(): Record<string, AppConfig> {
  if (cachedRegistry) return cachedRegistry;

  const raw = process.env.FEEDBACK_APPS;
  if (!raw) {
    cachedRegistry = {};
    return cachedRegistry;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, AppConfig>;
    cachedRegistry = parsed;
    return parsed;
  } catch (err) {
    console.error("FEEDBACK_APPS está malformado — todos os apps desabilitados", err);
    cachedRegistry = {};
    return cachedRegistry;
  }
}

export function getAppConfig(appId: string): AppConfig | null {
  return getRegistry()[appId] ?? null;
}

export function isOriginAllowed(config: AppConfig, origin: string | null): boolean {
  if (!origin) return false;
  return config.origins.includes(normalizeOrigin(origin));
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

export function effectiveFeedbackTypes(config: AppConfig): FeedbackType[] {
  return config.feedback_types ?? DEFAULT_FEEDBACK_TYPES;
}

export function effectiveProcessAreas(config: AppConfig): ProcessArea[] {
  return config.process_areas ?? DEFAULT_PROCESS_AREAS;
}

export function isValidCode(code: string, options: { code: string }[]): boolean {
  return options.some((o) => o.code === code.toUpperCase());
}
