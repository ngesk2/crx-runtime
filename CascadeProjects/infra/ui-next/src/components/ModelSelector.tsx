"use client";

import { OllamaModel } from "@/types";

interface Props {
  models: OllamaModel[];
  config: { model: string };
  onChange: (model: string) => void;
  loading?: boolean;
}

export default function ModelSelector({ models, config, onChange, loading }: Props) {
  return (
    <div className="model-selector">
      <select
        value={config.model}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || models.length === 0}
      >
        {models.length === 0 ? (
          <option value="">No models available</option>
        ) : (
          models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
