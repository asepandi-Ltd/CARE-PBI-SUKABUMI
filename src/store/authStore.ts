import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  mockLogin: (username: string, role: string, nama: string, unit: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  mockLogin: (username: string, role: string, nama: string, unit: string) => {
    const email = `${username.replace(/\s+/g, '')}@rsudalmulk.co.id`;
    const mockUser = { id: `mock-${username.replace(/\s+/g, '')}`, email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as User;
    const mockProfile = { id: `mock-${username.replace(/\s+/g, '')}`, email, nama, role, unit };
    localStorage.setItem('mock_session', 'true');
    localStorage.setItem('mock_profile', JSON.stringify(mockProfile));
    set({ user: mockUser, profile: mockProfile, loading: false });
  },
  checkAuth: async () => {
    try {
      if (localStorage.getItem('mock_session') === 'true') {
        const savedProfile = localStorage.getItem('mock_profile');
        let mockProfile = { id: 'mock-id-123', email: 'admin@rsudalmulk.co.id', nama: 'Admin RS', role: 'Super Admin', unit: 'IT' };
        if (savedProfile) {
          try {
            mockProfile = JSON.parse(savedProfile);
          } catch (e) {}
        }
        const mockUser = { id: mockProfile.id, email: mockProfile.email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' } as User;
        set({ user: mockUser, profile: mockProfile, loading: false });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        set({ user: session.user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    } catch (error) {
      console.error('Auth error:', error);
      set({ user: null, profile: null, loading: false });
    }
  },
  signOut: async () => {
    localStorage.removeItem('mock_session');
    localStorage.removeItem('mock_profile');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout failed, clearing local session anyway:', e);
    }
    set({ user: null, profile: null });
  },
}));
