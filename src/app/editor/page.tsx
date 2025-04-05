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
import { House, Boxes, Trash2, TriangleAlert } from 'lucide-react';
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
import usePersistTheme from '@/hooks/usePersistTheme';
import useMobileEnd from '../hooks/useMobileEnd';
//@ts-ignore
import anime from 'animejs/lib/anime.es.js';

export default function EditorContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const componentInfo = useAppSelector(selectComponentInfo);
  usePersistTheme();
  const dispatch = useDispatch();
  const handleValueChange = (value: string) => {
    handleGetComponentInfo(value);
  };

  const handleGetComponentInfo = (framwork?: string) => {
    const id = searchParams.get('id');
    if (!id) return;
    dispatch(clearComponentInfo(null));
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
        dispatch(setComponentInfo(componentInfoForViewer));
      }
    });
  };

  useEffect(() => {
    handleGetComponentInfo();
  }, []);

  useMobileEnd();

  const { alertVDom } = useAlert({});

  const resizablePanelRef = useRef<any>(null);
  const throttle = useRef<any>(null);
  const resizableTouchHandle = () => {
    if (!resizablePanelRef.current) return;
    if (throttle.current) return;
    throttle.current = 1;
    let obj = { value: resizablePanelRef.current.getSize() };
    if (resizablePanelRef.current?.getSize() >= 50) {
      anime({
        targets: obj,
        value: 0,
        duration: 300,
        easing: 'easeOutQuad',
        update: function () {
          resizablePanelRef.current.resize(obj.value);
        },
        complete: function () {
          throttle.current = null;
        },
      });
    } else {
      anime({
        targets: obj,
        value: 100,
        duration: 300,
        easing: 'easeOutQuad',
        update: function () {
          resizablePanelRef.current.resize(obj.value);
        },
        complete: function () {
          throttle.current = null;
        },
      });
    }
  };
  useEffect(() => {
    if (innerWidth <= 640) {
      resizablePanelRef.current.resize(0);
    }
  }, []);

  const middleBtnCb = () => {
    const a = document.createElement('a');
    a.href = 'https://www.unstoppable840.cn';
    a.target = 'blank';
    a.click();
  };

  return (
    <div className="h-[100dvh] w-[100dvw] flex flex-col select-none">
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
        <div
          onClick={middleBtnCb}
          className="relative h-10 flex items-center justify-center overflow-hidden p-1 w-10 hover:w-36  box-border cursor-pointer transition-all duration-200 rounded-[9999px] gradient-border"
        >
          <div className="flex items-center h-10 reactive w-36">
            <div className="hover:rotate-[360deg] transition-all duration-200 reactive z-10 w-8 h-8">
              <div className="transition-all duration-200 bg-[url(https://www.unstoppable840.cn/assets/avatar.jpeg)] bg-blend-lighten bg-[#0ff] bg-center bg-contain w-full h-full rounded-[100%] relative after:absolute after:w-full after:h-full after:bg-[url(https://www.unstoppable840.cn/assets/avatar.jpeg)] after:bg-blend-lighten after:bg-[#f00] after:bg-center after:bg-contain after:rounded-[100%] after:mix-blend-darken after:animate-shake"></div>
            </div>
            <div className="font-semibold absolute left-10 w-20 flex justify-center items-center select-none z-10 gradiant-text animate-gradientMove">
              {'To Blog!'}
            </div>
          </div>
        </div>
        {componentInfo.currentFramework ? (
          <Select
            value={componentInfo.currentFramework}
            onValueChange={handleValueChange}
          >
            <SelectTrigger className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1000] [&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
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
        ) : (
          <div className="min-w-[8rem]"></div>
        )}
      </div>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel ref={resizablePanelRef}>
          <Editor></Editor>
        </ResizablePanel>
        <ResizableHandle withHandle={true} touchHandle={resizableTouchHandle} />
        <ResizablePanel>
          <Viewer></Viewer>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
