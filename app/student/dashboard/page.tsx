'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// API Functions
import { login, saveStudentReferences, getStudentSubmissions, submitAssignment } from '@/services/api'; 
// Components
import { ImageSlider } from '@/components/ImageSlider';
import { Profile, Submission } from '@/types';
// Icons
import { 
  Upload, Home, Building, CheckCircle, Loader2, 
  Clock, AlertCircle, Layout, LogOut 
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Profile | null>(null);
  const [view, setView] = useState<'init' | 'dashboard'>('init');
  
  // States for Uploading
  const [uploading, setUploading] = useState(false);
  const [renderFile, setRenderFile] = useState<File | null>(null);
  
  // Data States
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // ၁။ စစချင်း Login ဝင်ထားသူကို စစ်ဆေးခြင်း
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // LocalStorage မှ ဝင်ထားသူ Email ကို ဖတ်ခြင်း
    const activeEmail = typeof window !== 'undefined' ? localStorage.getItem('activeUserEmail') : null;

    if (!activeEmail) {
        // Login မဝင်ရသေးရင် Login page ကို ပြန်မောင်းထုတ်မယ်
        router.push('/login'); 
        return;
    }

    // Email ဖြင့် Database တွင် User ရှာခြင်း
    const profile = await login(activeEmail); 
    
    if (profile) {
      setUser(profile);
      // Reference ၂ ပုံလုံးရှိမှ Dashboard ကို ပေးဝင်ပါမယ်
      if (profile.references?.interior && profile.references?.exterior) {
        setView('dashboard');
        const subs = await getStudentSubmissions(profile.id);
        setSubmissions(subs);
      } else {
        setView('init');
      }
    } else {
      // User မရှိရင် (သို့) Error တက်ရင် Login ပြန်သွား
      console.error("User profile not found.");
      router.push('/login');
    }
    setLoading(false);
  };

  // Logout Function
  const handleLogout = () => {
      localStorage.removeItem('activeUserEmail');
      router.push('/login');
  };

  // Upload Logic (Reference)
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
    if (e.target.files && e.target.files[0] && user) {
      setUploading(true);
      const file = e.target.files[0];
      
      const intFile = type === 'interior' ? file : null;
      const extFile = type === 'exterior' ? file : null;

      const updatedProfile = await saveStudentReferences(user.id, intFile, extFile);
      
      if (updatedProfile) {
          setUser(updatedProfile);
          if (updatedProfile.references?.interior && updatedProfile.references?.exterior) {
             // Dashboard မပြောင်းခင် Data အသစ်ဆွဲပါ
             setView('dashboard');
             // Refresh Submissions
             const subs = await getStudentSubmissions(updatedProfile.id);
             setSubmissions(subs);
          }
      }
      setUploading(false);
    }
  };

  // Submit Assignment Logic
  const handleAssignmentSubmit = async () => {
    if (!user || !renderFile) return;
    setUploading(true);
    
    const refUrl = user.references?.interior || '';
    
    // Assignment 1 အတွက် တင်ခြင်း
    await submitAssignment(user.id, 1, refUrl, renderFile, "Draft submission");
    
    const subs = await getStudentSubmissions(user.id);
    setSubmissions(subs);
    setRenderFile(null);
    setUploading(false);
  };

  const triggerUpload = (id: string) => {
    document.getElementById(id)?.click();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
    </div>
  );

  // VIEW A: Project Initialization (Reference Upload)
  if (view === 'init') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative">
        <button onClick={handleLogout} className="absolute top-6 right-6 flex items-center gap-2 text-neutral-500 hover:text-white text-xs uppercase font-bold tracking-widest">
            <LogOut size={14}/> Logout
        </button>

        <div className="max-w-5xl w-full space-y-12">
           <div className="text-center space-y-4">
              <span className="text-red-600 font-bold tracking-widest text-xs uppercase border border-red-900/30 bg-red-900/10 px-3 py-1 rounded-full">Onboarding Protocol</span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Project Initialization</h1>
              <p className="text-neutral-400 max-w-lg mx-auto">
                Welcome, {user?.full_name || 'Student'}. Upload your master reference images to begin.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Interior Card */}
              <div 
                onClick={() => !user?.references?.interior && triggerUpload('int-upload')}
                className={`relative group border border-dashed rounded-xl h-80 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
                  ${user?.references?.interior 
                    ? 'border-red-600/50 bg-red-900/5' 
                    : 'border-neutral-800 hover:border-red-600 hover:bg-neutral-900'}`}
              >
                  <input id="int-upload" type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'interior')} disabled={!!user?.references?.interior} />
                  
                  {user?.references?.interior ? (
                    <>
                      <img src={user.references.interior} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      <div className="z-10 bg-black/80 p-4 rounded-full border border-red-500/30 backdrop-blur-sm">
                         <CheckCircle className="text-red-500" size={32} />
                      </div>
                      <p className="z-10 mt-4 font-bold text-red-500 tracking-widest text-sm">INTERIOR UPLOADED</p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-neutral-800 group-hover:bg-red-600 transition-colors mb-4">
                        <Home size={24} className="text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">Interior Reference</h3>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-6">Living Room / Bedroom</p>
                      <span className="text-xs text-neutral-600 group-hover:text-white transition-colors flex items-center gap-2">
                        {uploading ? <Loader2 className="animate-spin" /> : <Upload size={14} />} Click to Upload
                      </span>
                    </>
                  )}
              </div>

              {/* Exterior Card */}
              <div 
                 onClick={() => !user?.references?.exterior && triggerUpload('ext-upload')}
                 className={`relative group border border-dashed rounded-xl h-80 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
                  ${user?.references?.exterior 
                    ? 'border-red-600/50 bg-red-900/5' 
                    : 'border-neutral-800 hover:border-red-600 hover:bg-neutral-900'}`}
              >
                  <input id="ext-upload" type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'exterior')} disabled={!!user?.references?.exterior} />
                  
                  {user?.references?.exterior ? (
                    <>
                      <img src={user.references.exterior} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      <div className="z-10 bg-black/80 p-4 rounded-full border border-red-500/30 backdrop-blur-sm">
                         <CheckCircle className="text-red-500" size={32} />
                      </div>
                      <p className="z-10 mt-4 font-bold text-red-500 tracking-widest text-sm">EXTERIOR UPLOADED</p>
                    </>
                  ) : (
                    <>
                       <div className="p-4 rounded-full bg-neutral-800 group-hover:bg-red-600 transition-colors mb-4">
                        <Building size={24} className="text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">Exterior Reference</h3>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-6">Facade / Landscape</p>
                      <span className="text-xs text-neutral-600 group-hover:text-white transition-colors flex items-center gap-2">
                         {uploading ? <Loader2 className="animate-spin" /> : <Upload size={14} />} Click to Upload
                      </span>
                    </>
                  )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // VIEW B: Main Dashboard
  const activeSubmission = submissions.find(s => s.assignment_number === 1);
  const masterReference = user?.references?.interior || '';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <header className="border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-black text-black">R</div>
            <span className="font-bold tracking-tight hidden sm:block">RENDER <span className="text-neutral-500">ACADEMY</span></span>
          </div>
          <div className="flex items-center gap-4 text-sm">
             <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white">{user?.full_name}</p>
                    <p className="text-[10px] text-neutral-500 uppercase">Level {user?.current_level || 1} Student</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" />
                </div>
             </div>
             <button onClick={handleLogout} className="text-neutral-500 hover:text-white transition-colors ml-4" title="Logout">
                <LogOut size={16} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Active Protocol</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 border-l border-neutral-800 pl-2">Week 01</span>
               </div>
               <h1 className="text-3xl font-bold text-white">Interior Visualization</h1>
               <p className="text-neutral-500 text-sm mt-1">Assignment 01: Replicate the master reference lighting.</p>
            </div>
            
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                activeSubmission?.status === 'approved' ? 'bg-green-900/10 border-green-900/30' : 
                activeSubmission?.status === 'rejected' ? 'bg-red-900/10 border-red-900/30' :
                'bg-neutral-900 border-white/5'
            }`}>
                {activeSubmission ? (
                    <>
                       {activeSubmission.status === 'pending' && <Clock className="text-yellow-500" size={18} />}
                       {activeSubmission.status === 'approved' && <CheckCircle className="text-green-500" size={18} />}
                       {activeSubmission.status === 'rejected' && <AlertCircle className="text-red-500" size={18} />}
                       <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-white">
                            {activeSubmission.status === 'pending' ? 'Under Review' : activeSubmission.status}
                          </p>
                          <p className="text-[10px] text-neutral-500">
                             {activeSubmission.status === 'pending' ? 'Instructor is checking...' : 'Check feedback'}
                          </p>
                       </div>
                    </>
                ) : (
                    <>
                       <Layout className="text-neutral-500" size={18}/>
                       <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-300">Pending Submission</p>
                          <p className="text-[10px] text-neutral-500">Upload your render below</p>
                       </div>
                    </>
                )}
            </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
            <div className="lg:col-span-3 h-full bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden relative group">
                {activeSubmission ? (
                   // SCENARIO 1: SUBMISSION EXISTS -> SHOW COMPARISON SLIDER
                   <ImageSlider 
                      referenceImage={masterReference}
                      renderImage={activeSubmission.render_image_url}
                      className="w-full h-full"
                   />
                ) : (
                   // SCENARIO 2: NO SUBMISSION -> SHOW SPLIT VIEW (Ref & Upload)
                   <div className="w-full h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
                       
                       {/* Left: Master Reference */}
                       <div className="flex-1 relative bg-black/40 flex items-center justify-center p-8">
                          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Master Reference</span>
                          </div>
                          <img src={masterReference} className="max-h-full max-w-full object-contain shadow-2xl rounded-sm" />
                       </div>

                       {/* Right: Upload Area */}
                       <div className="flex-1 bg-[#0f0f0f] flex flex-col items-center justify-center p-8 relative">
                          <div className="absolute top-4 right-4 z-10 bg-red-900/20 px-3 py-1 rounded-full border border-red-500/20">
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Student Workstation</span>
                          </div>

                          {!renderFile ? (
                             <div 
                                onClick={() => triggerUpload('render-upload')}
                                className="w-full max-w-sm aspect-video border-2 border-dashed border-neutral-800 hover:border-red-600 hover:bg-neutral-800/50 rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group/upload"
                             >
                                <input id="render-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setRenderFile(e.target.files?.[0] || null)} />
                                <div className="p-4 rounded-full bg-neutral-800 group-hover/upload:bg-red-600 transition-colors">
                                   <Upload size={24} className="text-white" />
                                </div>
                                <div className="text-center">
                                   <p className="font-bold text-neutral-300">Upload Render</p>
                                   <p className="text-xs text-neutral-600 mt-1">PNG, JPG up to 10MB</p>
                                </div>
                             </div>
                          ) : (
                             <div className="w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                                <div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-white/10">
                                   <img src={URL.createObjectURL(renderFile)} className="w-full h-full object-cover" />
                                   <button onClick={() => setRenderFile(null)} className="absolute top-2 right-2 p-1 bg-black/80 rounded-full text-red-500 hover:bg-white hover:text-black transition-colors">
                                      <Layout size={14} className="rotate-45" />
                                   </button>
                                </div>
                                <button 
                                  onClick={handleAssignmentSubmit}
                                  disabled={uploading}
                                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                   {uploading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                                   SUBMIT ASSIGNMENT
                                </button>
                             </div>
                          )}
                       </div>
                   </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
