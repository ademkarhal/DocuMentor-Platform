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

// Courses
export function useCourses() {
  return useQuery<CourseListResponse>({
    queryKey: [api.courses.list.path],
    queryFn: async () => {
      const cacheKey = 'courses';
      const cached = getFromCache(cacheKey) as CourseListResponse | null;
      if (cached) return cached;
      
      const res = await fetch(api.courses.list.path);
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = api.courses.list.responses[200].parse(await res.json()) as CourseListResponse;
      setToCache(cacheKey, data);
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

// Search - no caching for search
export function useSearch(query: string) {
  return useQuery<SearchResponse>({
    queryKey: [api.search.query.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const url = `${api.search.query.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      return api.search.query.responses[200].parse(await res.json()) as SearchResponse;
    },
    enabled: query.length >= 2,
    staleTime: 0, 
  });
}
