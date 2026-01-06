import { useCourses, useCourseVideos } from "@/hooks/use-api";
import { useTranslation, useStore } from "@/hooks/use-store";
import { Link } from "wouter";
import { PlayCircle, ArrowRight, Clock, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function Courses() {
  const { t, getLocalized, lang } = useTranslation();
  const { data: courses, isLoading } = useCourses();
  const { videoProgress, completedVideos, isVideoComplete } = useStore();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
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
    
    const totalSeconds = totalVideos * 600; // ~10min per video estimate
    const percent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
    
    return { watchedSeconds, completedCount, totalSeconds, percent };
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-foreground">{t.courses}</h1>
        <p className="text-muted-foreground mt-2">
          {useTranslation().lang === 'en' 
            ? "Explore our complete catalog of educational content." 
            : "Eğitim içeriği kataloğumuzun tamamını keşfedin."}
        </p>
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
            const progress = getCourseProgress(course.id, course.totalVideos || 0);
            const hasStarted = progress.watchedSeconds > 0;
            
            return (
              <motion.div key={course.id} variants={item}>
                <Link 
                  href={`/courses/${course.slug}`}
                  className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:border-primary/30 transition-all duration-300 group"
                  data-testid={`card-course-${course.id}`}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img 
                      src={`https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80`} 
                      alt={getLocalized(course.title)} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-white/90 text-sm font-medium">
                      <PlayCircle className="w-4 h-4" />
                      <span>{course.totalVideos} {t.totalVideos}</span>
                    </div>
                    {hasStarted && (
                      <div className="absolute bottom-0 left-0 right-0 z-20">
                        <Progress value={progress.percent} className="h-1 rounded-none bg-white/20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                      {getLocalized(course.title)}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                      {getLocalized(course.description)}
                    </p>
                    
                    {hasStarted && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-green-500" />
                          {lang === 'tr' ? 'İzlenen:' : 'Watched:'} {formatTime(progress.watchedSeconds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-500" />
                          {progress.completedCount}/{course.totalVideos} {lang === 'tr' ? 'video' : 'videos'}
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-border flex items-center justify-between mt-auto gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {hasStarted ? `%${progress.percent}` : 'Course'}
                      </span>
                      <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        {hasStarted ? (lang === 'tr' ? 'Devam Et' : 'Continue') : t.viewCourse} <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
