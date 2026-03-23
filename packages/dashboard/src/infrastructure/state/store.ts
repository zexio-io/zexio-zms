"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Project {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
  projects?: Project[];
}

interface ZmsState {
  activeOrg: Organization | null;
  activeProject: Project | null;
  tempRecoveryShards: string[] | null;
  setOrg: (org: Organization) => void;
  setProject: (project: Project) => void;
  setTempShards: (shards: string[] | null) => void;
}

export const useZmsStore = create<ZmsState>()(
  persist(
    (set) => ({
      activeOrg: null,
      activeProject: null,
      tempRecoveryShards: null,
      setOrg: (org) => set({ activeOrg: org }),
      setProject: (project) => set({ activeProject: project }),
      setTempShards: (shards) => set({ tempRecoveryShards: shards }),
    }),
    {
      name: "zms-storage",
    }
  )
);
const UI_LABELS = {
  tactical: {
    commander: "Commander",
    password: "Tactical Password",
    shard: "Master Key Fragment",
    vault: "Tactical Vault",
    setup: "Tactical Setup",
    recovery: "Tactical Recovery",
    placeholders: {
      name: "e.g. Commander Alpha",
      password: "Min. 8 chars (Alphanumeric & Symbol)",
      shard: "zms_rs_...",
    }
  },
  standard: {
    commander: "Administrator",
    password: "Password",
    shard: "Recovery Key Fragment",
    vault: "Secure Vault",
    setup: "Account Setup",
    recovery: "Account Recovery",
    placeholders: {
      name: "e.g. John Doe",
      password: "••••••••••••",
      shard: "Enter fragment code",
    }
  }
};

interface UIState {
  appVersion: string;
  uiMode: 'tactical' | 'standard';
  appName: string;
  isInitialized: boolean;
  setAppVersion: (v: string) => void;
  setUiMode: (mode: 'tactical' | 'standard') => void;
  getLabels: () => typeof UI_LABELS.tactical;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      appVersion: "1.1.0",
      uiMode: "standard",
      appName: "ZMS Community Edition",
      isInitialized: false,
      setAppVersion: (v) => set({ appVersion: v }),
      setUiMode: (mode) => set({ uiMode: mode }),
      getLabels: () => UI_LABELS[get().uiMode],
    }),
    {
      name: "zms-ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        appVersion: state.appVersion,
        uiMode: state.uiMode,
        appName: state.appName,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
