import { NextResponse } from 'next/server';
import { generateDishDescription } from '@/lib/ai/menu-assistant';
import type { Language } from '@/lib/i18n/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category = 'Main', language = 'uz' } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Dish name is required' },
        { status: 400 }
      );
    }

    const suggestion = await generateDishDescription(
      name.trim(),
      category,
      language as Language
    );

    return NextResponse.json({
      success: true,
      ...suggestion,
    });
  } catch (err: any) {
    console.error('[AI Describe Dish] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate dish description' },
      { status: 500 }
    );
  }
}
