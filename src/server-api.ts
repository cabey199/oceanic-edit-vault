import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BucketObject = {
  body: ReadableStream<Uint8Array> | null;
  httpMetadata?: { contentType?: string; contentDisposition?: string };
  size?: number;
  etag?: string;
};

type MediaBucket = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream<Uint8Array>,
    options?: { httpMetadata?: Record<string, string> },
  ) => Promise<unknown>;
  get: (
    key: string,
    options?: { range?: { offset: number; length?: number } },
  ) => Promise<BucketObject | null>;
  delete: (key: string | string[]) => Promise<void>;
};

type RuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  MEDIA_BUCKET?: MediaBucket;
  ARCHIVE_STORAGE_LIMIT_BYTES?: string;
};

type InvitePayload = { email?: unknown; role?: unknown };
type ArchiveRow = {
  id: string;
  title: string;
  note: string | null;
  section_name: string | null;
  format: "9:16" | "16:9";
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  favorite: boolean;
  created_at: string;
  archive_media_objects: Array<{
    kind: "original" | "playback" | "thumbnail";
    object_key: string;
    byte_size: number;
    content_type: string;
  }>;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });

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

function createAdmin(env: RuntimeEnv) {
  const config = getSupabaseConfig(env);
  if (!config.serviceRoleKey || !config.url) return null;
  return createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireUser(request: Request, admin: SupabaseClient) {
  const token = getBearerToken(request);
  if (!token) return { error: "Your session has expired." } as const;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { error: "Your session has expired." } as const;
  return { user: data.user } as const;
}

async function requireEditor(request: Request, admin: SupabaseClient) {
  const auth = await requireUser(request, admin);
  if ("error" in auth) return auth;
  const { data: membership, error } = await admin
    .from("archive_memberships")
    .select("role")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error || !membership || !["editor", "developer"].includes(membership.role))
    return { error: "Editor access is required." } as const;
  return auth;
}

async function requireViewer(request: Request, admin: SupabaseClient) {
  const auth = await requireUser(request, admin);
  if ("error" in auth) return auth;
  const { data: membership, error } = await admin
    .from("archive_memberships")
    .select("role")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error || !membership || !["viewer", "editor", "developer"].includes(membership.role))
    return { error: "Archive access is required." } as const;
  return auth;
}

async function requireMediaViewer(request: Request, admin: SupabaseClient) {
  const token = getBearerToken(request) ?? new URL(request.url).searchParams.get("access_token");
  if (!token) return { error: "Your session has expired." } as const;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { error: "Your session has expired." } as const;
  const { data: membership, error: membershipError } = await admin
    .from("archive_memberships")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (
    membershipError ||
    !membership ||
    !["viewer", "editor", "developer"].includes(membership.role)
  )
    return { error: "Archive access is required." } as const;
  return { user: data.user } as const;
}

async function requireDeveloper(request: Request, admin: SupabaseClient) {
  const auth = await requireUser(request, admin);
  if ("error" in auth) return auth;
  const { data: membership, error } = await admin
    .from("archive_memberships")
    .select("role")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error || membership?.role !== "developer")
    return { error: "Developer access is required." } as const;
  return auth;
}

function safeStem(name: string) {
  return (
    name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled-edit"
  );
}

function formatFor(width: number, height: number): "9:16" | "16:9" {
  return height > width ? "9:16" : "16:9";
}

async function listArchiveItems(request: Request, env: RuntimeEnv) {
  const admin = createAdmin(env);
  if (!admin) return json({ error: "Archive service is not configured yet." }, 503);
  const auth = await requireViewer(request, admin);
  if ("error" in auth) return json({ error: auth.error }, 401);
  const primaryResult = await admin
    .from("archive_items")
    .select(
      "id,title,note,section_name,format,duration_seconds,width,height,favorite,created_at,archive_media_objects(kind,object_key,byte_size,content_type)",
    )
    .eq("archived", false)
    .in("status", ["ready", "processing"])
    .order("created_at", { ascending: false });

  // Keep deployments usable while the section migration is being applied.
  // Supabase returns a missing-column error when the new schema is not live yet.
  let archiveData = primaryResult.data;
  let archiveError = primaryResult.error;
  if (archiveError && /section_name|column/i.test(archiveError.message)) {
    const legacyResult = await admin
      .from("archive_items")
      .select(
        "id,title,note,format,duration_seconds,width,height,favorite,created_at,archive_media_objects(kind,object_key,byte_size,content_type)",
      )
      .eq("archived", false)
      .in("status", ["ready", "processing"])
      .order("created_at", { ascending: false });
    archiveData = (legacyResult.data ?? []).map((item) => ({ ...item, section_name: null }));
    archiveError = legacyResult.error;
  }
  if (archiveError) return json({ error: archiveError.message }, 500);

  const items = ((archiveData ?? []) as ArchiveRow[]).map((item) => ({
    id: item.id,
    title: item.title,
    note: item.note ?? "Original-quality archive edit",
    section: item.section_name ?? "General Vault",
    format: item.format,
    duration: item.duration_seconds ?? 0,
    width: item.width,
    height: item.height,
    favorite: item.favorite,
    createdAt: item.created_at,
    size: item.archive_media_objects.find((media) => media.kind === "original")?.byte_size ?? 0,
    thumbnailUrl: `${new URL(request.url).origin}/api/archive-items/${item.id}/media/thumbnail`,
    mediaUrl: `${new URL(request.url).origin}/api/archive-items/${item.id}/media/${item.archive_media_objects.some((media) => media.kind === "playback") ? "playback" : "original"}`,
    downloadUrl: `${new URL(request.url).origin}/api/archive-items/${item.id}/media/original?download=1`,
  }));
  return json({ items });
}

async function getArchiveStats(request: Request, env: RuntimeEnv) {
  const admin = createAdmin(env);
  if (!admin) return json({ error: "Archive service is not configured yet." }, 503);
  const auth = await requireViewer(request, admin);
  if ("error" in auth) return json({ error: auth.error }, 401);
  const { data, error } = await admin
    .from("archive_media_objects")
    .select("kind,provider,byte_size,archive_items!inner(owner_id,status,archived)")
    .eq("archive_items.owner_id", auth.user.id)
    .eq("archive_items.archived", false)
    .neq("archive_items.status", "failed");
  if (error) return json({ error: error.message }, 500);

  const rows = (data ?? []) as Array<{
    kind: "original" | "playback" | "thumbnail";
    provider: "r2" | "b2";
    byte_size: number;
  }>;
  const stats = rows.reduce(
    (result, row) => {
      const bytes = Number(row.byte_size) || 0;
      result.totalBytes += bytes;
      result[`${row.provider}Bytes`] += bytes;
      if (row.kind === "thumbnail") result.thumbnailBytes += bytes;
      else if (row.kind === "playback") result.playbackBytes += bytes;
      else result.originalBytes += bytes;
      return result;
    },
    {
      totalBytes: 0,
      originalBytes: 0,
      playbackBytes: 0,
      thumbnailBytes: 0,
      r2Bytes: 0,
      b2Bytes: 0,
    },
  );
  const { count, error: countError } = await admin
    .from("archive_items")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", auth.user.id)
    .eq("archived", false)
    .neq("status", "failed");
  if (countError) return json({ error: countError.message }, 500);
  const storageLimitBytes = Number(env.ARCHIVE_STORAGE_LIMIT_BYTES) || 200 * 1000 * 1000 * 1000;
  return json({
    ...stats,
    itemCount: count ?? 0,
    storageLimitBytes,
    remainingBytes: storageLimitBytes ? Math.max(0, storageLimitBytes - stats.totalBytes) : null,
  });
}

async function createArchiveItem(request: Request, env: RuntimeEnv) {
  const admin = createAdmin(env);
  const bucket = env.MEDIA_BUCKET;
  if (!admin || !bucket) return json({ error: "R2 media storage is not configured yet." }, 503);
  const auth = await requireEditor(request, admin);
  if ("error" in auth) return json({ error: auth.error }, 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Upload body must be multipart form data." }, 400);
  }
  const file = form.get("file");
  const thumbnail = form.get("thumbnail");
  const title = typeof form.get("title") === "string" ? String(form.get("title")).trim() : "";
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  const duration = Number(form.get("duration"));
  const section =
    typeof form.get("section") === "string" ? String(form.get("section")).trim() : "General Vault";
  const acceptedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
  const maxVideoBytes = 2 * 1024 * 1024 * 1024;
  const maxThumbnailBytes = 10 * 1024 * 1024;
  if (!(file instanceof File) || !(thumbnail instanceof File) || !title || !width || !height)
    return json(
      { error: "Original video, thumbnail, title, width, and height are required." },
      400,
    );
  if (title.length > 160 || section.length > 80)
    return json({ error: "Title or vault section is too long." }, 400);
  if (!acceptedVideoTypes.has(file.type) || file.size <= 0 || file.size > maxVideoBytes)
    return json({ error: "Use an MP4, MOV, or WEBM video under 2 GB." }, 400);
  if (thumbnail.size <= 0 || thumbnail.size > maxThumbnailBytes)
    return json({ error: "The generated thumbnail is too large." }, 400);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 20000 ||
    height > 20000 ||
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration > 24 * 60 * 60
  )
    return json({ error: "Video metadata is invalid." }, 400);

  const baseItem = {
    owner_id: auth.user.id,
    title,
    note: "Original-quality archive edit",
    format: formatFor(width, height),
    duration_seconds: Number.isFinite(duration) ? duration : null,
    width,
    height,
    codec: file.type || "source",
    status: "processing",
  };
  let itemInsert = await admin
    .from("archive_items")
    .insert({ ...baseItem, section_name: section || "General Vault" })
    .select("id")
    .single();
  if (itemInsert.error && /section_name|column/i.test(itemInsert.error.message)) {
    itemInsert = await admin.from("archive_items").insert(baseItem).select("id").single();
  }
  if (itemInsert.error || !itemInsert.data)
    return json({ error: itemInsert.error?.message ?? "Could not create archive item." }, 500);

  const id = itemInsert.data.id as string;
  const stem = safeStem(file.name);
  const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const mediaKey = `archive/${auth.user.id}/${id}/original/${stem}.${extension}`;
  const thumbnailKey = `archive/${auth.user.id}/${id}/thumbnail/${safeStem(thumbnail.name)}.jpg`;
  try {
    await bucket.put(mediaKey, await file.arrayBuffer(), {
      httpMetadata: {
        "content-type": file.type || "video/mp4",
        "content-disposition": `inline; filename="${stem}.${extension}"`,
      },
    });
    await bucket.put(thumbnailKey, await thumbnail.arrayBuffer(), {
      httpMetadata: {
        "content-type": thumbnail.type || "image/jpeg",
        "content-disposition": "inline",
      },
    });
    const { error: mediaError } = await admin.from("archive_media_objects").insert([
      {
        archive_item_id: id,
        provider: "r2",
        kind: "original",
        object_key: mediaKey,
        byte_size: file.size,
        content_type: file.type || "video/mp4",
      },
      {
        archive_item_id: id,
        provider: "r2",
        kind: "thumbnail",
        object_key: thumbnailKey,
        byte_size: thumbnail.size,
        content_type: thumbnail.type || "image/jpeg",
      },
    ]);
    if (mediaError) throw new Error(mediaError.message);
    const { error: readyError } = await admin
      .from("archive_items")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (readyError) throw new Error(readyError.message);
    return json({ ok: true, id });
  } catch (error) {
    await bucket.delete([mediaKey, thumbnailKey]);
    await admin.from("archive_items").update({ status: "failed" }).eq("id", id);
    return json({ error: error instanceof Error ? error.message : "Upload failed." }, 500);
  }
}

async function deleteArchiveItem(request: Request, env: RuntimeEnv, itemId: string) {
  const admin = createAdmin(env);
  const bucket = env.MEDIA_BUCKET;
  if (!admin || !bucket) return json({ error: "R2 media storage is not configured yet." }, 503);
  const auth = await requireEditor(request, admin);
  if ("error" in auth) return json({ error: auth.error }, 403);
  const { data: item, error } = await admin
    .from("archive_items")
    .select("owner_id,archive_media_objects(object_key)")
    .eq("id", itemId)
    .maybeSingle();
  if (error || !item) return json({ error: "Archive item was not found." }, 404);
  if (item.owner_id !== auth.user.id)
    return json({ error: "You can only delete your own uploads." }, 403);
  const objects = (item.archive_media_objects ?? []) as Array<{ object_key: string }>;
  try {
    if (objects.length) await bucket.delete(objects.map((object) => object.object_key));
    const { error: deleteError } = await admin.from("archive_items").delete().eq("id", itemId);
    if (deleteError) return json({ error: deleteError.message }, 500);
    return json({ ok: true, id: itemId });
  } catch (deleteError) {
    return json(
      {
        error: deleteError instanceof Error ? deleteError.message : "Upload could not be deleted.",
      },
      500,
    );
  }
}

async function serveMedia(
  request: Request,
  env: RuntimeEnv,
  itemId: string,
  kind: "original" | "playback" | "thumbnail",
) {
  const admin = createAdmin(env);
  const bucket = env.MEDIA_BUCKET;
  if (!admin || !bucket) return json({ error: "R2 media storage is not configured yet." }, 503);
  const auth = await requireMediaViewer(request, admin);
  if ("error" in auth) return json({ error: auth.error }, 401);
  const { data: item, error } = await admin
    .from("archive_items")
    .select("owner_id,archive_media_objects!inner(kind,object_key,content_type,byte_size)")
    .eq("id", itemId)
    .eq("archive_media_objects.kind", kind)
    .maybeSingle();
  if (error || !item) return json({ error: "Archive item was not found." }, 404);
  const media = (
    item.archive_media_objects as Array<{
      object_key: string;
      content_type: string;
      byte_size: number;
    }>
  )[0];
  if (!media) return json({ error: "Media file was not found." }, 404);
  const rangeHeader = request.headers.get("range");
  let totalSize = Number(media.byte_size) || 0;
  // Older rows may not have a recorded size. Keep a metadata fallback for them,
  // but never make the normal playback path download the full object first.
  if (!totalSize) {
    const metadataObject = await bucket.get(media.object_key);
    totalSize = metadataObject?.size ?? 0;
  }
  if (!totalSize) return json({ error: "Stored media file was not found." }, 404);
  let range: { offset: number; length: number } | undefined;
  let rangeStart = 0;
  let rangeEnd = totalSize - 1;
  if (rangeHeader) {
    const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
    if (!match || (!match[1] && !match[2]))
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${totalSize}` },
      });
    if (match[1]) {
      rangeStart = Number(match[1]);
      rangeEnd = match[2] ? Number(match[2]) : totalSize - 1;
    } else {
      const suffixLength = Math.min(Number(match[2]), totalSize);
      rangeStart = totalSize - suffixLength;
    }
    if (rangeStart < 0 || rangeStart >= totalSize || rangeEnd < rangeStart)
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${totalSize}` },
      });
    rangeEnd = Math.min(rangeEnd, totalSize - 1);
    range = { offset: rangeStart, length: rangeEnd - rangeStart + 1 };
  }
  const object = await bucket.get(media.object_key, range ? { range } : undefined);
  if (!object?.body) return json({ error: "Stored media file was not found." }, 404);
  const headers = new Headers({
    "content-type": media.content_type,
    "cache-control": "private, no-store",
    "referrer-policy": "no-referrer",
    "accept-ranges": "bytes",
    "content-length": String(range ? rangeEnd - rangeStart + 1 : totalSize),
  });
  if (range) headers.set("content-range", `bytes ${rangeStart}-${rangeEnd}/${totalSize}`);
  if (new URL(request.url).searchParams.get("download") === "1") {
    headers.set("content-disposition", `attachment; filename="${itemId}.mp4"`);
  }
  return new Response(object.body, { status: range ? 206 : 200, headers });
}

async function updateFavorite(request: Request, env: RuntimeEnv, itemId: string) {
  const admin = createAdmin(env);
  if (!admin) return json({ error: "Archive service is not configured yet." }, 503);
  const auth = await requireEditor(request, admin);
  if ("error" in auth) return json({ error: auth.error }, 403);
  let payload: { favorite?: unknown };
  try {
    payload = (await request.json()) as { favorite?: unknown };
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (typeof payload.favorite !== "boolean")
    return json({ error: "Favorite must be true or false." }, 400);
  const { data, error } = await admin
    .from("archive_items")
    .update({ favorite: payload.favorite, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("owner_id", auth.user.id)
    .select("id,favorite")
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Archive item was not found." }, 404);
  return json({ ok: true, favorite: data.favorite });
}

async function inviteUser(request: Request, env: RuntimeEnv) {
  const config = getSupabaseConfig(env);
  const admin = createAdmin(env);
  if (!admin || !config.serviceRoleKey || !config.url)
    return json({ error: "Invitation service is not configured yet." }, 503);
  const auth = await requireDeveloper(request, admin);
  if ("error" in auth) return json({ error: auth.error }, 403);
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
  const runtime = getRuntimeEnv(env);
  const url = new URL(request.url);
  if (url.pathname === "/api/runtime-status" && request.method === "GET") {
    return json({ ok: true });
  }
  if (url.pathname === "/api/invitations") {
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    return inviteUser(request, runtime);
  }
  if (url.pathname === "/api/archive-items") {
    if (request.method === "GET") return listArchiveItems(request, runtime);
    if (request.method === "POST") return createArchiveItem(request, runtime);
    return json({ error: "Method not allowed." }, 405);
  }
  const itemDeleteMatch = url.pathname.match(/^\/api\/archive-items\/([^/]+)$/);
  const itemDeleteId = itemDeleteMatch?.[1];
  if (itemDeleteId && request.method === "DELETE")
    return deleteArchiveItem(request, runtime, itemDeleteId);
  if (itemDeleteId && request.method === "PATCH")
    return updateFavorite(request, runtime, itemDeleteId);
  if (url.pathname === "/api/archive-stats" && request.method === "GET")
    return getArchiveStats(request, runtime);
  const mediaMatch = url.pathname.match(
    /^\/api\/archive-items\/([^/]+)\/media\/(original|playback|thumbnail)$/,
  );
  const mediaItemId = mediaMatch?.[1];
  const mediaKind = mediaMatch?.[2];
  if (mediaItemId && mediaKind && request.method === "GET")
    return serveMedia(
      request,
      runtime,
      mediaItemId,
      mediaKind as "original" | "playback" | "thumbnail",
    );
  return null;
}
