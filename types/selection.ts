import type { ProductGroup, ProductSeries, Model } from './product';

export type SelectionBasis = 'capacity' | 'airflow';

export interface ProjectInfoFormData {
  projectId: string;
  projectName: string;
  clientName: string;
  unitReference: string;
  unitTag?: string;
  quantity: number;
  submittedFor?: string;
  country: string;
  salesEngineer: string;
}

export interface StandardDesignConditions {
  requiredCoolingCapacityBtuh: number;
  powerSupply: string;
  enteringDBF: number;
  enteringWBF: number;
  espInWG: number;

  altitudeFt: number;
  refrigerant?: string;
}

export interface ChillerDesignConditions extends StandardDesignConditions {
  enteringWaterTempF: number;
  leavingWaterTempF: number;
  waterFlowRateGPM: number;
}

export type DesignConditionsFormData = StandardDesignConditions | ChillerDesignConditions;

export type VRFIndoorType =
  | 'ducted-split-low-static'
  | 'ducted-split-high-static'
  | 'ducted-split-inverter'
  | 'cassette'
  | 'wall-mounted';

export interface VRFRoom {
  id: string;
  number: number;
  name: string;
  indoorType?: VRFIndoorType;
  capacity?: number;
}

export interface VRFFloor {
  id: string;
  number: number;
  name: string;
  rooms: VRFRoom[];
}

export interface VRFDesignCondition {
  enabled: boolean;
  outdoorDBF?: number;
  outdoorRH?: number;
  outdoorWBF?: number;
  indoorDBF?: number;
  indoorRH?: number;
  indoorWBF?: number;
}

/** Identifies a unit on the VRF canvas. 'odu' is the single outdoor unit; otherwise a roomId. */
export type VRFUnitId = 'odu' | string;

export interface VRFCanvasPos {
  /** Top-left of the unit card in canvas pixels. */
  x: number;
  y: number;
}

/**
 * One end of a custom pipe. Either snapped to a unit (follows the unit as it
 * moves) or pinned to a free point on the canvas — including a point picked off
 * an existing pipe line, so users can branch a new run from anywhere.
 */
export type VRFPipeEndpoint =
  | { kind: 'unit'; unitId: VRFUnitId }
  | { kind: 'point'; x: number; y: number };

export interface VRFCustomPipe {
  id: string;
  /** Pipe start endpoint. */
  from?: VRFPipeEndpoint;
  /** Pipe end endpoint. */
  to?: VRFPipeEndpoint;
  /** @deprecated Legacy unit-only start; read via the `from`/`to` migration in the diagram. */
  fromUnitId?: VRFUnitId;
  /** @deprecated Legacy unit-only end. */
  toUnitId?: VRFUnitId;
  /** Length in feet (independent of canvas geometry — same model as auto-pipe lengths). */
  lengthFt: number;
}

export interface VRFLayout {
  floors: VRFFloor[];
  ambientTempF?: number;
  summer?: VRFDesignCondition;
  winter?: VRFDesignCondition;
  /** Refrigerant trunk between the ODU and the first floor's branch line, in feet. */
  mainTrunkFt?: number;
  /** Vertical trunk segment from each floor's branch line to the next, keyed by destination floorId. */
  floorSegFtById?: Record<string, number>;
  /** Horizontal branch segment leading to each indoor unit, keyed by roomId. */
  branchFtById?: Record<string, number>;
  /** User-overridden positions for unit cards on the canvas. Absent = use auto-layout. */
  unitPositions?: Record<VRFUnitId, VRFCanvasPos>;
  /** User-drawn pipes added on top of the auto-generated trunk/branch network. */
  customPipes?: VRFCustomPipe[];
  /**
   * Auto-pipe segments the user has hidden from the suggestion. IDs follow:
   *   - "auto-trunk-main"               main trunk (ODU → floor 1)
   *   - "auto-trunk-floor-{floorId}"    inter-floor trunk to that floor
   *   - "auto-branch-{roomId}"          horizontal segment leading to that indoor unit
   */
  deletedAutoPipeIds?: string[];
}

export interface SelectionFlowState {
  step: number;
  selectedGroup: ProductGroup | null;
  selectedSeries: ProductSeries | null;
  projectInfo: ProjectInfoFormData | null;
  designConditions: DesignConditionsFormData | null;
  selectedModels: Model[];
  selectedOptions: string[];
}
