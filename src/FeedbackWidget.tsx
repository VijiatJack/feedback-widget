import { useEffect, useRef, useState } from "react";
import { fetchConfig, submitFeedback } from "./api";
import type { ConfigResponse, FeedbackWidgetProps, SubmitResult } from "./types";

type PanelState = "closed" | "open" | "submitting" | "success" | "error";

export function FeedbackWidget(props: FeedbackWidgetProps) {
  const { app, apiBase, user, accentColor, appVersion } = props;

  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [panel, setPanel] = useState<PanelState>("closed");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const [type, setType] = useState("");
  const [scope, setScope] = useState<"in-app" | "process">("in-app");
  const [processArea, setProcessArea] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shouldRender = Boolean(apiBase && user);

  useEffect(() => {
    if (!shouldRender || !apiBase) return;
    let cancelled = false;
    fetchConfig(apiBase, app).then((cfg) => {
      if (!cancelled) setConfig(cfg);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldRender, apiBase, app]);

  useEffect(() => {
    if (config?.feedbackTypes?.length) setType(config.feedbackTypes[0].code);
  }, [config]);

  useEffect(() => {
    if (config?.processAreas?.length) setProcessArea(config.processAreas[0].code);
  }, [config]);

  if (!shouldRender || !config?.enabled) return null;

  function resetForm() {
    setType(config?.feedbackTypes?.[0]?.code ?? "");
    setScope("in-app");
    setProcessArea(config?.processAreas?.[0]?.code ?? "");
    setNotes("");
    setScreenshot(null);
    setScreenshotPreview(null);
  }

  function handleFile(file: File | null) {
    setScreenshot(file);
    setScreenshotPreview(file ? URL.createObjectURL(file) : null);
  }

  function handlePaste(event: React.ClipboardEvent) {
    const item = Array.from(event.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (file) handleFile(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !apiBase || !notes.trim()) return;

    setPanel("submitting");
    try {
      const res = await submitFeedback({
        apiBase,
        app,
        type,
        scope,
        processArea: scope === "process" ? processArea : undefined,
        notes: notes.trim(),
        reporter: user,
        appVersion,
        screenshot,
      });
      setResult(res);
      setPanel("success");
      resetForm();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Não foi possível enviar o feedback.");
      setPanel("error");
    }
  }

  const style = accentColor ? ({ "--fw-accent": accentColor } as React.CSSProperties) : undefined;

  return (
    <div className="fw-root" style={style}>
      {panel === "closed" && (
        <button type="button" className="fw-trigger" onClick={() => setPanel("open")}>
          Feedback
        </button>
      )}

      {panel !== "closed" && (
        <div className="fw-panel" role="dialog" aria-label="Enviar feedback">
          <div className="fw-panel-header">
            <span>Enviar feedback</span>
            <button
              type="button"
              className="fw-close"
              aria-label="Fechar"
              onClick={() => {
                setPanel("closed");
                resetForm();
              }}
            >
              ×
            </button>
          </div>

          {panel === "success" && result && (
            <div className="fw-success">
              <p>Feedback registrado!</p>
              <a href={result.issueUrl} target="_blank" rel="noopener noreferrer">
                Ver issue #{result.issueNumber}
              </a>
              <button type="button" className="fw-submit" onClick={() => setPanel("closed")}>
                Fechar
              </button>
            </div>
          )}

          {(panel === "open" || panel === "submitting" || panel === "error") && (
            <form className="fw-form" onSubmit={handleSubmit} onPaste={handlePaste}>
              <label className="fw-field">
                <span>Tipo</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {config.feedbackTypes?.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fw-field">
                <span>Onde</span>
                <select value={scope} onChange={(e) => setScope(e.target.value as "in-app" | "process")}>
                  <option value="in-app">Nesta tela</option>
                  <option value="process">Fora do app</option>
                </select>
              </label>

              {scope === "process" && (
                <label className="fw-field">
                  <span>Área</span>
                  <select value={processArea} onChange={(e) => setProcessArea(e.target.value)}>
                    {config.processAreas?.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="fw-field">
                <span>O que aconteceu?</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva o problema, ideia ou dúvida — cole um print com Ctrl+V se quiser"
                  rows={4}
                  required
                />
              </label>

              <div className="fw-field">
                <span>Screenshot (opcional)</span>
                {screenshotPreview ? (
                  <div className="fw-screenshot-preview">
                    <img src={screenshotPreview} alt="Prévia do screenshot" />
                    <button type="button" onClick={() => handleFile(null)}>
                      Remover
                    </button>
                  </div>
                ) : (
                  <button type="button" className="fw-upload" onClick={() => fileInputRef.current?.click()}>
                    Anexar imagem
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="fw-hidden-input"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {panel === "error" && <p className="fw-error">{errorMessage}</p>}

              <button type="submit" className="fw-submit" disabled={panel === "submitting" || !notes.trim()}>
                {panel === "submitting" ? "Enviando…" : "Enviar feedback"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
