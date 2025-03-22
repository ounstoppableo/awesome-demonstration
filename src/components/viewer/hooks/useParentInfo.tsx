import { useAppSelector } from '@/store/hooks';
import { selectTheme } from '@/store/theme/theme-slice';
import addToFIFOQueue, { clearQueue } from '@/utils/iframeFIFOQueue';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function useParentInfo(props: any) {
  const {
    iframeRef,
    componentInfoForParent,
    getServerAddr,
    setShowLoading,
    soleId,
  } = props;
  const [frameworkReady, setFrameworkReady] = useState(false);
  const theme = useAppSelector(selectTheme);
  const componentCanRenderPromise = useRef<any>({ resolve: null });
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const secondHandshakeId = uuidv4();
    setFrameworkReady(false);
    const msgCb = (e: any) => {
      if (e.data.type === 'frameworkReady') {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: 'secondHandshake',
            id: secondHandshakeId,
          },
          getServerAddr(componentInfoForParent.currentFramework),
        );
      }
      if (
        e.data.type === 'thirdHandShake' &&
        e.data.secondHandshakeId === secondHandshakeId
      ) {
        soleId.current = e.data.id;
        setFrameworkReady(true);
      }
    };
    window.addEventListener('message', msgCb);
    return () => {
      window.removeEventListener('message', msgCb);
    };
  }, [componentInfoForParent.currentFramework]);

  useEffect(() => {
    if (canRender) {
      setShowLoading(true);
      const messageData = {
        type: 'updateViewer',
        viewInfo: componentInfoForParent,
      };
      iframeRef.current?.contentWindow?.postMessage(
        messageData,
        getServerAddr(componentInfoForParent.currentFramework),
      );
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'setStyle',
          style: {
            body: {
              background: theme === 'dark' ? 'transparent' : 'transparent',
            },
          },
        },
        getServerAddr(componentInfoForParent.currentFramework),
      );
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'setNoScrollBar',
        },
        getServerAddr(componentInfoForParent.currentFramework),
      );
    }
  }, [canRender]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'setStyle',
        style: {
          body: {
            background: theme === 'dark' ? 'transparent' : 'transparent',
          },
        },
      },
      getServerAddr(componentInfoForParent.currentFramework),
    );
  }, [theme]);

  useEffect(() => {
    if (frameworkReady) {
      const _producer = () => {
        setCanRender(true);
        return new Promise((resolve) => {
          componentCanRenderPromise.current.resolve = resolve;
        });
      };
      addToFIFOQueue(_producer);
    }
  }, [frameworkReady]);

  useEffect(() => {
    const _cb = (e: any) => {
      if (e.data.id !== soleId.current) return;
      if (
        e.data.type === 'componentLoadCompleted' ||
        e.data.type === 'handleCompileError'
      ) {
        componentCanRenderPromise.current.resolve?.(1);
      }
    };
    window.addEventListener('message', _cb);
    return () => {
      window.removeEventListener('message', _cb);
      componentCanRenderPromise.current.resolve?.(1);
      clearQueue();
    };
  }, []);

  return {
    framework: componentInfoForParent.currentFramework,
  };
}
