import type { PropsWithChildren } from "react";

export function SectionLabel({ children }: PropsWithChildren) {
  return (
    <div className="mb-2 font-chrome text-[11px] uppercase tracking-[0.1em] text-app-muted">
      {children}
    </div>
  );
}
