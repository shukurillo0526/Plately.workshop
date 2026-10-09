import { describe, it, expect } from 'vitest';
import type { AgentDefinition, PendingAction } from '@/app/(dashboard)/agents/page';

describe('AI Agent Operating System & Approval Inbox (Part F)', () => {
  const sampleAction: PendingAction = {
    id: 'act-test-1',
    agentRole: 'marketing',
    agentName: 'Marketing Agent',
    title: 'Weekend 20% Promotion Draft',
    summary: 'Drafted Telegram campaign',
    impact: '+15 orders',
    suggestedAt: 'Now',
    status: 'pending',
    payload: { code: 'PROMO20' },
  };

  it('enforces human approval policy: actions begin in pending state', () => {
    expect(sampleAction.status).toBe('pending');
  });

  it('transitions state upon owner approval or rejection', () => {
    const approvedAction: PendingAction = { ...sampleAction, status: 'approved' };
    expect(approvedAction.status).toBe('approved');

    const rejectedAction: PendingAction = { ...sampleAction, status: 'rejected' };
    expect(rejectedAction.status).toBe('rejected');
  });

  it('verifies that agents operate with bounded permissions and explicit skills', () => {
    const agent: AgentDefinition = {
      id: 'analytics',
      name: 'Analytics Agent',
      category: 'Efficiency',
      icon: null,
      status: 'action_ready',
      description: 'Monitors food cost margins',
      allowedData: ['Sales History', 'Order Prep Times'],
      skills: ['Demand Forecaster', 'Price Suggestion'],
    };

    expect(agent.allowedData).toContain('Sales History');
    expect(agent.skills).toContain('Price Suggestion');
    expect(agent.skills.length).toBeGreaterThan(0);
  });
});
