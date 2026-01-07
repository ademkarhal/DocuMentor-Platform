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
  protected?: boolean;
  authUrl?: string;
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

interface PlaylistConfig {
  url: string;
  categoryId: number;
  slug: string;
  defaultTitle: BilingualText;
  defaultDescription: BilingualText;
  thumbnail?: string;
  protected?: boolean;
  authUrl?: string;
}

interface ConfigData {
  categories: Category[];
  playlists: PlaylistConfig[];
}

const CONFIG_FILE = path.join(process.cwd(), "config/playlists.json");
const CACHE_FILE = "/tmp/youtube_cache.json";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface PlaylistCacheEntry {
  timestamp: number;
  playlistUrl: string;
  course: Course;
  videos: Video[];
}

interface CacheData {
  categories: Category[];
  playlists: { [slug: string]: PlaylistCacheEntry };
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : null;
}

function loadConfig(): ConfigData {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as ConfigData;
  } catch (e) {
    console.error("Error reading config file:", e);
    return { categories: [], playlists: [] };
  }
}

class MemoryStorage {
  private categories: Category[] = [];
  private courses: Course[] = [];
  private videos: Video[] = [];
  private documents: Document[] = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private cache: CacheData = { categories: [], playlists: {} };

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadData();
    await this.initPromise;
    this.initialized = true;
  }

  private loadCacheFromDisk(): CacheData | null {
    try {
      if (!fs.existsSync(CACHE_FILE)) return null;
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(content) as CacheData;
    } catch (e) {
      console.log("Cache read error");
      return null;
    }
  }

  private saveCacheToDisk(): void {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache));
      console.log("Data saved to cache");
    } catch (e) {
      console.log("Cache write error:", e);
    }
  }

  private async loadData(): Promise<void> {
    const config = loadConfig();
    const diskCache = this.loadCacheFromDisk();
    
    if (diskCache) {
      this.cache = diskCache;
    }
    
    // Always use categories from config file
    this.categories = config.categories;
    this.cache.categories = config.categories;
    
    // Reset courses and videos arrays
    this.courses = [];
    this.videos = [];
    
    let courseIdCounter = 1;
    let videoIdCounter = 1;
    const now = Date.now();
    
    // Process each playlist from config
    for (const playlist of config.playlists) {
      const playlistId = extractPlaylistId(playlist.url);
      if (!playlistId) {
        console.log(`Invalid playlist URL: ${playlist.url}`);
        continue;
      }
      
      const cachedPlaylist = this.cache.playlists[playlist.slug];
      const isCacheValid = cachedPlaylist && 
                           cachedPlaylist.playlistUrl === playlist.url &&
                           (now - cachedPlaylist.timestamp) < CACHE_DURATION;
      
      if (isCacheValid && cachedPlaylist) {
        // Use cached data - update IDs to be sequential
        const course: Course = {
          ...cachedPlaylist.course,
          id: courseIdCounter,
          categoryId: playlist.categoryId,
          protected: playlist.protected || false,
          authUrl: playlist.authUrl || ''
        };
        this.courses.push(course);
        
        cachedPlaylist.videos.forEach((video) => {
          this.videos.push({
            ...video,
            id: videoIdCounter++,
            courseId: courseIdCounter
          });
        });
        
        console.log(`Loaded from cache: ${playlist.slug} (${cachedPlaylist.videos.length} videos)`);
        courseIdCounter++;
      } else {
        // Fetch fresh data from YouTube
        console.log(`Fetching playlist: ${playlist.slug} (${playlistId})`);
        
        const playlistInfo = await getPlaylistInfo(playlistId);
        const playlistVideos = await fetchPlaylistVideos(playlistId);
        
        if (playlistVideos.length > 0) {
          const thumbnailUrl = playlist.thumbnail && playlist.thumbnail.trim() !== "" 
            ? playlist.thumbnail 
            : (playlistInfo?.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80");
          
          const course: Course = {
            id: courseIdCounter,
            categoryId: playlist.categoryId,
            slug: playlist.slug,
            title: {
              tr: playlistInfo?.title || playlist.defaultTitle.tr,
              en: playlistInfo?.title || playlist.defaultTitle.en
            },
            description: {
              tr: playlistInfo?.description || playlist.defaultDescription.tr,
              en: playlistInfo?.description || playlist.defaultDescription.en
            },
            thumbnail: thumbnailUrl,
            totalVideos: playlistVideos.length,
            nextcloudShareUrl: "",
            protected: playlist.protected || false,
            authUrl: playlist.authUrl || ''
          };
          
          this.courses.push(course);
          
          const videos: Video[] = [];
          playlistVideos.forEach((video) => {
            const v: Video = {
              id: videoIdCounter++,
              courseId: courseIdCounter,
              title: { tr: video.title, en: video.title },
              description: { tr: video.description, en: video.description },
              youtubeId: video.youtubeId,
              duration: video.duration,
              sequenceOrder: video.sequenceOrder
            };
            videos.push(v);
            this.videos.push(v);
          });
          
          // Save to cache
          this.cache.playlists[playlist.slug] = {
            timestamp: now,
            playlistUrl: playlist.url,
            course: course,
            videos: videos
          };
          
          console.log(`Fetched ${playlistVideos.length} videos for ${playlist.slug}`);
          courseIdCounter++;
        }
      }
    }
    
    // Remove old playlists from cache that are no longer in config
    const configSlugs = new Set(config.playlists.map(p => p.slug));
    for (const slug of Object.keys(this.cache.playlists)) {
      if (!configSlugs.has(slug)) {
        delete this.cache.playlists[slug];
        console.log(`Removed from cache: ${slug}`);
      }
    }
    
    console.log(`Total: ${this.courses.length} courses, ${this.videos.length} videos`);
    this.saveCacheToDisk();
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
