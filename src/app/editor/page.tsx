'use client';
import Editor from '@/components/editor/editor';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/resizable/resizable';
import Viewer from '@/components/viewer/viewer';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/selector/selector';
import { Button } from '@/components/buttons/button-two/index';
import { House, Boxes, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BubbleText from '@/components/bubble-text';
import { getComponentInfo, getFileContent } from '../lib/data';
import { useDispatch } from 'react-redux';
import {
  clearComponentInfo,
  selectComponentInfo,
  setComponentInfo,
} from '@/store/component-info/component-info-slice';
import { useSearchParams } from 'next/navigation';
import { formatDataToViewerAdaptor } from '@/utils/dataFormat';
import { useAppSelector } from '@/store/hooks';
import useAlert from '@/components/alert/useAlert';

export default function EditorContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const componentInfo = useAppSelector(selectComponentInfo);

  const dispatch = useDispatch();
  const handleValueChange = (value: string) => {
    handleGetComponentInfo(value);
  };

  const handleGetComponentInfo = (framwork?: string) => {
    const id = searchParams.get('id');
    if (!id) return;
    getComponentInfo({ id }).then(async (res) => {
      if (res.code === 200) {
        const componentInfoForViewer = formatDataToViewerAdaptor(
          res.data,
          framwork ? framwork : res.data.framework[0],
        );
        const fileContentRes = await getFileContent({
          id: componentInfoForViewer.id,
          fileName: componentInfoForViewer.entryFile,
        });
        if (fileContentRes.code === 200) {
          componentInfoForViewer.fileContentsMap[
            componentInfoForViewer.entryFile
          ] = fileContentRes.data.fileContent;
        } else {
          componentInfoForViewer.fileContentsMap[
            componentInfoForViewer.entryFile
          ] = '';
        }
        dispatch(clearComponentInfo(null));
        dispatch(setComponentInfo(componentInfoForViewer));
      }
    });
  };

  const handleOnMessage = (e: any) => {
    if (e.data.type === 'handleCompileError') {
      console.log(e.data);
    }
  };

  const { alertVDom } = useAlert({});

  useEffect(() => {
    handleGetComponentInfo();
    window.addEventListener('message', handleOnMessage);
    return () => {
      window.removeEventListener('message', handleOnMessage);
    };
  }, []);
  return (
    <div className="h-[100vh] w-[100vw] flex flex-col">
      {alertVDom}
      <div className="py-2 px-0.5 flex justify-between border items-center relative">
        <Button
          onClick={(e) => {
            router.push('/');
          }}
          icon={<House />}
          direction="left"
        >
          Home
        </Button>
        <div className="h-10 flex items-center justify-center overflow-hidden p-1 w-10 hover:w-36 relative box-border cursor-pointer transition-all duration-200 rounded-[9999px] gradient-border">
          <div className="flex items-center h-10 reactive w-36">
            <div className="hover:rotate-[360deg] transition-all duration-200 reactive z-10 w-8 h-8">
              <div className="transition-all duration-200 bg-[url(https://www.unstoppable840.cn/assets/avatar.jpeg)] bg-blend-lighten bg-[#0ff] bg-center bg-contain w-full h-full rounded-[100%] relative after:absolute after:w-full after:h-full after:bg-[url(https://www.unstoppable840.cn/assets/avatar.jpeg)] after:bg-blend-lighten after:bg-[#f00] after:bg-center after:bg-contain after:rounded-[100%] after:mix-blend-darken after:animate-shake"></div>
            </div>
            <div className="font-semibold absolute left-10 w-20 flex justify-center items-center select-none z-10 gradiant-text animate-gradientMove">
              To Blog!
            </div>
          </div>
        </div>
        <Select
          value={componentInfo.currentFramework}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
            <SelectGroup>
              {componentInfo.framework.map((framework) => {
                return (
                  <SelectItem value={framework} key={framework}>
                    <svg className="icon" aria-hidden="true">
                      <use
                        xlinkHref={`#icon-${
                          framework === 'html'
                            ? 'HTML'
                            : framework === 'vue'
                              ? 'Vue'
                              : 'react'
                        }`}
                      ></use>
                    </svg>
                    <span className="truncate">
                      {framework === 'html'
                        ? 'HTML'
                        : framework === 'vue'
                          ? 'Vue'
                          : 'React'}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>
          <Editor></Editor>
        </ResizablePanel>
        <ResizableHandle withHandle={true} />
        <ResizablePanel>
          <Viewer></Viewer>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
