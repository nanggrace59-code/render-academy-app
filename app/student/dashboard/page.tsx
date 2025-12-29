'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { 
  login, saveStudentReferences, getStudentSubmissions, submitAssignment, getAcademyGallery 
} from '@/services/api';
import { ImageSlider } from '@/components/ImageSlider';
import { Profile, Submission } from '@/types';
import { 
  Loader2, Home, Building, History, 
  Upload, CheckCircle, AlertCircle, Clock, 
  ChevronRight, Send, RefreshCw, X,
  LayoutGrid, MonitorPlay, Settings, LogOut,
  User // Added User Icon
} from 'lucide-react';

// --- WRAPPER ---
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

    if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#d90238]" size={32} /></div>;
    if (!user) return null;

    return (
        <div className="w-full h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-[#d90238] selection:text-white flex overflow-hidden">
            <StudentWorkspace user={user} setUser={setUser} />
        </div>
    );
}

// --- MAIN WORKSPACE LOGIC ---
function StudentWorkspace({ user, setUser }: { user: Profile, setUser: (u: Profile) => void }) {
    const router = useRouter();
    
    // Data State
    const [history, setHistory] = useState<Submission[]>([]);
    const [gallerySubmissions, setGallerySubmissions] = useState<Submission[]>([]);
    
    // UI State
    const [viewMode, setViewMode] = useState<'workspace' | 'gallery'>('workspace');
    const [context, setContext] = useState<'interior' | 'exterior'>('interior');
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);

    // Form State
    const [renderFile, setRenderFile] = useState<File | null>(null);
    const [renderPreview, setRenderPreview] = useState<string>('');
    const [studentNote, setStudentNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialization State
    const [refFiles, setRefFiles] = useState<{interior: File | null, exterior: File | null}>({ interior: null, exterior: null });
    const [refPreviews, setRefPreviews] = useState<{interior: string, exterior: string}>({ interior: '', exterior: '' });
    const [isInitSaving, setIsInitSaving] = useState(false);

    // --- CLASS NAME LOGIC (UPDATED) ---
    const isMasterClass = user.enrolled_class === 'master_class';
    const mainTitle = isMasterClass ? 'MASTER CLASS' : 'VISUALIZATION CLASS';
    // Change: Only show subtitle for Master Class. Visualization Class gets null.
    const subTitle = isMasterClass ? 'ARCHITECTURE MODELING' : null; 

    // Load Data
    useEffect(() => { 
        const loadData = async () => {
            if (viewMode === 'workspace') {
                const all = await getStudentSubmissions(user.id);
                const currentLevelSubs = all.filter(s => s.assignment_number === user.current_level)
                                            .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
                setHistory(currentLevelSubs);
                const latest = currentLevelSubs.length > 0 ? currentLevelSubs[currentLevelSubs.length - 1] : null;
                if (latest && latest.status !== 'rejected') {
                    setSelectedHistoryId(latest.id);
                } else {
                    setSelectedHistoryId(null); 
                }
            } else {
                const gal = await getAcademyGallery();
                setGallerySubmissions(gal);
            }
        };
        loadData(); 
    }, [user.id, user.current_level, viewMode]);

    // Helpers
    const handleResetReferences = async () => {
        if (confirm("Are you sure you want to reset your master references? This will reload the page.")) {
            setIsResetting(true);
            try {
                const { error } = await supabase.rpc('reset_student_references', { user_id: user.id });
                if (error) throw error;
                const updatedUser = { ...user, references: undefined };
                setUser(updatedUser); 
            } catch (error) {
                console.error("Error resetting references:", error);
                alert("Failed to reset references.");
            } finally {
                setIsResetting(false);
            }
        }
    };

    const handleRefChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'interior' | 'exterior') => {
        if(e.target.files?.[0]) {
            const f = e.target.files[0];
            setRefFiles(prev => ({...prev, [type]: f}));
            setRefPreviews(prev => ({...prev, [type]: URL.createObjectURL(f)}));
        }
    };

    const removeRef = (type: 'interior' | 'exterior') => {
        setRefFiles(prev => ({...prev, [type]: null}));
        setRefPreviews(prev => ({...prev, [type]: ''}));
    };

    const saveRefs = async () => {
        if(!refFiles.interior && !user.references?.interior) return;
        if(!refFiles.exterior && !user.references?.exterior) return;
        setIsInitSaving(true);
        try {
            await saveStudentReferences(user.id, refFiles.interior, refFiles.exterior);
            const updatedUser = { 
                ...user, 
                references: { interior: refPreviews.interior, exterior: refPreviews.exterior } 
            };
            setUser(updatedUser);
        } catch (error) {
            console.error(error);
            alert("Upload failed.");
        } finally {
            setIsInitSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!renderFile) return;
        setIsSubmitting(true);
        const refUrl = context === 'interior' ? user.references?.interior : user.references?.exterior;
        await submitAssignment(user.id, user.current_level, refUrl || '', renderFile, studentNote);
        const all = await getStudentSubmissions(user.id);
        const currentLevelSubs = all.filter(s => s.assignment_number === user.current_level)
                                    .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        setHistory(currentLevelSubs);
        setRenderFile(null);
        setRenderPreview('');
        setStudentNote('');
        setIsSubmitting(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('activeUserEmail'); 
        window.location.href = '/login';
    };

    // --- VARIABLES ---
    const latestSubmission = history.length > 0 ? history[history.length - 1] : null;
    const isLatestPending = latestSubmission?.status === 'pending';
    const isLatestApproved = latestSubmission?.status === 'approved';
    const isLatestRejected = latestSubmission?.status === 'rejected';
    const canUpload = !latestSubmission || isLatestRejected;
    const currentRefImage = context === 'interior' ? user.references?.interior : user.references?.exterior;
    let currentRenderImage = renderPreview;
    let viewStatus = 'DRAFT';
    if (selectedHistoryId) {
        const sub = history.find(h => h.id === selectedHistoryId);
        if (sub) {
            currentRenderImage = sub.render_image_url;
            viewStatus = sub.status.toUpperCase();
        }
    }

    // Check if initializing
    const needsInitialization = !user.references?.interior || !user.references?.exterior;

    return (
        <div className="flex w-full h-screen bg-[#050505] overflow-hidden">
            
            {/* -----------------------------------------------------------
                1. LEFT SIDEBAR
               ----------------------------------------------------------- */}
            {!needsInitialization && (
                // Changed py-6 to py-0 to control top alignment better
                <div className="w-20 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-0 shrink-0 z-50 animate-in fade-in slide-in-from-left-4 duration-500">
                    
                    {/* Top Branding - FIX ALIGNMENT */}
                    {/* Made this container h-20 (same as header) and centered content */}
                    <div className="h-20 flex items-center justify-center w-full mb-6">
                        <div className="w-10 h-10 bg-[#d90238] rounded-lg flex items-center justify-center font-black text-white text-[10px] tracking-tighter leading-none shadow-[0_0_15px_rgba(217,2,56,0.3)]">
                            RTA
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex flex-col gap-6 items-center w-full">
                        <button 
                            onClick={() => setViewMode('workspace')} 
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'workspace' ? 'bg-white text-black shadow-lg scale-105' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}`} 
                            title="Workspace"
                        >
                            <MonitorPlay size={20}/>
                        </button>

                        <button 
                            onClick={() => setViewMode('gallery')} 
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'gallery' ? 'bg-white text-black shadow-lg scale-105' : 'text-neutral-500 hover:bg-white/5 hover:text-white'}`} 
                            title="Gallery"
                        >
                            <LayoutGrid size={20}/>
                        </button>
                    </div>
                    
                    <div className="flex-1"></div>

                    {/* Bottom Icons - ADDED PROFILE ICON */}
                    <div className="flex flex-col gap-4 items-center mb-6">
                        {/* New Profile Icon */}
                        <button 
                            className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-neutral-500 hover:bg-white/5 hover:text-white transition-all" 
                            title="Profile / History"
                        >
                            <User size={20}/> 
                        </button>

                        {/* Settings Icon */}
                        <button 
                            onClick={handleResetReferences} 
                            disabled={isResetting}
                            className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-neutral-500 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50" 
                            title="Settings"
                        >
                            {isResetting ? <Loader2 className="animate-spin" size={16}/> : <Home size={16}/>} 
                        </button>
                        
                        {/* Logout Icon */}
                        <button onClick={handleLogout} className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-neutral-500 hover:bg-[#d90238] hover:border-[#d90238] hover:text-white transition-all" title="Logout">
                            <LogOut size={16}/>
                        </button>
                    </div>
                </div>
            )}

            {/* --- 2. MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col relative min-w-0">
                
                {/* HEADER */}
                <header className={`h-20 border-b border-white/5 bg-[#050505] flex items-center justify-between px-8 shrink-0 z-40 ${needsInitialization ? 'px-12' : ''}`}>
                     {/* LEFT: Class Info */}
                     <div className="flex items-center gap-4">
                        {needsInitialization && (
                            <div className="w-10 h-10 bg-[#d90238] rounded-lg flex items-center justify-center font-black text-white text-[10px] tracking-tighter leading-none shadow-[0_0_15px_rgba(217,2,56,0.3)] mr-2">
                                RTA
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter leading-none">{mainTitle}</h1>
                            {/* FIX: Only render subtitle if it exists (removes Visualization Foundation) */}
                            {subTitle && (
                                <p className="text-[10px] text-[#d90238] font-bold uppercase tracking-[0.2em] mt-1">{subTitle}</p>
                            )}
                        </div>
                     </div>

                     {/* RIGHT: Logout button (Only during Initialization) */}
                     {needsInitialization && (
                        <button onClick={handleLogout} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:bg-white/5">
                            <LogOut size={14}/> LOGOUT
                        </button>
                     )}
                </header>

                {/* --- BODY CONTENT --- */}
                <div className="flex-1 flex overflow-hidden relative">
                    
                    {/* A. INITIALIZATION SCREEN CONTENT */}
                    {needsInitialization ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#050505] animate-in fade-in zoom-in-95 duration-500">
                            <div className="max-w-4xl w-full text-center space-y-10">
                                <div>
                                    <span className="text-[#d90238] text-[10px] font-bold tracking-[0.3em] uppercase border border-[#d90238]/30 px-4 py-1.5 rounded-full bg-[#d90238]/5 shadow-[0_0_15px_rgba(217,2,56,0.1)]">Project Initialization</span>
                                    <h1 className="text-5xl font-black text-white mt-6 mb-2 tracking-tight">Upload Master References</h1>
                                    <p className="text-neutral-500 text-sm">These will serve as the ground truth for all future assignments.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    {['interior', 'exterior'].map((type) => (
                                        <div key={type} className="group relative aspect-video bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-[#d90238]/50 transition-all cursor-pointer shadow-2xl">
                                            {!(type === 'interior' ? refPreviews.interior : refPreviews.exterior) && (
                                                <input type="file" accept="image/*" onChange={(e) => handleRefChange(e, type as any)} className="absolute inset-0 z-20 opacity-0 cursor-pointer" />
                                            )}
                                            {(type === 'interior' ? refPreviews.interior : refPreviews.exterior) ? (
                                                <>
                                                    <img src={type === 'interior' ? refPreviews.interior : refPreviews.exterior} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                                                    <button onClick={() => removeRef(type as any)} className="absolute top-3 right-3 z-30 w-8 h-8 bg-black/50 backdrop-blur hover:bg-[#d90238] rounded-full flex items-center justify-center text-white transition-colors"><X size={14}/></button>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 group-hover:text-white transition-colors">CLICK TO UPLOAD {type}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-center pt-4">
                                    <button onClick={saveRefs} disabled={isInitSaving || (!refPreviews.interior || !refPreviews.exterior)} className="bg-[#d90238] hover:bg-[#b0022d] text-white px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-xs w-full max-w-md disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,2,56,0.2)] hover:shadow-[0_0_30px_rgba(217,2,56,0.4)]">
                                        {isInitSaving ? 'INITIALIZING...' : 'INITIALIZE PROJECT'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                    /* B. MAIN DASHBOARD CONTENT */
                        viewMode === 'workspace' ? (
                            <>
                                {/* VISUAL AREA */}
                                <div className="flex-1 flex flex-col bg-[#020202] relative min-w-0 items-center justify-center p-6">
                                    <div className="w-full h-full max-h-full aspect-video bg-black relative border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                                        {currentRefImage && currentRenderImage ? (
                                            <ImageSlider referenceImage={currentRefImage} renderImage={currentRenderImage} className="w-full h-full"/>
                                        ) : currentRefImage ? (
                                            <div className="w-full h-full relative group flex items-center justify-center">
                                                 <img src={currentRefImage} className="w-full h-full object-contain opacity-50 grayscale transition-all duration-700"/>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center opacity-20"><p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Select Context</p></div>
                                        )}

                                        <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
                                            <div className={`px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-2 ${viewStatus === 'PENDING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : viewStatus === 'REJECTED' ? 'bg-[#d90238]/10 border-[#d90238]/30 text-[#d90238]' : viewStatus === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/10 text-neutral-400'}`}>
                                                {viewStatus === 'PENDING' && <Clock size={14}/>}
                                                {viewStatus === 'REJECTED' && <AlertCircle size={14}/>}
                                                {viewStatus === 'APPROVED' && <CheckCircle size={14}/>}
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{viewStatus} STATE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT SIDEBAR (Tools) */}
                                <div className="w-[400px] bg-[#0a0a0a] border-l border-white/5 flex flex-col shrink-0 z-40 shadow-2xl">
                                    <div className="p-6 border-b border-white/5 bg-[#0a0a0a]">
                                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">Submission Context</h3>
                                        <div className="flex bg-[#111] rounded-lg p-1 border border-white/5">
                                            <button onClick={() => setContext('interior')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${context === 'interior' ? 'bg-[#d90238] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}><Home size={12}/> Interior</button>
                                            <button onClick={() => setContext('exterior')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${context === 'exterior' ? 'bg-[#d90238] text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}><Building size={12}/> Exterior</button>
                                        </div>
                                    </div>

                                    <div className="p-6 border-b border-white/5">
                                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={12}/> Timeline</h3>
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                            {history.map((sub, idx) => (
                                                <button key={sub.id} onClick={() => setSelectedHistoryId(sub.id)} className={`flex flex-col items-center gap-2 group min-w-[60px] cursor-pointer transition-opacity ${selectedHistoryId && selectedHistoryId !== sub.id ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}>
                                                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${selectedHistoryId === sub.id ? 'bg-white text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : sub.status === 'rejected' ? 'border-[#d90238] text-[#d90238] bg-[#d90238]/10' : sub.status === 'approved' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-amber-500 text-amber-500 bg-amber-500/10'}`}>v{idx + 1}</div>
                                                </button>
                                            ))}
                                            {canUpload && (
                                                <button onClick={() => setSelectedHistoryId(null)} className={`flex flex-col items-center gap-2 group min-w-[60px] cursor-pointer transition-opacity ${selectedHistoryId !== null ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}>
                                                    <div className={`w-10 h-10 rounded-full border border-dashed border-neutral-700 flex items-center justify-center text-neutral-500 transition-all ${selectedHistoryId === null ? 'border-[#d90238] text-[#d90238] bg-[#d90238]/10' : 'hover:border-neutral-500 hover:text-white'}`}><Upload size={14}/></div>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-[#0a0a0a]">
                                        {selectedHistoryId ? (
                                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                                {history.find(h => h.id === selectedHistoryId)?.teacher_comment && (
                                                    <div className="bg-[#d90238]/10 border border-[#d90238]/20 p-4 rounded-xl">
                                                        <h4 className="text-[#d90238] text-xs font-bold uppercase mb-2 flex items-center gap-2"><AlertCircle size={14}/> Instructor Feedback</h4>
                                                        <p className="text-neutral-300 text-sm leading-relaxed font-medium">"{history.find(h => h.id === selectedHistoryId)?.teacher_comment}"</p>
                                                    </div>
                                                )}
                                                <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                                    <h4 className="text-neutral-500 text-[10px] font-bold uppercase mb-2">Student Note</h4>
                                                    <p className="text-neutral-400 text-sm italic">"{history.find(h => h.id === selectedHistoryId)?.student_message || 'No notes added.'}"</p>
                                                </div>
                                                {isLatestRejected && selectedHistoryId === latestSubmission?.id && (
                                                    <button onClick={() => setSelectedHistoryId(null)} className="w-full py-4 bg-[#d90238] hover:bg-[#b0022d] text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">Start Revision (v{history.length + 1}) <ChevronRight size={14}/></button>
                                                )}
                                            </div>
                                        ) : !canUpload && isLatestPending ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-amber-500/20 bg-amber-500/5 rounded-xl">
                                                <Clock size={32} className="text-amber-500 mb-4 animate-pulse"/>
                                                <h3 className="text-white font-bold text-lg">Under Review</h3>
                                                <p className="text-neutral-500 text-sm mt-2 leading-relaxed">Your instructor is reviewing your submission.</p>
                                            </div>
                                        ) : !canUpload && isLatestApproved ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                                                <CheckCircle size={32} className="text-emerald-500 mb-4"/>
                                                <h3 className="text-white font-bold text-lg">Approved</h3>
                                                <p className="text-neutral-500 text-sm mt-2 leading-relaxed">You have passed this protocol.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full animate-in slide-in-from-right-4">
                                                <h3 className="text-white text-lg font-bold mb-1">Submit Render</h3>
                                                <p className="text-neutral-500 text-xs mb-6">Upload your {context} render for review.</p>
                                                <label className={`flex-1 min-h-[150px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all mb-6 relative group ${renderPreview ? 'border-[#d90238] bg-[#d90238]/5' : 'border-white/10 hover:border-[#d90238]/50 hover:bg-white/5'}`}>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) { setRenderFile(e.target.files[0]); setRenderPreview(URL.createObjectURL(e.target.files[0])); }}}/>
                                                    {renderPreview ? (
                                                        <div className="relative w-full h-full p-2"><img src={renderPreview} className="w-full h-full object-contain rounded-lg"/><div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm"><span className="text-white text-xs font-bold uppercase flex items-center gap-2"><RefreshCw size={14}/> Change Image</span></div></div>
                                                    ) : (
                                                        <div className="flex flex-col items-center text-neutral-500 group-hover:text-white transition-colors"><div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[#d90238] transition-colors"><Upload size={20}/></div><span className="text-xs font-bold uppercase tracking-widest">Click to Upload</span></div>
                                                    )}
                                                </label>
                                                <div className="space-y-4">
                                                    <textarea value={studentNote} onChange={(e) => setStudentNote(e.target.value)} placeholder="Notes..." className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#d90238] focus:outline-none resize-none h-20 placeholder:text-neutral-700"/>
                                                    <button onClick={handleSubmit} disabled={!renderPreview || isSubmitting} className="w-full py-4 bg-[#d90238] hover:bg-[#b0022d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,2,56,0.3)] hover:shadow-[0_0_30px_rgba(217,2,56,0.5)]">{isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Send size={14}/> Submit</>}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 bg-[#020202] p-8 overflow-y-auto animate-in fade-in">
                                <div className="mb-8">
                                    <h1 className="text-3xl font-black text-white tracking-tight">Academy Gallery</h1>
                                    <p className="text-neutral-500 text-sm mt-2">Explore approved submissions from fellow students.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {gallerySubmissions.map(sub => (
                                        <div key={sub.id} className="aspect-square bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden relative group cursor-pointer hover:border-[#d90238]/50 transition-all">
                                            <img src={sub.render_image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"/>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                                <p className="text-white font-bold text-sm">Assignment {String(sub.assignment_number).padStart(2,'0')}</p>
                                                <p className="text-[10px] text-[#d90238] font-mono uppercase tracking-widest">Approved Work</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
