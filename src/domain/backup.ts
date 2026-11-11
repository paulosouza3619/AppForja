import type { AppData } from "./types";

export interface BackupFile {
  app: "forja";
  v: 1;
  exp: string;
  data: AppData;
}

export function toBackup(data: AppData, exportedAt = new Date().toISOString()): BackupFile {
  return { app: "forja", v: 1, exp: exportedAt, data };
}

export function parseBackup(raw: string): AppData {
  const parsed = JSON.parse(raw) as Partial<BackupFile>;
  if (!parsed?.data || typeof parsed.data.d !== "object") {
    throw new Error("Backup inválido. Confira se copiou o texto inteiro.");
  }
  return parsed.data;
}
