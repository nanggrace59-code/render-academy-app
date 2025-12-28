'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ၁။ Database မှာ User ရှိ/မရှိ နှင့် Password မှန်/မမှန် စစ်ဆေးခြင်း
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Password တိုက်စစ်ပါမယ်
        .single();

      if (error || !user) {
        setError('Invalid email or password.');
      } else {
        // ၂။ (အရေးကြီး) Dashboard က သိအောင် LocalStorage ထဲ မှတ်ပေးရပါမယ်
        localStorage.setItem('activeUserEmail', email);

        // ၃။ Role အလိုက် လမ်းကြောင်းခွဲပေးခြင်း
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans text-neutral-200 justify-center items-center">
        <div className="w-full max-w-[400px] p-4">
           {/* Logo Area */}
           <div className="text-center mb-8">
             <h1 className="text-3xl font-bold text-white tracking-tighter">
               <span className="text-red-600">RTA</span> ACADEMY
             </h1>
             <p className="text-neutral-500 text-xs uppercase tracking-widest mt-2">Visualization Learning Portal</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-5 bg-[#111] p-8 rounded-xl border border-neutral-800 shadow-2xl">
               <div>
                   <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wide">Email Address</label>
                   <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg p-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all placeholder:text-neutral-700" 
                    placeholder="student@render.art"
                   />
               </div>

               <div>
                   <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wide">Password</label>
                   <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg p-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all placeholder:text-neutral-700" 
                    placeholder="••••••••"
                   />
               </div>

               {error && (
                 <div className="bg-red-900/20 border border-red-900/50 p-3 rounded flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                   <p className="text-red-400 text-xs">{error}</p>
                 </div>
               )}

               <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-lg text-sm transition-all uppercase tracking-wide shadow-lg shadow-red-900/20"
               >
                {loading ? 'Authenticating...' : 'Access Academy'}
               </button>
           </form>
           
           <div className="text-center mt-6">
             <p className="text-[10px] text-neutral-600">Restricted Access • Authorized Personnel Only</p>
           </div>
        </div>
    </div>
  );
}
