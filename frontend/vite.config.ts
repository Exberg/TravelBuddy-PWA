import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, __dirname, '');
  const eveProxyTarget =
    env.EVE_PROXY_TARGET?.trim() || 'http://127.0.0.1:2000';

  return {
    plugins: [
      react(),
      tailwindcss(),
      aistudioMediaPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'travelbuddy-icon.svg',
          'pwa-192.png',
          'pwa-512.png',
          'apple-touch-icon.png',
        ],
        manifest: {
          name: 'TravelBuddy',
          short_name: 'TravelBuddy',
          description:
            'An intelligent travel companion for discovering places and building practical itineraries.',
          theme_color: '#163300',
          background_color: '#FBF9F4',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        // Keep browser requests same-origin in development. Eve owns the
        // /eve/v1 routes and runs on port 2000 by default.
        '/eve': {
          target: eveProxyTarget,
          changeOrigin: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
