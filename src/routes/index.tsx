import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, GitBranch, Sparkles, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pf/Logo";
import { HeroGraph } from "@/components/pf/HeroGraph";
import { DEMO_INPUT, setPendingInput, useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PathForge AI — Reverse-engineer your dream career" },
      { name: "description", content: "PathForge works backward from your exact dream role to build a personalized, interactive career roadmap from where you are today." },
      { property: "og:title", content: "PathForge AI — Work backward. Move forward." },
      { property: "og:description", content: "AI career navigation: an interactive dependency graph from your current skills to your target role." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const session = useSession();
  const demo = () => {
    setPendingInput(DEMO_INPUT);
    navigate({ to: "/start" });
  };
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Primary">
          <a href="#product" className="hover:text-foreground">Product</a>
          <a href="#how" className="hover:text-foreground">How It Works</a>
          <a href="#features" className="hover:text-foreground">Features</a>
        </nav>
        <div className="flex items-center gap-2">
          {session && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/roadmap">My roadmap</Link>
            </Button>
          )}
          <Button asChild variant="hero" size="sm">
            <Link to="/start">Build My Roadmap</Link>
          </Button>
        </div>
      </header>

      <main>
        <section id="product" className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            <p className="eyebrow mb-5 flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> AI career navigation</p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
              Work backward.<br /><span className="text-gradient">Move forward.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Reverse-engineer your dream career into a personalized path based on where you are today.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/start">Build My Roadmap <ArrowRight /></Link>
              </Button>
              <Button variant="surface" size="lg" onClick={demo}>See Demo</Button>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <HeroGraph />
          </div>
        </section>

        <section id="features" className="border-t border-border bg-surface/50">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="eyebrow">Reverse-engineered</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Not one-size-fits-all.</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
              {[
                { icon: Fingerprint, t: "Skill-aware", d: "Starts from what you already know, so you never re-learn Calculus to reach Time Series." },
                { icon: Sparkles, t: "AI-generated", d: "Every roadmap is generated for your exact role and industry — no templates." },
                { icon: GitBranch, t: "Dynamically adaptive", d: "Mark a skill as known and the route recalculates: dependencies, readiness and timeline." },
              ].map(({ icon: I, t, d }) => (
                <div key={t} className="bg-background p-7">
                  <I className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-4 font-medium">{t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">How it works</p>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              ["01", "Name the destination", "The exact role and company type you want."],
              ["02", "Declare your start", "Level, known skills, and weekly hours."],
              ["03", "Get the route", "A dependency graph with gaps, projects, and an honest timeline."],
              ["04", "Reroute as you grow", "Mark skills known, switch modes, prove skills."],
            ].map(([n, t, d]) => (
              <li key={n} className="border-l border-border pl-4">
                <span className="font-mono text-xs text-primary">{n}</span>
                <h3 className="mt-2 font-medium">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 flex items-center gap-3 rounded-xl border border-border bg-surface p-5">
            <RouteIcon className="size-5 shrink-0 text-primary" aria-hidden />
            <p className="flex-1 text-sm text-muted-foreground">Ready to see your route? It takes about 30 seconds.</p>
            <Button asChild variant="hero" size="sm"><Link to="/start">Start</Link></Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-8 text-center font-mono text-xs text-muted-foreground">
        PathForge AI · Lloyd Hackathon · Problem Statement 1
      </footer>
    </div>
  );
}
