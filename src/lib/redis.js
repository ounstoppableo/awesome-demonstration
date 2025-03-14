const redis = require('redis');

const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  database: 3,
});

module.exports = client.connect();
