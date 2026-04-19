"use client";

import { useSelectionStore } from "@/lib/stores/selection-store";
import { SelectionStepper } from "@/components/selection/SelectionStepper";
import { ProductGroupGrid } from "@/components/selection/ProductGroupGrid";
import { SeriesGrid } from "@/components/selection/SeriesGrid";
import { VRFLayoutBuilder } from "@/components/selection/VRFLayoutBuilder";
import { VRFDesignConditions } from "@/components/selection/VRFDesignConditions";
import { ProjectInfoForm } from "@/components/selection/ProjectInfoForm";
import { DesignConditionsForm } from "@/components/selection/DesignConditionsForm";
import { ResultsTable } from "@/components/selection/ResultsTable";
import { OptionsConfigurator } from "@/components/selection/OptionsConfigurator";
import { SubmittalPreview } from "@/components/selection/SubmittalPreview";
import { AnimatePresence, motion } from "framer-motion";

const STEP_COMPONENTS = [
  ProjectInfoForm,     // 1 - Project Info
  ProductGroupGrid,    // 2 - Group
  SeriesGrid,          // 3 - Series (or Layout for VRF)
  DesignConditionsForm, // 4 - Design Conditions
  ResultsTable,        // 5 - Results
  OptionsConfigurator, // 6 - Options
  SubmittalPreview,    // 7 - Submittal
];

export default function SelectPage() {
  const { step, selectedGroup } = useSelectionStore();
  const isVRF = selectedGroup?.id === 'vrf';
  const StepComponent =
    isVRF && step === 3
      ? VRFLayoutBuilder
      : isVRF && step === 4
      ? VRFDesignConditions
      : (STEP_COMPONENTS[step - 1] ?? ProductGroupGrid);

  return (
    <div className="min-h-full flex flex-col">
      <div className="-mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
        <SelectionStepper />
      </div>
      <div className="flex-1 pt-4 sm:pt-6">
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
