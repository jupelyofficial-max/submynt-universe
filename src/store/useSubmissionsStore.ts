import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ListingSubmission } from "@/types/subscription";

interface AddInput {
  name: string;
  website: string;
  category: ListingSubmission["category"];
  tagline: string;
  priceMonthly: number;
  region: ListingSubmission["region"];
  contactEmail: string;
}

interface SubmissionsState {
  submissions: ListingSubmission[];
  hydrated: boolean;
  setHydrated: () => void;
  add: (input: AddInput) => void;
}

export const useSubmissionsStore = create<SubmissionsState>()(
  persist(
    (set) => ({
      submissions: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      add: (input) =>
        set((state) => ({
          submissions: [
            ...state.submissions,
            { id: `submission-${Date.now()}`, submittedAt: new Date().toISOString(), ...input },
          ],
        })),
    }),
    {
      name: "submynt-listing-submissions",
      skipHydration: true,
      partialize: (state) => ({ submissions: state.submissions }) as SubmissionsState,
    }
  )
);
