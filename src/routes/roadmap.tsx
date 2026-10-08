import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pf/Logo";
import { RoadmapGraph } from "@/components/pf/RoadmapGraph";
import { ProfilePanel } from "@/components/pf/ProfilePanel";
import { StatusBadge } from "@/components/pf/status";
import { computeRoute, monthsFor, whyThisPath, MODE_META, type Mode } from "@/lib/engine";
import { setSession, useSession } from "@/lib/session";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Your career roadmap — PathForge AI" },
      { name: "description", content: "Your interactive, reverse-engineered career dependency graph." },
      { property: "og:title", content: "Your career roadmap — PathForge AI" },
      { property: "og:description", content: "Interactive career graph with dynamic rerouting." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const s = useSession();
  const [selected, setSelected] = useState<string | null>(null);

  const route = useMemo(() => (s ? computeRoute(s.roadmap, s, s.mode) : null), [s]);
  const allModes = useMemo(() => {
    const out = {} as Record<Mode, { months: number; hours: number }>;
    if (s) for (const m of Object.keys(MODE_META) as Mode[]) {
      const h = computeRoute(s.roadmap, s, m).stats.remainingHours;
      out[m] = { hours: h, months: monthsFor(h, s.input.weeklyHours) };
    }
    return out;
  }, [s]);

  if (!s || !route) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo />
        <p className="text-muted-foreground">No roadmap yet.</p>
        <Button asChild variant="hero"><Link to="/start">Build My Roadmap</Link></Button>
      </div>
    );
  }

  const node = route.nodes.find((n) => n.id === selected) ?? null;
  const layoutKey = `${s.mode}:${s.createdAt}`;

  const toggleKnown = (id: string, title: string) => {
    const before = route.stats;
    const isKnown = s.known.includes(id) || s.completed.includes(id);
    const next = { ...s, known: isKnown ? s.known.filter((k) => k !== id) : [...s.known, id], completed: s.completed.filter((k) => k !== id) };
    const after = computeRoute(next.roadmap, next, next.mode).stats;
    setSession(next);
    const saved = before.remainingHours - after.remainingHours;
    toast.success("Roadmap updated", {
      description: isKnown
        ? `${title} moved back onto your route.`
        : `You already know ${title}. Your path has been recalculated — ${saved}h saved, readiness ${before.overall}% → ${after.overall}%.`,
    });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Logo />
        {s.isSample && <span className="font-mono text-xs text-warning">Offline sample — AI unavailable</span>}
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-border lg:block">
          <ProfilePanel s={s} stats={route.stats} nodes={route.nodes} allModes={allModes} onMode={(m) => setSession({ ...s, mode: m })} />
        </aside>
        <main className="relative min-w-0 flex-1 bg-dotgrid" aria-label="Career roadmap graph">
          <RoadmapGraph nodes={route.nodes} selectedId={selected} onSelect={setSelected} layoutKey={layoutKey} />
        </main>
        {node && (
          <aside className="absolute inset-x-0 bottom-0 max-h-[60vh] overflow-y-auto border-t border-border bg-surface p-5 md:static md:max-h-none md:w-96 md:border-l md:border-t-0" aria-label="Node inspector">
            <div className="flex items-start justify-between gap-2">
              <div><StatusBadge status={node.status} /><h2 className="mt-2 text-lg font-semibold">{node.title}</h2></div>
              <Button variant="ghost" size="icon" aria-label="Close inspector" onClick={() => setSelected(null)}><X /></Button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              {node.whyImportant && <Sec t="Why it matters"><p>{node.whyImportant}</p></Sec>}
              <Sec t="Why this path?"><p className="text-muted-foreground">{whyThisPath(node, route.nodes)}</p></Sec>
              {node.whatToLearn.length > 0 && <Sec t="What to learn"><ul className="list-disc pl-4">{node.whatToLearn.map((w) => <li key={w}>{w}</li>)}</ul></Sec>}
              <Sec t="Estimated effort"><p className="font-mono">{node.hours} hours</p></Sec>
              {node.recommendedProject && <Sec t="Recommended project"><p>{node.recommendedProject}</p></Sec>}
              {node.type !== "role" && (
                <Button variant={node.status === "mastered" || node.status === "completed" ? "surface" : "hero"} className="w-full" onClick={() => toggleKnown(node.id, node.title)}>
                  {node.status === "mastered" || node.status === "completed" ? <><Undo2 /> Unmark</> : <><Check /> Mark as Known</>}
                </Button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return <section><h3 className="eyebrow mb-1">{t}</h3>{children}</section>;
}
