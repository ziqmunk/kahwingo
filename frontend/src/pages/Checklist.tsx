import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const CATEGORIES = ['All', 'Nikah', 'Dewan', 'Katering', 'Baju Pengantin', 'Hantaran', 'Documents', 'Others'] as const;
type Category = typeof CATEGORIES[number];

type ChecklistItem = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  category: string;
  completed: boolean;
  created_at: string;
};

type ItemForm = { title: string; description: string; due_date: string; category: string };
const emptyForm: ItemForm = { title: '', description: '', due_date: '', category: 'Others' };

export default function Checklist() {
  const { token } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get<ChecklistItem[]>(`${API_URL}/api/checklist`, { headers });
      setItems(res.data);
    } catch (err) {
      console.error('Checklist fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);
  const done = filtered.filter(i => i.completed).length;
  const total = filtered.length;

  const handleToggle = async (item: ChecklistItem) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
    try {
      await axios.put(`${API_URL}/api/checklist/${item.id}`, { completed: !item.completed }, { headers });
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: item.completed } : i));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setFormError('Title is required');
    setFormError('');
    setSubmitting(true);
    try {
      if (editingId) {
        const res = await axios.put<ChecklistItem>(`${API_URL}/api/checklist/${editingId}`, form, { headers });
        setItems(prev => prev.map(i => i.id === editingId ? res.data : i));
      } else {
        const res = await axios.post<ChecklistItem>(`${API_URL}/api/checklist`, form, { headers });
        setItems(prev => [res.data, ...prev]);
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description || '', due_date: item.due_date || '', category: item.category });
    setShowModal(true);
    setFormError('');
  };

  const handleDelete = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await axios.delete(`${API_URL}/api/checklist/${id}`, { headers });
    } catch {
      fetchItems(); // Revert on failure
    }
  };

  const categoryEmoji: Record<string, string> = {
    Nikah: '🕌', Dewan: '🏛️', Katering: '🍽️', 'Baju Pengantin': '👗',
    Hantaran: '🎁', Documents: '📋', Others: '📌',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Checklist 📋</h1>
          {!loading && <p className="text-sm text-gray-400 mt-0.5">{done}/{total} completed</p>}
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingId(null); setForm(emptyForm); setFormError(''); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          + Add Task
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-5">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-right text-gray-400 mt-1">{Math.round((done / total) * 100)}% done</p>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border
              ${activeCategory === cat
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'}`}
          >
            {cat === 'All' ? '🗂 All' : `${categoryEmoji[cat]} ${cat}`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-2 animate-pulse">📋</div>
          <p className="text-sm">Loading checklist...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm">{activeCategory === 'All' ? 'No tasks yet. Add your first!' : `No tasks in ${activeCategory}`}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(item => (
            <li key={item.id} className={`bg-white rounded-2xl border transition-all ${item.completed ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
              <div className="p-4 flex items-start gap-3">
                <button
                  onClick={() => handleToggle(item)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all cursor-pointer flex items-center justify-center
                    ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}
                >
                  {item.completed && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.title}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{categoryEmoji[item.category]} {item.category}</span>
                  </div>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                  {item.due_date && (
                    <p className="text-xs text-orange-500 mt-1">
                      📅 {new Date(item.due_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(item)} className="text-xs text-blue-400 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer">Del</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Edit Task' : 'Add Task'}</h3>

            {formError && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-3">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Title *</label>
                <input
                  type="text" required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Book wedding hall"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none bg-white"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{categoryEmoji[cat]} {cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Description <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Additional details..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Due Date <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer">
                  {submitting ? 'Saving...' : editingId ? 'Save' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
