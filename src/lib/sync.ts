"use client";

import { hasAnyLogs } from "@/domain/records";
import { normalizeAppData, type AppData } from "@/domain/types";
import { createBrowserSupabase, publicAvatarUrl } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";

const LOGIN_FLAG = "forja_sync_login";

export function markLoginSync() {
  sessionStorage.setItem(LOGIN_FLAG, "1");
}

function takeLoginMode(): "login" | "start" {
  if (sessionStorage.getItem(LOGIN_FLAG) === "1") {
    sessionStorage.removeItem(LOGIN_FLAG);
    return "login";
  }
  return "start";
}

export async function currentUserId(): Promise<{ id: string; email: string } | null> {
  const supabase = createBrowserSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email || "" };
}

async function migrateAvatar(data: AppData, userId: string): Promise<AppData> {
  if (!data.av?.startsWith("data:")) return data;
  const supabase = createBrowserSupabase();
  if (!supabase) return data;
  const blob = await (await fetch(data.av)).blob();
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
  if (error) return data;
  return { ...data, av: path, ut: Date.now() };
}

export async function pushCloud(data: AppData): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createBrowserSupabase();
  const user = await currentUserId();
  if (!supabase || !user) return { ok: false, error: "Sem sessão." };
  useAppStore.getState().setSync("sync");
  const payload = await migrateAvatar(data, user.id);
  if (payload.av !== data.av) useAppStore.getState().replaceData(payload);
  const { error } = await supabase.from("app_data").upsert(
    { user_id: user.id, data: payload, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) {
    useAppStore.getState().setSync("err", "Não foi possível sincronizar.");
    return { ok: false, error: error.message };
  }
  useAppStore.getState().setSync("ok");
  return { ok: true };
}

export async function syncCloud(mode?: "login" | "start"): Promise<void> {
  const supabase = createBrowserSupabase();
  const user = await currentUserId();
  if (!supabase || !user) return;
  if (useAppStore.getState().conflict) return;
  const how = mode || takeLoginMode();
  useAppStore.getState().setSync("sync");
  const { data, error } = await supabase.from("app_data").select("data,updated_at").eq("user_id", user.id).maybeSingle();
  if (error) {
    useAppStore.getState().setSync("err", "Não foi possível sincronizar.");
    return;
  }
  const local = useAppStore.getState().data;
  const remote = data?.data ? normalizeAppData(data.data) : null;
  const has = hasAnyLogs(local);
  if (!remote) {
    if (has || how === "login") await pushCloud(local);
    else useAppStore.getState().setSync("ok");
    return;
  }
  const remoteUt = Number(remote.ut) || 0;
  const localUt = Number(local.ut) || 0;
  if (how === "login" && has && remoteUt !== localUt) {
    useAppStore.getState().setConflict(remote);
    useAppStore.getState().setSync("idle");
    return;
  }
  if (remoteUt > localUt) {
    useAppStore.getState().replaceData(remote);
    useAppStore.getState().setSync("ok");
    return;
  }
  if (localUt > remoteUt) {
    await pushCloud(local);
    return;
  }
  useAppStore.getState().setSync("ok");
}

export async function uploadAvatar(file: File): Promise<string | null> {
  if (file.size > 25_000_000) throw new Error("Foto muito grande (máximo 25 MB). Escolha outra.");
  const user = await currentUserId();
  const supabase = createBrowserSupabase();
  if (!user || !supabase) throw new Error("Entre na sua conta para salvar a foto na nuvem.");
  const bitmap = await createImageBitmap(file);
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não consegui abrir essa imagem.");
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("Não consegui abrir essa imagem.");
  const path = `${user.id}/avatar.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw new Error("Não foi possível enviar a foto.");
  useAppStore.getState().update((state) => ({ ...state, av: path }));
  return publicAvatarUrl(path);
}

export { publicAvatarUrl };
