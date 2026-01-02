# Repository Analysis: Songbird Frontend

**Last Updated:** 2025-01-09  
**Version:** 0.8.2  
**Project Name:** Songbird Player / darkfloor.art

---

## Executive Summary

Songbird is a modern, full-stack music streaming and discovery platform built with Next.js 15, TypeScript, and a comprehensive tech stack. The application features intelligent music recommendations, advanced audio playback controls, multiple visualization modes, and support for both web and Electron desktop deployment.

---

## 🏗️ Architecture Overview

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 15.5.9 | App Router, SSR, routing |
| **Language** | TypeScript | 5.9.3 | Type-safe development |
| **UI Framework** | React | 19.2.3 | Component library |
| **Styling** | TailwindCSS | 4.1.16 | Utility-first CSS |
| **API Layer** | tRPC | 11.0.0 | Type-safe API calls |
| **Database ORM** | Drizzle ORM | 0.41.0 | PostgreSQL queries |
| **Database** | PostgreSQL | - | Primary data store |
| **Authentication** | NextAuth.js | 5.0.0-beta.30 | OAuth 2.0 (Discord) |
| **State Management** | React Context | - | Global state (player, UI) |
| **Data Fetching** | TanStack Query | 5.90.14 | Server state management |
| **Audio Processing** | Web Audio API | - | Equalizer, effects |
| **Desktop App** | Electron | 39.2.7 | Cross-platform desktop |
| **Process Manager** | PM2 | - | Production deployment |

### Key Dependencies

- **Audio & Visualization:**
  - `tone` (15.1.22) - Audio synthesis and effects
  - `react-audio-visualize` (1.2.0) - Audio visualization components
  - Web Audio API - Real-time audio processing

- **UI & Animation:**
  - `framer-motion` (12.23.26) - Animation library
  - `lucide-react` (0.548.0) - Icon library
  - `@dnd-kit/*` - Drag and drop functionality
  - `vaul` (1.1.2) - Drawer/modal components

- **Utilities:**
  - `zod` (3.25.76) - Runtime type validation
  - `superjson` (2.2.6) - Enhanced JSON serialization
  - `@t3-oss/env-nextjs` (0.12.0) - Type-safe environment variables

---

## 📁 Project Structure

```
songbird-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [userhash]/        # User profile pages
│   │   ├── album/             # Album detail pages
│   │   ├── artist/            # Artist detail pages
│   │   ├── library/           # User library (playlists, favorites)
│   │   ├── playlists/         # Playlist management
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── components/            # React components
│   │   ├── Player.tsx         # Main audio player
│   │   ├── EnhancedPlayer.tsx # Advanced player with equalizer
│   │   ├── MobilePlayer.tsx   # Mobile-optimized player
│   │   ├── MiniPlayer.tsx     # Compact player bar
│   │   ├── Queue.tsx          # Queue management
│   │   ├── EnhancedQueue.tsx  # Advanced queue with multi-select
│   │   ├── TrackCard.tsx      # Track display component
│   │   ├── AudioVisualizer.tsx # Audio visualization
│   │   ├── Equalizer.tsx      # 9-band equalizer
│   │   ├── Header.tsx         # Desktop header
│   │   ├── MobileHeader.tsx   # Mobile header
│   │   ├── MobileNavigation.tsx # Bottom navigation
│   │   └── visualizers/      # Visualization components
│   │
│   ├── contexts/              # React Context providers
│   │   ├── AudioPlayerContext.tsx  # Global player state
│   │   ├── ToastContext.tsx        # Toast notifications
│   │   ├── MenuContext.tsx        # Menu state
│   │   └── TrackContextMenuContext.tsx # Context menu state
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAudioPlayer.ts  # Core audio player logic
│   │   ├── useEqualizer.ts    # Equalizer processing
│   │   ├── useMediaQuery.ts   # Responsive breakpoints
│   │   └── ...
│   │
│   ├── server/                # Server-side code
│   │   ├── api/               # tRPC API layer
│   │   │   ├── routers/       # API route handlers
│   │   │   │   ├── music.ts   # Music search, playlists, recommendations
│   │   │   │   ├── equalizer.ts # Equalizer presets
│   │   │   │   ├── preferences.ts # User preferences
│   │   │   │   └── post.ts    # Example post router
│   │   │   ├── root.ts        # Root router
│   │   │   └── trpc.ts        # tRPC configuration
│   │   │
│   │   ├── auth/              # NextAuth configuration
│   │   ├── db/                # Database layer
│   │   │   ├── schema.ts      # Drizzle ORM schema
│   │   │   └── index.ts       # Database connection
│   │   └── services/          # Business logic
│   │
│   ├── trpc/                  # tRPC client setup
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── config/                # Configuration files
│   ├── constants/             # App constants
│   ├── services/              # Client-side services
│   └── styles/                # Global styles
│       └── globals.css        # TailwindCSS + custom styles
│
├── electron/                  # Electron desktop app
│   ├── main.cjs              # Main process
│   ├── preload.cjs           # Preload script
│   └── types.d.ts            # Type definitions
│
├── drizzle/                   # Database migrations
├── public/                    # Static assets
├── scripts/                   # Build and utility scripts
├── certs/                     # SSL certificates
└── logs/                      # PM2 logs
```

---

## 🎯 Core Features

### 1. Music Discovery & Search

- **Type-safe search** integrated with backend API
- **Deezer API format** compatibility
- Search tracks, albums, and artists
- Real-time search results with debouncing
- Context menus for track actions (play, queue, favorite, etc.)

### 2. Audio Playback System

**Core Playback:**
- HTML5 Audio API for primary playback
- Web Audio API for advanced processing (equalizer, effects)
- Queue management with Spotify-style queue structure
- Playback controls:
  - Play/pause, skip forward/backward (10s)
  - Variable playback speed (0.5x - 2.0x)
  - Volume control with mute
  - Repeat modes: none, one, all
  - Shuffle mode

**Queue Features:**
- Smart queue with similarity-based recommendations
- Auto-queue disabled (light smart queue available)
- Queue persistence for authenticated users
- Multi-select queue management (keyboard + mouse)
- Queue reordering via drag-and-drop
- Save queue as playlist

### 3. Audio Enhancement

**9-Band Equalizer:**
- Frequency bands: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
- 8 built-in presets (Rock, Pop, Jazz, Classical, etc.)
- Custom band adjustment
- Preset persistence (authenticated users)
- Real-time audio processing via Web Audio API

**Audio Visualizers:**
- Multiple visualization types:
  - Spectrum Analyzer
  - Waveform
  - Circular
  - Frequency Bands (Radial, Waterfall, Layered, Particles, Circular, Bars)
  - Radial Spectrum
  - Spectral Waves
  - Particle System
  - Frequency Rings
- FlowFieldRenderer with 80+ patterns (11k+ lines)
- KaleidoscopeRenderer
- LightweightParticleBackground

### 4. User Management

**Authentication:**
- NextAuth.js with Discord OAuth
- Session management
- User profiles with public/private settings
- User hash for profile URLs

**User Data:**
- Playlists (create, edit, delete)
- Favorites
- Listening history (authenticated users)
- Equalizer presets
- User preferences (smart queue settings, UI preferences)
- Queue state persistence

### 5. Playlist Management

- Create, edit, and delete playlists
- Add/remove tracks from playlists
- Playlist sharing (public profiles)
- Drag-and-drop track reordering
- Context menu actions
- Add to playlist modal

### 6. Responsive Design

**Mobile (<768px):**
- MobileHeader with hamburger menu
- Bottom navigation bar
- MiniPlayer (bottom-stuck compact player)
- MobilePlayer (full-screen modal)
- Swipe gestures for navigation
- Pull-to-refresh
- Touch-optimized controls
- Safe area insets for notched devices

**Desktop (≥768px):**
- Traditional header navigation
- Desktop player at bottom
- Keyboard shortcuts
- Drag-and-drop interactions

**Z-Index Hierarchy:**
- Content: 1-29
- MobileHeader, MiniPlayer: 50
- HamburgerMenu: 60-61
- Full MobilePlayer modal: 98-99

### 7. Smart Features

**Smart Queue:**
- Similarity-based track recommendations
- HexMusic API integration
- Spotify audio features integration
- Adjustable similarity levels (strict, balanced, diverse)
- Auto-refresh capability

**Smart Mix:**
- Generate personalized mixes from seed tracks
- Audio analysis integration

---

## 🗄️ Database Schema

### Key Tables

**Authentication:**
- `users` - User accounts with profile data
- `sessions` - Active user sessions
- `accounts` - OAuth account links
- `verificationTokens` - Email verification

**Music Library:**
- `favorites` - User favorite tracks
- `playlists` - User-created playlists
- `playlist_tracks` - Playlist → Track mapping (many-to-many)
- `listening_history` - Track play history

**User Preferences:**
- `equalizer_presets` - Saved equalizer configurations
- `user_preferences` - Smart queue settings, UI preferences

**Example/Testing:**
- `posts` - Example table (from T3 template)

### Schema Patterns

- **Table Prefix:** `hexmusic-stream_` (configurable via `createTable`)
- **Relations:** Drizzle ORM relations for type-safe joins
- **Indexes:** Strategic indexes on foreign keys and search fields
- **Timestamps:** Automatic `createdAt` and `updatedAt` tracking

---

## 🔌 API Architecture

### tRPC Routers

**music.ts:**
- `search` - Search tracks, albums, artists
- `getTrackById` - Get track details
- `getAlbumById` - Get album details
- `getArtistById` - Get artist details
- `createPlaylist` - Create new playlist
- `addToPlaylist` - Add tracks to playlist
- `removeFromPlaylist` - Remove tracks
- `getPlaylists` - Get user playlists
- `getPlaylistById` - Get playlist details
- `addToFavorites` - Add track to favorites
- `removeFromFavorites` - Remove from favorites
- `getFavorites` - Get user favorites
- `addToHistory` - Record track play
- `getHistory` - Get listening history
- `getRecommendations` - Get track recommendations
- `getSmartQueueSettings` - Get smart queue preferences
- `updateSmartQueueSettings` - Update smart queue preferences
- `saveQueueState` - Persist queue state
- `getQueueState` - Restore queue state
- `clearQueueState` - Clear persisted queue

**equalizer.ts:**
- `getPresets` - Get user's equalizer presets
- `savePreset` - Save equalizer preset
- `deletePreset` - Delete preset
- `updatePreset` - Update preset

**preferences.ts:**
- User preference management

### API Integration

**External API:**
- Backend music API (configurable via `NEXT_PUBLIC_API_URL`)
- HexMusic API for recommendations (optional)
- Deezer API format compatibility

**Streaming:**
- Secure streaming endpoint with key authentication
- Stream URL generation via `getStreamUrlById()`

---

## 🎨 Design System

### Color Palette

```css
--color-text: #f5f1e8          /* Off-white */
--color-subtext: #a5afbf        /* Light gray */
--color-accent: #f4b266         /* Orange */
--color-secondary-accent: #58c6b1 /* Teal */
--color-background: #0b1118     /* Dark */
```

### Typography

- System sans-serif stack for crisp, accessible typography
- Responsive font sizing

### Animations

- Framer Motion with predefined spring presets
- CSS-based animations for performance
- Smooth transitions and micro-interactions

### Component Patterns

- **Client Components:** Marked with `"use client"` directive
- **Server Components:** Default in App Router
- **Conditional Rendering:** `useIsMobile()` hook for responsive components
- **Forms:** Controlled components with React state
- **Modals/Drawers:** `AnimatePresence` for enter/exit animations

---

## 🚀 Deployment & Infrastructure

### Development

```bash
npm run dev          # Development server (port 3222)
npm run dev:next     # Next.js dev server only
npm run electron:dev # Electron + Next.js dev
```

### Production

**PM2 Process Manager:**
- Production and development process configurations
- Automatic restarts on crash
- Health check monitoring
- Log management
- Memory limit: 2GB

**Build Process:**
- Pre-build: SSL cert generation, DB migrations
- Standalone output for Electron and Vercel
- Automatic build recovery if missing

**Deployment Scripts:**
```bash
npm run build        # Production build
npm run pm2:start    # Start production server
npm run pm2:reload   # Graceful reload
npm run deploy       # Build + reload
```

### Electron Desktop App

**Architecture:**
- Main process: `electron/main.cjs` (CommonJS)
- Preload script: `electron/preload.cjs` (context isolation)
- Next.js runs in standalone mode (bundled server + client)

**Build Targets:**
- Windows: NSIS installer + portable
- macOS: DMG (x64 + arm64)
- Linux: AppImage + DEB

**Configuration:**
- App ID: `com.darkfloor.art`
- Product Name: `Starchild`
- Icon support for all platforms

---

## 🔐 Environment Configuration

### Required Variables

**Server:**
- `AUTH_SECRET` - NextAuth secret (min 32 chars)
- `AUTH_DISCORD_ID` - Discord OAuth app ID
- `AUTH_DISCORD_SECRET` - Discord OAuth secret
- `DATABASE_URL` - PostgreSQL connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME` - Database connection details
- `DB_ADMIN_USER`, `DB_ADMIN_PASSWORD` - Database credentials
- `STREAMING_KEY` - Secure streaming key
- `NODE_ENV` - Environment (development/production)

**Client:**
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SONGBIRD_API_URL` - Optional Songbird API URL
- `NEXT_PUBLIC_NEXTAUTH_URL` - NextAuth callback URL

**Optional:**
- `DB_SSL_CA` - PostgreSQL SSL certificate (PEM format)
- `SONGBIRD_API_KEY` - Songbird API key
- `ELECTRON_BUILD` - Electron build flag

### Environment Validation

- Type-safe validation via `@t3-oss/env-nextjs`
- Runtime validation with Zod schemas
- Clear error messages for missing variables
- Skip validation flag for CI/CD

---

## 🧪 Development Patterns

### Type Safety

- **Strict TypeScript:** Full type checking enabled
- **No implicit any:** Explicit type annotations required
- **Runtime Validation:** Zod schemas for API inputs/outputs
- **tRPC:** End-to-end type safety from server to client

### Code Organization

- **Feature-based structure:** Components grouped by feature
- **Separation of concerns:** UI, logic, and data layers separated
- **Custom hooks:** Reusable logic extracted to hooks
- **Context providers:** Global state management via React Context

### Error Handling

- **Error boundaries:** React error boundaries for component errors
- **Toast notifications:** User-friendly error messages via toast system
- **Graceful degradation:** Fallbacks for missing features
- **Extension error suppression:** Chrome extension errors suppressed

### Performance Optimizations

- **Code splitting:** Automatic via Next.js App Router
- **Image optimization:** Next.js Image component with remote patterns
- **Bundle optimization:** Package import optimization for large libraries
- **Virtual scrolling:** `@tanstack/react-virtual` for long lists
- **Memoization:** React.memo and useMemo for expensive computations

---

## 📊 Key Metrics & Statistics

### Codebase Size

- **Total Components:** 50+ React components
- **tRPC Routers:** 4 main routers (music, equalizer, preferences, post)
- **Database Tables:** 10+ tables
- **Visualization Patterns:** 80+ patterns in FlowFieldRenderer
- **Lines of Code:** ~11,000+ lines in FlowFieldRenderer alone

### Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Background FPS (1080p) | ~45-55 | 60 |
| Background FPS (4K) | ~20-30 | 60 |
| CPU Usage | ~15-20% | ~5-8% |
| Mobile Battery Impact | High | Low |

---

## 🗺️ Future Roadmap

### Planned Enhancements

1. **WebGL Migration:**
   - Migrate Canvas2D visualizations to WebGL
   - Unified rendering pipeline
   - GPU-accelerated effects
   - Estimated: 3-4 months

2. **Feature Enhancements:**
   - Advanced playlist management
   - Social features (sharing, following)
   - Offline mode with caching
   - Dark/light theme toggle
   - Enhanced mobile UI

3. **Performance:**
   - Further optimization of visualization rendering
   - Improved mobile battery efficiency
   - Faster search and navigation

---

## 🔍 Notable Patterns & Conventions

### Audio Player Architecture

**State Management:**
- Global `AudioPlayerContext` provides centralized player state
- `useAudioPlayer` hook contains core playback logic
- Queue structure: `queue[0]` is current track, `queue[1+]` is upcoming

**Audio Chain:**
```
Track → getStreamUrlById() → HTMLAudioElement → Web Audio API → Equalizer → Speakers
                                      ↓
                              Visualizer (canvas)
```

**User Interaction Requirement:**
- Web Audio Context initialization requires user gesture (click/tap)
- Equalizer initializes on first interaction

### Mobile-First Design

**Responsive Breakpoints:**
- Mobile: <768px
- Tablet: 768-1024px
- Desktop: ≥1024px

**Mobile Components:**
- `MobileHeader` - Persistent top header
- `HamburgerMenu` - Left-sliding drawer
- `MiniPlayer` - Bottom-stuck player bar
- `MobilePlayer` - Full-screen modal
- `MobileNavigation` - Bottom navigation bar

### Keyboard Shortcuts

- **Space:** Play/pause
- **Arrow keys:** Navigate and seek
- **Number keys:** Quick navigation
- **M:** Mute
- **Shift+Arrow:** Range selection in queue
- **Del/Backspace:** Remove selected tracks
- **Escape:** Clear selection

---

## 🐛 Known Issues & Workarounds

1. **Chrome Extension Errors:**
   - Suppressed via `SuppressExtensionErrors` component
   - Harmless errors from extension communication

2. **Web Audio Context:**
   - Requires user gesture for initialization
   - Equalizer wraps initialization in event handlers

3. **Build Recovery:**
   - PM2 pre-start hook ensures build exists
   - Automatic build if `BUILD_ID` missing

---

## 📝 License & Legal

- **License:** GPL-3.0
- **Author:** Christian / soulwax@github
- **Homepage:** https://darkfloor.art
- **Repository:** https://github.com/soulwax/songbird-player

**Important:** This project does not include or distribute copyrighted music. It requires connection to a legally compliant music service API.

---

## 🤝 Contributing

### Code Standards

- TypeScript with strict mode enabled
- Components properly typed with interfaces
- TailwindCSS v4 conventions
- Environment variables added to type validation
- ESLint and Prettier configured

### Development Workflow

1. Create feature branch
2. Implement with type safety
3. Test on mobile and desktop
4. Submit pull request

---

## 📚 Additional Resources

- **README.md** - Getting started guide
- **CHANGELOG.md** - Version history
- **ROADMAP.md** - WebGL migration plan
- **CLAUDE.md** - Architecture documentation

---

*This analysis was generated on 2025-01-09. For the most up-to-date information, refer to the source code and documentation.*

