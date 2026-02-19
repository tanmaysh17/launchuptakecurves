import { PillTabs } from "../ui/PillTabs";
import { SectionLabel } from "../ui/SectionLabel";
import { InfoHint } from "../ui/InfoHint";
import type { CoreParams, OutputUnit, TimeUnit } from "../../types";

interface DisplayControlsProps {
  core: CoreParams;
  onSetCore: (key: keyof CoreParams, value: number | string | null) => void;
}

export function DisplayControls({ core, onSetCore }: DisplayControlsProps) {
  return (
    <div className="space-y-3">
      <SectionLabel>Display Controls</SectionLabel>
      <div className="rounded-panel border border-app-border bg-app-surface/60 px-3 py-3">
        <div className="mb-2 flex items-center text-[13px] font-medium tracking-[0.01em] text-app-text/90">
          Time Unit
          <InfoHint text="Controls labels and reporting language (Month/Week). It does not rescale model shape." />
        </div>
        <PillTabs<TimeUnit>
          value={core.timeUnit}
          onChange={(value) => onSetCore("timeUnit", value)}
          options={[
            { key: "months", label: "Months" },
            { key: "weeks", label: "Weeks" }
          ]}
        />
      </div>

      <div className="rounded-panel border border-app-border bg-app-surface/60 px-3 py-3">
        <div className="mb-2 flex items-center text-[13px] font-medium tracking-[0.01em] text-app-text/90">
          Output Units
          <InfoHint text="Percent shows penetration. Volume multiplies penetration by TAM to show absolute units." />
        </div>
        <PillTabs<OutputUnit>
          value={core.outputUnit}
          onChange={(value) => onSetCore("outputUnit", value)}
          options={[
            { key: "percent", label: "Percent" },
            { key: "volume", label: "Volume" }
          ]}
        />
        {core.outputUnit === "volume" && (
          <label className="mt-3 block">
            <span className="mb-1 flex items-center text-[13px] font-medium tracking-[0.01em] text-app-text/90">
              Total Addressable Market
              <InfoHint text="Estimated total eligible users/accounts/units. Volume outputs are computed as penetration% x TAM." />
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={core.tam ?? ""}
              onChange={(event) => onSetCore("tam", event.target.value ? Number(event.target.value) : null)}
              placeholder="Enter TAM"
              className="w-full rounded-panel border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-muted focus:border-app-accent"
            />
          </label>
        )}
      </div>
    </div>
  );
}
