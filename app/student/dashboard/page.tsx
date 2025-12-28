'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, saveStudentReferences, getStudentSubmissions, submitAssignment } from '@/services/api'; 
import { ImageSlider } from '@/components/ImageSlider';
import { Profile, Submission } from '@/types';
import { Upload, Home, Building, CheckCircle, Loader2, Clock, AlertCircle, Layout, LogOut, RefreshCw } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Profile | null>(null);
  const [view, setView] = useState<'init' | 'dashboard'>('init');
  const [uploading, setUploading] = useState(false);
  const [renderFile, setRenderFile] = useState<File | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const activeEmail = typeof window !== 'undefined' ? localStorage.getItem('activeUserEmail') : null;
    if (!activeEmail) { router.push('/login'); return; }
    const profile = await login(activeEmail); 
    if (profile) {
      setUser(profile);
      // Note: We wait for user to click the button
      if (profile.references?.interior && profile.references?.exterior) {
         getStudentSubmissions(profile.id).then(setSubmissions);
      }
    } else { router.push('/login'); }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.removeItem('activeUserEmail'); router.push('/login'); };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
    if (e.target.files && e.target.files[0] && user) {
      setUploading(true);
      const file = e.target.files[0];
      const updatedProfile = await saveStudentReferences(user.id, type === 'interior' ? file : null, type === 'exterior' ? file : null);
      if (updatedProfile) setUser(updatedProfile);
      setUploading(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!user || !renderFile) return;
    setUploading(true);
    await submitAssignment(user.id, 1, user.references?.interior || '', renderFile, "Draft submission");
    const subs = await getStudentSubmissions(user.id);
    setSubmissions(subs);
    setRenderFile(null);
    setUploading(false);
  };

  const triggerUpload = (id: string) => { document.getElementById(id)?.click(); };
  const goToDashboard = () => { setView('dashboard'); };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-red-600" size={32} /></div>;

  const isMasterClass = user?.enrolled_class === 'master_class';
  const assignmentTitle = isMasterClass ? "Week 01: Concept & Modeling" : "Week 01: Lighting & Composition";
  const allReferencesUploaded = user?.references?.interior && user?.references?.exterior;

  // --- VIEW A: PROJECT INITIALIZATION ---
  if (view === 'init') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative">
        <button onClick={handleLogout} className="absolute top-6 right-6 flex items-center gap-2 text-neutral-500 hover:text-white text-xs uppercase font-bold tracking-widest"><LogOut size={14}/> Logout</button>

        <div className="max-w-5xl w-full space-y-10">
           <div className="text-center space-y-4">
              <span className="text-red-600 font-bold tracking-widest text-xs uppercase border border-red-900/30 bg-red-900/10 px-3 py-1 rounded-full">{isMasterClass ? "Master Class Protocol" : "Viz Class Protocol"}</span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Project Initialization</h1>
              <p className="text-neutral-400 max-w-lg mx-auto">Welcome, {user?.full_name}. Upload your master references. These will serve as the ground truth for all future assignments.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Interior Card */}
              <div onClick={() => triggerUpload('int-upload')} className={`relative group border border-dashed rounded-xl h-80 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${user?.references?.interior ? 'border-red-600/50' : 'border-neutral-800 hover:border-red-600 hover:bg-neutral-900'}`}>
                  <input id="int-upload" type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'interior')} />
                  {user?.references?.interior ? (
                    <>
                      <img src={user.references.interior} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                      <div className="z-10 flex flex-col items-center">
                         <CheckCircle className="text-red-500 mb-2" size={32} />
                         <p className="font-bold text-red-500 tracking-widest text-sm">INTERIOR READY</p>
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                            <span className="flex items-center gap-2 text-white font-bold"><RefreshCw size={16}/> Replace Image</span>
                         </div>
                      </div>
                    </>
                  ) : (
                    <><div className="p-4 rounded-full bg-neutral-800 group-hover:bg-red-600 transition-colors mb-4"><Home size={24} className="text-white" /></div><h3 className="font-bold text-lg mb-1">Interior Reference</h3><span className="text-xs text-neutral-600 group-hover:text-white transition-colors flex items-center gap-2">{uploading ? <Loader2 className="animate-spin" /> : <Upload size={14} />} Click to Upload</span></>
                  )}
              </div>

              {/* Exterior Card */}
              <div onClick={() => triggerUpload('ext-upload')} className={`relative group border border-dashed rounded-xl h-80 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${user?.references?.exterior ? 'border-red-600/50' : 'border-neutral-800 hover:border-red-600 hover:bg-neutral-900'}`}>
                  <input id="ext-upload" type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'exterior')} />
                  {user?.references?.exterior ? (
                    <>
                      <img src={user.references.exterior} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                      <div className="z-10 flex flex-col items-center">
                         <CheckCircle className="text-red-500 mb-2" size={32} />
                         <p className="font-bold text-red-500 tracking-widest text-sm">EXTERIOR READY</p>
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                            <span className="flex items-center gap-2 text-white font-bold"><RefreshCw size={16}/> Replace Image</span>
                         </div>
                      </div>
                    </>
                  ) : (
                    <><div className="p-4 rounded-full bg-neutral-800 group-hover:bg-red-600 transition-colors mb-4"><Building size={24} className="text-white" /></div><h3 className="font-bold text-lg mb-1">Exterior Reference</h3><span className="text-xs text-neutral-600 group-hover:text-white transition-colors flex items-center gap-2">{uploading ? <Loader2 className="animate-spin" /> : <Upload size={14} />} Click to Upload</span></>
                  )}
              </div>
           </div>

           {/* Button: Short & Clean (Matching your 2nd image) */}
           {allReferencesUploaded && (
             <div className="flex justify-center pt-6 animate-in slide-in-from-bottom-4">
                <button onClick={goToDashboard} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded flex items-center gap-2 transition-all shadow-lg shadow-red-900/30 uppercase tracking-widest text-sm">
                    <CheckCircle size={18} strokeWidth={3} /> INITIALIZE PROJECT REFERENCES
                </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  // --- VIEW B: MAIN DASHBOARD ---
  const activeSubmission = submissions.find(s => s.assignment_number === 1);
  const masterReference = user?.references?.interior || '';
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <header className="border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-black text-black">R</div><span className="font-bold tracking-tight hidden sm:block">RENDER <span className="text-neutral-500">ACADEMY</span></span></div>
          <div className="flex items-center gap-4 text-sm">
             <div className="text-right hidden sm:block leading-tight"><p className="text-xs font-bold text-white mb-0.5">{user?.full_name}</p>{isMasterClass ? (<div className="flex flex-col items-end"><p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">MASTER CLASS</p><p className="text-[8px] text-neutral-500 uppercase tracking-wide">Architecture Modeling • LVL {user?.current_level}</p></div>) : (<p className="text-[10px] text-neutral-500 uppercase">Visualization Class • LVL {user?.current_level}</p>)}</div>
             <button onClick={handleLogout} className="text-neutral-500 hover:text-white transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Active Protocol</span><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 border-l border-neutral-800 pl-2">{isMasterClass ? "Modeling Phase" : "Viz Phase"}</span></div><h1 className="text-3xl font-bold text-white">{assignmentTitle}</h1></div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${activeSubmission?.status === 'approved' ? 'bg-green-900/10 border-green-900/30' : activeSubmission?.status === 'rejected' ? 'bg-red-900/10 border-red-900/30' : 'bg-neutral-900 border-white/5'}`}>{activeSubmission ? (<><Clock className="text-yellow-500" size={18} /><div><p className="text-xs font-bold uppercase tracking-wider text-white">{activeSubmission.status}</p></div></>) : (<><Layout className="text-neutral-500" size={18}/><div><p className="text-xs font-bold uppercase tracking-wider text-neutral-300">Pending Submission</p></div></>)}</div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
            <div className="lg:col-span-3 h-full bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden relative group">
                {activeSubmission ? (<ImageSlider referenceImage={masterReference} renderImage={activeSubmission.render_image_url} className="w-full h-full" />) : (<div className="w-full h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10"><div className="flex-1 relative bg-black/40 flex items-center justify-center p-8"><img src={masterReference} className="max-h-full max-w-full object-contain shadow-2xl rounded-sm" /></div><div className="flex-1 bg-[#0f0f0f] flex flex-col items-center justify-center p-8 relative">{!renderFile ? (<div onClick={() => triggerUpload('render-upload')} className="w-full max-w-sm aspect-video border-2 border-dashed border-neutral-800 hover:border-red-600 hover:bg-neutral-800/50 rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group/upload"><input id="render-upload" type="file" className="hidden" accept="image/*" onChange={(e) => setRenderFile(e.target.files?.[0] || null)} /><div className="p-4 rounded-full bg-neutral-800 group-hover/upload:bg-red-600 transition-colors"><Upload size={24} className="text-white" /></div><div className="text-center"><p className="font-bold text-neutral-300">Upload Render</p></div></div>) : (<div className="w-full max-w-sm flex flex-col gap-4"><div className="aspect-video bg-black rounded-lg overflow-hidden relative border border-white/10"><img src={URL.createObjectURL(renderFile)} className="w-full h-full object-cover" /></div><button onClick={handleAssignmentSubmit} disabled={uploading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">{uploading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />} SUBMIT ASSIGNMENT</button></div>)}</div></div>)}
            </div>
        </div>
      </main>
    </div>
  );
}
