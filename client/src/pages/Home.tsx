import { useCategories, useCourses } from "@/hooks/use-api";
import { useTranslation, useStore } from "@/hooks/use-store";
import { Link } from "wouter";
import { ArrowRight, PlayCircle, Book, Layers, Trophy, Target, CheckCircle, BarChart3, Clock, TrendingUp, Play, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t, getLocalized, lang } = useTranslation();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { getStats, videoProgress, completedVideos } = useStore();
  
  const stats = getStats();
  const featuredCourses = courses?.slice(0, 3);
  
  const totalCourses = courses?.length || 0;
  const totalVideos = courses?.reduce((sum, c) => sum + (c.totalVideos || 0), 0) || 0;
  
  // Calculate total duration of all videos (estimate ~10min per video if not available)
  const totalDurationSeconds = courses?.reduce((sum, c) => sum + ((c.totalVideos || 0) * 600), 0) || 0;
  const totalDurationHours = Math.floor(totalDurationSeconds / 3600);
  const totalDurationMinutes = Math.floor((totalDurationSeconds % 3600) / 60);
  
  // Calculate completed courses (all videos in course completed)
  const completedCourseCount = courses?.filter(course => {
    if (!course.totalVideos || course.totalVideos === 0) return false;
    const courseCompletedVideos = Object.keys(completedVideos).filter(key => key.startsWith(`${course.id}-`)).length;
    return courseCompletedVideos >= course.totalVideos;
  }).length || 0;
  
  const videoSuccessRate = totalVideos > 0 ? Math.round((stats.completedCount / totalVideos) * 100) : 0;
  const courseSuccessRate = totalCourses > 0 ? Math.round((completedCourseCount / totalCourses) * 100) : 0;
  
  const totalWatchedSeconds = Object.values(videoProgress).reduce((sum, v) => sum + (v || 0), 0);
  const watchedHours = Math.floor(totalWatchedSeconds / 3600);
  const watchedMinutes = Math.floor((totalWatchedSeconds % 3600) / 60);
  
  const lastWatchedKey = Object.entries(videoProgress)
    .filter(([_, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  const lastWatchedCourseSlug = lastWatchedKey ? courses?.find(c => lastWatchedKey.startsWith(`${c.id}-`))?.slug : null;
  
  const formatDuration = (hours: number, minutes: number) => {
    if (lang === 'tr') {
      return hours > 0 ? `${hours}s ${minutes}dk` : `${minutes}dk`;
    }
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Calculate watched time for started courses
  const startedCoursesWatchedSeconds = stats.startedCourses.reduce((sum, courseId) => {
    const courseProgress = Object.entries(videoProgress)
      .filter(([key]) => key.startsWith(`${courseId}-`))
      .reduce((acc, [_, seconds]) => acc + (seconds || 0), 0);
    return sum + courseProgress;
  }, 0);
  const startedCoursesWatchedH = Math.floor(startedCoursesWatchedSeconds / 3600);
  const startedCoursesWatchedM = Math.floor((startedCoursesWatchedSeconds % 3600) / 60);

  const dashboardCards = [
    {
      icon: Book,
      label: lang === 'tr' ? "Toplam Kurs" : "Total Courses",
      value: totalCourses,
      subtext: `/ ${totalCourses}`,
      duration: formatDuration(totalDurationHours, totalDurationMinutes),
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Target,
      label: lang === 'tr' ? "Başlanan Kurs" : "Courses Started",
      value: stats.startedCourses.length,
      subtext: `/ ${totalCourses}`,
      duration: formatDuration(startedCoursesWatchedH, startedCoursesWatchedM),
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: GraduationCap,
      label: lang === 'tr' ? "Tamamlanan Kurs" : "Courses Completed",
      value: completedCourseCount,
      subtext: `/ ${totalCourses}`,
      duration: null,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: PlayCircle,
      label: lang === 'tr' ? "Toplam Video" : "Total Videos",
      value: totalVideos,
      subtext: `/ ${totalVideos}`,
      duration: formatDuration(totalDurationHours, totalDurationMinutes),
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Layers,
      label: lang === 'tr' ? "Başlanan Video" : "Videos Started",
      value: stats.watchedCount,
      subtext: `/ ${totalVideos}`,
      duration: formatDuration(watchedHours, watchedMinutes),
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      icon: CheckCircle,
      label: lang === 'tr' ? "Tamamlanan Video" : "Videos Completed",
      value: stats.completedCount,
      subtext: `/ ${totalVideos}`,
      duration: null,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      icon: Clock,
      label: lang === 'tr' ? "İzleme Süresi" : "Watch Time",
      value: formatDuration(watchedHours, watchedMinutes),
      subtext: `/ ${formatDuration(totalDurationHours, totalDurationMinutes)}`,
      duration: null,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      {/* Dashboard Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            {lang === 'tr' ? "İlerleme Durumunuz" : "Your Progress"}
          </h2>
          {lastWatchedCourseSlug && (
            <Link href={`/courses/${lastWatchedCourseSlug}`}>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-continue-watching">
                <Play className="w-4 h-4" />
                {lang === 'tr' ? "Kaldığım Yerden Devam Et" : "Continue Watching"}
              </Button>
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {dashboardCards.map((card, idx) => (
            <Card key={idx} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-1">
                  <div className={`w-10 h-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-bold" data-testid={`stat-value-${idx}`}>{card.value}</p>
                    <span className="text-xs text-muted-foreground">{card.subtext}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{card.label}</p>
                  {card.duration && (
                    <p className="text-[9px] text-muted-foreground/70 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {card.duration}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Rate Bar */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <span className="font-semibold">{lang === 'tr' ? "Başarı Oranı" : "Success Rate"}</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-muted-foreground">
                    <span>{completedCourseCount} / {totalCourses} {lang === 'tr' ? "kurs" : "courses"}</span>
                    <span>{stats.completedCount} / {totalVideos} {lang === 'tr' ? "video" : "videos"}</span>
                    <span>{formatDuration(watchedHours, watchedMinutes)} / {formatDuration(totalDurationHours, totalDurationMinutes)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-3xl font-bold text-primary" data-testid="stat-success-rate">{videoSuccessRate}%</span>
              </div>
            </div>
            <Progress value={videoSuccessRate} className="h-3" />
          </CardContent>
        </Card>

        {stats.watchedCount === 0 && (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <PlayCircle className="w-12 h-12 text-primary/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {lang === 'tr' 
                  ? "Henüz video izlemeye başlamadınız. Bir kursa göz atarak öğrenmeye başlayın!" 
                  : "You haven't started watching any videos yet. Browse a course to start learning!"}
              </p>
              <Link href="/courses">
                <Button className="mt-4 gap-2" data-testid="button-start-learning">
                  {lang === 'tr' ? "Kurslara Göz At" : "Browse Courses"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-primary-foreground relative overflow-hidden shadow-xl shadow-primary/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 leading-tight">
            {lang === 'en' ? "Master New Skills Today" : "Bugün Yeni Beceriler Edinin"}
          </h1>
          <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed max-w-xl">
            {lang === 'en' 
              ? "Explore our comprehensive library of courses and documentation to level up your professional capabilities." 
              : "Profesyonel yeteneklerinizi geliştirmek için kapsamlı kurs ve dokümantasyon kütüphanemizi keşfedin."}
          </p>
          <Link href="/courses" className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3 rounded-xl font-semibold hover:bg-background/90 transition-colors shadow-lg" data-testid="link-explore-courses">
            {t.explore} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">{t.categories}</h2>
        </div>
        
        {catLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {categories?.map((cat) => (
              <motion.div key={cat.id} variants={item}>
                <Link 
                  href={`/categories/${cat.slug}`}
                  className="group block p-6 bg-card hover:bg-muted/30 border border-border/50 hover:border-primary/50 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                  data-testid={`link-category-${cat.id}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{getLocalized(cat.title as { en: string; tr: string })}</h3>
                  <div className="w-8 h-1 bg-border group-hover:bg-primary transition-colors rounded-full mt-2" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Featured Courses */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-2xl font-bold text-foreground">{lang === 'en' ? "Featured Courses" : "Öne Çıkan Kurslar"}</h2>
          <Link href="/courses" className="text-primary font-medium hover:underline flex items-center gap-1" data-testid="link-all-courses">
            {t.courses} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-80 bg-muted/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {featuredCourses?.map((course) => (
              <motion.div key={course.id} variants={item}>
                <Link 
                  href={`/courses/${course.slug}`}
                  className="block h-full bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:border-primary/30 transition-all duration-300 group"
                  data-testid={`link-course-${course.id}`}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img 
                      src={`https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80`} 
                      alt="Course thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-white/90 text-sm font-medium">
                      <PlayCircle className="w-4 h-4" />
                      <span>{course.totalVideos} {t.totalVideos}</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {getLocalized(course.title as { en: string; tr: string })}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">
                      {getLocalized(course.description as { en: string; tr: string })}
                    </p>
                    <div className="flex items-center text-sm font-medium text-primary">
                      {t.viewCourse} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
