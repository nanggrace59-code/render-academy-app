'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { 
  Users, BookOpen, Bell, Search, 
  CheckCircle, Clock, AlertCircle, ChevronRight, User,
  LayoutGrid, ArrowLeft
} from 'lucide-react';

export default function TeacherDashboard() {
    const router = useRouter();
    const [selectedClass, setSelectedClass] = useState<string | null>(null); // 'master_class' or 'visualization_class'
    const [stats, setStats] = useState({ pending: 0, students: 0 });
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            // 1. Get Stats (Overall)
            const { count: pendingCount } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: studentCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .neq('role', 'teacher');

            setStats({ pending: pendingCount || 0, students: studentCount || 0 });

            // 2. Get All Submissions with Profile Data
            // We fetch everything first, then filter by class in the UI
            const { data: subs, error } = await supabase
                .from('submissions')
                .select(`
                    *,
                    profiles:user_id (full_name, email, enrolled_class, current_level)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error loading submissions:", error);
            } else {
                setSubmissions(subs || []);
            }
            setLoading(false);
        };

        loadDashboard();
    }, []);

    // Filter submissions based on the selected class
    const filteredSubmissions = submissions.filter(sub => 
        sub.profiles?.enrolled_class === selectedClass
    );

    const handleReviewClick = (submissionId: string) => {
        router.push(`/teacher/review/${submissionId}`);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d90238] selection:text-white flex flex-col">
            
            {/* Header */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a] shrink-0">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Teacher Dashboard</h1>
                    <div className="flex gap-4 text-[10px] font-bold text-neutral-500 mt-1 uppercase tracking-widest">
                        <span>{selectedClass ? selectedClass.replace('_', ' ') : 'Select Class'}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
                
                {/* STATE 1: CLASS SELECTION (If no class is selected) */}
                {!selectedClass ? (
                    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Select a Class to Manage</h2>
                            <p className="text-neutral-500 text-sm">Choose a course to view student submissions and progress.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card 1: Master Class */}
                            <button 
                                onClick={() => setSelectedClass('master_class')}
                                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-left hover:border-[#d90238] transition-all hover:bg-[#d90238]/5"
                            >
                                <div className="mb-6 w-14 h-14 bg-[#d90238]/10 rounded-full flex items-center justify-center text-[#d90238] group-hover:scale-110 transition-transform">
                                    <LayoutGrid size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">MASTER CLASS</h3>
                                <p className="text-sm text-neutral-500 font-mono uppercase tracking-widest">Architecture Modeling</p>
                                <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-600 group-hover:text-white">
                                    View Students <ChevronRight size={14}/>
                                </div>
                            </button>

                            {/* Card 2: Visualization Class */}
                            <button 
                                onClick={() => setSelectedClass('visualization_class')}
                                className="group relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-left hover:border-[#d90238] transition-all hover:bg-[#d90238]/5"
                            >
                                <div className="mb-6 w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">VISUALIZATION</h3>
                                <p className="text-sm text-neutral-500 font-mono uppercase tracking-widest">Rendering & Lighting</p>
                                <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-600 group-hover:text-white">
                                    View Students <ChevronRight size={14}/>
                                </div>
                            </button>
                        </div>

                        {/* Stats Row (Always Visible for Overview) */}
                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                            <div className="bg-[#0f0f0f] p-6 rounded-lg border-l-4 border-[#d90238]">
                                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Pending Reviews</span>
                                <p className="text-4xl font-black text-white mt-2">{stats.pending}</p>
                            </div>
                            <div className="bg-[#0f0f0f] p-6 rounded-lg border-l-4 border-neutral-700">
                                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total Students</span>
                                <p className="text-4xl font-black text-white mt-2">{stats.students}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // STATE 2: STUDENT LIST (If a class is selected)
                    <div className="animate-in fade-in slide-in-from-right-8">
                        {/* Back Button */}
                        <button 
                            onClick={() => setSelectedClass(null)}
                            className="flex items-center gap-2 text-neutral-500 hover:text-white mb-8 transition-colors text-xs font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft size={16}/> Back to Classes
                        </button>

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                {selectedClass === 'master_class' ? 'Master Class Submissions' : 'Visualization Class Submissions'}
                                <span className="bg-white/10 text-xs px-2 py-1 rounded-full text-neutral-300">{filteredSubmissions.length}</span>
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={16}/>
                                <input type="text" placeholder="Search student..." className="bg-[#0a0a0a] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-[#d90238] focus:outline-none w-64"/>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-neutral-500 text-xs uppercase tracking-widest flex flex-col items-center gap-4">
                                    <div className="w-6 h-6 border-2 border-[#d90238] border-t-transparent rounded-full animate-spin"></div>
                                    Loading Submissions...
                                </div>
                            ) : filteredSubmissions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-neutral-600 mx-auto mb-4">
                                        <BookOpen size={24}/>
                                    </div>
                                    <p className="text-neutral-400 font-bold">No submissions found for this class.</p>
                                    <p className="text-neutral-600 text-xs mt-2">Wait for students to upload their work.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {filteredSubmissions.map((sub) => (
                                        <div 
                                            key={sub.id} 
                                            onClick={() => handleReviewClick(sub.id)}
                                            className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center text-neutral-400 font-black text-lg">
                                                    {sub.profiles?.full_name?.[0]?.toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg group-hover:text-[#d90238] transition-colors">
                                                        {sub.profiles?.full_name || 'Unknown Student'}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold bg-white/10 text-neutral-300 px-2 py-0.5 rounded uppercase tracking-widest">
                                                            Assignment {sub.assignment_number}
                                                        </span>
                                                        <span className="text-[10px] text-neutral-600">{sub.profiles?.email}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Submitted</p>
                                                    <p className="text-xs text-neutral-300 font-mono mt-1">{new Date(sub.created_at).toLocaleDateString()}</p>
                                                </div>

                                                <div className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 min-w-[120px] justify-center ${
                                                    sub.status === 'pending' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                                                    sub.status === 'approved' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                                                    'border-[#d90238]/30 text-[#d90238] bg-[#d90238]/5'
                                                }`}>
                                                    {sub.status === 'pending' && <Clock size={14} className="animate-pulse"/>}
                                                    {sub.status === 'approved' && <CheckCircle size={14}/>}
                                                    {sub.status === 'rejected' && <AlertCircle size={14}/>}
                                                    {sub.status}
                                                </div>
                                                
                                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-neutral-500 group-hover:bg-[#d90238] group-hover:border-[#d90238] group-hover:text-white transition-all">
                                                    <ChevronRight size={16}/>
                                                </div>
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
