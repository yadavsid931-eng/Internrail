import React, { useState, useEffect } from 'react';
import { 
  Bell, BookOpen, Clock, PlaySquare, HelpCircle, Award, CheckCircle, 
  ChevronRight, ArrowLeft, Smartphone, Laptop, Tablet, Monitor, Info, Sparkles, Check, Play, User, Lock, ExternalLink, ShieldAlert 
} from 'lucide-react';

import { INITIAL_COURSES, INITIAL_MCQS } from './data/courses';
import { Course, Video, MCQQuestion, User as AppUser, Certificate, Notification, QuizAttempt } from './types';

import LoginSignup from './components/LoginSignup';
import Navbar from './components/Navbar';
import VideoPlayer from './components/VideoPlayer';
import MCQTest from './components/MCQTest';
import CertificateView from './components/CertificateView';
import AdminPanel from './components/AdminPanel';
import { getVideoFile, deleteVideoFile } from './utils/indexedDB';
import { compressImage } from './utils/compressImage';

import {
  verifyFirestoreConnection,
  seedInitialDatabaseIfEmpty,
  subscribeCourses,
  subscribeMCQs,
  subscribeUsers,
  subscribeCertificates,
  subscribeNotifications,
  dbSaveCourse,
  dbDeleteCourse,
  dbSaveMCQ,
  dbDeleteMCQ,
  dbSaveUser,
  dbSaveCertificate,
  dbDeleteCertificate,
  dbSaveNotification,
  dbDeleteNotification
} from './lib/firebase';

export default function App() {
  // Theme state
  const [isLightTheme, setIsLightTheme] = useState<boolean>(true);

  // Core databases (synced from Firestore)
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Session state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Active routing / view states
  const [activeView, setActiveView] = useState<'dashboard' | 'profile' | 'admin'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeQuizCourse, setActiveQuizCourse] = useState<Course | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<Certificate | null>(null);

  const [abandonQuizCourseConfirm, setAbandonQuizCourseConfirm] = useState<boolean>(false);

  // Global search & filters
  const [searchQuery, setSearchQuery] = useState<string>('');



  // Interactive Toast states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Seed and bind live real-time Firestore synchronization listeners
  useEffect(() => {
    let unsubCourses: (() => void) | undefined;
    let unsubMCQs: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    let unsubCerts: (() => void) | undefined;
    let unsubNotifs: (() => void) | undefined;

    async function initFirebaseSync() {
      // Connect to Firestore and run seeder check
      const connected = await verifyFirestoreConnection();
      if (connected) {
        await seedInitialDatabaseIfEmpty();
      }

      // 1. Subscribe to Courses
      unsubCourses = subscribeCourses((freshCourses) => {
        setCourses(freshCourses);
        
        // Restore local video blob records from IndexedDB asynchronously for custom uploads
        const restoreBlobs = async (crList: Course[]) => {
          let cx = false;
          const updated = await Promise.all(crList.map(async cr => {
            const updatedVideos = await Promise.all(cr.videos.map(async vid => {
              if (vid.id && (vid.id.startsWith('vid_') || vid.url.startsWith('blob:'))) {
                try {
                  const fileOrBlob = await getVideoFile(vid.id);
                  if (fileOrBlob) {
                    const freshUrl = URL.createObjectURL(fileOrBlob);
                    cx = true;
                    return { ...vid, url: freshUrl };
                  }
                } catch (e) {
                  console.error("Error restoring video blob:", vid.id, e);
                }
              }
              return vid;
            }));
            return { ...cr, videos: updatedVideos };
          }));
          if (cx) {
            setCourses(updated);
          }
        };
        restoreBlobs(freshCourses);
      });

      // 2. Subscribe to MCQs
      unsubMCQs = subscribeMCQs((freshMCQs) => {
        setQuestions(freshMCQs);
      });

      // 3. Subscribe to Users
      unsubUsers = subscribeUsers((freshUsers) => {
        setUsers(freshUsers);
        
        // Keep active currentUser session updated instantly
        const activeSess = localStorage.getItem('internrail_current_user');
        if (activeSess) {
          const parsed = JSON.parse(activeSess) as AppUser;
          const latestVal = freshUsers.find(u => u.id === parsed.id);
          if (latestVal && JSON.stringify(latestVal) !== JSON.stringify(parsed)) {
            setCurrentUser(latestVal);
            localStorage.setItem('internrail_current_user', JSON.stringify(latestVal));
          }
        }
      });

      // 4. Subscribe to Certificates
      unsubCerts = subscribeCertificates((freshCerts) => {
        setCertificates(freshCerts);
      });

      // 5. Subscribe to Notifications (sorted descending)
      unsubNotifs = subscribeNotifications((freshNotifs) => {
        const sorted = [...freshNotifs].sort((a, b) => b.id.localeCompare(a.id));
        setNotifications(sorted);
      });
    }

    initFirebaseSync();

    // Recover cached active user session immediately
    const cachedUser = localStorage.getItem('internrail_current_user');
    if (cachedUser) {
      setCurrentUser(JSON.parse(cachedUser));
    }

    return () => {
      if (unsubCourses) unsubCourses();
      if (unsubMCQs) unsubMCQs();
      if (unsubUsers) unsubUsers();
      if (unsubCerts) unsubCerts();
      if (unsubNotifs) unsubNotifs();
    };
  }, []);

  // Sync selectedCourse and activeVideo with latest updates in the courses list
  useEffect(() => {
    if (selectedCourse) {
      const freshCourse = courses.find(c => c.id === selectedCourse.id);
      if (freshCourse) {
        // If course name or details or videos count/content changed, sync it
        if (JSON.stringify(freshCourse) !== JSON.stringify(selectedCourse)) {
          setSelectedCourse(freshCourse);
        }
        // Also keep activeVideo in sync with latest fields if the active video is part of this course
        if (activeVideo) {
          const freshVideo = freshCourse.videos.find(v => v.id === activeVideo.id);
          if (freshVideo && JSON.stringify(freshVideo) !== JSON.stringify(activeVideo)) {
            setActiveVideo(freshVideo);
          }
        }
      }
    }
  }, [courses, selectedCourse, activeVideo]);

  // Helper theme toggler
  const handleToggleTheme = () => {
    setIsLightTheme(prev => !prev);
  };

  // Auth triggers
  const handleAuthSuccess = (user: AppUser) => {
    setCurrentUser(user);
    // Send welcome notice
    triggerToast(`Welcome back, ${user.fullName}! Ready to train.`);
    addNotification(user.id, `Session authorized as ${user.fullName}. ID: ${user.studentId}`, 'system');
  };

  const handleLogout = () => {
    localStorage.removeItem('internrail_current_user');
    setCurrentUser(null);
    setSelectedCourse(null);
    setActiveVideo(null);
    setActiveQuizCourse(null);
    setActiveView('dashboard');
    triggerToast('Securely logged out of InternRail components.');
  };

  // Video watching feedback handler
  const handleVideoCompleted = async (videoId: string) => {
    if (!currentUser) return;

    // 1. Calculate new watchedVideos and course progress based on the direct state of currentUser
    const currentWatched = currentUser.watchedVideos || [];
    const alreadyWatched = currentWatched.includes(videoId);
    const watched = alreadyWatched ? currentWatched : [...currentWatched, videoId];

    const activeCourse = courses.find(c => c.videos.some(vid => vid.id === videoId)) || selectedCourse;
    const courseProgress = { ...(currentUser.progress || {}) };

    if (activeCourse) {
      const courseVids = activeCourse.videos;
      const watchedVidsInCourse = courseVids.filter(v => watched.includes(v.id)).length;
      const completedPercentage = Math.round((watchedVidsInCourse / courseVids.length) * 100);
      courseProgress[activeCourse.id] = Math.max(courseProgress[activeCourse.id] || 0, completedPercentage);
    }

    const updatedUser = { 
      ...currentUser, 
      watchedVideos: watched, 
      progress: courseProgress 
    };

    // 2. Synchronously update current user states
    setCurrentUser(updatedUser);
    localStorage.setItem('internrail_current_user', JSON.stringify(updatedUser));

    // 3. Save User state in cloud Firestore
    await dbSaveUser(updatedUser);

    // 4. Force synchronization of selectedCourse if active
    if (selectedCourse && activeCourse && selectedCourse.id === activeCourse.id) {
      const freshCourse = courses.find(c => c.id === selectedCourse.id);
      if (freshCourse) {
        setSelectedCourse(freshCourse);
      }
    }

    triggerToast('Video watch progress saved! MCQ Assessment unlocked.');
    addNotification(currentUser.id, `Completed training video unit [${videoId}].`, 'completion');
  };

  const handleUpdateCourseImage = async (courseId: string, url: string) => {
    const finalUrl = url.startsWith('data:') ? await compressImage(url) : url;
    const found = courses.find(c => c.id === courseId);
    if (!found) return;

    const updatedCourse = { ...found, imageUrl: finalUrl };
    await dbSaveCourse(updatedCourse);
    triggerToast('Training Selection Image updated. Content displays on home screen!');
  };

  const handleCourseImageUpload = (courseId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        const compressed = await compressImage(base64);
        handleUpdateCourseImage(courseId, compressed);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCourse = async (newCourse: Course) => {
    await dbSaveCourse(newCourse);
    triggerToast(`Added course selection "${newCourse.title}" successfully!`);
    if (currentUser) {
      await addNotification(currentUser.id, `Created new training course selection: ${newCourse.title}`, 'system');
    }
  };

  const handleEditCourse = async (updatedCourse: Course) => {
    await dbSaveCourse(updatedCourse);
    triggerToast(`Course selection "${updatedCourse.title}" saved successfully!`);
  };

  const handleDeleteCourse = async (courseId: string) => {
    await dbDeleteCourse(courseId);
    triggerToast(`Course selection removed.`);
  };

  // Assessment completed callback
  const handleFinishQuiz = async (attempt: QuizAttempt) => {
    if (!currentUser) return;

    // Save attempt and update passed status
    const passedQuizzes = [...currentUser.passedQuizzes];
    if (attempt.passed && !passedQuizzes.includes(attempt.courseId)) {
      passedQuizzes.push(attempt.courseId);
    }

    const updatedUser = { ...currentUser, passedQuizzes };
    setCurrentUser(updatedUser);
    localStorage.setItem('internrail_current_user', JSON.stringify(updatedUser));
    await dbSaveUser(updatedUser);

    // Trigger toast notification
    if (attempt.passed) {
      triggerToast(`Congratulations! Passed with ${attempt.score}%. Generating Secure Certificate.`);
      addNotification(currentUser.id, `Congratulations! Passed ${attempt.courseId} with ${attempt.score}%.`, 'quiz');
      
      // Auto generate Certificate!
      generateCertificate(attempt.courseId, attempt.score);
    } else {
      triggerToast(`Assessment failed (${attempt.score}%). Review training videos and try again!`);
      addNotification(currentUser.id, `Assessment failed for ${attempt.courseId} (${attempt.score}%). Re-attempt required.`, 'quiz');
    }

    setActiveQuizCourse(null);
  };

  const generateCertificate = async (courseId: string, score: number) => {
    if (!currentUser) return;

    const targetCourse = courses.find(c => c.id === courseId);
    if (!targetCourse) return;

    const uniqueCertId = 'cert_' + Date.now();
    const uniqueNumber = `CERT-${targetCourse.shortTitle}-${new Date().getFullYear()}-${Math.floor(Math.random()*9000 + 1000)}`;

    const newCert: Certificate = {
      id: uniqueCertId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userStudentId: currentUser.studentId,
      courseId: courseId,
      courseName: targetCourse.title,
      issueDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      score: score,
      certificateNumber: uniqueNumber,
      qrCodeValue: `https://internrail.gov.in/verify/${uniqueNumber}`
    };

    await dbSaveCertificate(newCert);

    // Update student certificates reference
    const certIds = currentUser.certificates ? [...currentUser.certificates, uniqueCertId] : [uniqueCertId];
    const updatedUser = { ...currentUser, certificates: certIds };
    localStorage.setItem('internrail_current_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    await dbSaveUser(updatedUser);

    await addNotification(currentUser.id, `Verified Certificate generated: ${uniqueNumber}. View in profile.`, 'certificate');
  };

  // Helper Notification injectors
  const addNotification = async (userId: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: 'notif_' + Date.now(),
      userId,
      title: 'InternRail Notice',
      message,
      type,
      isRead: false,
      date: 'Just Now'
    };

    await dbSaveNotification(newNotif);
  };

  const handleMarkNotificationRead = async (id: string) => {
    const found = notifications.find(n => n.id === id);
    if (!found) return;
    const updated = { ...found, isRead: true };
    await dbSaveNotification(updated);
  };

  const handleClearNotifications = async () => {
    const userNotifs = notifications.filter(n => n.userId === currentUser?.id);
    await Promise.all(userNotifs.map(n => dbDeleteNotification(n.id)));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Admin Video Actions Panel
  const handleAddVideo = async (newVideo: Video) => {
    const foundCourse = courses.find(c => c.id === newVideo.courseId);
    if (!foundCourse) return;

    const updatedCourse = { ...foundCourse, videos: [...foundCourse.videos, newVideo] };
    await dbSaveCourse(updatedCourse);
    triggerToast(`Added training component "${newVideo.title}" to syllabus.`);
  };

  const handleEditVideo = async (updatedVideo: Video) => {
    const foundCourse = courses.find(c => c.id === updatedVideo.courseId);
    if (!foundCourse) return;

    const updatedVids = foundCourse.videos.map(v => v.id === updatedVideo.id ? updatedVideo : v);
    const updatedCourse = { ...foundCourse, videos: updatedVids };
    await dbSaveCourse(updatedCourse);
    triggerToast(`Successfully modified video parameters.`);
  };

  const handleDeleteVideo = async (videoId: string, courseId: string) => {
    // Also remove from IndexedDB if stored
    deleteVideoFile(videoId).catch(err => {
      console.error("Error deleting video from IDB:", err);
    });

    const foundCourse = courses.find(c => c.id === courseId);
    if (!foundCourse) return;

    const filteredVids = foundCourse.videos.filter(v => v.id !== videoId);
    const updatedCourse = { ...foundCourse, videos: filteredVids };
    await dbSaveCourse(updatedCourse);
    triggerToast('Video target erased from course modules registry.');
  };

  // Admin MCQ Actions Panel
  const handleAddQuestion = async (newQ: MCQQuestion) => {
    await dbSaveMCQ(newQ);
    triggerToast(`Formulated assessment question successfully.`);
  };

  const handleEditQuestion = async (updatedQ: MCQQuestion) => {
    await dbSaveMCQ(updatedQ);
    triggerToast('Saved changes on exam question registry card.');
  };

  const handleDeleteQuestion = async (id: string) => {
    await dbDeleteMCQ(id);
    triggerToast('MCQ card removed successfully.');
  };

  const handleImportQuestions = async (imported: MCQQuestion[]) => {
    await Promise.all(imported.map(q => dbSaveMCQ(q)));
    triggerToast('Questions batch imported successfully.');
  };

  // Admin student access trigger
  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    const foundUser = users.find(u => u.id === userId);
    if (!foundUser) return;

    const updated = { ...foundUser, isActive };
    await dbSaveUser(updated);
    triggerToast(`Student account status set to ${isActive ? 'Authorized Active' : 'Suspended Restricted'}.`);
  };

  const handleRevokeCertificate = async (certId: string) => {
    const foundCert = certificates.find(c => c.id === certId);
    if (!foundCert) return;

    const updated = { ...foundCert, isRevoked: true };
    await dbSaveCertificate(updated);
    triggerToast('Completing digital credentials revoked and blocked from registry verify hashes.');
  };

  const handleIssueCertificateBypass = async (userId: string, courseId: string) => {
    const targetUser = users.find(u => u.id === userId);
    const targetCourse = courses.find(c => c.id === courseId);
    if (!targetUser || !targetCourse) return;

    // Issue manually
    const uniqueCertId = 'cert_man_' + Date.now();
    const uniqueNumber = `CERT-${targetCourse.shortTitle}-${new Date().getFullYear()}-MAN${Math.floor(Math.random()*900 + 100)}`;

    const newCert: Certificate = {
      id: uniqueCertId,
      userId: userId,
      userName: targetUser.fullName,
      userStudentId: targetUser.studentId,
      courseId: courseId,
      courseName: targetCourse.title,
      issueDate: new Date().toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
      score: 100, // manual complete score value
      certificateNumber: uniqueNumber,
      qrCodeValue: `https://internrail.gov.in/verify/${uniqueNumber}`
    };

    await dbSaveCertificate(newCert);

    // Update student's passed lists
    const passedQuizzes = targetUser.passedQuizzes.includes(courseId) ? targetUser.passedQuizzes : [...targetUser.passedQuizzes, courseId];
    const certIds = targetUser.certificates ? [...targetUser.certificates, uniqueCertId] : [uniqueCertId];
    const updatedUser = { ...targetUser, passedQuizzes, certificates: certIds };
    
    await dbSaveUser(updatedUser);

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(updatedUser);
      localStorage.setItem('internrail_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    try {
      await dbDeleteCertificate(certId);
      
      // Update the user document to remove reference
      const certUser = users.find(u => u.certificates?.includes(certId));
      if (certUser) {
        const updatedUser = {
          ...certUser,
          certificates: certUser.certificates.filter(id => id !== certId)
        };
        await dbSaveUser(updatedUser);
        if (currentUser && certUser.id === currentUser.id) {
          setCurrentUser(updatedUser);
          localStorage.setItem('internrail_current_user', JSON.stringify(updatedUser));
        }
      }
      
      triggerToast('Certificate permanently removed from global registry.');
      setViewingCertificate(null);
    } catch (e) {
      console.error("Failed to delete certificate:", e);
      triggerToast('Failed to delete certificate. Try again.');
    }
  };

  // Navigation handlers
  const handleNavigate = (view: 'dashboard' | 'profile' | 'admin') => {
    setActiveView(view);
    setSelectedCourse(null);
    setActiveVideo(null);
    setActiveQuizCourse(null);
  };

  // Global searching helper
  const handleGlobalSearch = (term: string) => {
    setSearchQuery(term);
  };

  // Filter courses/videos based on query
  const filteredCourses = courses.filter(c => {
    if (!searchQuery) return true;
    const matchesTitle = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.shortTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTitle;
  });

  const getCourseProgress = (courseId: string): number => {
    if (!currentUser) return 0;
    return currentUser.progress[courseId] || 0;
  };

  const getOverallProgress = (): number => {
    if (!currentUser) return 0;
    // Calculate total progress percentage out of modules
    if (courses.length === 0) return 0;
    let sum = 0;
    courses.forEach(c => {
      sum += currentUser.progress[c.id] || 0;
    });
    return Math.round(sum / courses.length);
  };

  // Render Login state screen if not authorized
  if (!currentUser) {
    return (
      <LoginSignup 
        onAuthSuccess={handleAuthSuccess} 
        currentUser={null} 
        users={users} 
        onRegisterUser={dbSaveUser} 
      />
    );
  }

  if (viewingCertificate) {
    return (
      <div className={`min-h-screen transition-colors duration-200 select-normal ${
        isLightTheme ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'
      }`}>
        <div className="no-print">
          <Navbar
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateTo={handleNavigate}
            activeView={activeView}
            notifications={notifications.filter(n => n.userId === 'all' || n.userId === currentUser.id)}
            onMarkNotificationRead={handleMarkNotificationRead}
            onClearNotifications={handleClearNotifications}
            onGlobalSearch={handleGlobalSearch}
            isLightTheme={isLightTheme}
            onToggleTheme={handleToggleTheme}
          />
        </div>
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <CertificateView
            certificate={viewingCertificate}
            onBack={() => setViewingCertificate(null)}
            isLightTheme={isLightTheme}
            onDeleteCertificate={handleDeleteCertificate}
            currentUser={currentUser}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 select-normal ${
      isLightTheme ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-white'
    }`}>
      
      {/* Main Navbar */}
      <div className="no-print">
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigateTo={handleNavigate}
          activeView={activeView}
          notifications={notifications.filter(n => n.userId === 'all' || n.userId === currentUser.id)}
          onMarkNotificationRead={handleMarkNotificationRead}
          onClearNotifications={handleClearNotifications}
          onGlobalSearch={handleGlobalSearch}
          isLightTheme={isLightTheme}
          onToggleTheme={handleToggleTheme}
        />
      </div>

      {/* Main Application Content Container */}
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

          {/* -------------------------------------------------------------
              A. HOME DASHBOARD / STUDENT HUB PAGE VIEW
              ------------------------------------------------------------- */}
          {activeView === 'dashboard' && !selectedCourse && !activeQuizCourse && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Quick Greeting */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 relative">
                <div className="space-y-1">
                  <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLightTheme ? 'text-slate-900' : 'text-slate-100'}`}>
                    Welcome back, {currentUser.fullName.split(' ')[0]}
                  </h1>
                  <p className={`text-sm ${isLightTheme ? 'text-slate-550 text-slate-500' : 'text-slate-400'}`}>
                    {(() => {
                      const remainingCount = courses.length - currentUser.passedQuizzes.length;
                      return remainingCount > 0 
                        ? `You have ${remainingCount} module${remainingCount > 1 ? 's' : ''} remaining to complete your certification.`
                        : 'You have completed all modules to unlock your full certification.';
                    })()}
                  </p>
                </div>
                
                {/* Overall completion bar mini component */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full sm:w-auto shrink-0 select-none">
                  <div className="text-left sm:text-right w-full sm:w-48">
                    <div className={`text-xs font-semibold ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>{getOverallProgress()}% Complete</div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-slate-200/50 dark:border-slate-800">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${getOverallProgress()}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIST OF TRAINING MODULE CARDS */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold tracking-tight">My Training Modules</h2>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">
                    {filteredCourses.length} active modules
                  </span>
                </div>

                <GridContainer>
                  {filteredCourses.map(cr => {
                    const progPct = getCourseProgress(cr.id);
                    const videosCount = cr.videos.length;
                    const isPassed = currentUser.passedQuizzes.includes(cr.id);
                    
                    // Fetch completed videos in this course
                    const completedInCourse = cr.videos.filter(v => (currentUser?.watchedVideos || []).includes(v.id)).length;
                    const canTakeQuiz = videosCount === 0 || (completedInCourse >= 1 && videosCount > 0);

                    return (
                      <div 
                        key={cr.id} 
                        className={`bg-white rounded-2xl border overflow-hidden flex flex-col group hover:shadow-md transition-all duration-200 outline-none select-none ${
                          isLightTheme 
                            ? 'bg-white border-slate-200 hover:border-blue-300' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Themed visual card banner */}
                        <div className="h-36 relative shrink-0 overflow-hidden flex items-center justify-center bg-slate-900 border-b border-slate-800/10 dark:border-slate-800">
                          {cr.imageUrl ? (
                            <img
                              src={cr.imageUrl}
                              alt={cr.title}
                              className="absolute inset-0 w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`absolute inset-0 ${
                              isLightTheme 
                                ? 'bg-gradient-to-br from-slate-100 to-slate-200/50' 
                                : 'bg-gradient-to-br from-slate-950 to-slate-900'
                            }`} />
                          )}

                          {/* Image customize tools overlay */}
                          <div className="absolute top-2.5 right-2.5 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = prompt("Enter Image Web URL for this course selection:", cr.imageUrl || "");
                                if (url !== null) {
                                  handleUpdateCourseImage(cr.id, url);
                                }
                              }}
                              className="px-2 py-1 bg-black/80 hover:bg-black text-[10px] text-white rounded font-bold transition flex items-center gap-1 border border-white/20 shadow-md cursor-pointer"
                              title="Set Web URL"
                            >
                              📸 URL
                            </button>
                            
                            <label
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 bg-black/80 hover:bg-black text-[10px] text-white rounded font-bold transition flex items-center gap-1 border border-white/20 shadow-md cursor-pointer"
                              title="Upload local photo"
                            >
                              📁 File
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleCourseImageUpload(cr.id, file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                          
                          {/* Slabs decorative graphics pattern if no custom image is assigned */}
                          {!cr.imageUrl && (
                            <div className={`absolute inset-0 opacity-10 pointer-events-none select-none ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>
                              <div className="w-full h-0.5 bg-current absolute top-1/4 transform -skew-y-6"></div>
                              <div className="w-full h-0.5 bg-current absolute top-2/4 transform -skew-y-6"></div>
                              <div className="w-full h-0.5 bg-current absolute top-3/4 transform -skew-y-6"></div>
                            </div>
                          )}

                          {/* Radial overlay gradients for high readability over bright images */}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                          
                          {/* Title decoration */}
                          <div className="w-11 h-11 rounded-xl bg-blue-600/90 text-white border border-blue-500/30 flex items-center justify-center font-black text-sm select-none uppercase shadow-lg z-10">
                            {cr.shortTitle}
                          </div>

                          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/60 text-[9px] text-white rounded uppercase tracking-wider font-extrabold select-none z-10 border border-white/10">
                            {cr.shortTitle === 'AAWS' || cr.shortTitle === 'APC' ? 'Railway Safety Systems' : 'Connectivity & PIS'}
                          </div>
                        </div>

                        {/* Card body content */}
                        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                          <div className="space-y-1 text-left">
                            <h3 className={`font-extrabold text-base leading-tight tracking-tight mt-0.5 ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                              {cr.shortTitle} — {cr.title}
                            </h3>
                            <p className={`text-xs leading-relaxed line-clamp-3 pt-1 ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                              {cr.description}
                            </p>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                            {/* Stats */}
                            <div className="flex justify-between items-center text-[11px] font-mono select-none">
                              <span className="text-zinc-500 font-semibold uppercase text-[10px]">Lectures Progress</span>
                              <span className="font-extrabold text-blue-600 dark:text-blue-400">{completedInCourse} / {videosCount} Videos</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/25 dark:border-slate-800">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isPassed ? 'bg-emerald-500(green-500)' : 'bg-blue-600'
                                }`}
                                style={{ 
                                  width: `${progPct}%`,
                                  backgroundColor: isPassed ? '#10b981' : '#2563eb'
                                }}
                              />
                            </div>

                            {/* Actions split */}
                            <div className="grid grid-cols-2 gap-2 mt-4 select-none">
                              <button
                                onClick={() => {
                                  setSelectedCourse(cr);
                                  if (cr.videos.length > 0) {
                                    setActiveVideo(cr.videos[0]);
                                  }
                                }}
                                className="w-full py-2 bg-slate-900 dark:bg-slate-950/60 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 border border-transparent dark:border-slate-800"
                              >
                                <Play className="w-3 h-3 fill-white" />
                                <span>{completedInCourse > 0 ? 'Resume' : 'Start'}</span>
                              </button>

                              {isPassed ? (
                                <button
                                  onClick={() => {
                                    setActiveQuizCourse(cr);
                                  }}
                                  className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center flex items-center justify-center gap-1 border border-emerald-500/20"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Passed (Retake)</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (!canTakeQuiz) {
                                      triggerToast('You must watch at least one video lesson of this selection to play MCQ!');
                                      return;
                                    }
                                    setActiveQuizCourse(cr);
                                  }}
                                  disabled={!canTakeQuiz}
                                  className={`w-full py-2 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition ${
                                    canTakeQuiz 
                                      ? 'bg-purple-600 text-white hover:bg-purple-500 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-purple-500/20 font-bold' 
                                      : 'bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-850 cursor-not-allowed'
                                  }`}
                                >
                                  {canTakeQuiz ? (
                                    <HelpCircle className="w-3.5 h-3.5 animate-bounce" />
                                  ) : (
                                    <Lock className="w-3 h-3" />
                                  )}
                                  <span>Quiz Exam</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </GridContainer>
              </div>

            </div>
          )}

          {/* -------------------------------------------------------------
              B. SINGLE MODULE / PLAYING LECTURE VIEW
              ------------------------------------------------------------- */}
          {selectedCourse && activeVideo && !activeQuizCourse && (
            <div className="space-y-6 animate-fade-in text-xs max-w-5xl mx-auto">
              
              {/* Back breadcrumb */}
              <div>
                <button
                  onClick={() => { setSelectedCourse(null); setActiveVideo(null); }}
                  className="inline-flex items-center gap-1.5 font-bold text-slate-400 hover:text-white transition duration-150 cursor-pointer text-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Exit course to Student Dashboard</span>
                </button>
              </div>

              {/* Course Title metadata card */}
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#98dbc6] font-mono block">Railway Technical Syllabus</span>
                  <h2 className="text-xl font-extrabold tracking-tight mt-1 text-white">{selectedCourse.title} ({selectedCourse.shortTitle})</h2>
                  <p className="text-zinc-400 text-xs mt-1 leading-normal max-w-xl">{selectedCourse.longDescription}</p>
                </div>

                <div className="flex gap-2">
                  <div className="p-3 bg-slate-950 font-mono rounded-xl border border-slate-800 text-center shrink-0 w-24">
                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Lectures Count</span>
                    <span className="text-base font-extrabold text-blue-400 mt-1 block">{selectedCourse.videos.length} components</span>
                  </div>
                  <div className="p-3 bg-slate-950 font-mono rounded-xl border border-slate-800 text-center shrink-0 w-24">
                    <span className="text-slate-500 font-bold block text-[9px] uppercase">Quiz Passing score</span>
                    <span className="text-base font-extrabold text-purple-400 mt-1 block">{selectedCourse.passingScore}% pct</span>
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Video Player + Playlist indices */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Video Player Panel */}
                <div className="lg:col-span-2">
                  <VideoPlayer
                    video={activeVideo}
                    onCompleted={handleVideoCompleted}
                    isAlreadyWatched={(currentUser?.watchedVideos || []).includes(activeVideo.id)}
                    isLightTheme={isLightTheme}
                  />
                </div>

                {/* Column 2: Playlist indices card */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono">Module Syllabus Playlist</h3>
                  
                  <div className="space-y-2 max-h-[440px] overflow-y-auto pr-2 divide-y divide-slate-800/10">
                    {selectedCourse.videos.map((vid, vIdx) => {
                      const isActive = activeVideo.id === vid.id;
                      const isWatched = (currentUser?.watchedVideos || []).includes(vid.id);
                      
                      return (
                        <div
                          key={vid.id}
                          onClick={() => setActiveVideo(vid)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer text-left block w-full outline-none focus:outline-none ${
                            isActive 
                              ? 'bg-blue-600/15 border-blue-500/40 text-white' 
                              : 'bg-slate-900 border-slate-800 text-zinc-400 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-mono text-[10px] text-zinc-500 font-black block">LECTURE 0{vIdx + 1}</span>
                            {isWatched ? (
                              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded text-[9px] font-mono font-bold select-none">
                                Watched
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-950 text-[9px] text-[#2563eb] rounded font-mono font-bold select-none border border-slate-800">
                                Pending
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-xs mt-1.5 leading-snug">{vid.title}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block font-mono">Duration: {vIdx === 0 ? '12:30' : '08:45'} minutes</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* MCQ Assessment unlocked notice block */}
                  {(() => {
                    const completedCount = selectedCourse.videos.filter(v => (currentUser?.watchedVideos || []).includes(v.id)).length;
                    const isSufficient = selectedCourse.videos.length === 0 || completedCount >= 1;
                    const isPassed = (currentUser?.passedQuizzes || []).includes(selectedCourse.id);

                    return (
                      <div className="p-4 bg-[#020617]/70 border border-slate-800 rounded-2xl relative shadow space-y-3">
                        <span className="font-bold block text-slate-350 tracking-tight text-xs uppercase font-mono">Exam Qualification audit</span>
                        
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span>Syllabus Covered:</span>
                          <span className={`${isSufficient ? 'text-green-400 font-black' : 'text-yellow-400 font-semibold'}`}>
                            {selectedCourse.videos.length === 0 ? 100 : Math.round((completedCount / selectedCourse.videos.length) * 100)}% ({completedCount}/{selectedCourse.videos.length} videos)
                          </span>
                        </div>

                        {isPassed ? (
                          <div className="p-2.5 bg-green-500/10 text-green-400 text-xs rounded-xl font-bold flex items-center gap-1.5 border border-green-500/20 leading-snug">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            <span>Qualified: Assessment Passed. Certification registry updated.</span>
                          </div>
                        ) : isSufficient ? (
                          <button
                            onClick={() => setActiveQuizCourse(selectedCourse)}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold font-mono shadow-md shadow-purple-900/35 transition cursor-pointer"
                          >
                            Unlocks Assessment Exam Now
                          </button>
                        ) : (
                          <div className="p-2.5 bg-slate-950 text-slate-500 text-[11px] rounded-xl font-medium flex items-start gap-1.5 border border-slate-800 leading-snug">
                            <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                            <span>Locked: Watch at least one video lesson of this selection to unlock MCQ assessment.</span>
                          </div>
                        )}
                        
                      </div>
                    );
                  })()}

                </div>

              </div>

            </div>
          )}

          {/* -------------------------------------------------------------
              C. MCQ ACTIVE EXAM RUNNING VIEW
              ------------------------------------------------------------- */}
          {activeQuizCourse && (
            <div className="animate-fade-in pt-4">
              <MCQTest
                course={activeQuizCourse}
                questions={questions}
                onFinishTest={handleFinishQuiz}
                onCancel={() => {
                  setAbandonQuizCourseConfirm(true);
                }}
                isLightTheme={isLightTheme}
              />
            </div>
          )}

          {/* Abandon Quiz confirmation modal */}
          {abandonQuizCourseConfirm && activeQuizCourse && (
            <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in">
              <div className={`${isLightTheme ? 'bg-white border text-slate-800 border-slate-200' : 'bg-slate-900 border-slate-850 text-white border-slate-800'} border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-xs animate-scale-up`}>
                <div className="bg-red-600 p-4 text-white flex gap-2.5 items-center">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold tracking-tight">Abandon Active Assessment?</h4>
                </div>
                <div className="p-5 space-y-4 font-sans">
                  <p className="text-sm leading-relaxed">
                    Are you sure you want to abandon progress on the <span className="font-extrabold">{activeQuizCourse.shortTitle}</span> compliance exam? Your active score draft and elapsed time will be discarded.
                  </p>
                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setAbandonQuizCourseConfirm(false)}
                      className={`px-4 py-2 ${isLightTheme ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-zinc-300'} rounded-lg font-bold cursor-pointer`}
                    >
                      No, Keep Testing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAbandonQuizCourseConfirm(false);
                        setActiveQuizCourse(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold cursor-pointer"
                    >
                      Yes, Abandon Exam
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* -------------------------------------------------------------
              E. STUDENT PROFILE & METRICS PAGE VIEW
              ------------------------------------------------------------- */}
          {activeView === 'profile' && !selectedCourse && !activeQuizCourse && (
            <div className="space-y-6 animate-fade-in text-xs">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">Student Internship Dossier</h2>
                  <p className="text-xs text-slate-500 font-mono">Digital Signature Hash validation logs.</p>
                </div>
                
                <span className="px-3.5 py-1.5 bg-slate-900 rounded-xl text-zinc-400 font-mono uppercase tracking-wider font-bold select-none border border-slate-800">
                  Member since {currentUser.joinedDate}
                </span>
              </div>

              {/* Profile Card Banner */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                {/* Dynamic user initials circle */}
                <div className="w-20 h-20 rounded-3xl bg-blue-600 shadow-xl shadow-blue-500/20 text-white font-black text-3xl flex items-center justify-center select-none uppercase">
                  {currentUser.fullName.charAt(0)}
                </div>

                <div className="space-y-1 block text-center md:text-left">
                  <h3 className="text-2xl font-black tracking-tight text-white">{currentUser.fullName}</h3>
                  <p className="font-semibold text-slate-400 font-mono">Email Registry: {currentUser.email}</p>
                  <p className="text-slate-500 font-mono">Official Internship Registration Ref: <span className="font-bold text-blue-500">{currentUser.studentId}</span></p>
                </div>

                <div className="flex gap-2 text-center ml-auto flex-wrap justify-center font-mono">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl w-24">
                    <span className="text-zinc-500 font-bold block text-[9px] uppercase">Videos watched</span>
                    <span className="text-base font-extrabold text-blue-400 block mt-1">{currentUser.watchedVideos?.length || 0} units</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl w-24">
                    <span className="text-zinc-500 font-bold block text-[9px] uppercase">passed exams</span>
                    <span className="text-base font-extrabold text-indigo-400 block mt-1">{currentUser.passedQuizzes?.length || 0} units</span>
                  </div>
                </div>
              </div>

              {/* Certificate Portfolio Listing inside Student Profile */}
              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold tracking-tight uppercase text-slate-300 font-mono flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>My Training Certifications</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Secure, QR-coded digital credentials registered in your name.</p>
                </div>

                {(() => {
                  const studentCerts = certificates.filter(c => c.userId === currentUser.id && !c.isRevoked);
                  if (studentCerts.length === 0) {
                    return (
                      <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-850 text-center text-slate-500 italic font-mono text-[10px]">
                        No credentials earned yet. Pass the MCQ quiz for any course module to register a certificate.
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentCerts.map(cert => (
                        <div key={cert.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between hover:border-slate-800 transition shadow-md">
                          <div className="space-y-1 block text-left">
                            <h4 className="font-bold text-white text-xs leading-snug">{cert.courseName}</h4>
                            <p className="text-[9px] text-zinc-500 font-mono leading-none">Certificate: <span className="text-yellow-500 font-bold">{cert.certificateNumber}</span></p>
                            <p className="text-[9px] text-slate-400">Score: <span className="font-bold text-green-400">{cert.score}%</span> • Issued: {cert.issueDate}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setViewingCertificate(cert)}
                            className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-md shadow-blue-900/35 transition leading-none font-mono"
                          >
                            OPEN CERTIFICATE
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* -------------------------------------------------------------
              F. ADMIN SYSTEM WORKSPACE PAGE VIEW
              ------------------------------------------------------------- */}
          {activeView === 'admin' && currentUser?.role === 'admin' && (
            <div className="animate-fade-in">
              <AdminPanel
                courses={courses}
                questions={questions}
                users={users}
                certificates={certificates}
                onAddVideo={handleAddVideo}
                onEditVideo={handleEditVideo}
                onDeleteVideo={handleDeleteVideo}
                onAddQuestion={handleAddQuestion}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onImportQuestions={handleImportQuestions}
                onUpdateUserStatus={handleUpdateUserStatus}
                onRevokeCertificate={handleRevokeCertificate}
                onIssueCertificate={handleIssueCertificateBypass}
                onAddCourse={handleAddCourse}
                onEditCourse={handleEditCourse}
                onDeleteCourse={handleDeleteCourse}
                isLightTheme={isLightTheme}
              />
            </div>
          )}

        </div>

        {/* Persistent dynamic Toast alert indicator panel at bottom right */}
        {toastMessage && (
          <div id="toast-wrapper" className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl border-2 border-blue-500 shadow-2xl flex items-center gap-3 animate-slide-up text-xs font-mono max-w-sm select-none">
            <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold leading-snug">{toastMessage}</span>
          </div>
        )}

      </div>
    );
  }

// Quick layout grid wrapping elements to allow responsive desktop flows
function GridContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {children}
    </div>
  );
}
