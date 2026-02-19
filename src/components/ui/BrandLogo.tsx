export function BrandLogo() {
  return (
    <div className="inline-flex items-center gap-3">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-label="Launch Uptake logo">
        <rect x="1" y="1" width="32" height="32" rx="8" fill="rgb(var(--app-elevated))" stroke="rgb(var(--app-border))" />
        <path d="M8 22 L14 16 L19 19 L26 11" fill="none" stroke="rgb(var(--app-accent))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="26" cy="11" r="2.2" fill="rgb(var(--app-accent))" />
      </svg>
      <div>
        <div className="font-chrome text-[11px] uppercase tracking-[0.12em] text-app-muted">Launch Uptake</div>
        <div className="text-sm font-semibold text-app-text">Modeler</div>
      </div>
    </div>
  );
}
