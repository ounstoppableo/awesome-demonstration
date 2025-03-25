import pool from '@/app/lib/db';
import redisPool from '@/app/lib/redis';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';
import useAuth from '../auth/hooks/useAuth';

export async function DELETE(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      const searchParams = req.nextUrl.searchParams;
      const id = searchParams.get('id') as string;
      if (!id) handleError(ResponseMsg.paramsError);
      try {
        if (!(await useAuth())) return handleError(ResponseMsg.authError);
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          await Promise.all([
            connection.query('delete from componentInfo where id = ?', [id]),
            connection.query('delete from fileMap where id = ?', [id]),
          ]);
          await connection.query('SET @row_number = 0;');
          await connection.query(
            'UPDATE componentInfo SET `index` = (@row_number := @row_number + 1);',
          );
          await connection.commit();
          await connection.release();
          const client = await redisPool.acquire();
          await client.del('componentNameMapIndex');
          const [rows, fileds] = await pool.query(
            'select name,id,`index` from componentInfo',
          );
          await client.lPush(
            'componentNameMapIndex',
            (rows as any).map(
              (row: any) => row.name + ':' + row.index + ':' + row.id,
            ),
          );
          redisPool.release(client);
          handleCompleted({
            msg: '删除成功!',
          });
        } catch (err) {
          console.error(err);
          handleError(ResponseMsg.serverError);
          await connection.rollback();
          await connection.release();
        }
      } catch (err) {
        console.error(err);
        handleError(ResponseMsg.serverError);
      }
    },
  );
}
