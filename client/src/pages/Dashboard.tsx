import { useStore } from "@/hooks/use-store";
import { useCourses } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, Clock, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: courses, isLoading } = useCourses();
  const { completedVideos, videoProgress } = useStore();

  if (isLoading) return <div className="p-8 animate-pulse">Loading...</div>;

  const stats = courses?.map(course => {
    const totalVideos = course.totalVideos || 1;
    const completedCount = Object.keys(completedVideos).filter(key => key.startsWith(`${course.id}-`)).length;
    const progressPercent = Math.min(Math.round((completedCount / totalVideos) * 100), 100);
    
    return {
      ...course,
      completedCount,
      progressPercent
    };
  });

  const totalCourses = courses?.length || 0;
  const overallProgress = stats?.reduce((acc, curr) => acc + curr.progressPercent, 0) || 0;
  const averageProgress = totalCourses > 0 ? Math.round(overallProgress / totalCourses) : 0;
  const totalCompletedVideos = Object.keys(completedVideos).length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Eğitim Panelim</h1>
        <p className="text-muted-foreground">Öğrenme yolculuğundaki ilerlemeni buradan takip edebilirsin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kurs</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{averageProgress}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Videolar</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedVideos}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genel İlerleme</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Progress value={averageProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <h2 className="text-2xl font-bold">Kurs İlerlemeleri</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {stats?.map((course) => (
            <Card key={course.id} className="overflow-hidden hover-elevate">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">{course.title.tr}</h3>
                  <span className="text-sm font-medium text-primary">%{course.progressPercent}</span>
                </div>
                <Progress value={course.progressPercent} className="h-2 mb-4" />
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  {course.completedCount} / {course.totalVideos} Video Tamamlandı
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
