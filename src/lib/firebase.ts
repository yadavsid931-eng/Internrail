import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  getDocFromServer
} from 'firebase/firestore';
import { Course, MCQQuestion, User, Certificate, Notification } from '../types';
import { INITIAL_COURSES, INITIAL_MCQS } from '../data/courses';

// Firebase client configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZ7DGY98pWO2gMtGu2RoKPKXkmkoRXZ7M",
  authDomain: "dauntless-glyph-gnzsc.firebaseapp.com",
  projectId: "dauntless-glyph-gnzsc",
  storageBucket: "dauntless-glyph-gnzsc.firebasestorage.app",
  messagingSenderId: "422098816626",
  appId: "1:422098816626:web:70ba4fb4f42ed60ba17ceb"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the custom database Id as supplied from configuration
export const db = initializeFirestore(app, {}, "ai-studio-32c25784-359f-4662-ad67-80bebb8c72c7");

// Prerequisite Verification Connection Check
export async function verifyFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt a secure mock get connection call to prove status
    await getDocFromServer(doc(db, 'system', 'connection'));
    console.log("Firestore secure connection validated successfully.");
    return true;
  } catch (error) {
    console.warn("Firestore validation status checked:", error);
    return false;
  }
}

// -----------------------------------------------------------------
// Database Seeding Logic
// -----------------------------------------------------------------
export async function seedInitialDatabaseIfEmpty() {
  try {
    // 1. Seed Courses
    const coursesSnap = await getDocs(collection(db, 'courses'));
    if (coursesSnap.empty) {
      console.log("Seeding default courses into cloud Firestore...");
      for (const course of INITIAL_COURSES) {
        await setDoc(doc(db, 'courses', course.id), course);
      }
    }

    // 2. Seed MCQs
    const mcqsSnap = await getDocs(collection(db, 'mcqs'));
    if (mcqsSnap.empty) {
      console.log("Seeding default MCQ bank into cloud Firestore...");
      for (const mcq of INITIAL_MCQS) {
        await setDoc(doc(db, 'mcqs', mcq.id), mcq);
      }
    }

    // 3. Seed Users
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log("Seeding default demo student / admin accounts into cloud Firestore...");
      const demoUsers: User[] = [
        {
          id: 'user-demo',
          fullName: 'Si',
          email: 'demo@company.com',
          studentId: 'STU-2024-001',
          role: 'student',
          isActive: true,
          joinedDate: 'June 11, 2026',
          progress: { 'aaws': 20 },
          watchedVideos: ['vid-aaws-1'],
          passedQuizzes: [],
          certificates: []
        },
        {
          id: 'user-admin',
          fullName: 'Administrator',
          email: 'admin@company.com',
          studentId: 'ADM-2024-999',
          role: 'admin',
          isActive: true,
          joinedDate: 'June 11, 2026',
          progress: {},
          watchedVideos: [],
          passedQuizzes: [],
          certificates: []
        }
      ];
      for (const user of demoUsers) {
        await setDoc(doc(db, 'users', user.id), user);
      }
    }

    // 4. Seed default certificate for Si
    const certsSnap = await getDocs(collection(db, 'certificates'));
    if (certsSnap.empty) {
      const defaultCerts: Certificate[] = [
        {
          id: 'cert_seed_1',
          userId: 'user-demo',
          userName: 'Si',
          userStudentId: 'STU-2024-001',
          courseId: 'pis',
          courseName: 'Passenger Information System',
          issueDate: '06-12-2026',
          score: 85,
          certificateNumber: 'CERT-PIS-2026-B812',
          qrCodeValue: 'https://internrail.gov.in/verify/CERT-PIS-2026-B812'
        }
      ];
      for (const cert of defaultCerts) {
        await setDoc(doc(db, 'certificates', cert.id), cert);
      }
    }

  } catch (error) {
    console.error("Error seeding primary cloud database:", error);
  }
}

// -----------------------------------------------------------------
// Collection Helpers & Write Syncs
// -----------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Live synchronizations
export function subscribeCourses(callback: (courses: Course[]) => void) {
  return onSnapshot(collection(db, 'courses'), (snapshot) => {
    const list: Course[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Course);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'courses');
  });
}

export function subscribeMCQs(callback: (questions: MCQQuestion[]) => void) {
  return onSnapshot(collection(db, 'mcqs'), (snapshot) => {
    const list: MCQQuestion[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as MCQQuestion);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'mcqs');
  });
}

export function subscribeUsers(callback: (users: User[]) => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    const list: User[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as User);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'users');
  });
}

export function subscribeCertificates(callback: (certs: Certificate[]) => void) {
  return onSnapshot(collection(db, 'certificates'), (snapshot) => {
    const list: Certificate[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Certificate);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'certificates');
  });
}

export function subscribeNotifications(callback: (notifs: Notification[]) => void) {
  return onSnapshot(collection(db, 'notifications'), (snapshot) => {
    const list: Notification[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Notification);
    });
    callback(list);
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'notifications');
  });
}

// Write transactions
export async function dbSaveCourse(course: Course): Promise<void> {
  try {
    await setDoc(doc(db, 'courses', course.id), course);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `courses/${course.id}`);
  }
}

export async function dbDeleteCourse(courseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `courses/${courseId}`);
  }
}

export async function dbSaveMCQ(mcq: MCQQuestion): Promise<void> {
  try {
    await setDoc(doc(db, 'mcqs', mcq.id), mcq);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `mcqs/${mcq.id}`);
  }
}

export async function dbDeleteMCQ(mcqId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'mcqs', mcqId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `mcqs/${mcqId}`);
  }
}

export async function dbSaveUser(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
  }
}

export async function dbSaveCertificate(cert: Certificate): Promise<void> {
  try {
    await setDoc(doc(db, 'certificates', cert.id), cert);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `certificates/${cert.id}`);
  }
}

export async function dbDeleteCertificate(certId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'certificates', certId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `certificates/${certId}`);
  }
}

export async function dbSaveNotification(notif: Notification): Promise<void> {
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `notifications/${notif.id}`);
  }
}

export async function dbDeleteNotification(notifId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notifId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `notifications/${notifId}`);
  }
}
