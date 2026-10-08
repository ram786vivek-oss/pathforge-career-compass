import { Link } from "@tanstack/react-router";
import { RotateCcw, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODE_META, availableHours, monthsFor, type ComputedNode, type Mode, type Stats } from "@/lib/engine";
import type { Session } from "@/lib/session";
import { STATUS_META } from "./status";

export function ProfilePanel({ s, stats, nodes, onMode, allModes }: {
  s: Session; stats: Stats; nodes: ComputedNode[]; onMode: (m: Mode) => void;
  allModes: Record<Mode, { months: number; hours: number }>;
}) {
  const months = monthsFor(stats.remainingHours, s.input.weeklyHours);
  const avail = availableHours(s.input.weeklyHours, s.input.timelineMonths);
  const fits = stats.remainingHours <= avail;
  const known = nodes.filter((n) => n.status === "mastered" || n.status === "completed");
  return (
    <div className="space-y-6 p-5 text-sm">
      <Block label="Target"><p className="text-base font-semibold leading-snug">{s.roadmap.target.role}</p></Block>
      {s.roadmap.target.industry && <Block label="Industry"><p>{s.roadmap.target.industry}</p></Block>}

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Readiness" value={`${stats.overall}%`} accent />
        <Stat label="Timeline" value={`${months}mo`} />
        <Stat label="Weekly" value={`${s.input.weeklyHours}h`} />
      </div>

      <div className={`rounded-lg border p-3 text-xs leading-relaxed ${fits ? "border-success/30 bg-success/5" : "border-warning/40 bg-warning/5"}`} role="note">
        <p className={`mb-1 font-mono uppercase tracking-wider ${fits ? "text-success" : "text-warning"}`}>{fits ? "✓ Fits your timeline" : "⚠ Timeline stretch"}</p>
        Your route needs ≈ <b>{stats.remainingHours}h</b>. You have ≈ {avail}h in {s.input.timelineMonths} months.
        {!fits && <> At {s.input.weeklyHours} hrs/week the realistic timeline is ≈ <b>{Math.ceil(months)} months</b> — or ≈ {Math.ceil(stats.remainingHours / s.input.timelineMonths / 4.33)} hrs/week to hit your target.</>}
      </div>

      <Block label="Roadmap mode">
        <div className="space-y-1.5" role="radiogroup" aria-label="Roadmap mode">
          {(Object.keys(MODE_META) as Mode[]).map((m) => (
            <button key={m} role="radio" aria-checked={s.mode === m} onClick={() => onMode(m)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${s.mode === m ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-accent"}`}>
              <span>
                <span className="block font-medium">{MODE_META[m].label}</span>
                <span className="block text-[11px] text-muted-foreground">{MODE_META[m].focus}</span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">{allModes[m].months}mo</span>
            </button>
          ))}
        </div>
      </Block>

      <Block label="Readiness breakdown">
        <ul className="space-y-2">
          {stats.categories.map((c) => (
            <li key={c.name}>
              <div className="flex justify-between text-xs"><span>{c.name}</span><span className="font-mono text-muted-foreground">{c.pct}%</span></div>
              <div className="mt-1 h-1 rounded-full bg-border"><div className="h-1 rounded-full bg-gradient-accent transition-all duration-500" style={{ width: `${c.pct}%` }} /></div>
            </li>
          ))}
        </ul>
      </Block>

      {known.length > 0 && (
        <Block label="Claimed vs proven">
          <ul className="space-y-1.5">
            {known.map((n) => {
              const diag = s.diagnostics[n.id];
              const built = s.projectsBuilt.includes(n.id);
              const ev = (diag !== undefined && diag >= 0.7 ? 1 : 0) + (built ? 1 : 0);
              const conf = ev >= 2 ? "High" : ev === 1 ? "Medium" : "Low";
              const Icon = ev ? ShieldCheck : ShieldAlert;
              return (
                <li key={n.id} className="flex items-center gap-2 text-xs">
                  <Icon className={`size-3.5 ${ev ? "text-success" : "text-warning"}`} aria-hidden />
                  <span className="flex-1 truncate">{n.title}</span>
                  <span className={`font-mono ${ev ? "text-success" : "text-warning"}`}>{conf}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">Prove a skill by passing its diagnostic or building its project.</p>
        </Block>
      )}

      {s.roadmap.intermediateRoles.length > 0 && (
        <Block label="Intermediate roles">
          <ul className="space-y-2">
            {s.roadmap.intermediateRoles.map((r) => (
              <li key={r.title} className="border-l border-border pl-3"><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.description}</p></li>
            ))}
          </ul>
        </Block>
      )}

      <Block label="Legend">
        <ul className="grid grid-cols-2 gap-1.5 text-xs">
          {(["mastered", "current", "next", "gap", "optional", "completed"] as const).map((k) => {
            const m = STATUS_META[k]; const I = m.icon;
            return <li key={k} className={`flex items-center gap-1.5 ${m.text}`}><I className="size-3.5" aria-hidden />{m.label}</li>;
          })}
        </ul>
      </Block>

      <Button asChild variant="surface" size="sm" className="w-full"><Link to="/start"><RotateCcw /> New roadmap</Link></Button>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return <section><h2 className="eyebrow mb-2">{label}</h2>{children}</section>;
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <p className="eyebrow !text-[9px]">{label}</p>
      <p className={`mt-1 font-mono text-lg font-semibold ${accent ? "text-gradient" : ""}`}>{value}</p>
    </div>
  );
}
