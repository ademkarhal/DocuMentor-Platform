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
    slug: "advanced-nodejs",
    title: { tr: "İleri Seviye Node.js", en: "Advanced Node.js" },
    description: { tr: "Microservisler ve Ölçeklenebilir Sistemler", en: "Microservices and Scalable Systems" },
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1200px-Node.js_logo.svg.png",
    totalVideos: 2,
    nextcloudShareUrl: "https://nextcloud.example.com/s/nodejs-files"
  });

  await storage.createVideo({
    courseId: course2.id,
    title: { tr: "Node.js Mimarisi", en: "Node.js Architecture" },
    description: { tr: "Event Loop ve Non-blocking I/O", en: "Event Loop and Non-blocking I/O" },
    youtubeId: "M3qHa0MuRcs", // Node.js Crash Course
    duration: 1200,
    sequenceOrder: 1,
    transcript: "Node.js runs on the V8 engine and uses an event-driven..."
  });

  await storage.createVideo({
    courseId: course2.id,
    title: { tr: "Microservisler ile Çalışmak", en: "Working with Microservices" },
    description: { tr: "Servisler arası iletişim", en: "Inter-service communication" },
    youtubeId: "y8IT-B77NJ0", // Microservices video
    duration: 1500,
    sequenceOrder: 2,
    transcript: "Microservices architecture allows you to scale..."
  });

  await storage.createDocument({
    courseId: course2.id,
    title: { tr: "Kod Örnekleri - ZIP", en: "Code Samples - ZIP" },
    fileUrl: "https://nextcloud.example.com/s/nodejs-files/download",
    fileType: "zip"
  });

  // Course 3: Python for Beginners
  const course3 = await storage.createCourse({
    categoryId: cat1.id,
    slug: "python-beginners",
    title: { tr: "Sıfırdan Python Programlama", en: "Python Programming from Scratch" },
    description: { tr: "Python ile programlamaya giriş", en: "Introduction to programming with Python" },
    thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1200px-Python-logo-notext.svg.png",
    totalVideos: 2,
    nextcloudShareUrl: "https://nextcloud.example.com/s/python-files"
  });

  await storage.createVideo({
    courseId: course3.id,
    title: { tr: "Python Kurulumu ve İlk Kod", en: "Python Setup and First Code" },
    description: { tr: "Python ortamını hazırlama", en: "Setting up Python environment" },
    youtubeId: "_uQrJ0TkZlc", // Python tutorial
    duration: 900,
    sequenceOrder: 1,
    transcript: "Python is a popular programming language..."
  });

  await storage.createVideo({
    courseId: course3.id,
    title: { tr: "Değişkenler ve Veri Tipleri", en: "Variables and Data Types" },
    description: { tr: "Python'da temel yapılar", en: "Basic structures in Python" },
    youtubeId: "rfscVS0vtbw", // FreeCodeCamp Python
    duration: 1100,
    sequenceOrder: 2,
    transcript: "Variables are used to store data values..."
  });

  await storage.createDocument({
    courseId: course3.id,
    title: { tr: "Python Hile Sayfası - PDF", en: "Python Cheat Sheet - PDF" },
    fileUrl: "https://nextcloud.example.com/s/python-files/cheatsheet",
    fileType: "pdf"
  });
}
