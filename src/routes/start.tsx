import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/pf/Logo";
import { generateRoadmap } from "@/lib/pathforge.functions";
import { matchKnown } from "@/lib/engine";
import { SAMPLE_ROADMAP } from "@/lib/sample-roadmap";
import { setSession, takePendingInput, DEMO_INPUT } from "@/lib/session";
import type { CareerInput, Roadmap } from "@/lib/roadmap-schema";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "Build your roadmap — PathForge AI" },
      { name: "description", content: "Tell PathForge where you want to go, what you know, and how much time you have." },
      { property: "og:title", content: "Build your roadmap — PathForge AI" },
      { property: "og:description", content: "Three quick steps to a personalized, reverse-engineered career route." },
    ],
  }),
  component: Onboarding,
});

const SUGGESTED = ["Calculus", "Linear Algebra", "Probability", "Statistics", "Python", "SQL", "Machine Learning", "Optimization", "JavaScript", "React", "Figma", "Git"];
const STEPS = ["Understanding target role", "Identifying required skills", "Building dependency graph", "Calculating skill gaps", "Optimizing timeline"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CareerInput>({ targetRole: "", industry: "", level: "Intermediate", skills: [], weeklyHours: 10, timelineMonths: 12 });
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(0);
  const autoRun = useRef(false);

  useEffect(() => {
    const p = takePendingInput();
    if (p) {
      setInput(p);
      setStep(2);
      autoRun.current = true;
    }
  }, []);

  const set = <K extends keyof CareerInput>(k: K, v: CareerInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const toggle = (s: string) => set("skills", input.skills.includes(s) ? input.skills.filter((x) => x !== s) : [...input.skills, s]);

  const finish = (rm: Roadmap, isSample: boolean, inp: CareerInput) => {
    setSession({
      input: inp, roadmap: rm, isSample, known: matchKnown(rm, inp.skills), completed: [], mode: "realistic",
      diagnostics: {}, projectsBuilt: [], intel: {}, createdAt: Date.now(),
    });
    navigate({ to: "/roadmap" });
  };

  const analyze = async (inp = input) => {
    if (inp.targetRole.trim().length < 3) {
      setStep(0);
      setError("Tell us the exact role you're aiming for.");
      return;
    }
    setError(null);
    setLoading(true);
    setPhase(0);
    const timer = setInterval(() => setPhase((p) => Math.min(p + 1, STEPS.length - 1)), 4500);
    try {
      const res = await generateRoadmap({ data: inp });
      if (res.ok) {
        setPhase(STEPS.length);
        finish(res.data, false, inp);
        return;
      }
      setError(res.error);
    } catch {
      setError("Career analysis is temporarily unavailable. Please check your connection and try again.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRun.current && input.targetRole) {
      autoRun.current = false;
      analyze(input);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  if (loading) {
    return (
      <Shell>
        <div className="mx-auto max-w-md py-16" role="status" aria-live="polite">
          <p className="eyebrow">Reverse-engineering your career</p>
          <h1 className="mt-3 text-2xl font-semibold">{input.targetRole}</h1>
          <ul className="mt-8 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 text-sm ${i <= phase ? "text-foreground" : "text-muted-foreground"}`}>
                {i < phase ? <Check className="size-4 text-success" /> : i === phase ? <Loader2 className="size-4 animate-spin text-primary" /> : <span className="size-4 rounded-full border border-border" />}
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-xs text-muted-foreground">The AI is building your dependency graph. This usually takes 20–60 seconds.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-xl py-10">
        <p className="eyebrow">Step {step + 1} of 3</p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />)}
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm">
            <p className="text-warning">{error}</p>
            {input.targetRole.length >= 3 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="surface" onClick={() => analyze()}>Try again</Button>
                <Button size="sm" variant="ghost" onClick={() => finish(SAMPLE_ROADMAP, true, DEMO_INPUT)}>Open offline sample (Quant Researcher)</Button>
              </div>
            )}
          </div>
        )}

        {step === 0 && (
          <section className="mt-8 space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">Where are you trying to go?</h1>
            <Field label="Target career" id="role">
              <Input id="role" autoFocus placeholder="Quantitative Researcher at a systematic hedge fund" value={input.targetRole} onChange={(e) => set("targetRole", e.target.value)} className="h-11" />
            </Field>
            <Field label="Industry / company type" id="industry">
              <Input id="industry" placeholder="Systematic Investing / Hedge Fund" value={input.industry} onChange={(e) => set("industry", e.target.value)} className="h-11" />
            </Field>
            <fieldset>
              <legend className="eyebrow mb-2">Current level</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["Beginner", "Intermediate", "Advanced"] as const).map((l) => (
                  <button key={l} type="button" aria-pressed={input.level === l} onClick={() => set("level", l)}
                    className={`h-11 rounded-lg border text-sm transition-colors ${input.level === l ? "border-primary bg-primary/10 text-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}>{l}</button>
                ))}
              </div>
            </fieldset>
          </section>
        )}

        {step === 1 && (
          <section className="mt-8 space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">What do you already know?</h1>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...SUGGESTED, ...input.skills])].map((s) => {
                const on = input.skills.includes(s);
                return (
                  <button key={s} type="button" aria-pressed={on} onClick={() => toggle(s)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors ${on ? "border-success/60 bg-success/10 text-success" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}>
                    {on && <Check className="size-3.5" />}{s}
                  </button>
                );
              })}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const v = custom.trim(); if (v && !input.skills.includes(v)) set("skills", [...input.skills, v]); setCustom(""); }}>
              <Input aria-label="Add a custom skill" placeholder="Add another skill…" value={custom} onChange={(e) => setCustom(e.target.value)} className="h-10" />
              <Button type="submit" variant="surface"><Plus /> Add</Button>
            </form>
            {input.skills.length > 0 && (
              <p className="text-xs text-muted-foreground">{input.skills.length} selected · <button type="button" className="underline" onClick={() => set("skills", [])}><X className="inline size-3" /> clear</button></p>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="mt-8 space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">How do you want to get there?</h1>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weekly hours" id="hours">
                <Input id="hours" type="number" min={1} max={80} value={input.weeklyHours} onChange={(e) => set("weeklyHours", Math.max(1, Math.min(80, Number(e.target.value) || 1)))} className="h-11 font-mono" />
              </Field>
              <Field label="Target timeline (months)" id="months">
                <Input id="months" type="number" min={1} max={60} value={input.timelineMonths} onChange={(e) => set("timelineMonths", Math.max(1, Math.min(60, Number(e.target.value) || 1)))} className="h-11 font-mono" />
              </Field>
            </div>
            <p className="rounded-lg border border-border bg-surface p-4 font-mono text-sm text-muted-foreground">
              ≈ <span className="text-foreground">{Math.round(input.weeklyHours * input.timelineMonths * 4.33)}</span> available hours
            </p>
          </section>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft /> Back</Button>
          {step < 2 ? (
            <Button variant="hero" size="lg" disabled={step === 0 && input.targetRole.trim().length < 3} onClick={() => { setError(null); setStep((s) => s + 1); }}>Continue <ArrowRight /></Button>
          ) : (
            <Button variant="hero" size="lg" onClick={() => analyze()}>Analyze My Starting Point <ArrowRight /></Button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dotgrid">
      <header className="mx-auto flex max-w-6xl items-center px-5 py-5"><Logo /></header>
      <main className="px-5">{children}</main>
    </div>
  );
}
