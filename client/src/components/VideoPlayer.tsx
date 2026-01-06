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

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: {
        videoId: string;
        playerVars?: Record<string, unknown>;
        events?: {
          onReady?: (event: { target: YTPlayer }) => void;
          onStateChange?: (event: { data: number; target: YTPlayer }) => void;
        };
      }) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

let apiLoaded = false;
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;
  
  apiLoadPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
      if (window.YT && window.YT.Player) {
        apiLoaded = true;
        resolve();
      } else {
        window.onYouTubeIframeAPIReady = () => {
          apiLoaded = true;
          resolve();
        };
      }
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);
  });
  
  return apiLoadPromise;
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
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  const containerIdRef = useRef<string>(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
  const lastVideoIdRef = useRef<number | null>(null);

  const activeSource = sources[activeIndex];

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startProgressTracking = useCallback(() => {
    if (!activeSource || !playerRef.current) return;
    
    clearProgressInterval();
    
    progressIntervalRef.current = setInterval(() => {
      const player = playerRef.current;
      const source = activeSource;
      
      if (!player || !source) {
        clearProgressInterval();
        return;
      }
      
      try {
        if (typeof player.getPlayerState !== 'function') return;
        
        const playerState = player.getPlayerState();
        
        if (playerState !== 1) return;
        
        if (typeof player.getCurrentTime !== 'function' || typeof player.getDuration !== 'function') return;
        
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration() || source.duration;
        
        if (duration > 0 && !isNaN(currentTime) && !isNaN(duration)) {
          const percent = Math.min(Math.round((currentTime / duration) * 100), 100);
          
          if (onProgress) {
            onProgress(source.id, currentTime, duration, percent);
          }

          if (percent >= 90 && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            if (onComplete) {
              onComplete(source.id);
            }
          }

          if (currentTime >= duration - 1) {
            clearProgressInterval();
            
            if (activeIndex < sources.length - 1 && onVideoChange) {
              setTimeout(() => onVideoChange(activeIndex + 1), 1500);
            }
          }
        }
      } catch {
        // Player not ready or destroyed
      }
    }, 1000);
  }, [activeSource, onProgress, onComplete, onVideoChange, activeIndex, sources.length, clearProgressInterval]);

  useEffect(() => {
    if (!activeSource) return;

    const isNewVideo = lastVideoIdRef.current !== activeSource.id;
    lastVideoIdRef.current = activeSource.id;

    if (isNewVideo) {
      hasCompletedRef.current = false;
    }

    const initPlayer = async () => {
      await loadYouTubeAPI();
      
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      const container = document.getElementById(containerIdRef.current);
      if (!container) return;

      playerRef.current = new window.YT.Player(containerIdRef.current, {
        videoId: activeSource.youtubeId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          start: Math.floor(initialPosition),
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            startProgressTracking();
          },
          onStateChange: (event) => {
            if (event.data === 1) {
              startProgressTracking();
            } else {
              clearProgressInterval();
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      clearProgressInterval();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Player already destroyed
        }
        playerRef.current = null;
      }
    };
  }, [activeSource?.id, initialPosition, startProgressTracking, clearProgressInterval]);

  if (!activeSource) {
    return (
      <div className={`aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center ${className}`}>
        <p className="text-white/50">Video bulunamadi</p>
      </div>
    );
  }

  return (
    <div className={`yt-wrapper ${className}`}>
      <div 
        id={containerIdRef.current}
        className="w-full h-full"
        data-testid="video-player"
      />
    </div>
  );
}
