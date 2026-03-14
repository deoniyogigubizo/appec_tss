import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'APPEC TSS - College Management System',
  description: 'A comprehensive college management system for students, teachers, and administrators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
