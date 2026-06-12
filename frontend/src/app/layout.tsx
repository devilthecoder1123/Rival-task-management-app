import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'TaskApp',
  description: 'Manage your tasks with priorities, statuses, and due dates.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
