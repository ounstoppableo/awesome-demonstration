import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from './StoreProvider';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="/iconfont/iconfont.js"></script>
        <script src="/particles.js"></script>
        <title>Awesome Demostration</title>
      </head>
      <body className={`antialiased`}>
        <StoreProvider>
          <Suspense>{children}</Suspense>
        </StoreProvider>
      </body>
    </html>
  );
}
