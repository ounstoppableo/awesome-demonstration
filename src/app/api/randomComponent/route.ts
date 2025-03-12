import pool from '@/app/lib/db';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      const searchParams = req.nextUrl.searchParams;
      const page = +(searchParams.get('page') || 1);
      const limit: number = +(searchParams.get('limit') || 2);
      const startIndex = (page - 1) * limit + 1;
      const endIndex = page * limit;
      try {
        const [rows, fields] = await pool.query(
          'select * from componentInfo where `index`>? and `index`<=?',
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
        handleCompleted({ msg: '查询成功!', data: result });
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
