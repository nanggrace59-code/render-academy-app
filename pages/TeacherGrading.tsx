import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Submission, Profile } from '../types';
import { getAllSubmissions, getProfile, gradeSubmission } from '../services/api';
import { ImageSlider } from '../components/ImageSlider';
import { ArrowLeft, Check, X, MessageSquareQuote, ChevronRight, PenTool } from 'lucide-react';

export const TeacherGrading: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [student, setStudent] = useState<Profile | null>(null);
  const [comment, setComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const subs = await getAllSubmissions();
      const sub = subs.find(s => s.id === id);
      if (sub) {
        setSubmission(sub);
        const stud = await getProfile(sub.student_id);
        setStudent(stud);
      }
    };
    fetchData();
  }, [id]);

  const handleApprove = async () => {
    if (!submission) return;
    await gradeSubmission(submission.id, 'approved', 'Excellent execution. Progression approved.');
    navigate('/teacher/dashboard');
  };

  const handleReject = async () => {
    if (!submission) return;
    await gradeSubmission(submission.id, 'rejected', comment);
    navigate('/teacher/dashboard');
  };

  if (!submission || !student) return <div className="p-8 text-neutral-500 font-mono text-xs">Loading Protocol Data...</div>;

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-hidden rounded-sm border border-neutral-800 shadow-2xl">
      {/* 1. Compact Top Bar */}
      <div className="flex items-center justify-between px-4 h-12 shrink-0 bg-[#0a0a0a] border-b border-neutral-800">
         <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/teacher/dashboard')} 
                className="flex items-center gap-1 text-neutral-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
            >
                <ArrowLeft size={12} /> Back
            </button>
            <div className="h-4 w-px bg-neutral-800"></div>
            <div className="flex items-baseline gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">{student.full_name}</h1>
                <span className="text-[10px] text-neutral-500 font-mono uppercase">/ ASN {String(submission.assignment_number).padStart(2,'0')}</span>
            </div>
         </div>
         
         <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border flex items-center gap-1 ${
             submission.status === 'pending' ? 'border-amber-900/50 text-amber-500 bg-amber-900/10' :
             submission.status === 'approved' ? 'border-emerald-900/50 text-emerald-500 bg-emerald-900/10' : 'border-red-900/50 text-red-500 bg-red-900/10'
         }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${
                 submission.status === 'pending' ? 'bg-amber-500 animate-pulse' :
                 submission.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
             }`} />
             {submission.status}
         </div>
      </div>

      {/* 2. Maximized Comparison Area */}
      <div className="flex-1 min-h-0 relative bg-black w-full">
         <ImageSlider 
            referenceImage={submission.reference_image_url} 
            renderImage={submission.render_image_url} 
            className="h-full w-full border-0 rounded-none"
         />
      </div>

      {/* 3. Compact Approval Card (Under Images) */}
      <div className="shrink-0 bg-[#0a0a0a] border-t border-neutral-800 p-3 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative">
          
          {/* Rejection Form Expanded Overlay */}
          {showRejectForm && (
              <div className="absolute inset-x-0 bottom-full bg-[#0a0a0a] border-t border-neutral-800 p-4 shadow-2xl animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><PenTool size={12} /> Instructor Feedback</h3>
                     <button onClick={() => setShowRejectForm(false)} className="text-neutral-500 hover:text-white"><X size={14}/></button>
                  </div>
                  <textarea
                     value={comment}
                     onChange={(e) => setComment(e.target.value)}
                     placeholder="Detailed breakdown of areas needing improvement..."
                     className="w-full h-32 bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-red-600 rounded-sm mb-3 resize-none font-sans"
                     autoFocus
                  />
                  <div className="flex justify-end gap-2">
                      <button 
                        onClick={handleReject}
                        className="bg-red-600 text-white px-6 py-2 rounded-sm text-xs font-bold uppercase hover:bg-red-500 transition-colors"
                      >
                         Confirm Rejection
                      </button>
                  </div>
              </div>
          )}

          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              
              {/* Student Message */}
              <div className="flex-1 w-full lg:w-auto min-w-0">
                 {submission.student_message ? (
                     <div className="flex items-center gap-3 bg-[#0f0f0f] px-3 py-2 rounded-sm border border-neutral-800">
                        <MessageSquareQuote size={14} className="text-neutral-500 shrink-0" />
                        <p className="text-xs text-neutral-300 italic truncate font-sans">"{submission.student_message}"</p>
                     </div>
                 ) : (
                     <div className="px-2 py-2 text-[10px] text-neutral-600 font-mono uppercase">No message attached</div>
                 )}
              </div>

              {/* Action Buttons (Hidden when form is active to prevent clutter) */}
              <div className="flex gap-2 w-full lg:w-auto shrink-0 justify-end">
                 {!showRejectForm && (
                    <>
                        <button 
                            onClick={() => setShowRejectForm(true)}
                            className="h-9 px-4 border border-red-900/20 text-red-500 hover:bg-red-950/20 hover:border-red-600/50 transition-all uppercase font-bold text-[10px] tracking-wider rounded-sm flex items-center gap-2 group"
                        >
                            <X size={12} className="group-hover:scale-110 transition-transform" /> Reject
                        </button>
                        <button 
                            onClick={handleApprove}
                            className="h-9 px-6 bg-emerald-700 hover:bg-emerald-600 text-white transition-all uppercase font-bold text-[10px] tracking-wider rounded-sm shadow-lg hover:shadow-emerald-900/20 flex items-center gap-2 group"
                        >
                            <Check size={12} className="group-hover:scale-110 transition-transform" /> Approve
                        </button>
                    </>
                 )}
              </div>
          </div>
      </div>
    </div>
  );
};