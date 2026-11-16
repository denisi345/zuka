import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

// Plugin maalum ya kukopi mafaili yote ya .js na .json kwenda dist/ wakati wa build
function copyStaticScripts() {
  return {
    name: 'copy-static-scripts',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      const files = fs.readdirSync(__dirname);
      for (const file of files) {
        if (
          (file.endsWith('.js') || file.endsWith('.json')) &&
          file !== 'vite.config.js' &&
          file !== 'package.json' &&
          file !== 'package-lock.json' &&
          file !== 'tsconfig.json'
        ) {
          fs.copyFileSync(
            path.resolve(__dirname, file),
            path.resolve(distDir, file)
          );
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), copyStaticScripts()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          home: path.resolve(__dirname, 'home.html'),
          secretPanel: path.resolve(__dirname, 'zuka-mother-1974-secret-panel.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
