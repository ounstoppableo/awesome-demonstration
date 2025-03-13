import pool from '@/app/lib/db';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      const searchParams = req.nextUrl.searchParams;
      const componentName = searchParams.get('componentName') as string;
      const limit: number = +(searchParams.get('limit') || 2);
      const searchRegexp = componentName.split('').join('.*');
      try {
        const [rowsTemp, fieldsTemp] = await pool.query(
          'select * from componentInfo where name REGEXP ? limit 1',
          [searchRegexp],
        );
        if (!rowsTemp || (rowsTemp as any).length === 0) {
          return handleCompleted({
            msg: '查询成功!',
            data: { result: [], index: null, page: null },
          });
        }
        const target = (rowsTemp as any[])[0];
        const page = Math.floor((target.index - 1) / limit) + 1;
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
          data: { pageList: result, index: target.index, page },
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
