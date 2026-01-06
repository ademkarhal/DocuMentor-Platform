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
  className = "",
}: VideoPlayerProps) {
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchStartTimeRef = useRef<number>(0);
  const startPositionRef = useRef<number>(0);
  const currentVideoIdRef = useRef<number | null>(null);

  const activeSource = sources[activeIndex];

  useEffect(() => {
    if (!activeSource) return;

    currentVideoIdRef.current = activeSource.id;
    startPositionRef.current = initialPosition;
    watchStartTimeRef.current = Date.now();

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const videoId = activeSource.id;
    const duration = activeSource.duration;

    progressIntervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);
      const currentPosition = startPositionRef.current + elapsedSeconds;

      if (currentPosition >= duration) {
        if (onComplete) {
          onComplete(videoId);
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        if (activeIndex < sources.length - 1 && onVideoChange) {
          setTimeout(() => onVideoChange(activeIndex + 1), 1000);
        }
        return;
      }

      const progressPercent = Math.min(Math.round((currentPosition / duration) * 100), 99);
      if (onProgress) {
        onProgress(videoId, currentPosition, duration, progressPercent);
      }
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [activeSource?.id, activeSource?.duration, activeIndex, sources.length, initialPosition, onProgress, onComplete, onVideoChange]);

  if (!activeSource) {
    return (
      <div className={`video-player-wrapper flex items-center justify-center ${className}`}>
        <p className="text-white/50">Video bulunamadi</p>
      </div>
    );
  }

  return (
    <div className={`video-player-wrapper youtube-container ${className}`}>
      <iframe
        key={activeSource.id}
        src={`https://www.youtube-nocookie.com/embed/${activeSource.youtubeId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&start=${Math.floor(initialPosition)}`}
        className="w-full h-full absolute inset-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={activeSource.title}
        data-testid="video-player"
      />
    </div>
  );
}
