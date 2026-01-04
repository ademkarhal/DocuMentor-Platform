import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Categories
export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: [api.categories.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.categories.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch category");
      return api.categories.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

// Courses
export function useCourses() {
  return useQuery({
    queryKey: [api.courses.list.path],
    queryFn: async () => {
      const res = await fetch(api.courses.list.path);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return api.courses.list.responses[200].parse(await res.json());
    },
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: [api.courses.get.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.courses.get.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch course");
      return api.courses.get.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

export function useCourseVideos(courseId: number | undefined) {
  return useQuery({
    queryKey: [api.courses.getVideos.path, courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const url = buildUrl(api.courses.getVideos.path, { id: courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch videos");
      return api.courses.getVideos.responses[200].parse(await res.json());
    },
    enabled: !!courseId,
  });
}

export function useCourseDocuments(courseId: number | undefined) {
  return useQuery({
    queryKey: [api.courses.getDocuments.path, courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const url = buildUrl(api.courses.getDocuments.path, { id: courseId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return api.courses.getDocuments.responses[200].parse(await res.json());
    },
    enabled: !!courseId,
  });
}

// Search
export function useSearch(query: string) {
  return useQuery({
    queryKey: [api.search.query.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const url = `${api.search.query.path}?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      return api.search.query.responses[200].parse(await res.json());
    },
    enabled: query.length >= 2,
    staleTime: 0, 
  });
}
