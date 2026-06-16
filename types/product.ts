export type RefrigerantType = 'R-410A' | 'R-32' | 'R-134a' | 'R-22' | 'R-407C' | 'R-404A';
export type ProductCategory = 'package' | 'split' | 'vrf' | 'chiller' | 'ccu' | 'precision' | 'fan-coil' | 'crac';

export interface ProductGroup {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  imageUrl: string;
  gradientFrom: string;
  gradientTo: string;
  seriesCount: number;
  tonRange: string;
}

export interface ProductSeries {
  id: string;
  groupId: string;
  name: string;
  fullName: string;
  modelPrefix: string;
  minTons: number;
  maxTons: number;
  tonRangeLabel: string;
  refrigerants: RefrigerantType[];
  primaryRefrigerant: RefrigerantType;
  keyDifferentiator: string;
  description: string;
  features: string[];
  isChiller: boolean;
  isCCU: boolean;
  hasDualRefrigerant: boolean;
  cfmRangeLabel?: string;
  speedType?: 'fixed' | 'variable';
  imageUrl?: string;
  subtitle?: string;
  highlights?: string[];
}

export interface Model {
  id: string;
  seriesId: string;
  modelNumber: string;
  totalCapacityBtuh: number;
  sensibleCapacityBtuh: number;
  powerKW: number;
  eer: number;
  airflowCFM: number;
  leavingDBF: number;
  leavingWBF: number;
  compressorCount: number;
  matchPercent: number;
  nominalTons: number;
  weightLbs: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  // Optional extended fields for real product data
  refrigerant?: string;
  compressorType?: string;
  operatingWeight_kg?: number;
  outdoorWeight_kg?: number;
  indoorWeight_kg?: number;
  capacity_at95F?: number;
  capacity_at105F?: number;
  capacity_at115F?: number;
  power_at95F?: number;
  power_at105F?: number;
  // Tabulated chiller performance (ACC-BP, ACC-ST) at the user's design point.
  // Bilinearly interpolated from the catalogue matrix on LCWT × ambient.
  matrixWaterFlowLPS?: number;
  matrixWaterPressureDropKPa?: number;
  // Tabulated CCU performance at the user's design point.
  // Bilinearly interpolated from the catalogue matrix on SST × ambient (°F).
  matrixCondensingTempF?: number;
  // Tabulated NGW fan-coil performance at the user's design point.
  // Bilinearly interpolated from the catalogue matrix on airflow (CFM) ×
  // entering (chilled-supply) water temp (°F). GPM / WPD are English-native.
  matrixWaterFlowGPM?: number;
  matrixWaterPressureDropFtH2O?: number;
  // VRF indoor unit catalogue fields (e.g. IVLF ducted-split units). Heat-pump
  // models list both cooling (totalCapacityBtuh) and heating output; the fan
  // motor is the indoor DC fan (the VRF compressor lives in the outdoor unit).
  heatingCapacityBtuh?: number;
  fanMotorWatts?: number;
  coilRows?: number;
  bodyWeight_kg?: number;
  connectingGasPipe?: string;
  connectingLiquidPipe?: string;
  connectingDrainPipe?: string;
  expansionDevice?: string;
  evaporatorCoilType?: string;
  powerSupply?: string;
  controllerType?: string;
  // Full catalogue designation when the model number is a shorthand for a matched
  // pair (e.g. DSSF-CDEF: "CHCF-024 A7 / CHEF-024 A7" for outdoor / indoor units).
  modelDesignation?: string;
}
