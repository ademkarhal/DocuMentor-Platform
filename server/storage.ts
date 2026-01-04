import { db } from "./db";
import {
  categories, courses, videos, documents,
  type Category, type Course, type Video, type Document,
  type InsertCategory, type InsertCourse, type InsertVideo, type InsertDocument
} from "@shared/schema";
import { eq, ilike, sql, or } from "drizzle-orm";

export interface IStorage {
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  
  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  
  getVideosByCourse(courseId: number): Promise<Video[]>;
  getDocumentsByCourse(courseId: number): Promise<Document[]>;
  
  searchContent(query: string): Promise<any[]>;
  
  // Seeding methods
  createCategory(category: InsertCategory): Promise<Category>;
  createCourse(course: InsertCourse): Promise<Course>;
  createVideo(video: InsertVideo): Promise<Video>;
  createDocument(doc: InsertDocument): Promise<Document>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course;
  }

  async getVideosByCourse(courseId: number): Promise<Video[]> {
    return await db.select().from(videos)
      .where(eq(videos.courseId, courseId))
      .orderBy(videos.sequenceOrder);
  }

  async getDocumentsByCourse(courseId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.courseId, courseId));
  }

  async searchContent(query: string): Promise<any[]> {
    // Basic text search implementation for MVP
    // In production, this would use pgvector embeddings with OpenAI
    const term = `%${query}%`;
    
    const matchedCourses = await db.select().from(courses)
      .where(sql`title::text ILIKE ${term} OR description::text ILIKE ${term}`)
      .limit(5);

    const matchedVideos = await db.select().from(videos)
      .where(sql`title::text ILIKE ${term} OR description::text ILIKE ${term}`)
      .limit(5);

    return [
      ...matchedCourses.map(c => ({ type: 'course', id: c.id, title: c.title, url: `/courses/${c.slug}`, relevance: 1 })),
      ...matchedVideos.map(v => ({ type: 'video', id: v.id, title: v.title, url: `/course/${v.courseId}`, relevance: 0.8 }))
    ];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }
}

export const storage = new DatabaseStorage();
