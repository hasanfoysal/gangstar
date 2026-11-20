'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  Users,
  Images,
  ShieldCheck,
  UserCircle,
  LogIn,
  UserPlus,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavbarProps {
  userEmail: string | null;
  profile: {
    full_name: string;
    role: 'member' | 'admin';
    status: 'pending' | 'approved';
    avatar_url: string;
  } | null;
}

export default function Navbar({ userEmail, profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/portal', label: 'Directory', icon: Users },
    { href: '/memories', label: 'Memories', icon: Images },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center group" aria-label="Deshal 13 Home">
          <img
            src="/logo.jpg"
            alt="Deshal 13 Official Logo"
            className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive('/admin')
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin CMS
            </Link>
          )}
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {userEmail ? (
            <>
              <Link
                href="/profile"
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserCircle className="h-4 w-4 text-brand-600" />
                <span className="max-w-[140px] truncate">
                  {profile?.full_name || 'My Profile'}
                </span>
                {profile?.status === 'pending' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Pending
                  </span>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Join Room 13
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin CMS
            </Link>
          )}

          <div className="border-t border-slate-100 pt-2 mt-2 space-y-1.5">
            {userEmail ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2.5">
                    <UserCircle className="h-4 w-4 text-brand-600" />
                    {profile?.full_name || 'My Profile'}
                  </span>
                  {profile?.status === 'pending' && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      Pending
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/join"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  Join Room 13
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
