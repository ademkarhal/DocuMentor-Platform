import { useCourses, useCategories } from "@/hooks/use-api";
import { useTranslation, useStore } from "@/hooks/use-store";
import { Link, useLocation } from "wouter";
import { PlayCircle, ArrowRight, Clock, Timer, CheckCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { LoginDialog } from "@/components/LoginDialog";

interface CoursesProps {
  categorySlug?: string;
}

export default function Courses({ categorySlug }: CoursesProps) {
  const { t, getLocalized, lang } = useTranslation();
  const { data: allCourses, isLoading } = useCourses();
  const { data: categories } = useCategories();
  const { videoProgress, completedVideos, isAuthenticated } = useStore();
  const [, navigate] = useLocation();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [pendingCourseSlug, setPendingCourseSlug] = useState<string | null>(null);
  
  // Filter courses by category if categorySlug is provided
  const selectedCategory = categorySlug ? categories?.find(c => c.slug === categorySlug) : null;
  const courses = categorySlug && selectedCategory
    ? allCourses?.filter(c => c.categoryId === selectedCategory.id)
    : allCourses;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  const formatDuration = (h: number, m: number) => {
    if (lang === 'tr') {
      return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
    }
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const getCourseProgress = (courseId: number, totalVideos: number) => {
    const watchedSeconds = Object.entries(videoProgress)
      .filter(([key]) => key.startsWith(`${courseId}-`))
      .reduce((sum, [_, sec]) => sum + (sec || 0), 0);
    
    const completedCount = Object.keys(completedVideos)
      .filter(key => key.startsWith(`${courseId}-`)).length;
    
    const totalSeconds = totalVideos * 600;
    const percent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
    
    return { watchedSeconds, completedCount, totalSeconds, percent };
  };

  // Get page title based on category
  const pageTitle = selectedCategory 
    ? getLocalized(selectedCategory.title as { en: string; tr: string })
    : t.courses;
  
  const pageDescription = selectedCategory
    ? (lang === 'en' 
        ? `Courses in ${getLocalized(selectedCategory.title as { en: string; tr: string })} category.`
        : `${getLocalized(selectedCategory.title as { en: string; tr: string })} kategorisindeki kurslar.`)
    : (lang === 'en' 
        ? "Explore our complete catalog of educational content." 
        : "Eğitim içeriği kataloğumuzun tamamını keşfedin.");

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">{pageTitle}</h1>
        <p className="text-muted-foreground mt-2">{pageDescription}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-muted/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {courses?.map((course) => {
            const totalDuration = (course.totalVideos || 0) * 600;
            const progress = getCourseProgress(course.id, course.totalVideos || 0);
            const hasStarted = progress.watchedSeconds > 0;
            
            // Find category for this course
            const courseCategory = categories?.find(c => c.id === course.categoryId);
            const parentCategory = courseCategory?.parentId ? categories?.find(c => c.id === courseCategory.parentId) : null;
            const categoryLabel = parentCategory 
              ? `${getLocalized(parentCategory.title as { en: string; tr: string })} / ${getLocalized(courseCategory?.title as { en: string; tr: string })}`
              : getLocalized(courseCategory?.title as { en: string; tr: string });
            
            // Check if course category is protected
            const isProtected = (courseCategory as any)?.protected && !isAuthenticated;
            
            const handleCourseClick = (e: React.MouseEvent) => {
              if (isProtected) {
                e.preventDefault();
                setPendingCourseSlug(course.slug);
                setLoginDialogOpen(true);
              }
            };
            
            return (
              <motion.div key={course.id} variants={item}>
                <Link 
                  href={`/courses/${course.slug}`}
                  onClick={handleCourseClick}
                  className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:border-primary/30 transition-all duration-300 group"
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img 
                      src={`https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80`} 
                      alt={getLocalized(course.title as { en: string; tr: string })} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Category badge */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                        {categoryLabel}
                      </span>
                      {isProtected && (
                        <span className="p-1.5 rounded-md bg-amber-500/90 text-white backdrop-blur-sm" title={t.protectedCourse}>
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-white/90 text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{course.totalVideos} {t.totalVideos}</span>
                      </div>
                      {hasStarted && (
                        <div className="px-2 py-0.5 rounded-full bg-primary/80 text-white text-xs font-bold">
                          %{progress.percent}
                        </div>
                      )}
                    </div>
                    {hasStarted && (
                      <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/30">
                        <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {getLocalized(course.title as { en: string; tr: string })}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                      {getLocalized(course.description as { en: string; tr: string })}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm min-h-[52px]">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-foreground font-medium">
                          {formatDuration(Math.floor(totalDuration / 3600), Math.floor((totalDuration % 3600) / 60))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PlayCircle className="w-4 h-4 text-purple-500" />
                        <span className="text-foreground font-medium">{course.totalVideos} {lang === 'tr' ? 'video' : 'videos'}</span>
                      </div>
                      {hasStarted ? (
                        <>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Timer className="w-4 h-4 text-green-500" />
                            <span className="text-foreground font-medium">
                              {formatDuration(Math.floor(progress.watchedSeconds / 3600), Math.floor((progress.watchedSeconds % 3600) / 60))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-teal-500" />
                            <span className="text-foreground font-medium">{progress.completedCount} {lang === 'tr' ? 'tamamlandı' : 'done'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="invisible flex items-center gap-2">
                            <Timer className="w-4 h-4" />
                            <span>-</span>
                          </div>
                          <div className="invisible flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>-</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-3 border-t border-border flex items-center text-sm font-medium text-primary">
                      {hasStarted ? (lang === 'tr' ? 'Devam Et' : 'Continue') : t.viewCourse} 
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      
      <LoginDialog 
        open={loginDialogOpen} 
        onOpenChange={setLoginDialogOpen}
        onSuccess={() => {
          if (pendingCourseSlug) {
            navigate(`/courses/${pendingCourseSlug}`);
            setPendingCourseSlug(null);
          }
        }}
      />
    </div>
  );
}
