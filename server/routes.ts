import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth endpoint for course login
  app.post('/api/auth/login', async (req, res) => {
    const { username, password, authUrl } = req.body;
    
    // If authUrl provided, forward to external service
    if (authUrl) {
      try {
        const response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json({ success: true, data });
        } else {
          return res.status(401).json({ success: false, message: 'Authentication failed' });
        }
      } catch (error) {
        return res.status(500).json({ success: false, message: 'Auth service unavailable' });
      }
    }
    
    // Default admin/admin login
    if (username === 'admin' && password === 'admin') {
      return res.json({ success: true });
    }
    
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  });

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

  return httpServer;
}
