import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getOptionsForSeries } from '@/lib/mock-data/options';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('seriesId') ?? '';
  return NextResponse.json(getOptionsForSeries(seriesId));
}
