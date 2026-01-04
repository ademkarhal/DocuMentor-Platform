import { useCourses } from "@/hooks/use-api";
import { useTranslation } from "@/hooks/use-store";
import { Link } from "wouter";
import { PlayCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Courses() {
  const { t, getLocalized } = useTranslation();
  const { data: courses, isLoading } = useCourses();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
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
          {courses?.map((course) => (
            <motion.div key={course.id} variants={item}>
              <Link 
                href={`/courses/${course.slug}`}
                className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-black/5 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  {/* office meeting collaboration */}
                  <img 
                    src={`https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80`} 
                    alt={getLocalized(course.title)} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-white/90 text-sm font-medium">
                    <PlayCircle className="w-4 h-4" />
                    <span>{course.totalVideos} {t.totalVideos}</span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                    {getLocalized(course.title)}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
                    {getLocalized(course.description)}
                  </p>
                  <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</span>
                    <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {t.viewCourse} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
