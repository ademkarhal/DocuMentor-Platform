import { fetchPlaylistVideos, getPlaylistInfo } from "./youtube";
import * as fs from "fs";
import * as path from "path";

interface BilingualText {
  en: string;
  tr: string;
}

export interface Category {
  id: number;
  slug: string;
  title: BilingualText;
  icon: string;
  parentId?: number | null;
}

export interface Course {
  id: number;
  categoryId: number;
  slug: string;
  title: BilingualText;
  description: BilingualText;
  thumbnail: string;
  totalVideos: number;
  nextcloudShareUrl: string;
}

export interface Video {
  id: number;
  courseId: number;
  title: BilingualText;
  description: BilingualText;
  youtubeId: string;
  duration: number;
  sequenceOrder: number;
}

export interface Document {
  id: number;
  courseId: number;
  title: BilingualText;
  fileUrl: string;
  fileType: string;
}

const PLAYLISTS = [
  {
    id: "PLQVXoXFVVtp3e_urGZcMNAHx2Eo4Rm5Xk",
    slug: "csharp-course",
    defaultTitle: { tr: "C# Programlama Dersleri", en: "C# Programming Course" },
    defaultDescription: { tr: "C# ile programlama eğitimi", en: "Programming with C#" }
  },
  {
    id: "PLQVXoXFVVtp1DFmoTL4cPTWEWiqndKexZ",
    slug: "aspnet-core-course",
    defaultTitle: { tr: "ASP.NET Core Dersleri", en: "ASP.NET Core Course" },
    defaultDescription: { tr: "ASP.NET Core ile web geliştirme", en: "Web development with ASP.NET Core" }
  },
  {
    id: "PLURN6mxdcwL-xIXzq92ZJN9yRW7Q0mjzw",
    slug: "react-course",
    defaultTitle: { tr: "React Dersleri", en: "React Course" },
    defaultDescription: { tr: "React ile frontend geliştirme", en: "Frontend development with React" }
  },
  {
    id: "PLaZoPjR0BnOG9z5aJ4zudiL3TmfaBZ2Qm",
    slug: "nextjs-course",
    defaultTitle: { tr: "NextJS Dersleri", en: "NextJS Course" },
    defaultDescription: { tr: "NextJS ile modern web uygulamaları", en: "Modern web apps with NextJS" }
  }
];

const CACHE_FILE = "/tmp/youtube_cache.json";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
  timestamp: number;
  categories: Category[];
  courses: Course[];
  videos: Video[];
}

class MemoryStorage {
  private categories: Category[] = [];
  private courses: Course[] = [];
  private videos: Video[] = [];
  private documents: Document[] = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadData();
    await this.initPromise;
    this.initialized = true;
  }

  private loadFromCache(): CacheData | null {
    try {
      if (!fs.existsSync(CACHE_FILE)) return null;
      
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(content) as CacheData;
      
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        console.log("Cache expired, will fetch fresh data");
        return null;
      }
      
      console.log("Loading data from cache...");
      return data;
    } catch (e) {
      console.log("Cache read error, will fetch fresh data");
      return null;
    }
  }

  private saveToCache(): void {
    try {
      const data: CacheData = {
        timestamp: Date.now(),
        categories: this.categories,
        courses: this.courses,
        videos: this.videos
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
      console.log("Data saved to cache");
    } catch (e) {
      console.log("Cache write error:", e);
    }
  }

  private async loadData(): Promise<void> {
    const cached = this.loadFromCache();
    
    if (cached) {
      this.categories = cached.categories;
      this.courses = cached.courses;
      this.videos = cached.videos;
      console.log(`Loaded from cache: ${this.courses.length} courses, ${this.videos.length} videos`);
      return;
    }

    await this.fetchFromYouTube();
  }

  private async fetchFromYouTube(): Promise<void> {
    console.log("Fetching data from YouTube...");

    // Reset arrays
    this.categories = [];
    this.courses = [];
    this.videos = [];

    // Hierarchical categories
    // Main category: Yazılım Geliştirme
    this.categories.push({
      id: 1,
      slug: "software-development",
      title: { tr: "Yazılım Geliştirme", en: "Software Development" },
      icon: "code",
      parentId: null
    });

    // Main category: Takip 7/24 (parent group)
    this.categories.push({
      id: 2,
      slug: "takip-724",
      title: { tr: "Takip 7/24", en: "Takip 7/24" },
      icon: "monitor",
      parentId: null
    });

    // Sub-categories under Takip 7/24
    this.categories.push({
      id: 3,
      slug: "musteri-paneli",
      title: { tr: "Müşteri Paneli", en: "Customer Panel" },
      icon: "users",
      parentId: 2
    });

    this.categories.push({
      id: 4,
      slug: "genel-yonetim-paneli",
      title: { tr: "Genel Yönetim Paneli", en: "General Management Panel" },
      icon: "settings",
      parentId: 2
    });

    this.categories.push({
      id: 5,
      slug: "mobil-uygulama",
      title: { tr: "Mobil Uygulama", en: "Mobile Application" },
      icon: "smartphone",
      parentId: 2
    });

    // Category assignments for courses (distribute across categories)
    const categoryAssignments = [1, 3, 4, 5]; // C# -> Software Dev, ASP.NET -> Customer Panel, React -> Management Panel, NextJS -> Mobile App

    let videoIdCounter = 1;

    // Fetch all playlists
    for (let i = 0; i < PLAYLISTS.length; i++) {
      const playlist = PLAYLISTS[i];
      const courseId = i + 1;
      const categoryId = categoryAssignments[i] || 1;
      
      console.log(`Fetching playlist: ${playlist.slug} (${playlist.id})`);
      
      const playlistInfo = await getPlaylistInfo(playlist.id);
      const playlistVideos = await fetchPlaylistVideos(playlist.id);

      if (playlistVideos.length > 0) {
        this.courses.push({
          id: courseId,
          categoryId: categoryId,
          slug: playlist.slug,
          title: {
            tr: playlistInfo?.title || playlist.defaultTitle.tr,
            en: playlistInfo?.title || playlist.defaultTitle.en
          },
          description: {
            tr: playlistInfo?.description || playlist.defaultDescription.tr,
            en: playlistInfo?.description || playlist.defaultDescription.en
          },
          thumbnail: playlistInfo?.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
          totalVideos: playlistVideos.length,
          nextcloudShareUrl: ""
        });

        playlistVideos.forEach((video) => {
          this.videos.push({
            id: videoIdCounter++,
            courseId: courseId,
            title: { tr: video.title, en: video.title },
            description: { tr: video.description, en: video.description },
            youtubeId: video.youtubeId,
            duration: video.duration,
            sequenceOrder: video.sequenceOrder
          });
        });

        console.log(`Fetched ${playlistVideos.length} videos for ${playlist.slug}`);
      }
    }

    console.log(`Total: ${this.courses.length} courses, ${this.videos.length} videos`);
    this.saveToCache();
  }

  async getCategories(): Promise<Category[]> {
    await this.initialize();
    return this.categories;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    await this.initialize();
    return this.categories.find(c => c.slug === slug);
  }

  async getCourses(): Promise<Course[]> {
    await this.initialize();
    return this.courses;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    await this.initialize();
    return this.courses.find(c => c.id === id);
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    await this.initialize();
    return this.courses.find(c => c.slug === slug);
  }

  async getVideosByCourse(courseId: number): Promise<Video[]> {
    await this.initialize();
    return this.videos
      .filter(v => v.courseId === courseId)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }

  async getDocumentsByCourse(courseId: number): Promise<Document[]> {
    await this.initialize();
    return this.documents.filter(d => d.courseId === courseId);
  }

  async searchContent(query: string): Promise<any[]> {
    await this.initialize();
    const term = query.toLowerCase();
    
    const matchedCourses = this.courses
      .filter(c => 
        c.title.en.toLowerCase().includes(term) || 
        c.title.tr.toLowerCase().includes(term) ||
        c.description.en.toLowerCase().includes(term) ||
        c.description.tr.toLowerCase().includes(term)
      )
      .slice(0, 5)
      .map(c => ({ type: 'course', id: c.id, title: c.title, url: `/courses/${c.slug}`, relevance: 1 }));

    const matchedVideos = this.videos
      .filter(v => 
        v.title.en.toLowerCase().includes(term) || 
        v.title.tr.toLowerCase().includes(term)
      )
      .slice(0, 5)
      .map(v => ({ type: 'video', id: v.id, title: v.title, url: `/courses/flutter-course`, relevance: 0.8 }));

    return [...matchedCourses, ...matchedVideos];
  }
}

export const storage = new MemoryStorage();
