import { describe, it, expect } from 'vitest';
import { generateDishDescription } from '@/lib/ai/menu-assistant';

describe('AI Menu Assistant (Phase 2)', () => {
  it('generates high-confidence Uzbek dish description from culinary knowledge base', async () => {
    const plovUz = await generateDishDescription('To‘y Oshi (Plov)', 'Main', 'uz');
    expect(plovUz.confidence).toBeGreaterThanOrEqual(0.9);
    expect(plovUz.description).toContain('qora qozonda dimlangan');
    expect(plovUz.suggestedDietary).toContain('Halal');
    expect(plovUz.prepTimeMinutes).toBeGreaterThan(0);
  });

  it('generates Russian description for Somsa', async () => {
    const somsaRu = await generateDishDescription('Tandir Somsa', 'Appetizer', 'ru');
    expect(somsaRu.confidence).toBeGreaterThanOrEqual(0.9);
    expect(somsaRu.description).toContain('слоёная тандырная самса');
    expect(somsaRu.suggestedDietary).toContain('Halal');
  });

  it('generates English description for Shashlik', async () => {
    const shashlikEn = await generateDishDescription('Lamb Shashlik', 'Main', 'en');
    expect(shashlikEn.confidence).toBeGreaterThanOrEqual(0.9);
    expect(shashlikEn.description).toContain('Charcoal-grilled');
    expect(shashlikEn.suggestedDietary).toContain('Halal');
  });

  it('falls back to category-aware heuristic when dish is unfamiliar', async () => {
    const drinkUz = await generateDishDescription('Anor Sharbat', 'Cold Drinks', 'uz');
    expect(drinkUz.confidence).toBeGreaterThanOrEqual(0.8);
    expect(drinkUz.description).toContain('ichimlik');
    expect(drinkUz.suggestedDietary).toContain('Vegetarian');
    expect(drinkUz.prepTimeMinutes).toBe(5);

    const sweetEn = await generateDishDescription('Pashmak Halva', 'Dessert', 'en');
    expect(sweetEn.confidence).toBeGreaterThanOrEqual(0.8);
    expect(sweetEn.description).toContain('dessert');
  });
});
