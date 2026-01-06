import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { fetchPlaylistVideos, getPlaylistInfo } from "./youtube";

// Playlist IDs - New playlist with embed support
const PYTHON_PLAYLIST_ID = "PLWctyKyPphPgqzd2Np8VlKiXhkpAjSV0c";

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

  app.get("/api/courses/:id/progress", async (req, res) => {
    const progress = await storage.getUserProgress(parseInt(req.params.id));
    res.json(progress);
  });

  app.post("/api/progress", async (req, res) => {
    const progress = await storage.upsertUserProgress(req.body);
    res.json(progress);
  });

  app.get(api.search.query.path, async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const results = await storage.searchContent(q);
    res.json(results);
  });

  // Seed Data from YouTube Playlists
  await seedDatabaseFromYouTube();

  return httpServer;
}

async function seedDatabaseFromYouTube() {
  const categories = await storage.getCategories();
  if (categories.length > 0) return;

  console.log("Seeding database from YouTube playlists...");

  const cat1 = await storage.createCategory({
    slug: "software-development",
    title: { tr: "Yazılım Geliştirme", en: "Software Development" },
    icon: "code"
  });

  // Fetch Python playlist info and videos
  console.log("Fetching Python playlist...");
  const pythonInfo = await getPlaylistInfo(PYTHON_PLAYLIST_ID);
  const pythonVideos = await fetchPlaylistVideos(PYTHON_PLAYLIST_ID);
  
  if (pythonVideos.length > 0) {
    const course1 = await storage.createCourse({
      categoryId: cat1.id,
      slug: "python-course",
      title: { 
        tr: pythonInfo?.title || "Python Dersleri", 
        en: pythonInfo?.title || "Python Course" 
      },
      description: { 
        tr: pythonInfo?.description || "Sıfırdan ileri seviye Python programlama", 
        en: pythonInfo?.description || "Python programming from scratch" 
      },
      thumbnail: pythonInfo?.thumbnail || "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
      totalVideos: pythonVideos.length,
      nextcloudShareUrl: ""
    });

    for (const video of pythonVideos) {
      await storage.createVideo({
        courseId: course1.id,
        title: { tr: video.title, en: video.title },
        description: { tr: video.description, en: video.description },
        youtubeId: video.youtubeId,
        duration: video.duration,
        sequenceOrder: video.sequenceOrder
      });
    }
    console.log(`Added ${pythonVideos.length} videos for Python course`);
  }

  console.log("Database seeding completed!");
}
