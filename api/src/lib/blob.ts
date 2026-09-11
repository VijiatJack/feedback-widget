import "server-only";
import { put } from "@vercel/blob";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5MB, igual ao limite do widget original
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg"]);

/**
 * Sobe o screenshot pro Vercel Blob com um caminho aleatório (não
 * enumerável). Precisa ser `access: 'public'` — blobs privados exigem nosso
 * próprio token pra ler, e o GitHub não consegue renderizar a imagem embutida
 * na issue se a URL não for buscável anonimamente. Isso é uma troca
 * deliberada (privacidade por obscuridade do caminho, não um link assinado
 * expirável como o SAS do Azure) — ver README.
 */
export async function uploadScreenshot(file: File): Promise<string> {
  if (file.size > MAX_SCREENSHOT_BYTES) {
    throw new Error("Screenshot maior que 5MB");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`Tipo de imagem não suportado: ${file.type} (use PNG ou JPEG)`);
  }

  const random = crypto.randomUUID();
  const extension = file.type === "image/png" ? "png" : "jpg";
  const blob = await put(`feedback-screenshots/${random}.${extension}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return blob.url;
}
