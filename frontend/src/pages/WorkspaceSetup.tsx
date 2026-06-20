import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

type Step = 'create' | 'invite';

export default function WorkspaceSetup() {
  const { token, refreshWorkspace } = useAuth();
  const [step, setStep] = useState<Step>('create');

  // Step 1 state
  const [role, setRole] = useState<'Bride' | 'Groom' | ''>('');
  const [weddingDate, setWeddingDate] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Step 2 state
  const [inviteToken, setInviteToken] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return setCreateError('Please select your role.');
    setCreateError('');
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/workspace/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role, wedding_date: weddingDate || null, target_amount: parseFloat(targetAmount) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Refresh context so coupleId is populated
      await refreshWorkspace();
      setStep('invite');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await fetch(`${API_URL}/api/workspace/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteToken(data.token);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to generate invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const inviteLink = inviteToken
    ? `${window.location.origin}/join/${inviteToken}`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-rose-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">💍</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome to KahwinGo</h1>
          <p className="text-gray-500 mt-2 text-sm">Let's set up your wedding workspace.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'create' || step === 'invite' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-all ${step === 'invite' ? 'bg-emerald-500' : 'bg-gray-200'}`} />
        </div>

        {/* ── STEP 1: Create Workspace ── */}
        {step === 'create' && (
          <form onSubmit={handleCreateWorkspace} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Step 1 — Create your workspace</h2>
              <p className="text-sm text-gray-500 mt-1">Set your wedding goals together.</p>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">{createError}</div>
            )}

            {/* Role selector */}
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

            {/* Wedding date */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Wedding Date <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Savings target */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Savings Target (RM) <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">RM</span>
                <input
                  type="number"
                  min="0"
                  placeholder="35000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating || !role}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create Workspace →'}
            </button>
          </form>
        )}

        {/* ── STEP 2: Invite Partner ── */}
        {step === 'invite' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Step 2 — Invite your partner</h2>
              <p className="text-sm text-gray-500 mt-1">Share this link with your partner so they can join your workspace.</p>
            </div>

            {inviteError && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">{inviteError}</div>
            )}

            {!inviteToken ? (
              <button
                onClick={handleGenerateInvite}
                disabled={inviteLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {inviteLoading ? 'Generating...' : '✉️ Generate Invite Link'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 break-all font-mono">
                  {inviteLink}
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
                <p className="text-center text-xs text-gray-400">Link expires in 7 days. One-time use only.</p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => refreshWorkspace()}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors cursor-pointer"
              >
                Skip for now → Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
