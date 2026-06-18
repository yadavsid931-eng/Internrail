import React, { useState, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Upload, FileJson, Download, Users, Film, Award, BarChart3, 
  Search, Check, X, ShieldAlert, Play, Pause, RefreshCw, Eye, AlertCircle, Trash, HelpCircle,
  Zap, Layers
} from 'lucide-react';
import { Course, Video, MCQQuestion, User, Certificate, UploadQueueItem } from '../types';
import { saveVideoFile } from '../utils/indexedDB';
import { compressImage } from '../utils/compressImage';

interface AdminPanelProps {
  courses: Course[];
  questions: MCQQuestion[];
  users: User[];
  certificates: Certificate[];
  onAddVideo: (video: Video) => void;
  onEditVideo: (video: Video) => void;
  onDeleteVideo: (id: string, courseId: string) => void;
  onAddQuestion: (q: MCQQuestion) => void;
  onEditQuestion: (q: MCQQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onImportQuestions: (imported: MCQQuestion[]) => void;
  onUpdateUserStatus: (userId: string, isActive: boolean) => void;
  onRevokeCertificate: (id: string) => void;
  onIssueCertificate: (userId: string, courseId: string) => void;
  onAddCourse?: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  onDeleteCourse?: (id: string) => void;
  isLightTheme?: boolean;
}

export default function AdminPanel({
  courses,
  questions,
  users,
  certificates,
  onAddVideo,
  onEditVideo,
  onDeleteVideo,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onImportQuestions,
  onUpdateUserStatus,
  onRevokeCertificate,
  onIssueCertificate,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  isLightTheme = false
}: AdminPanelProps) {
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'videos' | 'mcqs' | 'students' | 'certificates' | 'selections'>('analytics');

  // Course management form and modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [cId, setCId] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cShortTitle, setCShortTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cLongDesc, setCLongDesc] = useState('');
  const [cDuration, setCDuration] = useState('10 Hours');
  const [cColor, setCColor] = useState('bg-blue-600');
  const [cPassingScore, setCPassingScore] = useState<number>(80);
  const [cImageUrl, setCImageUrl] = useState('');
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState<{ id: string; title: string } | null>(null);

  // Video metadata form states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [vidCourseId, setVidCourseId] = useState('aaws');
  const [vidTitle, setVidTitle] = useState('');
  const [vidDesc, setVidDesc] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidDuration, setVidDuration] = useState('10:00');
  const [vidCategory, setVidCategory] = useState('Safety Systems');
  const [vidRatio, setVidRatio] = useState<'16:9' | '21:9' | '9:16' | '1:1'>('16:9');

  // Upload Management
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRefs = useRef<Record<string, any>>({});
  const uploadBlobUrls = useRef<Record<string, string>>({});
  const uploadFiles = useRef<Record<string, File>>({});
  const detectedDurations = useRef<Record<string, { seconds: number; str: string }>>({});

  // States for editing uploading asset selections in the queue
  const [editingQueueItemId, setEditingQueueItemId] = useState<string | null>(null);
  const [editQueueFileName, setEditQueueFileName] = useState('');
  const [editQueueCourseId, setEditQueueCourseId] = useState('aaws');
  const [editQueueDuration, setEditQueueDuration] = useState('08:00');

  // Ingest Form States for Local Video File Ingestion
  const [ingestCourseId, setIngestCourseId] = useState('aaws');
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestDesc, setIngestDesc] = useState('');
  const [ingestCategory, setIngestCategory] = useState('Uploaded Assets');
  const [ingestRatio, setIngestRatio] = useState<'16:9' | '21:9' | '9:16' | '1:1'>('16:9');
  const [ingestDuration, setIngestDuration] = useState('06:30');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Question Form states
  const [showMcqModal, setShowMcqModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null);
  const [qCourseId, setQCourseId] = useState('aaws');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qMarks, setQMarks] = useState<number>(5);
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // Student list search
  const [studentRefSearch, setStudentRefSearch] = useState('');
  
  // Custom CSV/JSON Import/Export refs
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Custom dialog confirmations (recreates iframe-blocked window.confirm)
  const [deleteVideoConfirm, setDeleteVideoConfirm] = useState<{ id: string; courseId: string; title: string } | null>(null);
  const [deleteQuestionConfirm, setDeleteQuestionConfirm] = useState<{ id: string; questionText: string } | null>(null);
  const [revokeCertConfirm, setRevokeCertConfirm] = useState<{ id: string; num: string; name: string } | null>(null);

  // Stats calculation
  const totalStudents = users.filter(u => u.role === 'student').length;
  const activeStudents = users.filter(u => u.role === 'student' && u.isActive).length;
  const certificatesIssued = certificates.filter(c => !c.isRevoked).length;
  
  // Mock constant calculations for dashboard
  const avgWatchRate = '92.5%';
  const passRate = '78.4%';
  const avgWatchTime = '22.8 Minutes';

  // -------------------------------------------------------------
  // Video Management Methods
  // -------------------------------------------------------------
  const openVideoAdd = () => {
    setEditingVideo(null);
    setVidCourseId('aaws');
    setVidTitle('');
    setVidDesc('');
    setVidUrl('');
    setVidDuration('10:00');
    setVidCategory('Safety Systems');
    setVidRatio('16:9');
    setShowVideoModal(true);
  };

  const openVideoEdit = (v: Video) => {
    setEditingVideo(v);
    setVidCourseId(v.courseId);
    setVidTitle(v.title);
    setVidDesc(v.description);
    setVidUrl(v.url);
    setVidDuration(v.duration);
    setVidCategory(v.category);
    setVidRatio(v.aspectRatio);
    setShowVideoModal(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle || !vidUrl) return;

    const seconds = parseInt(vidDuration.split(':')[0]) * 60 + (parseInt(vidDuration.split(':')[1]) || 0);

    const videoData: Video = {
      id: editingVideo ? editingVideo.id : 'vid_' + Date.now(),
      courseId: vidCourseId,
      title: vidTitle,
      description: vidDesc,
      url: vidUrl,
      duration: vidDuration,
      durationSeconds: seconds || 600,
      mandatory: true,
      order: editingVideo ? editingVideo.order : (courses.find(c => c.id === vidCourseId)?.videos.length || 0) + 1,
      category: vidCategory,
      aspectRatio: vidRatio
    };

    if (editingVideo) {
      onEditVideo(videoData);
    } else {
      onAddVideo(videoData);
    }
    setShowVideoModal(false);
  };

  // -------------------------------------------------------------
  // Course/Selection Management Methods
  // -------------------------------------------------------------
  const openCourseAdd = () => {
    setEditingCourse(null);
    setCId(`course-${Date.now().toString().slice(-4)}`);
    setCTitle('');
    setCShortTitle('');
    setCDesc('');
    setCLongDesc('');
    setCDuration('12 Hours');
    setCColor('bg-blue-600');
    setCPassingScore(80);
    setCImageUrl('');
    setShowCourseModal(true);
  };

  const openCourseEdit = (c: Course) => {
    setEditingCourse(c);
    setCId(c.id);
    setCTitle(c.title);
    setCShortTitle(c.shortTitle);
    setCDesc(c.description);
    setCLongDesc(c.longDescription || '');
    setCDuration(c.duration);
    setCColor(c.color || 'bg-blue-600');
    setCPassingScore(c.passingScore || 80);
    setCImageUrl(c.imageUrl || '');
    setShowCourseModal(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim() || !cShortTitle.trim()) return;

    const courseObj: Course = {
      id: cId.trim() || `course-${Date.now()}`,
      title: cTitle.trim(),
      shortTitle: cShortTitle.trim().toUpperCase(),
      description: cDesc.trim(),
      longDescription: cLongDesc.trim(),
      duration: cDuration.trim(),
      icon: 'Award',
      color: cColor,
      videos: editingCourse ? editingCourse.videos : [],
      passingScore: Number(cPassingScore) || 80,
      imageUrl: cImageUrl.trim() || undefined
    };

    if (editingCourse) {
      onEditCourse?.(courseObj);
    } else {
      onAddCourse?.(courseObj);
    }
    setShowCourseModal(false);
  };

  const handleCoursePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        const compressed = await compressImage(base64);
        setCImageUrl(compressed);
      }
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // Upload Queue Simulator (Supports up to 1GB mock chunk rates)
  // -------------------------------------------------------------
  const triggerFileInput = () => {
    if (uploadInputRef.current) uploadInputRef.current.click();
  };

  const handleFileDropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: UploadQueueItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const itemId = 'up_' + Date.now() + '_' + i;

      // Store real playable object URL in ref map
      const fileUrl = URL.createObjectURL(file);
      uploadBlobUrls.current[itemId] = fileUrl;
      uploadFiles.current[itemId] = file;

      // Asynchronously detect real video duration
      if (file.type && file.type.startsWith('video/')) {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.src = fileUrl;
        tempVideo.onloadedmetadata = () => {
          const seconds = Math.round(tempVideo.duration) || 480;
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          const str = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
          detectedDurations.current[itemId] = { seconds, str };
        };
        tempVideo.onerror = () => {
          detectedDurations.current[itemId] = { seconds: 480, str: '08:00' };
        };
      } else {
        detectedDurations.current[itemId] = { seconds: 480, str: '08:00' };
      }

      const item: UploadQueueItem = {
        id: itemId,
        fileName: file.name,
        size: Math.ceil(file.size / (1024 * 1024)), // convert to MB
        progress: 0,
        speed: '0 MB/s',
        status: 'uploading',
        categoryId: 'aaws'
      };
      newItems.push(item);
      simulateVideoUpload(itemId);
    }
    setUploadQueue(prev => [...newItems, ...prev]);
  };

  const simulateVideoUpload = (id: string, startProgressValue = 0) => {
    let currentProgress = startProgressValue;
    
    // Clear existing interval if any
    if (uploadTimerRefs.current[id]) {
      clearInterval(uploadTimerRefs.current[id]);
    }

    uploadTimerRefs.current[id] = setInterval(() => {
      // Speed random variation (e.g. 25 MB/s to 95 MB/s)
      const mockSpeed = (Math.random() * 70 + 25).toFixed(1) + ' MB/s';
      currentProgress += Math.floor(Math.random() * 15) + 5;

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(uploadTimerRefs.current[id]);
        
        // Auto add video configuration on complete simulation!
        setUploadQueue(prev => prev.map(item => {
          if (item.id === id) {
            const maybeBlobUrl = uploadBlobUrls.current[id] || 'https://www.youtube.com/embed/5F_f3M-V748';
            const detected = detectedDurations.current[id] || { seconds: 480, str: '08:00' };
            const targetCourseId = item.categoryId || 'aaws';
            const newVideoId = 'vid_' + Date.now() + '_' + Math.floor(Math.random()*100);

            // Persist the real file into IndexedDB
            const fileObj = uploadFiles.current[id];
            if (fileObj) {
              saveVideoFile(newVideoId, fileObj);
            }

            // Trigger saving a mock video to active list
            onAddVideo({
              id: newVideoId,
              courseId: targetCourseId,
              title: item.fileName.split('.')[0] + ' (Uploaded Log)',
              description: `Syllabus video of type video/mp4 uploaded on ${new Date().toLocaleDateString()}. Data parcel size: ${item.size} MB.`,
              url: maybeBlobUrl,
              duration: detected.str,
              durationSeconds: detected.seconds,
              mandatory: true,
              order: (courses.find(c => c.id === targetCourseId)?.videos.length || 0) + 1,
              category: 'Uploaded Assets',
              aspectRatio: '16:9'
            });
            return { ...item, progress: 100, speed: '0 MB/s', status: 'completed' };
          }
          return item;
        }));
      } else {
        setUploadQueue(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, progress: currentProgress, speed: mockSpeed };
          }
          return item;
        }));
      }
    }, 400);
  };

  const pauseUpload = (id: string) => {
    if (uploadTimerRefs.current[id]) {
      clearInterval(uploadTimerRefs.current[id]);
    }
    setUploadQueue(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'paused', speed: '0 MB/s' };
      }
      return item;
    }));
  };

  const resumeUpload = (id: string) => {
    const item = uploadQueue.find(i => i.id === id);
    if (!item) return;

    setUploadQueue(prev => prev.map(i => {
      if (i.id === id) return { ...i, status: 'uploading' };
      return i;
    }));
    simulateVideoUpload(id, item.progress);
  };

  const removeUploadItem = (id: string) => {
    if (uploadTimerRefs.current[id]) {
      clearInterval(uploadTimerRefs.current[id]);
    }
    setUploadQueue(prev => prev.filter(i => i.id !== id));
  };

  const handleIngestFileSelect = (file: File) => {
    setSelectedUploadFile(file);
    // Prefill title with clean file name
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setIngestTitle(cleanName);
    
    if (file.type) {
      setIngestCategory(`${file.type.split('/')[1]?.toUpperCase() || 'VIDEO'} Ingest`);
    } else {
      setIngestCategory('Local Video Ingest');
    }

    // Automatically detect manual video input file duration
    if (file.type && file.type.startsWith('video/')) {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const tempUrl = URL.createObjectURL(file);
      tempVideo.src = tempUrl;
      tempVideo.onloadedmetadata = () => {
        const seconds = Math.round(tempVideo.duration) || 390;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const str = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        setIngestDuration(str);
        // Clean up URL safely
        URL.revokeObjectURL(tempUrl);
      };
      tempVideo.onerror = () => {
        URL.revokeObjectURL(tempUrl);
      };
    }
  };

  const handleStartIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFile || !ingestTitle) return;

    const file = selectedUploadFile;
    const uploadId = 'up_' + Date.now();
    const sizeMB = Math.ceil(file.size / (1024 * 1024)) || 10;
    
    // Create local Object URL so the video player can play this exact file in-session!
    const localBlobUrl = URL.createObjectURL(file);

    const queueItem: UploadQueueItem = {
      id: uploadId,
      fileName: file.name,
      size: sizeMB,
      progress: 0,
      speed: '0 MB/s',
      status: 'uploading',
      categoryId: ingestCourseId
    };

    setUploadQueue(prev => [queueItem, ...prev]);

    let currentProgress = 0;
    if (uploadTimerRefs.current[uploadId]) {
      clearInterval(uploadTimerRefs.current[uploadId]);
    }

    uploadTimerRefs.current[uploadId] = setInterval(() => {
      const mockSpeed = (Math.random() * 90 + 20).toFixed(1) + ' MB/s';
      currentProgress += Math.floor(Math.random() * 12) + 8; // fast, satisfying upload speed

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(uploadTimerRefs.current[uploadId]);

        const durationSeconds = parseInt(ingestDuration.split(':')[0]) * 60 + (parseInt(ingestDuration.split(':')[1]) || 0) || 390;
        const newVideoId = 'vid_' + Date.now();

        // Save real file to IndexedDB
        saveVideoFile(newVideoId, file);

        onAddVideo({
          id: newVideoId,
          courseId: ingestCourseId,
          title: ingestTitle,
          description: ingestDesc || `Syllabus video of type ${file.type || 'video/unknown'} uploaded on ${new Date().toLocaleDateString()}. Data parcel size: ${sizeMB} MB.`,
          url: localBlobUrl, 
          duration: ingestDuration,
          durationSeconds: durationSeconds,
          mandatory: true,
          order: (courses.find(c => c.id === ingestCourseId)?.videos.length || 0) + 1,
          category: ingestCategory,
          aspectRatio: ingestRatio
        });

        setUploadQueue(prev => prev.map(item => {
          if (item.id === uploadId) {
            return { ...item, progress: 100, speed: '0 MB/s', status: 'completed' as const };
          }
          return item;
        }));

        // Reset local form states
        setSelectedUploadFile(null);
        setIngestTitle('');
        setIngestDesc('');
        setIngestDuration('06:30');
      } else {
        setUploadQueue(prev => prev.map(item => {
          if (item.id === uploadId) {
            return { ...item, progress: currentProgress, speed: mockSpeed };
          }
          return item;
        }));
      }
    }, 250);
  };

  // -------------------------------------------------------------
  // MCQ Management methods
  // -------------------------------------------------------------
  const openMcqAdd = () => {
    setEditingQuestion(null);
    setQCourseId('aaws');
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrect(0);
    setQExplanation('');
    setQMarks(5);
    setQDifficulty('Medium');
    setShowMcqModal(true);
  };

  const openMcqEdit = (q: MCQQuestion) => {
    setEditingQuestion(q);
    setQCourseId(q.courseId);
    setQText(q.question);
    setQOptions([...q.options]);
    setQCorrect(q.correctAnswer);
    setQExplanation(q.explanation);
    setQMarks(q.marks);
    setQDifficulty(q.difficulty);
    setShowMcqModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText || qOptions.some(o => !o)) return;

    const questionData: MCQQuestion = {
      id: editingQuestion ? editingQuestion.id : 'q_' + Date.now(),
      courseId: qCourseId,
      question: qText,
      options: [...qOptions],
      correctAnswer: qCorrect,
      explanation: qExplanation,
      marks: qMarks,
      difficulty: qDifficulty
    };

    if (editingQuestion) {
      onEditQuestion(questionData);
    } else {
      onAddQuestion(questionData);
    }
    setShowMcqModal(false);
  };

  // MCQ Import / Export using JSON uploads
  const handleExportQuestions = () => {
    const rawData = JSON.stringify(questions, null, 2);
    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InternRail_MCQ_Questions_Master.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedArray = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedArray)) {
          onImportQuestions(importedArray);
          alert(`Successfully loaded ${importedArray.length} questions into the assessment cache!`);
        } else {
          alert('Incorrect format. File must contain a valid array of MCQ questions.');
        }
      } catch (err) {
        alert('Failed parsing. Verify file holds valid structural JSON format.');
      }
    };
    reader.readAsText(file);
  };

  // Filter rosters
  const filteredStudents = users.filter(usr => {
    if (usr.role !== 'student') return false;
    const matchesSearch = usr.fullName.toLowerCase().includes(studentRefSearch.toLowerCase()) ||
                          usr.email.toLowerCase().includes(studentRefSearch.toLowerCase()) ||
                          usr.studentId.toLowerCase().includes(studentRefSearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className={`p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 ${
      isLightTheme ? 'text-slate-800' : 'text-white'
    }`}>
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Management Suite</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Access Level: Approved Supervisor System Portal (Indian Railways Div.)
          </p>
        </div>
        
        {/* Toggle subtabs bar */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 max-w-max text-xs font-mono">
          {[
            { id: 'analytics', label: 'Analytics Hub', icon: BarChart3 },
            { id: 'selections', label: 'Course Selections', icon: Award },
            { id: 'videos', label: 'Videos', icon: Film },
            { id: 'mcqs', label: 'MCQs Desk', icon: HelpCircle },
            { id: 'students', label: 'Students List', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition font-semibold cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white font-extrabold' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          1. ANALYTICS HUB VIEW
          ------------------------------------------------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Quick numbers widget */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: 'stat-students', label: 'Total Enrolled Interns', value: totalStudents, desc: `${activeStudents} Active Internships`, icon: Users, color: 'text-sky-400' },
              { id: 'stat-watch', label: 'Avg Watch Completes', value: avgWatchRate, desc: 'Rule check minimum 90%', icon: Film, color: 'text-indigo-400' },
              { id: 'stat-pass', label: 'Assessment Pass Ratio', value: passRate, desc: 'Passing index metric', icon: HelpCircle, color: 'text-emerald-400' }
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative shadow-md">
                  <div className="absolute top-4 right-4 p-2 bg-slate-950 rounded-xl">
                    <Icon className={`w-5 h-5 ${st.color}`} />
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">{st.label}</span>
                  <span className="block text-2xl font-black font-mono tracking-tight text-white mt-1.5">{st.value}</span>
                  <span className="text-[10px] text-zinc-500 block font-semibold mt-1">{st.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Graphical custom SVG displays */}
          <div className="w-full">
            
            {/* Chart 1: Course Completion rates via inline elegant reactive SVG bars */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative shadow-md">
              <span className="text-slate-400 font-bold block text-sm tracking-tight mb-4">Course Module Completion Density (%)</span>
              
              <div className="space-y-4">
                {courses.map((cr, idx) => {
                  const completions = idx === 0 ? 88 : idx === 1 ? 65 : idx === 2 ? 40 : idx === 3 ? 15 : 8;
                  return (
                    <div key={cr.id} className="text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono mb-2 text-slate-300">
                        <span className="font-bold leading-snug">{cr.shortTitle} — {cr.title}</span>
                        <span className="font-extrabold text-blue-400 shrink-0 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[11px] sm:text-xs">
                          {completions}% Complete Ratio
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${completions}%`,
                            backgroundColor: cr.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          1.5 COURSE SELECTIONS MANAGEMENT
          ------------------------------------------------------------- */}
      {activeTab === 'selections' && (
        <div className="space-y-6 animate-fade-in text-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Manage Training Syllabus Selections</h3>
              <p className="text-slate-500 text-xs font-mono mt-0.5">
                Create, customize, and add photos/coverage visuals to railway training modules.
              </p>
            </div>
            <button 
              onClick={openCourseAdd}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 font-bold py-2 bg-blue-600 text-white text-xs rounded-xl hover:bg-blue-500 active:scale-95 transition cursor-pointer shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4 hover:rotate-90 transition-transform" />
              <span>Add New Selection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(cr => {
              const vCount = cr.videos ? cr.videos.length : 0;
              return (
                <div 
                  key={cr.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group relative hover:border-slate-700 transition"
                >
                  {/* Photo Preview Cover */}
                  <div className="h-40 bg-slate-950 relative flex items-center justify-center overflow-hidden border-b border-slate-950">
                    {cr.imageUrl ? (
                      <img 
                        src={cr.imageUrl} 
                        alt={cr.title} 
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
                        <span className="text-slate-700 text-xs font-mono">No Cover Photo Assigned</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />

                    {/* Quick Badge */}
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                      {cr.shortTitle}
                    </div>

                    {/* Direct Image Controller buttons */}
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => {
                          const url = prompt("Enter Web Image URL for this training selection:", cr.imageUrl || "");
                          if (url !== null) {
                            onEditCourse?.({ ...cr, imageUrl: url });
                          }
                        }}
                        type="button"
                        className="px-2 py-1 bg-black/85 hover:bg-black text-[9px] text-white rounded font-bold transition flex items-center gap-1 border border-white/20 shadow"
                        title="Set web image URL"
                      >
                        📸 URL
                      </button>

                      <label
                        className="px-2 py-1 bg-black/85 hover:bg-black text-[9px] text-white rounded font-bold transition flex items-center gap-1 border border-white/20 shadow cursor-pointer text-center"
                        title="Upload Cover Photo"
                      >
                        📁 File
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                const base64 = ev.target?.result as string;
                                if (base64) {
                                  const compressed = await compressImage(base64);
                                  onEditCourse?.({ ...cr, imageUrl: compressed });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 z-10 flex justify-between items-end">
                      <span className="text-white font-extrabold tracking-tight text-sm drop-shadow-md">{cr.title}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">{cr.description || "No description provided."}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2 text-[10px] text-zinc-500 font-mono">
                        <span className="bg-slate-950 px-2.5 py-0.5 rounded text-slate-400 border border-slate-900">
                          ⏱️ {cr.duration || "N/A"}
                        </span>
                        <span className="bg-slate-950 px-2.5 py-0.5 rounded text-slate-400 border border-slate-900">
                          🎯 Passing: {cr.passingScore || 80}%
                        </span>
                        <span className="bg-slate-950 px-2.5 py-0.5 rounded text-indigo-400 border border-slate-900 font-bold">
                          🎬 {vCount} Videos
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-slate-800/60 pt-3">
                      <button
                        onClick={() => openCourseEdit(cr)}
                        type="button"
                        className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition inline-flex items-center justify-center gap-1.5 cursor-pointer space-x-1"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        onClick={() => {
                          setDeleteCourseConfirm({ id: cr.id, title: cr.title });
                        }}
                        type="button"
                        className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition inline-flex items-center justify-center gap-1 cursor-pointer"
                        title="Delete Selection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          2. VIDEO MANAGEMENT SUBSECTION
          ------------------------------------------------------------- */}
      {activeTab === 'videos' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Active Training Syllabus Videos</h3>
              <p className="text-xs text-slate-500 leading-normal">Assign mandatory instructional videos categorized across the five systems.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={openVideoAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-blue-900/30"
              >
                <Plus className="w-4 h-4" />
                <span>Configure New Video link</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Syllabus folders (cols 7) */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Configured Video Lessons</h4>
              {courses.map(cr => {
                const courseVideos = cr.videos;
                return (
                  <div key={cr.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative shadow-sm">
                    <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                      <span className="font-extrabold text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cr.color }} />
                        <span>{cr.title} ({cr.shortTitle}) Syllabus</span>
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">{courseVideos.length} Videos Configured</span>
                    </div>

                    {courseVideos.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500 italic">No videos in this module registry.</div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {courseVideos.map((v) => (
                          <div key={v.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                            <div className="min-w-0 flex-1">
                              <div>
                                <span className="bg-slate-950 font-bold px-2 py-0.5 rounded text-[9px] text-zinc-400 font-mono inline-block mr-2 border border-slate-800">ORDER {v.order}</span>
                                <span className="font-bold text-slate-200">{v.title}</span>
                                <span className="text-slate-500 ml-2 font-mono text-[10px]/tight font-semibold">({v.duration} Duration • aspect: {v.aspectRatio})</span>
                              </div>
                              <p className="text-slate-400 mt-1 pl-1 leading-relaxed truncate" title={v.description}>{v.description}</p>
                            </div>

                            <div className="flex gap-1 items-center shrink-0 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => openVideoEdit(v)}
                                className="p-1 px-2 bg-slate-800 hover:bg-slate-705 text-slate-350 rounded border border-slate-700 hover:text-white transition cursor-pointer"
                                title="Edit particulars"
                              >
                                <Edit2 className="w-3 h-3 inline mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => setDeleteVideoConfirm({ id: v.id, courseId: cr.id, title: v.title })}
                                className="p-1 px-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded border border-red-900/30 transition cursor-pointer"
                                title="Strip item"
                              >
                                <Trash2 className="w-3 h-3 inline" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Right Column: Local Video File Ingestor / Progress list (cols 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative shadow-md">
                <div className="flex justify-between items-center mb-3 pb-1 border-b border-white/5">
                  <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Local Video File Ingestor</span>
                  </h4>
                  <span className="text-[9px] bg-blue-500/10 text-blue-400 font-mono font-bold px-2 py-0.5 rounded border border-blue-500/20">DB Storage</span>
                </div>
                
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  Upload a local training video (MP4, WebM, etc.). The file is saved inside indexedDB on this browser, auto-resolving dynamically as a playable resource for any registered learner.
                </p>

                {/* Dropzone container */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleIngestFileSelect(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-500/5' 
                      : selectedUploadFile 
                        ? 'border-emerald-500 bg-emerald-500/5' 
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                  onClick={() => {
                    const el = document.getElementById('video-ingest-file');
                    if (el) el.click();
                  }}
                >
                  <input
                    type="file"
                    id="video-ingest-file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIngestFileSelect(file);
                    }}
                  />
                  {selectedUploadFile ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs truncate max-w-xs mx-auto">{selectedUploadFile.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {(selectedUploadFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedUploadFile.type || 'video/mp4'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedUploadFile(null);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline"
                      >
                        Change Selected File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto hover:bg-slate-700 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-300 text-xs text-center">Drag & drop video here, or click to choose</p>
                        <p className="text-[10px] text-slate-500 mt-1">Supports standard MP4, Mov, or WebM media formats</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form fields if file is selected */}
                {selectedUploadFile && (
                  <form onSubmit={handleStartIngest} className="mt-4 space-y-3.5 pt-3 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <span className="block text-[9px] text-slate-500 font-mono mb-1">AUTO-INGESTION METADATA DETAILS</span>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Lesson Video Title
                      </label>
                      <input
                        type="text"
                        required
                        value={ingestTitle}
                        onChange={(e) => setIngestTitle(e.target.value)}
                        placeholder="e.g. Neutral Zone Relay Basics"
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          Target Selection Course
                        </label>
                        <select
                          value={ingestCourseId}
                          onChange={(e) => setIngestCourseId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs"
                        >
                          {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.shortTitle}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          Video Playback Length
                        </label>
                        <input
                          type="text"
                          required
                          value={ingestDuration}
                          onChange={(e) => setIngestDuration(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          In-Syllabus Category Tag
                        </label>
                        <input
                          type="text"
                          required
                          value={ingestCategory}
                          onChange={(e) => setIngestCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                          Ratio Frame Box
                        </label>
                        <select
                          value={ingestRatio}
                          onChange={(e) => setIngestRatio(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs font-mono"
                        >
                          <option value="16:9">Widescreen (16:9)</option>
                          <option value="4:3">Square Box (4:3)</option>
                          <option value="9:16">Vertical Portrait (9:16)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                        Short Topic Description
                      </label>
                      <textarea
                        value={ingestDesc}
                        onChange={(e) => setIngestDesc(e.target.value)}
                        placeholder="Explain training highlights, relay points, check procedures..."
                        className="w-full h-14 bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 text-xs outline-none leading-normal"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Ingest into Local Catalog</span>
                    </button>
                  </form>
                )}
              </div>

              {/* ACTIVE UPLOAD THREAD QUEUE PREVIEW */}
              {uploadQueue.length > 0 && (
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative shadow-md text-xs space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-white/5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Active Ingestion Threads</span>
                    </span>
                    <button
                      onClick={() => setUploadQueue([])}
                      className="text-[10px] text-slate-500 hover:text-slate-400 hover:underline cursor-pointer"
                    >
                      Dismiss Thread Queue
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {uploadQueue.map(item => (
                      <div key={item.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850/80 space-y-2 text-[11px]">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-200 truncate" title={item.fileName}>
                              {item.fileName}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              Size: {item.size} MB • Speed: {item.speed} • Module Index: {courses.find(c => c.id === item.categoryId)?.shortTitle || 'Generic'}
                            </p>
                          </div>
                          
                          <div className="flex gap-1 items-center">
                            {item.status === 'uploading' && (
                              <button
                                onClick={() => pauseUpload(item.id)}
                                className="p-1 hover:bg-slate-800 text-amber-400 rounded transition cursor-pointer"
                                title="Pause Upload"
                              >
                                <Pause className="w-3 h-3" />
                              </button>
                            )}
                            {item.status === 'paused' && (
                              <button
                                onClick={() => resumeUpload(item.id)}
                                className="p-1 hover:bg-slate-800 text-emerald-400 rounded transition cursor-pointer"
                                title="Resume Upload"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => removeUploadItem(item.id)}
                              className="p-1 hover:bg-slate-800 text-red-400 rounded transition cursor-pointer"
                              title="Discard"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Progress slider bar elements */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                item.status === 'completed'
                                  ? 'bg-emerald-500' 
                                  : item.status === 'paused'
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                            <span className="font-bold uppercase tracking-wider">
                              {item.status === 'completed' ? 'Ingest Success (Synced)' : item.status === 'paused' ? 'Suspended' : 'Saving...'}
                            </span>
                            <span className="font-bold">{item.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          3. MCQ MANAGEMENT SUBSECTION
          ------------------------------------------------------------- */}
      {activeTab === 'mcqs' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Active Assessment MCQ Database</h3>
              <p className="text-xs text-slate-500 leading-normal">Maintain single-answer questions randomized across exam profiles.</p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={openMcqAdd}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-blue-900/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add New MCQ</span>
              </button>
            </div>
          </div>

          {/* Current questions database layout filtered list */}
          <div className="space-y-4">
            {courses.map(cr => {
              const courseQuestions = questions.filter(q => q.courseId === cr.id);
              return (
                <div key={cr.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl relative shadow-sm">
                  
                  <div className="flex justify-between items-center mb-3.5 border-b border-white/5 pb-2">
                    <span className="font-extrabold text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cr.color }} />
                      <span>{cr.shortTitle} Assessment Bank</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">{courseQuestions.length} Items</span>
                  </div>

                  {courseQuestions.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500 italic">No assessment questions configured for this module.</div>
                  ) : (
                    <div className="divide-y divide-slate-800 space-y-4 pt-1">
                      {courseQuestions.map((q, idx) => (
                        <div key={q.id} className="pt-3 block text-xs">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex gap-2 items-center">
                                <span className="px-1.5 py-0.5 bg-slate-950 text-[10px] text-zinc-400 rounded-sm font-mono tracking-wider uppercase font-bold border border-slate-800">Q#{idx+1}</span>
                                <span className={`px-2 py-0.5 text-[9px] rounded-lg font-mono uppercase font-bold ${
                                  q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                                  q.difficulty === 'Medium' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {q.difficulty} ({q.marks} Marks)
                                </span>
                              </div>
                              <p className="font-bold text-slate-200 text-sm mt-1">{q.question}</p>
                            </div>

                            <div className="flex gap-1 items-center shrink-0 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => openMcqEdit(q)}
                                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded border border-slate-700 hover:text-white transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => setDeleteQuestionConfirm({ id: q.id, questionText: q.question })}
                                className="p-1 px-2 bg-red-650/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded border border-red-900/30 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Options display list */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3.5">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correctAnswer === oIdx;
                              return (
                                <div 
                                  key={oIdx} 
                                  className={`p-2 rounded border font-semibold flex items-center gap-2 ${
                                    isCorrect 
                                      ? 'bg-green-500/10 border-green-500/30 text-green-400 font-extrabold' 
                                      : 'bg-slate-950/45 border-slate-800 text-zinc-400'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isCorrect ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </div>
                                  <span className="truncate">{opt}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation display bar */}
                          <div className="mt-2.5 p-2 bg-slate-950/70 border border-slate-800/60 rounded-lg text-slate-500 italic max-w-4xl text-[11px] leading-relaxed">
                            <span className="font-bold text-zinc-400 not-italic">Answer Explanation:</span> {q.explanation}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          4. STUDENT LEDGER VIEW
          ------------------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Student Intern Registry</h3>
              <p className="text-xs text-slate-500 leading-normal">Suspend, activate, or audit student learning status and quiz outputs.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={studentRefSearch}
                onChange={(e) => setStudentRefSearch(e.target.value)}
                placeholder="Search by ID, name, email..."
                className="w-full bg-slate-950 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-slate-800 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#020617]/55 border-b border-slate-800 font-mono tracking-wider uppercase text-[10px] text-zinc-500">
                  <tr>
                    <th className="p-4">Candidate Identification</th>
                    <th className="p-4">Joined On</th>
                    <th className="p-4">Verified Videos</th>
                    <th className="p-4">Passed Quizzes</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center italic text-slate-500">No matching candidate registries found.</td>
                    </tr>
                  ) : (
                    filteredStudents.map(std => {
                      const completePct = std.progress ? Object.keys(std.progress).length * 20 : 0;
                      return (
                        <tr key={std.id} className="hover:bg-slate-950/45 transition">
                          <td className="p-4">
                            <span className="font-bold text-white block text-sm">{std.fullName}</span>
                            <span className="text-[10px] text-zinc-500 block font-mono">ID: {std.studentId} • {std.email}</span>
                          </td>
                          <td className="p-4 font-mono text-zinc-400">{std.joinedDate}</td>
                          <td className="p-4">
                            <span className="font-bold font-mono text-blue-400">{std.watchedVideos?.length || 0} Components</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold font-mono text-emerald-400">{std.passedQuizzes?.length || 0} Systems passed</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                              std.isActive 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {std.isActive ? 'Active Intern' : 'SUSPENDED'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex gap-1.5">
                              {std.isActive ? (
                                <button
                                  onClick={() => onUpdateUserStatus(std.id, false)}
                                  className="px-2.5 py-1 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded font-bold transition cursor-pointer"
                                  title="Revoke access"
                                >
                                  Suspend Account
                                </button>
                              ) : (
                                <button
                                  onClick={() => onUpdateUserStatus(std.id, true)}
                                  className="px-2.5 py-1 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded font-bold transition cursor-pointer"
                                  title="Allow access"
                                >
                                  Activate
                                </button>
                              )}
                              
                              {/* Bypass manual issue certificates */}
                              <div className="relative group/issue flex items-center">
                                <button className="px-2.5 py-1 bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 rounded font-black cursor-pointer">
                                  Bypass Grant
                                </button>
                                <div className="absolute bottom-6 right-0 hidden group-hover/issue:flex flex-col bg-slate-950 border border-slate-800 rounded shadow-xl overflow-hidden min-w-[130px] text-zinc-400 text-[10px] font-mono text-left z-30">
                                  <span className="px-2 py-1 text-slate-500 font-bold border-b border-white/5 uppercase">Select System:</span>
                                  {courses.map(c => !std.passedQuizzes.includes(c.id) && (
                                    <button
                                      key={c.id}
                                      onClick={() => {
                                        onIssueCertificate(std.id, c.id);
                                        alert(`Manually generated ${c.shortTitle} completion credential for ${std.fullName}!`);
                                      }}
                                      className="px-2 py-1 hover:bg-blue-600 hover:text-white"
                                    >
                                      Grant {c.shortTitle} Cert
                                    </button>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          5. CERTIFICATES REGISTRY LEDGER
          ------------------------------------------------------------- */}
      {activeTab === 'certificates' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Crytograph Certificate Registry</h3>
            <p className="text-xs text-slate-500 leading-normal">Inspect issued credentials, query secure QR hashes, or revoke completed certificates for audits.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#020617]/55 border-b border-slate-800 font-mono tracking-wider uppercase text-[10px] text-zinc-500">
                  <tr>
                    <th className="p-4">Certificate Id Ref</th>
                    <th className="p-4">Recipient Intern</th>
                    <th className="p-4">Course Title Code</th>
                    <th className="p-4">Performance</th>
                    <th className="p-4">Date Issued</th>
                    <th className="p-4 text-right">Certificate Revocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center italic text-slate-500">No official certificates have been logged in the registry ledger yet.</td>
                    </tr>
                  ) : (
                    certificates.map(cert => (
                      <tr key={cert.id} className="hover:bg-slate-950/45 transition">
                        <td className="p-4 font-mono font-bold text-yellow-500">{cert.certificateNumber}</td>
                        <td className="p-4">
                          <span className="font-bold text-slate-200 block">{cert.userName}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">ID: {cert.userStudentId}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-300">{cert.courseName}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold font-mono text-green-400">{cert.score}% Correct Score</span>
                        </td>
                        <td className="p-4 text-zinc-400 font-mono">{cert.issueDate}</td>
                        <td className="p-4 text-right">
                          {cert.isRevoked ? (
                            <span className="inline-flex gap-1 items-center font-bold font-mono uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              <AlertCircle className="w-3.5 h-3.5" /> Revoked Null-Hash
                            </span>
                          ) : (
                            <button
                              onClick={() => setRevokeCertConfirm({ id: cert.id, num: cert.certificateNumber, userName: cert.userName })}
                              className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded hover:text-red-300 font-mono font-bold border border-red-900/30 transition cursor-pointer"
                            >
                              Revoke & Block Hash
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          COURSE / SELECTION FORM MODAL
          ------------------------------------------------------------- */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-xs animate-scale-up">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h4 className="text-sm font-bold tracking-tight">
                {editingCourse ? 'Modify Course Selection' : 'Create New Training Selection'}
              </h4>
              <button 
                onClick={() => setShowCourseModal(false)} 
                type="button"
                className="text-white hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-5 space-y-4 text-zinc-300 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Unique Code ID (Slug)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCourse}
                    value={cId}
                    onChange={(e) => setCId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="e.g. dynamic-aux"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none disabled:opacity-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Compact Acronym</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={cShortTitle}
                    onChange={(e) => setCShortTitle(e.target.value)}
                    placeholder="e.g. AAWS"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Full Selection Title</label>
                <input
                  type="text"
                  required
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  placeholder="e.g. Advanced Auxiliary Warning System"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Main Description Overview</label>
                <textarea
                  required
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="Enter a brief, eye-catching summary of this training course..."
                  className="w-full h-16 bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none leading-normal"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Detailed Long Description (Optional)</label>
                <textarea
                  value={cLongDesc}
                  onChange={(e) => setCLongDesc(e.target.value)}
                  placeholder="Provide supplementary guidelines, curriculum overview, syllabus lists..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none leading-normal"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Syllabus Duration</label>
                  <input
                    type="text"
                    required
                    value={cDuration}
                    onChange={(e) => setCDuration(e.target.value)}
                    placeholder="e.g. 12 Hours"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Passing Score (%)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={100}
                    value={cPassingScore}
                    onChange={(e) => setCPassingScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Accent Color Theme</label>
                  <select
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono"
                  >
                    <option value="bg-blue-600">Blue Accent</option>
                    <option value="bg-indigo-600">Indigo Accent</option>
                    <option value="bg-violet-600">Violet Accent</option>
                    <option value="bg-fuchsia-600">Fuchsia Accent</option>
                    <option value="bg-emerald-600">Emerald Green</option>
                    <option value="bg-cyan-600">Cyan Blue</option>
                    <option value="bg-amber-600">Amber Yellow</option>
                  </select>
                </div>
              </div>

              {/* Photo Uploading Section */}
              <div className="border border-slate-800 bg-slate-950/60 p-3 rounded-xl space-y-3">
                <span className="block text-[10px] font-mono tracking-wider uppercase font-bold text-slate-400">Assign Cover Image / Photo Choice</span>
                
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1.5 font-sans">
                    <label className="block text-[9px] text-slate-500 font-mono">By Web Address (URL):</label>
                    <input
                      type="url"
                      value={cImageUrl}
                      onChange={(e) => setCImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono text-[10px]"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="block text-[9px] text-slate-500 font-mono">By Local Photo File Upload:</label>
                    <label className="px-3 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-850 text-white font-bold rounded-lg cursor-pointer transition text-center text-[11px] block">
                      📁 Select image file
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleCoursePhotoUpload(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Cover Live Preview */}
                {cImageUrl && (
                  <div className="mt-2 text-center">
                    <span className="block text-[9px] text-slate-500 mb-1 font-mono">Immediate Visual Preview:</span>
                    <div className="h-28 rounded-lg overflow-hidden border border-slate-800 bg-black relative">
                      <img 
                        src={cImageUrl} 
                        alt="Course Preview" 
                        className="w-full h-full object-cover opacity-80" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-805 text-zinc-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow shadow-blue-600/20"
                >
                  {editingCourse ? 'Save Changes' : 'Create Selection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VIDEO MODAL DESIGN
          ------------------------------------------------------------- */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-xs animate-scale-up">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h4 className="text-sm font-bold tracking-tight">
                {editingVideo ? 'Modify Active Core Video' : 'Add New Training Video Component'}
              </h4>
              <button onClick={() => setShowVideoModal(false)} className="text-white hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="p-5 space-y-4 text-zinc-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Belongs to Course Module</label>
                  <select
                    value={vidCourseId}
                    onChange={(e) => setVidCourseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.shortTitle} — {c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Aspect Ratio Wrapper</label>
                  <select
                    value={vidRatio}
                    onChange={(e) => setVidRatio(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono"
                  >
                    <option value="16:9">Horizontal (16:9)</option>
                    <option value="21:9">Cinema Widescreen (21:9)</option>
                    <option value="9:16">Vertical (9:16 - Shorts style)</option>
                    <option value="1:1">Square (1:1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Video Headline Title</label>
                <input
                  type="text"
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder="e.g. Neutral Zone Vacuum Breaker Relay alignment"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">YouTube Embed, HLS Stream, or Webm/MP4 Video Url</label>
                <input
                  type="text"
                  required
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  placeholder="HLS (.m3u8), embedding address or local path"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Video Duration (mm:ss)</label>
                  <input
                    type="text"
                    required
                    value={vidDuration}
                    onChange={(e) => setVidDuration(e.target.value)}
                    placeholder="e.g. 12:30"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Category Tag</label>
                  <input
                    type="text"
                    required
                    value={vidCategory}
                    onChange={(e) => setVidCategory(e.target.value)}
                    placeholder="e.g. Safety Systems, Hardware"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Short Description Overview</label>
                <textarea
                  value={vidDesc}
                  onChange={(e) => setVidDesc(e.target.value)}
                  placeholder="Particular details relating to safety procedures, rules checklists..."
                  className="w-full h-16 bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none leading-normal text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-zinc-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Save Video Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MCQ MODAL DESIGN
          ------------------------------------------------------------- */}
      {showMcqModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-xs animate-scale-up">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h4 className="text-sm font-bold tracking-tight">
                {editingQuestion ? 'Edit MCQ Question' : 'Formulate New Single-Choice Assessment Card'}
              </h4>
              <button onClick={() => setShowMcqModal(false)} className="text-white hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 space-y-4 text-zinc-300 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Under Course Module</label>
                  <select
                    value={qCourseId}
                    onChange={(e) => setQCourseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.shortTitle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Difficulty Grade</label>
                  <select
                    value={qDifficulty}
                    onChange={(e) => setQDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Marks Score Value</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={qMarks}
                    onChange={(e) => setQMarks(parseInt(e.target.value) || 5)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Assessable Question Prompt Text</label>
                <textarea
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="e.g. Which electrical component protects traction collectors from short phase sparks?"
                  className="w-full h-14 bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs leading-normal"
                />
              </div>

              {/* Options mapping */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider font-mono text-slate-400">Option Text Parameters & Correct Switch</span>
                {qOptions.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  return (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <div className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold font-mono text-zinc-500">{letter}</div>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[oIdx] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${letter} text`}
                        className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setQCorrect(oIdx)}
                        className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-[10px] active:scale-95 transition ${
                          qCorrect === oIdx 
                            ? 'bg-green-600 text-white border-green-500' 
                            : 'bg-slate-950 border-slate-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {qCorrect === oIdx ? 'CORRECT' : 'SELECT'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-slate-400">Post-Quiz Response Correct Answer Explanation</label>
                <textarea
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Reference material explaining why the chosen option is correct..."
                  className="w-full h-14 bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-blue-500 outline-none text-xs leading-normal"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowMcqModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-zinc-300 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  Save MCQ Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CUSTOM OVERLAY DIALOGS (Bypasses Frame-Blocked popups)
          ------------------------------------------------------------- */}
      {deleteVideoConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-xs animate-scale-up">
            <div className="bg-red-600 p-4 text-white flex gap-2.5 items-center">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold tracking-tight font-sans">Confirm Video Deletion</h4>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                Are you absolutely sure you want to delete <span className="text-white font-extrabold">"{deleteVideoConfirm.title}"</span>? This will wipe the course lesson from all registered students' course maps.
              </p>
              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteVideoConfirm(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-zinc-300 rounded-lg font-bold cursor-pointer"
                >
                  No, Keep Lesson
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteVideo(deleteVideoConfirm.id, deleteVideoConfirm.courseId);
                    setDeleteVideoConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Yes, Erase File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteQuestionConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-xs animate-scale-up">
            <div className="bg-red-600 p-4 text-white flex gap-2.5 items-center">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold tracking-tight font-sans">Erase MCQ Assessment Card</h4>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                Confirm removing this exam task:
              </p>
              <p className="p-3 bg-slate-950 text-yellow-500 font-bold rounded-lg border border-slate-800 italic">
                "{deleteQuestionConfirm.questionText}"
              </p>
              <p className="text-red-400 text-[11px] leading-normal font-mono">
                Deleting this assessment item deletes any historical question parameters from candidate testing engines.
              </p>
              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteQuestionConfirm(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-zinc-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteQuestion(deleteQuestionConfirm.id);
                    setDeleteQuestionConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Erase MCQ Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {revokeCertConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-xs animate-scale-up">
            <div className="bg-red-700 p-4 text-white flex gap-2.5 items-center">
              <ShieldAlert className="w-5 h-5 text-yellow-400 shrink-0" />
              <h4 className="text-sm font-bold tracking-tight uppercase font-sans">CRITICAL: Block & Revoke Hashes</h4>
            </div>
            <div className="p-5 space-y-3 font-sans">
              <p className="text-red-300 font-bold text-xs uppercase font-mono tracking-wider">⚠️ System Integrity Action Required</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                You are executing terminal revocation of certificate <span className="text-yellow-500 font-mono font-bold">{revokeCertConfirm.num}</span> issued to candidate <span className="text-white font-extrabold">{revokeCertConfirm.userName}</span>.
              </p>
              <p className="text-slate-400 text-[11px] leading-normal">
                This process burns the verification hash registry signature across the network. All public audits of this certificate URL will render "CRITICAL: REVOKED STATUS CHECK". This is final and irreversible.
              </p>
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRevokeCertConfirm(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-zinc-300 rounded-lg font-bold cursor-pointer"
                >
                  Abort Action
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRevokeCertificate(revokeCertConfirm.id);
                    setRevokeCertConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-650 hover:bg-red-600 text-white rounded-lg font-bold cursor-pointer"
                >
                  Burn Integrity Hash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteCourseConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-xs animate-scale-up">
            <div className="bg-red-600 p-4 text-white flex gap-2.5 items-center">
              <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse" />
              <h4 className="text-sm font-bold tracking-tight font-sans">Confirm Syllabus Selection Deletion</h4>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                Are you absolutely sure you want to delete <span className="text-white font-extrabold">"{deleteCourseConfirm.title}"</span>? This will wipe the course selection and all of its lessons permanently.
              </p>
              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteCourseConfirm(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-zinc-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCourse?.(deleteCourseConfirm.id);
                    setDeleteCourseConfirm(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold cursor-pointer shadow-lg shadow-red-600/20"
                >
                  Yes, Remove Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
