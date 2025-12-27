import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Render The Art Academy',
  description: 'Architectural Visualization Learning Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}