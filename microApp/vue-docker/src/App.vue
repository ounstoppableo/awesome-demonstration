<script setup lang="ts">
// @ts-ignore
import { inject, onMounted, ref, nextTick, markRaw, onUnmounted } from 'vue';
import ParseStringToComponent from './utils/parseStringToComponent/parseStringToComponent';
import { useViewInfoStoreStore } from './store/viewInfoStore';
import { v4 as uuidv4 } from 'uuid';

const componentName = ref('');
const app: any = inject('app');
const randomKey = ref(Math.random());
const soleId = markRaw({ value: uuidv4() });

const viewInfoStoreState = useViewInfoStoreStore();

app.config.errorHandler = (err: any, instance: any, info: any) => {
  window.parent.postMessage(
    { type: 'handleCompileError', data: err.message, id: soleId.value },
    location.protocol +
      '//' +
      location.hostname +
      `:${import.meta.env.VITE_PUBLIC_NEXT_SERVER_PORT}`,
  );
};

const gc = () => {
  app.unmount();
  document.getElementById('app')!.innerHTML = '';
};

const messageHandler = async (e: any) => {
  if (
    e.origin !==
    location.protocol +
      '//' +
      location.hostname +
      `:${import.meta.env.VITE_PUBLIC_NEXT_SERVER_PORT}`
  ) {
    console.warn('拒绝来自不安全域的消息:', e.origin);
    return;
  }
  if (e.data.type === 'updateViewer') {
    try {
      viewInfoStoreState.setViewInfo(e.data.viewInfo);
      if (viewInfoStoreState.getRootContent) {
        const parseStringToComponent = new ParseStringToComponent(app);
        await parseStringToComponent.parseToComponent(
          viewInfoStoreState.getRootContent,
          'viewerRoot',
        );
      }
      randomKey.value = Math.random();
      componentName.value = 'viewerRoot';
      window.parent.postMessage(
        {
          type: 'componentLoadCompleted',
          data: '组件加载完成~',
          id: soleId.value,
        },
        location.protocol +
          '//' +
          location.hostname +
          `:${import.meta.env.VITE_PUBLIC_NEXT_SERVER_PORT}`,
      );
    } catch (err: any) {
      window.parent.postMessage(
        { type: 'handleCompileError', data: err.message, id: soleId.value },
        location.protocol +
          '//' +
          location.hostname +
          `:${import.meta.env.VITE_PUBLIC_NEXT_SERVER_PORT}`,
      );
    }
  }
  if (e.data.type === 'setStyle') {
    Object.keys(e.data.style).map((selector) => {
      Object.keys(e.data.style[selector]).forEach((attr) => {
        (document.querySelector(selector) as any).style[attr] =
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
        id: soleId.value,
        secondHandshakeId: e.data.id,
      },
      location.protocol +
        '//' +
        location.hostname +
        `:${import.meta.env.VITE_PUBLIC_NEXT_SERVER_PORT}`,
    );
  }
  if (e.data.type === 'unMounted') {
    gc();
  }
};

onMounted(() => {
  window.addEventListener('message', messageHandler);
  window.parent.postMessage(
    { type: 'frameworkReady', data: '我准备好了~', id: soleId.value },
    location.protocol +
      '//' +
      location.hostname +
      `:${import.meta.env.VITE_PUBLIC_NEXT_SERVER_PORT}`,
  );
  (window as any).id = soleId.value;
});

onUnmounted(() => {
  window.removeEventListener('message', messageHandler);
});
</script>

<template>
  <div v-if="componentName">
    <Suspense>
      <component :is="componentName" :key="randomKey"></component>
    </Suspense>
  </div>
  <div v-if="!componentName">
    <NotFound></NotFound>
  </div>
</template>

<style scoped></style>
