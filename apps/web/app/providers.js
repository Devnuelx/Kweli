"use client";

import { SessionProvider } from 'next-auth/react';
import { ReactLenis } from 'lenis/react';

export function Providers({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ReactLenis>
  );
}
