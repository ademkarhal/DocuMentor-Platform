import { z } from 'zod';
import { insertCategorySchema, insertCourseSchema, insertVideoSchema, insertDocumentSchema, categories, courses, videos, documents } from './schema';

export const errorSchemas = {
  notFound: z.object({ message: z.string() }),
  serverError: z.object({ message: z.string() }),
};

export const api = {
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/categories/:slug',
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  courses: {
    list: {
      method: 'GET' as const,
      path: '/api/courses',
      responses: {
        200: z.array(z.custom<typeof courses.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/courses/:slug',
      responses: {
        200: z.custom<typeof courses.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    getVideos: {
      method: 'GET' as const,
      path: '/api/courses/:id/videos',
      responses: {
        200: z.array(z.custom<typeof videos.$inferSelect>()),
      },
    },
    getDocuments: {
      method: 'GET' as const,
      path: '/api/courses/:id/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    }
  },
  search: {
    query: {
      method: 'GET' as const,
      path: '/api/search',
      input: z.object({ q: z.string() }),
      responses: {
        200: z.array(z.object({
          type: z.enum(['course', 'video']),
          id: z.number(),
          title: z.any(), // jsonb
          url: z.string(),
          relevance: z.number()
        })),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
