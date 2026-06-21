const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

let isConnected = false;
let redisClient = null;

const redisUrl = process.env.REDIS_URL || '';

if (!redisUrl) {
  console.warn('⚠️  Redis skipped: REDIS_URL is not set.');
} else {
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries >= 3) {
            console.error('❌ Redis: Max reconnect attempts reached. Disabling Redis.');
            isConnected = false;
            return false;
          }
          return Math.min(retries * 500, 3000);
        }
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err.message));
    redisClient.on('connect', () => {
      isConnected = true;
      console.log('🚀 Connected to Redis successfully!');
    });

    (async () => {
      try {
        await redisClient.connect();
      } catch (err) {
        console.error('❌ Could not connect to Redis:', err.message);
        isConnected = false;
      }
    })();
  } catch (err) {
    console.error('❌ Redis config error (invalid URL?):', err.message);
    redisClient = null;
  }
}


// Safe wrapper — all callers use these instead of redisClient directly
const safeGet = async (key) => {
  if (!redisClient || !isConnected) return null;
  try { return await redisClient.get(key); } catch { return null; }
};

const safeSet = async (key, ttl, value) => {
  if (!redisClient || !isConnected) return;
  try { await redisClient.setEx(key, ttl, value); } catch { /* skip */ }
};

const safeDel = async (key) => {
  if (!redisClient || !isConnected) return;
  try { await redisClient.del(key); } catch { /* skip */ }
};

module.exports = { safeGet, safeSet, safeDel };