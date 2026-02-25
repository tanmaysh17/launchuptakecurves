export function PersistencyBrandLogo() {
  return (
    <div className="inline-flex items-center gap-3">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-label="Persistency Curve logo">
        <rect x="1" y="1" width="32" height="32" rx="8" fill="rgb(var(--app-elevated))" stroke="rgb(var(--app-border))" />
        {/* Step-down KM-style survival curve */}
        <path d="M8 10 L13 10 L13 15 L18 15 L18 20 L23 20 L23 25 L26 25" fill="none" stroke="rgb(var(--app-accent))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="10" r="2" fill="rgb(var(--app-accent))" />
      </svg>
      <div>
        <div className="font-chrome text-[11px] uppercase tracking-[0.12em] text-app-muted">Persistency Curve</div>
        <div className="text-sm font-semibold text-app-text">Designer</div>
      </div>
    </div>
  );
}
