import { useCourse, useCourseVideos, useCourseDocuments } from "@/hooks/use-api";
import { useTranslation, useStore } from "@/hooks/use-store";
import { useRoute } from "wouter";
import { useState, useCallback } from "react";
import { CheckCircle2, FileText, Download, Play, Clock, Timer, Hourglass, FileSpreadsheet, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:slug");
  const slug = params?.slug || "";
  
  const { t, getLocalized, lang } = useTranslation();
  const { markVideoComplete, markVideoWatched, setVideoProgress, videoProgress, isVideoComplete } = useStore();
  
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { data: videos, isLoading: videosLoading } = useCourseVideos(course?.id);
  const { data: documents } = useCourseDocuments(course?.id);

  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [liveProgress, setLiveProgress] = useState<Record<number, number>>({});

  const activeVideo = videos?.[activeVideoIndex];

  const handleVideoProgress = useCallback((videoId: number, currentTime: number, duration: number, percent: number) => {
    setLiveProgress(prev => ({ ...prev, [videoId]: percent }));
    
    if (course?.id) {
      markVideoWatched(course.id, videoId);
      setVideoProgress(course.id, videoId, currentTime);
    }
  }, [course?.id, markVideoWatched, setVideoProgress]);

  const handleVideoComplete = useCallback((videoId: number) => {
    setLiveProgress(prev => ({ ...prev, [videoId]: 100 }));
    if (course?.id) {
      markVideoComplete(course.id, videoId);
    }
  }, [course?.id, markVideoComplete]);

  const handleVideoChange = useCallback((newIndex: number) => {
    setActiveVideoIndex(newIndex);
  }, []);

  const videoSources = videos?.sort((a, b) => a.sequenceOrder - b.sequenceOrder).map(v => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: typeof v.title === 'object' ? (v.title as any).en : v.title,
    duration: v.duration
  })) || [];

  const getInitialPosition = () => {
    if (!activeVideo || !course?.id) return 0;
    const key = `${course.id}-${activeVideo.id}`;
    return videoProgress[key] || 0;
  };

  // Calculate course durations
  const totalDurationSeconds = videos?.reduce((sum, v) => sum + v.duration, 0) || 0;
  const watchedDurationSeconds = videos?.reduce((sum, v) => {
    if (!course?.id) return sum;
    const key = `${course.id}-${v.id}`;
    return sum + (videoProgress[key] || 0);
  }, 0) || 0;
  const remainingDurationSeconds = Math.max(0, totalDurationSeconds - watchedDurationSeconds);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (lang === 'tr') {
      return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
    }
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Export functions
  const exportToCSV = () => {
    if (!videos || !course) return;
    
    const headers = ['Sıra', 'Video Başlığı', 'Süre', 'İzleme Durumu', 'Tamamlandı'];
    const rows = videos.sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((v, i) => {
      const completed = course?.id ? isVideoComplete(course.id, v.id) : false;
      const progress = getProgress(v.id);
      return [
        i + 1,
        `"${getLocalized(v.title as any)}"`,
        `${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}`,
        `${progress}%`,
        completed ? 'Evet' : 'Hayır'
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.slug}-kurs-icerigi.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!videos || !course) return;
    
    const content = videos.sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((v, i) => {
      const completed = course?.id ? isVideoComplete(course.id, v.id) : false;
      const progress = getProgress(v.id);
      const duration = `${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}`;
      return `${i + 1}. ${getLocalized(v.title as any)} - ${duration} - %${progress} ${completed ? '(Tamamlandı)' : ''}`;
    }).join('\n');

    const header = `${getLocalized(course.title as any)}\n\nToplam: ${videos.length} video | Süre: ${formatTime(totalDurationSeconds)} | İzlenen: ${formatTime(watchedDurationSeconds)} | Kalan: ${formatTime(remainingDurationSeconds)}\n\n`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${getLocalized(course.title as any)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px; }
              .info { background: #f0f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .video { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
              .completed { color: #38a169; }
            </style>
          </head>
          <body>
            <h1>${getLocalized(course.title as any)}</h1>
            <div class="info">
              <strong>Toplam:</strong> ${videos.length} video | 
              <strong>Süre:</strong> ${formatTime(totalDurationSeconds)} | 
              <strong>İzlenen:</strong> ${formatTime(watchedDurationSeconds)} | 
              <strong>Kalan:</strong> ${formatTime(remainingDurationSeconds)}
            </div>
            ${videos.sort((a, b) => a.sequenceOrder - b.sequenceOrder).map((v, i) => {
              const completed = course?.id ? isVideoComplete(course.id, v.id) : false;
              const progress = getProgress(v.id);
              const duration = `${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}`;
              return `<div class="video ${completed ? 'completed' : ''}">${i + 1}. ${getLocalized(v.title as any)} - ${duration} - %${progress} ${completed ? '<strong>(Tamamlandı)</strong>' : ''}</div>`;
            }).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

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

  if (!course) return <div className="p-12 text-center text-muted-foreground">Kurs bulunamadi</div>;

  const getProgress = (vId: number) => {
    if (liveProgress[vId] !== undefined) {
      return liveProgress[vId];
    }
    if (course?.id && isVideoComplete(course.id, vId)) return 100;
    const video = videos?.find(v => v.id === vId);
    if (!video || !course?.id) return 0;
    const key = `${course.id}-${vId}`;
    const watched = videoProgress[key] || 0;
    return Math.min(Math.round((watched / video.duration) * 100), 99);
  };

  const isVideoCompleted = (vId: number) => {
    if (liveProgress[vId] === 100) return true;
    return course?.id ? isVideoComplete(course.id, vId) : false;
  };

  const handleVideoSelect = (vId: number) => {
    const sortedVideos = videos?.sort((a, b) => a.sequenceOrder - b.sequenceOrder) || [];
    const index = sortedVideos.findIndex(v => v.id === vId);
    if (index !== -1) {
      setActiveVideoIndex(index);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2">
        <VideoPlayer
          sources={videoSources}
          activeIndex={activeVideoIndex}
          initialPosition={getInitialPosition()}
          onVideoChange={handleVideoChange}
          onProgress={handleVideoProgress}
          onComplete={handleVideoComplete}
          className="mb-6 shrink-0"
        />

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold font-display mb-2">{activeVideo ? getLocalized(activeVideo.title as any) : getLocalized(course.title as any)}</h1>
              <p className="text-muted-foreground leading-relaxed">
                {activeVideo ? getLocalized(activeVideo.description as any) : getLocalized(course.description as any)}
              </p>
            </div>
            {activeVideo && (
              <div 
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border shrink-0",
                  isVideoCompleted(activeVideo.id)
                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                    : "bg-background text-muted-foreground border-border"
                )}
              >
                {isVideoCompleted(activeVideo.id) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> {t.completed}
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" /> %{getProgress(activeVideo.id)} {t.completed}
                  </>
                )}
              </div>
            )}
          </div>

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
                        {getLocalized(doc.title as any)}
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

      <div className="w-full lg:w-96 bg-card border border-border rounded-2xl flex flex-col h-[calc(100vh-7rem)] sticky top-24 shadow-xl shadow-black/5">
        <div className="p-4 border-b border-border bg-muted/20 rounded-t-2xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-bold text-lg">{t.courseContent}</h2>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={exportToCSV} title="Excel/CSV" data-testid="button-export-csv">
                <FileSpreadsheet className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={exportToPDF} title="PDF" data-testid="button-export-pdf">
                <FileDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {videos?.filter(v => isVideoCompleted(v.id)).length} / {videos?.length} {t.completed}
          </p>
          <div className="h-1 w-full bg-border rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(videos?.filter(v => isVideoCompleted(v.id)).length || 0) / (videos?.length || 1) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lang === 'tr' ? 'Toplam:' : 'Total:'} {formatTime(totalDurationSeconds)}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3 text-green-500" />
              {lang === 'tr' ? 'İzlenen:' : 'Watched:'} {formatTime(watchedDurationSeconds)}
            </span>
            <span className="flex items-center gap-1">
              <Hourglass className="w-3 h-3 text-orange-500" />
              {lang === 'tr' ? 'Kalan:' : 'Remaining:'} {formatTime(remainingDurationSeconds)}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {videos?.sort((a,b) => a.sequenceOrder - b.sequenceOrder).map((video, index) => {
            const isActive = activeVideo?.id === video.id;
            const isCompleted = isVideoCompleted(video.id);
            const progress = getProgress(video.id);

            return (
              <button
                key={video.id}
                onClick={() => handleVideoSelect(video.id)}
                data-testid={`button-video-${video.id}`}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "hover:bg-muted/50 text-foreground"
                )}
              >
                <div className={cn(
                  "mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : isCompleted 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-500" 
                      : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
                )}>
                  {isCompleted && !isActive ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className={cn(
                      "text-sm font-medium leading-tight truncate",
                      isActive ? "text-primary-foreground" : "text-foreground group-hover:text-primary"
                    )}>
                      {getLocalized(video.title as any)}
                    </p>
                    <span className={cn(
                      "text-[10px] font-mono shrink-0",
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      %{progress}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-black/10 dark:bg-white/10 rounded-full mb-1 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        isActive ? "bg-white/40" : isCompleted ? "bg-green-500" : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
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
