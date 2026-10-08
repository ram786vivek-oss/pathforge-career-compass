import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-[0.18em]">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-primary">
        <circle cx="5" cy="19" r="2.5" fill="currentColor" />
        <circle cx="19" cy="5" r="2.5" fill="currentColor" />
        <circle cx="19" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 19 C 5 10, 12 5, 19 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M19 5 L19 15" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
      PATHFORGE<span className="text-primary">AI</span>
    </Link>
  );
}
