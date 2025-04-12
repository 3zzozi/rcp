// Role enum
export enum Role {
    USER = 'USER',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    ADMIN = 'ADMIN'
  }
  
  // Subscription plan enum
  export enum SubscriptionPlan {
    FREE = 'FREE',
    PREMIUM = 'PREMIUM'
  }
  
  // Homework type enum
  export enum HomeworkType {
    MCQ = 'MCQ',
    TEXT = 'TEXT',
    FILE_UPLOAD = 'FILE_UPLOAD'
  }
  
  // Extend Next Auth types
  declare module 'next-auth' {
    interface User {
      id: string;
      name: string;
      email: string;
      role: Role;
      teacherId?: string | null;
      studentId?: string | null;
    }
    
    interface Session {
      user: {
        id: string;
        name: string;
        email: string;
        role: Role;
        teacherId?: string | null;
        studentId?: string | null;
      };
    }
  }
  
  declare module 'next-auth/jwt' {
    interface JWT {
      id: string;
      role: Role;
      teacherId?: string | null;
      studentId?: string | null;
    }
  }
  
  // User types
  export interface UserWithProfiles {
    id: string;
    email: string;
    name: string;
    university: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
    teacherProfile?: {
      id: string;
      userId: string;
      bio?: string | null;
      subscriptionPlan: SubscriptionPlan;
    } | null;
    studentProfile?: {
      id: string;
      userId: string;
      program?: string | null;
    } | null;
  }
  
  // Curriculum types
  export interface CurriculumWithDetails {
    id: string;
    title: string;
    description?: string | null;
    uniqueCode: string;
    teacherId: string;
    createdAt: Date;
    updatedAt: Date;
    teacher?: {
      id: string;
      userId: string;
      bio?: string | null;
      subscriptionPlan: SubscriptionPlan;
      user: {
        name: string;
        email: string;
      };
    };
    lectures?: LectureWithDetails[];
    notes?: NoteType[];
    _count?: {
      lectures: number;
      enrollments: number;
    };
  }
  
  // Lecture types
  export interface LectureWithDetails {
    id: string;
    title: string;
    content: string;
    weekNumber: number;
    curriculumId: string;
    createdAt: Date;
    updatedAt: Date;
    homeworks?: HomeworkWithDetails[];
    attachments?: AttachmentType[];
    isRead?: boolean; // For student view
  }
  
  // Note types
  export interface NoteType {
    id: string;
    content: string;
    expiryDate?: Date | null;
    curriculumId: string;
    createdAt: Date;
  }
  
  // Homework types
  export interface HomeworkWithDetails {
    id: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    type: HomeworkType;
    lectureId: string;
    createdAt: Date;
    updatedAt: Date;
    mcqQuestions?: MCQQuestionType[];
    completed?: boolean; // For student view
    grade?: number | null; // For student view
  }
  
  // MCQ Question types
  export interface MCQQuestionType {
    id: string;
    question: string;
    options: string[]; // Parsed from JSON
    correctOption: number;
    homeworkId: string;
    studentAnswer?: number | null; // For student view
  }
  
  // Attachment types
  export interface AttachmentType {
    id: string;
    title: string;
    fileUrl: string;
    lectureId: string;
    createdAt: Date;
  }
  
  // Homework submission types
  export interface HomeworkSubmissionType {
    id: string;
    studentId: string;
    homeworkId: string;
    content?: string | null;
    fileUrl?: string | null;
    mcqAnswers?: Record<string, number> | null; // Parsed from JSON
    grade?: number | null;
    submittedAt: Date;
  }
  
  // Enrollment types
  export interface EnrollmentWithDetails {
    id: string;
    studentId: string;
    curriculumId: string;
    enrolledAt: Date;
    curriculum?: CurriculumWithDetails;
    student?: {
      id: string;
      userId: string;
      program?: string | null;
      user: {
        name: string;
        email: string;
      };
    };
  }