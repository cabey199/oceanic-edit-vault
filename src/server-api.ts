import { createClient } from "@supabase/supabase-js";

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
  return (env ?? {}) as RuntimeEnv;
}

function getSupabaseConfig(env: RuntimeEnv) {
  return {
    url: env.SUPABASE_URL ?? env.VITE_SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function getBearerToken(request: Request) {
  const value = request.headers.get("authorization") ?? "";
  return value.startsWith("Bearer ") ? value.slice("Bearer ".length) : null;
}

async function requireDeveloper(request: Request, env: RuntimeEnv) {
  const token = getBearerToken(request);
  const { url, anonKey } = getSupabaseConfig(env);
  if (!token || !url || !anonKey) return { error: "Authentication is not configured." } as const;

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) return { error: "Your session has expired." } as const;

  const { data: isDeveloper, error: roleError } = await client.rpc("is_archive_member", {
    required_role: "developer",
  });
  if (roleError || isDeveloper !== true) return { error: "Developer access is required." } as const;
  return { client, user: userData.user } as const;
}

async function inviteUser(request: Request, env: RuntimeEnv) {
  const config = getSupabaseConfig(env);
  if (!config.serviceRoleKey || !config.url)
    return json({ error: "Invitation service is not configured yet." }, 503);

  const auth = await requireDeveloper(request, env);
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

  const admin = createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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
  if (url.pathname !== "/api/invitations") return null;
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  return inviteUser(request, getRuntimeEnv(env));
}
