"use client";

import { useState } from "react";
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
  { id: 1, label: "Group" },
  { id: 2, label: "Series" },
  { id: 3, label: "Project Info" },
  { id: 4, label: "Design Conditions" },
  { id: 5, label: "Results" },
  { id: 6, label: "Options" },
  { id: 7, label: "Submittal" },
];

export function SelectionStepper() {
  const { step, navigateBack } = useSelectionStore();
  const [pendingStep, setPendingStep] = useState<number | null>(null);

  const handleStepClick = (targetStep: number) => {
    if (step >= 5 && targetStep < step) {
      setPendingStep(targetStep);
    } else {
      navigateBack(targetStep);
    }
  };

  return (
    <>
      <div className="w-full bg-background border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const isCompleted = step > s.id;
              const isActive = step === s.id;
              const canClick = isCompleted;

              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  {/* Node */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => canClick && handleStepClick(s.id)}
                      disabled={!canClick}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white cursor-pointer hover:bg-green-600"
                          : isActive
                          ? "bg-[#0057B8] border-[#0057B8] text-white shadow-md"
                          : "bg-background border-gray-200 text-gray-400 cursor-default"
                      )}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                    </button>
                    <span className={cn(
                      "text-xs font-medium whitespace-nowrap hidden sm:block",
                      isActive ? "text-[#0057B8]" : isCompleted ? "text-green-600" : "text-gray-400"
                    )}>
                      {s.label}
                    </span>
                  </div>

                  {/* Connector */}
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 mt-[-1rem] sm:mt-0",
                      step > s.id ? "bg-green-400" : "bg-gray-200"
                    )} />
                  )}
                </div>
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
