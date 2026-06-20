const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Create a Redis client instance using your environment variable
const redisClient = createClient({
  url: process.env.REDIS_URL
});

// Log any connection errors to the terminal
redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// Connect to Redis asynchronously 
(async () => {
  try {
    await redisClient.connect();
    console.log('🚀 Connected to Redis successfully!');
  } catch (err) {
    console.error('❌ Could not connect to Redis:', err);
  }
})();

module.exports = redisClient;