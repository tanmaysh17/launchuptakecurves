import clsx from "clsx";
import { MODEL_LABELS, MODEL_ORDER } from "../../lib/models";
import type { ModelType } from "../../types";
import { SectionLabel } from "../ui/SectionLabel";

interface ModelSelectorProps {
  activeModel: ModelType;
  onSelect: (model: ModelType) => void;
}

const SHORT_HELPER: Record<ModelType, string> = {
  logistic: "Symmetric S",
  gompertz: "Early inflection",
  richards: "Flexible master",
  bass: "Innovation + imitation",
  linear: "Conservative baseline"
};

export function ModelSelector({ activeModel, onSelect }: ModelSelectorProps) {
  return (
    <div>
      <SectionLabel>Curve Model</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {MODEL_ORDER.map((model) => (
          <button
            key={model}
            type="button"
            onClick={() => onSelect(model)}
            className={clsx(
              "rounded-panel border px-3 py-2 text-left transition-all",
              activeModel === model
                ? "border-app-accent bg-[rgb(var(--app-accent)/0.08)]"
                : "border-app-border bg-app-surface hover:border-app-muted"
            )}
          >
            <div className="font-chrome text-xs uppercase tracking-[0.08em] text-app-text">{MODEL_LABELS[model]}</div>
            <div className="mt-1 text-[11px] text-app-muted">{SHORT_HELPER[model]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
