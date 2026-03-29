"use client";

import { Fragment, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectionStore } from "@/lib/stores/selection-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 1, label: "Project Info" },
  { id: 2, label: "Group" },
  { id: 3, label: "Series" },
  { id: 4, label: "Design Conditions" },
  { id: 5, label: "Results" },
  { id: 6, label: "Options" },
  { id: 7, label: "Submittal" },
];

export function SelectionStepper() {
  const { step, navigateBack, setStep, selectedSeries, projectInfo, selectedGroup, designConditions, selectedModel } = useSelectionStore();
  const [pendingStep, setPendingStep] = useState<number | null>(null);

  // Determine the highest step the user can navigate to based on completed data
  const maxReachableStep = (() => {
    if (!projectInfo) return 1;
    if (!selectedGroup) return 2;
    if (!selectedSeries) return 3;
    if (!designConditions) return 4;
    if (!selectedModel) return 5;
    return 7; // all data filled
  })();

  const handleStepClick = (targetStep: number) => {
    if (targetStep === step) return; // already on this step
    if (targetStep > step) {
      // Going forward — just set step directly (data already exists)
      setStep(targetStep);
    } else if (step >= 5 && targetStep < step) {
      // Going back from results+ — confirm
      setPendingStep(targetStep);
    } else {
      navigateBack(targetStep);
    }
  };

  return (
    <>
      <div className="w-full bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="overflow-x-auto">
          <div className="flex items-center px-4 sm:px-6 py-3 min-w-[520px]">
            {selectedSeries && (
              <span className="mr-4 px-3 py-1 rounded-full bg-[#0057B8]/10 text-[#0057B8] text-xs font-bold tracking-wide shrink-0">
                {selectedSeries.name}
              </span>
            )}
            {STEPS.map((s, i) => {
              const isCompleted = step > s.id;
              const isActive = step === s.id;
              const canClick = s.id <= maxReachableStep && s.id !== step;

              return (
                <Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => canClick && handleStepClick(s.id)}
                      disabled={!canClick}
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all",
                        isCompleted
                          ? "bg-gray-800 text-white cursor-pointer hover:bg-gray-700"
                          : isActive
                          ? "bg-[#0057B8] text-white"
                          : canClick
                          ? "bg-gray-200 text-gray-600 cursor-pointer hover:bg-gray-300"
                          : "bg-gray-100 text-gray-400 cursor-default"
                      )}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                    </button>
                    <span className={cn(
                      "text-[10px] font-medium whitespace-nowrap hidden sm:block",
                      isActive
                        ? "text-[#0057B8]"
                        : isCompleted
                        ? "text-gray-600"
                        : canClick
                        ? "text-gray-600"
                        : "text-gray-400"
                    )}>
                      {s.label}
                    </span>
                  </div>

                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-px mx-2 rounded-full transition-colors duration-300",
                      isCompleted ? "bg-gray-300" : "bg-gray-100"
                    )} />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={pendingStep !== null} onOpenChange={(open) => !open && setPendingStep(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Go back to Step {pendingStep}?</DialogTitle>
            <DialogDescription>
              Going back will clear your model selection and any options you have configured. Your project info and design conditions will be kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingStep(null)}>Cancel</Button>
            <Button
              className="bg-[#0057B8] hover:bg-[#0057B8]/90"
              onClick={() => {
                if (pendingStep !== null) navigateBack(pendingStep);
                setPendingStep(null);
              }}
            >
              Go Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
