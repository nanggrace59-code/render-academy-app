'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { 
  BookOpen, Clock, ChevronRight, LayoutGrid, 
  ArrowLeft, LogOut, Loader2
} from 'lucide-react';

export default function TeacherDashboard() {
    const router = useRouter();
    const [selectedClass, setSelectedClass] = useState<string | null>(null); 
    const [stats, setStats] = useState({ pending: 0, students: 0 });
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            // 1. Get Stats
            const { count: pendingCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'teacher');
            setStats({ pending: pendingCount || 0, students: studentCount || 0 });

            // 2. Fetch ALL Submissions
            const { data: subs } = await supabase
                .from('submissions')
                .select(`*, profiles:user_id (full_name, email, enrolled_class, current_level)`)
                .order('created_at', { ascending: false });

            if (subs) {
                console.log("Raw Submissions Data:", subs); // For Debugging
                setSubmissions(subs);
            }
            setLoading(false);
        };
        loadDashboard();
    }, []);

    // --- FIX: ROBUST FILTERING ---
    const filteredSubmissions = submissions.filter(sub => {
        if (!selectedClass) return false;
        
        // Get student class and convert to lowercase for easy matching
        const studentClass = (sub.profiles?.enrolled_class || '').toLowerCase();
        
        // Logic: If user selects Master Class, show anything related to 'master', 'arch', or even empty class names (fallback)
        if (selectedClass === 'master_class') {
            return studentClass.includes('master') || studentClass.includes('arch') || studentClass === ''; 
        }
        if (selectedClass === 'visualization_class') {
            return studentClass.includes('vis') || studentClass.includes('render');
        }
        return false;
    });

    const handleReviewClick = (submissionId: string) => {
        router.push(`/teacher/review/${submissionId}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('activeUserEmail');
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black tracking-tight">Teacher Dashboard</h1>
                    {selectedClass && (
                        <span className="text-[10px] font-bold text-neutral-500 border-l border-white/10 pl-4 uppercase tracking-widest">
                            {selectedClass === 'master_class' ? 'Master Class' : 'Visualization'}
                        </span>
                    )}
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/5"><LogOut size={14}/> Logout</button>
            </header>

            <div className="flex-1 p-8 w-full flex flex-col items-center">
                
                {!selectedClass ? (
                    // 1. CLASS SELECTION VIEW
                    <div className="w-full max-w-4xl flex flex-col gap-8 animate-in fade-in">
                        <div className="text-center space-y-2 mb-4">
                            <h2 className="text-2xl font-bold text-white">Select Class</h2>
                            <p className="text-neutral-500 text-sm">Manage student submissions and progress.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button onClick={() => setSelectedClass('master_class')} className="group bg-[#0a0a0a] border border-white/10 rounded-xl p-6 text-left hover:border-[#d90238] transition-all hover:bg-[#d90238]/5 flex items-center gap-6">
                                <div className="w-16 h-16 bg-[#d90238]/10 rounded-lg flex shrink-0 items-center justify-center text-[#d90238] group-hover:scale-105 transition-transform">
                                    <LayoutGrid size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">MASTER CLASS</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-1">Architecture Modeling</p>
                                    <span className="text-[10px] text-[#d90238] font-bold mt-2 block group-hover:underline">View Submissions &rarr;</span>
                                </div>
                            </button>

                            <button onClick={() => setSelectedClass('visualization_class')} className="group bg-[#0a0a0a] border border-white/10 rounded-xl p-6 text-left hover:border-[#d90238] transition-all hover:bg-[#d90238]/5 flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/5 rounded-lg flex shrink-0 items-center justify-center text-white group-hover:scale-105 transition-transform">
                                    <BookOpen size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">VISUALIZATION</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-1">Rendering & Lighting</p>
                                    <span className="text-[10px] text-white font-bold mt-2 block group-hover:underline">View Submissions &rarr;</span>
                                </div>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-white/5 flex items-center justify-between">
                                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Pending Reviews</span>
                                <span className="text-2xl font-black text-[#d90238]">{stats.pending}</span>
                            </div>
                            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-white/5 flex items-center justify-between">
                                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Students</span>
                                <span className="text-2xl font-black text-white">{stats.students}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    // 2. SUBMISSION LIST VIEW
                    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-right-8">
                        <button 
                            onClick={() => setSelectedClass(null)}
                            className="flex items-center gap-2 text-neutral-500 hover:text-white mb-6 transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft size={16}/> Back to Classes
                        </button>

                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden min-h-[400px]">
                            <div className="p-4 border-b border-white/10 bg-[#0f0f0f] flex justify-between items-center">
                                <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                                    {selectedClass === 'master_class' ? 'Master Class' : 'Visualization'} Queue
                                </h2>
                                <span className="bg-white/10 text-[10px] px-2 py-1 rounded text-white">{filteredSubmissions.length} Items</span>
                            </div>

                            {loading ? (
                                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-neutral-500"/></div>
                            ) : filteredSubmissions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-neutral-500 text-sm">No submissions found for this class.</p>
                                    {/* DEBUGGING HELP: Show total submissions to confirm connection exists */}
                                    <p className="text-neutral-700 text-[10px] mt-2">
                                        (System Check: Connected. Found {submissions.length} total submissions in database)
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {filteredSubmissions.map((sub) => (
                                        <div 
                                            key={sub.id} 
                                            onClick={() => handleReviewClick(sub.id)}
                                            className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
                                                    {sub.profiles?.full_name?.[0]?.toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm group-hover:text-[#d90238] transition-colors">
                                                        {sub.profiles?.full_name || 'Unknown Student'}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-neutral-500">{sub.profiles?.email}</span>
                                                        <span className="text-[10px] bg-white/10 text-neutral-300 px-1.5 rounded">
                                                            LVL {sub.assignment_number}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                                                    sub.status === 'pending' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                                                    sub.status === 'approved' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                                                    'border-[#d90238]/30 text-[#d90238] bg-[#d90238]/5'
                                                }`}>
                                                    {sub.status === 'pending' && <Clock size={12} className="animate-pulse"/>}
                                                    {sub.status}
                                                </div>
                                                <ChevronRight size={16} className="text-neutral-600 group-hover:text-white"/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
