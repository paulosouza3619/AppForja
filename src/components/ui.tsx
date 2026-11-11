"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastFn = (text: string, ok?: boolean, undo?: () => void) => void;
const ToastContext = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; text: string; ok: boolean; undo?: () => void }[]>([]);
  const push = useCallback<ToastFn>((text, ok = false, undo) => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, text, ok, undo }]);
    window.setTimeout(() => setItems((list) => list.filter((item) => item.id !== id)), undo ? 6000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-lg flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} role="status" className={`pointer-events-auto flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-center text-white ${item.ok ? "bg-ok" : "bg-danger"}`}>
            <span>{item.text}</span>
            {item.undo ? (
              <button type="button" className="rounded-lg bg-white/25 px-3 py-1 font-bold" onClick={() => { item.undo?.(); setItems((list) => list.filter((row) => row.id !== item.id)); }}>
                Desfazer
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-gradient-to-br from-[#1a1f25] to-[#13171c] p-4 shadow-card ${className}`}>
      {title ? <h2 className="mb-3 text-base font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Button({
  children,
  onClick,
  tone = "primary",
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "quiet" | "danger";
  type?: "button" | "submit";
  className?: string;
}) {
  const tones = {
    primary: "bg-gradient-to-br from-[#ff9138] to-[#e96613] text-[#17191c] shadow-ember",
    quiet: "border border-[#3a424b] bg-[#252b32] text-[#e9edf0]",
    danger: "bg-danger text-white",
  };
  return (
    <button type={type} onClick={onClick} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-bold ${tones[tone]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-2 block text-sm">
      <span className="mb-1 block font-semibold">{label}</span>
      {children}
    </label>
  );
}

export const controlClass = "mb-2 w-full rounded-lg border border-[#39414a] bg-[#101419] px-3 py-3 text-ink";

export function Bar({ value, tone = "ember" }: { value: number; tone?: "ember" | "ok" | "danger" }) {
  const width = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const color = tone === "ok" ? "bg-ok" : tone === "danger" ? "bg-danger" : "bg-gradient-to-r from-[#e96b19] to-[#ffad55]";
  return (
    <div className="my-1 h-2 overflow-hidden rounded-md bg-line" aria-hidden>
      <i className={`block h-full rounded-md ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export function WeekChart({ points, goal }: { points: { l: string; v: number }[]; goal?: number }) {
  const max = Math.max(goal || 0, ...points.map((p) => p.v), 1);
  return (
    <svg viewBox="0 0 280 90" className="w-full" role="img" aria-label="Últimos 7 dias">
      {goal ? <line x1="0" x2="280" y1={70 - (goal / max) * 60} y2={70 - (goal / max) * 60} stroke="#9299a2" strokeDasharray="3" /> : null}
      {points.map((point, index) => {
        const h = (point.v / max) * 60;
        return (
          <g key={`${point.l}-${index}`}>
            <rect x={index * 40 + 8} y={70 - h} width="24" height={h} rx="4" fill={goal && point.v >= goal ? "#69b58a" : "#f07824"} />
            <text x={index * 40 + 20} y="85" fontSize="10" textAnchor="middle" fill="#9299a2">{point.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Radar({ scores }: { scores: [string, number][] }) {
  const point = (index: number, radius: number) => {
    const angle = ((-90 + 72 * index) * Math.PI) / 180;
    return [150 + radius * Math.cos(angle), 105 + radius * Math.sin(angle)];
  };
  const poly = (radius: number) => scores.map((_, i) => point(i, radius).map((n) => n.toFixed(1)).join(",")).join(" ");
  return (
    <svg viewBox="0 0 300 215" className="w-full" role="img" aria-label="Radar de áreas">
      <polygon points={poly(75)} fill="none" stroke="#30363d" />
      <polygon points={poly(37)} fill="none" stroke="#30363d" />
      {scores.map((_, i) => {
        const [x, y] = point(i, 75);
        return <line key={i} x1="150" y1="105" x2={x} y2={y} stroke="#30363d" />;
      })}
      <polygon points={scores.map((s, i) => point(i, 75 * s[1]).join(",")).join(" ")} fill="#f07824" fillOpacity="0.35" stroke="#f07824" strokeWidth="2" />
      {scores.map((s, i) => {
        const [x, y] = point(i, 93);
        return (
          <text key={s[0]} x={x} y={y} fontSize="11" textAnchor="middle" fill="#9299a2">
            {s[0]} {Math.round(s[1] * 100)}
          </text>
        );
      })}
    </svg>
  );
}
