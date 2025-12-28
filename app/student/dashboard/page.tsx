'use client';

import React, { useEffect, useState } from 'react'; // useContext ဖယ်လိုက်ပါပြီ (မလိုတော့လို့ပါ)
import { useRouter } from 'next/navigation';
import { Profile, Submission } from '@/types';
import { getStudentSubmissions, submitAssignment, saveStudentReferences, login, getAcademyGallery } from '@/services/api'; // getProfile အစား login သုံးပါတယ်
import { ImageSlider } from '@/components/ImageSlider';
// Icons
import { 
  CheckCircle, Upload, Loader2, AlertCircle, History, 
  Home, Building, PenTool, Quote, Layers, Layout, LogOut
} from 'lucide-react';

// ==========================================
// 1. WRAPPER COMPONENT (Vercel Integration)
// ==========================================
export default function StudentDashboardWrapper() {
    const router = useRouter();
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // LocalStorage မှ User ကို ရှာခြင်း (AuthContext အစား)
        const email = localStorage.getItem('activeUserEmail');
        if (!email) {
            router.push('/login');
            return;
        }

        login(email).then(profile => {
             if (!profile) {
                 router.push('/login');
             } else {
                 setUser(profile);
             }
             setLoading(false);
        });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('activeUserEmail');
        router.push('/login');
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-[#050505] text-neutral-500 font-mono text-xs"><Loader2 className="animate-spin mr-2"/> Loading Secure Environment...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans relative">
            {/* Logout Button (Added for convenience) */}
            <button onClick={handleLogout} className="absolute top-6 right-6 z-50 text-neutral-500 hover:text-white transition-colors">
                <LogOut size={16}/>
            </button>
            
            {/* Original Component */}
            <StudentDashboardInner user={user} viewMode="workspace" />
        </div>
    );
}

// ==========================================
// 2. ORIGINAL COMPONENT (Your Code)
// ==========================================
interface StudentDashboardProps {
    user: Profile;
    viewMode: 'workspace' | 'gallery';
}

const StudentDashboardInner: React.FC<StudentDashboardProps> = ({ user, viewMode }) => {
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [allMySubmissions, setAllMySubmissions] = useState<Submission[]>([]);
  const [currentLevelHistory, setCurrentLevelHistory] = useState<Submission[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | 'new_draft'>('new_draft');
  const [pastSubmissions, setPastSubmissions] = useState<Submission[]>([]);
  const [gallerySubmissions, setGallerySubmissions] = useState<Submission[]>([]);
  const [modalSubmission, setModalSubmission] = useState<Submission | null>(null);
  const [modalHistory, setModalHistory] = useState<Submission[]>([]);
  
  // Setup & Form State
  const [interiorRefFile, setInteriorRefFile] = useState<File | null>(null);
  const [exteriorRefFile, setExteriorRefFile] = useState<File | null>(null);
  const [interiorPreview, setInteriorPreview] = useState<string>('');
  const [exteriorPreview, setExteriorPreview] = useState<string>('');
  const [viewContext, setViewContext] = useState<'interior' | 'exterior'>('interior');
  const [renderFile, setRenderFile] = useState<File | null>(null);
  const [renderPreview, setRenderPreview] = useState<string>('');
  const [studentMessage, setStudentMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingRefs, setIsSavingRefs] = useState(false);

  useEffect(() => {
    loadData();
  }, [user.id, user.current_level, viewMode]);

  const loadData = async () => {
    if (viewMode === 'workspace') {
        const allSubs = await getStudentSubmissions(user.id);
        setAllMySubmissions(allSubs);
        
        const currentLevelSubs = allSubs
            .filter(s => s.assignment_number === user.current_level)
            .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        
        setCurrentLevelHistory(currentLevelSubs);
        const latest = currentLevelSubs.length > 0 ? currentLevelSubs[currentLevelSubs.length - 1] : null;
        setActiveSubmission(latest);

        // Deduplicate & Sort Past
        const past = allSubs.filter(s => s.assignment_number < user.current_level && s.status === 'approved');
        const uniqueMap = new Map<number, Submission>();
        past.forEach(sub => { if (!uniqueMap.has(sub.assignment_number)) uniqueMap.set(sub.assignment_number, sub); });
        setPastSubmissions(Array.from(uniqueMap.values()).sort((a, b) => b.assignment_number - a.assignment_number));
        
        if (latest && latest.status === 'rejected') setViewingHistoryId('new_draft');
    } else {
        const gal = await getAcademyGallery();
        setGallerySubmissions(gal);
    }
  };

  const handleSetupFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (type === 'interior') { setInteriorRefFile(file); setInteriorPreview(url); }
      else { setExteriorRefFile(file); setExteriorPreview(url); }
    }
  };

  const handleSaveReferences = async () => {
     if (!interiorRefFile && !exteriorRefFile) return; // Allow partial upload fix
     setIsSavingRefs(true);
     await saveStudentReferences(user.id, interiorRefFile, exteriorRefFile);
     window.location.reload(); 
  };

  const handleSubmit = async () => {
     if(!renderFile) return;
     setIsSubmitting(true);
     const refUrl = viewContext === 'interior' ? user.references?.interior || '' : user.references?.exterior || '';
     await submitAssignment(user.id, user.current_level, refUrl, renderFile, studentMessage);
     await loadData();
     setIsSubmitting(false);
     setRenderFile(null);
     setRenderPreview('');
     setStudentMessage('');
  };

  const openModal = (sub: Submission) => {
      const history = allMySubmissions
        .filter(s => s.assignment_number === sub.assignment_number)
        .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      setModalHistory(history);
      setModalSubmission(sub);
  };

  // --- PROJECT INITIALIZATION ---
  if (viewMode === 'workspace' && (!user.references?.interior || !user.references?.exterior)) {
      return (
        <div className="max-w-5xl mx-auto flex flex-col justify-center items-center min-h-[80vh]">
            <div className="glass-panel p-10 rounded-2xl w-full text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Project Initialization</h1>
                <p className="text-neutral-500 mb-10 max-w-lg mx-auto">Upload master reference images to establish the ground truth for your visualization curriculum.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    {['interior', 'exterior'].map((type) => (
                        <div key={type} className="bg-black/40 border border-white/5 p-6 rounded-xl hover:border-red-600/50 transition-colors group">
                            <h3 className="font-bold text-white uppercase text-xs mb-4 tracking-widest">{type} Reference</h3>
                            <div className="relative h-64 border-2 border-dashed border-white/10 rounded-lg overflow-hidden bg-black flex items-center justify-center group-hover:bg-white/5 transition-colors">
                                <input type="file" accept="image/*" onChange={(e) => handleSetupFileChange(e, type as any)} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                {(type === 'interior' ? interiorPreview : exteriorPreview) || (type === 'interior' ? user.references?.interior : user.references?.exterior) ? (
                                    <img src={(type === 'interior' ? interiorPreview : exteriorPreview) || (type === 'interior' ? user.references?.interior : user.references?.exterior)} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="flex flex-col items-center text-neutral-600">
                                        <Upload size={32} className="mb-2 group-hover:text-red-600 transition-colors"/>
                                        <span className="text-xs font-bold uppercase">Upload Image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleSaveReferences} disabled={(!interiorPreview && !user.references?.interior) || isSavingRefs} className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 font-bold uppercase tracking-widest rounded-lg shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSavingRefs ? 'Initializing...' : 'Confirm References'}
                </button>
            </div>
        </div>
      );
  }

  // --- WORKSPACE LOGIC ---
  const isPending = activeSubmission?.status === 'pending';
  const canUpload = !activeSubmission || activeSubmission.status === 'rejected';
  
  let displayRender = '', displayRef = '';
  if (viewingHistoryId === 'new_draft') {
      displayRender = renderPreview;
      displayRef = viewContext === 'interior' ? user.references?.interior || '' : user.references?.exterior || '';
  } else {
      const h = currentLevelHistory.find(x => x.id === viewingHistoryId);
      if(h) { displayRender = h.render_image_url; displayRef = h.reference_image_url; }
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-20 p-6">
       
       {/* HEADER */}
       <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
           <div>
               <div className="flex items-center gap-3 mb-2">
                   <div className={`w-2 h-2 rounded-full ${viewMode === 'workspace' ? 'bg-red-600 shadow-[0_0_10px_#de0443]' : 'bg-emerald-500'}`}/>
                   <h2 className={`text-xs font-bold uppercase tracking-[0.2em] ${viewMode === 'workspace' ? 'text-red-600' : 'text-emerald-500'}`}>
                       {viewMode === 'workspace' ? 'Active Protocol' : 'Academy Archive'}
                   </h2>
               </div>
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                   {viewMode === 'workspace' ? `Assignment ${String(user.current_level).padStart(2,'0')}` : 'Student Gallery'}
               </h1>
           </div>
       </div>

       {viewMode === 'workspace' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* REJECTION ALERT */}
           {activeSubmission?.status === 'rejected' && (
               <div className="glass-panel border-l-4 border-l-red-600 p-6 mb-8 rounded-r-lg flex gap-4 items-start bg-red-900/10">
                   <AlertCircle className="text-red-600 shrink-0 mt-1" size={20}/>
                   <div>
                       <h4 className="font-bold text-sm uppercase mb-1 text-white">Revision Required</h4>
                       <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">{activeSubmission.teacher_comment}</p>
                   </div>
               </div>
           )}

           {/* MAIN WORKSPACE CARD */}
           <div className="flex flex-col lg:flex-row gap-8 mb-16">
               {/* LEFT: Image Area */}
               <div className="flex-1 min-w-0">
                   {/* Context Tabs */}
                   {viewingHistoryId === 'new_draft' && (
                       <div className="flex gap-1 mb-4">
                           {['interior', 'exterior'].map((ctx) => (
                               <button 
                                key={ctx} 
                                onClick={() => setViewContext(ctx as any)} 
                                className={`px-6 py-2.5 rounded-t-lg text-[10px] font-bold uppercase tracking-widest border-t border-x transition-all ${viewContext === ctx ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-transparent border-transparent text-neutral-600 hover:text-white'}`}
                               >
                                   {ctx}
                               </button>
                           ))}
                       </div>
                   )}

                   <div className="h-[650px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#020202]">
                       {displayRender && displayRef ? (
                           <ImageSlider referenceImage={displayRef} renderImage={displayRender} className="h-full border-0 rounded-none"/>
                       ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50">
                               <Layers size={48} className="mb-4 opacity-20"/>
                               <p className="font-mono text-xs uppercase">Awaiting Render Upload</p>
                           </div>
                       )}
                   </div>
               </div>

               {/* RIGHT: Controls & History */}
               <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 pt-12">
                   
                   {/* History Timeline */}
                   <div className="glass-panel p-6 rounded-xl border border-white/5 bg-[#0a0a0a]">
                       <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={12}/> Version History</h3>
                       <div className="space-y-3 relative">
                           {/* Connecting Line */}
                           <div className="absolute left-3 top-2 bottom-2 w-px bg-white/5 -z-10"></div>
                           
                           {currentLevelHistory.map((sub, idx) => (
                               <button 
                                key={sub.id} 
                                onClick={() => setViewingHistoryId(sub.id)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all group ${viewingHistoryId === sub.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                               >
                                   <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 border ${
                                       sub.status === 'rejected' ? 'bg-red-900/20 border-red-500 text-red-500' : 
                                       sub.status === 'pending' ? 'bg-amber-900/20 border-amber-500 text-amber-500' : 'bg-emerald-900/20 border-emerald-500 text-emerald-500'
                                   }`}>
                                       {idx + 1}
                                   </div>
                                   <div className="text-left">
                                       <div className="text-xs text-white font-bold">Attempt {idx+1}</div>
                                       <div className="text-[10px] text-neutral-500 font-mono uppercase">{sub.status}</div>
                                   </div>
                               </button>
                           ))}

                           {canUpload && (
                               <button 
                                onClick={() => setViewingHistoryId('new_draft')}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all group ${viewingHistoryId === 'new_draft' ? 'bg-red-600/20 border border-red-600/30' : 'hover:bg-white/5'}`}
                               >
                                   <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center z-10 shadow-glow">
                                       <PenTool size={10} />
                                   </div>
                                   <div className="text-left">
                                       <div className="text-xs text-white font-bold">New Draft</div>
                                       <div className="text-[10px] text-red-500 font-mono uppercase">In Progress</div>
                                   </div>
                               </button>
                           )}
                       </div>
                   </div>

                   {/* Upload Actions */}
                   {canUpload && viewingHistoryId === 'new_draft' && (
                       <div className="glass-panel p-6 rounded-xl animate-in slide-in-from-right-4 duration-500 border border-white/5 bg-[#0a0a0a]">
                           <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Upload size={12}/> Submission</h3>
                           
                           <div className="mb-4">
                               <div className={`relative h-24 border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${renderPreview ? 'border-red-600/50 bg-red-600/5' : 'border-white/10 hover:border-red-600/30 hover:bg-white/5'}`}>
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setRenderFile(e.target.files[0]);
                                            setRenderPreview(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }} className="absolute inset-0 opacity-0 z-20 cursor-pointer"/>
                                    {renderPreview ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="text-red-600 mb-1" size={20}/>
                                            <span className="text-[10px] text-red-600 font-bold uppercase">Ready</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-neutral-500">
                                            <Upload size={16} className="mb-1"/>
                                            <span className="text-[9px] uppercase font-bold">Select Render</span>
                                        </div>
                                    )}
                               </div>
                           </div>

                           <input 
                            type="text" 
                            value={studentMessage} 
                            onChange={(e) => setStudentMessage(e.target.value)} 
                            placeholder="Add a note..." 
                            className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-xs text-white mb-4 focus:border-red-600 focus:outline-none"
                           />

                           <button 
                            onClick={handleSubmit} 
                            disabled={!renderPreview || isSubmitting}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-glow transition-all disabled:opacity-50 disabled:shadow-none"
                           >
                               {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Submit Work'}
                           </button>
                       </div>
                   )}
               </div>
           </div>
        </div>
       ) : (
        // GALLERY VIEW
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in zoom-in-95">
            {gallerySubmissions.map(sub => (
                <div key={sub.id} className="glass-card rounded-xl overflow-hidden cursor-pointer group border border-white/5 bg-[#0a0a0a]">
                    <div className="aspect-square relative">
                        <img src={sub.render_image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Gallery"/>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"/>
                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <p className="text-white font-bold text-sm">Assignment {String(sub.assignment_number).padStart(2,'0')}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">ID: {sub.student_id.substring(0,6)}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
       )}
    </div>
  );
};
