import { useAppSelector } from '@/store/hooks';
import { selectTheme } from '@/store/theme/theme-slice';
import { useEffect, useState } from 'react';
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
    if (frameworkReady) {
      setShowLoading(true);
      const messageData = {
        type: 'updateViewer',
        viewInfo: componentInfoForParent,
      };
      iframeRef.current?.contentWindow.postMessage(
        messageData,
        getServerAddr(componentInfoForParent.currentFramework),
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
        getServerAddr(componentInfoForParent.currentFramework),
      );
      iframeRef.current?.contentWindow.postMessage(
        {
          type: 'setNoScrollBar',
        },
        getServerAddr(componentInfoForParent.currentFramework),
      );
    }
  }, [frameworkReady]);

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
      getServerAddr(componentInfoForParent.currentFramework),
    );
  }, [theme]);

  return {
    framework: componentInfoForParent.currentFramework,
  };
}
