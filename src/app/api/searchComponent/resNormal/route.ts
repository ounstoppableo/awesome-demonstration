import pool from '@/app/lib/db';
import redisPool from '@/app/lib/redis';
import getSearchParams from '@/utils/getSearchParams';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';
import { commandOptions } from 'redis';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      try {
        const searchParams = req.nextUrl.searchParams;
        const componentName = getSearchParams(
          searchParams.get('componentName'),
        ) as string;
        const finalIndex = +(
          getSearchParams(searchParams.get('finalIndex')) || 0
        );
        const limit: number = +(
          getSearchParams(searchParams.get('limit')) || 4
        );
        const searchRegexp = new RegExp(`.*${componentName}.*`, 'ig');
        const client = await redisPool.acquire();
        const componentNameMapId = await client.lRange(
          `componentNameMapIndex`,
          0,
          -1,
        );
        const result: any =
          componentNameMapId
            .map((item: string) => {
              const temp = item.split(':');
              return {
                name: temp[0],
                index: temp[1],
                id: temp[2],
              };
            })
            .sort((a: any, b: any) => a.index - b.index)
            .filter((item: any) => {
              return (
                (!componentName || item.name.match(searchRegexp)) &&
                (!finalIndex || item.index > finalIndex)
              );
            })
            .slice(0, limit) || [];

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
