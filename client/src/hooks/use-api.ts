import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { z } from "zod";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

function getFromCache(key: string): unknown | null {
  try {
    const cached = localStorage.getItem(`api_cache_${key}`);
    if (!cached) return null;
    
    const entry = JSON.parse(cached) as CacheEntry;
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(`api_cache_${key}`);
      return null;
    }
    
    return entry.data;
  } catch {
    return null;
  }
}

function setToCache(key: string, data: unknown): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`api_cache_${key}`, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

// Clear all API cache
export function clearApiCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('api_cache_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

type CategoryListResponse = z.infer<typeof api.categories.list.responses[200]>;
type CategoryResponse = z.infer<typeof api.categories.get.responses[200]>;
type CourseListResponse = z.infer<typeof api.courses.list.responses[200]>;
type CourseResponse = z.infer<typeof api.courses.get.responses[200]>;
type VideoListResponse = z.infer<typeof api.courses.getVideos.responses[200]>;
type DocumentListResponse = z.infer<typeof api.courses.getDocuments.responses[200]>;
type SearchResponse = z.infer<typeof api.search.query.responses[200]>;

// Categories
export function useCategories() {
  return useQuery<CategoryListResponse>({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const cacheKey = 'categories';
      const cached = getFromCache(cacheKey) as CategoryListResponse | null;
      if (cached) return cached;
      
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = api.categories.list.responses[200].parse(await res.json()) as CategoryListResponse;
      setToCache(cacheKey, data);
      return data;
    },
    staleTime: CACHE_DURATION,
  });
}

export function useCategory(slug: string) {
  return useQuery<CategoryResponse | null>({
    queryKey: [api.categories.get.path, slug],
    queryFn: async () => {
      const cacheKey = `category_${slug}`;
      const cached = getFromCache(cacheKey) as CategoryResponse | null;
      if (cached) return cached;
      
      const url = buildUrl(api.categories.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch category");
      const data = api.categories.get.responses[200].parse(await res.json()) as CategoryResponse;
      setToCache(cacheKey, data);
      return data;
    },
    enabled: !!slug,
    staleTime: CACHE_DURATION,
  });
}

// Preload all videos for all courses in background
async function preloadAllVideos(courses: CourseListResponse): Promise<void> {
  for (const course of courses) {
    const cacheKey = `videos_${course.id}`;
    const cached = getFromCache(cacheKey);
    if (!cached) {
      try {
        const url = buildUrl(api.courses.getVideos.path, { id: course.id });
        const res = await fetch(url);
        if (res.ok) {
          const data = api.courses.getVideos.responses[200].parse(await res.json());
          setToCache(cacheKey, data);
        }
      } catch {
        // Ignore errors for background preload
      }
    }
  }
}

// Courses
export function useCourses() {
  return useQuery<CourseListResponse>({
    queryKey: [api.courses.list.path],
    queryFn: async () => {
      const cacheKey = 'courses';
      const cached = getFromCache(cacheKey) as CourseListResponse | null;
      if (cached) {
        // Preload videos in background
        preloadAllVideos(cached);
        return cached;
      }
      
      const res = await fetch(api.courses.list.path);
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = api.courses.list.responses[200].parse(await res.json()) as CourseListResponse;
      setToCache(cacheKey, data);
      
      // Preload videos in background
      preloadAllVideos(data);
      
      return data;
    },
    staleTime: CACHE_DURATION,
  });
}

export function useCourse(slug: string) {
  return useQuery<CourseResponse | null>({
    queryKey: [api.courses.get.path, slug],
    queryFn: async () => {
      const cacheKey = `course_${slug}`;
      const cached = getFromCache(cacheKey) as CourseResponse | null;
      if (cached) return cached;
      
      const url = buildUrl(api.courses.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch course");
      const data = api.courses.get.responses[200].parse(await res.json()) as CourseResponse;
      setToCache(cacheKey, data);
      return data;
    },
    enabled: !!slug,
    staleTime: CACHE_DURATION,
  });
}

export function useCourseVideos(courseId: number | undefined) {
  return useQuery<VideoListResponse>({
    queryKey: [api.courses.getVideos.path, courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const cacheKey = `videos_${courseId}`;
      const cached = getFromCache(cacheKey) as VideoListResponse | null;
      if (cached) return cached;
      
      const url = buildUrl(api.courses.getVideos.path, { id: courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch videos");
      const data = api.courses.getVideos.responses[200].parse(await res.json()) as VideoListResponse;
      setToCache(cacheKey, data);
      return data;
    },
    enabled: !!courseId,
    staleTime: CACHE_DURATION,
  });
}

export function useCourseDocuments(courseId: number | undefined) {
  return useQuery<DocumentListResponse>({
    queryKey: [api.courses.getDocuments.path, courseId],
    queryFn: async () => {
      if (!courseId) return [];
      
      const cacheKey = `documents_${courseId}`;
      const cached = getFromCache(cacheKey) as DocumentListResponse | null;
      if (cached) return cached;
      
      const url = buildUrl(api.courses.getDocuments.path, { id: courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = api.courses.getDocuments.responses[200].parse(await res.json()) as DocumentListResponse;
      setToCache(cacheKey, data);
      return data;
    },
    enabled: !!courseId,
    staleTime: CACHE_DURATION,
  });
}

// Extended search result with hierarchy info
export interface ExtendedSearchResult {
  type: 'course' | 'video';
  id: number;
  title: unknown;
  url: string;
  relevance: number;
  courseId?: number;
  courseName?: string;
  courseSlug?: string;
  categoryName?: string;
}

// Search - uses localStorage cached data first, falls back to API
export function useSearch(query: string) {
  return useQuery<ExtendedSearchResult[]>({
    queryKey: [api.search.query.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const searchTerm = query.toLowerCase().trim();
      const results: ExtendedSearchResult[] = [];
      
      // Get categories for hierarchy display
      const cachedCategories = getFromCache('categories') as CategoryListResponse | null;
      const getCategoryName = (categoryId: number): string => {
        if (!cachedCategories) return '';
        const category = cachedCategories.find(c => c.id === categoryId);
        if (!category) return '';
        const catTitle = (category.title as { en: string; tr: string })?.tr || (category.title as { en: string; tr: string })?.en;
        // Check for parent category
        if (category.parentId) {
          const parent = cachedCategories.find(c => c.id === category.parentId);
          if (parent) {
            const parentTitle = (parent.title as { en: string; tr: string })?.tr || (parent.title as { en: string; tr: string })?.en;
            return `${parentTitle} / ${catTitle}`;
          }
        }
        return catTitle;
      };
      
      // Try to search from cached courses first
      const cachedCourses = getFromCache('courses') as CourseListResponse | null;
      if (cachedCourses) {
        cachedCourses.forEach(course => {
          const titleEn = (course.title as { en: string; tr: string })?.en?.toLowerCase() || '';
          const titleTr = (course.title as { en: string; tr: string })?.tr?.toLowerCase() || '';
          const descEn = (course.description as { en: string; tr: string })?.en?.toLowerCase() || '';
          const descTr = (course.description as { en: string; tr: string })?.tr?.toLowerCase() || '';
          
          const courseMatches = titleEn.includes(searchTerm) || titleTr.includes(searchTerm) || 
              descEn.includes(searchTerm) || descTr.includes(searchTerm);
          
          const courseName = (course.title as { en: string; tr: string })?.tr || (course.title as { en: string; tr: string })?.en;
          const categoryName = getCategoryName(course.categoryId);
          
          // Search videos in this course from cache
          const cachedVideos = getFromCache(`videos_${course.id}`) as VideoListResponse | null;
          const matchingVideos: ExtendedSearchResult[] = [];
          
          if (cachedVideos) {
            cachedVideos.forEach(video => {
              const vTitleEn = (video.title as { en: string; tr: string })?.en?.toLowerCase() || '';
              const vTitleTr = (video.title as { en: string; tr: string })?.tr?.toLowerCase() || '';
              const vDescEn = (video.description as { en: string; tr: string })?.en?.toLowerCase() || '';
              const vDescTr = (video.description as { en: string; tr: string })?.tr?.toLowerCase() || '';
              
              if (vTitleEn.includes(searchTerm) || vTitleTr.includes(searchTerm) || 
                  vDescEn.includes(searchTerm) || vDescTr.includes(searchTerm)) {
                matchingVideos.push({
                  type: 'video' as const,
                  id: video.id,
                  title: video.title,
                  url: `/courses/${course.slug}?video=${video.id}`,
                  relevance: 1,
                  courseId: course.id,
                  courseName: courseName,
                  courseSlug: course.slug,
                  categoryName: categoryName
                });
              }
            });
          }
          
          // Add course if it matches or has matching videos
          if (courseMatches || matchingVideos.length > 0) {
            results.push({
              type: 'course' as const,
              id: course.id,
              title: course.title,
              url: `/courses/${course.slug}`,
              relevance: 2,
              courseId: course.id,
              courseSlug: course.slug,
              categoryName: categoryName
            });
            
            // Add matching videos under this course
            results.push(...matchingVideos);
          }
        });
      }
      
      // If we have cached results with videos found, return them
      if (results.length > 0) {
        // Check if we found any videos in cache
        const hasVideosInResults = results.some(r => r.type === 'video');
        if (hasVideosInResults) {
          return results;
        }
      }
      
      // Fall back to API to search videos (videos may not be cached until course is visited)
      const url = `${api.search.query.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const apiResults = api.search.query.responses[200].parse(await res.json()) as SearchResponse;
      
      // Merge API results with cached results, avoiding duplicates
      const apiExtended: ExtendedSearchResult[] = apiResults.map(r => ({ 
        ...r, 
        title: r.title as unknown,
        courseId: undefined, 
        courseName: undefined, 
        courseSlug: undefined, 
        categoryName: undefined 
      }));
      
      // Combine: cached course results + API video results
      const existingIds = new Set(results.map(r => `${r.type}-${r.id}`));
      const mergedResults = [...results];
      apiExtended.forEach(r => {
        if (!existingIds.has(`${r.type}-${r.id}`)) {
          mergedResults.push(r);
        }
      });
      
      return mergedResults;
    },
    enabled: query.length >= 2,
    staleTime: 0, 
  });
}
