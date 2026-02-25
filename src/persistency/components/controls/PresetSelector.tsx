import { useState } from "react";
import { PRESETS } from "../../lib/presets";
import type { Preset } from "../../types";
import { SectionLabel } from "../../../components/ui/SectionLabel";

interface PresetSelectorProps {
  activePresetId: string | null;
  onSelect: (preset: Preset) => void;
}

export function PresetSelector({ activePresetId, onSelect }: PresetSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const active = PRESETS.find((p) => p.id === activePresetId);

  return (
    <div>
      <SectionLabel>Presets</SectionLabel>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full rounded border border-app-border bg-app-surface px-3 py-2 text-left font-chrome text-xs text-app-text outline-none hover:border-app-accent transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={active ? "text-app-accent" : "text-app-muted"}>
            {active ? active.label : "Select a preset..."}
          </span>
          <span className="text-app-muted text-[10px]">{expanded ? "[-]" : "[+]"}</span>
        </div>
      </button>

      {active && !expanded && (
        <p className="mt-1.5 text-[11px] text-app-muted leading-snug">{active.description}</p>
      )}

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {PRESETS.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onSelect(preset);
                  setExpanded(false);
                }}
                className={`w-full rounded border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-app-accent bg-app-accent/10"
                    : "border-app-border bg-app-surface hover:border-app-accent/50 hover:bg-app-elevated"
                }`}
              >
                <div className={`font-chrome text-xs ${isActive ? "text-app-accent" : "text-app-text"}`}>
                  {preset.label}
                </div>
                <div className="mt-0.5 text-[11px] text-app-muted leading-snug">{preset.description}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
