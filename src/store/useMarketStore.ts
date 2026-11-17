// src/store/useMarketStore.ts
import { create } from 'zustand';
import { MarketSnapshot } from '@/types/market';
import { marketService } from '@/services/MockMarketDataProvider';

interface MarketStoreState {
  snapshot: MarketSnapshot | null;
  activeTab: 'dolar' | 'center' | 'indice' | 'all';
  isPaused: boolean;
  setSnapshot: (snapshot: MarketSnapshot) => void;
  setActiveTab: (tab: 'dolar' | 'center' | 'indice' | 'all') => void;
  togglePause: () => void;
  resetSimulation: () => void;
}

export const useMarketStore = create<MarketStoreState>((set, get) => ({
  snapshot: null,
  activeTab: 'all',
  isPaused: false,

  setSnapshot: (snapshot: MarketSnapshot) => {
    set({ snapshot, isPaused: snapshot.isPaused });
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
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
