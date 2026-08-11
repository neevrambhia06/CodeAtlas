import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClickSparkProvider from '@/components/ClickSparkProvider';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' });

export const metadata: Metadata = {
  title: 'CodeAtlas | AI Software Reasoning Engine',
  description: 'Uncover the business logic in your code.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${outfit.variable} font-body bg-bgbase text-textmain`}>
        <ClickSparkProvider>
          <Navbar />
          {children}
        </ClickSparkProvider>
      </body>
    </html>
  );
}

