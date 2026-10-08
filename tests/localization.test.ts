import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '@/lib/i18n/translations';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/types';

describe('Localization & Multilingual Dictionaries', () => {
  it('supports uz, ru, and en', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('uz');
    expect(codes).toContain('ru');
    expect(codes).toContain('en');
  });

  it('contains translations for all navigation items in all 3 languages', () => {
    const navKeys = [
      'nav.dashboard',
      'nav.kds',
      'nav.menu',
      'nav.orders',
      'nav.dispatch',
      'nav.customers',
      'nav.analytics',
      'nav.settings',
      'nav.sign_out',
    ];

    for (const lang of ['uz', 'ru', 'en'] as const) {
      for (const key of navKeys) {
        expect(TRANSLATIONS[lang][key]).toBeDefined();
        expect(TRANSLATIONS[lang][key].length).toBeGreaterThan(0);
      }
    }
  });

  it('correctly provides Uzbek terms for kitchen and menu', () => {
    expect(TRANSLATIONS.uz['nav.kds']).toBe('Oshxona ekrani');
    expect(TRANSLATIONS.uz['nav.menu']).toBe('Taomnoma');
    expect(TRANSLATIONS.uz['status.ready']).toBe('Tayyor');
    expect(TRANSLATIONS.uz['stock.in_stock']).toBe('Mavjud');
  });

  it('correctly provides Russian terms for management', () => {
    expect(TRANSLATIONS.ru['nav.kds']).toBe('Кухонный экран');
    expect(TRANSLATIONS.ru['nav.menu']).toBe('Меню');
    expect(TRANSLATIONS.ru['status.ready']).toBe('Готово');
    expect(TRANSLATIONS.ru['stock.in_stock']).toBe('В наличии');
  });
});
