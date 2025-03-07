import pool from '@/app/lib/db';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import useAuth from './hooks/useAuth';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      if (await useAuth()) {
        handleCompleted({
          msg: '校验成功!',
          data: true,
        });
      } else {
        handleError(ResponseMsg.authError);
      }
    },
  );
}
