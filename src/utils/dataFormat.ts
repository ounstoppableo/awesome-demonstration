import { z } from 'zod';
import {
  ComponentInfoForViewerType,
  ComponentInfoFormType,
  ComponentInfoFromBackend,
  formSchema,
} from './addComponentFormDataFormat';
import { ResponseMsg } from './handleResponse';
import { v4 as uuidv4 } from 'uuid';
import GlobalTag from './globalTag';

export const formatDataToViewerAdaptor = (
  data: ComponentInfoFromBackend,
  currentFramework: string,
): ComponentInfoForViewerType => {
  return {
    id: data.id,
    entryFile: data[
      `${currentFramework}EntryFileName` as keyof ComponentInfoFromBackend
    ] as any,
    relevantPackages: [
      data[
        `${currentFramework}EntryFileName` as keyof ComponentInfoFromBackend
      ] as any,
      ...(data[
        `${currentFramework}RelevantFiles` as keyof ComponentInfoFromBackend
      ] as any),
    ],
    externalFiles: data[
      `${currentFramework}ExternalFiles` as keyof ComponentInfoFromBackend
    ] as any,
    currentFile: data[
      `${currentFramework}EntryFileName` as keyof ComponentInfoFromBackend
    ] as any,
    fileContentsMap: {},
    framework: data.framework,
    currentFramework: currentFramework,
  };
};

export const formatDataToFormAdaptor = (data: ComponentInfoFromBackend) => {
  return {
    componentName: data.name,
    framework: data.framework,
    files: {
      html: data.framework.includes('html')
        ? {
            entryFile: {
              fileName: data.htmlEntryFileName,
              filePath: data.htmlEntryFileName ? GlobalTag.fileLoaded : '',
            },
            relevantFiles: formatRelevantFiles(
              data.htmlRelevantFiles,
              data.htmlExternalFiles,
            ),
          }
        : null,
      vue: data.framework.includes('vue')
        ? {
            entryFile: {
              fileName: data.vueEntryFileName,
              filePath: data.vueEntryFileName ? GlobalTag.fileLoaded : '',
            },
            relevantFiles: formatRelevantFiles(
              data.vueRelevantFiles,
              data.vueExternalFiles,
            ),
          }
        : null,
      react: data.framework.includes('react')
        ? {
            entryFile: {
              fileName: data.reactEntryFileName,
              filePath: data.reactEntryFileName ? GlobalTag.fileLoaded : '',
            },
            relevantFiles: formatRelevantFiles(
              data.reactRelevantFiles,
              data.reactExternalFiles,
            ),
          }
        : null,
    },
  } as Pick<ComponentInfoFormType, 'componentName' | 'framework' | 'files'>;
};

export const formatDataForBackendAdaptor = (
  formContent: ComponentInfoFormType,
): ComponentInfoFromBackend => {
  try {
    formSchema.parse(formContent);
  } catch (err) {
    throw new Error(ResponseMsg.paramsError);
  }
  const storeSchema: ComponentInfoFromBackend = {
    id: '',
    name: '',
    framework: [],
    vueEntryFileName: '',
    vueRelevantFiles: [] as any,
    vueExternalFiles: [] as any,
    htmlEntryFileName: '',
    htmlRelevantFiles: [] as any,
    htmlExternalFiles: [] as any,
    reactEntryFileName: '',
    reactRelevantFiles: [] as any,
    reactExternalFiles: [] as any,
  };
  storeSchema.id =
    formContent.editComponentId && formContent.editComponentId !== 'default'
      ? formContent.editComponentId
      : uuidv4();
  storeSchema.name = formContent.componentName;
  storeSchema.framework = formContent.framework;
  storeSchema.vueEntryFileName = formContent.files?.vue?.entryFile
    .fileName as any;
  storeSchema.htmlEntryFileName = formContent.files?.html?.entryFile
    .fileName as any;
  storeSchema.reactEntryFileName = formContent.files?.react?.entryFile
    .fileName as any;
  storeSchema.vueRelevantFiles = formContent.files?.vue?.relevantFiles
    .filter((info) => !info.external)
    .map((info) => info.fileName) as any;
  storeSchema.vueExternalFiles = formContent.files?.vue?.relevantFiles.filter(
    (info) => info.external,
  ) as any;
  storeSchema.htmlRelevantFiles = formContent.files?.html?.relevantFiles
    .filter((info) => !info.external)
    .map((info) => info.fileName) as any;
  storeSchema.htmlExternalFiles = formContent.files?.html?.relevantFiles.filter(
    (info) => info.external,
  ) as any;
  storeSchema.reactRelevantFiles = formContent.files?.react?.relevantFiles
    .filter((info) => !info.external)
    .map((info) => info.fileName) as any;
  storeSchema.reactExternalFiles =
    formContent.files?.react?.relevantFiles.filter(
      (info) => info.external,
    ) as any;

  return storeSchema;
};

const formatRelevantFiles = (relevantFiles: any, externalFiles: any) => {
  return relevantFiles
    ? externalFiles
      ? [
          ...relevantFiles.map((relevantFile: any) => ({
            fileName: relevantFile,
            filePath: GlobalTag.fileLoaded,
            external: false,
          })),
          ...externalFiles.map((externalFile: any) => ({
            ...externalFile,
            external: true,
          })),
        ]
      : relevantFiles.map((relevantFile: any) => ({
          fileName: relevantFile,
          filePath: GlobalTag.fileLoaded,
          external: false,
        }))
    : externalFiles
      ? externalFiles.map((externalFile: any) => ({
          ...externalFile,
          external: true,
        }))
      : [];
};
