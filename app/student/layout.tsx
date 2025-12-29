'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, User, Menu } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 flex flex-col font-sans">
      <main className="flex-1 overflow-y-auto min-h-screen p-6 md:p-10 relative bg-[#050505]">
         {/* Top Mesh Gradient */}
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none select-none"/>
         <div className="relative z-10">
            {children}
         </div>
      </main>
    </div>
  );
}
