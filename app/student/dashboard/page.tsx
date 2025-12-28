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
  LayoutGrid, MonitorPlay, Settings, LogOut
} from 'lucide-react';

// --- WRAPPER FOR AUTHENTICATION & HEADER ---
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

    const isMasterClass = user.enrolled_class === 'master_class';
    const mainTitle = isMasterClass ? 'MASTER CLASS' : 'VISUALIZATION CLASS';
    const subTitle = isMasterClass ? 'ARCHITECTURE MODELING' : 'VISUALIZATION FOUNDATIONS';

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-[#d90238] selection:text-white overflow-hidden flex flex-col">
            {/* --- GLOBAL HEADER (CLEANEST VERSION) --- */}
            <header className="h-20 border-b border-white/5 bg-[#050505] flex items-center justify-between px-8 shrink-0 z-50">
                 {/* LEFT: Just Text info (NO RED BOX HERE) */}
                 <div>
                    <h1 className="text-xl font-black text-white tracking-tighter leading-none">{mainTitle}</h1>
                    <p className="text-[10px] text-[#d90238] font-bold uppercase tracking-[0.2em] mt-1">{subTitle}</p>
                 </div>
                 {/* RIGHT: Empty (Clean) */}
            </header>
            
            {/* Main Content Injector */}
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

    useEffect(() => { loadData(); }, [user.id, user.current_level, viewMode]);

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

    // --- RESET REFERENCES ("Go Back") ---
    const handleResetReferences = async () => {
        if (confirm("Are you sure you want to reset your master references?")) {
            setIsResetting(true);
            try {
                // 1. Delete from DB
                const { error } = await supabase.rpc('reset_student_references', { user_id: user.id });
                if (error) throw error;
                
                // 2. INSTANT UI UPDATE (Fixes Freeze)
                const updatedUser = { 
                    ...user, 
                    references: undefined 
                };
                setUser(updatedUser); 

            } catch (error) {
                console.error("Error resetting references:", error);
                alert("Failed to reset references.");
            } finally {
                setIsResetting(false);
            }
        }
    };


    // --- 1. INITIALIZATION CHECK (Clean UI) ---
    if (!user.references?.interior || !user.references?.exterior) {
        
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
                // 1. Save to DB
                await saveStudentReferences(user.id, refFiles.interior, refFiles.exterior);
                
                // 2. Fetch fresh data
                const updatedProfile = await login(user.email);
                
                // 3. INSTANT UI UPDATE (Fixes Freeze)
                if (updatedProfile) {
                    setUser(updatedProfile); 
                }
            } catch (error) {
                console.error(error);
                alert("Upload failed. Please try again.");
            } finally {
                setIsInitSaving(false);
            }
        }

        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 bg-[#050505] pb-32">
                <div className="max-w-4xl w-full text-center space-y-10">
                     <div>
                        <span className="text-[#d90238] text-[10px] font-bold tracking-[0.3em] uppercase border border-[#d90238]/30 px-4 py-1.5 rounded-full bg-[#d90238]/5 shadow-[0_0_15px_rgba(217,2,56,0.1)]">Project Initialization</span>
                        <h1 className="text-5xl font-black text-white mt-6 mb-2 tracking-tight">Upload Master References</h1>
                        <p className="text-neutral-500 text-sm">These will serve as the ground truth for all future assignments.</p>
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        {['interior', 'exterior'].map((type) => {
                            const preview = type === 'interior' ? refPreviews.interior : refPreviews.exterior;
                            return (
                                <div key={type} className="group relative aspect-video bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-[#d90238]/50 transition-all shadow-2xl cursor-pointer">
                                    {!preview && (
                                        <input type="file" accept="image/*" onChange={(e) => handleRefChange(e, type as any)} className="absolute inset-0 z-20 opacity-0 cursor-pointer" />
                                    )}
                                    {preview ? (
                                        <>
                                            <img src={preview} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                                            <button onClick={() => removeRef(type as any)} className="absolute top-3 right-3 z-30 w-8 h-8 bg-black/50 backdrop-blur hover:bg-[#d90238] rounded-full flex items-center justify-center text-white transition-colors"><X size={14}/></button>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 group-hover:text-white transition-colors">CLICK TO UPLOAD {type}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                     </div>
                     <div className="flex justify-center pt-4">
                        <button onClick={saveRefs} disabled={isInitSaving || (!refPreviews.interior || !refPreviews.exterior)} className="bg-[#d90238] hover:bg-[#b0022d] text-white px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all w-full max-w-md disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(217,2,56,0.2)] hover:shadow-[0_0_30px_rgba(217,2,56,0.4)]">
                            {isInitSaving ? 'INITIALIZING PROTOCOL...' : 'INITIALIZE PROJECT'}
                        </button>
                     </div>
                </div>
            </div>
        )
    }

    // --- 2. MAIN DASHBOARD LOGIC ---
    const latestSubmission = history.length > 0 ? history[history.length - 1] : null;
    const isLatestPending = latestSubmission?.status === 'pending';
    const isLatestApproved = latestSubmission?.status === 'approved';
    const isLatestRejected = latestSubmission?.status === 'rejected';
    const canUpload = !latestSubmission || isLatestRejected;

    const currentRefImage = context === 'interior' ? user.references.interior : user.references.exterior;
    let currentRenderImage = renderPreview;
    let viewStatus = 'DRAFT';

    if (selectedHistoryId) {
        const sub = history.find(h => h.id === selectedHistoryId);
        if (sub) {
            currentRenderImage = sub.render_image_url;
            viewStatus = sub.status.toUpperCase();
        }
    } else {
        viewStatus = 'DRAFT';
    }

    const handleSubmit = async () => {
        if (!renderFile) return;
        setIsSubmitting(true);
        const refUrl = context === 'interior' ? user.references?.interior : user.references?.exterior;
        await submitAssignment(user.id, user.current_level, refUrl || '', renderFile, studentNote);
        await loadData();
        setRenderFile(null);
        setRenderPreview('');
        setStudentNote('');
        setIsSubmitting(false);
    };

    return (
        <div className="flex-1 flex overflow-
