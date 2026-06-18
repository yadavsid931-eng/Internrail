import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, AlertTriangle, Clock, Award, ShieldAlert, 
  HelpCircle, ChevronRight, ChevronLeft, RotateCcw, Lock 
} from 'lucide-react';
import { Course, MCQQuestion, QuizAttempt } from '../types';

interface MCQTestProps {
  course: Course;
  questions: MCQQuestion[];
  onFinishTest: (attempt: QuizAttempt) => void;
  onCancel: () => void;
  isLightTheme?: boolean;
}

export default function MCQTest({
  course,
  questions: allQuestions = [],
  onFinishTest,
  onCancel,
  isLightTheme = false
}: MCQTestProps) {
  
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({}); // qId -> selectedIndex
  
  // Timer state (60 seconds per question multiplied)
  const [timeLeft, setTimeLeft] = useState<number>(60 * 3); // 3 minutes total for test
  const [testComplete, setTestComplete] = useState<boolean>(false);
  
  // Anti-cheating states
  const [tabFocusWarnings, setTabFocusWarnings] = useState<number>(0);
  const [showCheatAlert, setShowCheatAlert] = useState<boolean>(false);
  const [cheatedAutoSubmitted, setCheatedAutoSubmitted] = useState<boolean>(false);

  // Unanswered confirm modal
  const [unansweredConfirmCount, setUnansweredConfirmCount] = useState<number | null>(null);

  // Stats
  const timerRef = useRef<any>(null);

  // Initialize and randomize list of questions for specific course
  useEffect(() => {
    let courseQuestions = allQuestions.filter(q => q && q.courseId === course.id);
    
    // Dynamic fallback questions so the quiz NEVER fails to open
    if (courseQuestions.length === 0) {
      courseQuestions = [
        {
          id: `q-fallback-${course.id}-1`,
          courseId: course.id,
          question: `What is the primary safety and compliance objective of the ${course.title} (${course.shortTitle}) train module?`,
          options: [
            'Ensuring flawless multi-zone operations, fail-safe backups, and compliance standards alignment',
            'Shorter train platform lengths for regional branch connections',
            'Direct mechanical wheel adjustments and lubrication monitoring',
            'Overriding track-side magnet signals manually to ensure faster arrival times'
          ],
          correctAnswer: 0,
          explanation: `The overriding objective of any railway safety technology, including ${course.shortTitle}, is to assure track-side operations line up perfectly with established fail-safe regulations.`,
          marks: 10,
          difficulty: 'Easy'
        },
        {
          id: `q-fallback-${course.id}-2`,
          courseId: course.id,
          question: `Upon hardware/signal network interruption within the ${course.shortTitle} loop, what automatic fail-safe behavior occurs?`,
          options: [
            'Immediate override of speed governors without logging any report to dispatch',
            'A transition to safe-state defaults (such as emergency braking enforcement or visual alerts)',
            'Accelerating primary locomotives to clear local power feeding zones',
            'Disabling the Vacuum Circuit Breaker manually from the passenger car panel'
          ],
          correctAnswer: 1,
          explanation: `All system architectures in railway protocols mandate instant transition to safe-state defaults (such as emergency braking or visual warnings) upon signal failure.`,
          marks: 10,
          difficulty: 'Medium'
        },
        {
          id: `q-fallback-${course.id}-3`,
          courseId: course.id,
          question: `Under standard operations, how are systems in ${course.shortTitle} certified and audited?`,
          options: [
            'Ad-hoc visual inspections during passenger boarding times',
            'Regular periodic qualification exams and automated logging diagnostics',
            'Only once during construction or assembly phases',
            'By checking engine fuel levels weekly'
          ],
          correctAnswer: 1,
          explanation: `Periodic testing and structured compliance scorecard verification keep on-track processes compliant with local railway safety standards.`,
          marks: 10,
          difficulty: 'Hard'
        }
      ];
    }

    // Shuffle questions
    const shuffled = [...courseQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    
    // Reset selections
    setSelectedAnswers({});
    setCurrentIdx(0);
    setTimeLeft(shuffled.length * 50); // 50 seconds per question
    setTestComplete(false);
    setTabFocusWarnings(0);
    setShowCheatAlert(false);
    setCheatedAutoSubmitted(false);
  }, [course, allQuestions]);

  // Anti-Cheating Tab Switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !testComplete && !cheatedAutoSubmitted) {
        setTabFocusWarnings((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            // Auto submit!
            setCheatedAutoSubmitted(true);
            triggerAutoSubmit(true); // flagged cheat submit
            return next;
          }
          setShowCheatAlert(true);
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      // Trigger subtle warning if browser window loses active engagement
      if (!testComplete && !cheatedAutoSubmitted) {
        setShowCheatAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [questions, selectedAnswers, testComplete, cheatedAutoSubmitted]);

  // MCQ Timer ticker
  useEffect(() => {
    if (testComplete || cheatedAutoSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          triggerAutoSubmit(false); // standard timer submission
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [questions, selectedAnswers, testComplete, cheatedAutoSubmitted]);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (testComplete) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const triggerAutoSubmit = (wasCheat = false) => {
    setTestComplete(true);
    clearInterval(timerRef.current);
    
    // Tally values
    let correct = 0;
    let wrong = 0;
    
    questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const scorePct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const isPassed = scorePct >= course.passingScore && !wasCheat;

    const attempt: QuizAttempt = {
      id: 'att_' + Date.now(),
      userId: 'current',
      courseId: course.id,
      score: scorePct,
      passed: isPassed,
      totalQuestions: questions.length,
      correctAnswers: correct,
      wrongAnswers: wrong,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    onFinishTest(attempt);
  };

  const handleManualSubmit = () => {
    // Check if unanswered questions remain
    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    if (unansweredCount > 0) {
      setUnansweredConfirmCount(unansweredCount);
      return;
    }
    triggerAutoSubmit(false);
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="animate-pulse">Loading assessments and randomizing MCQ bank...</p>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];
  if (!activeQuestion) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="animate-pulse">Loading question...</p>
      </div>
    );
  }
  const userSelectedOption = selectedAnswers[activeQuestion.id];
  const progressBarPercent = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className={`rounded-2xl border ${
      isLightTheme ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
    } shadow-2xl overflow-hidden relative max-w-3xl mx-auto`}>
      
      {/* Quiz Top Title bar matching screenshot closely */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="p-1 px-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition"
            title="Quit assessment"
          >
            <X className="w-4 h-4 inline" />
          </button>
          <span className="font-bold tracking-tight text-white font-sans">
            {course.shortTitle} — MCQ Test
          </span>
        </div>

        {/* Timer countdown clock widget */}
        <div className="flex items-center gap-2 bg-black/20 border border-white/20 px-3 py-1.5 rounded-xl text-xs font-mono">
          <Clock className="w-4 h-4 text-yellow-300 animate-pulse" />
          <span className={timeLeft < 30 ? 'text-red-400 font-bold' : 'text-zinc-200'}>
            Time Left: {formatTimer(timeLeft)}
          </span>
        </div>
      </div>

      {/* Blue load indicator matching screenshot */}
      <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
        <div 
          className="bg-sky-400 h-full rounded-r transition-all duration-300 ease-out"
          style={{ width: `${progressBarPercent}%` }}
        />
      </div>

      <div className="p-4 sm:p-5 bg-slate-950/25 flex items-center justify-between text-xs font-mono font-bold border-b border-white/5">
        <span className="text-blue-500 uppercase">Question {currentIdx + 1} of {questions.length}</span>
        <span className="text-slate-500">Passing Score Limit: {course.passingScore}%</span>
      </div>

      {/* Cheating warning banners */}
      {showCheatAlert && (
        <div className="m-4 p-3 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl text-amber-300 text-xs flex flex-col gap-1 tracking-normal">
          <div className="flex items-center gap-2 font-bold font-mono">
            <ShieldAlert className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>ANTI-CHEAT FOCUS ALARM</span>
          </div>
          <p>
            You shifted tabs/windows! Focus on the assessment. Warning count: <span className="font-bold text-red-500">{tabFocusWarnings}/3</span>. 
            Reaching 3 warnings triggers instant automatic score submission as flagged.
          </p>
          <button 
            onClick={() => setShowCheatAlert(false)} 
            className="mt-1 px-3 py-1 bg-amber-500 text-black font-bold self-start rounded hover:bg-amber-400 text-[10px]"
          >
            I Acknowledge, Resume
          </button>
        </div>
      )}

      {cheatedAutoSubmitted && (
        <div className="m-4 p-4 bg-red-500/15 border-2 border-red-500/50 rounded-xl text-red-200 text-xs flex flex-col gap-2 font-mono">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <Lock className="w-5 h-5 animate-pulse" />
            <span>TEST LOCKED — RE-ATTEMPT REQ</span>
          </div>
          <p>
            The test environment was automatically closed. Your current progress has been submitted with a penalty due to security focus loss (switching screens/windows).
          </p>
        </div>
      )}

      {/* Current MCQ Card area */}
      {!testComplete && (
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Question Text */}
          <div>
            <span className="text-[10px] font-bold text-blue-500 font-mono block mb-1 uppercase tracking-wider">
              {activeQuestion.difficulty} Level Quiz • Weight: {activeQuestion.marks} points
            </span>
            <h4 className={`text-base sm:text-lg font-bold leading-snug tracking-tight ${
              isLightTheme ? 'text-slate-800' : 'text-white'
            }`}>
              {activeQuestion.question}
            </h4>
          </div>

          {/* Options grid A/B/C/D matching the mockup style exactly */}
          <div className="grid grid-cols-1 gap-3.5">
            {activeQuestion.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D
              const isSelected = userSelectedOption === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(activeQuestion.id, idx)}
                  className={`w-full text-left rounded-xl p-4 flex items-center gap-4 transition duration-150 cursor-pointer text-sm font-semibold border ${
                    isSelected 
                      ? isLightTheme
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-lg shadow-blue-500/5'
                        : 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10' 
                      : isLightTheme
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        : 'bg-[#1e293b]/40 border-slate-800 text-slate-300 hover:bg-[#1e293b]/65 hover:border-slate-700'
                  }`}
                >
                  {/* Circle bubble with letter index */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold tracking-normal text-xs transition duration-150 shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isLightTheme
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {letter}
                  </div>

                  <span className="flex-1 leading-normal">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Nav buttons footer */}
          <div className={`flex justify-between items-center pt-5 border-t mt-8 gap-4 ${
            isLightTheme ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold font-mono border transition ${
                currentIdx === 0 
                  ? isLightTheme
                    ? 'border-slate-150 text-slate-300 cursor-not-allowed bg-transparent'
                    : 'border-slate-800 text-slate-600 cursor-not-allowed bg-transparent' 
                  : isLightTheme
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            {/* Dots navigation indicators matching markup page selector dots */}
            <div className="hidden sm:flex gap-1.5 font-mono">
              {questions.map((_, dotIdx) => (
                <button 
                  key={dotIdx}
                  onClick={() => setCurrentIdx(dotIdx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    dotIdx === currentIdx 
                      ? 'bg-blue-500 w-4' 
                      : selectedAnswers[questions[dotIdx].id] !== undefined
                        ? 'bg-purple-500/80'
                        : isLightTheme
                          ? 'bg-slate-200'
                          : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold font-mono transition cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleManualSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black uppercase font-mono shadow-lg shadow-green-900/40 transition cursor-pointer"
              >
                <span>Finish & Submit</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* Test Complete (Results overview page) */}
      {testComplete && (
        <div className="p-8 space-y-6 text-center max-w-xl mx-auto">
          {(() => {
            let correct = 0;
            questions.forEach((q) => {
              if (selectedAnswers[q.id] === q.correctAnswer) correct++;
            });
            const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
            const userPassed = pct >= course.passingScore && !cheatedAutoSubmitted;

            return (
              <>
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${
                    userPassed 
                      ? 'bg-green-500/10 border-2 border-green-500/30 text-green-400' 
                      : 'bg-red-500/10 border-2 border-red-500/30 text-red-400'
                  }`}>
                    {userPassed ? <Award className="w-9 h-9" /> : <X className="w-9 h-9" />}
                  </div>

                  <h3 className={`text-2xl font-extrabold tracking-tight ${
                    isLightTheme ? 'text-slate-850' : 'text-white'
                  }`}>
                    {userPassed ? 'Congratulations! You Passed' : 'Assessment Not Passed'}
                  </h3>
                  <p className={`text-xs font-mono mt-1 ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    Course Module: {course.title}
                  </p>
                </div>

                {/* Score Circle dashboard */}
                <div className={`p-6 border rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center ${
                  isLightTheme 
                    ? 'bg-slate-50 border-slate-200 text-slate-800' 
                    : 'bg-[#020617]/50 border-slate-800 text-white'
                }`}>
                  <div>
                    <span className={`text-[10px] font-mono block uppercase ${isLightTheme ? 'text-slate-500' : 'text-zinc-400'}`}>Your Score</span>
                    <span className={`text-2xl font-extrabold font-mono block mt-1 ${userPassed ? 'text-green-500' : 'text-red-500'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-mono block uppercase ${isLightTheme ? 'text-slate-500' : 'text-zinc-400'}`}>Passing Req</span>
                    <span className={`text-2xl font-extrabold font-mono block mt-1 ${isLightTheme ? 'text-slate-700' : 'text-zinc-300'}`}>
                      {course.passingScore}%
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-mono block uppercase ${isLightTheme ? 'text-slate-500' : 'text-zinc-400'}`}>Correct</span>
                    <span className="text-2xl font-extrabold font-mono block mt-1 text-green-500">
                      {correct} / {questions.length}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[10px] font-mono block uppercase ${isLightTheme ? 'text-slate-500' : 'text-zinc-400'}`}>Result Code</span>
                    <span className="text-xs font-bold font-mono block mt-2 text-zinc-500">
                      {userPassed ? 'VERIFIED_PASS' : 'REATTEMPT_REQ'}
                    </span>
                  </div>
                </div>

                {/* Review section showing correct and wrong answers alongside explanations */}
                <div className={`text-left space-y-4 pt-4 border-t ${isLightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
                  <h4 className={`text-xs font-bold uppercase tracking-widest ${isLightTheme ? 'text-blue-600' : 'text-[#98dbc6]'}`}>Review Assessment Submissions:</h4>
                  
                  <div className={`space-y-4 max-h-60 overflow-y-auto pr-2 divide-y ${isLightTheme ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {questions.map((q, idx) => {
                      const userChoiceIdx = selectedAnswers[q.id];
                      const isCorrect = userChoiceIdx === q.correctAnswer;
                      const hasChosen = userChoiceIdx !== undefined;

                      return (
                        <div key={q.id} className="pt-3 text-xs">
                          <p className={`font-bold mb-2 ${isLightTheme ? 'text-slate-850' : 'text-white'}`}>{idx + 1}. {q.question}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            <div className={`p-2.5 rounded-lg border ${
                              isCorrect 
                                ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                                : 'bg-red-500/10 border-red-500/30 text-red-500'
                            }`}>
                              <span className="font-bold block text-[10px] uppercase">Your Choice:</span>
                              <p className="mt-0.5 font-semibold">
                                {hasChosen ? `${String.fromCharCode(65 + userChoiceIdx)}. ${q.options[userChoiceIdx]}` : 'Unanswered'}
                              </p>
                            </div>

                            {!isCorrect && (
                              <div className={`p-2.5 rounded-lg border ${
                                isLightTheme 
                                  ? 'bg-emerald-50 border-emerald-250 text-emerald-800 font-medium' 
                                  : 'bg-green-500/5 border-green-500/20 text-green-300'
                              }`}>
                                <span className="font-bold block text-[10px] uppercase">Correct Option:</span>
                                <p className="mt-0.5 font-semibold">{String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]}</p>
                              </div>
                            )}
                          </div>

                          <div className={`mt-2 p-2 border rounded-lg flex items-start gap-1.5 ${
                            isLightTheme 
                              ? 'bg-slate-50 border-slate-200 text-slate-700' 
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                            <p className="italic text-[11px] leading-relaxed">
                              <span className={`font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>Explanation:</span> {q.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm continue action */}
                <div className="flex gap-3 justify-center pt-4">
                  {!userPassed && (
                    <button
                      onClick={() => {
                        // Restart quiz
                        const shuffled = [...allQuestions.filter(q => q.courseId === course.id)].sort(() => Math.random() - 0.5);
                        setQuestions(shuffled);
                        setSelectedAnswers({});
                        setCurrentIdx(0);
                        setTimeLeft(shuffled.length * 50);
                        setTestComplete(false);
                        setTabFocusWarnings(0);
                        setShowCheatAlert(false);
                        setCheatedAutoSubmitted(false);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Re-Attempt Assessment</span>
                    </button>
                  )}
                  <button
                    onClick={onCancel}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {unansweredConfirmCount !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-xs animate-scale-up text-zinc-350">
            <div className="bg-amber-600 p-4 text-white flex gap-2.5 items-center">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold tracking-tight">Unanswered Questions Alert</h4>
            </div>
            <div className="p-5 space-y-4 font-sans">
              <p className="text-sm leading-relaxed">
                You have left <span className="text-yellow-400 font-extrabold">{unansweredConfirmCount}</span> questions empty and unanswered out of <span className="text-white font-extrabold">{questions.length}</span> total questions.
              </p>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Submitting now registers these unanswered questions as incorrect in your final compliance scorecard.
              </p>
              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setUnansweredConfirmCount(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-zinc-300 rounded-lg font-bold cursor-pointer"
                >
                  Go Back & Complete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUnansweredConfirmCount(null);
                    triggerAutoSubmit(false);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
