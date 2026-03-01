import type { Model } from '@/types/product';

// Helper to generate realistic mock models for a series
function generateModels(seriesId: string, prefix: string, capacities: number[]): Model[] {
  return capacities.map((tons, i) => {
    const btuh = Math.round(tons * 12000);
    const sensible = Math.round(btuh * 0.72);
    const eer = 9.5 + (i % 3) * 0.4;
    const powerKW = Math.round((btuh / (eer * 3412)) * 1000) / 10;
    const cfm = Math.round(tons * 400);
    const matchBase = 92 + Math.floor(Math.random() * 8);

    return {
      id: `${seriesId}-${prefix}${String(tons * 10).padStart(4, '0')}`,
      seriesId,
      modelNumber: `${prefix}${String(tons * 10).padStart(4, '0')}`,
      totalCapacityBtuh: btuh,
      sensibleCapacityBtuh: sensible,
      powerKW,
      eer: Math.round(eer * 10) / 10,
      airflowCFM: cfm,
      leavingDBF: 56 + i,
      leavingWBF: 51 + i,
      compressorCount: tons <= 10 ? 1 : tons <= 30 ? 2 : tons <= 60 ? 4 : 6,
      matchPercent: i === 1 ? 100 : Math.max(85, matchBase - i * 5),
      nominalTons: tons,
      weightLbs: Math.round(tons * 45 + 150),
      lengthIn: Math.round(tons * 3.2 + 30),
      widthIn: Math.round(tons * 1.5 + 20),
      heightIn: Math.round(tons * 0.8 + 36),
    };
  });
}

export const MOCK_MODELS: Record<string, Model[]> = {
  'pac-r': generateModels('pac-r', 'CPACR', [5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 70]),
  'pac-f': generateModels('pac-f', 'CPACF', [3, 5, 7.5, 10, 15, 20, 25, 30]),
  'pac-g': generateModels('pac-g', 'CPACG', [5, 7.5, 10, 15, 20, 25]),
  'split-cs': generateModels('split-cs', 'CCS', [1.5, 2, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15, 20]),
  'split-ds': generateModels('split-ds', 'CDS', [2, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15]),
  'ms-wall': generateModels('ms-wall', 'CMSW', [0.75, 1, 1.5, 2, 2.5, 3, 4]),
  'ms-cas': generateModels('ms-cas', 'CMSC', [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]),
  'ngw-scroll': generateModels('ngw-scroll', 'CNGWS', [20, 25, 30, 40, 50, 60, 70, 80]),
  'acsc': generateModels('acsc', 'CACSC', [80, 100, 120, 150, 175, 200]),
  'wcc-scroll': generateModels('wcc-scroll', 'CWCCS', [50, 75, 100, 125, 150, 175, 200]),
  'wcc-screw': generateModels('wcc-screw', 'CWCCSC', [150, 200, 250, 300, 350, 400, 500]),
  'ccu-std': generateModels('ccu-std', 'CCCU', [1, 1.5, 2, 3, 4, 5, 7.5, 10, 12.5, 15]),
  'ccu-lt': generateModels('ccu-lt', 'CCCULT', [1, 1.5, 2, 3, 4, 5, 7.5, 10, 15, 20, 25]),
  'prec-dc': generateModels('prec-dc', 'CPDU', [5, 7.5, 10, 12.5, 15, 20, 25, 30]),
  'prec-tele': generateModels('prec-tele', 'CPTU', [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]),
  'fcu': generateModels('fcu', 'CFCU', [0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5]),
};

export function getModelsForSeries(seriesId: string): Model[] {
  return MOCK_MODELS[seriesId] ?? [];
}

export function getModelsMatchingCapacity(seriesId: string, requestedBtuh: number): Model[] {
  const models = getModelsForSeries(seriesId);
  // Find models within ±30% of requested capacity and sort by match
  const withMatch = models.map(m => ({
    ...m,
    matchPercent: Math.max(0, Math.round(100 - Math.abs((m.totalCapacityBtuh - requestedBtuh) / requestedBtuh) * 100)),
  })).filter(m => m.matchPercent > 60);
  return withMatch.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 6);
}
