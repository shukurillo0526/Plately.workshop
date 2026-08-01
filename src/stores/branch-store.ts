// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Branch Selector Store
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  timezone: string;
  is_active: boolean;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  accepts_dine_in: boolean;
  default_prep_time_minutes: number;
}

interface BranchStore {
  branches: Branch[];
  selectedBranchId: string | null;

  setBranches: (branches: Branch[]) => void;
  selectBranch: (branchId: string) => void;
  getSelectedBranch: () => Branch | null;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      branches: [],
      selectedBranchId: null,

      setBranches: (branches) => {
        set({ branches });
        // Auto-select first branch if none selected
        if (!get().selectedBranchId && branches.length > 0) {
          set({ selectedBranchId: branches[0].id });
        }
      },

      selectBranch: (branchId) => set({ selectedBranchId: branchId }),

      getSelectedBranch: () => {
        const { branches, selectedBranchId } = get();
        return branches.find((b) => b.id === selectedBranchId) ?? null;
      },
    }),
    {
      name: 'plately-branch-store',
    }
  )
);
