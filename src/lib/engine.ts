import type { Roadmap, RoadmapNode } from "./roadmap-schema";

export type Mode = "fastest" | "realistic" | "strongest";
export type Status = "mastered" | "completed" | "current" | "next" | "gap" | "optional";

export const MODE_META: Record<Mode, { label: string; focus: string; multiplier: number }> = {
  fastest: { label: "Fastest", focus: "Minimum time — critical skills only", multiplier: 0.8 },
  realistic: { label: "Most Realistic", focus: "Balanced theory, projects & workload", multiplier: 1 },
  strongest: { label: "Strongest Profile", focus: "Deeper knowledge, stronger projects", multiplier: 1.25 },
};

export const WEEKS_PER_MONTH = 4.33;

export interface ComputedNode extends RoadmapNode {
  status: Status;
  effectiveDeps: string[];
  hours: number; // mode-adjusted
  onRoute: boolean;
  order: number; // position in recommended sequence (-1 if done)
}

export interface RouteState {
  known: string[];
  completed: string[];
  diagnostics: Record<string, number>; // nodeId -> score 0..1
}

const ALWAYS = new Set(["role", "milestone"]);

export function includedInMode(n: RoadmapNode, mode: Mode) {
  if (ALWAYS.has(n.type)) return true;
  if (mode === "fastest") return !n.optional && n.type !== "certification" && n.priority !== "low";
  if (mode === "realistic") return !n.optional || n.priority === "critical" || n.priority === "high";
  return true;
}

/** Core rerouting engine: derives the route from roadmap + user skill state + mode. */
export function computeRoute(rm: Roadmap, state: RouteState, mode: Mode) {
  const byId = new Map(rm.nodes.map((n) => [n.id, n]));
  const included = new Set(rm.nodes.filter((n) => includedInMode(n, mode)).map((n) => n.id));
  const known = new Set(state.known);
  const completed = new Set(state.completed);
  const mult = MODE_META[mode].multiplier;

  // Collapse excluded nodes: dependencies pass through transitively.
  const memo = new Map<string, string[]>();
  const resolve = (id: string, stack = new Set<string>()): string[] => {
    if (included.has(id)) return [id];
    if (memo.has(id)) return memo.get(id)!;
    if (stack.has(id)) return [];
    stack.add(id);
    const out = [...new Set((byId.get(id)?.dependencies ?? []).flatMap((d) => resolve(d, stack)))];
    memo.set(id, out);
    return out;
  };

  const isDone = (id: string) => known.has(id) || completed.has(id);

  const nodes: ComputedNode[] = rm.nodes
    .filter((n) => included.has(n.id))
    .map((n) => {
      const effectiveDeps = [...new Set(n.dependencies.flatMap((d) => resolve(d)))];
      return { ...n, effectiveDeps, hours: Math.round(n.estimatedHours * mult), status: "gap" as Status, onRoute: false, order: -1 };
    });
  const cmap = new Map(nodes.map((n) => [n.id, n]));

  // Topological order, prioritising critical work
  const prioRank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const indeg = new Map(nodes.map((n) => [n.id, n.effectiveDeps.length]));
  const children = new Map<string, string[]>();
  for (const n of nodes) for (const d of n.effectiveDeps) children.set(d, [...(children.get(d) ?? []), n.id]);
  const ready = nodes.filter((n) => indeg.get(n.id) === 0);
  const topo: ComputedNode[] = [];
  while (ready.length) {
    ready.sort((a, b) => Number(isDone(b.id)) - Number(isDone(a.id)) || prioRank[a.priority] - prioRank[b.priority] || a.phase - b.phase);
    const n = ready.shift()!;
    topo.push(n);
    for (const c of children.get(n.id) ?? []) {
      indeg.set(c, indeg.get(c)! - 1);
      if (indeg.get(c) === 0) ready.push(cmap.get(c)!);
    }
  }

  let order = 0;
  let currentAssigned = false;
  for (const n of topo) {
    if (known.has(n.id)) n.status = "mastered";
    else if (completed.has(n.id)) n.status = "completed";
    else {
      n.order = order++;
      n.onRoute = !n.optional || mode === "strongest";
      const unlocked = n.effectiveDeps.every(isDone);
      if (unlocked && !currentAssigned && !n.optional) {
        n.status = "current";
        currentAssigned = true;
      } else if (unlocked) n.status = n.optional ? "optional" : "next";
      else n.status = n.optional ? "optional" : "gap";
    }
  }

  const stats = computeStats(nodes, state);
  return { nodes: topo, stats };
}

export interface Stats {
  totalHours: number;
  remainingHours: number;
  overall: number;
  categories: { name: string; pct: number }[];
}

function computeStats(nodes: ComputedNode[], state: RouteState): Stats {
  const known = new Set(state.known);
  const completed = new Set(state.completed);
  const credit = (n: ComputedNode) => {
    if (known.has(n.id) || completed.has(n.id)) return 1;
    const d = state.diagnostics[n.id];
    return d !== undefined ? Math.min(0.5, d * 0.5) : 0;
  };
  const work = nodes.filter((n) => n.type !== "milestone" && n.type !== "role");
  const totalHours = work.reduce((s, n) => s + n.hours, 0);
  const remainingHours = work.reduce((s, n) => s + (known.has(n.id) || completed.has(n.id) ? 0 : n.hours), 0);
  const weight = (n: ComputedNode) => Math.max(n.hours, 1) * (n.priority === "critical" ? 1.5 : n.priority === "high" ? 1.2 : 1);
  const wTotal = work.reduce((s, n) => s + weight(n), 0) || 1;
  const overall = Math.round((work.reduce((s, n) => s + weight(n) * credit(n), 0) / wTotal) * 100);
  const cats = new Map<string, { w: number; c: number }>();
  for (const n of work) {
    const c = cats.get(n.category) ?? { w: 0, c: 0 };
    c.w += weight(n);
    c.c += weight(n) * credit(n);
    cats.set(n.category, c);
  }
  return {
    totalHours,
    remainingHours,
    overall,
    categories: [...cats.entries()].map(([name, v]) => ({ name, pct: Math.round((v.c / (v.w || 1)) * 100) })),
  };
}

export function monthsFor(hours: number, weeklyHours: number) {
  if (weeklyHours <= 0) return Infinity;
  return Math.round((hours / weeklyHours / WEEKS_PER_MONTH) * 10) / 10;
}

export function availableHours(weeklyHours: number, months: number) {
  return Math.round(weeklyHours * months * WEEKS_PER_MONTH);
}

/** Explanation grounded in the actual dependency graph. */
export function whyThisPath(node: ComputedNode, all: ComputedNode[]) {
  const map = new Map(all.map((n) => [n.id, n]));
  const deps = node.effectiveDeps.map((d) => map.get(d)?.title).filter(Boolean) as string[];
  const unlocks = all.filter((n) => n.effectiveDeps.includes(node.id)).map((n) => n.title);
  const parts: string[] = [];
  if (deps.length) parts.push(`We placed ${list(deps)} before ${node.title} because ${node.title} builds directly on ${deps.length > 1 ? "them" : "it"}.`);
  else parts.push(`${node.title} has no prerequisites in your route, so it can be started immediately.`);
  if (unlocks.length) parts.push(`Completing it unlocks ${list(unlocks)}.`);
  if (node.priority === "critical") parts.push("It is marked critical for the target role, so the optimizer keeps it in every mode.");
  return parts.join(" ");
}

function list(xs: string[]) {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

/** Fuzzy match user's claimed skills to roadmap nodes. */
export function matchKnown(rm: Roadmap, skills: string[]) {
  const norm = (s: string) => s.toLowerCase().replace(/\b(basics?|fundamentals?|intro(duction)?)\b/g, "").replace(/[^a-z0-9+#]/g, "");
  const ss = skills.map(norm).filter(Boolean);
  return rm.nodes
    .filter((n) => n.type === "skill" && (n.initiallyKnown || ss.some((s) => norm(n.title) === s)))
    .map((n) => n.id);
}
