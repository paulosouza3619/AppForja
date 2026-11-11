import { describe, expect, it } from "vitest";
import { defaultAppData } from "@/domain/types";
import { missionStatus, validateNewMission } from "@/domain/missions";
import { bossState } from "@/domain/bosses";
import { parsePortion, calcMacroGoals, calcWaterGoal } from "@/domain/diet";
import { buildPlan, cycleStats, recommendedTools } from "@/domain/cycle";
import { defaultForja } from "@/domain/types";
import { parseBackup, toBackup } from "@/domain/backup";
import { totalXp, levelFromXp } from "@/domain/xp";
import { checklistDue } from "@/domain/checklist";
import { accessAllowed, mapHotmartEvent, hottokMatches } from "@/lib/billing/map-event";

describe("missões", () => {
  it("marca concluída quando o progresso chega a 100", () => {
    expect(missionStatus({ id: 1, d: "2026-01-01", ini: 0, alvo: 10, atual: 10 }, "2026-02-01")).toBe("Concluída");
  });

  it("bloqueia missão ativa duplicada", () => {
    const rows = [{ id: 1, d: "2026-01-01", nome: "Peso", dif: "Média", ini: 90, alvo: 80, atual: 90, prazo: "2026-12-01" }];
    expect(validateNewMission(rows, { id: 2, d: "2026-02-01", nome: "peso", dif: "Média", alvo: 70, ini: 90 }, "2026-02-01")).toMatch(/já existe/i);
  });
});

describe("chefões", () => {
  it("calcula a vida com a mesma fórmula do app antigo", () => {
    const data = defaultAppData();
    data.hc["2026-01-01"] = { 1: true };
    const entry = { id: 1, d: "2026-01-01", bs: "2026-01-01", dur: 30, falhas: 1, dif: "Comum", tipo: "Ruim" };
    const state = bossState(data, entry, "2026-01-01");
    const n = 1;
    const sl = 1;
    const D = 30;
    expect(state.life).toBe(Math.max(0, Math.min(100, Math.round(100 - ((n - sl - sl) * 100) / D))));
    expect(state.st).toBe("on");
  });
});

describe("dieta", () => {
  it("encontra ovo na TACO e escala a porção", () => {
    const item = parsePortion("2 ovos");
    expect(item?.fd).not.toBe(0);
    expect(Math.round(item?.k || 0)).toBeGreaterThan(100);
  });

  it("arredonda a meta de água de 50 em 50", () => {
    expect(calcWaterGoal(70, 35)).toBe(2450);
  });

  it("calcula macros de manutenção", () => {
    const goals = calcMacroGoals({ weight: 80, height: 180, age: 30, activity: 1.55, offset: 0 });
    expect(goals.p).toBe(160);
    expect(goals.kcal).toBeGreaterThan(2000);
  });
});

describe("ciclo", () => {
  it("monta duas ações quando o tempo é de até 20 minutos", () => {
    const plan = buildPlan({ ...defaultForja(), focus: "rotina", time: "10", goal: "Organizar o dia", selectedTools: recommendedTools("rotina") }, "2026-11-11", 10);
    expect(plan.actions).toHaveLength(2);
    expect(plan.onboarded).toBe(true);
    expect(plan.cycleStart).toBe("2026-11-11");
  });

  it("mede a execução do plano", () => {
    const plan = buildPlan({ ...defaultForja(), focus: "rotina", time: "10", selectedTools: ["todo"] }, "2026-11-11", 10);
    plan.done["2026-11-11"] = { [plan.actions[0].id]: true };
    const stats = cycleStats(plan, "2026-11-11");
    expect(stats.today).toBe(1);
    expect(stats.total).toBe(1);
    expect(stats.elapsed).toBe(1);
  });
});

describe("backup e xp", () => {
  it("aceita o envelope antigo e rejeita texto inválido", () => {
    const data = defaultAppData();
    data.d.todo = [{ id: 1, d: "2026-11-11", txt: "Ler" }];
    const raw = JSON.stringify(toBackup(data, "2026-11-11T00:00:00.000Z"));
    expect(parseBackup(raw).d.todo).toHaveLength(1);
    expect(() => parseBackup("{}")).toThrow(/inválido/i);
  });

  it("não deixa o XP ficar negativo", () => {
    expect(totalXp(defaultAppData())).toBe(0);
    expect(levelFromXp(0).lv).toBe(1);
  });
});

describe("checklist", () => {
  it("respeita o dia da semana", () => {
    const entry = { id: 1, d: "2026-11-01", txt: "Mercado", rep: "Semanal", wd: 0 };
    expect(checklistDue(entry, "2026-11-08")).toBe(true);
    expect(checklistDue(entry, "2026-11-09")).toBe(false);
  });
});

describe("hotmart", () => {
  it("libera compra aprovada e revoga reembolso", () => {
    const approved = mapHotmartEvent({ id: "e1", event: "PURCHASE_APPROVED", data: { buyer: { email: "Ana@Forja.dev" }, product: { id: 10 } } }, "10");
    expect(approved.ok && approved.event.status).toBe("active");
    expect(approved.ok && approved.event.email).toBe("ana@forja.dev");
    const refunded = mapHotmartEvent({ id: "e2", event: "PURCHASE_REFUNDED", data: { buyer: { email: "ana@forja.dev" } } });
    expect(refunded.ok && refunded.event.status).toBe("revoked");
  });

  it("trata cancelamento, atraso e produto diferente", () => {
    const canceled = mapHotmartEvent({ id: "e3", event: "SUBSCRIPTION_CANCELLATION", data: { subscriber: { email: "a@b.com" }, subscription: { status: "CANCELED_BY_CUSTOMER" } } });
    expect(canceled.ok && canceled.event.status).toBe("inactive");
    const overdue = mapHotmartEvent({ id: "e4", event: "UPDATE_SUBSCRIPTION_CHARGE_DATE", data: { subscriber: { email: "a@b.com" }, subscription: { status: "OVERDUE" } } });
    expect(overdue.ok && overdue.event.status).toBe("overdue");
    const other = mapHotmartEvent({ id: "e5", event: "PURCHASE_APPROVED", data: { buyer: { email: "a@b.com" }, product: { id: 99 } } }, "10");
    expect(!other.ok && other.ignore).toBe(true);
  });

  it("exige hottok idêntico e só libera active ou overdue quando permitido", () => {
    expect(hottokMatches("segredo", "segredo")).toBe(true);
    expect(hottokMatches("segredo", "outro")).toBe(false);
    expect(hottokMatches(null, "segredo")).toBe(false);
    expect(accessAllowed("active", false)).toBe(true);
    expect(accessAllowed("overdue", true)).toBe(true);
    expect(accessAllowed("overdue", false)).toBe(false);
    expect(accessAllowed("revoked", true)).toBe(false);
  });
});
