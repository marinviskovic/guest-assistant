export function LanternMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2.5a3 3 0 0 1 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 9.5h12l-2-3.5h-8z" fill="currentColor" />
      <rect x="10.5" y="10.5" width="11" height="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="13.5" y="13.5" width="5" height="7" rx="2.5" fill="var(--color-lantern)" />
      <path d="M9 25.5h14v2.5H9z" fill="currentColor" />
    </svg>
  );
}
