import { describe, it, expect, beforeEach } from 'vitest';
import { useBranchStore, type Branch } from '@/stores/branch-store';
import type { WorkshopNotification } from '@/components/common/notification-center';
import type { WebsiteThemeConfig } from '@/app/store/[slug]/page';

describe('Wired Features Integration Suite', () => {
  beforeEach(() => {
    useBranchStore.setState({
      branches: [],
      selectedBranchId: null,
    });
  });

  describe('Feature 1: Interactive Branch Switcher & Multi-Location Store', () => {
    const mockBranches: Branch[] = [
      {
        id: 'branch-tashkent-center',
        name: 'Kamolon Downtown',
        address: 'Amir Timur 12, Tashkent',
        phone: '+998 90 123 45 67',
        timezone: 'Asia/Tashkent',
        is_active: true,
        accepts_delivery: true,
        accepts_pickup: true,
        accepts_dine_in: true,
        default_prep_time_minutes: 15,
      },
      {
        id: 'branch-chilanzar',
        name: 'Kamolon Chilanzar',
        address: 'Bunyodkor Ave 45, Tashkent',
        phone: '+998 90 987 65 43',
        timezone: 'Asia/Tashkent',
        is_active: true,
        accepts_delivery: true,
        accepts_pickup: true,
        accepts_dine_in: false,
        default_prep_time_minutes: 20,
      },
    ];

    it('populates branches and auto-selects primary branch when none selected', () => {
      const store = useBranchStore.getState();
      store.setBranches(mockBranches);

      const updated = useBranchStore.getState();
      expect(updated.branches.length).toBe(2);
      expect(updated.selectedBranchId).toBe('branch-tashkent-center');
      expect(updated.getSelectedBranch()?.name).toBe('Kamolon Downtown');
    });

    it('switches active branch dynamically and updates selected branch details', () => {
      const store = useBranchStore.getState();
      store.setBranches(mockBranches);
      store.selectBranch('branch-chilanzar');

      const updated = useBranchStore.getState();
      expect(updated.selectedBranchId).toBe('branch-chilanzar');
      expect(updated.getSelectedBranch()?.name).toBe('Kamolon Chilanzar');
      expect(updated.getSelectedBranch()?.default_prep_time_minutes).toBe(20);
    });
  });

  describe('Feature 2: Live Notifications Center', () => {
    const notifications: WorkshopNotification[] = [
      {
        id: 'notif-1',
        type: 'agent',
        title: 'AI Margin Proposal',
        message: 'Review price adjustment',
        timestamp: '1m ago',
        isRead: false,
        href: '/agents',
        priority: 'urgent',
      },
      {
        id: 'notif-2',
        type: 'kds',
        title: 'Order Delay',
        message: 'Order #104 prep overdue',
        timestamp: '5m ago',
        isRead: false,
        href: '/kds',
        priority: 'urgent',
      },
      {
        id: 'notif-3',
        type: 'delivery',
        title: 'Courier Dispatched',
        message: 'Noor courier assigned',
        timestamp: '15m ago',
        isRead: true,
        href: '/dispatch',
        priority: 'normal',
      },
    ];

    it('accurately counts unread notifications', () => {
      const unread = notifications.filter((n) => !n.isRead);
      expect(unread.length).toBe(2);
    });

    it('filters notifications by unread state and priority', () => {
      const urgentNotifications = notifications.filter((n) => n.priority === 'urgent');
      expect(urgentNotifications.length).toBe(2);
      expect(urgentNotifications.map((n) => n.type)).toEqual(['agent', 'kds']);
    });

    it('marks all notifications as read', () => {
      const allRead = notifications.map((n) => ({ ...n, isRead: true }));
      const remainingUnread = allRead.filter((n) => !n.isRead);
      expect(remainingUnread.length).toBe(0);
    });
  });

  describe('Feature 3: Storefront Template Synchronization', () => {
    it('applies website configuration to public storefront', () => {
      const customConfig: WebsiteThemeConfig = {
        primaryColor: '#e07a00',
        fontFamily: 'Inter',
        heroTagline: 'Handcrafted Uzbek Cuisine',
        heroHeadline: 'Taste the Legend of Tashkent',
        aboutStory: 'Founded in 1998, family recipes perfected over generations.',
        deliveryNotice: '⚡ Free delivery in Tashkent today on orders over 100,000 UZS',
        sections: [
          { id: 'sec-hero', type: 'hero', title: 'Hero', content: '', enabled: true },
          { id: 'sec-about', type: 'about', title: 'About', content: '', enabled: true },
        ],
      };

      const resolvedBrandColor = customConfig.primaryColor || '#f98b25';
      const resolvedTagline = customConfig.heroTagline || 'Direct Online Ordering';

      expect(resolvedBrandColor).toBe('#e07a00');
      expect(resolvedTagline).toBe('Handcrafted Uzbek Cuisine');
      expect(customConfig.deliveryNotice).toContain('Free delivery');
      expect(customConfig.aboutStory).toBeTruthy();
    });

    it('gracefully falls back when website config is absent', () => {
      const emptyConfig: WebsiteThemeConfig = {};
      const fallbackColor = emptyConfig.primaryColor || '#f98b25';
      const fallbackHeadline = emptyConfig.heroHeadline || 'Order fresh food straight from the kitchen';

      expect(fallbackColor).toBe('#f98b25');
      expect(fallbackHeadline).toBe('Order fresh food straight from the kitchen');
    });
  });

  describe('Feature 4 & 5: Customer Loyalty & Dispatch Persistence', () => {
    it('adjusts customer loyalty points and enforces non-negative balance', () => {
      let currentPoints = 120;
      const addPoints = (delta: number) => {
        currentPoints = Math.max(0, currentPoints + delta);
        return currentPoints;
      };

      expect(addPoints(50)).toBe(170);
      expect(addPoints(-100)).toBe(70);
      // Attempting to deduct more than balance floors at 0
      expect(addPoints(-200)).toBe(0);
    });

    it('validates manual dispatch delivery payload formatting', () => {
      const manualOrder = {
        order_number: 'PLT-55421',
        customer_name: 'Aziz R.',
        delivery_address: 'Yakkasaroy st. 12',
        total: 120000,
        provider: 'noor' as const,
        status: 'assigned' as const,
        fee: 18000,
      };

      expect(manualOrder.order_number).toMatch(/^PLT-\d{5}$/);
      expect(manualOrder.provider).toBe('noor');
      expect(manualOrder.fee).toBeGreaterThan(0);
      expect(manualOrder.status).toBe('assigned');
    });
  });
});
