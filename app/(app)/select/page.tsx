"use client";

import { useSelectionStore } from "@/lib/stores/selection-store";
import { SelectionStepper } from "@/components/selection/SelectionStepper";
import { ProductGroupGrid } from "@/components/selection/ProductGroupGrid";
import { SeriesGrid } from "@/components/selection/SeriesGrid";
import { ProjectInfoForm } from "@/components/selection/ProjectInfoForm";
import { DesignConditionsForm } from "@/components/selection/DesignConditionsForm";
import { ResultsTable } from "@/components/selection/ResultsTable";
import { OptionsConfigurator } from "@/components/selection/OptionsConfigurator";
import { SubmittalPreview } from "@/components/selection/SubmittalPreview";
import { AnimatePresence, motion } from "framer-motion";

const STEP_COMPONENTS = [
  ProductGroupGrid,
  SeriesGrid,
  ProjectInfoForm,
  DesignConditionsForm,
  ResultsTable,
  OptionsConfigurator,
  SubmittalPreview,
];

export default function SelectPage() {
  const { step } = useSelectionStore();
  const StepComponent = STEP_COMPONENTS[step - 1] ?? ProductGroupGrid;

  return (
    <div className="min-h-full flex flex-col -m-6">
      <SelectionStepper />
      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
