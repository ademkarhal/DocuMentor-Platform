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

  // Course 1: React Mastery
  const course1 = await storage.createCourse({
    categoryId: cat1.id,
    slug: "react-mastery",
    title: { tr: "React Uzmanlık Eğitimi", en: "React Mastery" },
    description: { tr: "Modern web uygulamaları geliştirin", en: "Build modern web apps" },
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png",
    totalVideos: 3,
    nextcloudShareUrl: "https://nextcloud.example.com/s/react-files"
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

  // Course 2: Advanced Node.js
  const course2 = await storage.createCourse({
    categoryId: cat1.id,
    slug: "modern-web-development",
    title: { tr: "Modern Web Geliştirme (Full Stack)", en: "Modern Web Development (Full Stack)" },
    description: { tr: "Sıfırdan ileri seviye web geliştirme", en: "Full stack web development from scratch" },
    thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80",
    totalVideos: 5,
    nextcloudShareUrl: "https://nextcloud.example.com/s/webdev-files"
  });

  const webDevVideos = [
    { youtubeId: "wSDZyaLlCeo", title: { tr: "Web Geliştirme Giriş", en: "Web Dev Intro" }, duration: 1200 },
    { youtubeId: "8u8W4U9y6QA", title: { tr: "HTML & CSS Temelleri", en: "HTML & CSS Basics" }, duration: 1500 },
    { youtubeId: "f02pL7n-5tU", title: { tr: "JavaScript'e Giriş", en: "Introduction to JavaScript" }, duration: 1800 },
    { youtubeId: "vLnH9M-nIqc", title: { tr: "React Temelleri", en: "React Fundamentals" }, duration: 2000 },
    { youtubeId: "mH_iHwL3X6M", title: { tr: "Node.js Giriş", en: "Introduction to Node.js" }, duration: 1600 }
  ];

  for (let i = 0; i < webDevVideos.length; i++) {
    await storage.createVideo({
      courseId: course2.id,
      title: webDevVideos[i].title,
      description: { tr: "Detaylı eğitim içeriği", en: "Detailed tutorial content" },
      youtubeId: webDevVideos[i].youtubeId,
      duration: webDevVideos[i].duration,
      sequenceOrder: i + 1
    });
  }

  // Course 3: Python for Beginners
  const course3 = await storage.createCourse({
    categoryId: cat1.id,
    slug: "mobile-app-development",
    title: { tr: "Mobil Uygulama Geliştirme (Flutter)", en: "Mobile App Development (Flutter)" },
    description: { tr: "Sıfırdan Flutter ile mobil uygulamalar", en: "Mobile apps with Flutter from scratch" },
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
    totalVideos: 5,
    nextcloudShareUrl: "https://nextcloud.example.com/s/flutter-files"
  });

  const flutterVideos = [
    { youtubeId: "m14P_UQvrug", title: { tr: "Flutter'a Giriş", en: "Introduction to Flutter" }, duration: 1100 },
    { youtubeId: "x0uinJ5DX3c", title: { tr: "Dart Programlama Dili", en: "Dart Programming Language" }, duration: 1400 },
    { youtubeId: "GLSG_Wh_YWc", title: { tr: "Widget Yapısı", en: "Widget Structure" }, duration: 1300 },
    { youtubeId: "jx_yLqP3Xm8", title: { tr: "State Management", en: "State Management" }, duration: 1700 },
    { youtubeId: "ZpP9o4-u2E4", title: { tr: "API Entegrasyonu", en: "API Integration" }, duration: 1900 }
  ];

  for (let i = 0; i < flutterVideos.length; i++) {
    await storage.createVideo({
      courseId: course3.id,
      title: flutterVideos[i].title,
      description: { tr: "Flutter ile geliştirme", en: "Development with Flutter" },
      youtubeId: flutterVideos[i].youtubeId,
      duration: flutterVideos[i].duration,
      sequenceOrder: i + 1
    });
  }
}
