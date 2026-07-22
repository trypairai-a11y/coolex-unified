import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ProductGroup, ProductSeries, Model } from '@/types/product';
import type { ProjectInfoFormData, DesignConditionsFormData, SelectionBasis, VRFLayout, VRFIndoorType, VRFCanvasPos, VRFCustomPipe, VRFUnitId } from '@/types/selection';
import { floorRooms } from '@/types/selection';
import {
  pickVRFOutdoorCombination,
  synthesizeVRFOutdoorModels,
  vrfOutdoorUnitsFromCodes,
} from '@/lib/utils/vrf';
import { getModelsForSeries } from '@/lib/mock-data/models';

/** Fixed-speed vs inverter compressor sub-group (mini-split preset flow). */
export type MiniSplitSpeed = 'fixed' | 'inverter';

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
  /**
   * Mini-split preset flow: pick a fixed-speed / inverter sub-group of a
   * speed-variant series (e.g. Wall Mounted). There is no selection process —
   * a representative model and standard design conditions are preset and the
   * wizard jumps straight to the submittal step.
   */
  selectMiniSplitSubgroup: (series: ProductSeries, speed: MiniSplitSpeed) => void;
  setProjectInfo: (info: ProjectInfoFormData) => void;
  updateProjectInfo: (partial: Partial<ProjectInfoFormData>) => void;
  setDesignConditions: (conditions: DesignConditionsFormData) => void;
  setVRFLayout: (layout: VRFLayout) => void;
  setVRFRoomIndoorType: (roomId: string, indoorType: VRFIndoorType) => void;
  setVRFRoomCapacity: (roomId: string, capacity: number) => void;
  setVRFMainTrunkFt: (ft: number) => void;
  setVRFFloorSegFt: (floorId: string, ft: number) => void;
  setVRFBranchFt: (roomId: string, ft: number) => void;
  /** Set or clear (pos = null) a unit card's overridden top-left position. */
  setVRFUnitPosition: (unitId: VRFUnitId, pos: VRFCanvasPos | null) => void;
  setVRFLabelPosition: (labelId: string, pos: VRFCanvasPos | null) => void;
  addVRFCustomPipe: (pipe: VRFCustomPipe) => void;
  removeVRFCustomPipe: (pipeId: string) => void;
  setVRFCustomPipeLength: (pipeId: string, ft: number) => void;
  /** Hide a single auto-generated pipe segment by id (see VRFLayout.deletedAutoPipeIds). */
  deleteVRFAutoPipe: (pipeId: string) => void;
  /** Restore every auto-generated pipe the user has previously hidden. */
  restoreAllVRFAutoPipes: () => void;
  /** Resets pipe lengths, dragged positions, custom pipes, and hidden auto-pipes. */
  resetVRFLayout: () => void;
  /** Set the outdoor modules serving the system (1 or 2 nameplate codes). */
  setVRFOutdoorCodes: (codes: string[]) => void;
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

      setSelectedGroup: (group) => set((state) => {
        // Re-selecting the same group during a revision/edit shouldn't wipe
        // downstream choices the user is here to review.
        if (state.selectedGroup?.id === group.id) {
          return { selectedGroup: group, step: 3 };
        }
        return {
          selectedGroup: group,
          selectedSeries: null,
          designConditions: null,
          selectedModels: [],
          selectedOptions: [],
          vrfOptionsByUnit: {},
          vrfLayout: null,
          step: 3,
        };
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
              zones: f.zones.map((z) => ({
                ...z,
                rooms: z.rooms.map((r) =>
                  r.id === roomId
                    ? { ...r, indoorType, capacity: r.indoorType === indoorType ? r.capacity : undefined }
                    : r
                ),
              })),
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
              zones: f.zones.map((z) => ({
                ...z,
                rooms: z.rooms.map((r) => (r.id === roomId ? { ...r, capacity } : r)),
              })),
            })),
          },
        };
      }),

      setVRFMainTrunkFt: (ft) => set((state) => {
        if (!state.vrfLayout) return {};
        return { vrfLayout: { ...state.vrfLayout, mainTrunkFt: ft } };
      }),

      setVRFFloorSegFt: (floorId, ft) => set((state) => {
        if (!state.vrfLayout) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            floorSegFtById: { ...(state.vrfLayout.floorSegFtById ?? {}), [floorId]: ft },
          },
        };
      }),

      setVRFBranchFt: (roomId, ft) => set((state) => {
        if (!state.vrfLayout) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            branchFtById: { ...(state.vrfLayout.branchFtById ?? {}), [roomId]: ft },
          },
        };
      }),

      setVRFUnitPosition: (unitId, pos) => set((state) => {
        if (!state.vrfLayout) return {};
        const next = { ...(state.vrfLayout.unitPositions ?? {}) };
        if (pos === null) delete next[unitId];
        else next[unitId] = pos;
        return {
          vrfLayout: {
            ...state.vrfLayout,
            unitPositions: Object.keys(next).length > 0 ? next : undefined,
          },
        };
      }),

      setVRFLabelPosition: (labelId, pos) => set((state) => {
        if (!state.vrfLayout) return {};
        const next = { ...(state.vrfLayout.labelPositions ?? {}) };
        if (pos === null) delete next[labelId];
        else next[labelId] = pos;
        return {
          vrfLayout: {
            ...state.vrfLayout,
            labelPositions: Object.keys(next).length > 0 ? next : undefined,
          },
        };
      }),

      addVRFCustomPipe: (pipe) => set((state) => {
        if (!state.vrfLayout) return {};
        const existing = state.vrfLayout.customPipes ?? [];
        return {
          vrfLayout: {
            ...state.vrfLayout,
            customPipes: [...existing, pipe],
          },
        };
      }),

      removeVRFCustomPipe: (pipeId) => set((state) => {
        if (!state.vrfLayout?.customPipes) return {};
        const next = state.vrfLayout.customPipes.filter((p) => p.id !== pipeId);
        return {
          vrfLayout: {
            ...state.vrfLayout,
            customPipes: next.length > 0 ? next : undefined,
          },
        };
      }),

      setVRFCustomPipeLength: (pipeId, ft) => set((state) => {
        if (!state.vrfLayout?.customPipes) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            customPipes: state.vrfLayout.customPipes.map((p) =>
              p.id === pipeId ? { ...p, lengthFt: ft } : p
            ),
          },
        };
      }),

      deleteVRFAutoPipe: (pipeId) => set((state) => {
        if (!state.vrfLayout) return {};
        const existing = state.vrfLayout.deletedAutoPipeIds ?? [];
        if (existing.includes(pipeId)) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            deletedAutoPipeIds: [...existing, pipeId],
          },
        };
      }),

      restoreAllVRFAutoPipes: () => set((state) => {
        if (!state.vrfLayout?.deletedAutoPipeIds) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            deletedAutoPipeIds: undefined,
          },
        };
      }),

      resetVRFLayout: () => set((state) => {
        if (!state.vrfLayout) return {};
        return {
          vrfLayout: {
            ...state.vrfLayout,
            mainTrunkFt: undefined,
            floorSegFtById: undefined,
            branchFtById: undefined,
            unitPositions: undefined,
            labelPositions: undefined,
            customPipes: undefined,
            deletedAutoPipeIds: undefined,
          },
        };
      }),

      setVRFOutdoorCodes: (codes) => set((state) => {
        if (!state.vrfLayout) return {};
        return { vrfLayout: { ...state.vrfLayout, outdoorCodes: codes } };
      }),

      confirmVRFDesign: () => set((state) => {
        if (!state.vrfLayout) return { step: 5 };
        const totalKbtuh = state.vrfLayout.floors
          .flatMap((f) => floorRooms(f))
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
        // Hydrate selectedModels with the synthesized outdoor module(s) here
        // (rather than relying on a useEffect inside the system-diagram step) so
        // that the submittal step always has a model — even if the user
        // navigates forward without the diagram component getting a chance to
        // mount. A manifolded bank contributes one model per module.
        const stored = state.vrfLayout.outdoorCodes ?? [];
        const units = stored.length > 0
          ? vrfOutdoorUnitsFromCodes(stored)
          : pickVRFOutdoorCombination(totalKbtuh);
        return { step: 5, designConditions, selectedModels: synthesizeVRFOutdoorModels(units) };
      }),

      setSelectedSeries: (series) => set((state) => {
        if (state.selectedSeries?.id === series.id) {
          return { selectedSeries: series, step: 4 };
        }
        return {
          selectedSeries: series,
          designConditions: null,
          selectedModels: [],
          selectedOptions: [],
          step: 4,
        };
      }),

      selectMiniSplitSubgroup: (series, speed) => set(() => {
        const models = getModelsForSeries(series.id);
        // Representative preset unit — a 2-ton mid-range model when available.
        const preset =
          models.find((m) => m.nominalTons === 2)
          ?? models[Math.floor(models.length / 2)]
          ?? models[0];
        if (!preset) return {};

        const speedLabel = speed === 'inverter' ? 'Inverter' : 'Fixed Speed';
        const labeledSeries: ProductSeries = {
          ...series,
          name: `${series.name} · ${speedLabel}`,
        };
        const presetModel: Model = { ...preset, compressorType: speedLabel };
        const designConditions: DesignConditionsFormData = {
          requiredCoolingCapacityBtuh: presetModel.totalCapacityBtuh,
          powerSupply: '220V/1Ph/60Hz',
          enteringDBF: 80,
          enteringWBF: 67,
          espInWG: 0,
          altitudeFt: 0,
        };
        return {
          selectedSeries: labeledSeries,
          selectedModels: [presetModel],
          selectedOptions: [],
          designConditions,
          step: 7, // → Submittal (skip design/results/options)
        };
      }),

      setDesignConditions: (conditions) => set((state) => {
        const unchanged = state.designConditions
          && JSON.stringify(state.designConditions) === JSON.stringify(conditions);
        if (unchanged) {
          return { designConditions: conditions, step: 5 };
        }
        return {
          designConditions: conditions,
          selectedModels: [],
          step: 5,
        };
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

      navigateBack: (toStep) => set((state) => {
        // Step order: 1=ProjectInfo, 2=Group, 3=Series, 4=Design, 5=Results, 6=Options, 7=Submittal
        // Preserve user-entered data (projectInfo, designConditions, selectionBasis).
        // setSelectedGroup / setSelectedSeries already clear designConditions if the
        // user actually picks a different group or series after going back.
        const updates: Partial<SelectionState> = { step: toStep };
        // Editing an existing revision: the wizard is pre-populated with the prior
        // selection. Going back to review or tweak a single step shouldn't blow
        // away downstream choices — only the forward setters do, and only when
        // the user actually changes the value.
        if (state.revisionTargetUnitId) {
          return updates;
        }
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
      version: 4,
      migrate: () => initialState,
    }
    ),
    { name: 'SelectionStore' }
  )
);
