import "server-only";
import { App } from "octokit";

let appInstance: App | null = null;

function getApp(): App {
  if (!appInstance) {
    const appId = process.env.GITHUB_APP_ID;
    // O PEM chega como env var com \n escapado — precisa virar quebra de linha real.
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!appId || !privateKey) {
      throw new Error("GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY não configuradas");
    }
    appInstance = new App({ appId, privateKey });
  }
  return appInstance;
}

export interface CreateIssueParams {
  repo: string; // "owner/repo"
  title: string;
  body: string;
  labels: string[];
}

export interface CreatedIssue {
  number: number;
  url: string;
}

export async function createFeedbackIssue(params: CreateIssueParams): Promise<CreatedIssue> {
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  if (!installationId) throw new Error("GITHUB_APP_INSTALLATION_ID não configurada");

  const octokit = await getApp().getInstallationOctokit(Number(installationId));
  const [owner, repo] = params.repo.split("/");
  if (!owner || !repo) throw new Error(`repo inválido no registry: "${params.repo}" (esperado "owner/repo")`);

  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title: params.title,
    body: params.body,
    labels: params.labels,
  });

  return { number: data.number, url: data.html_url };
}
