import { NextResponse } from 'next/server';
import { MOCK_PROJECTS } from '@/lib/mock-data/projects';

export async function GET() {
  return NextResponse.json(MOCK_PROJECTS);
}
