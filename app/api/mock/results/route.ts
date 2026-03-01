import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getModelsMatchingCapacity } from '@/lib/mock-data/models';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('seriesId') ?? '';
  const capacity = Number(searchParams.get('capacity') ?? 0);
  const models = getModelsMatchingCapacity(seriesId, capacity);
  return NextResponse.json(models);
}
