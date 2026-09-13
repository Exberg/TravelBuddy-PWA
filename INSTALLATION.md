# TravelBuddy-PWA

An [eve](https://eve.dev) agent backend paired with an Vite PWA + [assistant-ui](https://www.assistant-ui.com) frontend.

```
backend/   eve agent (model config, instructions, channels)
frontend/  React Vite app (@assistant-ui/eve)
```

Both projects use [Bun](https://bun.sh) as the package manager/runtime.

## Prerequisites

- [Bun](https://bun.sh) 1.x
- An API key for the ModelScope OpenAI-compatible inference endpoint (`https://api-inference.modelscope.ai/v1`)
- A Google Gemini API key for Gemini 3.8 Flash and Google Search grounding

## 1. Install dependencies

```bash
cd backend && bun install
cd ../frontend && bun install
```

## 2. Configure environment variables

**backend/.env** (copy from `backend/.env.example`):

```bash
cd backend
cp .env.example .env
```

Set `MODELSCOPE_API_KEY` to your ModelScope token and
`GOOGLE_GENERATIVE_AI_API_KEY` to your Gemini API key.

The frontend needs no environment file locally. Vite proxies `/eve/*` to
`http://127.0.0.1:2000`. See `frontend/.env.example` for local overrides and
separate-origin deployments.

## 3. Start the backend

```bash
cd backend
bun run dev
```

This starts `eve dev`, which serves the agent's HTTP API at `http://127.0.0.1:2000`. Leave this running.

## 4. Start the frontend

In a separate terminal:

```bash
cd frontend
bun run dev
```

This starts the Vite PWA at `http://localhost:3000`.

Send a message in the app; it creates an Eve session, streams the model's reply
over Eve's NDJSON stream, and assistant-ui renders it.

## Notes

- The backend's `agent/channels/eve.ts` currently allows anonymous access (`none()`)
  with permissive CORS for the public demo. **Do not deploy private or sensitive
  workloads with this policy.** Replace `none()` with real application auth.
