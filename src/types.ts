export interface Reporter {
  name: string;
  email: string;
  role?: string;
}

export interface FeedbackTypeOption {
  code: string;
  label: string;
}

export interface ProcessAreaOption {
  code: string;
  label: string;
}

export interface FeedbackWidgetProps {
  /** Chave do app no registry da API — decide o repo alvo e as opções dos dropdowns. */
  app: string;
  /** URL base da API do feedback-widget. Vazio/undefined = o widget não renderiza nada. */
  apiBase?: string;
  /** Identidade do usuário logado no host. `null`/undefined = o widget não renderiza nada. */
  user?: Reporter | null;
  /** Cor de destaque (CSS color) — sobrescreve o acento padrão. */
  accentColor?: string;
  /** Versão do host app (ex: `import.meta.env.VITE_APP_VERSION`) — carimbada na issue. */
  appVersion?: string;
}

export interface ConfigResponse {
  enabled: boolean;
  feedbackTypes?: FeedbackTypeOption[];
  processAreas?: ProcessAreaOption[];
}

export interface SubmitResult {
  issueNumber: number;
  issueUrl: string;
}
