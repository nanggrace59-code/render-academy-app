'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { 
  Users, BookOpen, Bell, Search, 
  CheckCircle, Clock, AlertCircle, ChevronRight, User
} from 'lucide-react';

export default function TeacherDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ pending: 0, students: 0 });
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            // 1. Get Stats
            const { count: pendingCount } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: studentCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .neq('role', 'teacher');

            setStats({ pending: pendingCount || 0, students: studentCount || 0 });

            // 2. Get Recent Submissions with Student Profiles
            const { data: subs, error } = await supabase
                .from('submissions')
                .select(`
                    *,
                    profiles:user_id (full_name, email, current_level)
                `)
                .order('created_at', { ascending: false });

            if (subs) setSubmissions(subs);
            setLoading(false);
        };

        loadDashboard();
    }, []);

    // --- NAVIGATION HANDLER ---
    const handleReviewClick = (submissionId: string) => {
        // This links directly to the folder we created: app/teacher/review/[id]
        router.push(`/teacher/review/${submissionId}`);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d90238] selection:text-white">
            
            {/* Header */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a]">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Teacher Dashboard</h1>
                    <div className="flex gap-4 text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-widest">
                        <span>Manage</span>
                        <span>Student</span>
                        <span>Progress</span>
                    </div>
                </div>
            </header>

            <div className="p-8 max-w-7xl mx-auto space-y-12">
                
                {/* Stats Row */}
                <div className="flex gap-8 border-b border-white/10 pb-12">
                    <div className="flex-1 bg-[#0a0a0a] border border-white/10 p-6 rounded-none border-l-4 border-l-[#d90238]">
                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Pending Reviews</h3>
                        <p className="text-5xl font-black text-[#d90238]">{stats.pending}</p>
                    </div>
                    <div className="flex-1 bg-[#0a0a0a] border border-white/10 p-6 rounded-none border-l-4 border-l-white/20">
                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Class Enrollment</h3>
                        <p className="text-5xl font-black text-white">{stats.students}</p>
                    </div>
                </div>

                {/* Student Roster / Submission List */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Student Submissions</h2>
                        <Search className="text-neutral-600" size={18}/>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10">
                        {loading ? (
                            <div className="p-8 text-center text-neutral-500 text-xs uppercase tracking-widest">Loading Data...</div>
                        ) : submissions.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-xs uppercase tracking-widest">No submissions found.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {submissions.map((sub) => (
                                    <div 
                                        key={sub.id} 
                                        onClick={() => handleReviewClick(sub.id)}
                                        className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500">
                                                <User size={18}/>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white group-hover:text-[#d90238] transition-colors">
                                                    {sub.profiles?.full_name || 'Unknown Student'}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded">LVL {sub.assignment_number}</span>
                                                    <span className="text-[10px] text-neutral-600">{sub.profiles?.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                                                sub.status === 'pending' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' :
                                                sub.status === 'approved' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' :
                                                'border-[#d90238]/30 text-[#d90238] bg-[#d90238]/10'
                                            }`}>
                                                {sub.status === 'pending' && <Clock size={12}/>}
                                                {sub.status === 'approved' && <CheckCircle size={12}/>}
                                                {sub.status === 'rejected' && <AlertCircle size={12}/>}
                                                {sub.status}
                                            </div>
                                            <ChevronRight size={16} className="text-neutral-600 group-hover:text-white transition-colors"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
