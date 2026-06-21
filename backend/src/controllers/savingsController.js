const supabase = require('../config/supabase');
const { safeGet, safeSet, safeDel } = require('../config/redis');

const getSavingsDashboard = async (req, res) => {
  try {
    const { coupleId } = req;
    if (!coupleId) return res.status(400).json({ error: 'No couple workspace found' });

    const cacheKey = `savings:${coupleId}`;

    const cachedData = await safeGet(cacheKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    const { data: couple } = await supabase.from('couples').select('*').eq('id', coupleId).single();
    const { data: contributions } = await supabase
      .from('contributions')
      .select('*, profiles(name, email)')
      .eq('couple_id', coupleId)
      .order('contributed_at', { ascending: false });

    const totalSavings = (contributions || []).reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const progressPercentage = couple.target_amount > 0 ? (totalSavings / couple.target_amount) * 100 : 0;

    // Calculate months remaining
    let monthsRemaining = null;
    let monthlyTarget = null;
    if (couple.wedding_date) {
      const today = new Date();
      const wedding = new Date(couple.wedding_date);
      const diffMs = wedding - today;
      monthsRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
      const remaining = Math.max(0, couple.target_amount - totalSavings);
      monthlyTarget = monthsRemaining > 0 ? remaining / monthsRemaining : remaining;
    }

    const responseData = {
      target_amount: couple.target_amount,
      totalSavings,
      progressPercentage,
      wedding_date: couple.wedding_date,
      monthsRemaining,
      monthlyTarget,
      contributions: contributions || [],
    };

    await safeSet(cacheKey, 3600, JSON.stringify(responseData));
    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getContributions = async (req, res) => {
  const { coupleId } = req;
  if (!coupleId) return res.status(400).json({ error: 'No couple workspace found' });

  const { data, error } = await supabase
    .from('contributions')
    .select('*, profiles(name, email)')
    .eq('couple_id', coupleId)
    .order('contributed_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const addContribution = async (req, res) => {
  const { amount, note, contributed_at } = req.body;
  const { coupleId, user } = req;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const { data, error } = await supabase
    .from('contributions')
    .insert([{
      couple_id: coupleId,
      user_id: user.id,
      amount: parseFloat(amount),
      note: note || null,
      contributed_at: contributed_at || new Date().toISOString(),
    }])
    .select('*, profiles(name, email)');

  if (error) return res.status(400).json({ error: error.message });

  await safeDel(`savings:${coupleId}`);
  res.status(201).json(data[0]);
};

const editContribution = async (req, res) => {
  const { id } = req.params;
  const { amount, note, contributed_at } = req.body;
  const { coupleId, user } = req;

  // Only allow editing own contributions
  const { data: existing } = await supabase
    .from('contributions')
    .select('user_id')
    .eq('id', id)
    .eq('couple_id', coupleId)
    .single();

  if (!existing) return res.status(404).json({ error: 'Contribution not found' });
  if (existing.user_id !== user.id) return res.status(403).json({ error: 'You can only edit your own contributions' });

  const { data, error } = await supabase
    .from('contributions')
    .update({ amount: parseFloat(amount), note, contributed_at })
    .eq('id', id)
    .select('*, profiles(name, email)');

  if (error) return res.status(400).json({ error: error.message });

  await safeDel(`savings:${coupleId}`);
  res.json(data[0]);
};

const deleteContribution = async (req, res) => {
  const { id } = req.params;
  const { coupleId, user } = req;

  const { data: existing } = await supabase
    .from('contributions')
    .select('user_id')
    .eq('id', id)
    .eq('couple_id', coupleId)
    .single();

  if (!existing) return res.status(404).json({ error: 'Contribution not found' });
  if (existing.user_id !== user.id) return res.status(403).json({ error: 'You can only delete your own contributions' });

  const { error } = await supabase.from('contributions').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });

  await safeDel(`savings:${coupleId}`);
  res.json({ success: true });
};

module.exports = { getSavingsDashboard, getContributions, addContribution, editContribution, deleteContribution };