import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Auth from './pages/Auth';
import WorkspaceSetup from './pages/WorkspaceSetup';
import JoinWorkspace from './pages/JoinWorkspace';

function AppRoutes() {
  const { user, coupleId, workspaceLoading, logout } = useAuth();

  // Not logged in → show auth page
  if (!user) {
    return (
      <Routes>
        <Route path="/join/:token" element={<JoinWorkspace />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // Loading workspace info
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

  return (
    <Routes>
      {/* Invite join route — accessible even if already logged in */}
      <Route path="/join/:token" element={<JoinWorkspace />} />

      {/* Main app routes */}
      <Route
        path="/"
        element={
          coupleId ? (
            <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-100">
              {/* Navigation */}
              <nav className="bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center">
                <span className="font-black text-xl text-emerald-700 tracking-tight">KahwinGo 💍</span>
                <button
                  onClick={() => logout()}
                  className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </nav>
              <Dashboard />
            </div>
          ) : (
            <WorkspaceSetup />
          )
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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