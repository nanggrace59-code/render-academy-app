import { supabase } from '@/supabaseClient';
import { Profile, Submission } from '@/types';

// Helper: File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper: Map DB to UI Profile
const mapProfile = (data: any): Profile => {
  return {
    ...data,
    references: (data.ref_interior_url && data.ref_exterior_url) ? {
      interior: data.ref_interior_url,
      exterior: data.ref_exterior_url
    } : undefined
  };
};

export const login = async (email: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return mapProfile(data);
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return mapProfile(data);
};

// --- FIX HERE: Upload Logic ---
export const saveStudentReferences = async (userId: string, interiorFile: File | null, exteriorFile: File | null): Promise<Profile | null> => {
    try {
        const updateData: any = {};

        // Convert files only if they exist
        if (interiorFile) {
            const url = await fileToBase64(interiorFile);
            updateData.ref_interior_url = url;
        }
        if (exteriorFile) {
            const url = await fileToBase64(exteriorFile);
            updateData.ref_exterior_url = url;
        }

        // Database Update
        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error("Upload Error:", error.message);
            return null;
        }

        return mapProfile(data);
    } catch (err) {
        console.error("Unexpected Error:", err);
        return null;
    }
};

// Teacher Dashboard Helpers
export const getAllStudents = async (): Promise<Profile[]> => {
  const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
  return data?.map(mapProfile) || [];
};

export const getAllSubmissions = async (): Promise<Submission[]> => {
  const { data } = await supabase.from('submissions').select('*');
  return data || [];
};

export const getStudentSubmissions = async (studentId: string): Promise<Submission[]> => {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId);
  return data || [];
};

export const submitAssignment = async (
  studentId: string, 
  assignmentNumber: number, 
  refUrl: string, 
  renderFile: File | null,
  message?: string
): Promise<boolean> => {
  const renderUrl = renderFile ? await fileToBase64(renderFile) : 'https://via.placeholder.com/800';

  const { error } = await supabase.from('submissions').insert({
    student_id: studentId,
    assignment_number: assignmentNumber,
    reference_image_url: refUrl,
    render_image_url: renderUrl,
    status: 'pending',
    student_message: message,
    created_at: new Date().toISOString()
  });

  if (error) console.error("Submit Error:", error.message);
  return !error;
};
// ... အပေါ်က Code တွေ အတူတူပါပဲ ...

export const getAcademyGallery = async (): Promise<Submission[]> => {
  // Status 'approved' ဖြစ်တဲ့ Submission တွေကို ဆွဲထုတ်ပါမယ်
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'approved');
  return data || [];
};
