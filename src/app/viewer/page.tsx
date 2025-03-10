'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  selectComponentInfo,
  setComponentInfo,
} from '@/store/component-info/component-info-slice';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/store/hooks';
import { isEqual } from 'lodash';
import ParseStringToComponent from '@/utils/parseStringToComponent/parseStringToComponent';
import NotFound from '@/components/not-found';
import { v4 as uuidv4 } from 'uuid';

function useDeepCompareEffect(
  callback: (...params: any) => any,
  dependencies: any[],
) {
  const prevDeps = useRef<any>(null);

  if (!isEqual(prevDeps.current, dependencies)) {
    prevDeps.current = dependencies;
    callback();
  }
}

export default function Viewer() {
  const [root, setRoot] = useState(null);
  const dispatch = useDispatch();
  const componentInfo = useAppSelector(selectComponentInfo);
  const [randomKey, setRandomKey] = useState(Math.random());
  const soleId = useRef(uuidv4());
  useEffect(() => {
    window.parent.postMessage(
      { type: 'frameworkReady', data: '我准备好了~', id: soleId.current },
      location.origin,
    );
    (window as any).id = soleId.current;
    const handleMsgCb = async (e: any) => {
      if (e.origin !== location.protocol + '//' + location.hostname + ':7777') {
        console.warn('拒绝来自不安全域的消息:', e.origin);
        return;
      }
      if (e.data.type === 'updateViewer') {
        dispatch(setComponentInfo(e.data.viewInfo));
      }
      if (e.data.type === 'setStyle') {
        Object.keys(e.data.style).map((selector) => {
          Object.keys(e.data.style[selector]).forEach((attr) => {
            if (!document!.querySelector(selector)) return;
            (document!.querySelector(selector) as any).style[attr] =
              e.data.style[selector][attr];
          });
        });
      }
      if (e.data.type === 'setNoScrollBar') {
        document.documentElement.classList.add('noScrollBar');
      }
      if (e.data.type === 'secondHandshake') {
        window.parent.postMessage(
          {
            type: 'thirdHandShake',
            data: '二次握手成功~',
            id: soleId.current,
            secondHandshakeId: e.data.id,
          },
          location.protocol + '//' + location.hostname + ':7777',
        );
      }
    };
    window.addEventListener('message', handleMsgCb);
    return () => {
      window.removeEventListener('message', handleMsgCb);
    };
  }, []);
  useDeepCompareEffect(async () => {
    if (componentInfo.id) {
      try {
        const parseStringToComponent = new ParseStringToComponent(
          componentInfo,
        );
        const components = await parseStringToComponent.parseToComponent(
          componentInfo.fileContentsMap[componentInfo.entryFile],
          'root',
        );
        setRoot(components as any);
        window.parent.postMessage(
          {
            type: 'componentLoadCompleted',
            data: '组件加载完成~',
            id: soleId.current,
          },
          location.origin,
        );
      } catch (err: any) {
        window.parent.postMessage(
          { type: 'handleCompileError', data: err.message, id: soleId.current },
          location.origin,
        );
      }
    }
  }, [componentInfo]);

  useEffect(() => {
    setRandomKey(Math.random());
  }, [root]);

  const safeResult = () => {
    try {
      return (
        <>
          {root ? (
            <div key={randomKey} className="bg-transparent">
              {(root as any)[Object.keys(root)[Object.keys(root).length - 1]]()}
            </div>
          ) : (
            <div className="flex justify-center items-center absolute inset-0 bg-transparent">
              <NotFound></NotFound>
            </div>
          )}
        </>
      );
    } catch (err: any) {
      console.log(err);
      window.parent.postMessage(
        { type: 'handleCompileError', data: err.message, id: soleId.current },
        location.origin,
      );
    }
  };

  return <>{safeResult()}</>;
}
