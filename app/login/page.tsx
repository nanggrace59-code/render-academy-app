'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient'; 
import { Eye, EyeOff, Loader2 } from 'lucide-react'; // Icon အသစ်များ

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false); // Password ပြ/မပြ State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !user) {
        setError('Invalid email or password.');
      } else {
        localStorage.setItem('activeUserEmail', email);
        if (user.role === 'student') {
            router.push('/student/dashboard');
        } else if (user.role === 'teacher') {
            router.push('/teacher/dashboard');
        } else {
            setError('User role not recognized.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans text-neutral-200 justify-center items-center relative overflow-hidden selection:bg-[#d90238] selection:text-white">
        
        {/* TOP LEFT BRANDING */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
             <div className="w-8 h-8 bg-[#d90238] rounded flex items-center justify-center font-black text-black">R</div>
             <span className="font-bold tracking-tight text-white hidden sm:block">RENDER <span className="text-neutral-500">ACADEMY</span></span>
        </div>

        <div className="w-full max-w-[400px] p-4 z-10">
           {/* Center Logo */}
           <div className="text-center mb-10">
             <div className="w-12 h-12 bg-[#d90238] rounded-lg flex items-center justify-center font-black text-black text-2xl mx-auto mb-4 shadow-[0_0_30px_rgba(217,2,56,0.4)]">R</div>
             <h1 className="text-3xl font-bold text-white tracking-tighter">
               ACADEMY ACCESS
             </h1>
             <p className="text-neutral-500 text-xs uppercase tracking-widest mt-2">Visualization Learning Portal</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-5 bg-[#0a0a0a] p-8 rounded-2xl border border-white/5 shadow-2xl">
               <div>
                   <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Email Address</label>
                   <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#d90238] focus:ring-1 focus:ring-[#d90238] outline-none transition-all placeholder:text-neutral-700" 
                    placeholder="student@render.art"
                   />
               </div>

               <div>
                   <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Password</label>
                   <div className="relative">
                       <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#d90238] focus:ring-1 focus:ring-[#d90238] outline-none transition-all placeholder:text-neutral-700 pr-10" 
                        placeholder="••••••••"
                       />
                       {/* Eye Icon Toggle */}
                       <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                       >
                           {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                       </button>
                   </div>
               </div>

               {error && (
                 <div className="bg-[#d90238]/10 border border-[#d90238]/20 p-3 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                   <AlertCircle className="text-[#d90238]" size={16} />
                   <p className="text-[#d90238] text-xs font-bold">{error}</p>
                 </div>
               )}

               <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#d90238] hover:bg-[#b0022d] text-white font-bold py-4 rounded-lg text-xs transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(217,2,56,0.3)] hover:shadow-[0_0_30px_rgba(217,2,56,0.5)] flex items-center justify-center gap-2"
               >
                {loading ? <Loader2 className="animate-spin" size={16}/> : 'Login to Portal'}
               </button>
           </form>
        </div>

        {/* Background Noise/Decoration */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
    </div>
  );
}

function AlertCircle({ className, size }: { className?: string, size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
    )
}
