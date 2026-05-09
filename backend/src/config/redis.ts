import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

const redis = redisUrl
  ? new Redis(redisUrl)
  : new Redis({ lazyConnect: true, enableOfflineQueue: false });

redis.on('error', (err) => {
  console.warn('Redis connection error (non-fatal):', err.message);
});

export default redis;
