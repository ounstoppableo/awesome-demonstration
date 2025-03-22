import { NextRequest } from 'next/server';
import { string, z } from 'zod';
import pool from '@/app/lib/db';

import { promises as fs } from 'fs';
import handleResponse, { ResponseMsg } from '@/utils/handleResponse';
import {
  ComponentInfoFormType,
  formSchema,
} from '@/utils/addComponentFormDataFormat';
import { formatDataForBackendAdaptor } from '@/utils/dataFormat';
import GlobalTag from '@/utils/globalTag';
import useAuth from '../auth/hooks/useAuth';
import redisPool from '@/app/lib/redis';

export async function GET(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      const searchParams = req.nextUrl.searchParams;
      const id = searchParams.get('id') as string;
      try {
        const [rows, fields] = await pool.query(
          'select * from componentInfo where id = ?',
          [id],
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
          data: result[0],
        });
      } catch (err) {
        console.error(err);
        handleError(ResponseMsg.serverError);
      }
    },
  );
}

export async function POST(req: NextRequest) {
  return await handleResponse(
    req,
    async (req, handleCompleted, handleError) => {
      if (!(await useAuth())) return handleError(ResponseMsg.authError);
      try {
        const formContent: z.infer<typeof formSchema> = await req.json();
        const storeSchema = formatDataForBackendAdaptor(formContent);
        const files = extractFile(formContent);
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        let shouldUpdateFiles = null;
        if (formContent.addOrEdit === 'edit') {
          const currentFileNames = files.map((file) => file.fileName);
          const [originalFiles] = await connection.query(
            'select fileName from fileMap where id = ?',
            [formContent.editComponentId],
          );
          const deleteFiles = (originalFiles as any[])?.filter(
            (originalFile: any) =>
              !currentFileNames.includes(originalFile.fileName),
          );
          shouldUpdateFiles = (originalFiles as any[])
            ?.filter((originalFile: any) =>
              currentFileNames.includes(originalFile.fileName),
            )
            .map((file) => file.fileName);
          await Promise.all(
            deleteFiles.map(
              (file) =>
                new Promise(async (resolve) => {
                  try {
                    await connection.query(
                      'delete from fileMap where id=? and fileName=?',
                      [formContent.editComponentId, file.fileName],
                    );
                    resolve(1);
                  } catch (err) {
                    handleError(ResponseMsg.serverError);
                    connection.rollback().then(() => {
                      connection.release();
                    });
                  }
                }),
            ),
          );
        }
        const res = await Promise.all(
          files
            .filter((file) => file.filePath !== GlobalTag.fileLoaded)
            .map((file) => {
              return new Promise(async (resolve) => {
                try {
                  const data = await fs.readFile(file.filePath);
                  fs.unlink(file.filePath);
                  resolve({
                    fileName: file.fileName,
                    fileContent: data.toString(),
                  });
                } catch {
                  handleError(ResponseMsg.fileError);
                }
              });
            }),
        );
        await Promise.all(
          res.map(
            (item: any) =>
              new Promise((resolve) => {
                const shouldUpdate = shouldUpdateFiles?.includes(item.fileName);
                connection
                  .query(
                    `${shouldUpdate ? 'update' : 'insert into'}  ${shouldUpdate ? 'fileMap set fileContent=? where fileName=? and id=?' : 'fileMap (fileContent,fileName ,scope) VALUES (?,?,?)'}`,
                    [item.fileContent, item.fileName, storeSchema.id],
                  )
                  .then(() => {
                    resolve(1);
                  })
                  .catch((err) => {
                    console.log(err);
                    handleError(ResponseMsg.serverError);
                    connection.rollback().then(() => {
                      connection.release();
                    });
                  });
              }),
          ),
        );
        for (let key in storeSchema) {
          if (typeof (storeSchema as any)[key] !== 'string') {
            (storeSchema as any)[key] = JSON.stringify(
              (storeSchema as any)[key],
            );
          }
        }

        await connection
          .query(
            `${
              formContent.addOrEdit === 'add'
                ? `INSERT INTO componentInfo (${Object.keys(storeSchema)
                    .map((key) => `\`${key}\``)
                    .join(',')}) VALUES (${Object.keys(storeSchema)
                    .map((key) => '?')
                    .join(',')})`
                : 'update componentInfo set ? where id=?'
            };`,
            formContent.addOrEdit === 'add'
              ? Object.values(storeSchema)
              : [storeSchema, storeSchema.id],
          )
          .then((data) => {
            connection.commit().then(() => {
              connection.release();
            });
          })
          .catch((err) => {
            console.log(err);
            handleError(ResponseMsg.serverError);
            connection.rollback().then(() => {
              connection.release();
            });
          });

        handleCompleted({
          msg: '添加成功!',
        });
        try {
          if (formContent.addOrEdit === 'add') {
            const [rows, fields] = await pool.query(
              'SELECT id,name,`index` FROM componentInfo WHERE `index` = (SELECT MAX(`index`) FROM componentInfo);',
            );
            if ((rows as any) && (rows as any).length !== 0) {
              const client = await redisPool.acquire();
              client.lPush(
                'componentNameMapIndex',
                `${(rows as any)[0].name}:${(rows as any)[0].index}:${(rows as any)[0].id}`,
              );
              redisPool.release(client);
            }
          }
        } catch (err) {
          console.log(err);
        }
      } catch (err: any) {
        handleError(err);
      }
    },
  );
}

const extractFile = (formContent: ComponentInfoFormType) => {
  const files = [
    formContent.files?.vue?.entryFile,
    formContent.files?.vue?.relevantFiles.filter((info) => !info.external),
    formContent.files?.html?.entryFile,
    formContent.files?.html?.relevantFiles.filter((info) => !info.external),
    formContent.files?.react?.entryFile,
    formContent.files?.react?.relevantFiles.filter((info) => !info.external),
  ]
    .filter((info) => !!info)
    .flat()
    .map((info) => ({
      fileName: info!.fileName,
      filePath: info!.filePath,
    }));
  return files;
};

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
