import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import fs from 'fs';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      https: {
        key: fs.readFileSync('./cert/server.key'),
        cert: fs.readFileSync('./cert/server.crt'),
      },
      proxy: {
        ['/api']: {
          target: `https://localhost:${env.VITE_PUBLIC_NEXT_SERVER_PORT}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
