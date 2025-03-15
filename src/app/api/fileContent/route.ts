import pool from '@/app/lib/db';
import redisPool from '@/app/lib/redis';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      const searchParams = req.nextUrl.searchParams;
      const scope = searchParams.get('scope') as string;
      const fileName = searchParams.get('fileName') as string;
      if (!scope || !fileName) handleError(ResponseMsg.paramsError);
      try {
        const client = await redisPool.acquire();
        let result = await client.get(`fileMap:${scope}:${fileName}`);
        if (!result) {
          const [rows, fields] = await pool.query(
            'select fileContent from fileMap where scope=? and fileName=?',
            [scope, fileName],
          );
          result = (rows as any)[0];
          if (!result)
            return handleCompleted({
              msg: '查询成功!',
              data: { fileContent: '' },
            });
          await client.set(
            `fileMap:${scope}:${fileName}`,
            JSON.stringify(result),
            {
              EX: 60 * 60,
            },
          );
        } else {
          result = JSON.parse(result);
        }
        redisPool.release(client);
        handleCompleted({
          msg: '查询成功!',
          data: result,
        });
      } catch (err) {
        console.error(err);
        handleError(ResponseMsg.serverError);
      }
    },
  );
}
