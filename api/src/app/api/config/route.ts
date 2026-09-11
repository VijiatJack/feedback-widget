import { NextResponse, type NextRequest } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { effectiveFeedbackTypes, effectiveProcessAreas, getAppConfig, isOriginAllowed } from "@/lib/registry";

/**
 * O widget chama isso antes de renderizar: decide se deve aparecer pra esse
 * app+origem, e quais opções mostrar nos dropdowns.
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const appId = new URL(request.url).searchParams.get("app") ?? "";
  const config = getAppConfig(appId);

  if (!config) {
    return NextResponse.json({ enabled: false }, { headers: corsHeaders(origin, false) });
  }

  const allowed = isOriginAllowed(config, origin);
  if (!allowed) {
    return NextResponse.json({ enabled: false }, { headers: corsHeaders(origin, false) });
  }

  return NextResponse.json(
    {
      enabled: config.enabled,
      feedbackTypes: effectiveFeedbackTypes(config),
      processAreas: effectiveProcessAreas(config),
    },
    { headers: corsHeaders(origin, true) },
  );
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const appId = new URL(request.url).searchParams.get("app");
  const config = appId ? getAppConfig(appId) : null;
  const allowed = Boolean(config && isOriginAllowed(config, origin));
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin, allowed) });
}
