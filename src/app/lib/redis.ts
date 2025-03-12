import { createClient } from 'redis';
import { createPool } from 'generic-pool';

// 创建 Redis 连接池
const redisPool = createPool(
  {
    create: async () => {
      const client = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        database: 3,
      });
      await client.connect();
      return client;
    },
    destroy: async (client: any) => {
      await client.quit();
    },
  },
  {
    max: 10,
    min: 2,
  },
);
export default redisPool;
