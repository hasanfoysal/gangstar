import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Deshal 13 Official Logo" className="h-8 w-auto object-contain" />
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline font-medium text-slate-600">National Institute of Textile Engineering and Research (NITER)</span>
        </div>

        <div className="flex items-center gap-5 font-medium">
          <Link href="/" className="hover:text-brand-700 transition-colors">
            Home
          </Link>
          <Link href="/portal" className="hover:text-brand-700 transition-colors">
            Directory
          </Link>
          <Link href="/memories" className="hover:text-brand-700 transition-colors">
            Memories
          </Link>
          <Link href="/join" className="hover:text-brand-700 transition-colors">
            Join
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          Developed by Likhon-13th
        </p>
      </div>
    </footer>
  );
}
