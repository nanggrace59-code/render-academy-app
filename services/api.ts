import { supabase } from '@/supabaseClient';
import { Profile, Submission } from '@/types';

// Helper: File to Base64 (ပုံကို စာသားပြောင်းခြင်း)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper: Database ပုံစံကို Frontend ပုံစံသို့ ပြောင်းခြင်း
const mapProfile = (data: any): Profile => {
  return {
    ...data,
    // Database column (ref_interior_url) ကို UI object (references.interior) သို့ ပြောင်းခြင်း
    references: (data.ref_interior_url && data.ref_exterior_url) ? {
      interior: data.ref_interior_url,
      exterior: data.ref_exterior_url
    } : undefined
  };
};

export const login = async (email: string): Promise<Profile | null> => {
  // Password ကို Login Page မှာ စစ်ပြီးဖြစ်လို့ ဒီမှာ Profile ဆွဲယူရုံပါပဲ
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

export const saveStudentReferences = async (userId: string, interiorFile: File, exteriorFile: File): Promise<Profile | null> => {
    // ၁။ ပုံများကို Base64 ပြောင်းခြင်း (Storage Bucket မလိုအောင် ယာယီဖြေရှင်းနည်း)
    const interiorUrl = await fileToBase64(interiorFile);
    const exteriorUrl = await fileToBase64(exteriorFile);
    
    // ၂။ Database ထဲသို့ တန်းသိမ်းခြင်း
    const { data, error } = await supabase
        .from('profiles')
        .update({ 
            ref_interior_url: interiorUrl, 
            ref_exterior_url: exteriorUrl 
        })
        .eq('id', userId)
        .select()
        .single();
    
    if (error || !data) return null;
    return mapProfile(data);
};

export const getStudentSubmissions = async (studentId: string): Promise<Submission[]> => {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId);
  return data || [];
};

// Assignment အသစ်တင်ခြင်း
export const submitAssignment = async (
  studentId: string, 
  assignmentNumber: number, 
  refUrl: string, 
  renderFile: File | null,
  message?: string
): Promise<boolean> => {
  // Render ပုံမရှိရင် ယာယီပုံ ထည့်ပေးမယ်
  const renderUrl = renderFile ? await fileToBase64(renderFile) : 'https://picsum.photos/800/600';

  const { error } = await supabase.from('submissions').insert({
    student_id: studentId,
    assignment_number: assignmentNumber,
    reference_image_url: refUrl,
    render_image_url: renderUrl,
    status: 'pending',
    student_message: message,
    created_at: new Date().toISOString()
  });

  return !error;
};
// Teacher Dashboard အတွက် လိုအပ်သော Functions များ

export const getAllStudents = async (): Promise<Profile[]> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student');
  
  // Data ပြန်ပို့ရာတွင် UI အတွက် လိုအပ်သော format အတိုင်း map လုပ်ပေးနိုင်ပါတယ်
  // လောလောဆယ် Database အတိုင်း ပြန်ပို့ပါမယ်
  return data?.map(profile => ({
      ...profile,
      // Database column -> UI types conversion if needed
      references: (profile.ref_interior_url && profile.ref_exterior_url) ? {
          interior: profile.ref_interior_url,
          exterior: profile.ref_exterior_url
      } : undefined
  })) || [];
};

export const getAllSubmissions = async (): Promise<Submission[]> => {
  const { data } = await supabase
    .from('submissions')
    .select('*');
  return data || [];
};
