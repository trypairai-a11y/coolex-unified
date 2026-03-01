import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PRODUCT_SERIES } from '@/lib/mock-data/product-series';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  const series = groupId ? PRODUCT_SERIES.filter(s => s.groupId === groupId) : PRODUCT_SERIES;
  return NextResponse.json(series);
}
