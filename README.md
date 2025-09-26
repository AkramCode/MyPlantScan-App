# MyPlantScan

MyPlantScan is a cross-platform mobile experience built with Expo Router and React Native. The app helps plant lovers identify species, analyse health, and manage a personal garden. The frontend talks to a Vercel-hosted backend that proxies requests to OpenRouter (for AI) and Supabase (for account data).

## Tech Stack
- React Native + Expo Router
- TypeScript
- TanStack Query
- Supabase (authentication & profiles)
- OpenRouter (Gemini models via backend proxy)
- Vercel Edge Functions for backend APIs

## Prerequisites
- Node.js 20+
- npm (bundled with Node.js) or pnpm
- Expo CLI (`npm install -g expo`) if you want the global command

## Project Structure
```
app/                     Expo Router routes
components/              Shared UI components
hooks/                   Custom hooks (Plant store, etc.)
lib/                     Frontend clients (TRPC, backend AI client, auth helpers)
backend/MyPlantScan-Backend/   Vercel Edge functions and shared utils
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and adjust as needed:
   ```bash
   cp .env.example .env
   ```
   Ensure `EXPO_PUBLIC_BACKEND_URL` points to the deployed backend (defaults to the production Vercel URL).
3. Update Vercel backend environment variables with valid keys for OpenRouter and Supabase (see `.env.example`).

## Running the App
Use Expo CLI scripts that align with the updated package.json:
```bash
# Start the Metro bundler with the interactive DevTools UI
npm run start

# Launch directly on a platform
npm run start:android
npm run start:ios
npm run start:web
```
Expo Go or custom development builds can be used to preview on devices. For simulators, ensure Xcode (iOS) or Android Studio is installed.

## Backend Integration
- All OpenRouter requests are routed through `https://myplantscan.com` (configurable via `EXPO_PUBLIC_BACKEND_URL`).
- Supabase authentication and profile endpoints are also proxied via the backend so that sensitive keys remain on the server.
- When running the backend locally, update `EXPO_PUBLIC_BACKEND_URL` accordingly.

## Linting
```bash
npm run lint
```

## Deployment Notes
- Configure EAS if you plan to ship to app stores: https://docs.expo.dev/eas/
- Backend routes live under `backend/MyPlantScan-Backend/api`. Deploy to Vercel with the existing configuration in `backend/MyPlantScan-Backend/vercel.json`.

## Troubleshooting
- Ensure environment variables are set before importing `lib/trpc` or the backend client to avoid runtime errors.
- If you change backend routes, mirror the paths in `lib/openrouter.ts` and any other frontend services that call the API.

## License
Please refer to the repository license for usage terms.
