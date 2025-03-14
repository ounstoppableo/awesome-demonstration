const https = require('https');
const fs = require('fs');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const pool = require('./src/lib/db.js');
  const redisClient = require('./src/lib/redis.js');
  const [rows, fields] = await pool.query(
    'select name,`index` from componentInfo',
  );
  await (
    await redisClient
  ).lPush(
    'componentNameMapIndex',
    rows.map((row) => row.name + ':' + row.index),
  );
  https
    .createServer(
      {
        key: fs.readFileSync('./cert/server.key'), // 私钥路径
        cert: fs.readFileSync('./cert/server.crt'), // 证书路径
      },
      (req, res) => {
        handle(req, res);
      },
    )
    .listen(process.env.SERVER_PORT, (err) => {
      if (err) throw err;
      console.log(`> Ready on PORT ${process.env.SERVER_PORT}`);
    });
});
