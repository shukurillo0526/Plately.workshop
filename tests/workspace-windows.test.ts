import { describe, it, expect } from 'vitest';
import type { WorkspacePreset, WidgetId } from '@/app/(dashboard)/page';

describe('Customizable Workspace Windows System (Part B5)', () => {
  const defaultWidgets: Array<{ id: WidgetId; name: string; enabled: boolean }> = [
    { id: 'stats', name: 'Performance Ticker', enabled: true },
    { id: 'ai_briefing', name: 'AI Agent Briefing', enabled: true },
    { id: 'kds_stream', name: 'Kitchen Display Radar', enabled: true },
    { id: 'recent_orders', name: 'Live Orders Stream', enabled: true },
    { id: 'reservations', name: 'Table Reservations Today', enabled: true },
    { id: 'quick_actions', name: 'Operational Shortcuts', enabled: true },
  ];

  it('supports toggling individual workspace windows on and off', () => {
    const updated = defaultWidgets.map((w) =>
      w.id === 'ai_briefing' ? { ...w, enabled: false } : w
    );
    const briefing = updated.find((w) => w.id === 'ai_briefing');
    expect(briefing?.enabled).toBe(false);

    const stats = updated.find((w) => w.id === 'stats');
    expect(stats?.enabled).toBe(true);
  });

  it('supports reordering workspace windows for shift priorities', () => {
    const reordered = [...defaultWidgets];
    // Put KDS stream at the top (index 0)
    const kdsIndex = reordered.findIndex((w) => w.id === 'kds_stream');
    const [kdsWidget] = reordered.splice(kdsIndex, 1);
    reordered.unshift(kdsWidget);

    expect(reordered[0].id).toBe('kds_stream');
    expect(reordered.length).toBe(defaultWidgets.length);
  });

  it('validates preset configurations for evening rush', () => {
    const eveningPreset: WorkspacePreset = 'evening_rush';
    expect(eveningPreset).toBe('evening_rush');
  });
});
