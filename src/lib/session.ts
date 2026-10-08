import { useSyncExternalStore } from "react";
import type { Mode } from "./engine";
import type { CareerInput, Roadmap } from "./roadmap-schema";

export interface Session {
  input: CareerInput;
  roadmap: Roadmap;
  isSample: boolean;
  known: string[];
  completed: string[];
  mode: Mode;
  diagnostics: Record<string, number>;
  projectsBuilt: string[];
  intel: Record<string, unknown>; // key `${nodeId}:${kind}`
  createdAt: number;
}

const KEY = "pathforge:session:v1";
let cache: Session | null | undefined;
const listeners = new Set<() => void>();

function read(): Session | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return null;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    cache = null;
  }
  return cache ?? null;
}

export function setSession(next: Session | null | ((s: Session) => Session)) {
  const value = typeof next === "function" ? (read() ? next(read()!) : null) : next;
  cache = value;
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage full — keep in memory */
  }
  listeners.forEach((l) => l());
}

export function useSession() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}

export const DEMO_INPUT: CareerInput = {
  targetRole: "Quantitative Researcher at a systematic hedge fund",
  industry: "Systematic Investing / Hedge Fund",
  level: "Intermediate",
  skills: ["Calculus", "Linear Algebra", "Python"],
  weeklyHours: 10,
  timelineMonths: 12,
};

const PENDING = "pathforge:pending";
export const setPendingInput = (i: CareerInput) => sessionStorage.setItem(PENDING, JSON.stringify(i));
export const takePendingInput = (): CareerInput | null => {
  const v = sessionStorage.getItem(PENDING);
  sessionStorage.removeItem(PENDING);
  return v ? JSON.parse(v) : null;
};
