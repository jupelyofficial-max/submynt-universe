import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PerksUserType = "student" | "entrepreneur" | "professional";

export interface PerksLead {
  id: string;
  userType: PerksUserType;
  email: string;
  phone: string;
  submittedAt: string;
}

interface AddInput {
  userType: PerksUserType;
  email: string;
  phone: string;
}

interface PerksState {
  leads: PerksLead[];
  hydrated: boolean;
  setHydrated: () => void;
  add: (input: AddInput) => void;
}

export const usePerksStore = create<PerksState>()(
  persist(
    (set) => ({
      leads: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      add: (input) =>
        set((state) => ({
          leads: [...state.leads, { id: `perks-${Date.now()}`, submittedAt: new Date().toISOString(), ...input }],
        })),
    }),
    {
      name: "submynt-perks-leads",
      skipHydration: true,
      partialize: (state) => ({ leads: state.leads }) as PerksState,
    }
  )
);
