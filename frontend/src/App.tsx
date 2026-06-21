import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Checklist from './pages/Checklist';
import Auth from './pages/Auth';
import WorkspaceSetup from './pages/WorkspaceSetup';
import JoinWorkspace from './pages/JoinWorkspace';

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-pb">
      <div className="max-w-2xl mx-auto flex">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-semibold transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`
          }
        >
          <span className="text-xl">🏠</span>
          Dashboard
        </NavLink>
        <NavLink
          to="/checklist"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-semibold transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`
          }
        >
          <span className="text-xl">📋</span>
          Checklist
        </NavLink>
      </div>
    </nav>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-100">
      <nav className="bg-white border-b border-gray-100 py-3 px-6 flex justify-between items-center sticky top-0 z-30">
        <span className="font-black text-lg text-emerald-700 tracking-tight">KahwinGo 💍</span>
        <button
          onClick={() => logout()}
          className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          Logout
        </button>
      </nav>
      {children}
      <BottomNav />
    </div>
  );
}

function AppRoutes() {
  const { user, coupleId, workspaceLoading } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/join/:token" element={<JoinWorkspace />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  if (workspaceLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💍</div>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!coupleId) {
    return (
      <Routes>
        <Route path="/join/:token" element={<JoinWorkspace />} />
        <Route path="*" element={<WorkspaceSetup />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/join/:token" element={<JoinWorkspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;