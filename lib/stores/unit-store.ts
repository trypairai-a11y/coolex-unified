import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UnitSystem = 'imperial' | 'metric';

interface UnitState {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
}

export const useUnitStore = create<UnitState>()(
  persist(
    (set) => ({
      unitSystem: 'imperial',
      setUnitSystem: (system) => set({ unitSystem: system }),
      toggleUnitSystem: () =>
        set((state) => ({
          unitSystem: state.unitSystem === 'imperial' ? 'metric' : 'imperial',
        })),
    }),
    { name: 'coolex-units' }
  )
);
