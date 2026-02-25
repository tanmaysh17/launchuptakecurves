import clsx from "clsx";

type Module = "uptake" | "persistency";

interface AppNavProps {
  active: Module;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  rightActions?: React.ReactNode;
}

const MODULES: { key: Module; label: string; href: string }[] = [
  { key: "uptake", label: "Launch Uptake Modeler", href: "./" },
  { key: "persistency", label: "Persistency Curve Designer", href: "./persistency.html" }
];

export function AppNav({ active, theme, onToggleTheme, rightActions }: AppNavProps) {
  return (
    <nav className="mb-4 flex items-center justify-between gap-4">
      {/* Left — module tabs */}
      <div className="inline-flex items-center rounded-panel border border-app-border bg-app-surface p-1">
        {MODULES.map((mod) => (
          <a
            key={mod.key}
            href={mod.href}
            className={clsx(
              "rounded-md px-4 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] transition-colors",
              active === mod.key
                ? "bg-app-elevated text-app-accent shadow-[inset_0_-2px_0_0_rgb(var(--app-accent))]"
                : "text-app-muted hover:text-app-text"
            )}
          >
            {mod.label}
          </a>
        ))}
      </div>

      {/* Right — utility buttons */}
      <div className="flex items-center gap-2">
        {rightActions}
        <button
          onClick={onToggleTheme}
          className="rounded border border-app-border px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] text-app-text hover:border-app-accent hover:text-app-accent"
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </div>
    </nav>
  );
}
