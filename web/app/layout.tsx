import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CS2 Tournament',
  description: 'Self-hosted CS2 tournament platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0e13] text-zinc-100 antialiased">
        <header className="border-b border-zinc-800 px-6 py-3">
          <a href="/" className="text-lg font-semibold">
            <span className="text-brand">CS2</span> Tournament
          </a>
          <nav className="ml-6 inline-flex gap-4 text-sm text-zinc-400">
            <a href="/" className="hover:text-zinc-100">Matches</a>
            <a href="/admin" className="hover:text-zinc-100">Admin</a>
          </nav>
        </header>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
