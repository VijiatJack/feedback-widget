import { NextResponse, type NextRequest } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { formatIssueBody, formatIssueTitle } from "@/lib/format-issue";
import { createFeedbackIssue } from "@/lib/github";
import { uploadScreenshot } from "@/lib/blob";
import { effectiveFeedbackTypes, effectiveProcessAreas, getAppConfig, isOriginAllowed, isValidCode } from "@/lib/registry";

function jsonError(status: number, message: string, origin: string | null, allowed: boolean) {
  return NextResponse.json({ error: message }, { status, headers: corsHeaders(origin, allowed) });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const appId = new URL(request.url).searchParams.get("app");
  const config = appId ? getAppConfig(appId) : null;
  const allowed = Boolean(config && isOriginAllowed(config, origin));
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin, allowed) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "corpo inválido (esperado multipart/form-data)", origin, false);
  }

  const appId = String(formData.get("appId") ?? "");
  const config = getAppConfig(appId);
  if (!config) return jsonError(404, `app desconhecido: "${appId}"`, origin, false);

  const allowed = isOriginAllowed(config, origin);
  if (!allowed) return jsonError(403, "origem não autorizada para este app", origin, false);
  if (!config.enabled) return jsonError(403, "feedback desabilitado para este app", origin, true);

  const type = String(formData.get("type") ?? "").toUpperCase();
  const scope = String(formData.get("scope") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const reporterName = String(formData.get("reporterName") ?? "").trim();
  const reporterEmail = String(formData.get("reporterEmail") ?? "").trim();
  const reporterRole = formData.get("reporterRole") ? String(formData.get("reporterRole")) : undefined;
  const pageUrl = formData.get("pageUrl") ? String(formData.get("pageUrl")) : undefined;
  const appVersion = formData.get("appVersion") ? String(formData.get("appVersion")) : undefined;
  const viewport = formData.get("viewport") ? String(formData.get("viewport")) : undefined;
  const timezone = formData.get("timezone") ? String(formData.get("timezone")) : undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  const feedbackTypes = effectiveFeedbackTypes(config);
  const processAreas = effectiveProcessAreas(config);

  if (!notes) return jsonError(422, "notes é obrigatório", origin, true);
  if (!reporterName || !reporterEmail) return jsonError(422, "reporterName e reporterEmail são obrigatórios", origin, true);
  if (!isValidCode(type, feedbackTypes)) return jsonError(422, `type inválido: "${type}"`, origin, true);
  if (scope !== "in-app" && scope !== "process") return jsonError(422, `scope inválido: "${scope}"`, origin, true);
  if (scope === "process" && !isValidCode(String(formData.get("processArea") ?? ""), processAreas)) {
    return jsonError(422, "processArea inválido para scope=process", origin, true);
  }

  let screenshotUrl: string | undefined;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    try {
      screenshotUrl = await uploadScreenshot(screenshot);
    } catch (err) {
      // Screenshot é opcional — uma falha de upload não deve impedir o
      // registro do feedback em si, só perde a imagem.
      console.error("upload de screenshot falhou", err);
    }
  }

  const typeLabel = feedbackTypes.find((t) => t.code === type)?.label ?? type;
  const scopeLabel = scope === "in-app" ? "Nesta tela (in-app)" : "Fora do app (processo)";

  const submission = {
    appId,
    type,
    scope: scope as "in-app" | "process",
    notes,
    reporter: { name: reporterName, email: reporterEmail, role: reporterRole },
    pageUrl,
    appVersion,
    screenshotUrl,
    browser: { userAgent, viewport, timezone },
  };

  const title = formatIssueTitle(submission, typeLabel);
  const body = formatIssueBody(submission, typeLabel, scopeLabel);
  const labels = ["feedback", `type:${type.toLowerCase()}`, `scope:${scope}`, `app:${appId}`];

  try {
    const issue = await createFeedbackIssue({ repo: config.repo, title, body, labels });
    return NextResponse.json(
      { issueNumber: issue.number, issueUrl: issue.url },
      { headers: corsHeaders(origin, allowed) },
    );
  } catch (err) {
    console.error("falha ao criar issue no GitHub", err);
    return jsonError(502, "não foi possível registrar o feedback agora", origin, allowed);
  }
}
