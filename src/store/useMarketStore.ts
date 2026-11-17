// src/store/useMarketStore.ts
import { create } from 'zustand';
import { MarketSnapshot } from '@/types/market';
import { marketService } from '@/services/MockMarketDataProvider';

export type MobileTab = 'dolar' | 'indice' | 'mercado' | 'fluxo';

interface MarketStoreState {
  snapshot: MarketSnapshot | null;
  mobileTab: MobileTab;
  isPaused: boolean;
  setSnapshot: (snapshot: MarketSnapshot) => void;
  setMobileTab: (tab: MobileTab) => void;
  togglePause: () => void;
  resetSimulation: () => void;
}

export const useMarketStore = create<MarketStoreState>((set, get) => ({
  snapshot: null,
  mobileTab: 'dolar',
  isPaused: false,

  setSnapshot: (snapshot: MarketSnapshot) => {
    set({ snapshot, isPaused: snapshot.isPaused });
  },

  setMobileTab: (mobileTab: MobileTab) => {
    set({ mobileTab });
  },

  togglePause: () => {
    const { isPaused } = get();
    if (isPaused) {
      marketService.resume();
      set({ isPaused: false });
    } else {
      marketService.pause();
      set({ isPaused: true });
    }
  },

  resetSimulation: () => {
    marketService.reset();
  },
}));
