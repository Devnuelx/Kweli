"use client";

import React from 'react';
import { ReactLenis } from 'lenis/react';
import { AuthProvider } from '@/lib/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ReactLenis>
  );
}
