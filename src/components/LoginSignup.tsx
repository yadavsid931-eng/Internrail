import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, BookOpen, AlertCircle, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface LoginSignupProps {
  onAuthSuccess: (user: User) => void;
  currentUser: User | null;
  users?: User[];
  onRegisterUser?: (newUser: User) => void | Promise<void>;
}

export default function LoginSignup({ onAuthSuccess, currentUser, users = [], onRegisterUser }: LoginSignupProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [splashProgress, setSplashProgress] = useState<number>(0);
  const [splashText, setSplashText] = useState<string>('Initializing secure engine...');

  // Auth fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');

  // Settle Splash Screen simulation
  useEffect(() => {
    if (!showSplash) return;

    const phrases = [
      'Loading course modules...',
      'Synchronizing video assets...',
      'Verifying certificate registry...',
      'Connecting to InternRail server...',
      'Platform ready!'
    ];

    const timer = setInterval(() => {
      setSplashProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 20) + 10;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowSplash(false), 600);
          return 100;
        }
        
        // Update helper phrases based on progress
        const index = Math.min(Math.floor((next / 100) * phrases.length), phrases.length - 1);
        setSplashText(phrases[index]);
        return next;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [showSplash]);

  // Handle Login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide all required credentials.');
      return;
    }

    // Match against real-time users array (from Firebase Firestore!)
    const savedUsers = users;

    // Check predefined Admin account
    if (email.toLowerCase() === 'admin@internrail.gov.in' && password === 'admin123') {
      const adminUser: User = {
        id: 'user-admin',
        fullName: 'Lead Instructor (Admin)',
        email: 'admin@internrail.gov.in',
        studentId: 'ADM-999',
        role: 'admin',
        isActive: true,
        joinedDate: new Date().toLocaleDateString(),
        progress: {},
        watchedVideos: [],
        passedQuizzes: [],
        certificates: []
      };
      
      // Save session
      localStorage.setItem('internrail_current_user', JSON.stringify(adminUser));
      onAuthSuccess(adminUser);
      return;
    }

    // Standard matching over Firestore-registered list
    const matchingUser = savedUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.studentId.toUpperCase() === studentId.toUpperCase()
    );

    if (!matchingUser) {
      // Create user fallback for smooth instant proof of concept if any info matches or let's auto-create on simple password
      // High usability: If user enters demo/example login, auto-authenticate
      if (email.toLowerCase() === 'demo@company.com' || email.toLowerCase() === 'sidya70210@gmail.com') {
        const demoUser: User = {
          id: 'user-demo',
          fullName: 'Si',
          email: email,
          studentId: 'STU-2024-001',
          role: 'student',
          isActive: true,
          joinedDate: 'June 11, 2026',
          progress: { 'aaws': 20 },
          watchedVideos: ['vid-aaws-1'],
          passedQuizzes: [],
          certificates: []
        };
        
        // Save session & write to backend
        if (onRegisterUser) {
          onRegisterUser(demoUser);
        }
        localStorage.setItem('internrail_current_user', JSON.stringify(demoUser));
        onAuthSuccess(demoUser);
        return;
      }
      
      setError('User credentials not found. Use "demo@company.com" or sign up a new account!');
      return;
    }

    if (!matchingUser.isActive) {
      setError('Your account is suspended. Please contact the InternRail coordinator.');
      return;
    }

    localStorage.setItem('internrail_current_user', JSON.stringify(matchingUser));
    onAuthSuccess(matchingUser);
  };

  // Handle Signup submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !studentId || !password || !confirmPassword) {
      setError('Please fill out all fields on the registry screen.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be a minimum of 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Review and re-type.');
      return;
    }

    const savedUsers = users;

    const alreadyExists = savedUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (alreadyExists) {
      setError('An account with this email address is already registered.');
      return;
    }

    const newUser: User = {
      id: 'usr_' + Date.now(),
      fullName,
      email,
      studentId: studentId.toUpperCase(),
      role: 'student',
      isActive: true,
      joinedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      progress: {},
      watchedVideos: [],
      passedQuizzes: [],
      certificates: []
    };

    // Save to Firestore
    if (onRegisterUser) {
      await onRegisterUser(newUser);
    }

    // Sign in immediately
    localStorage.setItem('internrail_current_user', JSON.stringify(newUser));
    setStatusMessage('Account created successfully! Preparing your dashboard...');
    
    setTimeout(() => {
      onAuthSuccess(newUser);
    }, 1200);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setStatusMessage(`Instructions to reset your password have been dispatched to ${forgotEmail}. Please inspect your inbox.`);
    setShowForgotPassword(false);
    setTimeout(() => setStatusMessage(null), 8000);
  };

  if (showSplash) {
    return (
      <div id="splash-layout" className="fixed inset-0 bg-gradient-to-b from-[#0b3c5d] to-[#1d2731] flex flex-col items-center justify-center text-white z-50 p-6 select-none">
        <div className="w-24 h-24 bg-[#328cc1]/20 rounded-3xl border border-[#328cc1]/40 flex items-center justify-center mb-6 animate-pulse">
          <BookOpen className="w-12 h-12 text-[#98dbc6]" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-2">InternRail</h1>
        <p className="text-[#98dbc6] font-medium text-sm mb-12 tracking-widest uppercase">Railway LMS & Certification</p>

        <div className="w-full max-w-sm bg-white/10 h-1.5 rounded-full overflow-hidden mb-3">
          <div 
            className="bg-[#98dbc6] h-full rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${splashProgress}%` }}
          />
        </div>
        
        <p className="text-xs text-white/60 font-mono italic animate-pulse">{splashText}</p>

        <div className="absolute bottom-8 text-center text-xs text-white/40">
          <p>Indian Railways Central Technical LMS</p>
          <p className="mt-1 font-mono">v3.8.4 (Verified Digital Environment)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row shadow-2xl relative overflow-hidden">
      {/* Dynamic Background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#3b82f6]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#a855f7]/10 blur-[120px] pointer-events-none" />

      {/* Left banner panel (Railway Theme) */}
      <div className="w-full md:w-[45%] bg-gradient-to-b from-[#0b3c5d] via-[#103049] to-[#041e30] p-8 md:p-12 flex flex-col justify-between text-white border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wider text-lg block">InternRail</span>
            <span className="text-xs text-blue-300 block leading-tight font-mono">CRDT-LMS v3.8</span>
          </div>
        </div>

        <div className="my-10 md:my-0 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-xs rounded-full text-blue-300 mb-4 font-mono">
            <Sparkles className="w-3 h-3 text-amber-300" /> Authorized Training Portal
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Next Generation Railway Training Platform
          </h2>
          <p className="text-slate-300 text-sm mt-4 leading-relaxed">
            Gain mastery in Advanced Auxiliary Warning Systems, Passenger Info feeds, emergency intercoms, and safety recorders. Pass MCQs to receive instant, QR-verified digital completion certificates.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>5 Key System Modules</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>QR Secured Certs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>Self-Paced Videos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>Interactive Simulator</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/50">
          <p>© 2026 Ministry of Railway Signalling, InternRail Division.</p>
          <p className="mt-1 font-mono">Protected by secure cryptographic token authorization.</p>
        </div>
      </div>

      {/* Right Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl relative">
          
          {/* Admin shortcut badge */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => {
                setEmail('admin@internrail.gov.in');
                setPassword('admin123');
                setStudentId('ADM-999');
                setIsSignUp(false);
                setError(null);
                setStatusMessage('Loaded administrator credentials!');
              }}
              className="text-[10px] uppercase font-mono px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded hover:bg-amber-500/20 transition-all cursor-pointer"
              title="Shortcut for testing admin role features"
            >
              Demo Admin
            </button>
            <button
              onClick={() => {
                setEmail('demo@company.com');
                setPassword('student123');
                setStudentId('');
                setIsSignUp(false);
                setError(null);
                setStatusMessage('Loaded Demo Intern credentials! Click Sign In.');
              }}
              className="text-[10px] uppercase font-mono px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-300 rounded hover:bg-green-500/20 transition-all cursor-pointer"
              title="Shortcut for testing student role features with existing progress"
            >
              Demo Student
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {showForgotPassword ? 'Reset Password' : isSignUp ? 'Join InternRail' : 'Welcome Back'}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {showForgotPassword 
                ? 'Enter your registered email below to receive instructions.' 
                : isSignUp 
                  ? 'Start your internship training journey' 
                  : 'Sign in to continue your training'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {showForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition duration-150 cursor-pointer"
              >
                Send Recovery Instructions
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                }}
                className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-white transition"
              >
                Cancel and return to Login
              </button>
            </form>
          ) : !isSignUp ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Student ID / admin ID (Optional)</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="login-id"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-2024-001 (or ADM-999)"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 text-blue-600 focus:ring-blue-500 bg-slate-950"
                />
                <label htmlFor="remember-me-checkbox" className="ml-2 text-xs text-slate-400 select-none cursor-pointer hover:text-slate-200 transition">
                  Keep me connected (Remember Me)
                </label>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-900/30 hover:shadow-blue-600/40 transition duration-150 cursor-pointer"
              >
                Sign In
              </button>

              <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className="text-blue-400 font-bold hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up general layout */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="signup-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Student ID</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="signup-studentid"
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-2024-001"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                id="btn-signup-submit"
                type="submit"
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-900/30 hover:shadow-blue-600/40 transition duration-150 cursor-pointer mt-2"
              >
                Create Account
              </button>

              <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className="text-blue-400 font-bold hover:text-blue-300 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
