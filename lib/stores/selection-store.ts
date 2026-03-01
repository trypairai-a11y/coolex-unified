import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ProductGroup, ProductSeries, Model } from '@/types/product';
import type { ProjectInfoFormData, DesignConditionsFormData } from '@/types/selection';

interface SelectionState {
  step: number;
  selectedGroup: ProductGroup | null;
  selectedSeries: ProductSeries | null;
  projectInfo: ProjectInfoFormData | null;
  designConditions: DesignConditionsFormData | null;
  selectedModel: Model | null;
  selectedOptions: string[];
  revisionTargetProjectId: string | null;
  revisionTargetUnitId: string | null;

  setStep: (step: number) => void;
  setSelectedGroup: (group: ProductGroup) => void;
  setSelectedSeries: (series: ProductSeries) => void;
  setProjectInfo: (info: ProjectInfoFormData) => void;
  setDesignConditions: (conditions: DesignConditionsFormData) => void;
  setSelectedModel: (model: Model) => void;
  toggleOption: (optionId: string) => void;
  navigateBack: (toStep: number) => void;
  setRevisionTarget: (projectId: string, unitId: string) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  selectedGroup: null,
  selectedSeries: null,
  projectInfo: null,
  designConditions: null,
  selectedModel: null,
  selectedOptions: [],
  revisionTargetProjectId: null,
  revisionTargetUnitId: null,
};

export const useSelectionStore = create<SelectionState>()(
  devtools(
    persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      setSelectedGroup: (group) => set({
        selectedGroup: group,
        // Reset all subsequent steps
        selectedSeries: null,
        projectInfo: null,
        designConditions: null,
        selectedModel: null,
        selectedOptions: [],
        step: 2,
      }),

      setSelectedSeries: (series) => set({
        selectedSeries: series,
        projectInfo: null,
        designConditions: null,
        selectedModel: null,
        selectedOptions: [],
        step: 3,
      }),

      setProjectInfo: (info) => set({
        projectInfo: info,
        step: 4,
      }),

      setDesignConditions: (conditions) => set({
        designConditions: conditions,
        selectedModel: null,
        step: 5,
      }),

      setSelectedModel: (model) => set({
        selectedModel: model,
        step: 6,
      }),

      toggleOption: (optionId) => set((state) => ({
        selectedOptions: state.selectedOptions.includes(optionId)
          ? state.selectedOptions.filter(id => id !== optionId)
          : [...state.selectedOptions, optionId],
      })),

      navigateBack: (toStep) => set((state) => {
        const updates: Partial<SelectionState> = { step: toStep };
        if (toStep <= 1) {
          updates.selectedGroup = null;
          updates.selectedSeries = null;
          updates.projectInfo = null;
          updates.designConditions = null;
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 2) {
          updates.selectedSeries = null;
          updates.projectInfo = null;
          updates.designConditions = null;
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 3) {
          updates.projectInfo = null;
          updates.designConditions = null;
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 4) {
          updates.designConditions = null;
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 5) {
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 6) {
          updates.selectedOptions = [];
        }
        return updates;
      }),

      setRevisionTarget: (projectId, unitId) => set({
        revisionTargetProjectId: projectId,
        revisionTargetUnitId: unitId,
      }),

      reset: () => set(initialState),
    }),
    { name: 'coolex-selection' }
    ),
    { name: 'SelectionStore' }
  )
);
