import { NextRequest, NextResponse } from 'next/server';
import { SearchRepository } from '@/server/repositories/search-repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q') || '';
  const q = rawQ.trim().slice(0, 100);
  const limitParam = searchParams.get('limit');
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : 20;
  const limit = Math.min(Math.max(1, isNaN(parsedLimit) ? 20 : parsedLimit), 50);

  try {
    const results = await SearchRepository.searchPublicArchive(q, { limit });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
