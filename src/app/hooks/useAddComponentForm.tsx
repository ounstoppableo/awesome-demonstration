import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/form';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from '@/components/steps';
import { Input } from '@/components/input';
import {
  SelectValue,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
} from '@/components/selector/selector';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/tabs/tabs';
import {
  MultipleSelector,
  type Option,
} from '@/components/multi-selector/index';
import { cloneDeep, merge } from 'lodash';
import { Switch } from '@/components/switch';
import { Input as FileUpload } from '@/components/file-upload/base';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  addComponentInfo,
  getComponentInfo,
  getComponentList,
  packageParse,
} from '../lib/data';
import { Component, Minus, Pencil, Plus } from 'lucide-react';
import {
  ComponentInfoFormType,
  formSchema,
} from '@/utils/addComponentFormDataFormat';
import { formatDataToFormAdaptor } from '@/utils/dataFormat';
import { Button } from '@/components/buttons/button-three';
import Loading from '@/components/loading';

export default function useAddComponentForm(props?: any) {
  const onBeforeUpload = (files: File[]) => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].size / 1024 / 1024 > 10) {
        return false;
      }
    }
    return true;
  };

  const [
    showLoadingForStepOneSelectItems,
    setShowLoadingForStepOneSelectItems,
  ] = useState(false);
  const [showLoadingForStepTwo, setShowLoadingForStepTwo] = useState(false);

  const form = useForm<ComponentInfoFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      editComponentId: 'default',
      componentName: '',
      framework: [],
      addOrEdit: 'add',
      files: {
        html: null,
        vue: null,
        react: null,
      },
    },
  });
  const [activeStep, setActiveStep] = useState(1);
  const relevantFileLastImportFilesMap = useRef<any>({});
  const handleSubmitValidate = (
    validateResult: any,
    cb: (...params: any) => any,
  ) => {
    cb(validateResult);
  };
  const handleFormSubmit = (
    successCb: (...params: any) => any,
    failCb?: (...params: any) => any,
  ) => {
    form.handleSubmit(successCb, (res) =>
      handleSubmitValidate(res, failCb ? failCb : () => {}),
    )();
  };
  const handleSubmitBtnClick = () => {
    switch (activeStep) {
      case 1:
        handleStepChange(2);
        break;
      case 2:
        handleStepChange(3);
        break;
      case 3:
        handleFormSubmit(onSubmit);
        break;
    }
  };
  const handleGetComponentInfo = () => {
    if (form.getValues('addOrEdit') === 'add') return;
    setShowLoadingForStepTwo(true);
    getComponentInfo({ id: form.getValues('editComponentId') as string }).then(
      (res) => {
        if (res.code === 200) {
          const componentInfoForForm = formatDataToFormAdaptor(res.data);
          Object.keys(componentInfoForForm).forEach((key) => {
            form.setValue(
              key as any,
              (componentInfoForForm as any)[key as any],
            );
          });
        }
        setShowLoadingForStepTwo(false);
      },
    );
  };
  const handleStepChange = (e: number) => {
    handleFormSubmit(
      () => {
        setActiveStep(e);
      },
      (params) => {
        if (activeStep > e) {
          form.clearErrors();
          return setActiveStep(e);
        }

        if (params['editComponentId']) {
          if (activeStep !== 1) {
            form.clearErrors();
          }
          return setActiveStep(1);
        }
        if (params['componentName'] || params['framework'] || params['files']) {
          if (activeStep !== 2) {
            form.clearErrors();
          }
          handleGetComponentInfo();
          return setActiveStep(2);
        }
      },
    );
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    addComponentInfo(values).then((res) => {
      console.log(res);
    });
  }
  const frameworkOptions: Option[] = [
    { value: 'html', label: 'HTML', category: 'Framework' },
    { value: 'vue', label: 'Vue', category: 'Framework' },
    { value: 'react', label: 'React', category: 'Framework' },
  ];
  const addOrEdit = form.watch('addOrEdit');
  const [componentList, setComponentList] = useState([]);
  useEffect(() => {
    if (addOrEdit === 'edit') {
      setShowLoadingForStepOneSelectItems(true);
      getComponentList().then((res) => {
        if (res.code === 200) {
          setComponentList(res.data);
        }
        setShowLoadingForStepOneSelectItems(false);
      });
    }
  }, [addOrEdit]);

  const formItems = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="flex justify-between gap-4">
            <FormField
              control={form.control}
              name="addOrEdit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Add or Edit</FormLabel>
                  <FormControl>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(e) => {
                        form.setValue('addOrEdit', e);
                        if (e === 'add') {
                          form.setValue('editComponentId', 'default');
                        } else {
                          form.setValue('editComponentId', '');
                        }
                      }}
                    >
                      <SelectTrigger className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80 w-[180px]">
                        <SelectValue placeholder="Select operate type" />
                      </SelectTrigger>
                      <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                        <SelectGroup>
                          <SelectItem value="add">
                            <Plus />
                            <span className="truncate">Add</span>
                          </SelectItem>
                          <SelectItem value="edit">
                            <Pencil />
                            <span className="truncate">Edit</span>
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch('addOrEdit') === 'edit' ? (
              <FormField
                control={form.control}
                name="editComponentId"
                key="editComponentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Component</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={(e) =>
                          form.setValue('editComponentId', e)
                        }
                      >
                        <SelectTrigger className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80 w-[180px]">
                          <SelectValue placeholder="Select operate type" />
                        </SelectTrigger>
                        <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
                          <SelectGroup>
                            {componentList.length !== 0 ? (
                              componentList.map((component: any) => {
                                return (
                                  <SelectItem
                                    value={component.id}
                                    key={component.id}
                                  >
                                    <Component />
                                    <span className="truncate">
                                      {component.name}
                                    </span>
                                  </SelectItem>
                                );
                              })
                            ) : showLoadingForStepOneSelectItems ? (
                              <div className="relative h-24 w-full">
                                <Loading
                                  showLoading={showLoadingForStepOneSelectItems}
                                  cubeSize={30}
                                ></Loading>
                              </div>
                            ) : (
                              <></>
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <></>
            )}
          </div>
        );
      case 2:
        return (
          <>
            <FormField
              control={form.control}
              name="componentName"
              key="componentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Component Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Input components name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="framework"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Framework</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      placeholder="Select framework..."
                      value={field.value.map((framework) => ({
                        value: framework,
                        label:
                          framework === 'html'
                            ? 'HTML'
                            : framework === 'vue'
                              ? 'Vue'
                              : 'React',
                        category: 'Framework',
                      }))}
                      defaultOptions={frameworkOptions}
                      groupBy="category"
                      className="w-full"
                      onChange={(e) => {
                        form.setValue(
                          'framework',
                          e.map((item) => item.value) as any,
                        );
                        const initFilesData: any = {
                          html: null,
                          vue: null,
                          react: null,
                        };
                        e.forEach((item: any) => {
                          initFilesData[item.value] = {
                            entryFile: {
                              fileName:
                                form.getValues(
                                  `files.${item.value}.entryFile.fileName` as any,
                                ) || '',
                              filePath:
                                form.getValues(
                                  `files.${item.value}.entryFile.filePath` as any,
                                ) || '',
                            },
                            relevantFiles:
                              form.getValues(
                                `files.${item.value}.relevantFiles` as any,
                              ) || [],
                          };
                        });
                        form.setValue('files', merge(initFilesData));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch('framework').length === 0 ? (
              <></>
            ) : (
              <Tabs
                defaultValue={form.getValues('framework')[0] as string}
                className="flex flex-col h-full"
              >
                <TabsList className="relative h-auto w-full gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border justify-start pl-0.5 pt-0.5">
                  {form.getValues('framework').map((framework) => (
                    <TabsTrigger
                      key={framework}
                      value={framework}
                      className="overflow-hidden rounded-b-none border-x border-t border-border bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none"
                    >
                      {framework === 'html' ? (
                        <>
                          <svg className="icon" aria-hidden="true">
                            <use xlinkHref="#icon-HTML"></use>
                          </svg>
                          <span className="truncate">HTML</span>
                        </>
                      ) : framework === 'vue' ? (
                        <>
                          <svg className="icon" aria-hidden="true">
                            <use xlinkHref="#icon-Vue"></use>
                          </svg>
                          <span className="truncate">Vue</span>
                        </>
                      ) : (
                        <>
                          <svg className="icon" aria-hidden="true">
                            <use xlinkHref="#icon-react"></use>
                          </svg>
                          <span className="truncate">React</span>
                        </>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {form.getValues('framework').map((framework) => {
                  return (
                    <TabsContent
                      value={framework}
                      key={framework}
                      className="p-0.5 flex-1 m-0"
                    >
                      <div className="w-full flex flex-col">
                        <div className="flex flex-col">
                          <div className="font-bold py-2">
                            Entry File Fields
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-[0.3]">
                              <FormField
                                control={form.control}
                                name={
                                  `files.${framework}.entryFile.fileName` as any
                                }
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>File Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Input fileName"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex-[0.7]">
                              <FormField
                                control={form.control}
                                name={
                                  `files.${framework}.entryFile.filePath` as any
                                }
                                render={({ field }) => {
                                  const onUploadSuccess = (res: any) => {
                                    if (res.code === 200) {
                                      form.setValue(
                                        `files.${framework}.entryFile.filePath` as any,
                                        res.data[0]?.filePath,
                                      );
                                      if (
                                        res.data[0]?.fileName?.endsWith(
                                          '.ts',
                                        ) ||
                                        res.data[0]?.fileName?.endsWith(
                                          '.js',
                                        ) ||
                                        res.data[0]?.fileName?.endsWith(
                                          '.tsx',
                                        ) ||
                                        res.data[0]?.fileName?.endsWith(
                                          '.jsx',
                                        ) ||
                                        res.data[0]?.fileName?.endsWith(
                                          '.vue',
                                        ) ||
                                        !res.data[0]
                                      ) {
                                        packageParse({
                                          filePath: res.data[0]?.filePath,
                                        }).then((res: any) => {
                                          if (res.code === 200) {
                                            const importFiles = res.data.map(
                                              (resItem: any) => ({
                                                fileName: resItem,
                                                filePath:
                                                  form
                                                    .getValues(
                                                      `files.${framework}.relevantFiles` as any,
                                                    )
                                                    .find(
                                                      (file: any) =>
                                                        file.fileName ===
                                                        resItem,
                                                    )?.filePath || '',
                                                external:
                                                  form
                                                    .getValues(
                                                      `files.${framework}.relevantFiles` as any,
                                                    )
                                                    .find(
                                                      (file: any) =>
                                                        file.fileName ===
                                                        resItem,
                                                    )?.external || false,
                                              }),
                                            );
                                            form.setValue(
                                              `files.${framework}.relevantFiles` as any,
                                              importFiles,
                                            );
                                          }
                                        });
                                      }
                                    }
                                  };
                                  return (
                                    <FormItem>
                                      <FormLabel>File Path</FormLabel>
                                      <FormControl>
                                        <FileUpload
                                          className="p-0 pe-3 file:me-3 file:border-0 file:border-e"
                                          action="fileUploader"
                                          onBeforUpload={onBeforeUpload}
                                          onUploadSuccess={onUploadSuccess}
                                          value={field.value}
                                          accept={
                                            framework === 'html'
                                              ? '.html'
                                              : framework === 'vue'
                                                ? '.vue'
                                                : '.tsx,.jsx'
                                          }
                                        ></FileUpload>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        {form.watch(`files.${framework}.relevantFiles` as any)
                          .length !== 0 || framework === 'html' ? (
                          <div>
                            <div className="font-bold py-2 flex justify-between items-center">
                              Relevant File Fields
                              {framework === 'html' ? (
                                <Button
                                  className="rounded-full w-8 h-8"
                                  variant="outline"
                                  size="icon"
                                  aria-label="Add new item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const originalValue = form.getValues(
                                      'files.html.relevantFiles',
                                    );
                                    const fileInfo = {
                                      fileName: '',
                                      filePath: '',
                                      external: false,
                                    };

                                    form.setValue(
                                      'files.html.relevantFiles',
                                      originalValue
                                        ? [...originalValue, fileInfo]
                                        : [fileInfo],
                                    );
                                  }}
                                >
                                  <Plus
                                    size={16}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />
                                </Button>
                              ) : (
                                <></>
                              )}
                            </div>
                            <div className="flex flex-col gap-4 w-full overflow-y-auto pb-2 max-h-44 noScrollBar pl-[2px]">
                              {(
                                form.getValues(
                                  `files.${framework}.relevantFiles` as any,
                                ) as any
                              )?.map((relevantFile: any, index: number) => {
                                return (
                                  <div
                                    className="flex gap-4"
                                    key={relevantFile.fileName + index}
                                  >
                                    <div className="flex-[0.3]">
                                      <FormField
                                        control={form.control}
                                        name={
                                          `files.${framework}.relevantFiles[${index}].fileName` as any
                                        }
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>File Name</FormLabel>
                                            <FormControl>
                                              <Input
                                                placeholder="Input fileName"
                                                {...field}
                                                disabled={framework !== 'html'}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    <div className="flex-[0.5]">
                                      {form.watch(
                                        `files.${framework}.relevantFiles[${index}].external` as any,
                                      ) ? (
                                        <FormField
                                          control={form.control}
                                          name={
                                            `files.${framework}.relevantFiles[${index}].filePath` as any
                                          }
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>File Path</FormLabel>
                                              <FormControl>
                                                <Input
                                                  placeholder="Input filePath"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      ) : (
                                        <FormField
                                          control={form.control}
                                          name={
                                            `files.${framework}.relevantFiles[${index}].filePath` as any
                                          }
                                          render={({ field }) => {
                                            const onUploadSuccess = (
                                              res: any,
                                            ) => {
                                              if (res.code === 200) {
                                                form.setValue(
                                                  `files.${framework}.relevantFiles[${index}].filePath` as any,
                                                  res.data[0]?.filePath,
                                                );
                                                if (
                                                  res.data[0]?.fileName?.endsWith(
                                                    '.ts',
                                                  ) ||
                                                  res.data[0]?.fileName?.endsWith(
                                                    '.js',
                                                  ) ||
                                                  res.data[0]?.fileName?.endsWith(
                                                    '.tsx',
                                                  ) ||
                                                  res.data[0]?.fileName?.endsWith(
                                                    '.jsx',
                                                  ) ||
                                                  res.data[0]?.fileName?.endsWith(
                                                    '.vue',
                                                  ) ||
                                                  !res.data[0]
                                                ) {
                                                  packageParse({
                                                    filePath:
                                                      res.data[0]?.filePath,
                                                  }).then((packageRes: any) => {
                                                    if (
                                                      packageRes.code === 200
                                                    ) {
                                                      const importFiles =
                                                        packageRes.data.map(
                                                          (resItem: any) => ({
                                                            fileName: resItem,
                                                            filePath:
                                                              form
                                                                .getValues(
                                                                  `files.${framework}.relevantFiles` as any,
                                                                )
                                                                .find(
                                                                  (file: any) =>
                                                                    file.fileName ===
                                                                    resItem,
                                                                )?.filePath ||
                                                              '',
                                                            external:
                                                              form
                                                                .getValues(
                                                                  `files.${framework}.relevantFiles` as any,
                                                                )
                                                                .find(
                                                                  (file: any) =>
                                                                    file.fileName ===
                                                                    resItem,
                                                                )?.external ||
                                                              false,
                                                          }),
                                                        );
                                                      const relevantFileId =
                                                        form.getValues(
                                                          `files.${framework}.relevantFiles[${index}].fileName` as any,
                                                        ) +
                                                        '-' +
                                                        framework;

                                                      const lastRelevantImportFiles =
                                                        cloneDeep(
                                                          relevantFileLastImportFilesMap
                                                            .current[
                                                            relevantFileId
                                                          ],
                                                        );
                                                      relevantFileLastImportFilesMap.current[
                                                        relevantFileId
                                                      ] = importFiles.filter(
                                                        (file: any) =>
                                                          !form
                                                            .getValues(
                                                              `files.${framework}.relevantFiles` as any,
                                                            )
                                                            .find(
                                                              (
                                                                currentFile: any,
                                                              ) =>
                                                                currentFile.fileName ===
                                                                file.fileName,
                                                            ),
                                                      );
                                                      const currentImportFiles =
                                                        [
                                                          ...form
                                                            .getValues(
                                                              `files.${framework}.relevantFiles` as any,
                                                            )
                                                            .filter(
                                                              (item: any) =>
                                                                !lastRelevantImportFiles?.find(
                                                                  (
                                                                    lastFile: any,
                                                                  ) =>
                                                                    lastFile.fileName ===
                                                                    item.fileName,
                                                                ),
                                                            ),
                                                          ...importFiles,
                                                        ];
                                                      // 去重
                                                      const currentImportFilesRD =
                                                        currentImportFiles.reduce(
                                                          (acc, curr) => {
                                                            if (
                                                              !acc.some(
                                                                (item: any) =>
                                                                  item.fileName ===
                                                                  curr.fileName,
                                                              )
                                                            ) {
                                                              acc.push(curr);
                                                            }
                                                            return acc;
                                                          },
                                                          [],
                                                        );
                                                      form.setValue(
                                                        `files.${framework}.relevantFiles` as any,
                                                        currentImportFilesRD,
                                                      );
                                                    }
                                                  });
                                                }
                                              }
                                            };
                                            return (
                                              <FormItem>
                                                <FormLabel>File Path</FormLabel>
                                                <FormControl>
                                                  <FileUpload
                                                    className="p-0 pe-3 file:me-3 file:border-0 file:border-e"
                                                    action="fileUploader"
                                                    onBeforUpload={
                                                      onBeforeUpload
                                                    }
                                                    onUploadSuccess={
                                                      onUploadSuccess
                                                    }
                                                    value={field.value}
                                                    accept={
                                                      framework === 'html'
                                                        ? '.css,.js'
                                                        : framework === 'vue'
                                                          ? '.vue,.ts,.js'
                                                          : '.tsx,.jsx,.ts,.js,.scss,.sass,.less,.css'
                                                    }
                                                  ></FileUpload>
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            );
                                          }}
                                        />
                                      )}
                                    </div>
                                    <div className="flex-[0.1] flex">
                                      <FormField
                                        control={form.control}
                                        name={
                                          `files.${framework}.relevantFiles[${index}].external` as any
                                        }
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>External</FormLabel>
                                            <FormControl>
                                              <div className="flex pt-1.5">
                                                <Switch
                                                  checked={field.value}
                                                  onCheckedChange={
                                                    field.onChange
                                                  }
                                                />
                                              </div>
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>

                                    {framework === 'html' ? (
                                      <div className="flex-[0.1] flex flex-col gap-2.5 items-end">
                                        <div>minus</div>
                                        <Button
                                          className="rounded-full w-8 h-8"
                                          variant="outline"
                                          size="icon"
                                          aria-label="Add new item"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const originalValue =
                                              form.getValues(
                                                'files.html.relevantFiles',
                                              );
                                            originalValue.splice(index, 1);
                                            form.setValue(
                                              'files.html.relevantFiles',
                                              originalValue,
                                            );
                                          }}
                                        >
                                          <Minus
                                            size={16}
                                            strokeWidth={2}
                                            aria-hidden="true"
                                          />
                                        </Button>
                                      </div>
                                    ) : (
                                      <></>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <></>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
            <Loading
              showLoading={showLoadingForStepTwo}
              cubeSize={60}
            ></Loading>
          </>
        );
    }
  };
  const AddComponentForm = (
    <>
      <Stepper value={activeStep} onValueChange={handleStepChange}>
        {[1, 2, 3].map((step) => (
          <StepperItem
            step={step}
            key={step}
            className="[&:not(:last-child)]:flex-1"
          >
            <StepperTrigger>
              <StepperIndicator />
            </StepperTrigger>
            <StepperSeparator />
          </StepperItem>
        ))}
      </Stepper>
      <Form {...form}>
        <form className="space-y-4">{formItems()}</form>
      </Form>
    </>
  );

  return {
    formStep: activeStep,
    AddComponentForm,
    handleSubmitBtnClick,
  };
}
