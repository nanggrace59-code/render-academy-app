'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // In a real app, check session here.
    router.replace('/login');
  }, [router]);

  return <div className="min-h-screen bg-black flex items-center justify-center text-neutral-500 font-mono">Loading Academy...</div>;
}