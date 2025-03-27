'use client';

import { useEffect, useRef, useState } from 'react';
import useStoreInfo from './hooks/useStoreInfo';
import useParentInfo from './hooks/useParentInfo';
import { ComponentInfoForViewerType } from '@/utils/addComponentFormDataFormat';
import { selectTheme } from '@/store/theme/theme-slice';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/buttons/button-two/index';
import Loading from '../loading';
import ErrorAlert from '@/components/error-alert/index';
import { TriangleAlert } from 'lucide-react';

export default function Viewer(props: {
  componentInfoForParent?: ComponentInfoForViewerType;
}) {
  const { componentInfoForParent } = props;
  const [showLoading, setShowLoading] = useState(true);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const iframeRef = useRef<any>(null);
  const soleId = useRef('');
  const [errorInfo, setErrorInfo] = useState<{
    title: string;
    content: string;
  }>({
    title: 'Some Error Happened',
    content: '',
  });
  let framework: any;
  const getServerAddr = (framework: 'vue' | 'html' | 'react') => {
    return framework === 'vue'
      ? location.protocol + '//' + location.hostname + ':11451'
      : framework === 'html'
        ? location.protocol +
          '//' +
          location.hostname +
          ':7777/' +
          'htmlViewerServer.html'
        : framework === 'react'
          ? location.protocol + '//' + location.hostname + ':7777/' + 'viewer'
          : '';
  };

  if (!!componentInfoForParent) {
    framework = useParentInfo({
      iframeRef,
      componentInfoForParent,
      setShowLoading,
      getServerAddr: getServerAddr,
      soleId,
    }).framework;
  } else {
    framework = useStoreInfo({
      iframeRef,
      setShowLoading,
      getServerAddr: getServerAddr,
      soleId,
    }).framework;
  }

  useEffect(() => {
    const _cb = (e: any) => {
      if (e.data.id !== soleId.current) return;
      if (
        e.data.type === 'componentLoadCompleted' ||
        e.data.type === 'handleCompileError'
      ) {
        setShowLoading(false);
      }
    };
    window.addEventListener('message', _cb);
    return () => {
      window.removeEventListener('message', _cb);
    };
  }, []);

  useEffect(() => {
    const handleOnMessage = (e: any) => {
      if (e.data.id !== soleId.current) return;
      if (e.data.type === 'componentLoadCompleted') {
        setShowErrorAlert(false);
        setErrorInfo({
          title: 'Some Errors Happened',
          content: '',
        });
      }
      if (e.data.type === 'handleCompileError') {
        setShowErrorAlert(true);
        setErrorInfo({
          title: 'Some Errors Happened',
          content: e.data.data,
        });
      }
    };
    window.addEventListener('message', handleOnMessage);
    return () => {
      window.removeEventListener('message', handleOnMessage);
    };
  }, []);

  function gc(iframeWindow: any) {
    iframeWindow?.postMessage({ type: 'unMounted' }, '*');
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    return () => {
      gc(iframe?.contentWindow);
    };
  }, []);

  return (
    <div className="h-full w-full relative">
      {framework === 'vue' ? (
        <iframe
          ref={iframeRef}
          src={location.protocol + '//' + location.hostname + ':11451'}
          className="w-full h-full"
        ></iframe>
      ) : framework === 'html' ? (
        <iframe
          ref={iframeRef}
          src={
            location.protocol +
            '//' +
            location.hostname +
            ':7777/' +
            'htmlViewerServer.html'
          }
          className="w-full h-full"
        ></iframe>
      ) : framework === 'react' ? (
        <iframe
          ref={iframeRef}
          src={
            location.protocol + '//' + location.hostname + ':7777/' + 'viewer'
          }
          className="w-full h-full"
        ></iframe>
      ) : (
        <></>
      )}
      <div
        className={`absolute inset-0 ${showErrorAlert ? 'block' : 'hidden'}`}
        id="errorDialogContainer"
      >
        {showErrorAlert ? (
          <ErrorAlert
            title={errorInfo.title}
            content={errorInfo.content}
          ></ErrorAlert>
        ) : (
          <></>
        )}
      </div>
      <Loading showLoading={showLoading} cubeSize={80}></Loading>
    </div>
  );
}
