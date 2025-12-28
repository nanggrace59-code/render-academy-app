'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  login, saveStudentReferences, getStudentSubmissions, submitAssignment, getAcademyGallery 
} from '@/services/api';
import { ImageSlider } from '@/components/ImageSlider'; // This component needs to handle the Zoom/Pan logic separately
import { Profile, Submission } from '@/types';
import { 
  Loader2, LogOut, Home, Building, History, 
  Upload, CheckCircle, AlertCircle, Clock, 
  ChevronRight, Layers, FileText, Send 
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
        <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-[#de0443] selection:text-white">
            <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl z-50 flex items-center justify-between px-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#de0443] rounded flex items-center justify-center font-black text-black">R</div>
                    <span className="font-bold tracking-tight text-white hidden sm:block">RENDER <span className="text-neutral-500">ACADEMY</span></span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">{user.full_name}</p>
                        <p className="text-[10px] text-[#de0443] font-mono uppercase">LVL {String(user.current_level).padStart(2,'0')} • {user.enrolled_class === 'master_class' ? 'ARCHITECT' : 'VISUALIZER'}</p>
                    </div>
                    <button onClick={handleLogout} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"><LogOut size={14}/></button>
                 </div>
            </header>
            
            <div className="pt-16 h-screen overflow-hidden flex flex-col">
                <StudentWorkspace user={user} />
            </div>
        </div>
    );
}

// --- MAIN WORKSPACE LOGIC ---
function StudentWorkspace({ user }: { user: Profile }) {
    // Data State
    const [history, setHistory] = useState<Submission[]>([]);
    const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
    
    // UI State
    const [context, setContext] = useState<'interior' | 'exterior'>('interior');
    const [viewMode, setViewMode] = useState<'upload' | 'history'>('upload'); // Toggle between upload form and history view
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
        setActiveSubmission(latest);
        
        // If latest is approved or pending, show it. If rejected, ready for new upload.
        if (latest && latest.status !== 'rejected') {
            setSelectedHistoryId(latest.id);
        } else {
            setSelectedHistoryId(null); // Null means "New Draft" mode
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
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

    // --- 2. MAIN DASHBOARD ---
    
    // Derived States
    const isPending = activeSubmission?.status === 'pending';
    const isRejected = activeSubmission?.status === 'rejected';
    const isApproved = activeSubmission?.status === 'approved';
    const canUpload = !activeSubmission || isRejected;

    // View Logic
    const currentRefImage = context === 'interior' ? user.references.interior : user.references.exterior;
    
    // Determine what render to show
    let currentRenderImage = renderPreview; // Default to upload preview
    let viewStatus = 'DRAFT'; // DRAFT, PENDING, REJECTED, APPROVED

    if (selectedHistoryId) {
        // Viewing History Mode
        const sub = history.find(h => h.id === selectedHistoryId);
        if (sub) {
            currentRenderImage = sub.render_image_url;
            viewStatus = sub.status.toUpperCase();
        }
    }

    const handleSubmit = async () => {
        if (!renderFile) return;
        setIsSubmitting(true);
        const refUrl = context === 'interior' ? user.references?.interior : user.references?.exterior;
        await submitAssignment(user.id, user.current_level, refUrl || '', renderFile, studentNote);
        await loadSubmissions();
        setRenderFile(null);
        setRenderPreview('');
        setStudentNote('');
        setIsSubmitting(false);
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT: MAIN VISUAL AREA (Immersive) */}
            <div className="flex-1 flex flex-col bg-[#020202] relative">
                {/* Protocol Header */}
                <div className="absolute top-6 left-6 z-20 pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#de0443] w-1 h-8"></div>
                        <div>
                            <h2 className="text-white font-bold text-xl leading-none">Assignment {String(user.current_level).padStart(2,'0')}</h2>
                            <p className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest mt-1">Active Protocol • {context}</p>
                        </div>
                    </div>
                </div>

                {/* Context Switcher (Floating) */}
                <div className="absolute top-6 right-6 z-20 flex bg-black/60 backdrop-blur-md rounded-lg border border-white/10 p-1">
                    <button onClick={() => setContext('interior')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${context === 'interior' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}>
                        <Home size={12}/> Interior
                    </button>
                    <button onClick={() => setContext('exterior')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${context === 'exterior' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'}`}>
                        <Building size={12}/> Exterior
                    </button>
                </div>

                {/* VISUALIZER (The Slider) */}
                <div className="flex-1 relative">
                    {currentRefImage && currentRenderImage ? (
                        <ImageSlider 
                            referenceImage={currentRefImage} 
                            renderImage={currentRenderImage} 
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20">
                            <Layers size={64} className="text-white mb-4 opacity-50"/>
                            <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Waiting for Render Input...</p>
                        </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute bottom-8 left-8 z-20">
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
            <div className="w-[400px] bg-[#0a0a0a] border-l border-white/5 flex flex-col shrink-0 z-30">
                
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
                                className={`flex flex-col items-center gap-2 group min-w-[60px] cursor-pointer`}
                            >
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
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

                        {/* Next Draft Node (Ghost) */}
                        {canUpload && (
                            <button 
                                onClick={() => setSelectedHistoryId(null)}
                                className={`flex flex-col items-center gap-2 group min-w-[60px] cursor-pointer`}
                            >
                                <div className={`w-8 h-8 rounded-full border border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 transition-all ${selectedHistoryId === null ? 'border-[#de0443] text-[#de0443] bg-[#de0443]/10' : 'hover:border-neutral-500'}`}>
                                    <Upload size={12}/>
                                </div>
                                <span className="text-[8px] font-mono uppercase text-neutral-600">Draft</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Action Area */}
                <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                    
                    {/* SCENARIO A: Viewing a Historical Submission */}
                    {selectedHistoryId && (
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                             {/* Teacher Feedback Block */}
                             {history.find(h => h.id === selectedHistoryId)?.teacher_comment && (
                                <div className="bg-[#de0443]/10 border border-[#de0443]/20 p-4 rounded-lg">
                                    <h4 className="text-[#de0443] text-xs font-bold uppercase mb-2 flex items-center gap-2"><AlertCircle size={14}/> Instructor Feedback</h4>
                                    <p className="text-neutral-300 text-sm leading-relaxed">
                                        "{history.find(h => h.id === selectedHistoryId)?.teacher_comment}"
                                    </p>
                                </div>
                             )}
                             
                             <div className="bg-white/5 border border-white/5 p-4 rounded-lg">
                                 <h4 className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Student Note</h4>
                                 <p className="text-neutral-400 text-sm italic">
                                    "{history.find(h => h.id === selectedHistoryId)?.student_message || 'No notes added.'}"
                                 </p>
                             </div>

                             {isRejected && (
                                 <button onClick={() => setSelectedHistoryId(null)} className="w-full py-4 bg-[#de0443] hover:bg-[#b00335] text-white font-bold uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-2">
                                     Start Revision (v{history.length + 1}) <ChevronRight size={14}/>
                                 </button>
                             )}
                        </div>
                    )}

                    {/* SCENARIO B: Uploading New Draft */}
                    {!selectedHistoryId && canUpload && (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4">
                            <h3 className="text-white text-lg font-bold mb-1">Submit Assignment</h3>
                            <p className="text-neutral-500 text-xs mb-6">Upload your latest render for review.</p>

                            {/* Dropzone */}
                            <label className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all mb-6 ${renderPreview ? 'border-[#de0443] bg-[#de0443]/5' : 'border-white/10 hover:border-[#de0443]/50 hover:bg-white/5'}`}>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    if(e.target.files?.[0]) {
                                        setRenderFile(e.target.files[0]);
                                        setRenderPreview(URL.createObjectURL(e.target.files[0]));
                                    }
                                }}/>
                                {renderPreview ? (
                                    <div className="relative w-full h-full p-2">
                                        <img src={renderPreview} className="w-full h-full object-contain rounded-lg"/>
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold uppercase">Change Image</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-neutral-500">
                                        <Upload size={32} className="mb-2"/>
                                        <span className="text-xs font-bold uppercase">Click to Upload Render</span>
                                    </div>
                                )}
                            </label>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Student Notes</label>
                                    <textarea 
                                        value={studentNote}
                                        onChange={(e) => setStudentNote(e.target.value)}
                                        placeholder="Describe your process or challenges..."
                                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-[#de0443] focus:outline-none resize-none h-24"
                                    />
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!renderPreview || isSubmitting}
                                    className="w-full py-4 bg-[#de0443] hover:bg-[#b00335] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(222,4,67,0.3)]"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Send size={14}/> Submit for Review</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SCENARIO C: Pending State */}
                    {isPending && !selectedHistoryId && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 animate-pulse">
                                <Clock size={32}/>
                            </div>
                            <h3 className="text-white font-bold text-lg">Under Review</h3>
                            <p className="text-neutral-500 text-sm mt-2">Your instructor is currently reviewing your submission. You will be notified once a decision is made.</p>
                            <button onClick={() => setSelectedHistoryId(activeSubmission?.id || null)} className="mt-6 text-xs text-neutral-400 hover:text-white underline underline-offset-4">View Submitted Draft</button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
