const supabase = require('../config/supabase');
const { randomUUID } = require('crypto');

// POST /api/workspace/create
// Creates a couples row + adds the creator to couple_members
const createWorkspace = async (req, res) => {
  const { wedding_date, target_amount, role } = req.body;
  const { user } = req;

  if (!role || !['Bride', 'Groom'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Bride or Groom' });
  }

  // Check if user already has a workspace
  if (req.coupleId) {
    return res.status(400).json({ error: 'You already belong to a workspace' });
  }

  // 1. Create the couple row
  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert([{ wedding_date: wedding_date || null, target_amount: target_amount || 0 }])
    .select()
    .single();

  if (coupleError) return res.status(500).json({ error: coupleError.message });

  // 2. Add the creator to couple_members (references profiles.id)
  const { error: memberError } = await supabase
    .from('couple_members')
    .insert([{ couple_id: couple.id, user_id: user.id, role }]);

  if (memberError) {
    // Rollback: delete the couple we just created
    await supabase.from('couples').delete().eq('id', couple.id);
    return res.status(500).json({ error: memberError.message });
  }

  res.status(201).json({ coupleId: couple.id, wedding_date: couple.wedding_date, target_amount: couple.target_amount });
};

// POST /api/workspace/invite
// Generates a one-time invite token valid for 7 days
const createInvite = async (req, res) => {
  const { coupleId, user } = req;

  if (!coupleId) {
    return res.status(400).json({ error: 'You must create a workspace before inviting a partner' });
  }

  // Check if couple already has 2 members
  const { data: members } = await supabase
    .from('couple_members')
    .select('id')
    .eq('couple_id', coupleId);

  if (members && members.length >= 2) {
    return res.status(400).json({ error: 'Workspace already has 2 members' });
  }

  // Generate a unique token
  const token = randomUUID();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { error } = await supabase
    .from('invites')
    .insert([{ couple_id: coupleId, invited_by: user.id, token, expires_at }]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ token, expires_at });
};

// POST /api/workspace/join/:token
// Lets a second user accept an invite and join the workspace
const joinWorkspace = async (req, res) => {
  const { token } = req.params;
  const { role } = req.body;
  const { user, coupleId: existingCoupleId } = req;

  if (!role || !['Bride', 'Groom'].includes(role)) {
    return res.status(400).json({ error: 'Role must be Bride or Groom' });
  }

  if (existingCoupleId) {
    return res.status(400).json({ error: 'You already belong to a workspace' });
  }

  // Find the invite
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return res.status(404).json({ error: 'Invite not found' });
  }
  if (invite.used) {
    return res.status(400).json({ error: 'Invite link has already been used' });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Invite link has expired' });
  }
  if (invite.invited_by === user.id) {
    return res.status(400).json({ error: 'You cannot join your own invite' });
  }

  // Check the role is not already taken
  const { data: existingMembers } = await supabase
    .from('couple_members')
    .select('role')
    .eq('couple_id', invite.couple_id);

  const takenRoles = existingMembers?.map((m) => m.role) || [];
  if (takenRoles.includes(role)) {
    return res.status(400).json({ error: `Role "${role}" is already taken in this workspace` });
  }

  // Add the joiner to couple_members
  const { error: memberError } = await supabase
    .from('couple_members')
    .insert([{ couple_id: invite.couple_id, user_id: user.id, role }]);

  if (memberError) return res.status(500).json({ error: memberError.message });

  // Mark invite as used
  await supabase.from('invites').update({ used: true }).eq('id', invite.id);

  res.status(200).json({ coupleId: invite.couple_id, message: 'Successfully joined workspace!' });
};

// GET /api/workspace/me
// Returns the current user's couple info + both members
const getMyWorkspace = async (req, res) => {
  const { coupleId, user } = req;

  if (!coupleId) {
    return res.status(200).json({ coupleId: null });
  }

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single();

  if (coupleError) return res.status(500).json({ error: coupleError.message });

  const { data: members } = await supabase
    .from('couple_members')
    .select('role, user_id, profiles(name, email)')
    .eq('couple_id', coupleId);

  res.json({ coupleId, couple, members, userId: user.id });
};

module.exports = { createWorkspace, createInvite, joinWorkspace, getMyWorkspace };
