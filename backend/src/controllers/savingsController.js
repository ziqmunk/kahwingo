const supabase = require('../config/supabase');
const redisClient = require('../config/redis'); // Assume standard redis connection setup

const getSavingsDashboard = async (req, res) => {
  try {
    const { coupleId } = req;
    if (!coupleId) return res.status(400).json({ error: 'No couple workspace found' });

    const cacheKey = `savings:${coupleId}`;
    
    // 1. Try fetching from Redis Cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // 2. Cache Miss - Fetch from Supabase PostgreSQL
    const { data: couple } = await supabase.from('couples').select('*').eq('id', coupleId).single();
    const { data: contributions } = await supabase.from('contributions').select('*').eq('couple_id', coupleId);

    const totalSavings = contributions.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const progressPercentage = couple.target_amount > 0 ? (totalSavings / couple.target_amount) * 100 : 0;

    const responseData = {
      target_amount: couple.target_amount,
      totalSavings,
      progressPercentage,
      wedding_date: couple.wedding_date
    };

    // 3. Save to Redis with an Expiry (e.g., 1 hour)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addContribution = async (req, res) => {
  const { amount, note } = req.body;
  const { coupleId, user } = req;

  const { data, error } = await supabase
    .from('contributions')
    .insert([{ couple_id: coupleId, user_id: user.id, amount, note }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  // Invalidate cache on Mutation
  await redisClient.del(`savings:${coupleId}`);

  res.status(201).json(data);
};

module.exports = { getSavingsDashboard, addContribution };