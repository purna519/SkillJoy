"use client";

/**
 * Client-side providers wrapper.
 * This MUST be a separate "use client" file because the root layout.tsx
 * is a Server Component in Next.js 13+ App Router — you cannot import
 * client components directly into it without this wrapper pattern.
 */
import { SocketProvider } from "../../store/socket-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SocketProvider>{children}</SocketProvider>;
}
