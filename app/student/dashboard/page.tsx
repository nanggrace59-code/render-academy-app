'use client';

import React, { useEffect, useState } from 'react';
import { Submission, Profile } from '@/types';
import { getStudentSubmissions, submitAssignment, saveStudentReferences, getProfile } from '@/services/api';
import { ImageSlider } from '@/components/ImageSlider';
import { 
  CheckCircle, Clock, Upload, Loader2, AlertCircle, MessageSquare, History, 
  X, Home, Building, PenTool, Quote, Calendar
} from 'lucide-react';

export default function StudentDashboard() {
  // Mock User Session (In real app, use Context or Server Component)
  const [user, setUser] = useState<Profile | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [allMySubmissions, setAllMySubmissions] = useState<Submission[]>([]);
  
  // View States
  const [currentLevelHistory, setCurrentLevelHistory] = useState<Submission[]>([]);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | 'new_draft'>('new_draft');
  const [pastSubmissions, setPastSubmissions] = useState<Submission[]>([]);
  
  // Modal State
  const [modalSubmission, setModalSubmission] = useState<Submission | null>(null);
  const [modalHistory, setModalHistory] = useState<Submission[]>([]);

  // Setup/Submit State
  const [interiorRefFile, setInteriorRefFile] = useState<File | null>(null);
  const [exteriorRefFile, setExteriorRefFile] = useState<File | null>(null);
  const [interiorPreview, setInteriorPreview] = useState<string>('');
  const [exteriorPreview, setExteriorPreview] = useState<string>('');
  
  const [viewContext, setViewContext] = useState<'interior' | 'exterior'>('interior');
  const [renderFile, setRenderFile] = useState<File | null>(null);
  const [renderPreview, setRenderPreview] = useState<string>('');
  const [studentMessage, setStudentMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initial Load
    getProfile('1').then(u => {
        if(u) {
            setUser(u);
            loadData(u.id, u.current_level);
        }
    });
  }, []);

  const loadData = async (userId: string, level: number) => {
    const allSubs = await getStudentSubmissions(userId);
    setAllMySubmissions(allSubs);

    const currentLevelSubs = allSubs
        .filter(s => s.assignment_number === level)
        .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    
    setCurrentLevelHistory(currentLevelSubs);
    const latest = currentLevelSubs.length > 0 ? currentLevelSubs[currentLevelSubs.length - 1] : null;
    setActiveSubmission(latest);

    // Deduplicate Past Submissions (Only Show Latest Approved)
    const past = allSubs.filter(s => s.assignment_number < level && s.status === 'approved');
    const uniqueMap = new Map<number, Submission>();
    past.forEach(sub => {
        if (!uniqueMap.has(sub.assignment_number)) uniqueMap.set(sub.assignment_number, sub);
    });
    setPastSubmissions(Array.from(uniqueMap.values()).sort((a, b) => b.assignment_number - a.assignment_number));
    
    if (latest && latest.status === 'rejected') {
        setViewingHistoryId('new_draft');
    }
  };

  const handleSetupFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'interior') { setInteriorRefFile(file); setInteriorPreview(URL.createObjectURL(file)); }
      else { setExteriorRefFile(file); setExteriorPreview(URL.createObjectURL(file)); }
    }
  };

  const handleSaveReferences = async () => {
     if (!user || !interiorRefFile || !exteriorRefFile) return;
     const updated = await saveStudentReferences(user.id, interiorRefFile, exteriorRefFile);
     if (updated) setUser(updated);
  };

  const handleRenderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setRenderFile(file);
       setRenderPreview(URL.createObjectURL(file));
       setViewingHistoryId('new_draft');
    }
  };

  const handleSubmit = async () => {
     if(!user || !renderFile) return;
     setIsSubmitting(true);
     const refUrl = viewContext === 'interior' ? user.references?.interior || '' : user.references?.exterior || '';
     await submitAssignment(user.id, user.current_level, refUrl, renderFile, studentMessage);
     await loadData(user.id, user.current_level);
     setIsSubmitting(false);
     setRenderFile(null);
     setRenderPreview('');
  };

  const openModal = (sub: Submission) => {
      const history = allMySubmissions
        .filter(s => s.assignment_number === sub.assignment_number)
        .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      setModalHistory(history);
      setModalSubmission(sub);
  };

  if (!user) return <div className="text-white">Loading...</div>;

  // --- Project Setup View ---
  if (!user.references) {
      return (
        <div className="max-w-4xl mx-auto flex flex-col justify-center items-center py-20">
            <h1 className="text-3xl font-bold text-white mb-8">Initialize Project References</h1>
            <div className="grid grid-cols-2 gap-8 w-full mb-10">
                {['interior', 'exterior'].map((type) => (
                    <div key={type} className="bg-[#0f0f0f] border border-neutral-800 p-6 rounded-sm">
                        <h3 className="font-bold text-white uppercase text-sm mb-4">{type} Reference</h3>
                        <div className="relative h-64 border-2 border-dashed border-neutral-800 bg-black flex items-center justify-center">
                            <input type="file" accept="image/*" onChange={(e) => handleSetupFileChange(e, type as 'interior'|'exterior')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {(type === 'interior' ? interiorPreview : exteriorPreview) ? (
                                <img src={type === 'interior' ? interiorPreview : exteriorPreview} className="w-full h-full object-cover"/>
                            ) : <Upload className="text-neutral-600"/>}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={handleSaveReferences} disabled={!interiorPreview || !exteriorPreview} className="bg-red-600 text-white px-8 py-3 font-bold uppercase tracking-widest rounded-sm">Save References</button>
        </div>
      );
  }

  // --- Main Dashboard ---
  let displayRender = '', displayRef = '';
  if (viewingHistoryId === 'new_draft') {
      displayRender = renderPreview;
      displayRef = viewContext === 'interior' ? user.references.interior : user.references.exterior;
  } else {
      const h = currentLevelHistory.find(x => x.id === viewingHistoryId);
      if(h) { displayRender = h.render_image_url; displayRef = h.reference_image_url; }
  }

  const canUpload = !activeSubmission || activeSubmission.status === 'rejected';

  return (
    <div className="max-w-7xl mx-auto pb-20">
       <div className="flex justify-between items-end mb-8 border-b border-neutral-800 pb-6">
           <div>
               <div className="flex items-center gap-3 mb-2">
                   <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"/>
                   <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest">Active Protocol</h2>
               </div>
               <h1 className="text-4xl font-bold text-white tracking-tight">Assignment {String(user.current_level).padStart(2, '0')}</h1>
           </div>
       </div>

       {activeSubmission?.status === 'rejected' && (
           <div className="bg-red-900/10 border-l-4 border-red-600 p-6 mb-8 flex gap-4">
               <AlertCircle className="text-red-500 shrink-0"/>
               <div>
                   <h4 className="font-bold text-sm uppercase mb-1 text-red-500">Revision Required</h4>
                   <p className="text-neutral-300 text-sm">{activeSubmission.teacher_comment}</p>
               </div>
           </div>
       )}

       {/* Workspace */}
       <div className="mb-8">
           {viewingHistoryId === 'new_draft' && (
               <div className="flex justify-center mb-6 gap-2">
                   <button onClick={() => setViewContext('interior')} className={`px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest ${viewContext === 'interior' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Interior</button>
                   <button onClick={() => setViewContext('exterior')} className={`px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest ${viewContext === 'exterior' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}>Exterior</button>
               </div>
           )}

           <div className="w-full h-[600px] border border-neutral-800 bg-black rounded-sm overflow-hidden shadow-2xl flex flex-col">
               <div className="bg-neutral-900/80 px-4 py-2 border-b border-neutral-800 h-10 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-white uppercase">Workstation</span>
               </div>
               <div className="flex-1 relative bg-black">
                   {displayRender && displayRef ? (
                       <ImageSlider referenceImage={displayRef} renderImage={displayRender} className="h-full border-0 rounded-none"/>
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-neutral-700">Upload render to begin comparison</div>
                   )}
               </div>
           </div>

           {/* History Timeline */}
           <div className="flex justify-center mt-6">
                <div className="flex items-center gap-4 bg-neutral-900/50 p-3 rounded-full border border-neutral-800/50">
                    {currentLevelHistory.map((sub, idx) => (
                        <button key={sub.id} onClick={() => setViewingHistoryId(sub.id)} className={`w-3 h-3 rounded-full transition-all ${viewingHistoryId === sub.id ? 'scale-150 bg-white ring-2 ring-white' : sub.status === 'rejected' ? 'bg-red-600' : 'bg-amber-500'}`}/>
                    ))}
                    {canUpload && (
                        <div className="pl-4 border-l border-neutral-800">
                            <button onClick={() => setViewingHistoryId('new_draft')} className={`flex items-center justify-center w-6 h-6 rounded-full border ${viewingHistoryId === 'new_draft' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
                                <PenTool size={10} />
                            </button>
                        </div>
                    )}
                </div>
           </div>
       </div>

       {/* Upload Form */}
       {canUpload && viewingHistoryId === 'new_draft' && (
           <div className="bg-[#0a0a0a] p-6 border border-neutral-900 rounded-sm mb-12">
               <div className="flex gap-4 items-start">
                   <div className="relative h-12 w-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-red-600">
                       <input type="file" onChange={handleRenderFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                       <Upload size={16} className="text-neutral-500"/>
                   </div>
                   <input type="text" value={studentMessage} onChange={(e) => setStudentMessage(e.target.value)} className="flex-1 bg-[#0f0f0f] border border-neutral-800 rounded-sm py-3 px-4 text-sm text-white focus:border-red-600 focus:outline-none" placeholder="Add a note to instructor..."/>
                   <button onClick={handleSubmit} disabled={!renderPreview || isSubmitting} className={`px-8 py-3 font-bold uppercase tracking-wider text-xs rounded-sm ${!renderPreview ? 'bg-neutral-800 text-neutral-500' : 'bg-red-600 text-white'}`}>Submit Revision</button>
               </div>
           </div>
       )}

       {/* Past Submissions */}
       {pastSubmissions.length > 0 && (
           <div className="border-t border-neutral-800 pt-10">
               <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2"><History size={16}/> Mission History</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                   {pastSubmissions.map(sub => (
                       <div key={sub.id} onClick={() => openModal(sub)} className="border border-neutral-800 bg-[#0f0f0f] rounded-sm cursor-pointer hover:border-neutral-600 group">
                           <div className="h-40 bg-black relative overflow-hidden">
                               <img src={sub.render_image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Past"/>
                               <div className="absolute top-2 right-2 bg-emerald-900/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-sm">APPROVED</div>
                           </div>
                           <div className="p-4">
                               <span className="text-white font-bold text-sm">Assignment {String(sub.assignment_number).padStart(2,'0')}</span>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* --- MODAL (THE FIX) --- */}
       {modalSubmission && (
           <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-900 bg-[#0a0a0a] shrink-0">
                   <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-neutral-800 rounded-sm flex items-center justify-center text-white font-bold border border-neutral-700">{String(modalSubmission.assignment_number).padStart(2, '0')}</div>
                       <div>
                           <h2 className="text-lg font-bold text-white uppercase tracking-wider">Protocol Inspection</h2>
                           <p className="text-[10px] text-neutral-500 font-mono">STATUS: <span className={modalSubmission.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}>{modalSubmission.status.toUpperCase()}</span></p>
                       </div>
                   </div>
                   <button onClick={() => { setModalSubmission(null); setModalHistory([]); }} className="text-white hover:text-red-500"><X size={24}/></button>
               </div>
               
               <div className="flex-1 flex min-h-0 bg-[#000000]">
                   {/* Column 1: Image & Bottom Timeline */}
                   <div className="flex-1 flex flex-col relative min-w-0">
                       <div className="flex-1 relative w-full bg-black overflow-hidden">
                           <ImageSlider referenceImage={modalSubmission.reference_image_url} renderImage={modalSubmission.render_image_url} className="h-full border-0 rounded-none w-full" isModalView={true} />
                       </div>
                       {/* Timeline Spots Under Image */}
                       <div className="shrink-0 h-12 bg-[#0a0a0a] border-t border-neutral-900 flex items-center justify-center relative">
                           <div className="absolute h-px bg-neutral-800 w-1/3 left-1/2 -translate-x-1/2 top-1/2"></div>
                           <div className="flex items-center gap-6 z-10 bg-[#0a0a0a] px-4">
                               {modalHistory.map((histItem, idx) => (
                                   <button key={histItem.id} onClick={() => setModalSubmission(histItem)} className={`rounded-full transition-all duration-300 ${modalSubmission?.id === histItem.id ? 'w-3 h-3 bg-white scale-110' : histItem.status === 'rejected' ? 'w-2 h-2 bg-neutral-700 hover:bg-red-500' : 'w-2 h-2 bg-neutral-700 hover:bg-emerald-500'}`} title={`Attempt ${idx+1}`}/>
                               ))}
                           </div>
                       </div>
                   </div>

                   {/* Column 2: Sidebar Feedback */}
                   <div className="w-80 shrink-0 bg-[#0a0a0a] border-l border-neutral-900 flex flex-col overflow-y-auto">
                       <div className="p-6 border-b border-neutral-900">
                           <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Quote size={12}/> Instructor Evaluation</h3>
                           <div className="bg-[#111] border border-neutral-800 p-5 rounded-sm relative">
                               <span className="absolute top-2 left-2 text-neutral-800 text-4xl font-serif leading-none opacity-50">"</span>
                               <p className="text-neutral-300 text-sm italic leading-relaxed relative z-10 pt-2">{modalSubmission.teacher_comment || "No feedback recorded."}</p>
                           </div>
                       </div>
                       <div className="p-6">
                           <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Details</h3>
                           <div className="space-y-3 text-xs">
                               <div className="flex justify-between"><span className="text-neutral-600">Status</span><span className={modalSubmission.status === 'approved' ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{modalSubmission.status.toUpperCase()}</span></div>
                               <div className="flex justify-between"><span className="text-neutral-600">Date</span><span className="text-neutral-400">{modalSubmission.created_at ? new Date(modalSubmission.created_at).toLocaleDateString() : 'N/A'}</span></div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}