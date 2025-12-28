'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  login, saveStudentReferences, getStudentSubmissions, submitAssignment 
} from '@/services/api';
import { ImageSlider } from '@/components/ImageSlider';
import { Profile, Submission } from '@/types';
import { 
  Loader2, LogOut, Home, Building, History, 
  Upload, CheckCircle, AlertCircle, Clock, 
  ChevronRight, Layers, Send, RefreshCw
} from 'lucide-react';

// --- WRAPPER FOR AUTHENTICATION ---
export default function StudentDashboardWrapper() {
    const router = useRouter();
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const email = localStorage.getItem('activeUserEmail');
        if (!email) { router.push('/login'); return; }
        login(email).then(profile => {
             if (!profile) router.push('/login');
             else setUser(profile);
             setLoading(false);
        });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('activeUserEmail');
        router.push('/login');
    };

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#de0443]" size={32} /></div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-[#de0443] selection:text-white overflow-hidden flex flex-col">
            <header className="h-16 border-b border-white/5 bg-[#050505] flex items-center justify-between px-6 shrink-0 z-50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#de0443] rounded flex items-center justify-center font-black text-black">R</div>
                    <span className="font-bold tracking-tight text-white hidden sm:block">RENDER <span className="text-neutral-500">ACADEMY</span></span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">{user.full_name}</p>
                        <p className="text-[10px] text-[#de0443] font-mono uppercase">LVL {String(user.current_level).padStart(2,'0')} • {user.enrolled_class === 'master_class' ? 'ARCHITECT' : 'VISUALIZER'}</p>
                    </div>
                    <button onClick={handleLogout} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"><LogOut size={14}/></button>
                 </div>
            </header>
            
            <StudentWorkspace user={user} />
        </div>
    );
}

// --- MAIN WORKSPACE LOGIC ---
function StudentWorkspace({ user }: { user: Profile }) {
    // Data State
    const [history, setHistory] = useState<Submission[]>([]);
    
    // UI State
    const [context, setContext] = useState<'interior' | 'exterior'>('interior');
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

    // Form State
    const [renderFile, setRenderFile] = useState<File | null>(null);
    const [renderPreview, setRenderPreview] = useState<string>('');
    const [studentNote, setStudentNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialization State
    const [refFiles, setRefFiles] = useState<{interior: File | null, exterior: File | null}>({ interior: null, exterior: null });
    const [refPreviews, setRefPreviews] = useState<{interior: string, exterior: string}>({ interior: '', exterior: '' });
    const [isInitSaving, setIsInitSaving] = useState(false);

    useEffect(() => { loadSubmissions(); }, []);

    const loadSubmissions = async () => {
        const all = await getStudentSubmissions(user.id);
        const currentLevelSubs = all.filter(s => s.assignment_number === user.current_level)
                                    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        setHistory(currentLevelSubs);
        
        const latest = currentLevelSubs.length > 0 ? currentLevelSubs[currentLevelSubs.length - 1] : null;
        
        // If latest exists and is NOT rejected (meaning Pending or Approved), show it by default.
        if (latest && latest.status !== 'rejected') {
            setSelectedHistoryId(latest.id);
        } else {
            // If rejected or no submissions, go to Draft mode
            setSelectedHistoryId(null); 
        }
    };

    // --- 1. INITIALIZATION CHECK ---
    if (!user.references?.interior || !user.references?.exterior) {
        const handleRefChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
            if(e.target.files?.[0]) {
                const f = e.target.files[0];
                setRefFiles(prev => ({...prev, [type]: f}));
                setRefPreviews(prev => ({...prev, [type]: URL.createObjectURL(f)}));
            }
        };
        const saveRefs = async () => {
            if(!refFiles.interior && !user.references?.interior) return;
            if(!refFiles.exterior && !user.references?.exterior) return;
            setIsInitSaving(true);
            await saveStudentReferences(user.id, refFiles.interior, refFiles.exterior);
            window.location.reload();
        }

        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 bg-[#050505]">
                <div className="max-w-4xl w-full text-center space-y-8">
                     <div>
                        <span className="text-[#de0443] text-xs font-bold tracking-[0.2em] uppercase border border-[#de0443]/30 px-3 py-1 rounded-full bg-[#de0443]/5">Project Initialization</span>
                        <h1 className="text-4xl font-bold text-white mt-4">Upload Master References</h1>
                        <p className="text-neutral-500 mt-2">These will serve as the ground truth for all future assignments.</p>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        {['interior', 'exterior'].map((type) => (
                            <div key={type} className="group relative aspect-video bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-[#de0443]/50 transition-all">
                                <input type="file" accept="image/*" onChange={(e) => handleRefChange(e, type as any)} className="absolute inset-0 z-20 opacity-0 cursor-pointer" />
                                {(type === 'interior' ? refPreviews.interior : refPreviews.exterior) ? (
                                    <img src={type === 'interior' ? refPreviews.interior : refPreviews.exterior} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"/>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[#de0443] transition-colors"><Upload size={20}/></div>
                                        <span className="text-xs font-bold uppercase tracking-widest">{type} Reference</span>
                                    </div>
                                )}
                            </div>
                        ))}
                     </div>
                     <button onClick={saveRefs} disabled={isInitSaving} className="bg-[#de0443] hover:bg-[#b00335] text-white px-8 py-4 rounded-lg font-bold uppercase tracking-widest text-sm transition-all w-full max-w-sm disabled:opacity-50">
                        {isInitSaving ? 'Initializing Protocol...' : 'Initialize Project'}
                     </button>
                </div>
            </div>
        )
    }

    // --- 2. MAIN DASHBOARD LOGIC ---
    
    // Check latest status to determine if user can upload
    const latestSubmission = history.length > 0 ? history[history.length - 1] : null;
    const isLatestPending = latestSubmission?.status === 'pending';
    const isLatestApproved = latestSubmission?.status === 'approved';
    const isLatestRejected = latestSubmission?.status === 'rejected';
    
    // Can upload if: No submissions yet, OR Latest is Rejected
    const canUpload = !latestSubmission || isLatestRejected;

    // View Logic
    const currentRefImage = context === 'interior' ? user.references.interior : user.references.exterior;
    
    // Determine what render to show in the slider
    let currentRenderImage = renderPreview; // Default to upload preview
    let viewStatus = 'DRAFT'; // DRAFT, PENDING, REJECTED, APPROVED

    if (selectedHistoryId) {
        // Viewing History Mode
        const sub = history.find(h => h.id === selectedHistoryId);
        if (sub) {
            currentRenderImage = sub.render_image_url;
            viewStatus = sub.status.toUpperCase();
        }
    } else {
        // Draft Mode
        viewStatus = 'DRAFT';
    }

    const handleSubmit = async () => {
        if (!renderFile) return;
        setIsSubmitting(true);
        // Use the current context's reference for the submission
        const refUrl = context === 'interior' ? user.references?.interior : user.references?.exterior;
        await submitAssignment(user.id, user.current_level, refUrl || '', renderFile, studentNote);
        await loadSubmissions();
        
        // Reset Form
        setRenderFile(null);
        setRenderPreview('');
        setStudentNote('');
        setIsSubmitting(false);
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT: MAIN VISUAL AREA (Immersive) */}
            <div className="flex-1 flex flex-col bg-[#020202] relative min-w-0">
                
                {/* Protocol Header (Floating Top Left) */}
                <div className="absolute top-6 left-6 z-30 pointer-events-none select-none">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#de0443] w-1 h-10 shadow-[0_0_15px_#de0443]"></div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#de0443]">Active Protocol</span>
                                <span className="w-1 h-1 bg-neutral-600 rounded-full"></span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{context} Phase</span>
                            </div>
                            <h2 className="text-white font-bold text-3xl leading-none tracking-tight">Assignment {String(user.current_level).padStart(2,'0')}</h2>
                        </div>
                    </div>
                </div>

                {/* Context Switcher (Floating Top Center) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex bg-black/80 backdrop-blur-md rounded-full border border-white/10 p-1 shadow-2xl">
                    <button 
                        onClick={() => setContext('interior')} 
                        className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${context === 'interior' ? 'bg-[#de0443] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                    >
                        <Home size={12}/> Interior Context
                    </button>
                    <button 
                        onClick={() => setContext('exterior')} 
                        className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${context === 'exterior' ? 'bg-[#de0443] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
                    >
                        <Building size={12}/> Exterior Context
                    </button>
                </div>

                {/* VISUALIZER AREA (FIXED LOGIC) */}
                <div className="flex-1 relative w-full h-full bg-[#020202]">
                    {currentRefImage && currentRenderImage ? (
                        <ImageSlider 
                            referenceImage={currentRefImage} 
                            renderImage={currentRenderImage} 
                            className="w-full h-full"
                        />
                    ) : currentRefImage ? (
                        // SHOW REFERENCE ONLY (When no render uploaded yet)
                        <div className="w-full h-full relative group">
                            <img 
                                src={currentRefImage} 
                                className="w-full h-full object-contain opacity-50 grayscale-[50%] group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <Layers size={64} className="text-[#de0443] mb-4 opacity-80 shadow-glow animate-pulse"/>
                                <p className="text-white font-bold text-lg tracking-widest uppercase mb-2">Workspace Ready</p>
                                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                                    Upload a render to enable comparison
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20">
                            <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
                                No Reference Loaded
                            </p>
                        </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
                        <div className={`px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 ${
                            viewStatus === 'PENDING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                            viewStatus === 'REJECTED' ? 'bg-[#de0443]/10 border-[#de0443]/30 text-[#de0443]' :
                            viewStatus === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                            'bg-white/5 border-white/10 text-neutral-400'
                        }`}>
                            {viewStatus === 'PENDING' && <Clock size={14}/>}
                            {viewStatus === 'REJECTED' && <AlertCircle size={14}/>}
                            {viewStatus === 'APPROVED' && <CheckCircle size={14}/>}
                            <span className="text-[10px] font-bold uppercase tracking-widest">{viewStatus} STATE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: CONTROL PANEL (Sidebar) */}
            <div className="w-[400px] bg-[#0a0a0a] border-l border-white/5 flex flex-col shrink-0 z-40 shadow-2xl">
                
                {/* 1. Version Timeline */}
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History size={12}/> Submission Timeline
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {/* History Nodes */}
                        {history.map((sub, idx) => (
                            <button 
                                key={sub.id} 
                                onClick={() => setSelectedHistoryId(sub.id)}
                                className={`flex flex-col items-center gap-2 group min-w-[60px] cursor-pointer transition-opacity ${selectedHistoryId && selectedHistoryId !== sub.id ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}
                            >
                                <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                                    selectedHistoryId === sub.id ? 'bg-white text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' :
                                    sub.status === 'rejected' ? 'border-[#de0443] text-[#de0443] bg-[#de0443]/10' :
                                    sub.status === 'approved' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                                    'border-amber-500 text-amber-500 bg-amber-500/10'
                                }`}>
                                    v{idx + 1}
                                </div>
                                <span className={`text-[8px] font-mono uppercase ${selectedHistoryId === sub.id ? 'text-white' : 'text-neutral-600'}`}>{sub.status}</span>
                            </button>
                        ))}

                        {/* Next Draft Node (Ghost) - Only if allowed */}
                        {canUpload && (
                            <button 
                                onClick={() => setSelectedHistoryId(null)}
                                className={`flex flex-col items-center gap-2 group min-w-[60px] cursor-pointer transition-opacity ${selectedHistoryId !== null ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}
                            >
                                <div className={`w-10 h-10 rounded-full border border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 transition-all ${selectedHistoryId === null ? 'border-[#de0443] text-[#de0443] bg-[#de0443]/10' : 'hover:border-neutral-500 hover:text-white'}`}>
                                    <Upload size={14}/>
                                </div>
                                <span className="text-[8px] font-mono uppercase text-neutral-600">Draft</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Action Area */}
                <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-[#0a0a0a]">
                    
                    {/* SCENARIO A: Viewing a Historical Submission */}
                    {selectedHistoryId && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                             {/* Teacher Feedback Block */}
                             {history.find(h => h.id === selectedHistoryId)?.teacher_comment && (
                                <div className="bg-[#de0443]/10 border border-[#de0443]/20 p-5 rounded-lg">
                                    <h4 className="text-[#de0443] text-xs font-bold uppercase mb-2 flex items-center gap-2"><AlertCircle size={14}/> Instructor Feedback</h4>
                                    <p className="text-neutral-300 text-sm leading-relaxed font-medium">
                                        "{history.find(h => h.id === selectedHistoryId)?.teacher_comment}"
                                    </p>
                                </div>
                             )}
                             
                             <div className="bg-white/5 border border-white/5 p-5 rounded-lg">
                                 <h4 className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Student Note</h4>
                                 <p className="text-neutral-400 text-sm italic">
                                    "{history.find(h => h.id === selectedHistoryId)?.student_message || 'No notes added.'}"
                                 </p>
                             </div>

                             {isLatestRejected && selectedHistoryId === latestSubmission?.id && (
                                 <button onClick={() => setSelectedHistoryId(null)} className="w-full py-4 bg-[#de0443] hover:bg-[#b00335] text-white font-bold uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
                                     Start Revision (v{history.length + 1}) <ChevronRight size={14}/>
                                 </button>
                             )}
                        </div>
                    )}

                    {/* SCENARIO B: Uploading New Draft */}
                    {!selectedHistoryId && canUpload && (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4">
                            <div className="mb-6">
                                <h3 className="text-white text-lg font-bold mb-1">Submit Assignment</h3>
                                <p className="text-neutral-500 text-xs">Upload your latest render for review.</p>
                            </div>

                            {/* Dropzone */}
                            <label className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all mb-6 relative group ${renderPreview ? 'border-[#de0443] bg-[#de0443]/5' : 'border-white/10 hover:border-[#de0443]/50 hover:bg-white/5'}`}>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    if(e.target.files?.[0]) {
                                        setRenderFile(e.target.files[0]);
                                        setRenderPreview(URL.createObjectURL(e.target.files[0]));
                                    }
                                }}/>
                                {renderPreview ? (
                                    <div className="relative w-full h-full p-2">
                                        <img src={renderPreview} className="w-full h-full object-contain rounded-lg"/>
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm">
                                            <span className="text-white text-xs font-bold uppercase flex items-center gap-2"><RefreshCw size={14}/> Change Image</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-neutral-500 group-hover:text-white transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[#de0443] transition-colors"><Upload size={20}/></div>
                                        <span className="text-xs font-bold uppercase tracking-widest">Click to Upload Render</span>
                                    </div>
                                )}
                            </label>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Student Notes</label>
                                    <textarea 
                                        value={studentNote}
                                        onChange={(e) => setStudentNote(e.target.value)}
                                        placeholder="Describe your process or challenges..."
                                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#de0443] focus:outline-none resize-none h-24 placeholder:text-neutral-700"
                                    />
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!renderPreview || isSubmitting}
                                    className="w-full py-4 bg-[#de0443] hover:bg-[#b00335] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(222,4,67,0.3)] hover:shadow-[0_0_30px_rgba(222,4,67,0.5)]"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Send size={14}/> Submit for Review</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCENARIO C: Pending State */}
                    {!selectedHistoryId && !canUpload && isLatestPending && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-amber-500/20 bg-amber-500/5 rounded-xl">
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 animate-pulse">
                                <Clock size={32}/>
                            </div>
                            <h3 className="text-white font-bold text-lg">Under Review</h3>
                            <p className="text-neutral-500 text-sm mt-2 leading-relaxed">Your instructor is currently reviewing your submission. You will be notified once a decision is made.</p>
                            <div className="h-px w-full bg-white/5 my-6"></div>
                            <button onClick={() => setSelectedHistoryId(latestSubmission?.id || null)} className="text-xs text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
                                <History size={12}/> View Submitted Draft
                            </button>
                        </div>
                    )}

                     {/* SCENARIO D: Approved State */}
                     {!selectedHistoryId && !canUpload && isLatestApproved && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                <CheckCircle size={32}/>
                            </div>
                            <h3 className="text-white font-bold text-lg">Assignment Approved</h3>
                            <p className="text-neutral-500 text-sm mt-2 leading-relaxed">Excellent work. You have passed this protocol. Proceed to the next level when ready.</p>
                            <button onClick={() => setSelectedHistoryId(latestSubmission?.id || null)} className="mt-6 text-xs text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
                                <History size={12}/> View Final Submission
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
