import type { Language } from '@/lib/i18n/types';

export interface AIDishSuggestion {
  description: string;
  suggestedDietary: string[];
  prepTimeMinutes: number;
  confidence: number;
}

// Built-in culinary knowledge base for high-confidence instant recommendations
const CULINARY_KNOWLEDGE_BASE: Record<
  string,
  {
    uz: string;
    ru: string;
    en: string;
    dietary: string[];
    prepTime: number;
  }
> = {
  plov: {
    uz: "An'anaviy qora qozonda dimlangan shirali mol go'shti, sarg'ish sabzi, mayiz va no'xatli milliy to'y oshi.",
    ru: "Традиционный узбекский праздничный плов с отборной говядиной, жёлтой морковью, нутом и изюмом в чугунном казане.",
    en: "Traditional Uzbek celebration pilaf with tender beef, yellow carrots, chickpeas, and raisins slow-cooked in a cast iron kazan.",
    dietary: ["Halal"],
    prepTime: 20,
  },
  somsa: {
    uz: "Tandirda pishirilgan mayin qatlamali xamir va mayda to'g'ralgan shirali mol go'shti, zira bilan xushbo'ylangan somsa.",
    ru: "Хрустящая слоёная тандырная самса с рубленым мясом, луком и восточной зирой.",
    en: "Flaky clay-oven baked tandoor somsa stuffed with seasoned diced beef, onions, and fragrant cumin.",
    dietary: ["Halal"],
    prepTime: 12,
  },
  shashlik: {
    uz: "Ochiq cho'g'da pishirilgan yumshoq barra qo'zichoq go'shti, sirka sepilgan mayin piyoz bilan tortiladi.",
    ru: "Ароматный шашлык из нежной баранины на углях с маринованным луком и специями.",
    en: "Charcoal-grilled tender lamb skewers seasoned with traditional spices, served with marinated onions.",
    dietary: ["Halal", "Gluten-Free"],
    prepTime: 18,
  },
  lagman: {
    uz: "Qo'lda cho'zilgan yangi xamir, shirali go'sht va xushbo'y sabzavotlar bilan boyitilgan issiq sho'rva.",
    ru: "Тянутая вручную лапша с сочным мясом, сладким перцем и ароматной подливой.",
    en: "Hand-pulled fresh noodles in rich aromatic beef and vegetable broth with bell peppers.",
    dietary: ["Halal"],
    prepTime: 15,
  },
  manti: {
    uz: "Bug'da pishirilgan yupqa xamirli, mayda to'g'ralgan go'sht va piyozli mazali xonaki manti.",
    ru: "Домашние паровые манты из тонкого теста с сочной рубленой мясной начинкой.",
    en: "Delicate steamed dumplings with hand-chopped beef, sweet onions, and aromatic pepper.",
    dietary: ["Halal"],
    prepTime: 20,
  },
  choy: {
    uz: "Maxsus milliy choynakda damlangan yangi xushbo'y ko'k choy.",
    ru: "Свежезаваренный зелёный чай в национальном узбекском чайнике.",
    en: "Freshly brewed green tea served in a traditional Uzbek teapot.",
    dietary: ["Halal", "Vegetarian", "Vegan", "Gluten-Free"],
    prepTime: 5,
  },
};

/**
 * Generates an appetizing marketing description and dietary tags for a dish.
 * Adheres to: "Prompt-to-configuration, not prompt-to-code" and "Every AI output is a draft".
 */
export async function generateDishDescription(
  dishName: string,
  category: string = 'Main',
  language: Language = 'uz'
): Promise<AIDishSuggestion> {
  const normalized = dishName.toLowerCase().trim();

  // 1. Check culinary knowledge base
  for (const [key, data] of Object.entries(CULINARY_KNOWLEDGE_BASE)) {
    if (normalized.includes(key)) {
      return {
        description: data[language] || data.en,
        suggestedDietary: data.dietary,
        prepTimeMinutes: data.prepTime,
        confidence: 0.95,
      };
    }
  }

  // 2. If Gemini API key is configured, query Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `Write a short 1-2 sentence appetizing restaurant menu description in ${
        language === 'uz' ? 'Uzbek' : language === 'ru' ? 'Russian' : 'English'
      } for the dish "${dishName}" (Category: ${category}). Also suggest dietary tags from [Halal, Vegetarian, Vegan, Gluten-Free]. Return JSON: {"description": "...", "dietary": ["..."], "prep_time": 15}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            description: parsed.description,
            suggestedDietary: Array.isArray(parsed.dietary) ? parsed.dietary : ['Halal'],
            prepTimeMinutes: Number(parsed.prep_time) || 15,
            confidence: 0.9,
          };
        }
      }
    } catch (err) {
      console.warn('[AI Assistant] Gemini call fallback:', err);
    }
  }

  // 3. Fallback Heuristic Generator (Zero-latency, 100% offline-ready)
  const isDrink = category.toLowerCase().includes('drink') || category.toLowerCase().includes('ichimlik');
  const isDessert = category.toLowerCase().includes('dessert') || category.toLowerCase().includes('shirinlik');

  if (isDrink) {
    const desc =
      language === 'uz'
        ? `${dishName} — yangi va tetiklashtiruvchi tabiiy ichimlik.`
        : language === 'ru'
        ? `${dishName} — освежающий напиток из натуральных ингредиентов.`
        : `${dishName} — refreshing beverage made with natural ingredients.`;
    return {
      description: desc,
      suggestedDietary: ['Halal', 'Vegetarian'],
      prepTimeMinutes: 5,
      confidence: 0.82,
    };
  }

  if (isDessert) {
    const desc =
      language === 'uz'
        ? `${dishName} — xushbo'y va nozik ta'mli milliy shirinlik.`
        : language === 'ru'
        ? `${dishName} — нежный и изысканный десерт для приятного завершения трапезы.`
        : `${dishName} — delicate sweet dessert prepared with authentic flavours.`;
    return {
      description: desc,
      suggestedDietary: ['Halal', 'Vegetarian'],
      prepTimeMinutes: 10,
      confidence: 0.85,
    };
  }

  const defaultDesc =
    language === 'uz'
      ? `${dishName} — yangi masalliqlardan mahorat bilan tayyorlangan lazzatli taom.`
      : language === 'ru'
      ? `${dishName} — аппетитное фирменное блюдо, приготовленное из свежих отборных ингредиентов.`
      : `${dishName} — flavorful specialty dish freshly prepared with finest local ingredients.`;

  return {
    description: defaultDesc,
    suggestedDietary: ['Halal'],
    prepTimeMinutes: 15,
    confidence: 0.8,
  };
}
