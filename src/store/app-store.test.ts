import { describe, expect, it } from "vitest";
import { useAppStore } from "./app-store";

describe("app store", () => {
  it("termina de ler o armazenamento local ao iniciar", () => {
    expect(useAppStore.persist.hasHydrated()).toBe(true);
  });
});
