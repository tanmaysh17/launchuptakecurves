import clsx from "clsx";

interface PillTabOption<T extends string> {
  key: T;
  label: string;
}

interface PillTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<PillTabOption<T>>;
  fullWidth?: boolean;
  large?: boolean;
}

export function PillTabs<T extends string>({ value, onChange, options, fullWidth = false, large = false }: PillTabsProps<T>) {
  return (
    <div className={clsx("inline-flex rounded-panel border border-app-border bg-app-surface p-1", fullWidth && "w-full")}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={clsx(
            "rounded-md px-3 py-1.5 font-chrome uppercase tracking-[0.08em] transition-colors",
            fullWidth && "flex-1",
            large ? "text-[13px]" : "text-[11px]",
            value === option.key
              ? "bg-app-elevated text-app-accent shadow-[inset_0_-2px_0_0_rgb(var(--app-accent))]"
              : "text-app-muted hover:text-app-text"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
