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
}
