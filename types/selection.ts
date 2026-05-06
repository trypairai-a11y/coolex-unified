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
