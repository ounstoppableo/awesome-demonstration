import request from '@/utils/fetch';
import { method } from 'lodash';
type ComponentInfoParams = {
  id: string;
};
export const getComponentInfo = async (params: ComponentInfoParams) => {
  return await request(`/api/componentInfo?id=${params.id}`);
};

type FileContentParams = {
  id: string;
  fileName: string;
};
export const getFileContent = async (params: FileContentParams) => {
  const temp = localStorage.getItem(params.id + params.fileName);
  if (temp && temp !== 'null' && temp !== 'undefined') return JSON.parse(temp);
  const res = await request(
    `/api/fileContent?scope=${params.id}&fileName=${params.fileName}`,
  );
  if (res.code === 200)
    localStorage.setItem(params.id + params.fileName, JSON.stringify(res));
  return res;
};

type PackageParseParams = {
  filePath: string;
};
export const packageParse = async (params: PackageParseParams) => {
  return await request(`/api/packageParse?filePath=${params.filePath}`);
};

type AddComponentInfo = {};
export const addComponentInfo = async (params: AddComponentInfo) => {
  return await request(`/api/componentInfo`, {
    method: 'POST',
    body: params,
  });
};

type GetComponentList = {
  page: number;
  limit: number;
};
export const getComponentList = async (params: GetComponentList) => {
  return await request(
    `/api/componentList?page=${params.page}&limit=${params.limit}`,
  );
};

type ParseCssToObject = {
  fileContent: string;
};
export const parseCssToObject = async (params: ParseCssToObject) => {
  return await request(`/api/fileParse/cssParseToObject`, {
    method: 'POST',
    body: params,
  });
};

type Auth = {};
export const auth = async (params?: Auth) => {
  return await request(`/api/auth`, {
    method: 'GET',
  });
};

type RandomComponent = {};
export const randomComponent = async (params?: RandomComponent) => {
  return await request(`/api/randomComponent`, {
    method: 'GET',
  });
};

type SearchComponent = { componentName: string; limit: number };
export const searchComponentResPage = async (params?: SearchComponent) => {
  return await request(
    `/api/searchComponent/resPage?componentName=${params?.componentName}&limit=${params?.limit}`,
    {
      method: 'GET',
    },
  );
};

export const swiftGetList = async () => {
  return await request(`/api/swiftGetList`, {
    method: 'GET',
  });
};
