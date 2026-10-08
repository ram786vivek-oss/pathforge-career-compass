import { z } from "zod";

export const PRIORITIES = ["critical", "high", "medium", "low"] as const;
export const NODE_TYPES = ["skill", "project", "role", "certification", "milestone"] as const;

const str = z.string().trim().min(1);

export const roadmapNodeSchema = z.object({
  id: str,
  title: str,
  type: z.enum(NODE_TYPES).catch("skill"),
  category: z.string().catch("General"),
  phase: z.coerce.number().int().min(1).max(8).catch(1),
  dependencies: z.array(z.string()).catch([]),
  estimatedHours: z.coerce.number().min(0).max(1000).catch(20),
  priority: z.enum(PRIORITIES).catch("medium"),
  optional: z.boolean().catch(false),
  initiallyKnown: z.boolean().catch(false),
  description: z.string().catch(""),
  whyImportant: z.string().catch(""),
  whatToLearn: z.array(z.string()).catch([]),
  recommendedProject: z.string().catch(""),
});

export const roadmapSchema = z.object({
  target: z.object({
    role: str,
    industry: z.string().catch(""),
    summary: z.string().catch(""),
  }),
  phases: z
    .array(z.object({ index: z.coerce.number(), title: str, description: z.string().catch("") }))
    .catch([]),
  nodes: z.array(roadmapNodeSchema).min(4),
  intermediateRoles: z
    .array(z.object({ title: str, description: z.string().catch(""), afterPhase: z.coerce.number().catch(2) }))
    .catch([]),
  certifications: z
    .array(z.object({ name: str, value: z.string().catch(""), optional: z.boolean().catch(true) }))
    .catch([]),
});

export type RoadmapNode = z.infer<typeof roadmapNodeSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;

/** Validates and repairs AI output: drops dangling/self/cyclic dependencies. */
export function sanitizeRoadmap(raw: unknown): Roadmap {
  const rm = roadmapSchema.parse(raw);
  const seen = new Set<string>();
  const nodes = rm.nodes.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    n.dependencies = [...new Set(n.dependencies.filter((d) => d !== n.id && ids.has(d)))];
  }
  // Break cycles with DFS
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string) => {
    state.set(id, 1);
    const n = byId.get(id)!;
    n.dependencies = n.dependencies.filter((d) => {
      const s = state.get(d) ?? 0;
      if (s === 1) return false;
      if (s === 0) visit(d);
      return true;
    });
    state.set(id, 2);
  };
  for (const n of nodes) if (!state.get(n.id)) visit(n.id);
  return { ...rm, nodes };
}

export const intelSchemas = {
  advice: z.object({
    explanation: z.string().catch(""),
    whatToLearn: z.array(z.string()).catch([]),
    prerequisitesNote: z.string().catch(""),
    resources: z.array(z.object({ title: z.string(), kind: z.string().catch("resource"), note: z.string().catch("") })).catch([]),
    githubIdeas: z.array(z.string()).catch([]),
    studyPlan: z.array(z.object({ week: z.coerce.number().catch(1), focus: z.string(), tasks: z.array(z.string()).catch([]) })).catch([]),
    effortHours: z.coerce.number().catch(0),
  }),
  project: z.object({
    title: z.string(),
    problem: z.string().catch(""),
    whyItMatters: z.string().catch(""),
    skills: z.array(z.string()).catch([]),
    difficulty: z.string().catch("Intermediate"),
    hours: z.coerce.number().catch(20),
    technologies: z.array(z.string()).catch([]),
    milestones: z.array(z.string()).catch([]),
    deliverables: z.array(z.string()).catch([]),
    readmeOutline: z.array(z.string()).catch([]),
    interviewPitch: z.string().catch(""),
  }),
  interview: z.object({
    questions: z
      .array(z.object({ difficulty: z.string().catch("Medium"), question: z.string(), tests: z.string().catch(""), hint: z.string().catch("") }))
      .min(1),
  }),
  diagnostic: z.object({
    questions: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).min(2),
          answerIndex: z.coerce.number().int(),
          explanation: z.string().catch(""),
        }),
      )
      .min(1),
  }),
};

export type IntelKind = keyof typeof intelSchemas;
export type IntelResult<K extends IntelKind> = z.infer<(typeof intelSchemas)[K]>;

export interface CareerInput {
  targetRole: string;
  industry: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  skills: string[];
  weeklyHours: number;
  timelineMonths: number;
}
