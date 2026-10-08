import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { intelSchemas, sanitizeRoadmap, type IntelKind, type Roadmap } from "./roadmap-schema";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const careerInputSchema = z.object({
  targetRole: z.string().trim().min(3).max(200),
  industry: z.string().trim().max(200),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  skills: z.array(z.string().trim().max(60)).max(40),
  weeklyHours: z.number().min(1).max(80),
  timelineMonths: z.number().min(1).max(60),
});

const ROADMAP_INSTRUCTIONS = `You are PathForge, a career strategist who reverse-engineers careers.
Work BACKWARD from the target role: decide what a hiring manager for that exact role and industry requires, then decompose into a dependency graph of skills, projects, intermediate roles, certifications and milestones.
Return ONLY a JSON object (no prose, no markdown) with this exact shape:
{
 "target": {"role": string, "industry": string, "summary": string (2 sentences on what the role really does day to day)},
 "phases": [{"index": number (1-5), "title": string, "description": string}],
 "nodes": [{
   "id": kebab-case unique string,
   "title": short name (max 4 words),
   "type": "skill" | "project" | "role" | "certification" | "milestone",
   "category": one of 4-6 broad categories you define for this career (e.g. "Mathematics","Programming"),
   "phase": number 1-5,
   "dependencies": [ids of nodes that must come BEFORE this one],
   "estimatedHours": realistic hours for someone at the user's level,
   "priority": "critical" | "high" | "medium" | "low",
   "optional": boolean,
   "initiallyKnown": boolean (true only if clearly covered by the user's known skills),
   "description": 1 sentence,
   "whyImportant": 1 sentence specific to the target role,
   "whatToLearn": 3-5 concrete subtopics,
   "recommendedProject": a specific project name (not generic)
 }],
 "intermediateRoles": [{"title": string, "description": string, "afterPhase": number}],
 "certifications": [{"name": string, "value": string, "optional": boolean}]
}
Rules:
- 16 to 24 nodes. Include the user's known skills as nodes (initiallyKnown true) so the graph shows where they stand.
- Exactly one node of type "role" representing the target role (id "target"), depending on the final milestone(s).
- One "milestone" node "Interview Ready" that depends on the key projects; "target" depends on it.
- 2-4 "project" nodes that are career-specific portfolio pieces (never "portfolio website").
- At least 3 optional nodes (priority low or medium) that deepen the profile.
- Dependencies must form a DAG. Foundations have no dependencies.
- Be specific to the industry; different careers must produce different structures.`;

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => careerInputSchema.parse(d))
  .handler(async ({ data }): Promise<Result<Roadmap>> => {
    const { runJson, FriendlyError } = await import("./ai.server");
    try {
      const prompt = `Target career: ${data.targetRole}
Industry / company type: ${data.industry || "not specified"}
Current level: ${data.level}
Known skills: ${data.skills.length ? data.skills.join(", ") : "none listed"}
Available time: ${data.weeklyHours} hours/week
Target timeline: ${data.timelineMonths} months`;
      const raw = await runJson(ROADMAP_INSTRUCTIONS, prompt);
      const rm = sanitizeRoadmap(raw);
      return { ok: true, data: rm };
    } catch (e) {
      if (e instanceof FriendlyError) return { ok: false, error: e.message };
      console.error("roadmap validation failed", e);
      return { ok: false, error: "The AI response didn't pass validation. Please try again." };
    }
  });

const intelInputSchema = z.object({
  kind: z.enum(["advice", "project", "interview", "diagnostic"]),
  role: z.string().max(200),
  industry: z.string().max(200),
  level: z.string().max(40),
  node: z.object({
    title: z.string().max(120),
    description: z.string().max(600),
    whatToLearn: z.array(z.string().max(120)).max(10),
    prerequisites: z.array(z.string().max(120)).max(20),
    hours: z.number(),
  }),
});

const INTEL_SHAPES: Record<IntelKind, string> = {
  advice: `{"explanation": string (3-4 sentences specific to the role), "whatToLearn": [5-7 concrete subtopics], "prerequisitesNote": string, "resources": [{"title": string, "kind": "book"|"course"|"paper"|"docs"|"practice", "note": string}] (4), "githubIdeas": [3 specific repository ideas], "studyPlan": [{"week": number, "focus": string, "tasks": [2-3 strings]}] (sized to the hours at ~10h/week, max 6 weeks), "effortHours": number}`,
  project: `{"title": string, "problem": string, "whyItMatters": string (why hiring managers for this role care), "skills": [strings], "difficulty": "Beginner"|"Intermediate"|"Advanced", "hours": number, "technologies": [strings], "milestones": [4-6 strings], "deliverables": [3-5 strings], "readmeOutline": [6-8 section headings], "interviewPitch": string (how to explain it in an interview, 3 sentences)}`,
  interview: `{"questions": [{"difficulty": "Easy"|"Medium"|"Hard", "question": string, "tests": string (what it evaluates), "hint": string}]} with 3 Easy, 3 Medium, 3 Hard questions actually asked in interviews for this role`,
  diagnostic: `{"questions": [{"question": string, "options": [4 strings], "answerIndex": number 0-3, "explanation": string}]} with exactly 6 multiple-choice questions of increasing difficulty`,
};

export const generateNodeIntel = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => intelInputSchema.parse(d))
  .handler(async ({ data }): Promise<Result<unknown>> => {
    const { runJson, FriendlyError } = await import("./ai.server");
    try {
      const instructions = `You are PathForge, a senior mentor for people becoming a ${data.role}${data.industry ? ` in ${data.industry}` : ""}. Be specific and concrete; never give generic advice. Return ONLY a JSON object (no markdown) with this shape:\n${INTEL_SHAPES[data.kind]}`;
      const prompt = `Skill / node: ${data.node.title}
Description: ${data.node.description}
Subtopics: ${data.node.whatToLearn.join(", ")}
Prerequisites: ${data.node.prerequisites.join(", ") || "none"}
Estimated effort: ${data.node.hours} hours
Learner level: ${data.level}`;
      const raw = await runJson(instructions, prompt);
      const parsed = intelSchemas[data.kind].parse(raw);
      return { ok: true, data: parsed };
    } catch (e) {
      if (e instanceof FriendlyError) return { ok: false, error: e.message };
      console.error("intel validation failed", e);
      return { ok: false, error: "The AI response didn't pass validation. Please try again." };
    }
  });
