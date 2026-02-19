import type { PropsWithChildren } from "react";

export function SectionLabel({ children }: PropsWithChildren) {
  return (
    <div className="mb-2 text-[13px] font-semibold tracking-[0.01em] text-app-text/90">
      {children}
    </div>
  );
}
