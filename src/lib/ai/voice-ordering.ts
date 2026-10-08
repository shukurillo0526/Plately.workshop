import type { Language } from '@/lib/i18n/types';

export interface VoiceOrderItem {
  itemName: string;
  quantity: number;
  unitPriceUZS: number;
  totalUZS: number;
  notes?: string;
}

export interface VoiceOrderDraft {
  callId: string;
  detectedLanguage: Language;
  customerPhone: string;
  customerName?: string;
  items: VoiceOrderItem[];
  subtotalUZS: number;
  deliveryAddress?: string;
  confidenceScore: number; // 0.0 - 1.0
  needsHumanEscalation: boolean;
  escalationReason?: string;
  transcriptionSnippet: string;
}

export interface KnownMenuItem {
  name: string;
  aliases: string[];
  priceUZS: number;
  inStock: boolean;
}

/**
 * Parses and extracts a structured draft order from phone call speech-to-text transcripts.
 * Designed for multilingual Uzbek, Russian, and English customer calls in Tashkent.
 */
export function parseVoiceCallTranscript(
  transcript: string,
  customerPhone: string,
  catalog: KnownMenuItem[]
): VoiceOrderDraft {
  const cleanText = transcript.toLowerCase();
  const callId = `CALL-${Math.floor(100000 + Math.random() * 900000)}`;

  // Detect language
  let detectedLanguage: Language = 'en';
  if (/iltimos|dona|ta|osh|yetkazib|som|aka|uka|rahmat/i.test(cleanText)) {
    detectedLanguage = 'uz';
  } else if (/пожалуйста|порции|порция|доставка|руб|сум|здравствуйте|спасибо/i.test(cleanText)) {
    detectedLanguage = 'ru';
  }

  const items: VoiceOrderItem[] = [];
  let confidenceScore = 0.95;
  let needsHumanEscalation = false;
  let escalationReason: string | undefined;

  // Extract menu items matching catalog
  for (const item of catalog) {
    const allNames = [item.name.toLowerCase(), ...item.aliases.map((a) => a.toLowerCase())];
    for (const alias of allNames) {
      if (cleanText.includes(alias)) {
        // Find preceding or trailing quantity (e.g., "2 ta osh", "osh 2 dona", "две порции плова")
        let quantity = 1;
        const numberMatches = cleanText.match(new RegExp(`(\\d+)\\s*(?:ta|dona|порци[ия]|штук)?\\s*${alias}`));
        const reverseMatches = cleanText.match(new RegExp(`${alias}\\s*(\\d+)`));

        if (numberMatches && numberMatches[1]) {
          quantity = parseInt(numberMatches[1], 10);
        } else if (reverseMatches && reverseMatches[1]) {
          quantity = parseInt(reverseMatches[1], 10);
        } else if (/ikki|две|два/i.test(cleanText)) {
          quantity = 2;
        } else if (/uch|три/i.test(cleanText)) {
          quantity = 3;
        }

        if (!item.inStock) {
          needsHumanEscalation = true;
          escalationReason = `Item "${item.name}" requested by caller is currently marked out of stock.`;
          confidenceScore = 0.6;
        }

        items.push({
          itemName: item.name,
          quantity,
          unitPriceUZS: item.priceUZS,
          totalUZS: item.priceUZS * quantity,
        });
        break;
      }
    }
  }

  // Address extraction heuristic
  let deliveryAddress: string | undefined;
  const addressMatch = transcript.match(/(?:manzil|adres|address|улица|dom|kvartira|uy)[:\s]+([^.,\n]+)/i);
  if (addressMatch && addressMatch[1]) {
    deliveryAddress = addressMatch[1].trim();
  }

  if (items.length === 0) {
    confidenceScore = 0.4;
    needsHumanEscalation = true;
    escalationReason = 'Unable to identify any catalog items from caller speech transcript.';
  }

  const subtotalUZS = items.reduce((sum, item) => sum + item.totalUZS, 0);

  return {
    callId,
    detectedLanguage,
    customerPhone,
    items,
    subtotalUZS,
    deliveryAddress,
    confidenceScore,
    needsHumanEscalation,
    escalationReason,
    transcriptionSnippet: transcript.slice(0, 200),
  };
}
