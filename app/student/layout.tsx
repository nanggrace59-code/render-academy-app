'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, User } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-16 border-r border-neutral-900 bg-[#0a0a0a] flex flex-col fixed md:relative h-16 md:h-screen z-50 bottom-0 md:bottom-auto items-center py-6">
        <div className="hidden md:flex flex-col items-center mb-8">
           <div className="w-10 h-10 bg-red-600 text-white font-bold flex items-center justify-center rounded-sm text-xl shadow-[0_0_15px_rgba(220,38,38,0.4)]">R</div>
        </div>
        <nav className="flex-1 flex md:flex-col items-center justify-around md:justify-start gap-8 w-full">
           <Link href="/student/dashboard" className={`p-3 rounded-lg transition-all ${pathname.includes('dashboard') ? 'text-red-500 bg-red-500/10' : 'text-neutral-500 hover:text-white'}`}>
              <LayoutDashboard size={24} />
           </Link>
        </nav>
        <div className="hidden md:flex flex-col items-center gap-4 w-full pt-6 border-t border-neutral-900">
           <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 border border-neutral-700"><User size={14} /></div>
           <button onClick={handleLogout} className="text-neutral-600 hover:text-red-500 p-2"><LogOut size={20} /></button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] md:h-screen p-4 md:p-8 relative bg-gradient-to-br from-[#050505] to-[#0a0a0a]">
         {children}
      </main>
    </div>
  );
}