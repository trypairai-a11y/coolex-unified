import type { ProductGroup, ProductSeries, Model } from './product';

export type SelectionBasis = 'capacity' | 'airflow';

export interface ProjectInfoFormData {
  projectName: string;
  clientName?: string;
  unitReference?: string;
  unitTag?: string;
  unitSelection?: string;
  quantity?: number;
  submittedFor?: string;
  country?: string;
  salesEngineer?: string;
}

export interface StandardDesignConditions {
  requiredCoolingCapacityBtuh: number;
  powerSupply: string;
  ambientTempF: number;
  enteringDBF: number;
  enteringWBF: number;
  espInWG: number;
  electricHeaterKW: number;
  altitudeFt: number;
  refrigerant?: string;
}

export interface ChillerDesignConditions extends StandardDesignConditions {
  enteringWaterTempF: number;
  leavingWaterTempF: number;
  waterFlowRateGPM: number;
  glycolPercent: number;
}

export type DesignConditionsFormData = StandardDesignConditions | ChillerDesignConditions;

export interface SelectionFlowState {
  step: number;
  selectedGroup: ProductGroup | null;
  selectedSeries: ProductSeries | null;
  projectInfo: ProjectInfoFormData | null;
  designConditions: DesignConditionsFormData | null;
  selectedModel: Model | null;
  selectedOptions: string[];
}
