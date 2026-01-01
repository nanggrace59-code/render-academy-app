'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
// IMPORTANT: Importing your ORIGINAL ImageSlider
import { ImageSlider } from '@/components/ImageSlider'; 
import { 
  Loader2, CheckCircle, XCircle, ChevronLeft, 
  MessageSquare, User, Calendar
} from 'lucide-react';

export default function ReviewPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Fetch the Submission Data
    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from('submissions')
                .select('*, profiles:user_id (*)') // Get student details too
                .eq('id', params.id)
                .single();

            if (error) {
                console.error('Error:', error);
                alert('Submission not found or connection error.');
                router.push('/teacher/dashboard');
            } else {
                setSubmission(data);
                if (data.teacher_comment) setFeedback(data.teacher_comment);
            }
            setLoading(false);
        };
        fetchData();
    }, [params.id, router]);

    // 2. Handle Approve / Reject Logic
    const handleDecision = async (status: 'approved' | 'rejected') => {
        // If Rejecting, Force Teacher to write Feedback
        if (status === 'rejected' && !feedback.trim()) {
            alert("Please write a feedback note explaining why it is rejected. The student needs to know what to fix.");
            return;
        }

        if (!confirm(`Confirm ${status.toUpperCase()}?`)) return;

        setIsProcessing(true);
        try {
            // A. Update Submission Status
            const { error: subError } = await supabase
                .from('submissions')
                .update({ 
                    status: status, 
                    teacher_comment: feedback,
                    updated_at: new Date().toISOString()
                })
                .eq('id', params.id);

            if (subError) throw subError;

            // B. If Approved, Level Up the Student (Next Assignment)
            if (status === 'approved') {
                const nextLevel = submission.assignment_number + 1;
                await supabase
                    .from('profiles')
                    .update({ current_level: nextLevel })
                    .eq('id', submission.user_id);
            }

            alert(`Assignment successfully ${status}! Student will be notified.`);
            router.push('/teacher/dashboard'); // Go back to list

        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#d90238]" size={32}/></div>;
    if (!submission) return null;

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-sans">
            
            {/* Header */}
            <header className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white flex items-center gap-2">
                        <ChevronLeft size={20}/> <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                    </button>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <div>
                        <h1 className="text-sm font-bold uppercase tracking-widest text-white">Grading Console</h1>
                        <p className="text-[10px] text-neutral-500 font-mono">Assignment #{submission.assignment_number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                    <User size={14} className="text-[#d90238]"/>
                    <span className="text-xs font-bold">{submission.profiles?.full_name || 'Unknown Student'}</span>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                
                {/* --- MAIN COMPARISON AREA (The Critical Part) --- */}
                <div className="flex-1 bg-[#020202] relative border-r border-white/10">
                    {/* HERE IS YOUR ORIGINAL COMPARISON TOOL */}
                    <ImageSlider 
                        referenceImage={submission.reference_image_url} 
                        renderImage={submission.render_image_url} 
                        className="w-full h-full"
                    />
                </div>

                {/* --- RIGHT SIDEBAR: FEEDBACK & GRADING --- */}
                <div className="w-96 bg-[#0a0a0a] flex flex-col shrink-0 z-40 shadow-2xl border-l border-white/5">
                    
                    {/* Student Info & Message */}
                    <div className="p-6 border-b border-white/10">
                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <MessageSquare size={12}/> Student Note
                        </h3>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-sm text-neutral-300 italic leading-relaxed">
                                "{submission.student_message || 'No message provided.'}"
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-600 font-mono">
                                <Calendar size={10}/>
                                Submitted: {new Date(submission.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Teacher Feedback Input */}
                    <div className="flex-1 p-6 flex flex-col min-h-0">
                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
                            Instructor Feedback
                        </h3>
                        <textarea 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Write your feedback here... (Required if rejecting)"
                            className="flex-1 w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#d90238] focus:outline-none resize-none placeholder:text-neutral-700 font-medium"
                        />
                    </div>

                    {/* Grading Buttons */}
                    <div className="p-6 border-t border-white/10 bg-[#0f0f0f] space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleDecision('rejected')}
                                disabled={isProcessing}
                                className="flex items-center justify-center gap-2 py-3 rounded-lg border border-[#d90238] text-[#d90238] hover:bg-[#d90238] hover:text-white transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <><XCircle size={16}/> Reject</>}
                            </button>
                            
                            <button 
                                onClick={() => handleDecision('approved')}
                                disabled={isProcessing}
                                className="flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={16}/> : <><CheckCircle size={16}/> Approve</>}
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-neutral-600 mt-2">
                            Approve = Next Level | Reject = Re-upload
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
