import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: jsonb("title").notNull(), // { tr: string, en: string }
  icon: text("icon").notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  slug: text("slug").notNull().unique(),
  title: jsonb("title").notNull(), // { tr: string, en: string }
  description: jsonb("description").notNull(),
  thumbnail: text("thumbnail").notNull(),
  totalVideos: integer("total_videos").default(0),
  nextcloudShareUrl: text("nextcloud_share_url"),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: jsonb("title").notNull(),
  description: jsonb("description").notNull(),
  youtubeId: text("youtube_id").notNull(),
  duration: integer("duration").notNull(), // seconds
  sequenceOrder: integer("sequence_order").notNull(),
  transcript: text("transcript"), // For search
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: jsonb("title").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(), // pdf, docx, etc
});

// Schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });

// Types
export type Category = typeof categories.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Document = typeof documents.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  lastPosition: integer("last_position").default(0), // in seconds
  isCompleted: boolean("is_completed").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true, updatedAt: true });
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
