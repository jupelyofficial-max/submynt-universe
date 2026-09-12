import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProfileSubmissionState {
  submitted: boolean;
  submittedEmail: string | null;
  hydrated: boolean;
  setHydrated: () => void;
  markSubmitted: (email: string) => void;
}

export const useProfileSubmissionStore = create<ProfileSubmissionState>()(
  persist(
    (set) => ({
      submitted: false,
      submittedEmail: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      markSubmitted: (email) => set({ submitted: true, submittedEmail: email }),
    }),
    {
      name: "submynt-profile-submission",
      skipHydration: true,
      partialize: (state) => ({ submitted: state.submitted, submittedEmail: state.submittedEmail }) as ProfileSubmissionState,
    }
  )
);
