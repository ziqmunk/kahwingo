import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type DashboardData = {
  totalSavings: number;
  progressPercentage: number;
  target_amount: number;
};

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
        const res = await axios.get<DashboardData>(`${API_URL}/api/savings/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Backend offline or unauthorized:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading your love goals...</div>;

  // Fallback UI if not authenticated or backend is not running yet
  if (!data) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-800">KahwinGo Dashboard 💍</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800">
          <p className="font-semibold">Hey there! You're seeing the frontend workspace layout.</p>
          <p className="text-sm mt-1">To view live mock data, you'll eventually log in or hook up your backend server.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-800">KahwinGo Dashboard 💍</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Savings</h3>
            <p className="text-3xl font-black text-emerald-600 mt-2">RM {data.totalSavings}</p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(data.progressPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-right text-gray-500 mt-1">{data.progressPercentage.toFixed(1)}% of RM {data.target_amount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}