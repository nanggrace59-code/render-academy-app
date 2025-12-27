'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await login(email);
    if (user) {
      if (user.role === 'student') router.push('/student/dashboard');
      else router.push('/teacher/dashboard');
    } else {
      setError('User not found. Try student@render.art');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans text-neutral-200">
      <header className="px-8 py-8 border-b border-neutral-900/30">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5">
           <span className="text-[#E50914] font-black text-xl tracking-tighter">RTA</span>
           <span className="font-bold text-xl tracking-tight text-white">ACADEMY</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
           <div className="text-center mb-10">
               <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">STUDENT LOGIN</h1>
               <p className="text-neutral-500 text-sm">Enter your details to access the visualization academy.</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-5">
               <div>
                   <label className="block text-xs font-medium text-neutral-400 mb-2 ml-1">Email</label>
                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#121212] border border-neutral-800 rounded-md p-3.5 text-sm text-white focus:border-[#E50914] focus:outline-none" placeholder="student@render.art"/>
               </div>
               {error && <p className="text-red-500 text-xs ml-1">{error}</p>}
               <button type="submit" className="w-full bg-[#E50914] hover:bg-red-700 text-white font-bold py-3.5 rounded-md text-sm shadow-lg shadow-red-900/20 transition-all">Access Academy</button>
           </form>

           <div className="mt-12 text-center">
               <p className="text-[10px] uppercase text-neutral-700 mb-3 tracking-widest">Simulation Access</p>
               <button onClick={() => setEmail('student@render.art')} className="text-xs text-neutral-600 hover:text-white transition-colors">Fill Student Credentials</button>
           </div>
        </div>
      </div>
    </div>
  );
}