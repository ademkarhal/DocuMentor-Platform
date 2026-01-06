import { useEffect, useRef, useCallback } from "react";

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
  className?: string;
}

export default function VideoPlayer({
  sources,
  activeIndex,
  initialPosition = 0,
  onVideoChange,
  onProgress,
  onComplete,
  className = "",
}: VideoPlayerProps) {
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPositionRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const isVisibleRef = useRef<boolean>(true);
  const lastVideoIdRef = useRef<number | null>(null);

  const activeSource = sources[activeIndex];

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!activeSource) return;
    
    const isNewVideo = lastVideoIdRef.current !== activeSource.id;
    lastVideoIdRef.current = activeSource.id;
    
    if (isNewVideo) {
      currentPositionRef.current = initialPosition;
      hasCompletedRef.current = activeSource.duration > 0 && initialPosition >= activeSource.duration * 0.9;
    }

    clearProgressInterval();

    progressIntervalRef.current = setInterval(() => {
      if (!isVisibleRef.current || !activeSource) return;

      currentPositionRef.current += 1;
      const position = currentPositionRef.current;
      const duration = activeSource.duration;

      if (duration > 0) {
        const percent = Math.min(Math.round((position / duration) * 100), 100);
        
        if (onProgress) {
          onProgress(activeSource.id, position, duration, percent);
        }

        if (percent >= 90 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          if (onComplete) {
            onComplete(activeSource.id);
          }
        }

        if (position >= duration) {
          clearProgressInterval();
          
          if (activeIndex < sources.length - 1 && onVideoChange) {
            setTimeout(() => onVideoChange(activeIndex + 1), 1500);
          }
        }
      }
    }, 1000);

    return clearProgressInterval;
  }, [activeSource?.id, initialPosition, onProgress, onComplete, onVideoChange, activeIndex, sources.length, clearProgressInterval, activeSource]);

  if (!activeSource) {
    return (
      <div className={`aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center ${className}`}>
        <p className="text-white/50">Video bulunamadi</p>
      </div>
    );
  }

  return (
    <div className={`yt-wrapper ${className}`}>
      <div className="yt-frame-container">
        <iframe
          key={activeSource.id}
          src={`https://www.youtube.com/embed/${activeSource.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&start=${Math.floor(initialPosition)}`}
          className="yt-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={activeSource.title}
          data-testid="video-player"
        />
      </div>
    </div>
  );
}
