'use client';

import React from 'react';
import { Open_Sans } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${openSans.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
