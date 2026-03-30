import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Mock test accounts
const MOCK_ACCOUNTS: Record<string, User> = {
  'admin@coolex.com': {
    id: 'user-001',
    name: 'Admin User',
    email: 'admin@coolex.com',
    role: 'admin',
    status: 'active',
    company: 'COOLEX / RIC',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00Z',
  },
  'engineer@coolex.com': {
    id: 'user-002',
    name: 'Sara Al-Mutairi',
    email: 'engineer@coolex.com',
    role: 'engineer',
    status: 'active',
    company: 'COOLEX / RIC',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-03-15T00:00:00Z',
  },
  'dealer@coolex.com': {
    id: 'user-003',
    name: 'Ahmed Al-Rashidi',
    email: 'dealer@coolex.com',
    role: 'dealer',
    status: 'active',
    company: 'Al-Rashidi HVAC Trading',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-06-01T00:00:00Z',
  },
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,

        login: async (email: string, _password: string) => {
          // Simulate network delay
          await new Promise(r => setTimeout(r, 800));
          const user = MOCK_ACCOUNTS[email.toLowerCase()];
          if (user) {
            set({ user, isAuthenticated: true });
            return true;
          }
          return false;
        },

        logout: () => {
          set({ user: null, isAuthenticated: false });
        },
      }),
      {
        name: 'coolex-auth',
        // Validate rehydrated state - if user object is corrupt, reset to logged out
        onRehydrateStorage: () => (state) => {
          if (state?.isAuthenticated && (!state.user || !state.user.name || !state.user.email)) {
            state.isAuthenticated = false;
            state.user = null;
          }
        },
      }
    ),
    { name: 'AuthStore' }
  )
);
