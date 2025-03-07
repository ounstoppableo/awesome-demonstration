import { useAppSelector } from '@/store/hooks';
import { useEffect, useState } from 'react';
import { getComponentInfo, getFileContent } from '@/app/lib/data';
import { selectComponentInfo } from '@/store/component-info/component-info-slice';
import { selectTheme } from '@/store/theme/theme-slice';
import { v4 as uuidv4 } from 'uuid';

export default function useStoreInfo(props: any) {
  const { iframeRef, getServerAddr, setShowLoading, soleId } = props;
  const componentInfo = useAppSelector(selectComponentInfo);
  const [frameworkReady, setFrameworkReady] = useState(false);
  const theme = useAppSelector(selectTheme);
  const secondHandshakeId = uuidv4();
  useEffect(() => {
    setFrameworkReady(false);
    const msgCb = (e: any) => {
      if (e.data.type === 'frameworkReady') {
        iframeRef.current?.contentWindow.postMessage(
          {
            type: 'secondHandshake',
            id: secondHandshakeId,
          },
          getServerAddr(componentInfo.currentFramework),
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
  }, [componentInfo.currentFramework]);

  useEffect(() => {
    if (frameworkReady) {
      setShowLoading(true);
      const messageData = {
        type: 'updateViewer',
        viewInfo: componentInfo,
      };
      iframeRef.current?.contentWindow.postMessage(
        messageData,
        getServerAddr(componentInfo.currentFramework),
      );
      iframeRef.current?.contentWindow.postMessage(
        {
          type: 'setStyle',
          style: {
            body: {
              background: theme === 'dark' ? 'transparent' : 'transparent',
            },
          },
        },
        getServerAddr(componentInfo.currentFramework),
      );
    }
  }, [
    frameworkReady,
    componentInfo.fileContentsMap[componentInfo.currentFile],
  ]);

  useEffect(() => {
    iframeRef.current?.contentWindow.postMessage(
      {
        type: 'setStyle',
        style: {
          body: {
            background: theme === 'dark' ? 'transparent' : 'transparent',
          },
        },
      },
      getServerAddr(componentInfo.currentFramework),
    );
  }, [theme]);

  return { framework: componentInfo.currentFramework };
}
