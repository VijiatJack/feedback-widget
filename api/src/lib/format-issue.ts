export interface FeedbackSubmission {
  appId: string;
  type: string;
  scope: "in-app" | "process";
  notes: string;
  reporter: { name: string; email: string; role?: string };
  pageUrl?: string;
  appVersion?: string;
  screenshotUrl?: string;
  browser?: { userAgent?: string; viewport?: string; timezone?: string };
}

export function formatIssueTitle(submission: FeedbackSubmission, typeLabel: string): string {
  const trimmed = submission.notes.trim();
  const excerpt = trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
  return `[Feedback] ${typeLabel}: ${excerpt}`;
}

export function formatIssueBody(submission: FeedbackSubmission, typeLabel: string, scopeLabel: string): string {
  const lines: string[] = [];

  lines.push(
    `**Reportado por:** ${submission.reporter.name} (${submission.reporter.email}${
      submission.reporter.role ? `, ${submission.reporter.role}` : ""
    })`,
  );
  if (submission.appVersion) lines.push(`**Versão do app:** ${submission.appVersion}`);
  lines.push(`**Tipo:** ${typeLabel}`);
  lines.push(`**Escopo:** ${scopeLabel}`);
  if (submission.pageUrl) lines.push(`**Página:** ${submission.pageUrl}`);

  lines.push("", "### Notas", submission.notes);

  if (submission.screenshotUrl) {
    lines.push("", "### Screenshot", `![screenshot](${submission.screenshotUrl})`);
  }

  if (submission.browser) {
    lines.push("", "<details><summary>Dados do navegador</summary>", "", "| Campo | Valor |", "|---|---|");
    if (submission.browser.userAgent) lines.push(`| User agent | ${submission.browser.userAgent} |`);
    if (submission.browser.viewport) lines.push(`| Viewport | ${submission.browser.viewport} |`);
    if (submission.browser.timezone) lines.push(`| Timezone | ${submission.browser.timezone} |`);
    lines.push("", "</details>");
  }

  lines.push(
    "",
    `<!-- feedback-widget-metadata: ${JSON.stringify({ appId: submission.appId, type: submission.type, scope: submission.scope })} -->`,
  );

  return lines.join("\n");
}
