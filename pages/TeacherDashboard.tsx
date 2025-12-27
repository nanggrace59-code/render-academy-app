import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStudents, getAllSubmissions } from '../services/api';
import { StudentWithSubmission, ClassType } from '../types';
import { User, AlertCircle, ChevronRight, Search, Inbox, Users } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [students, setStudents] = useState<StudentWithSubmission[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType>('master_class');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getAllStudents(), getAllSubmissions()]).then(([profiles, submissions]) => {
      const data: StudentWithSubmission[] = profiles.map(student => {
        const studentSubs = submissions.filter(s => s.student_id === student.id);
        const hasPending = studentSubs.some(s => s.status === 'pending');
        const pendingSub = studentSubs.find(s => s.status === 'pending');
        const latestSub = pendingSub || studentSubs.sort((a,b) => b.assignment_number - a.assignment_number)[0];
        
        return {
          ...student,
          has_pending: hasPending,
          latest_submission: latestSub
        };
      });
      // We do NOT filter out empty submissions here because the user wants to see the student list even if blank
      setStudents(data);
    });
  }, []);

  // Filter based on selected class
  const filteredStudents = students.filter(s => s.enrolled_class === selectedClass);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
           <h1 className="text-3xl font-light mb-2">Teacher Dashboard</h1>
           <p className="text-neutral-500 font-mono text-sm">MANAGE STUDENT PROGRESS</p>
        </div>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-neutral-800">
         <button 
           onClick={() => setSelectedClass('master_class')}
           className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${selectedClass === 'master_class' ? 'border-red-600 text-white bg-neutral-900/50' : 'border-transparent text-neutral-500 hover:text-white hover:bg-neutral-900/30'}`}
         >
           Master Class Architecture Modeling
         </button>
         <button 
           onClick={() => setSelectedClass('viz_class')}
           className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${selectedClass === 'viz_class' ? 'border-red-600 text-white bg-neutral-900/50' : 'border-transparent text-neutral-500 hover:text-white hover:bg-neutral-900/30'}`}
         >
           Visualization Class
         </button>
      </div>

      {/* Stats Cards (Filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-neutral-900 border border-neutral-800 p-6">
           <h3 className="text-neutral-500 text-xs font-mono uppercase mb-2">Pending Reviews</h3>
           <p className="text-4xl font-light text-amber-500">{filteredStudents.filter(s => s.has_pending).length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-6">
           <h3 className="text-neutral-500 text-xs font-mono uppercase mb-2">Class Enrollment</h3>
           <p className="text-4xl font-light text-white">{filteredStudents.length}</p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 min-h-[400px]">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="font-mono text-sm text-neutral-400 uppercase">Student Roster</h2>
            <Search className="text-neutral-600" size={18} />
        </div>
        
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
             <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <Users size={32} />
             </div>
             <p className="text-lg">No students enrolled in this class.</p>
             <p className="text-sm font-mono mt-2">Check the other class tab.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredStudents.map((student) => (
              <div 
                key={student.id} 
                onClick={() => student.latest_submission && navigate(`/teacher/grading/${student.latest_submission.id}`)}
                className={`p-6 flex items-center justify-between transition-colors ${student.latest_submission ? 'hover:bg-neutral-800/50 cursor-pointer group' : 'opacity-50 cursor-default'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${student.has_pending ? 'bg-amber-900/30 text-amber-500 border border-amber-500/30' : 'bg-neutral-800 text-neutral-500'}`}>
                    {student.has_pending ? <AlertCircle size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-neutral-200">{student.full_name || student.email}</h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-1">
                      <span className="bg-neutral-800 px-2 py-0.5 rounded-sm">LVL {student.current_level}</span>
                      <span>{student.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {student.latest_submission ? (
                    <div className="text-right">
                        <p className="text-sm text-neutral-300">Assignment {student.latest_submission.assignment_number}</p>
                        <p className={`text-xs uppercase font-bold tracking-wide ${
                          student.latest_submission.status === 'pending' ? 'text-amber-500' :
                          student.latest_submission.status === 'approved' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {student.latest_submission.status}
                        </p>
                    </div>
                  ) : (
                      <div className="text-right text-neutral-600 text-xs font-mono uppercase">
                          No Submissions
                      </div>
                  )}
                  {student.latest_submission && <ChevronRight className="text-neutral-600 group-hover:text-white transition-colors" size={20} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};