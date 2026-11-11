"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultAppData, normalizeAppData, STORAGE_KEY, type AppData } from "@/domain/types";

export type SyncStatus = "idle" | "pend" | "sync" | "ok" | "err";

interface AppStore {
  data: AppData;
  hydrated: boolean;
  conflict: AppData | null;
  syncStatus: SyncStatus;
  syncError: string;
  setHydrated: (value: boolean) => void;
  setSync: (status: SyncStatus, error?: string) => void;
  setConflict: (remote: AppData | null) => void;
  replaceData: (data: AppData) => void;
  update: (recipe: (data: AppData) => AppData) => void;
}

const memory = new Map<string, string>();

function browserStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: (name: string) => memory.get(name) ?? null,
      setItem: (name: string, value: string) => void memory.set(name, value),
      removeItem: (name: string) => void memory.delete(name),
    };
  }
  return {
    getItem(name: string) {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as { state?: { data?: unknown } } | AppData;
        const data = parsed && typeof parsed === "object" && "state" in parsed ? parsed.state?.data : parsed;
        return JSON.stringify({ state: { data: normalizeAppData(data) }, version: 0 });
      } catch {
        return null;
      }
    },
    setItem(name: string, value: string) {
      const parsed = JSON.parse(value) as { state?: { data?: AppData } };
      const data = parsed.state?.data ?? defaultAppData();
      localStorage.setItem(name, JSON.stringify(data));
    },
    removeItem(name: string) {
      localStorage.removeItem(name);
    },
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      data: defaultAppData(),
      hydrated: false,
      conflict: null,
      syncStatus: "idle",
      syncError: "",
      setHydrated: (hydrated) => set({ hydrated }),
      setSync: (syncStatus, syncError = "") => set({ syncStatus, syncError }),
      setConflict: (conflict) => set({ conflict }),
      replaceData: (data) => set({ data: normalizeAppData(data), conflict: null }),
      update: (recipe) =>
        set((state) => ({
          data: { ...recipe(state.data), ut: Date.now() },
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(browserStorage),
      partialize: (state) => ({ data: state.data }) as unknown as AppStore,
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
    },
  ),
);
