import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

type RuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

type InvitePayload = { email?: unknown; role?: unknown };

function getRuntimeEnv(env: unknown): RuntimeEnv {
  const requestEnv = env && typeof env === "object" ? env : undefined;
  const globalEnv = (globalThis as typeof globalThis & { __env__?: unknown }).__env__;
  const processEnv = typeof process !== "undefined" ? process.env : undefined;
  const candidates = [requestEnv, globalEnv, processEnv].filter(
    (candidate): candidate is Record<string, unknown> =>
      Boolean(candidate && typeof candidate === "object"),
  );
  return Object.assign({}, ...candidates) as RuntimeEnv;
}

function getSupabaseConfig(env: RuntimeEnv) {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    url: env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? getSupabaseUrlFromKey(serviceRoleKey),
    anonKey: env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey,
  };
}

function getSupabaseUrlFromKey(serviceRoleKey?: string) {
  if (!serviceRoleKey) return undefined;
  try {
    const payload = serviceRoleKey.split(".")[1];
    if (!payload) return undefined;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded) as { iss?: unknown };
    return typeof parsed.iss === "string" ? parsed.iss : undefined;
  } catch {
    return undefined;
  }
}

function getBearerToken(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice("Bearer ".length) : null;
}

async function requireDeveloper(request: Request, admin: SupabaseClient) {
  const token = getBearerToken(request);
  if (!token) return { error: "Authentication is not configured." } as const;
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return { error: "Your session has expired." } as const;
  const { data: membershipData, error: roleError } = await admin
    .from("archive_memberships")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  const membership = membershipData as { role?: string } | null;
  if (roleError || membership?.role !== "developer")
    return { error: "Developer access is required." } as const;
  return { user: userData.user } as const;
}

async function inviteUser(request: Request, env: RuntimeEnv) {
  const config = getSupabaseConfig(env);
  if (!config.serviceRoleKey || !config.url)
    return json({ error: "Invitation service is not configured yet." }, 503);

  const admin = createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const auth = await requireDeveloper(request, admin);
  if ("error" in auth)
    return json({ error: auth.error }, auth.error === "Developer access is required." ? 403 : 401);

  let payload: InvitePayload;
  try {
    payload = (await request.json()) as InvitePayload;
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const role = payload.role === "editor" ? "editor" : payload.role === "viewer" ? "viewer" : "";
  if (!email || !email.includes("@") || !role)
    return json({ error: "Provide a valid email and viewer/editor role." }, 400);

  const origin = new URL(request.url).origin;
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { archive_role: role, invited_by: auth.user.id },
    redirectTo: `${origin}/login`,
  });
  if (inviteError || !invited.user)
    return json({ error: inviteError?.message ?? "Invitation could not be sent." }, 400);

  const { error: recordError } = await admin.from("archive_invitations").insert({
    email,
    role,
    invited_by: auth.user.id,
    status: "pending",
  });
  if (recordError) return json({ error: recordError.message }, 500);
  return json({ ok: true, email, role });
}

export async function handleApiRequest(request: Request, env: unknown): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/runtime-status" && request.method === "GET") {
    const runtime = getRuntimeEnv(env);
    return json({
      hasSupabaseUrl: Boolean(runtime.SUPABASE_URL ?? runtime.VITE_SUPABASE_URL),
      hasAnonKey: Boolean(runtime.SUPABASE_ANON_KEY ?? runtime.VITE_SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(runtime.SUPABASE_SERVICE_ROLE_KEY),
      visibleBindingNames: Object.keys(runtime).filter((key) => key.includes("SUPABASE")),
    });
  }
  if (url.pathname !== "/api/invitations") return null;
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  return inviteUser(request, getRuntimeEnv(env));
}
