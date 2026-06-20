import { AuthProvider } from './context/AuthContext.tsx';
import Dashboard from './components/Dashboard.tsx';

function App() {
  return (
    <AuthProvider>
      {/* Tailwind container styling */}
      <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-100">
        <Dashboard />
      </div>
    </AuthProvider>
  );
}

export default App;