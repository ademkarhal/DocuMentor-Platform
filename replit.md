# EduPlatform - Training & Documentation SPA

## Overview

A public-access, single-page application (SPA) for training and documentation, built for customers using the organization's software. The platform provides a Udemy-style course structure with video content hosted on YouTube and embedded via players. It supports bilingual content (English/Turkish), dark/light themes, and tracks video progress locally.

**Key Features:**
- Public access (no authentication)
- Course categories with video lessons
- YouTube video embedding
- Bilingual support (EN/TR)
- Dark/light theme toggle
- Local video progress tracking
- Mobile-responsive design

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript
- **Routing:** Wouter (lightweight React router)
- **State Management:** Zustand with persistence for language, theme, and video progress
- **Data Fetching:** TanStack React Query for server state
- **Styling:** Tailwind CSS with CSS variables for theming
- **UI Components:** shadcn/ui component library (Radix UI primitives)
- **Animations:** Framer Motion for page transitions
- **Build Tool:** Vite

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript (ESM modules)
- **API Structure:** RESTful endpoints defined in `shared/routes.ts`
- **Database ORM:** Drizzle ORM with PostgreSQL
- **Build:** esbuild for production bundling

### Data Storage
- **Database:** PostgreSQL (via DATABASE_URL environment variable)
- **Schema Location:** `shared/schema.ts`
- **Migrations:** Drizzle Kit (`drizzle-kit push`)
- **Tables:**
  - `categories` - Course categories with bilingual titles
  - `courses` - Courses linked to categories
  - `videos` - YouTube videos with metadata and transcripts
  - `documents` - Downloadable course materials

### Shared Code Pattern
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Database schema and Zod validation schemas
- `routes.ts` - API route definitions with type-safe response schemas

### API Endpoints
All endpoints are prefixed with `/api`:
- `GET /api/categories` - List all categories
- `GET /api/categories/:slug` - Get category by slug
- `GET /api/courses` - List all courses
- `GET /api/courses/:slug` - Get course by slug
- `GET /api/courses/:id/videos` - Get videos for a course
- `GET /api/courses/:id/documents` - Get documents for a course
- `GET /api/search?q=` - Search content

### Internationalization
Content stored as JSONB with structure `{ en: string, tr: string }`. The `useTranslation` hook from `use-store.ts` handles language switching and content localization.

### Theming
CSS variables define the color palette in `client/src/index.css` with separate `:root` (light) and `.dark` (dark mode) configurations. Theme state persists via Zustand.

## External Dependencies

### Database
- **PostgreSQL** - Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple** - Session storage (available but auth not implemented)

### Frontend Libraries
- **@tanstack/react-query** - Server state management
- **zustand** - Client state management with localStorage persistence
- **framer-motion** - Animations
- **react-day-picker** - Calendar component
- **embla-carousel-react** - Carousel functionality
- **Radix UI** - Accessible UI primitives (full suite installed)

### API Caching
- **Location:** `client/src/hooks/use-api.ts`
- **Strategy:** localStorage-based caching with 24-hour expiration
- **Cached endpoints:** categories, courses, videos, documents
- **Cache keys:** `api_cache_<type>_<id>` (e.g., `api_cache_videos_6`)
- **Non-cached:** Search queries (real-time results needed)
- **Behavior:** Checks localStorage first, fetches from API if cache miss or expired (>24h)

### Video Hosting
- **YouTube** - All course videos hosted externally, embedded via iframe/player

### Video Player Component
- **Location:** `client/src/components/VideoPlayer.tsx`
- **Features:**
  - YouTube iframe embedding with CSS trick to hide branding (300% width container)
  - Real-time progress tracking using simulated intervals (updates every second)
  - Initial position support for resuming playback
  - Progress saved to localStorage via Zustand store
  - Auto-completion at 90% watch threshold
  - Auto-advance to next video on completion
  - Memory leak prevention with proper cleanup
- **Styling:** Custom CSS classes in `client/src/index.css` (.yt-wrapper, .yt-frame-container, .yt-iframe)
- **Note:** Video.js + videojs-youtube attempted but YouTube embed restrictions prevent full integration

### Dashboard & Progress Tracking
- **Location:** Home page (`client/src/pages/Home.tsx`)
- **Storage:** localStorage via Zustand persist (no database needed)
- **Metrics Displayed:**
  - Total Courses count
  - Total Videos count
  - Videos Started count (unique videos user has begun watching)
  - Videos Completed count (videos watched to 90%+)
  - Success Rate percentage with progress bar
  - Courses Started count
- **Store Functions:** `markVideoWatched()`, `markVideoComplete()`, `getStats()`, `getCourseProgress()`

### Fonts
- **Google Fonts** - Inter (body), Outfit (display), loaded via CDN

### Development Tools
- **Vite** - Development server with HMR
- **Replit plugins** - Error overlay, cartographer, dev banner (dev only)