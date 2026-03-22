"use client";

import { useKnowledgeStore } from "@/lib/store";
import { StepIndicator } from "./step-indicator";
import { StepSelection } from "./step-selection";
import { StepDiagnostic } from "./step-diagnostic";
import { StepPreview } from "./step-preview";
import { StepSuccess } from "./step-success";

export function KnowledgeView() {
  const { step, setStep } = useKnowledgeStore();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <StepIndicator current={step} />
      {step === 1 && <StepSelection on_next={() => setStep(2)} />}
      {step === 2 && (
        <StepDiagnostic on_next={() => setStep(3)} on_back={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepPreview on_next={() => setStep(4)} on_back={() => setStep(2)} />
      )}
      {step === 4 && <StepSuccess />}
    </div>
  );
}
