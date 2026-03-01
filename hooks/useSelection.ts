import { useQuery } from '@tanstack/react-query';
import type { Model } from '@/types/product';
import type { EquipmentOption } from '@/lib/mock-data/options';

export function useModels(seriesId: string | null, capacityBtuh: number | null) {
  return useQuery<Model[]>({
    queryKey: ['models', seriesId, capacityBtuh],
    queryFn: async () => {
      if (!seriesId || !capacityBtuh) return [];
      const res = await fetch(`/api/mock/results?seriesId=${seriesId}&capacity=${capacityBtuh}`);
      return res.json();
    },
    enabled: !!seriesId && !!capacityBtuh,
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
