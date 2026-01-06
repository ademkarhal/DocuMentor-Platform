import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const currentVideoIdRef = useRef<number | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  
  const [isTracking, setIsTracking] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialPosition);

  const activeSource = sources[activeIndex];

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isTracking || !activeSource) {
      clearProgressInterval();
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      if (!currentVideoIdRef.current) return;

      setCurrentTime(prev => {
        const newTime = prev + 1;
        const duration = activeSource.duration;

        if (duration > 0) {
          const percent = Math.round((newTime / duration) * 100);
          
          if (onProgress) {
            onProgress(currentVideoIdRef.current!, newTime, duration, percent);
          }

          if (percent >= 90 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            if (onComplete) {
              onComplete(currentVideoIdRef.current!);
            }
          }

          if (newTime >= duration) {
            clearProgressInterval();
            setIsTracking(false);
            
            if (activeIndex < sources.length - 1 && onVideoChange) {
              setTimeout(() => onVideoChange(activeIndex + 1), 1500);
            }
            return duration;
          }
        }

        return newTime;
      });
    }, 1000);

    return clearProgressInterval;
  }, [isTracking, activeSource, onProgress, onComplete, onVideoChange, activeIndex, sources.length, clearProgressInterval]);

  useEffect(() => {
    if (!activeSource) return;
    
    currentVideoIdRef.current = activeSource.id;
    setCurrentTime(initialPosition);
    hasCompletedRef.current = false;
    setIsTracking(true);
    clearProgressInterval();
  }, [activeSource?.id, initialPosition, clearProgressInterval]);

  const handleToggleTracking = () => {
    setIsTracking(prev => !prev);
  };

  const handleReset = () => {
    setCurrentTime(0);
    hasCompletedRef.current = false;
    setIsTracking(true);
  };

  if (!activeSource) {
    return (
      <div className={`video-player-wrapper flex items-center justify-center ${className}`}>
        <p className="text-white/50">Video bulunamadi</p>
      </div>
    );
  }

  const progress = activeSource.duration > 0 
    ? Math.min(Math.round((currentTime / activeSource.duration) * 100), 100)
    : 0;

  return (
    <div className={`relative ${className}`}>
      <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
        <iframe
          key={activeSource.id}
          src={`https://www.youtube-nocookie.com/embed/${activeSource.youtubeId}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&start=${Math.floor(initialPosition)}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={activeSource.title}
          data-testid="video-player"
        />
      </div>
      
      <div className="mt-4 bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4 mb-3">
          <Button
            size="sm"
            variant={isTracking ? "default" : "outline"}
            onClick={handleToggleTracking}
            data-testid="button-toggle-tracking"
            className="gap-2"
          >
            {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isTracking ? "Takibi Durdur" : "Takibi Baslat"}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            data-testid="button-reset-progress"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Sifirla
          </Button>
          
          <div className="flex-1" />
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isTracking 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
              : "bg-muted text-muted-foreground"
          }`}>
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
            {isTracking ? "Izleniyor" : "Duraklatildi"}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ilerleme</span>
            <span className="font-mono font-medium">
              {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')} / {Math.floor(activeSource.duration / 60)}:{(activeSource.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>%{progress} tamamlandi</span>
            {progress >= 90 && <span className="text-green-600 dark:text-green-400 font-medium">Tamamlandi!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
