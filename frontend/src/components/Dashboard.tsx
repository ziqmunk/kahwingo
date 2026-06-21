import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

type Contribution = {
  id: string;
  amount: number;
  note: string | null;
  contributed_at: string;
  user_id: string;
  profiles: { name: string; email: string };
};

type DashboardData = {
  totalSavings: number;
  progressPercentage: number;
  target_amount: number;
  wedding_date: string | null;
  monthsRemaining: number | null;
  monthlyTarget: number | null;
  contributions: Contribution[];
};

type ContributionForm = { amount: string; note: string; contributed_at: string };
const emptyForm: ContributionForm = { amount: '', note: '', contributed_at: new Date().toISOString().split('T')[0] };

export default function Dashboard() {
  const { token, user, workspace } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContributionForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Invite state
  const [inviteToken, setInviteToken] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get<DashboardData>(`${API_URL}/api/savings/dashboard`, { headers });
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Contribution CRUD ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.amount || parseFloat(form.amount) <= 0) return setFormError('Enter a valid amount');
    setSubmitting(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/savings/contribution/${editingId}`, form, { headers });
      } else {
        await axios.post(`${API_URL}/api/savings/contribution`, form, { headers });
      }
      setShowAdd(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchDashboard();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (c: Contribution) => {
    setEditingId(c.id);
    setForm({ amount: String(c.amount), note: c.note || '', contributed_at: c.contributed_at.split('T')[0] });
    setShowAdd(true);
    setFormError('');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/savings/contribution/${id}`, { headers });
      fetchDashboard();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Invite ──
  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/workspace/invite`, {}, { headers });
      setInviteToken(res.data.token);
    } catch (err) {
      console.error('Invite error:', err);
    } finally {
      setInviteLoading(false);
    }
  };

  const inviteLink = inviteToken ? `${window.location.origin}/join/${inviteToken}` : '';
  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Wedding countdown ──
  const daysRemaining = data?.wedding_date
    ? Math.max(0, Math.ceil((new Date(data.wedding_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const hasPartner = workspace && workspace.members && workspace.members.length >= 2;
  const partner = workspace?.members?.find((m: any) => m.user_id !== (user as any)?.id);
  const myRole = workspace?.members?.find((m: any) => m.user_id === (user as any)?.id)?.role;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-2 animate-pulse">💍</div>
          <p className="text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">

      {/* ── Partner / Invite Banner ── */}
      {!hasPartner && (
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-rose-800 text-sm">💌 Invite your partner</p>
              <p className="text-xs text-rose-500 mt-0.5">Share your workspace with your {myRole === 'Bride' ? 'Groom' : 'Bride'}</p>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Invite
            </button>
          </div>
        </div>
      )}

      {hasPartner && partner && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-lg">
            {partner.role === 'Bride' ? '👰' : '🤵'}
          </div>
          <div>
            <p className="font-semibold text-emerald-800 text-sm">{partner.profiles?.name || partner.profiles?.email}</p>
            <p className="text-xs text-emerald-500">{partner.role} · Partner</p>
          </div>
          <div className="ml-auto text-xs text-emerald-400">✅ Linked</div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Savings */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Savings</p>
          <p className="text-4xl font-black text-emerald-600 mt-1">
            RM {(data?.totalSavings ?? 0).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(data?.progressPercentage ?? 0, 100)}%` }}
            />
          </div>
          <p className="text-xs text-right text-gray-400 mt-1">
            {(data?.progressPercentage ?? 0).toFixed(1)}% of RM {(data?.target_amount ?? 0).toLocaleString('ms-MY')}
          </p>
        </div>

        {/* Wedding Countdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Days Left</p>
          <p className="text-3xl font-black text-purple-600 mt-1">{daysRemaining ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">
            {data?.wedding_date ? new Date(data.wedding_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Set wedding date'}
          </p>
        </div>

        {/* Monthly Target */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Save / Month</p>
          <p className="text-2xl font-black text-orange-500 mt-1">
            {data?.monthlyTarget != null ? `RM ${Math.ceil(data.monthlyTarget).toLocaleString('ms-MY')}` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {data?.monthsRemaining != null ? `${data.monthsRemaining} months left` : 'No date set'}
          </p>
        </div>
      </div>

      {/* ── Contribution History ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 flex items-center justify-between border-b border-gray-50">
          <h2 className="font-bold text-gray-800">Contributions</h2>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setForm(emptyForm); setFormError(''); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            + Add
          </button>
        </div>

        {!data?.contributions?.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <p className="text-2xl mb-2">💰</p>
            No contributions yet. Add your first one!
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.contributions.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  {c.profiles?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-emerald-700 text-sm">RM {parseFloat(String(c.amount)).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-gray-400">{new Date(c.contributed_at).toLocaleDateString('ms-MY')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{c.profiles?.name || 'Unknown'}</p>
                  {c.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.note}</p>}
                </div>
                {c.user_id === (user as any)?.id && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(c)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">Edit</button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === c.id ? '...' : 'Del'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Edit Contribution' : 'Add Contribution'}</h3>

            {formError && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Amount (RM)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">RM</span>
                  <input
                    type="number" step="0.01" min="0.01" required
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="block w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="500.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                <input
                  type="date" required
                  value={form.contributed_at}
                  onChange={e => setForm(f => ({ ...f, contributed_at: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Note <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <input
                  type="text"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Salary savings"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer">
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Invite Modal ── */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg">💌 Invite Your Partner</h3>
            <p className="text-sm text-gray-500">Share this link with your partner to join your workspace.</p>

            {!inviteToken ? (
              <button onClick={handleGenerateInvite} disabled={inviteLoading} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-50">
                {inviteLoading ? 'Generating...' : '✉️ Generate Invite Link'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 break-all font-mono">{inviteLink}</div>
                <button onClick={handleCopy} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm cursor-pointer">
                  {copied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
                <p className="text-center text-xs text-gray-400">Expires in 7 days · One-time use</p>
              </div>
            )}
            <button onClick={() => { setShowInvite(false); setInviteToken(''); }} className="w-full py-2 text-gray-400 text-sm cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}