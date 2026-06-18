import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCw, RotateCcw, Volume2, VolumeX, Maximize, Minimize2, Check, AlertCircle, 
  Settings, Subtitles, HelpCircle, FastForward, Smartphone, Award, ExternalLink, ZoomIn, ZoomOut 
} from 'lucide-react';
import { Video } from '../types';

interface VideoPlayerProps {
  video: Video;
  onCompleted: (videoId: string) => void;
  isAlreadyWatched: boolean;
  isLightTheme?: boolean;
}

export default function VideoPlayer({ 
  video, 
  onCompleted, 
  isAlreadyWatched,
  isLightTheme = false 
}: VideoPlayerProps) {
  
  // Media settings
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(video.durationSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [quality, setQuality] = useState<string>('Auto (1080p)');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(false);
  const [activeSubLanguage, setActiveSubLanguage] = useState<'EN' | 'HI'>('EN');
  const [isPipMode, setIsPipMode] = useState<boolean>(false);
  const [isFullscreenOn, setIsFullscreenOn] = useState<boolean>(false);
  const [isVirtualFullscreen, setIsVirtualFullscreen] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showRatioMenu, setShowRatioMenu] = useState<boolean>(false);

  // Controls Visibility State
  const [showControls, setShowControls] = useState<boolean>(true);

  // Advanced features requested
  const [videoFormat, setVideoFormat] = useState<string>('auto'); // auto format detection
  const [currentBuffer, setCurrentBuffer] = useState<number>(45); // simulated buffer percent
  const [touchScale, setTouchScale] = useState<number>(1); // pinch zoom multiplier
  const [customRatio, setCustomRatio] = useState<'16:9' | '21:9' | '9:16' | '1:1'>(video.aspectRatio);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync HTML5 video play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, video.id]);

  // Sync speed and controls with extra dependencies so it reapplies on reload/play event
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isPlaying, video.id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume / 100;
    }
  }, [isMuted, volume]);

  // Control Visibility Auto-hide Timeout
  useEffect(() => {
    let hideTimer: any;
    if (isPlaying) {
      hideTimer = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(hideTimer);
  }, [isPlaying]);

  // Click outside to close custom menus
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSpeedMenu(false);
      setShowRatioMenu(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('.hud-controls') ||
      target.closest('.no-click-pause')
    ) {
      return;
    }
    
    if (!showControls) {
      setShowControls(true);
    } else {
      const nextPlay = !isPlaying;
      if (nextPlay && currentTime >= duration - 1) {
        setCurrentTime(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }
      setIsPlaying(nextPlay);
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const current = e.currentTarget.currentTime;
    setCurrentTime(current);
    localStorage.setItem(`internrail_resume_vid_${video.id}`, current.toString());
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const totalDuration = e.currentTarget.duration || video.durationSeconds;
    setDuration(totalDuration);
    
    const savedProgressRaw = localStorage.getItem(`internrail_resume_vid_${video.id}`);
    if (savedProgressRaw) {
      const savedSeconds = parseFloat(savedProgressRaw);
      if (savedSeconds < totalDuration - 20) {
        e.currentTarget.currentTime = savedSeconds;
        setCurrentTime(savedSeconds);
      } else {
        e.currentTarget.currentTime = 0;
        setCurrentTime(0);
      }
    } else {
      e.currentTarget.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Sync format and customRatio when video changes
  useEffect(() => {
    setCustomRatio(video.aspectRatio);
    setDuration(video.durationSeconds);
    
    // Auto detect from filename extension simulation
    const fileExtension = video.url.split('.').pop()?.split(/[?#]/)[0] || 'mp4';
    if (video.url.includes('m3u8')) setVideoFormat('hls');
    else if (video.url.includes('youtube') || video.url.includes('embed')) setVideoFormat('youtube/embedded');
    else setVideoFormat(fileExtension);

    // Read resume status from last watch state
    const savedProgressRaw = localStorage.getItem(`internrail_resume_vid_${video.id}`);
    if (savedProgressRaw) {
      const savedSeconds = parseFloat(savedProgressRaw);
      if (savedSeconds < video.durationSeconds - 20) {
        setCurrentTime(savedSeconds);
        if (videoRef.current) {
          videoRef.current.currentTime = savedSeconds;
        }
      } else {
        setCurrentTime(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }
    } else {
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
    
    setIsPlaying(false);
  }, [video]);

  // Video loop ticker logic for YouTube / mocked simulations (when no real HTML5 video exists)
  useEffect(() => {
    if (isPlaying && videoFormat === 'youtube/embedded') {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const step = 1 * playbackSpeed;
          const next = prev + step;
          if (next >= duration) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            return duration;
          }
          
          // Auto save watch progress inside localStorage
          localStorage.setItem(`internrail_resume_vid_${video.id}`, next.toString());
          return next;
        });
        
        // Randomly simulate buffer optimization rate
        setCurrentBuffer((current) => {
          if (current < 100) {
            const delta = Math.floor(Math.random() * 8) + 2;
            return Math.min(current + delta, 100);
          }
          return 100;
        });

      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, playbackSpeed, duration, video.id, videoFormat]);

  // Handle completed trigger if currentTime >= 90%
  const watchedPercentage = (currentTime / duration) * 100;
  const is90PercentWatched = watchedPercentage >= 90;

  useEffect(() => {
    if (is90PercentWatched && !isAlreadyWatched) {
      onCompleted(video.id);
    }
  }, [is90PercentWatched, video.id, isAlreadyWatched]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Do not hijack typing within search bars or forms
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 'escape':
          if (isVirtualFullscreen) {
            setIsVirtualFullscreen(false);
            setIsFullscreenOn(false);
          }
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          setCurrentTime((prev) => Math.min(prev + 10, duration));
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          setCurrentTime((prev) => Math.max(prev - 10, 0));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isVirtualFullscreen]);

  // Listen to native browser fullscreen transitions to synchronize React states securely
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setIsFullscreenOn(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        setIsVirtualFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle methods
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    const triggerVideoFullscreen = async () => {
      try {
        if (!isFullscreenOn) {
          // Attempt native HTML5 API first
          const el = containerRef.current;
          if (el.requestFullscreen) {
            await el.requestFullscreen();
            setIsFullscreenOn(true);
          } else if ((el as any).webkitRequestFullscreen) {
            await (el as any).webkitRequestFullscreen();
            setIsFullscreenOn(true);
          } else {
            // Safe fallback: in-app virtual fullscreen
            setIsVirtualFullscreen(true);
            setIsFullscreenOn(true);
          }
        } else {
          // Exit native or virtual fullscreen
          if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
            if (document.exitFullscreen) {
              await document.exitFullscreen().catch(() => {});
            } else if ((document as any).webkitExitFullscreen) {
              (document as any).webkitExitFullscreen();
            }
          }
          setIsVirtualFullscreen(false);
          setIsFullscreenOn(false);
        }
      } catch (err) {
        console.warn("Native fullscreen refused, activating Virtual viewport fullscreen:", err);
        // Fallback gracefully to virtual web-fullscreen
        setIsVirtualFullscreen(!isFullscreenOn);
        setIsFullscreenOn(!isFullscreenOn);
      }
    };

    triggerVideoFullscreen();
  };

  const skipTime = (amount: number) => {
    let nextTime = currentTime + amount;
    nextTime = Math.max(0, Math.min(nextTime, duration));
    setCurrentTime(nextTime);
    if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  const handleInstantComplete = () => {
    // Allows fast completion for evaluation!
    const target = Math.floor(duration * 0.92);
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
    localStorage.setItem(`internrail_resume_vid_${video.id}`, target.toString());
    onCompleted(video.id);
  };

  // Subtitles content mapping based on timestamp
  const getSubtitlesText = (): string => {
    if (!subtitlesEnabled) return '';
    
    // Do not show mock compliance subtitles for uploaded, custom, or ingested files
    const isUploaded = video.url?.startsWith('blob:') || 
                      video.url?.startsWith('data:') || 
                      video.category?.toLowerCase().includes('ingest') || 
                      video.category?.toLowerCase().includes('upload');
    if (isUploaded) return '';

    const sec = Math.floor(currentTime);

    if (activeSubLanguage === 'EN') {
      if (sec < 5) return 'Welcome to InternRail Railway Security & Signalling Academy.';
      if (sec >= 5 && sec < 12) return 'This training module focuses on railway system architecture.';
      if (sec >= 12 && sec < 20) return `We are studying: ${video.title}. Follow standard OHE procedures.`;
      if (sec >= 20 && sec < 35) return 'Ensure proper inductive coupling values are logged prior to signal contact.';
      if (sec >= 35 && sec < 50) return 'Verify correct alignment on your dashboard to proceed safely.';
      if (sec >= 50 && sec < 120) return 'Notice how automatic telemetry prevents critical collisions.';
      return 'Maintain extreme vigilance during testing. All actions are logged inside crash enclosures.';
    } else {
      if (sec < 5) return 'इन्टर्नरेल रेलवे सुरक्षा और सिग्नलिंग अकादमी में आपका स्वागत है।';
      if (sec >= 5 && sec < 12) return 'यह प्रशिक्षण मॉड्यूल रेलवे प्रणाली वास्तुकला पर केंद्रित है।';
      if (sec >= 12 && sec < 20) return `हम पढ़ रहे हैं: ${video.title}। मानक प्रक्रियाओं का पालन करें।`;
      if (sec >= 20 && sec < 35) return 'सिग्नल संपर्क से पहले उचित चुंबकीय युग्मन मूल्यों को सत्यापित करें।';
      if (sec >= 35 && sec < 50) return 'सुरक्षित रूप से आगे बढ़ने के लिए डैशबोर्ड संरेखण की जांच करें।';
      if (sec >= 50 && sec < 120) return 'ध्यान दें कि कैसे स्वचालित टेलीमेट्री गंभीर दुर्घटनाओं को रोकती है।';
      return 'परीक्षण के दौरान अत्यधिक सतर्कता बनाए रखें। सभी कार्य लॉग किए गए हैं।';
    }
  };

  // Convert seconds to mm:ss format
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = Math.floor(secs % 60);
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      isLightTheme ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-slate-900 border-slate-800 text-white shadow-2xl'
    } p-5 overflow-hidden`}>

      {/* Video Headline Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-500 font-mono tracking-widest block mb-1">
            Active Video Unit • Category: {video.category}
          </span>
          <h2 className="text-lg font-bold tracking-tight">{video.title}</h2>
        </div>

        {/* Demo Fast Forward completion tool */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstantComplete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg hover:bg-yellow-400 active:scale-95 transition cursor-pointer shadow-md shadow-yellow-500/10"
            title="Instant completed and unlock MCQ assessment"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Speed Watch & Unlock MCQ</span>
          </button>

          {(is90PercentWatched || isAlreadyWatched) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-full font-semibold font-mono">
              <Check className="w-3.5 h-3.5" /> Watch Completed
            </span>
          )}
        </div>
      </div>



      {/* Main Video Arena container holding aspect ratios */}
      <div 
        ref={containerRef}
        id={`video-canvas-container-${video.id}`}
        onMouseMove={() => { if (!showControls) setShowControls(true); }}
        onTouchStart={() => { if (!showControls) setShowControls(true); }}
        className={`relative bg-slate-950 overflow-hidden group flex items-center justify-center border transition-all ${
          isFullscreenOn 
            ? 'fixed inset-0 z-[9999] rounded-none border-none max-w-none w-full h-full' 
            : 'rounded-xl border-slate-800 shadow-xl'
        }`}
        style={{
          aspectRatio: isFullscreenOn ? 'auto' : 
                       customRatio === '16:9' ? '16/9' :
                       customRatio === '21:9' ? '21/9' :
                       customRatio === '9:16' ? '9/16' : '1/1',
          maxWidth: isFullscreenOn ? 'none' : customRatio === '9:16' ? '300px' : '100%',
          height: isFullscreenOn ? '100vh' : 'auto',
          margin: '0 auto',
        }}
      >
        {/* Pinch to Zoom simulator filter style */}
        <div 
          className="absolute inset-0 w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${touchScale})` }}
        >
          {/* Real HTML5 Video element for native file URLs (blobs, mp4s, etc.) */}
          {videoFormat !== 'youtube/embedded' && video.url && (
            <video
              ref={videoRef}
              src={video.url}
              className={`absolute inset-0 w-full h-full ${isFullscreenOn ? 'object-contain' : 'object-cover'}`}
              style={{ pointerEvents: 'none' }}
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={(e) => {
                handleVideoLoadedMetadata(e);
                if (videoRef.current) {
                  videoRef.current.playbackRate = playbackSpeed;
                }
              }}
              onPlay={() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = playbackSpeed;
                }
              }}
              onPlaying={() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = playbackSpeed;
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                onCompleted(video.id);
              }}
              playsInline
            />
          )}

          {/* YouTube/embedded iframe player wrapper */}
          {videoFormat === 'youtube/embedded' && video.url && (
            <iframe
              src={`${video.url}${video.url.includes('?') ? '&' : '?'}enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&controls=0&rel=0`}
              title={video.title}
              className="absolute inset-0 w-full h-full border-none pointer-events-auto"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}

          {/* Graphical overlay handling clicks/touch */}
          <div 
            onClick={handleContainerClick}
            className={`absolute inset-0 flex flex-col justify-between p-6 overflow-hidden select-none transition-colors duration-300 cursor-pointer ${
              isPlaying ? 'bg-transparent' : 'bg-slate-950/60 backdrop-blur-[1px]'
            }`}
          >
            {/* Huge center play symbol if paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentTime >= duration - 1) {
                      setCurrentTime(0);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                      }
                    }
                    setIsPlaying(true);
                  }}
                  className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center transition shadow-2xl cursor-pointer"
                >
                  <Play className="w-8 h-8 fill-white ml-1" />
                </button>
                <div className="absolute bottom-16 text-center text-slate-300 text-xs font-semibold bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
                  Click to Stream Training Audio/Video
                </div>
              </div>
            )}

            {/* Actual dynamic training subtitles display */}
            {subtitlesEnabled && getSubtitlesText() && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[90%] text-center z-30 pointer-events-none">
                <span className="px-4 py-2 bg-black/90 text-[13px] sm:text-[14px] text-white font-semibold border border-slate-850 rounded-lg shadow-2xl tracking-normal leading-relaxed backdrop-blur-sm">
                  {getSubtitlesText()}
                </span>
              </div>
            )}
            
            {/* Top right floating help badge */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <span className="px-2 py-0.5 bg-black/60 rounded text-[9px] text-zinc-400 font-mono">
                Speed: {playbackSpeed}x
              </span>
            </div>

          </div>
        </div>

        {/* Swipe gestures or Touch controls overlay */}
        <div className="absolute inset-y-0 left-0 w-16 hover:bg-white/5 active:bg-blue-500/10 transition flex items-center justify-center text-white/40 opacity-0 group-hover:opacity-100 cursor-pointer"
             onClick={() => skipTime(-10)}
             title="Double click or tap to Rewind 10s">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="absolute inset-y-0 right-0 w-16 hover:bg-white/5 active:bg-blue-500/10 transition flex items-center justify-center text-white/40 opacity-0 group-hover:opacity-100 cursor-pointer"
             onClick={() => skipTime(10)}
             title="Double click or tap to FastForward 10s">
          <RotateCw className="w-5 h-5" />
        </div>

        {/* Video HUD controls bar */}
        <div className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3.5 flex flex-col gap-2 transition-all duration-300 z-20 hud-controls select-none ${
          showControls 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-1.5 pointer-events-none'
        }`}>
          
          {/* Progress Timeline Scrubber */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-zinc-300 font-mono select-none">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden relative cursor-pointer group/scrub">
              {/* Buffer track */}
              <div 
                className="absolute inset-y-0 left-0 bg-white/10" 
                style={{ width: `${currentBuffer}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration}
                step={1}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {/* Main Progress track colored yellow if near done */}
              <div 
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-100 ${
                  watchedPercentage >= 90 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${watchedPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-300 font-mono select-none">{formatTime(duration)}</span>
          </div>

          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              {/* Play symbol */}
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:text-blue-400 p-1 rounded hover:bg-white/10 transition"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-blue-400 p-1 rounded"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseInt(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-16 h-1 accent-blue-500 bg-white/20 rounded-full cursor-pointer hidden sm:block"
                />
              </div>

              {/* Speed select */}
              <div className="relative flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowRatioMenu(false);
                  }}
                  className="text-[10px] text-white hover:bg-white/25 active:scale-95 font-mono px-2 py-0.5 bg-white/10 rounded cursor-pointer select-none"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-7 left-0 flex flex-col bg-slate-950 border border-slate-800 rounded shadow-xl overflow-hidden min-w-[70px] text-zinc-400 text-[10px] font-mono z-50">
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((sp) => (
                      <button 
                        key={sp} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaybackSpeed(sp);
                          setShowSpeedMenu(false);
                        }}
                        className={`px-2 py-1 text-left ${playbackSpeed === sp ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-600 hover:text-white'}`}
                      >
                        {sp}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Subtitle button */}
              <button
                onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className={`p-1 rounded hover:bg-white/10 ${subtitlesEnabled ? 'text-yellow-400' : 'text-zinc-400'}`}
                title="Toggle subtitles"
              >
                <Subtitles className="w-4 h-4" />
              </button>

              {/* Subtitle language */}
              {subtitlesEnabled && (
                <button
                  onClick={() => setActiveSubLanguage(activeSubLanguage === 'EN' ? 'HI' : 'EN')}
                  className="text-[9px] font-mono bg-white/20 px-1 rounded hover:bg-white/35"
                >
                  {activeSubLanguage}
                </button>
              )}

            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              
              {/* Aspect Ratio Switcher tool inside hud */}
              <div className="relative flex items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRatioMenu(!showRatioMenu);
                    setShowSpeedMenu(false);
                  }}
                  className="text-white hover:text-blue-400 p-1 rounded hover:bg-white/10 text-xs flex items-center gap-1 font-mono h-8"
                  title="Screen Aspect Ratio"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">{customRatio}</span>
                </button>
                {showRatioMenu && (
                  <div className="absolute bottom-8 right-0 flex flex-col bg-slate-950 border border-slate-800 rounded-lg shadow-xl overflow-hidden min-w-[80px] text-zinc-400 text-[10px] font-mono z-50">
                    {['16:9', '21:9', '9:16', '1:1'].map((rt) => (
                      <button 
                        key={rt} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomRatio(rt as any);
                          setShowRatioMenu(false);
                        }}
                        className={`px-2.5 py-1.5 text-left ${customRatio === rt ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-600 hover:text-white'}`}
                      >
                        {rt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Compact Zoom Pill Group (Aligned inside) */}
              <div className="flex items-center bg-white/10 hover:bg-white/15 rounded-lg h-7 px-1 text-[11px] font-mono gap-0.5 shrink-0 select-none">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTouchScale(Math.max(1, touchScale - 0.25));
                  }}
                  className="text-white hover:text-blue-400 p-1 rounded hover:bg-white/10 transition flex items-center justify-center"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] text-zinc-300 font-bold px-1" title="Current Zoom">
                  {Math.round(touchScale * 100)}%
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTouchScale(Math.min(3.0, touchScale + 0.25));
                  }}
                  className="text-white hover:text-blue-400 p-1 rounded hover:bg-white/10 transition flex items-center justify-center"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fullscreen icon */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="text-white hover:text-sky-400 p-1.5 rounded-lg hover:bg-white/10 transition flex items-center justify-center shrink-0 h-8 w-8"
                title={isFullscreenOn ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreenOn ? <Minimize2 className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* Video metadata overview */}
      <div className={`mt-4 border-t pt-3 ${isLightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
        <p className={`text-xs leading-relaxed ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
          {video.description}
        </p>
        <div className="flex items-center gap-3.5 mt-3 text-xs">
          <div className="text-slate-500">
            Mandatory Watch-rate: <span className="font-bold text-blue-500 font-mono">90%</span>
          </div>
          <div className="text-slate-500">•</div>
          <div className="text-slate-500">
            Total Length: <span className="font-bold font-mono text-zinc-400">{video.duration}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
