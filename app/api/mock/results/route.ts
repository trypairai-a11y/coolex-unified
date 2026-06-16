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
  const ewtParam = searchParams.get('ewt');
  const ambParam = searchParams.get('amb');
  const sstParam = searchParams.get('sst');
  const hzParam = searchParams.get('hz');
  const conditions: EvaporatorConditions = {
    enteringDBF: Number(searchParams.get('edb') ?? 80),
    enteringWBF: Number(searchParams.get('ewb') ?? 67),
    espInWG: Number(searchParams.get('esp') ?? 0.5),
    leavingWaterTempF: lwtParam != null ? Number(lwtParam) : undefined,
    enteringWaterTempF: ewtParam != null ? Number(ewtParam) : undefined,
    ambientTempF: ambParam != null ? Number(ambParam) : undefined,
    saturatedSuctionTempF: sstParam != null ? Number(sstParam) : undefined,
    // Only drive NGW airflow interpolation from the request when the user is
    // selecting by airflow; on a capacity basis each model uses its rated CFM.
    requiredAirflowCFM: basis === 'airflow' && airflow > 0 ? airflow : undefined,
    // ACSC 60/50 Hz table selection; default 60 Hz when unspecified.
    is60Hz: hzParam != null ? hzParam === '60' : undefined,
  };

  const models = basis === 'airflow' && airflow > 0
    ? getModelsMatchingAirflow(seriesId, airflow, conditions)
    : getModelsMatchingCapacity(seriesId, capacity, conditions);

  return NextResponse.json(models);
}
