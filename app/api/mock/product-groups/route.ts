import { NextResponse } from 'next/server';
import { PRODUCT_GROUPS } from '@/lib/mock-data/product-groups';

export async function GET() {
  return NextResponse.json(PRODUCT_GROUPS);
}
