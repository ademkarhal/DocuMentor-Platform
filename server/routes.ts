import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.categories.get.path, async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  });

  app.get(api.courses.list.path, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get(api.courses.get.path, async (req, res) => {
    const course = await storage.getCourseBySlug(req.params.slug);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  });

  app.get(api.courses.getVideos.path, async (req, res) => {
    const videos = await storage.getVideosByCourse(parseInt(req.params.id));
    res.json(videos);
  });

  app.get(api.courses.getDocuments.path, async (req, res) => {
    const docs = await storage.getDocumentsByCourse(parseInt(req.params.id));
    res.json(docs);
  });

  app.get(api.search.query.path, async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const results = await storage.searchContent(q);
    res.json(results);
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const categories = await storage.getCategories();
  if (categories.length > 0) return;

  const cat1 = await storage.createCategory({
    slug: "software-development",
    title: { tr: "Yazılım Geliştirme", en: "Software Development" },
    icon: "code"
  });

  const cat2 = await storage.createCategory({
    slug: "design",
    title: { tr: "Tasarım", en: "Design" },
    icon: "pen-tool"
  });

  const course1 = await storage.createCourse({
    categoryId: cat1.id,
    slug: "react-mastery",
    title: { tr: "React Uzmanlık Eğitimi", en: "React Mastery" },
    description: { tr: "Modern web uygulamaları geliştirin", en: "Build modern web apps" },
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png",
    totalVideos: 3
  });

  await storage.createVideo({
    courseId: course1.id,
    title: { tr: "React'e Giriş", en: "Introduction to React" },
    description: { tr: "Temel kavramlar", en: "Basic concepts" },
    youtubeId: "dGcsHMXbSOA", // Example ID
    duration: 600,
    sequenceOrder: 1,
    transcript: "React is a JavaScript library for building user interfaces..."
  });

  await storage.createVideo({
    courseId: course1.id,
    title: { tr: "Component Yapısı", en: "Component Structure" },
    description: { tr: "Componentler nasıl çalışır", en: "How components work" },
    youtubeId: "Digf43aZL_I", 
    duration: 800,
    sequenceOrder: 2,
    transcript: "Components are the building blocks of React applications..."
  });

  await storage.createDocument({
    courseId: course1.id,
    title: { tr: "Ders Notları - PDF", en: "Lecture Notes - PDF" },
    fileUrl: "#",
    fileType: "pdf"
  });
}
