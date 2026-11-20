import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Deshal 13 (দেশাল ১৩) | National Institute of Textile Engineering and Research (NITER)',
  description:
    'Official Alumni & Running Batch directory, memories gallery, and community portal for Deshal 13 (দেশাল ১৩) at National Institute of Textile Engineering and Research (NITER).',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    full_name: string;
    role: 'member' | 'admin';
    status: 'pending' | 'approved';
    avatar_url: string;
  } | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role, status, avatar_url')
      .eq('id', user.id)
      .single();
    if (data) {
      profile = data;
    }
  }

  return (
    <html lang="en" className={`${plusJakarta.variable} ${notoBengali.variable}`}>
      <body className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
        <Navbar userEmail={user?.email ?? null} profile={profile} />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden select-none"
        >
          <img
            src="/logo.jpg"
            alt=""
            className="w-[300px] sm:w-[440px] lg:w-[560px] opacity-[0.12] mix-blend-multiply"
          />
        </div>
        <main className="relative z-10 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
