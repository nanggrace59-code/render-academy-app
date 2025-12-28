'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Upload, Home, Building, CheckCircle, Loader2 } from 'lucide-react';

// အစ်ကို့ AI Studio ထဲက Logic အတိုင်းပါပဲ
export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'init' | 'dashboard'>('init');
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // 1. စဝင်လာရင် User ရဲ့ အခြေအနေကို စစ်ပါမယ်
  useEffect(() => {
    const checkStatus = async () => {
      // လက်ရှိ Login ဝင်ထားတဲ့ User ကို Email နဲ့ ရှာပါတယ်
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'yinang723@gmail.com') // Demo အတွက်ပါ
        .single();

      if (profile) {
        setUserProfile(profile);
        // AI Studio Logic: Ref ၂ ပုံလုံး ရှိမှ Dashboard ကို ပေးဝင်မယ်
        if (profile.ref_interior_url && profile.ref_exterior_url) {
          setView('dashboard');
        } else {
          setView('init');
        }
      }
      setLoading(false);
    };
    checkStatus();
  }, []);

  // 2. ပုံတင်တဲ့ Function (AI Studio Logic အတိုင်း Database မှာ သိမ်းပါတယ်)
  const handleUpload = async (type: 'interior' | 'exterior') => {
    setUploading(true);
    // Simulation: တကယ်တမ်း Supabase Storage တင်မယ့်နေရာပါ
    setTimeout(async () => {
        const fakeUrl = `https://via.placeholder.com/800x600?text=${type}+Reference`;
        
        const updateData = type === 'interior' 
            ? { ref_interior_url: fakeUrl } 
            : { ref_exterior_url: fakeUrl };

        await supabase.from('profiles').update(updateData).eq('id', userProfile.id);
        
        // State ပြန် update လုပ်ပြီး Dashboard ပြောင်းမလား စစ်ပါတယ်
        const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', userProfile.id).single();
        if (newProfile.ref_interior_url && newProfile.ref_exterior_url) {
            setView('dashboard');
        } else {
            // UI ပြဖို့ State update
            setUserProfile(newProfile);
        }
        setUploading(false);
    }, 1500);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  // 3. UI ပိုင်း (AI Studio ဒီဇိုင်းအတိုင်း)
  if (view === 'init') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-8">Project Initialization</h1>
        <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
            {/* Interior Upload Card */}
            <div onClick={() => handleUpload('interior')} className="cursor-pointer border border-gray-800 p-10 rounded hover:border-red-600 transition flex flex-col items-center justify-center h-64 bg-[#0a0a0a]">
                {userProfile?.ref_interior_url ? (
                    <div className="text-red-500 flex flex-col items-center"><CheckCircle className="mb-2"/><span>Interior Uploaded</span></div>
                ) : (
                    <div className="flex flex-col items-center text-gray-500">
                        {uploading ? <Loader2 className="animate-spin mb-2"/> : <Home className="mb-2"/>}
                        <span>Upload Interior Ref</span>
                    </div>
                )}
            </div>

            {/* Exterior Upload Card */}
            <div onClick={() => handleUpload('exterior')} className="cursor-pointer border border-gray-800 p-10 rounded hover:border-red-600 transition flex flex-col items-center justify-center h-64 bg-[#0a0a0a]">
                {userProfile?.ref_exterior_url ? (
                    <div className="text-red-500 flex flex-col items-center"><CheckCircle className="mb-2"/><span>Exterior Uploaded</span></div>
                ) : (
                     <div className="flex flex-col items-center text-gray-500">
                        {uploading ? <Loader2 className="animate-spin mb-2"/> : <Building className="mb-2"/>}
                        <span>Upload Exterior Ref</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  // 4. Dashboard UI
  return (
    <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-6">STUDENT DASHBOARD</h1>
        <div className="border border-gray-800 p-6 rounded bg-[#111]">
            <h2 className="text-xl mb-4">Assignments</h2>
            <p className="text-gray-400">Assignment list will load here...</p>
        </div>
    </div>
  );
}
