import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import fs from 'fs';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
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
        target: 'https://localhost:7777',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
