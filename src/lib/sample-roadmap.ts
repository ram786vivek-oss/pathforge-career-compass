import type { Roadmap, RoadmapNode } from "./roadmap-schema";

// Offline fallback ONLY — used when the AI service is unavailable and the user opts in.
const n = (p: Partial<RoadmapNode> & Pick<RoadmapNode, "id" | "title" | "category" | "phase">): RoadmapNode => ({
  type: "skill",
  dependencies: [],
  estimatedHours: 30,
  priority: "high",
  optional: false,
  initiallyKnown: false,
  description: "",
  whyImportant: "",
  whatToLearn: [],
  recommendedProject: "",
  ...p,
});

export const SAMPLE_ROADMAP: Roadmap = {
  target: {
    role: "Quantitative Researcher",
    industry: "Systematic Investing / Hedge Fund",
    summary: "Designs, tests and refines statistical trading signals. Spends most days on data, hypotheses and rigorous backtests.",
  },
  phases: [
    { index: 1, title: "Foundations", description: "Math and programming core" },
    { index: 2, title: "Statistical toolkit", description: "Probability, inference and data" },
    { index: 3, title: "Quant methods", description: "Time series and stochastic models" },
    { index: 4, title: "Proof of skill", description: "Research projects" },
    { index: 5, title: "Interview", description: "Readiness" },
  ],
  nodes: [
    n({ id: "calculus", title: "Calculus", category: "Mathematics", phase: 1, estimatedHours: 30, initiallyKnown: true, whatToLearn: ["Multivariable calculus", "Taylor expansions", "Optimisation conditions"] }),
    n({ id: "linear-algebra", title: "Linear Algebra", category: "Mathematics", phase: 1, estimatedHours: 35, initiallyKnown: true, whatToLearn: ["Eigendecomposition", "SVD", "Projections"] }),
    n({ id: "python", title: "Python", category: "Programming", phase: 1, estimatedHours: 30, initiallyKnown: true, whatToLearn: ["Idiomatic Python", "Testing", "Packaging"] }),
    n({ id: "numpy-pandas", title: "NumPy & Pandas", category: "Programming", phase: 2, dependencies: ["python", "linear-algebra"], estimatedHours: 30, whatToLearn: ["Vectorisation", "Time-indexed frames", "Joins & resampling"], recommendedProject: "Equity Returns Data Pipeline" }),
    n({ id: "probability", title: "Probability", category: "Probability", phase: 2, dependencies: ["calculus"], estimatedHours: 45, priority: "critical", whatToLearn: ["Random variables", "Conditional expectation", "Limit theorems"], whyImportant: "Every signal and risk model is a probabilistic statement." }),
    n({ id: "statistics", title: "Statistical Inference", category: "Statistics", phase: 2, dependencies: ["probability"], estimatedHours: 45, priority: "critical", whatToLearn: ["MLE", "Hypothesis testing", "Multiple testing"] }),
    n({ id: "regression", title: "Regression & ML", category: "Statistics", phase: 3, dependencies: ["statistics", "numpy-pandas"], estimatedHours: 50, whatToLearn: ["OLS & regularisation", "Cross-validation", "Gradient boosting"] }),
    n({ id: "time-series", title: "Time Series", category: "Quant Finance", phase: 3, dependencies: ["statistics", "numpy-pandas"], estimatedHours: 40, priority: "critical", whatToLearn: ["Stationarity", "ARMA/GARCH", "Cointegration"] }),
    n({ id: "stochastic", title: "Stochastic Processes", category: "Quant Finance", phase: 3, dependencies: ["probability", "calculus"], estimatedHours: 40, whatToLearn: ["Markov chains", "Brownian motion", "Martingales", "Itô calculus"], recommendedProject: "Monte Carlo Option Pricing Engine" }),
    n({ id: "optimization", title: "Optimization", category: "Mathematics", phase: 3, dependencies: ["linear-algebra", "calculus"], estimatedHours: 30, priority: "medium", whatToLearn: ["Convex optimisation", "Mean-variance", "Constraints"] }),
    n({ id: "market-micro", title: "Market Microstructure", category: "Quant Finance", phase: 3, dependencies: ["time-series"], estimatedHours: 25, priority: "low", optional: true }),
    n({ id: "deep-learning", title: "Deep Learning", category: "Statistics", phase: 3, dependencies: ["regression"], estimatedHours: 50, priority: "low", optional: true }),
    n({ id: "backtesting", title: "Backtesting", category: "Research", phase: 4, dependencies: ["time-series", "regression"], estimatedHours: 35, priority: "critical", whatToLearn: ["Look-ahead bias", "Transaction costs", "Walk-forward"] }),
    n({ id: "proj-momentum", title: "Momentum Signal Study", type: "project", category: "Research", phase: 4, dependencies: ["backtesting"], estimatedHours: 40 }),
    n({ id: "proj-mc", title: "Monte Carlo Pricer", type: "project", category: "Quant Finance", phase: 4, dependencies: ["stochastic", "numpy-pandas"], estimatedHours: 30, priority: "medium" }),
    n({ id: "proj-portfolio", title: "Portfolio Optimizer", type: "project", category: "Research", phase: 4, dependencies: ["optimization", "backtesting"], estimatedHours: 35, priority: "medium", optional: true }),
    n({ id: "cqf", title: "CQF Certificate", type: "certification", category: "Quant Finance", phase: 4, dependencies: ["stochastic"], estimatedHours: 60, priority: "low", optional: true }),
    n({ id: "interview-ready", title: "Interview Ready", type: "milestone", category: "Research", phase: 5, dependencies: ["proj-momentum", "proj-mc"], estimatedHours: 25, priority: "critical" }),
    n({ id: "target", title: "Quantitative Researcher", type: "role", category: "Research", phase: 5, dependencies: ["interview-ready"], estimatedHours: 0, priority: "critical" }),
  ],
  intermediateRoles: [
    { title: "Quant Research Intern", description: "Summer research internship", afterPhase: 3 },
    { title: "Data Analyst, Trading", description: "Bridge role close to the desk", afterPhase: 2 },
  ],
  certifications: [{ name: "CQF", value: "Structured derivatives & stochastic calculus", optional: true }],
};
