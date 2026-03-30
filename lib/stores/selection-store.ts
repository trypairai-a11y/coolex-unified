import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ProductGroup, ProductSeries, Model } from '@/types/product';
import type { ProjectInfoFormData, DesignConditionsFormData, SelectionBasis } from '@/types/selection';

interface SelectionState {
  step: number;
  selectionBasis: SelectionBasis | null;
  selectedGroup: ProductGroup | null;
  selectedSeries: ProductSeries | null;
  projectInfo: ProjectInfoFormData | null;
  designConditions: DesignConditionsFormData | null;
  selectedModel: Model | null;
  selectedOptions: string[];
  revisionTargetProjectId: string | null;
  revisionTargetUnitId: string | null;
  addUnitTargetProjectId: string | null;

  setStep: (step: number) => void;
  setSelectionBasis: (basis: SelectionBasis) => void;
  setSelectedGroup: (group: ProductGroup) => void;
  setSelectedSeries: (series: ProductSeries) => void;
  setProjectInfo: (info: ProjectInfoFormData) => void;
  updateProjectInfo: (partial: Partial<ProjectInfoFormData>) => void;
  setDesignConditions: (conditions: DesignConditionsFormData) => void;
  setSelectedModel: (model: Model) => void;
  toggleOption: (optionId: string) => void;
  navigateBack: (toStep: number) => void;
  setRevisionTarget: (projectId: string, unitId: string) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  selectionBasis: null as SelectionBasis | null,
  selectedGroup: null,
  selectedSeries: null,
  projectInfo: null,
  designConditions: null,
  selectedModel: null,
  selectedOptions: [],
  revisionTargetProjectId: null,
  revisionTargetUnitId: null,
  addUnitTargetProjectId: null,
};

export const useSelectionStore = create<SelectionState>()(
  devtools(
    persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      setSelectionBasis: (basis) => set({ selectionBasis: basis }),

      setProjectInfo: (info) => set({
        projectInfo: info,
        step: 2, // → Group
      }),

      updateProjectInfo: (partial) => set((state) => ({
        projectInfo: state.projectInfo ? { ...state.projectInfo, ...partial } : null,
      })),

      setSelectedGroup: (group) => set({
        selectedGroup: group,
        // Reset subsequent steps but preserve projectInfo
        selectedSeries: null,
        designConditions: null,
        selectedModel: null,
        selectedOptions: [],
        step: 3, // → Series
      }),

      setSelectedSeries: (series) => set({
        selectedSeries: series,
        designConditions: null,
        selectedModel: null,
        selectedOptions: [],
        step: 4, // → Design Conditions
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
        // Step order: 1=ProjectInfo, 2=Group, 3=Series, 4=Design, 5=Results, 6=Options, 7=Submittal
        const updates: Partial<SelectionState> = { step: toStep };
        if (toStep <= 1) {
          // Back to Project Info - clear everything downstream
          updates.selectionBasis = null;
          updates.selectedGroup = null;
          updates.selectedSeries = null;
          updates.designConditions = null;
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 2) {
          // Back to Group - keep projectInfo, clear group + downstream
          updates.selectionBasis = null;
          updates.selectedGroup = null;
          updates.selectedSeries = null;
          updates.designConditions = null;
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 3) {
          // Back to Series - keep projectInfo + group, clear series + downstream
          updates.selectedSeries = null;
          updates.designConditions = null;
          updates.selectedModel = null;
          updates.selectedOptions = [];
        } else if (toStep <= 4) {
          // Back to Design Conditions - keep through series, clear design+
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
    {
      name: 'coolex-selection',
      version: 2,
      migrate: () => initialState,
    }
    ),
    { name: 'SelectionStore' }
  )
);
