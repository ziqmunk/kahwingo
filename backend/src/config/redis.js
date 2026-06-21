const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

let redisClient = null;
let isConnected = false;

// Only attempt connection if REDIS_URL is set and not localhost on production
const redisUrl = process.env.REDIS_URL || '';
const isLocalhost = redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1');
const isProduction = process.env.NODE_ENV === 'production';

if (!redisUrl || (isProduction && isLocalhost)) {
  console.warn('⚠️  Redis skipped: REDIS_URL is missing or pointing to localhost in production.');
} else {
  redisClient = createClient({
    url: redisUrl,
    socket: {
      // Stop retrying after 3 failed attempts
      reconnectStrategy: (retries) => {
        if (retries >= 3) {
          console.error('❌ Redis: Max reconnect attempts reached. Disabling Redis.');
          isConnected = false;
          return false; // stop retrying
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