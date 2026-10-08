import { describe, it, expect } from 'vitest';
import { parseVoiceCallTranscript, type KnownMenuItem } from '@/lib/ai/voice-ordering';

describe('Voice Ordering & Telephony Assistant (Phase 3+)', () => {
  const catalog: KnownMenuItem[] = [
    {
      name: 'Tashkent Choyxona Palov',
      aliases: ['osh', 'palov', 'плов'],
      priceUZS: 45000,
      inStock: true,
    },
    {
      name: 'Achichuk Salad',
      aliases: ['achichuk', 'achichuq', 'ачичук'],
      priceUZS: 18000,
      inStock: true,
    },
    {
      name: 'Special Lamb Kebab',
      aliases: ['shashlik', 'kabob', 'шашлык'],
      priceUZS: 25000,
      inStock: false, // out of stock to test human escalation
    },
  ];

  it('parses an Uzbek phone order transcript and detects quantity', () => {
    const transcript =
      'Assalomu alaykum aka, bizga 2 ta osh va 1 ta achichuk yetkazib bering, manzil: Amir Temur 45';
    const draft = parseVoiceCallTranscript(transcript, '+998901234567', catalog);

    expect(draft.detectedLanguage).toBe('uz');
    expect(draft.items.length).toBe(2);

    const osh = draft.items.find((i) => i.itemName === 'Tashkent Choyxona Palov');
    expect(osh).toBeDefined();
    expect(osh?.quantity).toBe(2);

    expect(draft.deliveryAddress).toBe('Amir Temur 45');
    expect(draft.needsHumanEscalation).toBe(false);
    expect(draft.subtotalUZS).toBe(45000 * 2 + 18000 * 1);
  });

  it('escalates to human agent when customer requests out-of-stock items', () => {
    const transcript = 'Здравствуйте, нам пожалуйста три шашлыка с собой';
    const draft = parseVoiceCallTranscript(transcript, '+998935557788', catalog);

    expect(draft.detectedLanguage).toBe('ru');
    expect(draft.needsHumanEscalation).toBe(true);
    expect(draft.escalationReason).toContain('marked out of stock');
  });

  it('escalates when speech contains no recognizable menu items', () => {
    const transcript = 'Hello, can I speak to the manager about an event booking?';
    const draft = parseVoiceCallTranscript(transcript, '+998971112233', catalog);

    expect(draft.needsHumanEscalation).toBe(true);
    expect(draft.confidenceScore).toBeLessThan(0.5);
    expect(draft.escalationReason).toContain('Unable to identify any catalog items');
  });
});
