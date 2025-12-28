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
  full_name?: string; // Optional for UI display
  enrolled_class?: ClassType; // New field for class filtering
  references?: StudentReferences; // New field for Master References
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

// Helper type for joining data in Teacher Dashboard
export interface StudentWithSubmission extends Profile {
  latest_submission?: Submission;
  has_pending: boolean;
}
