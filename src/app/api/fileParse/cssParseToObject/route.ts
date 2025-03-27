import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import { NextRequest } from 'next/server';
import useAuth from '../../auth/hooks/useAuth';

async function parseCssModule(cssCode: string): Promise<any> {
  const classMap: Record<string, string> = {};
  const result = await postcss([
    postcssModules({
      getJSON(_, json) {
        Object.assign(classMap, json); // 收集解析后的 className
      },
      generateScopedName: '[name]__[local]__[hash:base64:5]', // 生成类似 Webpack 的哈希类名
    }),
  ]).process(cssCode, { from: undefined });

  return { map: classMap, css: result.css };
}

export async function POST(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      const body = await req.json();
      const fileContent = body.fileContent as string;
      try {
        const result = await parseCssModule(fileContent);
        handleCompleted({
          msg: '查询成功!',
          data: result,
        });
      } catch (err) {
        console.error(err);
        handleError(ResponseMsg.paramsError);
      }
    },
  );
}
