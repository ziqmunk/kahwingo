import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Auth from './pages/Auth';

function NavigationWrapper() {
  const { user, logout } = useAuth();

  // If user is not logged in, render the login/signup view
  if (!user) {
    return <Auth />;
  }

  // If user is authenticated, render the app workspace dashboard
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-100">
      {/* Simple Navigation Bar with Logout */}
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
  );
}

function App() {
  return (
    <AuthProvider>
      <NavigationWrapper />
    </AuthProvider>
  );
}

export default App;