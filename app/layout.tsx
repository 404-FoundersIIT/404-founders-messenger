import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '404 Founders | Real-Time Messenger',
  description: 'Production-structured WhatsApp-style web messaging and WebRTC calling application for college project.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
