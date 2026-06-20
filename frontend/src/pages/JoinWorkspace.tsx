import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export default function JoinWorkspace() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { token: authToken, user, refreshWorkspace } = useAuth();

  const [role, setRole] = useState<'Bride' | 'Groom' | ''>('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If not logged in, redirect to auth with the invite token stored
  if (!user) {
    sessionStorage.setItem('pendingInviteToken', inviteToken ?? '');
    navigate('/');
    return null;
  }

  const handleJoin = async () => {
    if (!role) return setError('Please select your role.');
    setError('');
    setJoining(true);
    try {
      const res = await fetch(`${API_URL}/api/workspace/join/${inviteToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      // Refresh workspace context then redirect to dashboard
      await refreshWorkspace();
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to join workspace');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">💌</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">You're Invited!</h1>
          <p className="text-gray-500 mt-2 text-sm">Your partner has invited you to join their KahwinGo wedding workspace.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
          {success ? (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl">🎉</div>
              <p className="font-bold text-emerald-700 text-lg">Successfully joined!</p>
              <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">{error}</div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">I am the</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {(['Bride', 'Groom'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-4 rounded-2xl border-2 font-bold text-sm transition-all cursor-pointer
                        ${role === r
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}
                    >
                      {r === 'Bride' ? '👰 Bride' : '🤵 Groom'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleJoin}
                disabled={joining || !role}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {joining ? 'Joining...' : '💍 Join Workspace'}
              </button>

              <p className="text-center text-xs text-gray-400">
                This invite link is one-time use and expires in 7 days.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
