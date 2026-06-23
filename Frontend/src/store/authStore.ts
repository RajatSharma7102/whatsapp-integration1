import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('crm_token'),
  user: null, // Should ideally be hydrated from a /me endpoint on load
  isAuthenticated: !!localStorage.getItem('crm_token'),
  
  setAuth: (token, user) => {
    localStorage.setItem('crm_token', token);
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('crm_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
