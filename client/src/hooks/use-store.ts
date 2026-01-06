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
  setVideoProgress: (courseId: number, videoId: number, currentTime: number) => void;
  markVideoComplete: (courseId: number, videoId: number) => void;
  isVideoComplete: (courseId: number, videoId: number) => boolean;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
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
      setVideoProgress: (courseId, videoId, currentTime) => set((state) => ({
        videoProgress: { ...state.videoProgress, [`${courseId}-${videoId}`]: currentTime }
      })),
      markVideoComplete: (courseId, videoId) => set((state) => ({
        completedVideos: { ...state.completedVideos, [`${courseId}-${videoId}`]: true }
      })),
      isVideoComplete: (courseId, videoId) => !!get().completedVideos[`${courseId}-${videoId}`],
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
