import pool from '@/app/lib/db';
import redisPool from '@/app/lib/redis';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      try {
        const client = await redisPool.acquire();
        const componentNameMapId = await client.lRange(
          `componentNameMapId`,
          0,
          -1,
        );
        const result: any = componentNameMapId.map((item: string) => {
          const temp = item.split(':');
          return {
            name: temp[0],
            id: temp[1],
          };
        });
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
