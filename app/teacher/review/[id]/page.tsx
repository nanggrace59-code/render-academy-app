import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Submission, Profile } from '../types';
import { getAllSubmissions, getProfile, gradeSubmission } from '../services/api';
import { ImageSlider } from '../components/ImageSlider';
import { ArrowLeft, Check, X, MessageSquareQuote, PenTool, User } from 'lucide-react';

export const TeacherGrading: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [student, setStudent] = useState<Profile | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const subs = await getAllSubmissions();
      const sub = subs.find(s => s.id === id);
      if (sub) {
        setSubmission(sub);
        const stud = await getProfile(sub.student_id);
        setStudent(stud);
        // Pre-fill comment if exists to allow editing
        if (sub.teacher_comment) setComment(sub.teacher_comment);
      }
    };
    fetchData();
  }, [id]);

  const handleApprove = async () => {
    if (!submission) return;
    // Default approval message if empty, otherwise use custom note
    const finalComment = comment.trim() || 'Excellent execution. Progression approved.';
    await gradeSubmission(submission.id, 'approved', finalComment);
    navigate('/teacher/dashboard');
  };

  const handleReject = async () => {
    if (!submission) return;
    if (!comment.trim()) {
        // In a real app we might use a toast, here simple alert is safe fallback
        alert("Please provide specific feedback before rejecting.");
        return;
    }
    await gradeSubmission(submission.id, 'rejected', comment);
    navigate('/teacher/dashboard');
  };

  if (!submission || !student) return <div className="flex h-full items-center justify-center text-neutral-500 font-mono text-xs">Loading Protocol Data...</div>;

  return (
    // MAIN CONTAINER: Absolute inset ensures it takes full available space in the dashboard layout without window scroll
    <div className="absolute inset-4 md:inset-6 flex flex-col bg-[#050505] rounded-lg border border-neutral-800 shadow-2xl overflow-hidden">
      
      {/* 1. COMPACT HEADER */}
      <div className="h-14 bg-[#0a0a0a] border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/teacher/dashboard')} 
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            <div className="h-4 w-px bg-neutral-800"></div>
            <div>
                <h1 className="text-sm font-bold text-white tracking-wide uppercase">Grading Console</h1>
            </div>
         </div>
         
         <div className="flex items-center gap-3">
             <div className="text-[10px] text-neutral-600 font-mono hidden md:block">
                 SESSION ID: {submission.id.substring(0,8).toUpperCase()}
             </div>
             <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border flex items-center gap-2 ${
                 submission.status === 'pending' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' :
                 submission.status === 'approved' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'
             }`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${
                     submission.status === 'pending' ? 'bg-amber-500 animate-pulse' :
                     submission.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                 }`} />
                 {submission.status}
             </div>
         </div>
      </div>

      {/* 2. SPLIT LAYOUT BODY */}
      <div className="flex-1 flex min-h-0">
          
          {/* LEFT COLUMN: Main Image Workspace (Flexible Width) */}
          <div className="flex-1 relative bg-black min-w-0">
             <ImageSlider 
                referenceImage={submission.reference_image_url} 
                renderImage={submission.render_image_url} 
                className="h-full w-full border-0 rounded-none"
             />
          </div>

          {/* RIGHT COLUMN: Grading Sidebar (Fixed Width) */}
          <div className="w-[380px] bg-[#0a0a0a] border-l border-neutral-800 flex flex-col shrink-0 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
              
              {/* Student Details Section */}
              <div className="p-6 border-b border-neutral-800">
                  <div className="flex items-start justify-between mb-4">
                      <div>
                          <h2 className="text-lg font-bold text-white mb-1">{student.full_name}</h2>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                              <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-[10px]">LVL {student.current_level}</span>
                              <span>{student.email}</span>
                          </div>
                      </div>
                      <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-500">
                          <User size={20} />
                      </div>
                  </div>

                  {/* Student Message Display */}
                  <div className="bg-[#111] border border-neutral-800 rounded-lg p-4 relative group hover:border-neutral-700 transition-colors">
                      <div className="absolute -top-2 left-4 px-2 bg-[#0a0a0a] text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                          <MessageSquareQuote size={10} /> Student Note
                      </div>
                      <p className="text-sm text-neutral-300 italic font-serif leading-relaxed">
                          "{submission.student_message || "No message attached."}"
                      </p>
                  </div>
              </div>

              {/* Evaluation Section (Always Visible) */}
              <div className="flex-1 flex flex-col p-6 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
                  <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                          <PenTool size={12} /> Instructor Feedback
                      </h3>
                      <span className="text-[9px] text-neutral-600 font-mono uppercase">{comment.length} chars</span>
                  </div>
                  
                  <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Enter detailed feedback here. Required for rejection."
                      className="flex-1 w-full bg-[#0f0f0f] border border-neutral-800 rounded-lg p-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 resize-none mb-6 transition-all"
                  />

                  {/* Grading Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button 
                          onClick={handleReject}
                          className="h-12 rounded-sm border border-red-900/30 bg-red-950/5 hover:bg-red-900/20 hover:border-red-500/50 text-red-600 hover:text-red-500 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group"
                      >
                          <X size={16} className="group-hover:scale-110 transition-transform"/>
                          Reject
                      </button>
                      <button 
                          onClick={handleApprove}
                          className="h-12 rounded-sm bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg hover:shadow-emerald-900/30 transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 group"
                      >
                          <Check size={16} className="group-hover:scale-110 transition-transform"/>
                          Approve
                      </button>
                  </div>
                  <p className="text-[9px] text-neutral-600 text-center mt-3 font-mono">
                      Action will notify student immediately.
                  </p>
              </div>
          </div>

      </div>
    </div>
  );
};
