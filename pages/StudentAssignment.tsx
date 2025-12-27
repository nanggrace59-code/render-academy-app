import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Profile, Submission } from '../types';
import { getStudentSubmissions } from '../services/api';
import { ImageSlider } from '../components/ImageSlider';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export const StudentAssignment: React.FC<{ user: Profile }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const assignmentNum = parseInt(id || '1');
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    getStudentSubmissions(user.id).then(subs => {
      const sub = subs.find(s => s.assignment_number === assignmentNum);
      if (sub) {
        setSubmission(sub);
      }
    });
  }, [user.id, assignmentNum]);

  if (!submission) return <div className="p-8 text-neutral-500">Loading Archive...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <button onClick={() => navigate('/student/dashboard')} className="flex items-center text-neutral-500 hover:text-white mb-6 text-xs uppercase tracking-widest font-bold">
        <ArrowLeft size={12} className="mr-2" /> Return to Active Protocol
      </button>

      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-white text-opacity-70">Archived: Assignment {String(assignmentNum).padStart(2, '0')}</h1>
        </div>
        <div className="px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 border-emerald-900 bg-emerald-900/10 text-emerald-500">
             <CheckCircle size={12} /> Approved
        </div>
      </div>

      {/* Content */}
      <div className="h-[600px] border border-neutral-800 shadow-2xl opacity-90">
          <ImageSlider referenceImage={submission.reference_image_url} renderImage={submission.render_image_url} className="h-full" />
      </div>

      <div className="mt-8 text-center text-neutral-600 font-mono text-xs">
          Historical Record • Read Only Mode
      </div>
    </div>
  );
};