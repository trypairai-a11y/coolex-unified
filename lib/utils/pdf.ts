import type { Submittal } from '@/types/submittal';
import { btuhToTons } from './capacity';

export function buildSubmittalData(
  projectInfo: Submittal['projectInfo'],
  designConditions: Submittal['designConditions'],
  model: Submittal['selectedModel'],
  options: Submittal['selectedOptions'],
  revisionNumber: string,
  generatedBy: string
): Omit<Submittal, 'id' | 'projectId' | 'unitId'> {
  const optionsTotal = options.reduce((sum, opt) => sum + opt.priceAdderKWD, 0);
  const basePrice = Math.round(btuhToTons(model.totalCapacityBtuh) * 185);
  const discountPercent = 5;
  const netTotal = Math.round((basePrice + optionsTotal) * (1 - discountPercent / 100));

  return {
    revisionNumber,
    generatedAt: new Date().toISOString(),
    generatedBy,
    projectInfo,
    designConditions,
    selectedModel: model,
    selectedOptions: options,
    basePriceKWD: basePrice,
    optionsTotalKWD: optionsTotal,
    discountPercent,
    netTotalKWD: netTotal,
  };
}
