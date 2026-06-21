const supabase = require('../config/supabase');

const VALID_CATEGORIES = ['Nikah', 'Dewan', 'Katering', 'Baju Pengantin', 'Hantaran', 'Documents', 'Others'];

const getChecklists = async (req, res) => {
  const { coupleId } = req;
  if (!coupleId) return res.status(400).json({ error: 'No couple workspace found' });

  const { category } = req.query;
  let query = supabase
    .from('checklists')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: true });

  if (category && VALID_CATEGORIES.includes(category)) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const createChecklist = async (req, res) => {
  const { title, description, due_date, category } = req.body;
  const { coupleId } = req;

  if (!title) return res.status(400).json({ error: 'Title is required' });
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const { data, error } = await supabase
    .from('checklists')
    .insert([{
      couple_id: coupleId,
      title,
      description: description || null,
      due_date: due_date || null,
      category: category || 'Others',
      completed: false,
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

const updateChecklist = async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, category, completed } = req.body;
  const { coupleId } = req;

  const { data: existing } = await supabase
    .from('checklists')
    .select('id')
    .eq('id', id)
    .eq('couple_id', coupleId)
    .single();

  if (!existing) return res.status(404).json({ error: 'Checklist item not found' });

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (due_date !== undefined) updates.due_date = due_date;
  if (category !== undefined) updates.category = category;
  if (completed !== undefined) updates.completed = completed;

  const { data, error } = await supabase
    .from('checklists')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
};

const deleteChecklist = async (req, res) => {
  const { id } = req.params;
  const { coupleId } = req;

  const { data: existing } = await supabase
    .from('checklists')
    .select('id')
    .eq('id', id)
    .eq('couple_id', coupleId)
    .single();

  if (!existing) return res.status(404).json({ error: 'Checklist item not found' });

  const { error } = await supabase.from('checklists').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
};

module.exports = { getChecklists, createChecklist, updateChecklist, deleteChecklist };
