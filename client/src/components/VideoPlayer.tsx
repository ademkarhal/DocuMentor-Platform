import { useEffect, useRef, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import type Player from "video.js/dist/types/player";

declare global {
  interface Window {
    videojs: typeof videojs;
  }
}

interface VideoSource {
  id: number;
  youtubeId: string;
  title: string;
  duration: number;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  activeIndex: number;
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
  onVideoChange,
  onProgress,
  onComplete,
  onPlay,
  onPause,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const lastReportedTime = useRef<number>(0);
  const currentVideoIdRef = useRef<number | null>(null);

  const initializePlayer = useCallback(async () => {
    if (!videoRef.current || typeof window === "undefined") return;

    window.videojs = videojs;

    try {
      const vjsYoutube = await import("videojs-youtube");
      if (vjsYoutube.default) {
        vjsYoutube.default;
      }
    } catch (e) {
      console.warn("YouTube plugin loading:", e);
    }

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered", "vjs-theme-custom");
    videoRef.current.innerHTML = "";
    videoRef.current.appendChild(videoElement);

    const activeSource = sources[activeIndex];
    if (!activeSource) return;

    currentVideoIdRef.current = activeSource.id;

    const player = videojs(videoElement, {
      techOrder: ["youtube"],
      sources: [
        {
          type: "video/youtube",
          src: `https://www.youtube.com/watch?v=${activeSource.youtubeId}`,
        },
      ],
      youtube: {
        ytControls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        playsinline: 1,
        customVars: {
          wmode: "transparent",
        },
      },
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      controlBar: {
        children: [
          "playToggle",
          "volumePanel",
          "currentTimeDisplay",
          "timeDivider",
          "durationDisplay",
          "progressControl",
          "playbackRateMenuButton",
          "fullscreenToggle",
        ],
      },
    });

    player.on("play", () => {
      if (currentVideoIdRef.current && onPlay) {
        onPlay(currentVideoIdRef.current);
      }
    });

    player.on("pause", () => {
      if (currentVideoIdRef.current && onPause) {
        onPause(currentVideoIdRef.current);
      }
    });

    player.on("timeupdate", () => {
      const currentTime = player.currentTime() || 0;
      const duration = player.duration() || 0;

      if (duration > 0 && currentVideoIdRef.current) {
        const percent = Math.round((currentTime / duration) * 100);

        if (Math.abs(currentTime - lastReportedTime.current) >= 1) {
          lastReportedTime.current = currentTime;
          if (onProgress) {
            onProgress(currentVideoIdRef.current, currentTime, duration, percent);
          }
        }
      }
    });

    player.on("ended", () => {
      if (currentVideoIdRef.current && onComplete) {
        onComplete(currentVideoIdRef.current);
      }

      if (activeIndex < sources.length - 1 && onVideoChange) {
        onVideoChange(activeIndex + 1);
      }
    });

    player.on("error", (e: any) => {
      console.error("Video player error:", e);
    });

    playerRef.current = player;
  }, [sources, activeIndex, onProgress, onComplete, onPlay, onPause, onVideoChange]);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [initializePlayer]);

  useEffect(() => {
    if (playerRef.current && sources[activeIndex]) {
      const activeSource = sources[activeIndex];
      currentVideoIdRef.current = activeSource.id;
      lastReportedTime.current = 0;

      playerRef.current.src({
        type: "video/youtube",
        src: `https://www.youtube.com/watch?v=${activeSource.youtubeId}`,
      });

      playerRef.current.play()?.catch(() => {});
    }
  }, [activeIndex, sources]);

  return (
    <div className={`video-player-wrapper ${className}`}>
      <div ref={videoRef} data-testid="video-player" />
    </div>
  );
}
