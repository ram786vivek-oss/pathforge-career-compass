import { useState } from "react";
import { motion } from "framer-motion";

type HN = { id: string; label: string; x: number; y: number; kind: "target" | "pillar" | "step" | "done" };
const NODES: HN[] = [
  { id: "t", label: "QUANTITATIVE RESEARCHER", x: 50, y: 8, kind: "target" },
  { id: "m", label: "MATHEMATICS", x: 18, y: 30, kind: "done" },
  { id: "p", label: "PROGRAMMING", x: 50, y: 30, kind: "done" },
  { id: "s", label: "STATISTICS", x: 82, y: 30, kind: "pillar" },
  { id: "q", label: "QUANT FINANCE", x: 50, y: 52, kind: "step" },
  { id: "pr", label: "PROJECTS", x: 50, y: 72, kind: "step" },
  { id: "i", label: "INTERVIEW READY", x: 50, y: 92, kind: "step" },
];
const EDGES: [string, string][] = [["t", "m"], ["t", "p"], ["t", "s"], ["m", "q"], ["p", "q"], ["s", "q"], ["q", "pr"], ["pr", "i"]];

export function HeroGraph() {
  const [hover, setHover] = useState<string | null>("s");
  const pos = (id: string) => NODES.find((n) => n.id === id)!;
  const lit = (a: string, b: string) => hover === a || hover === b;
  return (
    <div className="relative aspect-[5/6] w-full max-w-md rounded-2xl border border-border bg-surface bg-dotgrid p-2 sm:aspect-square">
      <div className="absolute left-4 top-3 eyebrow">live dependency graph</div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {EDGES.map(([a, b], i) => {
          const A = pos(a), B = pos(b);
          return (
            <motion.line
              key={i}
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              vectorEffect="non-scaling-stroke"
              className={lit(a, b) ? "stroke-primary" : "stroke-border"}
              strokeWidth={lit(a, b) ? 1.6 : 1}
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.1 * i }}
            />
          );
        })}
      </svg>
      {NODES.map((n, i) => (
        <motion.button
          key={n.id}
          type="button"
          onMouseEnter={() => setHover(n.id)}
          onFocus={() => setHover(n.id)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08 }}
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border px-2.5 py-1.5 font-mono text-[10px] tracking-wider transition-colors sm:text-[11px] ${
            n.kind === "target"
              ? "border-primary bg-primary/15 text-foreground shadow-glow"
              : n.kind === "done"
                ? "border-success/50 bg-surface-2 text-success"
                : hover === n.id
                  ? "border-primary bg-surface-2 text-foreground"
                  : "border-border bg-surface-2 text-muted-foreground"
          }`}
        >
          {n.kind === "done" ? "✓ " : n.kind === "target" ? "◎ " : n.id === "s" ? "⚠ " : "→ "}
          {n.label}
        </motion.button>
      ))}
    </div>
  );
}
