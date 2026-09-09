# TravelBuddy PWA

React, Vite, and Tailwind frontend for TravelBuddy. The chat surface uses
assistant-ui primitives with the Eve runtime while preserving the custom mobile
design.

## Requirements

- Node.js 24 or newer (required by Eve)
- The TravelBuddy Eve backend in `../backend`

## Local development

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. No frontend environment file is needed locally. Vite proxies `/eve/*` to Eve
   at `http://127.0.0.1:2000`.

   If Eve uses another local origin, copy `.env.example` to `.env.local` and
   change `EVE_PROXY_TARGET`. For a separately deployed frontend, set
   `VITE_EVE_URL` to the public HTTPS origin of Eve, without `/eve/v1`.

3. Start the backend in another terminal:

   ```bash
   cd ../backend
   bun run dev
   ```

4. Start the frontend:

   ```bash
   npm run dev
   ```

The frontend runs on port 3000. Eve's default local HTTP origin is
`http://127.0.0.1:2000`.

## Validation

```bash
npm run lint
npm run build
```

The production build emits an installable PWA, including its web manifest,
service worker, offline application shell, and install icons.
