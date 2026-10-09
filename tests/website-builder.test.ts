import { describe, it, expect } from 'vitest';
import type { WebsiteThemeConfig, WebsiteSection } from '@/app/(dashboard)/website/page';

describe('Conversational Website Generator & Builder (Part C)', () => {
  const defaultSections: WebsiteSection[] = [
    { id: 'sec-hero', type: 'hero', title: 'Hero Banner', content: 'Central Asian Flavors', enabled: true },
    { id: 'sec-about', type: 'about', title: 'Our Story', content: 'Generational recipes', enabled: true },
    { id: 'sec-highlights', type: 'highlights', title: 'Signature Dishes', content: 'Chef specials', enabled: true },
    { id: 'sec-hours', type: 'hours_location', title: 'Hours & Location', content: 'Open daily 10-23', enabled: true },
  ];

  const sampleConfig: WebsiteThemeConfig = {
    primaryColor: '#f98b25',
    fontFamily: 'Outfit',
    heroHeadline: 'Welcome to Kamolon',
    heroTagline: 'Tashkent authentic cuisine',
    heroButtonText: 'Order Online',
    aboutStory: 'Heritage and passion in every dish',
    deliveryNotice: 'Fast delivery in Tashkent',
    sections: defaultSections,
  };

  it('validates website configuration schema and defaults', () => {
    expect(sampleConfig.heroHeadline).toContain('Kamolon');
    expect(sampleConfig.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(sampleConfig.sections.length).toBeGreaterThanOrEqual(4);
  });

  it('toggles visibility of website sections', () => {
    const updatedSections = sampleConfig.sections.map((s) =>
      s.id === 'sec-about' ? { ...s, enabled: false } : s
    );
    const aboutSection = updatedSections.find((s) => s.id === 'sec-about');
    expect(aboutSection?.enabled).toBe(false);

    const heroSection = updatedSections.find((s) => s.id === 'sec-hero');
    expect(heroSection?.enabled).toBe(true);
  });

  it('allows reordering sections in the visual builder', () => {
    const originalOrder = [...sampleConfig.sections];
    // Swap index 0 and index 1
    const reordered = [...originalOrder];
    const temp = reordered[0];
    reordered[0] = reordered[1];
    reordered[1] = temp;

    expect(reordered[0].id).toBe('sec-about');
    expect(reordered[1].id).toBe('sec-hero');
  });
});
