import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient, type AuthResponse, type AuthTokenResponsePassword } from '@supabase/supabase-js';

type AuthContextValue = {
  user: unknown;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthTokenResponsePassword>;
  signup: (email: string, password: string, name: string) => Promise<AuthResponse>;
  logout: () => Promise<{ error: Error | null }>;
  loading: boolean;
};

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<unknown>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: if Supabase takes too long (e.g. bad .env keys), stop loading anyway
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      setLoading(false);
      clearTimeout(timeout);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
  const signup = (email: string, password: string, name: string) =>
    supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
  const logout = () => supabase.auth.signOut();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💍</div>
          <p>Loading KahwinGo...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}