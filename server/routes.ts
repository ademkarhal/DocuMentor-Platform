import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { fetchPlaylistVideos, getPlaylistInfo } from "./youtube";

// Playlist IDs
const FLUTTER_PLAYLIST_ID = "PLQVXoXFVVtp1DFmoTL4cPTWEWiqndKexZ";

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

  // Fetch Flutter playlist info and videos
  console.log("Fetching Flutter playlist...");
  const flutterInfo = await getPlaylistInfo(FLUTTER_PLAYLIST_ID);
  const flutterVideos = await fetchPlaylistVideos(FLUTTER_PLAYLIST_ID);
  
  if (flutterVideos.length > 0) {
    const course1 = await storage.createCourse({
      categoryId: cat1.id,
      slug: "flutter-course",
      title: { 
        tr: flutterInfo?.title || "Flutter Dersleri", 
        en: flutterInfo?.title || "Flutter Course" 
      },
      description: { 
        tr: flutterInfo?.description || "Flutter ile mobil uygulama geliştirme", 
        en: flutterInfo?.description || "Mobile app development with Flutter" 
      },
      thumbnail: flutterInfo?.thumbnail || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
      totalVideos: flutterVideos.length,
      nextcloudShareUrl: ""
    });

    for (const video of flutterVideos) {
      await storage.createVideo({
        courseId: course1.id,
        title: { tr: video.title, en: video.title },
        description: { tr: video.description, en: video.description },
        youtubeId: video.youtubeId,
        duration: video.duration,
        sequenceOrder: video.sequenceOrder
      });
    }
    console.log(`Added ${flutterVideos.length} videos for Flutter course`);
  }

  console.log("Database seeding completed!");
}
