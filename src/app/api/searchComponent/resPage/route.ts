import pool from '@/app/lib/db';
import redisPool from '@/app/lib/redis';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      const searchParams = req.nextUrl.searchParams;
      const componentName = searchParams.get('componentName') as string;
      const limit: number = +(searchParams.get('limit') || 2);
      const searchRegexp = new RegExp(`.*${componentName}.*`, 'i');
      try {
        const client = await redisPool.acquire();
        const componentNameMapIndex = await client.lRange(
          `componentNameMapIndex`,
          0,
          -1,
        );
        let matchComponent;
        for (let i = 0; i < componentNameMapIndex.length; i++) {
          if (componentNameMapIndex[i].match(searchRegexp)) {
            matchComponent = componentNameMapIndex[i];
            break;
          }
        }
        if (!matchComponent) {
          return handleCompleted({
            msg: '查询成功!',
            data: { pageList: [], index: null, page: null },
          });
        }

        const targetIndex = +matchComponent.split(':')[1];
        const page = Math.floor((targetIndex - 1) / limit) + 1;
        const startIndex = (page - 1) * limit + 1;
        const endIndex = page * limit;
        const [rows, fields] = await pool.query(
          'select * from componentInfo where `index`>=? and `index`<=?',
          [startIndex, endIndex],
        );
        const result = (rows as any[]).map((item: componentInfo) => ({
          ...item,
          framework: JSON.parse(item.framework),
          htmlExternalFiles: item.htmlExternalFiles
            ? JSON.parse(item.htmlExternalFiles)
            : null,
          htmlRelevantFiles: item.htmlRelevantFiles
            ? JSON.parse(item.htmlRelevantFiles)
            : null,
          vueExternalFiles: item.vueExternalFiles
            ? JSON.parse(item.vueExternalFiles)
            : null,
          vueRelevantFiles: item.vueRelevantFiles
            ? JSON.parse(item.vueRelevantFiles)
            : null,
          reactExternalFiles: item.reactExternalFiles
            ? JSON.parse(item.reactExternalFiles)
            : null,
          reactRelevantFiles: item.reactRelevantFiles
            ? JSON.parse(item.reactRelevantFiles)
            : null,
        }));

        handleCompleted({
          msg: '查询成功!',
          data: { pageList: result, index: targetIndex, page },
        });
      } catch (err) {
        console.error(err);
        handleError(ResponseMsg.serverError);
      }
    },
  );
}

export type componentInfo = {
  id: string;
  name: string;
  framework: string;
  htmlEntryFileName: string | null;
  htmlExternalFiles: string | null;
  htmlRelevantFiles: string | null;
  reactEntryFileName: string;
  reactExternalFiles: string | null;
  reactRelevantFiles: string | null;
  vueEntryFileName: string;
  vueExternalFiles: string | null;
  vueRelevantFiles: string | null;
};
