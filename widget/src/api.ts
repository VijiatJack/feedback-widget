import type { ConfigResponse, Reporter, SubmitResult } from "./types";

export async function fetchConfig(apiBase: string, app: string): Promise<ConfigResponse | null> {
  try {
    const res = await fetch(`${apiBase}/api/config?app=${encodeURIComponent(app)}`, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as ConfigResponse;
  } catch {
    // Falha de rede não deve quebrar o host — só significa "não mostra o botão".
    return null;
  }
}

export interface SubmitParams {
  apiBase: string;
  app: string;
  type: string;
  scope: "in-app" | "process";
  processArea?: string;
  notes: string;
  reporter: Reporter;
  appVersion?: string;
  screenshot?: File | null;
}

export async function submitFeedback(params: SubmitParams): Promise<SubmitResult> {
  const formData = new FormData();
  formData.set("appId", params.app);
  formData.set("type", params.type);
  formData.set("scope", params.scope);
  if (params.processArea) formData.set("processArea", params.processArea);
  formData.set("notes", params.notes);
  formData.set("reporterName", params.reporter.name);
  formData.set("reporterEmail", params.reporter.email);
  if (params.reporter.role) formData.set("reporterRole", params.reporter.role);
  formData.set("pageUrl", window.location.href);
  if (params.appVersion) formData.set("appVersion", params.appVersion);
  formData.set("viewport", `${window.innerWidth}x${window.innerHeight}`);
  formData.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
  if (params.screenshot) formData.set("screenshot", params.screenshot);

  const res = await fetch(`${params.apiBase}/api/feedback`, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as SubmitResult;
}
