"use client";

const STEPS = [
  { num: 1, label: "Seleção" },
  { num: 2, label: "Diagnóstico" },
  { num: 3, label: "Preview YAML" },
  { num: 4, label: "Sucesso" },
];

interface StepIndicatorProps {
  current: number;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((step, i) => {
        const is_done = current > step.num;
        const is_active = current === step.num;

        return (
          <div key={step.num} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  is_done
                    ? "bg-success text-success-foreground"
                    : is_active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {is_done ? "✓" : step.num}
              </div>
              <span
                className={`text-[10px] ${
                  is_active ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 mt-[-14px] ${
                  is_done ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
