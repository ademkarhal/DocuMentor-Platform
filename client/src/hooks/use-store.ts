import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'tr';
type Theme = 'light' | 'dark';

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  completedVideos: Record<string, boolean>; // key: courseId-videoId
  videoProgress: Record<string, number>; // key: courseId-videoId, value: currentTime in seconds
  watchedVideos: Record<string, boolean>; // videos that have been started watching
  setVideoProgress: (courseId: number, videoId: number, currentTime: number) => void;
  markVideoComplete: (courseId: number, videoId: number) => void;
  markVideoWatched: (courseId: number, videoId: number) => void;
  isVideoComplete: (courseId: number, videoId: number) => boolean;
  getStats: () => { 
    watchedCount: number; 
    completedCount: number; 
    startedCourses: string[];
    completedCourses: string[];
  };
  getCourseProgress: (courseId: number, totalVideos: number) => number;
}

const getDefaultLanguage = (): Language => {
  const stored = localStorage.getItem('training-platform-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.language) return parsed.state.language;
    } catch {}
  }
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('tr') ? 'tr' : 'en';
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: getDefaultLanguage(),
      setLanguage: (lang) => set({ language: lang }),
      theme: 'light',
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      completedVideos: {},
      videoProgress: {},
      watchedVideos: {},
      setVideoProgress: (courseId, videoId, currentTime) => set((state) => ({
        videoProgress: { ...state.videoProgress, [`${courseId}-${videoId}`]: currentTime }
      })),
      markVideoComplete: (courseId, videoId) => set((state) => ({
        completedVideos: { ...state.completedVideos, [`${courseId}-${videoId}`]: true }
      })),
      markVideoWatched: (courseId, videoId) => set((state) => ({
        watchedVideos: { ...state.watchedVideos, [`${courseId}-${videoId}`]: true }
      })),
      isVideoComplete: (courseId, videoId) => !!get().completedVideos[`${courseId}-${videoId}`],
      getStats: () => {
        const state = get();
        const watchedCount = Object.keys(state.watchedVideos).length;
        const completedCount = Object.keys(state.completedVideos).length;
        
        const startedCourses = new Set<string>();
        Object.keys(state.watchedVideos).forEach(key => {
          const courseId = key.split('-')[0];
          startedCourses.add(courseId);
        });
        
        const completedCourseSet = new Set<string>();
        Object.keys(state.completedVideos).forEach(key => {
          const courseId = key.split('-')[0];
          completedCourseSet.add(courseId);
        });
        
        return { 
          watchedCount, 
          completedCount, 
          startedCourses: Array.from(startedCourses),
          completedCourses: Array.from(completedCourseSet) 
        };
      },
      getCourseProgress: (courseId, totalVideos) => {
        const state = get();
        if (totalVideos === 0) return 0;
        const completedInCourse = Object.keys(state.completedVideos)
          .filter(key => key.startsWith(`${courseId}-`)).length;
        return Math.round((completedInCourse / totalVideos) * 100);
      },
    }),
    {
      name: 'training-platform-storage',
    }
  )
);

// Translation hook helper
const translations = {
  en: {
    searchPlaceholder: 'Search for courses, videos...',
    categories: 'Categories',
    courses: 'All Courses',
    documents: 'Documents',
    videos: 'Videos',
    explore: 'Explore',
    home: 'Home',
    noResults: 'No results found.',
    viewCourse: 'View Course',
    courseContent: 'Course Content',
    upNext: 'Up Next',
    download: 'Download',
    completed: 'Completed',
    duration: 'Duration',
    search: 'Search',
    language: 'Language',
    theme: 'Theme',
    selectLanguage: 'Select Language',
    totalVideos: 'videos',
    yourProgress: 'Your Progress',
    totalCourses: 'Total Courses',
    totalVideosCount: 'Total Videos',
    watchedVideos: 'Videos Started',
    completedVideos: 'Videos Completed',
    successRate: 'Success Rate',
    coursesStarted: 'Courses Started',
    startLearning: 'Start learning to track your progress!',
  },
  tr: {
    searchPlaceholder: 'Kursları ve videoları ara...',
    categories: 'Kategoriler',
    courses: 'Tüm Kurslar',
    documents: 'Belgeler',
    videos: 'Videolar',
    explore: 'Keşfet',
    home: 'Ana Sayfa',
    noResults: 'Sonuç bulunamadı.',
    viewCourse: 'Kursa Git',
    courseContent: 'Kurs İçeriği',
    upNext: 'Sıradaki',
    download: 'İndir',
    completed: 'Tamamlandı',
    duration: 'Süre',
    search: 'Ara',
    language: 'Dil',
    theme: 'Tema',
    selectLanguage: 'Dil Seçin',
    totalVideos: 'video',
    yourProgress: 'İlerlemeniz',
    totalCourses: 'Toplam Kurs',
    totalVideosCount: 'Toplam Video',
    watchedVideos: 'Başlanan Video',
    completedVideos: 'Tamamlanan Video',
    successRate: 'Başarı Oranı',
    coursesStarted: 'Başlanan Kurs',
    startLearning: 'İlerlemenizi takip etmek için öğrenmeye başlayın!',
  }
};

export function useTranslation() {
  const { language } = useStore();
  return {
    t: translations[language],
    lang: language,
    getLocalized: (obj: { en: string; tr: string }) => obj[language] || obj.en
  };
}
