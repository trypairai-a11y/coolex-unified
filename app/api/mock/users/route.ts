import { NextResponse } from 'next/server';
import { MOCK_USERS } from '@/lib/mock-data/users';

export async function GET() {
  return NextResponse.json(MOCK_USERS);
}
