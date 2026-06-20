const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, token missing' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }

  // Fetch couple data linked to this user
  const { data: memberData } = await supabase
    .from('couple_members')
    .select('couple_id, role')
    .eq('user_id', user.id)
    .single();

  req.user = user;
  req.coupleId = memberData?.couple_id || null;
  req.userRole = memberData?.role || null;

  next();
};

module.exports = { protect };