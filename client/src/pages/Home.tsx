import { useCategories, useCourses } from "@/hooks/use-api";
import { useTranslation, useStore } from "@/hooks/use-store";
import { Link } from "wouter";
import { ArrowRight, PlayCircle, Book, Layers, Trophy, Target, CheckCircle, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const { t, getLocalized, lang } = useTranslation();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { getStats } = useStore();
  
  const stats = getStats();
  const featuredCourses = courses?.slice(0, 3);
  
  const totalVideos = courses?.reduce((sum, c) => sum + (c.totalVideos || 0), 0) || 0;
  const successRate = totalVideos > 0 ? Math.round((stats.completedCount / totalVideos) * 100) : 0;

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

  const dashboardCards = [
    {
      icon: Book,
      label: t.totalCourses,
      value: courses?.length || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: PlayCircle,
      label: t.totalVideosCount,
      value: totalVideos,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Target,
      label: t.watchedVideos,
      value: stats.watchedCount,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: CheckCircle,
      label: t.completedVideos,
      value: stats.completedCount,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            {t.yourProgress}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboardCards.map((card, idx) => (
            <Card key={idx} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid={`stat-value-${idx}`}>{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Rate Bar */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">{t.successRate}</span>
              </div>
              <span className="text-2xl font-bold text-primary" data-testid="stat-success-rate">{successRate}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completedCount} / {totalVideos} {t.videos.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        {/* Courses Started */}
        {stats.startedCourses.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="w-4 h-4" />
            <span>{t.coursesStarted}: {stats.startedCourses.length}</span>
          </div>
        )}

        {stats.watchedCount === 0 && (
          <p className="text-center text-muted-foreground py-4">{t.startLearning}</p>
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
