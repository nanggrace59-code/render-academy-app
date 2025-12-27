import { createSupabaseClient } from '@/utils/supabase/client';
import { Profile, Submission } from '@/types';
import { MOCK_PROFILES, MOCK_SUBMISSIONS } from './mockData';

const supabase = createSupabaseClient();

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const login = async (email: string): Promise<Profile | null> => {
  if (supabase) {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password: 'password' });
    if (error || !user) return null;
    return getProfile(user.id);
  }
  return MOCK_PROFILES.find(p => p.email === email) || null;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (supabase) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  }
  return MOCK_PROFILES.find(p => p.id === userId) || null;
};

export const getAllStudents = async (): Promise<Profile[]> => {
  if (supabase) {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
    return data || [];
  }
  return MOCK_PROFILES.filter(p => p.role === 'student');
};

export const saveStudentReferences = async (userId: string, interiorFile: File, exteriorFile: File): Promise<Profile | null> => {
    const interiorUrl = await fileToBase64(interiorFile);
    const exteriorUrl = await fileToBase64(exteriorFile);
    
    // In a real app, upload to storage bucket here
    const profile = MOCK_PROFILES.find(p => p.id === userId);
    if (profile) {
        profile.references = { interior: interiorUrl, exterior: exteriorUrl };
        return { ...profile };
    }
    return null;
};

export const getStudentSubmissions = async (studentId: string): Promise<Submission[]> => {
  if (supabase) {
    const { data } = await supabase.from('submissions').select('*').eq('student_id', studentId);
    return data || [];
  }
  return MOCK_SUBMISSIONS.filter(s => s.student_id === studentId);
};

export const getAllSubmissions = async (): Promise<Submission[]> => {
  if (supabase) {
    const { data } = await supabase.from('submissions').select('*');
    return data || [];
  }
  return MOCK_SUBMISSIONS;
};

export const submitAssignment = async (
  studentId: string, 
  assignmentNumber: number, 
  refUrl: string, 
  renderFile: File | null,
  message?: string
): Promise<boolean> => {
  const renderUrl = renderFile ? await fileToBase64(renderFile) : 'https://picsum.photos/800/600';

  const newSub: Submission = {
    id: Math.random().toString(36).substr(2, 9),
    student_id: studentId,
    assignment_number: assignmentNumber,
    reference_image_url: refUrl,
    render_image_url: renderUrl,
    status: 'pending',
    student_message: message,
    created_at: new Date().toISOString()
  };
  
  MOCK_SUBMISSIONS.push(newSub);
  return true;
};

export const gradeSubmission = async (
  submissionId: string, 
  status: 'approved' | 'rejected', 
  comment: string
): Promise<boolean> => {
  if (supabase) {
      const { error } = await supabase
          .from('submissions')
          .update({ status, teacher_comment: comment })
          .eq('id', submissionId);
      return !error;
  }
  
  const sub = MOCK_SUBMISSIONS.find(s => s.id === submissionId);
  if (sub) {
      sub.status = status;
      sub.teacher_comment = comment;
      return true;
  }
  return false;
};

export const getAcademyGallery = async (): Promise<Submission[]> => {
    return MOCK_SUBMISSIONS.filter(s => s.status === 'approved');
};