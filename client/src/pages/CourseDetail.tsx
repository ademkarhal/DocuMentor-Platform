import { useCourse, useCourseVideos, useCourseDocuments, useCategories } from "@/hooks/use-api";
import { useTranslation, useStore } from "@/hooks/use-store";
import { useRoute, useSearch, useLocation } from "wouter";
import { useState, useCallback, useEffect } from "react";
import { CheckCircle2, FileText, Download, Play, Clock, Timer, Hourglass, FileSpreadsheet, FileDown, BookOpen, MessageCircle, Bell, FolderOpen, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import VideoPlayer from "@/components/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { robotoBase64 } from "@/assets/roboto-font";
import { LoginDialog } from "@/components/LoginDialog";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:slug");
  const slug = params?.slug || "";
  const searchParams = useSearch();
  const [, navigate] = useLocation();
  
  const { t, getLocalized, lang } = useTranslation();
  const { markVideoComplete, markVideoWatched, setVideoProgress, videoProgress, isVideoComplete, isAuthenticated } = useStore();
  
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { data: videos, isLoading: videosLoading } = useCourseVideos(course?.id);
  const { data: documents } = useCourseDocuments(course?.id);
  const { data: categories } = useCategories();
  
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Check if course itself is protected (from JSON config)
  const isProtected = (course as any)?.protected && !isAuthenticated;
  const courseAuthUrl = (course as any)?.authUrl || '';
  
  // Show login dialog if protected and not authenticated
  useEffect(() => {
    if (course && isProtected && !loginSuccess) {
      setLoginDialogOpen(true);
    }
  }, [course, isProtected, loginSuccess]);
  
  // Get category for breadcrumb
  const courseCategory = course?.categoryId ? categories?.find(c => c.id === course.categoryId) : null;

  const getCategoryPath = (categoryId: number | undefined) => {
    if (!categoryId || !categories) return '';
    const category = categories.find(c => c.id === categoryId);
    if (!category) return '';
    
    const parts: string[] = [];
    let current: typeof category | undefined = category;
    while (current) {
      parts.unshift(getLocalized(current.title as any));
      current = current.parentId ? categories.find(c => c.id === current!.parentId) : undefined;
    }
    return parts.join(' / ');
  };

  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [liveProgress, setLiveProgress] = useState<Record<number, number>>({});

  const sortedVideos = videos ? [...videos].sort((a, b) => a.sequenceOrder - b.sequenceOrder) : [];
  const activeVideo = sortedVideos[activeVideoIndex];

  // Handle URL video parameter
  useEffect(() => {
    if (searchParams && sortedVideos.length > 0) {
      const urlParams = new URLSearchParams(searchParams);
      const videoId = urlParams.get('video');
      if (videoId) {
        const index = sortedVideos.findIndex(v => v.id === parseInt(videoId));
        if (index !== -1) {
          setActiveVideoIndex(index);
          // Scroll to the video in the list
          setTimeout(() => {
            const videoButton = document.querySelector(`[data-testid="button-video-${videoId}"]`);
            if (videoButton) {
              videoButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    }
  }, [searchParams, sortedVideos.length]);

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

  const videoSources = sortedVideos.map(v => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: typeof v.title === 'object' ? (v.title as any).en : v.title,
    duration: v.duration
  }));

  const getInitialPosition = () => {
    if (!activeVideo || !course?.id) return 0;
    const key = `${course.id}-${activeVideo.id}`;
    return videoProgress[key] || 0;
  };

  const getProgress = (vId: number) => {
    if (liveProgress[vId] !== undefined) {
      return liveProgress[vId];
    }
    if (course?.id && isVideoComplete(course.id, vId)) return 100;
    const video = sortedVideos.find(v => v.id === vId);
    if (!video || !course?.id) return 0;
    const key = `${course.id}-${vId}`;
    const watched = videoProgress[key] || 0;
    return Math.min(Math.round((watched / video.duration) * 100), 99);
  };

  const isVideoCompleted = (vId: number) => {
    if (liveProgress[vId] === 100) return true;
    return course?.id ? isVideoComplete(course.id, vId) : false;
  };

  const totalDurationSeconds = sortedVideos.reduce((sum, v) => sum + v.duration, 0);
  const watchedDurationSeconds = sortedVideos.reduce((sum, v) => {
    if (!course?.id) return sum;
    const key = `${course.id}-${v.id}`;
    const watched = videoProgress[key] || 0;
    return sum + Math.min(watched, v.duration);
  }, 0);
  const remainingDurationSeconds = Math.max(0, totalDurationSeconds - watchedDurationSeconds);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (lang === 'tr') {
      return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
    }
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const exportToExcel = () => {
    if (!sortedVideos.length || !course) return;
    
    const courseTitle = getLocalized(course.title as any);
    const categoryPath = getCategoryPath(course.categoryId);
    
    const data = sortedVideos.map((v, i) => {
      const completed = course?.id ? isVideoComplete(course.id, v.id) : false;
      const progress = getProgress(v.id);
      const watchedSec = Math.floor(videoProgress[`${course?.id}-${v.id}`] || 0);
      const remainingSec = Math.max(0, v.duration - watchedSec);
      
      return {
        'Sıra': i + 1,
        'Kategori': categoryPath,
        'Kurs Adı': courseTitle,
        'Video Başlığı': getLocalized(v.title as any),
        'Toplam Süre': `${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}`,
        'İzlenen Süre': `${Math.floor(watchedSec / 60)}:${(watchedSec % 60).toString().padStart(2, '0')}`,
        'Kalan Süre': `${Math.floor(remainingSec / 60)}:${(remainingSec % 60).toString().padStart(2, '0')}`,
        'İlerleme %': progress,
        'Tamamlandı': completed ? 'Evet' : 'Hayır'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    
    ws['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 25 },
      { wch: 50 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 }
    ];

    const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'];
    headerCells.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = { 
          font: { bold: true, color: { rgb: "FFFFFF" } }, 
          fill: { patternType: "solid", fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kurs Icerigi');
    
    const summaryData = [
      { 'Bilgi': 'Kategori', 'Deger': categoryPath },
      { 'Bilgi': 'Kurs Adi', 'Deger': courseTitle },
      { 'Bilgi': 'Toplam Video', 'Deger': sortedVideos.length },
      { 'Bilgi': 'Toplam Sure', 'Deger': formatTime(totalDurationSeconds) },
      { 'Bilgi': 'Izlenen Sure', 'Deger': formatTime(watchedDurationSeconds) },
      { 'Bilgi': 'Kalan Sure', 'Deger': formatTime(remainingDurationSeconds) },
      { 'Bilgi': 'Tamamlanan Video', 'Deger': sortedVideos.filter(v => isVideoCompleted(v.id)).length }
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 40 }];
    
    ['A1', 'B1'].forEach(cell => {
      if (summaryWs[cell]) {
        summaryWs[cell].s = { 
          font: { bold: true, color: { rgb: "FFFFFF" } }, 
          fill: { patternType: "solid", fgColor: { rgb: "3B82F6" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    });
    
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ozet');

    XLSX.writeFile(wb, `${course.slug}-kurs-icerigi.xlsx`);
  };

  const exportToPDF = () => {
    if (!sortedVideos.length || !course) return;
    
    const doc = new jsPDF('landscape');
    
    doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
    
    const courseTitle = getLocalized(course.title as any);
    const categoryPath = getCategoryPath(course.categoryId);
    
    doc.setFontSize(14);
    doc.text(courseTitle, 14, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Kategori: ${categoryPath}`, 14, 22);
    
    doc.setFontSize(8);
    const summaryText = `Toplam: ${sortedVideos.length} video | Süre: ${formatTime(totalDurationSeconds)} | İzlenen: ${formatTime(watchedDurationSeconds)} | Kalan: ${formatTime(remainingDurationSeconds)}`;
    doc.text(summaryText, 14, 28);
    
    const tableData = sortedVideos.map((v, i) => {
      const completed = course?.id ? isVideoComplete(course.id, v.id) : false;
      const progress = getProgress(v.id);
      const duration = `${Math.floor(v.duration / 60)}:${(v.duration % 60).toString().padStart(2, '0')}`;
      return [
        (i + 1).toString(),
        getLocalized(v.title as any),
        duration,
        `%${progress}`,
        completed ? 'Evet' : 'Hayır'
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [['#', 'Video Başlığı', 'Süre', '%', 'Durum']],
      body: tableData,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        font: 'Roboto'
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 200 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' }
      },
      margin: { left: 14, right: 14 }
    });

    doc.save(`${course.slug}-kurs-icerigi.pdf`);
  };

  // Sample FAQ data
  const faqData = [
    {
      q: lang === 'tr' ? 'Bu kursu tamamlamak ne kadar sürer?' : 'How long does it take to complete this course?',
      a: lang === 'tr' 
        ? `Bu kurs toplam ${formatTime(totalDurationSeconds)} video içeriği sunmaktadır. Kendi hızınızda ilerleyebilirsiniz.`
        : `This course offers a total of ${formatTime(totalDurationSeconds)} of video content. You can progress at your own pace.`
    },
    {
      q: lang === 'tr' ? 'Videoları tekrar izleyebilir miyim?' : 'Can I rewatch the videos?',
      a: lang === 'tr' 
        ? 'Evet, tüm videoları istediğiniz kadar tekrar izleyebilirsiniz. İlerlemeniz kaydedilir.'
        : 'Yes, you can rewatch all videos as many times as you want. Your progress is saved.'
    },
    {
      q: lang === 'tr' ? 'Sertifika alabilir miyim?' : 'Can I get a certificate?',
      a: lang === 'tr' 
        ? 'Kursu tamamladığınızda ilerleme durumunuzu dışa aktarabilirsiniz.'
        : 'When you complete the course, you can export your progress status.'
    }
  ];

  // Sample announcements
  const announcements = [
    {
      date: '2025-01-05',
      title: lang === 'tr' ? 'Kurs İçeriği Güncellendi' : 'Course Content Updated',
      content: lang === 'tr' 
        ? 'Yeni videolar ve güncellenmiş materyaller eklendi.'
        : 'New videos and updated materials have been added.'
    },
    {
      date: '2025-01-01',
      title: lang === 'tr' ? 'Hoş Geldiniz!' : 'Welcome!',
      content: lang === 'tr' 
        ? 'Bu kursa katıldığınız için teşekkürler. İyi öğrenmeler!'
        : 'Thank you for joining this course. Happy learning!'
    }
  ];

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

  // If protected and not authenticated, show login dialog overlay
  if (isProtected && !loginSuccess) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center">
        <div className="text-muted-foreground mb-4">
          {lang === 'tr' ? 'Bu kurs korumalıdır. Erişmek için giriş yapmanız gerekmektedir.' : 'This course is protected. Please login to access.'}
        </div>
        <LoginDialog 
          open={loginDialogOpen} 
          onOpenChange={(open) => {
            setLoginDialogOpen(open);
            if (!open && !loginSuccess) {
              navigate('/courses');
            }
          }}
          onSuccess={() => {
            setLoginSuccess(true);
            setLoginDialogOpen(false);
          }}
          authUrl={courseAuthUrl}
        />
        <Button onClick={() => setLoginDialogOpen(true)} data-testid="button-show-login">
          {t.login}
        </Button>
      </div>
    );
  }

  const handleVideoSelect = (vId: number) => {
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
          isCurrentVideoCompleted={activeVideo ? isVideoCompleted(activeVideo.id) : false}
          onVideoChange={handleVideoChange}
          onProgress={handleVideoProgress}
          onComplete={handleVideoComplete}
          className="mb-6 shrink-0"
        />

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background" data-testid="tab-overview">
              <BookOpen className="w-4 h-4" />
              {lang === 'tr' ? 'Genel Bakış' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2 data-[state=active]:bg-background" data-testid="tab-qa">
              <MessageCircle className="w-4 h-4" />
              {lang === 'tr' ? 'Soru-Cevap' : 'Q&A'}
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2 data-[state=active]:bg-background" data-testid="tab-notes">
              <Bell className="w-4 h-4" />
              {lang === 'tr' ? 'Notlar & Duyurular' : 'Notes & Announcements'}
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2 data-[state=active]:bg-background" data-testid="tab-materials">
              <FolderOpen className="w-4 h-4" />
              {lang === 'tr' ? 'Materyaller' : 'Materials'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-2xl font-bold font-display mb-3">{getLocalized(course.title as any)}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {getLocalized(course.description as any)}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatTime(totalDurationSeconds)}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'tr' ? 'Toplam Süre' : 'Total Duration'}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <PlayCircle className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{sortedVideos.length}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'tr' ? 'Toplam Video' : 'Total Videos'}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Timer className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{formatTime(watchedDurationSeconds)}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'tr' ? 'İzlenen' : 'Watched'}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-teal-500" />
                  <p className="text-2xl font-bold">{sortedVideos.filter(v => isVideoCompleted(v.id)).length}</p>
                  <p className="text-xs text-muted-foreground">{lang === 'tr' ? 'Tamamlanan' : 'Completed'}</p>
                </div>
              </div>
            </div>

            {/* Current Video Info */}
            {activeVideo && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold mb-2">{lang === 'tr' ? 'Şu an izleniyor' : 'Now Playing'}</h3>
                    <p className="font-medium">{getLocalized(activeVideo.title as any)}</p>
                  </div>
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
                </div>
                
                {/* Video Description */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-2">{lang === 'tr' ? 'Video Açıklaması' : 'Video Description'}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {getLocalized(activeVideo.description as any) || (lang === 'tr' ? 'Bu video için açıklama bulunmamaktadır.' : 'No description available for this video.')}
                  </p>
                </div>

                {/* Transcript if available */}
                {(activeVideo as any).transcript && (
                  <div className="border-t border-border pt-4 mt-4">
                    <h4 className="text-sm font-semibold mb-2">{lang === 'tr' ? 'Video Transkripti' : 'Video Transcript'}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {(activeVideo as any).transcript}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Q&A Tab */}
          <TabsContent value="qa" className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">{lang === 'tr' ? 'Sıkça Sorulan Sorular' : 'Frequently Asked Questions'}</h3>
              <div className="space-y-4">
                {faqData.map((item, i) => (
                  <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <p className="font-medium mb-2">{item.q}</p>
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Notes & Announcements Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">{lang === 'tr' ? 'Duyurular' : 'Announcements'}</h3>
              <div className="space-y-4">
                {announcements.map((item, i) => (
                  <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{item.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">{lang === 'tr' ? 'Kurs Notları' : 'Course Notes'}</h3>
              <p className="text-muted-foreground text-sm">
                {lang === 'tr' 
                  ? 'Bu kurs için özel notlar henüz eklenmemiş. Kendi notlarınızı alarak ilerlemenizi takip edebilirsiniz.'
                  : 'No special notes have been added for this course yet. You can track your progress by taking your own notes.'}
              </p>
            </div>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> {t.documents}
              </h3>
              {documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map(doc => (
                    <a 
                      key={doc.id} 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
                      data-testid={`link-document-${doc.id}`}
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
              ) : (
                <p className="text-muted-foreground text-sm">
                  {lang === 'tr' ? 'Bu kurs için materyal bulunmamaktadır.' : 'No materials available for this course.'}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-full lg:w-96 bg-card border border-border rounded-2xl flex flex-col h-[calc(100vh-7rem)] sticky top-24 shadow-xl shadow-black/5">
        <div className="p-4 border-b border-border bg-muted/20 rounded-t-2xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-bold text-lg">{t.courseContent}</h2>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={exportToExcel} 
                className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30"
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={exportToPDF} 
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                data-testid="button-export-pdf"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {sortedVideos.filter(v => isVideoCompleted(v.id)).length} / {sortedVideos.length} {t.completed}
          </p>
          <div className="h-1 w-full bg-border rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(sortedVideos.filter(v => isVideoCompleted(v.id)).length || 0) / (sortedVideos.length || 1) * 100}%` }}
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
          {sortedVideos.map((video, index) => {
            const isActive = activeVideo?.id === video.id;
            const isCompleted = isVideoCompleted(video.id);
            const progress = getProgress(video.id);
            
            // Calculate watched and remaining time for this video
            const videoWatchedSeconds = Math.floor(videoProgress[`${course?.id}-${video.id}`] || 0);
            const videoRemainingSeconds = Math.floor(Math.max(0, video.duration - videoWatchedSeconds));
            
            const formatVideoTime = (sec: number) => {
              const m = Math.floor(sec / 60);
              const s = Math.floor(sec % 60);
              return `${m}:${s.toString().padStart(2, '0')}`;
            };

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
                    "flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[10px]",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatVideoTime(video.duration)}
                    </span>
                    <span className={cn("flex items-center gap-1", isActive ? "text-green-300" : "text-green-500")}>
                      <Timer className="w-3 h-3" />
                      {formatVideoTime(videoWatchedSeconds)}
                    </span>
                    <span className={cn("flex items-center gap-1", isActive ? "text-orange-300" : "text-orange-500")}>
                      <Hourglass className="w-3 h-3" />
                      {formatVideoTime(videoRemainingSeconds)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={(open) => {
          setLoginDialogOpen(open);
          if (!open && isProtected) {
            navigate('/courses');
          }
        }}
        authUrl={courseAuthUrl}
      />
    </div>
  );
}
