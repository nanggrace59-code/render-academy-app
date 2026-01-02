'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { 
  LayoutGrid, BookOpen, LogOut, Loader2, 
  ArrowLeft, Clock, ChevronRight 
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

            // 2. Fetch ALL submissions (Fixing the "No data" issue)
            const { data: subs } = await supabase
                .from('submissions')
                .select(`*, profiles:user_id (full_name, email, enrolled_class, current_level)`)
                .order('created_at', { ascending: false });

            if (subs) setSubmissions(subs);
            setLoading(false);
        };
        loadDashboard();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('activeUserEmail');
        router.push('/login');
    };

    // Filter Logic: Matches "Master Class", "master_class", etc.
    const filteredSubmissions = submissions.filter(sub => {
        if (!selectedClass) return false;
        const studentClass = (sub.profiles?.enrolled_class || '').toLowerCase();
        
        if (selectedClass === 'master_class') {
            return studentClass.includes('master') || studentClass.includes('arch') || studentClass === '';
        }
        if (selectedClass === 'visualization_class') {
            return studentClass.includes('vis') || studentClass.includes('render');
        }
        return false;
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black tracking-tight">Teacher Dashboard</h1>
                    {selectedClass && (
                        <span className="text-[10px] font-bold text-neutral-500 border-l border-white/10 pl-4 uppercase tracking-widest hidden sm:block">
                            {selectedClass === 'master_class' ? 'Master Class' : 'Visualization'} Management
                        </span>
                    )}
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full hover:bg-white/5">
                    <LogOut size={14}/> Logout
                </button>
            </header>

            {/* Content Body */}
            <div className="flex-1 p-8 w-full flex flex-col items-center">
                {!selectedClass ? (
                    // VIEW 1: CLASS SELECTION CARDS
                    <div className="w-full max-w-4xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center space-y-2 mb-4">
                            <h2 className="text-2xl font-bold text-white">Select a Class</h2>
                            <p className="text-neutral-500 text-sm">You have <span className="text-[#d90238] font-bold">{stats.pending} pending reviews</span> waiting.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Master Class Card */}
                            <button onClick={() => setSelectedClass('master_class')} className="group bg-[#0a0a0a] border border-white/10 rounded-xl p-8 text-left hover:border-[#d90238] transition-all hover:bg-[#d90238]/5 flex items-center gap-6">
                                <div className="w-16 h-16 bg-[#d90238]/10 rounded-lg flex shrink-0 items-center justify-center text-[#d90238] group-hover:scale-110 transition-transform">
                                    <LayoutGrid size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">MASTER CLASS</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-1">Architecture Modeling</p>
                                    <div className="mt-4 text-[#d90238] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                        View Submissions <ChevronRight size={12}/>
                                    </div>
                                </div>
                            </button>

                            {/* Visualization Class Card */}
                            <button onClick={() => setSelectedClass('visualization_class')} className="group bg-[#0a0a0a] border border-white/10 rounded-xl p-8 text-left hover:border-[#d90238] transition-all hover:bg-[#d90238]/5 flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/5 rounded-lg flex shrink-0 items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <BookOpen size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">VISUALIZATION</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-1">Rendering & Lighting</p>
                                    <div className="mt-4 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                        View Submissions <ChevronRight size={12}/>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    // VIEW 2: SUBMISSION LIST
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
                                <div className="p-12 text-center text-neutral-500 text-sm">
                                    No submissions found.
                                    <p className="text-[10px] text-neutral-700 mt-2">(Debug: Total submissions in DB: {submissions.length})</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {filteredSubmissions.map((sub) => (
                                        <div 
                                            key={sub.id} 
                                            onClick={() => router.push(`/teacher/review/${sub.id}`)}
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
