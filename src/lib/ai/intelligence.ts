import type { Language } from '@/lib/i18n/types';

export interface DemandPrediction {
  hour: number;
  label: string;
  predictedOrders: number;
  confidence: number;
  trend: 'peak' | 'normal' | 'slow';
  staffRecommendation: string;
}

export interface PriceSuggestion {
  itemName: string;
  currentPrice: number;
  suggestedMin: number;
  suggestedMax: number;
  rationale: string;
  potentialRevenueImpact: string;
}

export interface MarketingCampaignDraft {
  platform: 'telegram' | 'instagram' | 'sms';
  headline: string;
  body: string;
  callToAction: string;
  suggestedPromoCode?: string;
  language: Language;
}

/**
 * Predicts hourly restaurant demand based on operational historical patterns.
 */
export function predictHourlyDemand(dayOfWeek: number = new Date().getDay()): DemandPrediction[] {
  // Peak factors: Fridays (5) and Saturdays (6) see higher evening rushes in Tashkent
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  const multiplier = isWeekend ? 1.4 : 1.0;

  const hours = [
    { h: 10, base: 4 },
    { h: 11, base: 8 },
    { h: 12, base: 28 }, // Lunch peak
    { h: 13, base: 34 }, // Lunch peak
    { h: 14, base: 18 },
    { h: 15, base: 10 },
    { h: 16, base: 12 },
    { h: 17, base: 19 },
    { h: 18, base: 32 }, // Dinner peak
    { h: 19, base: 45 }, // Dinner peak
    { h: 20, base: 42 }, // Dinner peak
    { h: 21, base: 24 },
    { h: 22, base: 14 },
  ];

  return hours.map(({ h, base }) => {
    const predicted = Math.round(base * multiplier);
    let trend: 'peak' | 'normal' | 'slow' = 'normal';
    let staffRec = 'Standard kitchen staffing';

    if (predicted >= 30) {
      trend = 'peak';
      staffRec = 'Full line ready: prep 2 cooks, 1 expeditor, active courier staging';
    } else if (predicted <= 10) {
      trend = 'slow';
      staffRec = 'Prep-heavy window: restock mise en place & chop inventory';
    }

    return {
      hour: h,
      label: `${h}:00 - ${h + 1}:00`,
      predictedOrders: predicted,
      confidence: 0.88,
      trend,
      staffRecommendation: staffRec,
    };
  });
}

/**
 * Generates dynamic pricing recommendations for menu items based on margins & local Tashkent benchmarks.
 */
export function generatePriceSuggestion(
  itemName: string,
  currentPrice: number,
  category: string
): PriceSuggestion {
  const normCategory = category.toLowerCase();
  let suggestedMin = Math.round(currentPrice * 0.95 / 500) * 500;
  let suggestedMax = Math.round(currentPrice * 1.15 / 500) * 500;
  let rationale = `Price is well positioned for ${category}.`;
  let potentialRevenueImpact = '+3-5% margin optimization';

  if (normCategory.includes('main') || normCategory.includes('osh') || normCategory.includes('kebab')) {
    suggestedMin = Math.round(currentPrice * 1.0 / 500) * 500;
    suggestedMax = Math.round(currentPrice * 1.12 / 500) * 500;
    rationale = `High guest demand category in Tashkent. Premium protein & pilaf tolerate modest price adjustments (+8-12%) without conversion drop.`;
    potentialRevenueImpact = '+8-12% gross profit';
  } else if (normCategory.includes('drink') || normCategory.includes('dessert')) {
    suggestedMin = Math.round(currentPrice * 1.1 / 500) * 500;
    suggestedMax = Math.round(currentPrice * 1.25 / 500) * 500;
    rationale = `High-margin complementary items. Recommend bundle pricing or combo discount.`;
    potentialRevenueImpact = '+15-20% basket margin';
  }

  return {
    itemName,
    currentPrice,
    suggestedMin,
    suggestedMax,
    rationale,
    potentialRevenueImpact,
  };
}

/**
 * Generates multilingual AI promotional marketing copy for Telegram, Instagram, and SMS.
 * Adheres to: "Prompt-to-configuration, not prompt-to-code" and "Every AI output is a draft".
 */
export function generateMarketingCampaignDraft(
  restaurantName: string,
  promoTitle: string,
  discountText: string,
  platform: 'telegram' | 'instagram' | 'sms' = 'telegram',
  language: Language = 'uz'
): MarketingCampaignDraft {
  const code = `${restaurantName.slice(0, 3).toUpperCase()}${discountText.replace(/\D/g, '') || 'PROMO'}`;

  if (platform === 'sms') {
    const text =
      language === 'uz'
        ? `${restaurantName}: Maxsus aksiya! "${promoTitle}" — ${discountText} chegirma. Promokod: ${code}. Buyurtma berish: plately.co/store`
        : language === 'ru'
        ? `${restaurantName}: Спецпредложение! "${promoTitle}" — скидка ${discountText}. Промокод: ${code}. Заказ: plately.co/store`
        : `${restaurantName}: Special offer! "${promoTitle}" — get ${discountText} off with promo code ${code}. Order now: plately.co/store`;

    return {
      platform: 'sms',
      headline: promoTitle,
      body: text,
      callToAction: 'Buyurtma berish',
      suggestedPromoCode: code,
      language,
    };
  }

  if (platform === 'instagram') {
    const body =
      language === 'uz'
        ? `🔥 ${restaurantName} dan mazali xushxabar!\n\n"${promoTitle}" chegirma mavsumi boshlandi. Barcha sevimli taomlaringizga ${discountText} chegirma taqdim etamiz!\n\n👉 Promokod: ${code}\n📍 Yetkazib berish xizmati tezkor va ishonchli.\n\nBugunoq oilangiz va do'stlaringiz bilan lazzatlaning! ✨\n\n#tashkentfood #milliytaomlar #plately`
        : language === 'ru'
        ? `🔥 Вкусные новости от ${restaurantName}!\n\nСезон скидок "${promoTitle}". Дарим ${discountText} на все ваши любимые блюда!\n\n👉 Промокод: ${code}\n📍 Быстрая доставка прямо к вашей двери.\n\nЗаказывайте прямо сейчас и наслаждайтесь! ✨\n\n#ташкент #едаташкент #доставка`
        : `🔥 Delicious news from ${restaurantName}!\n\nEnjoy our special "${promoTitle}"! Get ${discountText} off all signature dishes.\n\n👉 Promo code: ${code}\n📍 Fast doorstep delivery available.\n\nOrder today and savor the taste! ✨`;

    return {
      platform: 'instagram',
      headline: `🔥 ${promoTitle} — ${discountText}`,
      body,
      callToAction: 'Bio orqali buyurtma qiling',
      suggestedPromoCode: code,
      language,
    };
  }

  // Telegram default
  const telegramBody =
    language === 'uz'
      ? `📢 <b>${restaurantName} — Maxsus Taklif!</b>\n\n🎉 <i>"${promoTitle}"</i>\n🎁 <b>${discountText}</b> chegirma bilan sevimli taomlaringizni buyurtma qiling!\n\n🔑 Promokod: <code>${code}</code>\n🛵 Toshkent bo'ylab tezkor yetkazib berish\n\n👇 Buyurtma berish uchun tugmani bosing:`
      : language === 'ru'
      ? `📢 <b>${restaurantName} — Специальное предложение!</b>\n\n🎉 <i>"${promoTitle}"</i>\n🎁 Заказывайте ваши любимые блюда со скидкой <b>${discountText}</b>!\n\n🔑 Промокод: <code>${code}</code>\n🛵 Быстрая доставка по Ташкенту\n\n👇 Нажмите для заказа:`
      : `📢 <b>${restaurantName} — Special Promotion!</b>\n\n🎉 <i>"${promoTitle}"</i>\n🎁 Enjoy <b>${discountText}</b> off your orders!\n\n🔑 Promo Code: <code>${code}</code>\n🛵 Fast delivery across Tashkent\n\n👇 Order directly here:`;

  return {
    platform: 'telegram',
    headline: `📢 ${promoTitle}`,
    body: telegramBody,
    callToAction: '📲 Buyurtma berish',
    suggestedPromoCode: code,
    language,
  };
}
