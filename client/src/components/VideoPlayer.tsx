import { useEffect, useRef, useState, useCallback } from "react";

interface VideoSource {
  id: number;
  youtubeId: string;
  title: string;
  duration: number;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  activeIndex: number;
  initialPosition?: number;
  onVideoChange?: (index: number) => void;
  onProgress?: (videoId: number, currentTime: number, duration: number, percent: number) => void;
  onComplete?: (videoId: number) => void;
  onPlay?: (videoId: number) => void;
  onPause?: (videoId: number) => void;
  className?: string;
}

export default function VideoPlayer({
  sources,
  activeIndex,
  initialPosition = 0,
  onVideoChange,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  className = "",
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<number | null>(null);
  const currentPositionRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [ytCurrentTime, setYtCurrentTime] = useState(0);

  const activeSource = sources[activeIndex];

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube-nocookie.com" && event.origin !== "https://www.youtube.com") {
        return;
      }

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        
        if (data.event === "onStateChange") {
          const state = data.info;
          if (state === 1) {
            setIsPlaying(true);
            if (onPlay && currentVideoIdRef.current) {
              onPlay(currentVideoIdRef.current);
            }
          } else if (state === 2 || state === 0 || state === -1) {
            setIsPlaying(false);
            if (state === 2 && onPause && currentVideoIdRef.current) {
              onPause(currentVideoIdRef.current);
            }
            if (state === 0 && currentVideoIdRef.current) {
              if (!hasCompletedRef.current && onComplete) {
                hasCompletedRef.current = true;
                onComplete(currentVideoIdRef.current);
              }
              if (activeIndex < sources.length - 1 && onVideoChange) {
                setTimeout(() => onVideoChange(activeIndex + 1), 1000);
              }
            }
          }
        }
        
        if (data.event === "infoDelivery" && data.info) {
          if (typeof data.info.currentTime === "number") {
            setYtCurrentTime(data.info.currentTime);
            currentPositionRef.current = data.info.currentTime;
          }
        }
      } catch (e) {}
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPlay, onPause, onComplete, onVideoChange, activeIndex, sources.length]);

  useEffect(() => {
    if (!isPlaying || !activeSource) {
      clearProgressInterval();
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      if (!currentVideoIdRef.current) return;

      const position = currentPositionRef.current;
      const duration = activeSource.duration;
      
      setCurrentTime(position);

      if (duration > 0) {
        const percent = Math.round((position / duration) * 100);
        
        if (onProgress) {
          onProgress(currentVideoIdRef.current, position, duration, percent);
        }

        if (percent >= 90 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          if (onComplete) {
            onComplete(currentVideoIdRef.current);
          }
        }
      }
    }, 1000);

    return clearProgressInterval;
  }, [isPlaying, activeSource, onProgress, onComplete, clearProgressInterval]);

  useEffect(() => {
    if (!activeSource) return;
    
    currentVideoIdRef.current = activeSource.id;
    currentPositionRef.current = initialPosition;
    setCurrentTime(initialPosition);
    setYtCurrentTime(initialPosition);
    hasCompletedRef.current = false;
    setIsPlaying(false);
    clearProgressInterval();
  }, [activeSource?.id, initialPosition, clearProgressInterval]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "listening" }),
        "*"
      );
    }
  }, [activeSource?.id]);

  if (!activeSource) {
    return (
      <div className={`video-player-wrapper flex items-center justify-center ${className}`}>
        <p className="text-white/50">Video bulunamadi</p>
      </div>
    );
  }

  const displayTime = ytCurrentTime > 0 ? ytCurrentTime : currentTime;
  const progress = activeSource.duration > 0 
    ? Math.round((displayTime / activeSource.duration) * 100) 
    : 0;

  return (
    <div className={`video-player-wrapper youtube-container ${className}`}>
      <iframe
        ref={iframeRef}
        key={activeSource.id}
        src={`https://www.youtube-nocookie.com/embed/${activeSource.youtubeId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&start=${Math.floor(initialPosition)}&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
        className="w-full h-full absolute inset-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={activeSource.title}
        data-testid="video-player"
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 z-20 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          
          <div className="flex-1">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <span className="text-white text-xs font-mono">
            {Math.floor(displayTime / 60)}:{(Math.floor(displayTime) % 60).toString().padStart(2, '0')} / {Math.floor(activeSource.duration / 60)}:{(activeSource.duration % 60).toString().padStart(2, '0')}
          </span>
          
          <span className="text-white/80 text-xs font-semibold bg-white/10 px-2 py-0.5 rounded">
            %{progress}
          </span>
        </div>
      </div>
    </div>
  );
}
