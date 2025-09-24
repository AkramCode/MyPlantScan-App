import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";

type AppRouter = Record<string, unknown>;

export const trpc = createTRPCReact<AppRouter>();

const DEFAULT_BACKEND_URL = "https://myplantscan-backend.vercel.app";

const getBaseUrl = () => {
  const configured = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/$/, "");
  }
  return DEFAULT_BACKEND_URL;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
    }),
  ],
  transformer: superjson,
});
