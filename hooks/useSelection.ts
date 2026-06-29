import { useQuery } from '@tanstack/react-query';
import type { Model } from '@/types/product';
import type { EquipmentOption } from '@/lib/mock-data/options';

interface EvapConditions {
  enteringDBF?: number;
  enteringWBF?: number;
  espInWG?: number;
  leavingWaterTempF?: number;
  enteringWaterTempF?: number;
  ambientTempF?: number;
  saturatedSuctionTempF?: number;
  is60Hz?: boolean;
  altitudeFt?: number;
}

export function useModels(
  seriesId: string | null,
  capacityBtuh: number | null,
  basis: 'capacity' | 'airflow' = 'capacity',
  airflowCFM: number | null = null,
  conditions: EvapConditions = {},
) {
  const { enteringDBF, enteringWBF, espInWG, leavingWaterTempF, enteringWaterTempF, ambientTempF, saturatedSuctionTempF, is60Hz, altitudeFt } = conditions;
  return useQuery<Model[]>({
    queryKey: ['models', seriesId, basis, capacityBtuh, airflowCFM, enteringDBF, enteringWBF, espInWG, leavingWaterTempF, enteringWaterTempF, ambientTempF, saturatedSuctionTempF, is60Hz, altitudeFt],
    queryFn: async () => {
      if (!seriesId) return [];
      if (basis === 'airflow' && !airflowCFM) return [];
      if (basis === 'capacity' && !capacityBtuh) return [];
      const params = new URLSearchParams({ seriesId, basis });
      if (capacityBtuh) params.set('capacity', String(capacityBtuh));
      if (airflowCFM) params.set('airflow', String(airflowCFM));
      if (enteringDBF != null) params.set('edb', String(enteringDBF));
      if (enteringWBF != null) params.set('ewb', String(enteringWBF));
      if (espInWG != null) params.set('esp', String(espInWG));
      if (leavingWaterTempF != null) params.set('lwt', String(leavingWaterTempF));
      if (enteringWaterTempF != null) params.set('ewt', String(enteringWaterTempF));
      if (is60Hz != null) params.set('hz', is60Hz ? '60' : '50');
      if (ambientTempF != null) params.set('amb', String(ambientTempF));
      if (saturatedSuctionTempF != null) params.set('sst', String(saturatedSuctionTempF));
      if (altitudeFt != null) params.set('alt', String(altitudeFt));
      const res = await fetch(`/api/mock/results?${params}`);
      return res.json();
    },
    enabled: !!seriesId && (basis === 'capacity' ? !!capacityBtuh : !!airflowCFM),
  });
}

export function useOptions(seriesId: string | null) {
  return useQuery<EquipmentOption[]>({
    queryKey: ['options', seriesId],
    queryFn: async () => {
      if (!seriesId) return [];
      const res = await fetch(`/api/mock/options?seriesId=${seriesId}`);
      return res.json();
    },
    enabled: !!seriesId,
  });
}
