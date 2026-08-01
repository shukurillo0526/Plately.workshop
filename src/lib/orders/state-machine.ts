// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Order State Machine
// ═══════════════════════════════════════════════════════════════

/**
 * Order statuses — aligned with existing consumer app `orders.status` CHECK constraint.
 * Workshop extends the consumer statuses with: 'rejected', 'dispatched', 'failed_delivery'.
 *
 * Consumer app uses:
 *   confirmed → preparing → ready → picked_up/delivering → completed
 *   + cancelled
 *
 * Workshop KDS maps 'confirmed' → displayed as "NEW" in the UI.
 */
export const ORDER_STATUSES = [
  'confirmed',       // New order from consumer app (shows as "NEW" on KDS)
  'preparing',       // Kitchen accepted and cooking
  'ready',           // Food ready for pickup or dispatch
  'picked_up',       // Customer picked up (pickup orders)
  'dispatched',      // Sent to delivery fleet
  'delivering',      // Driver en route to customer
  'completed',       // Successfully delivered/picked up
  'rejected',        // Merchant rejected the order
  'cancelled',       // Consumer or system cancelled
  'failed_delivery', // Delivery attempt failed
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Valid state transitions.
 * Key = current status, Value = array of allowed target statuses.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  confirmed:       ['preparing', 'rejected', 'cancelled'],
  preparing:       ['ready', 'cancelled'],
  ready:           ['dispatched', 'picked_up', 'cancelled'],
  dispatched:      ['delivering', 'picked_up', 'failed_delivery'],
  delivering:      ['completed', 'failed_delivery'],
  picked_up:       ['completed'],
  completed:       [],
  rejected:        [],
  cancelled:       [],
  failed_delivery: ['dispatched', 'cancelled'], // Allow retry dispatch
} as const;

/**
 * Check if a status transition is valid.
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (TRANSITIONS[from] as readonly OrderStatus[]).includes(to);
}

/**
 * Validate a transition and throw if invalid.
 */
export function validateTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid order transition: "${from}" → "${to}". ` +
      `Allowed transitions from "${from}": [${TRANSITIONS[from].join(', ')}]`
    );
  }
}

/**
 * Get the list of valid next statuses from a given status.
 */
export function getNextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[status] ?? [];
}

/**
 * Status display configuration for KDS UI.
 */
export const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  labelUz: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  confirmed:       { label: 'New',           labelUz: 'Yangi',        color: 'text-amber-400',   bgColor: 'bg-amber-500/20',   icon: '🔔' },
  preparing:       { label: 'Preparing',     labelUz: 'Tayyorlanmoqda', color: 'text-blue-400',  bgColor: 'bg-blue-500/20',    icon: '🍳' },
  ready:           { label: 'Ready',         labelUz: 'Tayyor',       color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: '✅' },
  dispatched:      { label: 'Dispatched',    labelUz: 'Yuborildi',    color: 'text-purple-400',  bgColor: 'bg-purple-500/20',  icon: '🚗' },
  delivering:      { label: 'Delivering',    labelUz: 'Yetkazilmoqda', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20',  icon: '🛵' },
  picked_up:       { label: 'Picked Up',     labelUz: 'Olib ketildi', color: 'text-teal-400',    bgColor: 'bg-teal-500/20',    icon: '🧑' },
  completed:       { label: 'Completed',     labelUz: 'Bajarildi',    color: 'text-green-400',   bgColor: 'bg-green-500/20',   icon: '🎉' },
  rejected:        { label: 'Rejected',      labelUz: 'Rad etildi',   color: 'text-red-400',     bgColor: 'bg-red-500/20',     icon: '❌' },
  cancelled:       { label: 'Cancelled',     labelUz: 'Bekor qilindi', color: 'text-gray-400',   bgColor: 'bg-gray-500/20',    icon: '🚫' },
  failed_delivery: { label: 'Failed',        labelUz: 'Muvaffaqiyatsiz', color: 'text-red-400',  bgColor: 'bg-red-500/20',     icon: '⚠️' },
};

/**
 * KDS-visible statuses (active orders shown on the board).
 */
export const KDS_ACTIVE_STATUSES: OrderStatus[] = [
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'delivering',
];

/**
 * Default auto-reject timeout in minutes.
 */
export const DEFAULT_AUTO_REJECT_MINUTES = 5;
