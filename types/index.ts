export type Role = 'student' | 'teacher';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type ClassType = 'master_class' | 'viz_class';

export interface StudentReferences {
  interior: string;
  exterior: string;
}

export interface Profile {
  id: string;
  email: string;
  role: Role;
  current_level: number;
  full_name?: string;
  enrolled_class?: ClassType;
  references?: StudentReferences;
}

export interface Submission {
  id: string;
  student_id: string;
  assignment_number: number;
  reference_image_url: string;
  render_image_url: string;
  status: SubmissionStatus;
  student_message?: string;
  teacher_comment?: string;
  created_at?: string;
}