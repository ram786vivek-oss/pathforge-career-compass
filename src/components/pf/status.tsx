import { Check, CircleDot, ArrowRight, TriangleAlert, Diamond, CheckCheck } from "lucide-react";
import type { Status } from "@/lib/engine";

export const STATUS_META: Record<Status, { label: string; icon: typeof Check; text: string; border: string; bg: string }> = {
  mastered: { label: "Mastered", icon: Check, text: "text-success", border: "border-success/50", bg: "bg-success/10" },
  completed: { label: "Completed", icon: CheckCheck, text: "text-success", border: "border-success/50", bg: "bg-success/10" },
  current: { label: "Current", icon: CircleDot, text: "text-primary", border: "border-primary", bg: "bg-primary/15" },
  next: { label: "Next", icon: ArrowRight, text: "text-primary", border: "border-primary/50", bg: "bg-primary/5" },
  gap: { label: "Gap", icon: TriangleAlert, text: "text-warning", border: "border-warning/40", bg: "bg-warning/5" },
  optional: { label: "Optional", icon: Diamond, text: "text-optional", border: "border-dashed border-optional/50", bg: "bg-transparent" },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${m.text} ${m.border} ${m.bg}`}>
      <Icon className="size-3" aria-hidden />
      {m.label}
    </span>
  );
}
