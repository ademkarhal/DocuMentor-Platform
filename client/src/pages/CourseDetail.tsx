import { useCourse, useCourseVideos, useCourseDocuments } from "@/hooks/use-api";
import { useTranslation, useStore } from "@/hooks/use-store";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { CheckCircle2, Circle, FileText, Download, Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug || "";
  
  const { t, getLocalized } = useTranslation();
  const playerRef = useRef<ReactPlayer>(null);
  
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { data: videos, isLoading: videosLoading } = useCourseVideos(course?.id);
  const { data: documents } = useCourseDocuments(course?.id);
  
  const { data: progressData } = useQuery<any[]>({
    queryKey: [`/api/courses/${course?.id}/progress`],
    enabled: !!course?.id,
  });

  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (videos && videos.length > 0 && !activeVideoId) {
      setActiveVideoId(videos[0].id);
    }
  }, [videos]);

  if (courseLoading || videosLoading) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse p-6">
        <div className="h-96 bg-muted rounded-3xl mb-8"></div>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return <div className="p-12 text-center text-muted-foreground">Course not found</div>;

  const activeVideo = videos?.find(v => v.id === activeVideoId);
  const currentProgress = progressData?.find((p: any) => p.videoId === activeVideoId);
  
  const handleProgress = (state: { playedSeconds: number }) => {
    if (!activeVideo || !course) return;
    
    const isCompleted = state.playedSeconds / activeVideo.duration > 0.9;
    
    apiRequest("POST", "/api/progress", {
      courseId: course.id,
      videoId: activeVideo.id,
      lastPosition: Math.floor(state.playedSeconds),
      isCompleted: isCompleted || currentProgress?.isCompleted || false
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/progress`] });
    });
  };

  const handleVideoComplete = () => {
    if (!activeVideo || !course) return;
    apiRequest("POST", "/api/progress", {
      courseId: course.id,
      videoId: activeVideo.id,
      lastPosition: activeVideo.duration,
      isCompleted: true
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}/progress`] });
    });
  };

  const getProgress = (vId: number) => {
    const p = progressData?.find((p: any) => p.videoId === vId);
    if (p?.isCompleted) return 100;
    const video = videos?.find(v => v.id === vId);
    if (!p || !video) return 0;
    return Math.min(Math.round((p.lastPosition / video.duration) * 100), 99);
  };

  const isVideoCompleted = (vId: number) => {
    return !!progressData?.find((p: any) => p.videoId === vId)?.isCompleted;
  };

  const handleVideoSelect = (vId: number) => {
    setActiveVideoId(vId);
    setIsReady(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2">
        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/20 mb-6 shrink-0 relative">
          {activeVideo ? (
            <ReactPlayer
              key={activeVideo.id}
              ref={playerRef}
              url={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
              width="100%"
              height="100%"
              controls
              onProgress={handleProgress}
              onReady={() => {
                if (currentProgress?.lastPosition && !isReady) {
                  playerRef.current?.seekTo(currentProgress.lastPosition);
                  setIsReady(true);
                }
              }}
              onStart={() => setIsReady(true)}
              config={{
                youtube: {
                  playerVars: { showinfo: 1 }
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              Select a video to start learning
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display mb-2">{activeVideo ? getLocalized(activeVideo.title as { en: string; tr: string }) : getLocalized(course.title as { en: string; tr: string })}</h1>
              <p className="text-muted-foreground leading-relaxed">
                {activeVideo ? getLocalized(activeVideo.description as { en: string; tr: string }) : getLocalized(course.description as { en: string; tr: string })}
              </p>
            </div>
            {activeVideo && (
              <button 
                onClick={handleVideoComplete}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  currentProgress?.isCompleted
                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {currentProgress?.isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> {t.completed}
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" /> Mark Complete
                  </>
                )}
              </button>
            )}
          </div>

          {/* Documents Section */}
          {documents && documents.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> {t.documents}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map(doc => (
                  <a 
                    key={doc.id} 
                    href={doc.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm border border-border">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {getLocalized(doc.title as { en: string; tr: string })}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">{doc.fileType}</p>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Playlist */}
      <div className="w-full lg:w-96 bg-card border border-border rounded-2xl flex flex-col h-[calc(100vh-7rem)] sticky top-24 shadow-xl shadow-black/5">
        <div className="p-4 border-b border-border bg-muted/20 rounded-t-2xl">
          <h2 className="font-bold text-lg">{t.courseContent}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {videos?.filter(v => isVideoCompleted(v.id)).length} / {videos?.length} {t.completed}
          </p>
          <div className="h-1 w-full bg-border rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(videos?.filter(v => isVideoCompleted(v.id)).length || 0) / (videos?.length || 1) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {videos?.sort((a,b) => a.sequenceOrder - b.sequenceOrder).map((video, index) => {
            const isActive = activeVideoId === video.id;
            const isCompleted = isVideoCompleted(video.id);

            return (
              <button
                key={video.id}
                onClick={() => handleVideoSelect(video.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className={cn(
                  "mt-0.5 shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : isCompleted ? "text-green-500" : "text-muted-foreground"
                )}>
                  {isActive ? (
                    <Play className="w-4 h-4 fill-current" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-mono font-medium opacity-50 w-4 inline-block text-center">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn(
                      "text-sm font-medium leading-tight truncate mr-2",
                      isActive ? "text-primary-foreground" : "text-foreground group-hover:text-primary"
                    )}>
                      {getLocalized(video.title as { en: string; tr: string })}
                    </p>
                    <span className={cn(
                      "text-[10px] font-mono",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      %{getProgress(video.id)}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-black/10 rounded-full mb-1 overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", isActive ? "bg-white/40" : "bg-primary")}
                      style={{ width: `${getProgress(video.id)}%` }}
                    />
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 text-xs",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
