export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  studentId: string;
  role: UserRole;
  isActive: boolean;
  joinedDate: string;
  progress: Record<string, number>; // courseId -> percentage completed
  watchedVideos: string[]; // videoId[]
  passedQuizzes: string[]; // courseId[]
  certificates: string[]; // certificateId[]
}

export interface Video {
  id: string;
  courseId: string;
  title: string;
  description: string;
  url: string;
  duration: string; // e.g., "12:30"
  durationSeconds: number; // e.g., 750
  mandatory: boolean;
  order: number;
  category: string;
  aspectRatio: '16:9' | '21:9' | '9:16' | '1:1';
}

export interface Course {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  duration: string;
  icon: string;
  color: string;
  videos: Video[];
  passingScore: number; // e.g. 80
  imageUrl?: string;
}

export interface MCQQuestion {
  id: string;
  courseId: string;
  question: string;
  options: string[]; // A, B, C, D
  correctAnswer: number; // index 0, 1, 2, 3
  explanation: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizAttempt {
  id: string;
  userId: string;
  courseId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  date: string;
}

export interface Certificate {
  id: string; // e.g., CERT-AAWS-9812A
  userId: string;
  userName: string;
  userStudentId: string;
  courseId: string;
  courseName: string;
  issueDate: string;
  score: number;
  certificateNumber: string;
  qrCodeValue: string;
  signatureUrl?: string;
  isRevoked?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'welcome' | 'completion' | 'quiz' | 'certificate' | 'system';
  isRead: boolean;
  date: string;
}

export interface UploadQueueItem {
  id: string;
  fileName: string;
  size: number;
  progress: number;
  speed: string;
  status: 'uploading' | 'paused' | 'completed' | 'failed';
  categoryId: string;
}
