import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getModelsMatchingCapacity, getModelsMatchingAirflow } from '@/lib/mock-data/models';
import type { EvaporatorConditions } from '@/lib/mock-data/models';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('seriesId') ?? '';
  const basis = searchParams.get('basis') ?? 'capacity';
  const capacity = Number(searchParams.get('capacity') ?? 0);
  const airflow = Number(searchParams.get('airflow') ?? 0);

  const lwtParam = searchParams.get('lwt');
  const ambParam = searchParams.get('amb');
  const conditions: EvaporatorConditions = {
    enteringDBF: Number(searchParams.get('edb') ?? 80),
    enteringWBF: Number(searchParams.get('ewb') ?? 67),
    espInWG: Number(searchParams.get('esp') ?? 0.5),
    leavingWaterTempF: lwtParam != null ? Number(lwtParam) : undefined,
    ambientTempF: ambParam != null ? Number(ambParam) : undefined,
  };

  const models = basis === 'airflow' && airflow > 0
    ? getModelsMatchingAirflow(seriesId, airflow, conditions)
    : getModelsMatchingCapacity(seriesId, capacity, conditions);

  return NextResponse.json(models);
}
