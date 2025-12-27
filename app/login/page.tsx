'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient'; // Supabase ကို တိုက်ရိုက်ခေါ်သုံးပါမယ်

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Password အတွက် State အသစ်
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading ပြဖို့
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Supabase Database ထဲမှာ Email ရော Password ရော တိုက်စစ်ခြင်း
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Password ကိုပါ စစ်ပါပြီ
        .single();

      if (error || !user) {
        // Data မရှိရင် သို့မဟုတ် Error တက်ရင်
        setError('User not found or wrong password.');
      } else {
        // Data မှန်ရင် Role အလိုက် လမ်းခွဲပေးခြင်း
        if (user.role === 'student') {
            router.push('/student/dashboard');
        } else if (user.role === 'teacher') {
            router.push('/teacher/dashboard');
        } else {
            router.push('/'); // Admin or others
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // စမ်းသပ်ရန်အတွက် Quick Fill Function
  const fillCredentials = () => {
    setEmail('yinang723@gmail.com');
    setPassword('render123');
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
               <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ACADEMY LOGIN</h1>
               <p className="text-neutral-500 text-sm">Enter your details to access the visualization academy.</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-5">
               {/* Email Input */}
               <div>
                   <label className="block text-xs font-medium text-neutral-400 mb-2 ml-1">Email</label>
                   <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-[#121212] border border-neutral-800 rounded-md p-3.5 text-sm text-white focus:border-[#E50914] focus:outline-none" 
                    placeholder="student@render.art"
                   />
               </div>

               {/* Password Input (အသစ်ထည့်ထားသော အပိုင်း) */}
               <div>
                   <label className="block text-xs font-medium text-neutral-400 mb-2 ml-1">Password</label>
                   <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-[#121212] border border-neutral-800 rounded-md p-3.5 text-sm text-white focus:border-[#E50914] focus:outline-none" 
                    placeholder="Enter your password"
                   />
               </div>

               {/* Error Message */}
               {error && <p className="text-red-500 text-xs ml-1">{error}</p>}

               {/* Submit Button */}
               <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#E50914] hover:bg-red-700 text-white font-bold py-3.5 rounded-md text-sm shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                {loading ? 'Checking...' : 'Access Academy'}
               </button>
           </form>

           {/* Quick Fill Button
