'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import { 
  BookOpen, Bell, Search, 
  CheckCircle, Clock, AlertCircle, ChevronRight, User,
  LayoutGrid, ArrowLeft, LogOut, Loader2
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
            const { count: pendingCount } = await supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: studentCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .neq('role', 'teacher');

            setStats({ pending: pendingCount || 0, students: studentCount || 0 });

            // 2. Get All Submissions
            const { data: subs, error } = await supabase
                .from('submissions')
                .select(`
                    *,
                    profiles:user_id (full_name, email, enrolled_class, current_level)
                `)
                .order('created_at', { ascending: false });

            if (error) console.error("Error loading submissions:", error);
            else setSubmissions(subs || []);
            
            setLoading(false);
        };

        loadDashboard();
    }, []);

    // --- ROBUST FILTERING ---
    // This checks if the class name contains "master" or "vis" to handle small spelling differences
    const filteredSubmissions = submissions.filter(sub => {
        const studentClass = sub.profiles?.enrolled_class?.toLowerCase() || '';
        if (selectedClass === 'master_class') {
            return studentClass.includes('master');
        } else if (selectedClass === 'visualization_class') {
            return studentClass.includes('vis');
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
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d90238] selection:text-white flex flex-col">
            
            {/* Header with Logout */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a] shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black tracking-tight">Teacher Dashboard</h1>
                    {selectedClass && (
                        <span className="text-[10px] font-bold text-neutral-500 border-l border-white/10 pl-4 uppercase tracking-widest">
                            {selectedClass === 'master_class' ? 'Master Class' : 'Visualization'}
                        </span>
                    )}
                </div>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-[10px]
