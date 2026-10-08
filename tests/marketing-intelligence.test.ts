import { describe, it, expect } from 'vitest';
import {
  predictHourlyDemand,
  generatePriceSuggestion,
  generateMarketingCampaignDraft,
} from '@/lib/ai/intelligence';

describe('AI Marketing & Pricing Intelligence (Phase 3)', () => {
  describe('predictHourlyDemand', () => {
    it('returns predictions across standard operating hours', () => {
      const weekdayPredictions = predictHourlyDemand(2); // Tuesday
      expect(weekdayPredictions.length).toBeGreaterThan(5);

      const lunchRush = weekdayPredictions.find((p) => p.hour === 13);
      expect(lunchRush).toBeDefined();
      expect(lunchRush?.predictedOrders).toBeGreaterThan(20);
      expect(lunchRush?.trend).toBe('peak');
    });

    it('applies Tashkent weekend rush multiplier on Friday/Saturday/Sunday', () => {
      const weekday = predictHourlyDemand(2); // Tuesday
      const weekend = predictHourlyDemand(5); // Friday

      const weekdayDinner = weekday.find((p) => p.hour === 19)?.predictedOrders || 0;
      const weekendDinner = weekend.find((p) => p.hour === 19)?.predictedOrders || 0;

      expect(weekendDinner).toBeGreaterThan(weekdayDinner);
    });
  });

  describe('generatePriceSuggestion', () => {
    it('generates rounded 500 UZS price recommendations for Tashkent pilaf and main courses', () => {
      const suggestion = generatePriceSuggestion('Tashkent Choyxona Palov', 45000, 'Main Dish (Osh)');
      expect(suggestion.itemName).toBe('Tashkent Choyxona Palov');
      expect(suggestion.suggestedMax).toBeGreaterThanOrEqual(suggestion.currentPrice);
      expect(suggestion.suggestedMax % 500).toBe(0);
      expect(suggestion.suggestedMin % 500).toBe(0);
      expect(suggestion.rationale).toContain('High guest demand');
    });

    it('suggests margin-boosting upsell pricing on beverage/dessert categories', () => {
      const suggestion = generatePriceSuggestion('Lemon & Mint Iced Tea', 18000, 'Drinks');
      expect(suggestion.suggestedMax).toBeGreaterThan(suggestion.currentPrice);
      expect(suggestion.potentialRevenueImpact).toContain('basket margin');
    });
  });

  describe('generateMarketingCampaignDraft', () => {
    it('drafts localized Telegram marketing copy with formatted HTML tags', () => {
      const draft = generateMarketingCampaignDraft(
        'Rayhon Milliy',
        'Navro’z Bayram Aksiyasi',
        '20%',
        'telegram',
        'uz'
      );

      expect(draft.platform).toBe('telegram');
      expect(draft.suggestedPromoCode).toContain('RAY20');
      expect(draft.body).toContain('<b>Rayhon Milliy');
      expect(draft.body).toContain('<code>RAY20</code>');
    });

    it('drafts localized Instagram copy with hashtags in Russian', () => {
      const draft = generateMarketingCampaignDraft(
        'Rayhon',
        'Скидка выходного дня',
        '15%',
        'instagram',
        'ru'
      );

      expect(draft.platform).toBe('instagram');
      expect(draft.body).toContain('#ташкент');
      expect(draft.body).toContain('15%');
    });

    it('drafts concise SMS campaigns under character limits', () => {
      const draft = generateMarketingCampaignDraft(
        'Safia',
        'Sweet Weekend',
        '10%',
        'sms',
        'en'
      );

      expect(draft.platform).toBe('sms');
      expect(draft.body).toContain('Safia: Special offer!');
      expect(draft.body.length).toBeLessThan(160);
    });
  });
});
