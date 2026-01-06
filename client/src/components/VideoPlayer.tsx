import { useEffect, useRef, useCallback, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

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
  isCurrentVideoCompleted?: boolean;
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
  isCurrentVideoCompleted = false,
  onVideoChange,
  onProgress,
  onComplete,
  className = "",
}: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  const wasAlreadyCompletedRef = useRef<boolean>(false);
  const containerIdRef = useRef<string>(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
  const lastVideoIdRef = useRef<number | null>(null);
  const initialPositionRef = useRef<number>(initialPosition);
  const [showEndOverlay, setShowEndOverlay] = useState(false);

  const activeSource = sources[activeIndex];
  
  // Only update initialPositionRef when video changes
  if (activeSource && lastVideoIdRef.current !== activeSource.id) {
    initialPositionRef.current = initialPosition;
  }

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  const onVideoChangeRef = useRef(onVideoChange);
  const activeIndexRef = useRef(activeIndex);
  const sourcesLengthRef = useRef(sources.length);

  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
    onVideoChangeRef.current = onVideoChange;
    activeIndexRef.current = activeIndex;
    sourcesLengthRef.current = sources.length;
  }, [onProgress, onComplete, onVideoChange, activeIndex, sources.length]);

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
          
          if (onProgressRef.current) {
            onProgressRef.current(source.id, currentTime, duration, percent);
          }

          // Video tamamlandı = %100 (video sonuna kadar izlendiğinde)
          // ENDED state'te tamamlanma işaretlenecek, burada sadece progress takibi yapılıyor
        }
      } catch {
        // Player not ready or destroyed
      }
    }, 1000);
  }, [activeSource, clearProgressInterval]);

  useEffect(() => {
    if (!activeSource) return;

    const isNewVideo = lastVideoIdRef.current !== activeSource.id;
    lastVideoIdRef.current = activeSource.id;

    if (isNewVideo) {
      hasCompletedRef.current = false;
      wasAlreadyCompletedRef.current = isCurrentVideoCompleted;
      setShowEndOverlay(false);
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
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          start: Math.floor(initialPositionRef.current),
          origin: window.location.origin,
          showinfo: 0,
          fs: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            startProgressTracking();
          },
          onStateChange: (event) => {
            if (event.data === 1) {
              startProgressTracking();
              setShowEndOverlay(false);
            } else if (event.data === 0) {
              setShowEndOverlay(true);
              // Video ended - mark complete and maybe auto advance
              clearProgressInterval();
              
              // Videoyu tamamlandı olarak işaretle (sadece bir kez)
              if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                if (onCompleteRef.current && activeSource) {
                  onCompleteRef.current(activeSource.id);
                }
                
                // Progress'i %100 olarak gönder
                if (onProgressRef.current && activeSource) {
                  const duration = activeSource.duration || 1;
                  onProgressRef.current(activeSource.id, duration, duration, 100);
                }
              }
              
              // Sonraki videoya geç - SADECE video daha önce tamamlanmamışsa
              // Tekrar izlenen videolarda otomatik geçiş yapma
              if (!wasAlreadyCompletedRef.current) {
                const nextIndex = activeIndexRef.current + 1;
                if (nextIndex < sourcesLengthRef.current && onVideoChangeRef.current) {
                  setTimeout(() => {
                    if (onVideoChangeRef.current) {
                      onVideoChangeRef.current(nextIndex);
                    }
                  }, 1000);
                }
              }
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
  }, [activeSource?.id, clearProgressInterval]);

  if (!activeSource) {
    return (
      <div className={`aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center ${className}`}>
        <p className="text-white/50">Video bulunamadi</p>
      </div>
    );
  }

  const handleReplay = () => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(0, true);
      setShowEndOverlay(false);
    }
  };

  const handleNextVideo = () => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < sources.length && onVideoChange) {
      onVideoChange(nextIndex);
    }
  };

  const hasNextVideo = activeIndex + 1 < sources.length;

  return (
    <div className={`yt-wrapper ${className}`}>
      <div 
        id={containerIdRef.current}
        className="w-full h-full"
        data-testid="video-player"
      />
      {/* End overlay to hide YouTube recommendations */}
      {showEndOverlay && (
        <div className="absolute inset-0 z-30 bg-gradient-to-t from-black/90 via-black/70 to-black/50 flex flex-col items-center justify-center gap-4">
          <p className="text-white text-lg font-medium mb-2">Video tamamlandı</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReplay}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              data-testid="button-replay"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tekrar İzle</span>
            </button>
            {hasNextVideo && (
              <button
                onClick={handleNextVideo}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                data-testid="button-next-video"
              >
                <Play className="w-4 h-4" />
                <span>Sonraki Video</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
