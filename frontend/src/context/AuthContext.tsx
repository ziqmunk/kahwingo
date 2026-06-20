import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient, type AuthResponse, type AuthTokenResponsePassword } from '@supabase/supabase-js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

type WorkspaceInfo = {
  coupleId: string;
  couple: {
    wedding_date: string | null;
    target_amount: number;
  };
  members: Array<{ role: string; user_id: string; profiles: { name: string; email: string } }>;
} | null;

type AuthContextValue = {
  user: unknown;
  token: string | null;
  coupleId: string | null;
  workspace: WorkspaceInfo;
  loading: boolean;
  workspaceLoading: boolean;
  login: (email: string, password: string) => Promise<AuthTokenResponsePassword>;
  signup: (email: string, password: string, name: string) => Promise<AuthResponse>;
  logout: () => Promise<{ error: Error | null }>;
  refreshWorkspace: () => Promise<void>;
};

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<unknown>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceInfo>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Fetch workspace info from the backend using the current token
  const refreshWorkspace = useCallback(async (authToken?: string) => {
    const t = authToken ?? token;
    if (!t) {
      setCoupleId(null);
      setWorkspace(null);
      return;
    }
    setWorkspaceLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workspace/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupleId(data.coupleId ?? null);
        setWorkspace(data.coupleId ? data : null);
      }
    } catch {
      setCoupleId(null);
      setWorkspace(null);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Safety timeout: if Supabase takes too long (e.g. bad .env keys), stop loading anyway
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
      clearTimeout(timeout);
      if (session?.access_token) {
        refreshWorkspace(session.access_token);
      }
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
      if (session?.access_token) {
        refreshWorkspace(session.access_token);
      } else {
        setCoupleId(null);
        setWorkspace(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <AuthContext.Provider value={{ user, token, coupleId, workspace, loading, workspaceLoading, login, signup, logout, refreshWorkspace }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}