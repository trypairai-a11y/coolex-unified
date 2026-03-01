import type { Model } from './product';
import type { ProjectInfoFormData, DesignConditionsFormData } from './selection';

export interface SubmittalOption {
  id: string;
  label: string;
  priceAdderKWD: number;
}

export interface Submittal {
  id: string;
  projectId: string;
  unitId: string;
  revisionNumber: string;
  generatedAt: string;
  generatedBy: string;
  projectInfo: ProjectInfoFormData;
  designConditions: DesignConditionsFormData;
  selectedModel: Model;
  selectedOptions: SubmittalOption[];
  basePriceKWD: number;
  optionsTotalKWD: number;
  discountPercent: number;
  netTotalKWD: number;
}
