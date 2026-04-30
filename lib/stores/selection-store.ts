import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ProductGroup, ProductSeries, Model } from '@/types/product';
import type { ProjectInfoFormData, DesignConditionsFormData, SelectionBasis, VRFLayout, VRFIndoorType } from '@/types/selection';

/** Key in vrfOptionsByUnit: 'odu' for the outdoor unit, otherwise a room id (indoor unit). */
export type VRFUnitKey = 'odu' | string;

interface SelectionState {
  step: number;
  selectionBasis: SelectionBasis | null;
  selectedGroup: ProductGroup | null;
  selectedSeries: ProductSeries | null;
  projectInfo: ProjectInfoFormData | null;
  designConditions: DesignConditionsFormData | null;
  selectedModels: Model[];
  selectedOptions: string[];
  /** Per-unit option selections for VRF. Key is 'odu' or a room id. */
  vrfOptionsByUnit: Record<string, string[]>;
  vrfLayout: VRFLayout | null;
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
  setVRFLayout: (layout: VRFLayout) => void;
  setVRFRoomIndoorType: (roomId: string, indoorType: VRFIndoorType) => void;
  setVRFRoomCapacity: (roomId: string, capacity: number) => void;
  confirmVRFDesign: () => void;
  toggleModelSelection: (model: Model) => void;
  toggleOption: (optionId: string) => void;
  toggleVRFUnitOption: (unitKey: VRFUnitKey, optionId: string) => void;
  /** Replace every indoor unit's selections with the source room's selections. */
  applyVRFIndoorOptionsToAll: (sourceRoomId: string, indoorRoomIds: string[]) => void;
  navigateBack: (toStep: number) => void;
  setRevisionTarget: (projectId: string, unitId: string) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  selectionBasis: 'capacity' as SelectionBasis | null,
  selectedGroup: null,
  selectedSeries: null,
  projectInfo: null,
  designConditions: null,
  selectedModels: [],
  selectedOptions: [],
  vrfOptionsByUnit: {} as Record<string, string[]>,
  vrfLayout: null,
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
        selectedSeries: null,
        designConditions: null,
        selectedModels: [],
        selectedOptions: [],
        vrfOptionsByUnit: {},
        vrfLayout: null,
        step: 3,
      }),

      setVRFLayout: (layout) => set({
        vrfLayout: layout,
        step: 4,
      }),

      setVRFRoomIndoorType: (roomId, indoorType) => set((state) => {
        if (!state.vrfLayout) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            floors: state.vrfLayout.floors.map((f) => ({
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === roomId
                  ? { ...r, indoorType, capacity: r.indoorType === indoorType ? r.capacity : undefined }
                  : r
              ),
            })),
          },
        };
      }),

      setVRFRoomCapacity: (roomId, capacity) => set((state) => {
        if (!state.vrfLayout) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            floors: state.vrfLayout.floors.map((f) => ({
              ...f,
              rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, capacity } : r)),
            })),
          },
        };
      }),

      confirmVRFDesign: () => set((state) => {
        if (!state.vrfLayout) return { step: 5 };
        const totalKbtuh = state.vrfLayout.floors
          .flatMap((f) => f.rooms)
          .reduce((sum, r) => sum + (r.capacity ?? 0), 0);
        // VRF doesn't have a single entering-DB/WB the way chillers/fan coils do —
        // synthesize standard indoor cooling design conditions so step 7 has the
        // metadata the PDF expects.
        const designConditions: DesignConditionsFormData = {
          requiredCoolingCapacityBtuh: totalKbtuh * 1000,
          powerSupply: '380V/3Ph/60Hz',
          enteringDBF: 80,
          enteringWBF: 67,
          espInWG: 0,
          altitudeFt: 0,
        };
        return { step: 5, designConditions };
      }),

      setSelectedSeries: (series) => set({
        selectedSeries: series,
        designConditions: null,
        selectedModels: [],
        selectedOptions: [],
        step: 4,
      }),

      setDesignConditions: (conditions) => set({
        designConditions: conditions,
        selectedModels: [],
        step: 5,
      }),

      toggleModelSelection: (model) => set((state) => {
        const exists = state.selectedModels.some(m => m.id === model.id);
        return {
          selectedModels: exists ? [] : [model],
        };
      }),

      toggleOption: (optionId) => set((state) => ({
        selectedOptions: state.selectedOptions.includes(optionId)
          ? state.selectedOptions.filter(id => id !== optionId)
          : [...state.selectedOptions, optionId],
      })),

      toggleVRFUnitOption: (unitKey, optionId) => set((state) => {
        const current = state.vrfOptionsByUnit[unitKey] ?? [];
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return {
          vrfOptionsByUnit: { ...state.vrfOptionsByUnit, [unitKey]: next },
        };
      }),

      applyVRFIndoorOptionsToAll: (sourceRoomId, indoorRoomIds) => set((state) => {
        const source = state.vrfOptionsByUnit[sourceRoomId] ?? [];
        const next = { ...state.vrfOptionsByUnit };
        for (const id of indoorRoomIds) {
          next[id] = [...source];
        }
        return { vrfOptionsByUnit: next };
      }),

      navigateBack: (toStep) => set(() => {
        // Step order: 1=ProjectInfo, 2=Group, 3=Series, 4=Design, 5=Results, 6=Options, 7=Submittal
        // Preserve user-entered data (projectInfo, designConditions, selectionBasis).
        // setSelectedGroup / setSelectedSeries already clear designConditions if the
        // user actually picks a different group or series after going back.
        const updates: Partial<SelectionState> = { step: toStep };
        if (toStep <= 1) {
          updates.selectedGroup = null;
          updates.selectedSeries = null;
          updates.selectedModels = [];
          updates.selectedOptions = [];
          updates.vrfOptionsByUnit = {};
          updates.vrfLayout = null;
          updates.addUnitTargetProjectId = null;
        } else if (toStep <= 2) {
          updates.selectedGroup = null;
          updates.selectedSeries = null;
          updates.selectedModels = [];
          updates.selectedOptions = [];
          updates.vrfOptionsByUnit = {};
          updates.vrfLayout = null;
        } else if (toStep <= 3) {
          updates.selectedSeries = null;
          updates.selectedModels = [];
          updates.selectedOptions = [];
          updates.vrfOptionsByUnit = {};
          updates.vrfLayout = null;
        } else if (toStep <= 4) {
          updates.selectedModels = [];
          updates.selectedOptions = [];
          updates.vrfOptionsByUnit = {};
        } else if (toStep <= 5) {
          updates.selectedModels = [];
          updates.selectedOptions = [];
          updates.vrfOptionsByUnit = {};
        } else if (toStep <= 6) {
          updates.selectedOptions = [];
          updates.vrfOptionsByUnit = {};
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
      version: 3,
      migrate: () => initialState,
    }
    ),
    { name: 'SelectionStore' }
  )
);
