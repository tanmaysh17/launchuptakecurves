import clsx from "clsx";

interface PillTabOption<T extends string> {
  key: T;
  label: string;
}

interface PillTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<PillTabOption<T>>;
}

export function PillTabs<T extends string>({ value, onChange, options }: PillTabsProps<T>) {
  return (
    <div className="inline-flex rounded-panel border border-app-border bg-app-surface p-1">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={clsx(
            "rounded-md px-3 py-1.5 font-chrome text-[11px] uppercase tracking-[0.08em] transition-colors",
            value === option.key
              ? "bg-app-elevated text-app-accent shadow-[inset_0_-2px_0_0_#00d4b4]"
              : "text-app-muted hover:text-app-text"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
