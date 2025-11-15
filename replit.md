# Discord Bot Hosting Platform

A modern, full-stack web application for hosting and managing Discord bots with 24/7 uptime, automatic deployment, and real-time monitoring.

## Project Overview

This platform allows users to upload Discord bot .zip files and automatically deploys, manages, and monitors them with a beautiful dark-mode dashboard interface.

## Key Features

### Frontend (React + TypeScript)
- **Modern Dark-Mode Dashboard**: Professional UI following modern developer tool aesthetics (Linear, Vercel)
- **Drag-and-Drop Upload**: Intuitive file upload with progress tracking and validation
- **Real-Time Bot Management**: Start, stop, restart, and delete bots with instant feedback
- **Live Log Streaming**: WebSocket-powered real-time log viewer with color-coded output
- **Status Monitoring**: Visual indicators for running, stopped, error, and restarting states
- **Theme Toggle**: Dark/light mode support with persistent preferences
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices

### Backend (Node.js + Express)
- **Secure File Upload**: Multer-based upload with 50MB limit and .zip validation
- **Automated Deployment**: 
  - Automatic .zip extraction with path traversal protection
  - Entry file detection (index.js, main.js, bot.js, or files with client.login)
  - Automatic npm install for dependencies
- **Bot Process Management**: 
  - Isolated child processes for each bot
  - Automatic crash recovery with 5-second restart delay
  - Clean process lifecycle management
- **Real-Time Logging**: WebSocket server for live log streaming to clients
- **Data Persistence**: JSON-based bot registry with automatic save/load
- **External Monitoring**: /uptime endpoint for UptimeRobot or similar services

### Security Features
- **Path Traversal Protection**: Comprehensive zip extraction validation
- **File Sanitization**: Rejects malicious zip entries (../, absolute paths, symlinks)
- **Isolated Execution**: Each bot runs in its own process with independent resources
- **Cleanup on Failure**: Automatic removal of partial uploads and extracts on errors

## Architecture

### Data Model (shared/schema.ts)
```typescript
Bot {
  id: string (UUID)
  name: string
  status: "running" | "stopped" | "error" | "restarting"
  uploadDate: timestamp
  entryFile: string
  folderPath: string
}
```

### API Endpoints
- `GET /api/bots` - List all bots
- `POST /api/bots/upload` - Upload new bot .zip file
- `POST /api/bots/:id/start` - Start a bot
- `POST /api/bots/:id/stop` - Stop a bot
- `POST /api/bots/:id/restart` - Restart a bot
- `DELETE /api/bots/:id` - Delete a bot
- `GET /uptime` - System uptime for external monitoring
- `WS /ws` - WebSocket for real-time log streaming

### Directory Structure
```
/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities and hooks
├── server/              # Backend Express application
│   ├── routes.ts        # API endpoints and WebSocket
│   ├── bot-manager.ts   # Bot process management
│   └── storage.ts       # Data persistence
├── shared/              # Shared types and schemas
├── bots/                # Bot files (auto-created)
└── uploads/             # Temporary upload directory
```

## Recent Changes

### 2024-11-15: Initial Release
- Implemented complete bot hosting platform
- Added secure file upload and extraction
- Built real-time log streaming system
- Created modern dark-mode dashboard
- Implemented crash recovery system
- Added comprehensive security measures

## User Preferences

- **Design Priority**: Visual excellence with modern developer tool aesthetic
- **Dark Mode**: Default theme with toggle support
- **Typography**: Inter for UI, JetBrains Mono for logs
- **Component Library**: Shadcn UI with Tailwind CSS

## Technical Stack

- **Frontend**: React, TypeScript, Wouter, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket (ws), Multer, AdmZip
- **Data**: In-memory storage with JSON persistence
- **Real-time**: WebSocket for log streaming

## Development

The application runs on port 5000 with both frontend (Vite) and backend (Express) served together.

### Workflow
- `npm run dev` - Starts the application (handled by "Start application" workflow)

### Key Files
- `server/routes.ts` - API endpoints, WebSocket, and upload handling
- `server/bot-manager.ts` - Bot lifecycle management and crash recovery
- `client/src/pages/dashboard.tsx` - Main dashboard UI
- `client/src/components/log-viewer.tsx` - Real-time log viewer

## External Monitoring Setup

To keep bots running 24/7, configure UptimeRobot or similar service to ping:
```
https://your-replit-url.replit.dev/uptime
```

Recommended interval: 5 minutes

## Usage Instructions

### For Users

1. **Upload a Bot**:
   - Prepare a .zip file containing your Discord bot
   - Must include: index.js, main.js, or bot.js (or any file with client.login)
   - Optional: package.json for dependencies
   - Drag and drop or click to browse and select your .zip file
   - Maximum size: 50MB

2. **Manage Bots**:
   - **Start**: Click the green "Start" button to run your bot
   - **Stop**: Click "Stop" to gracefully shut down the bot
   - **Restart**: Restart a running bot (useful after crashes)
   - **View Logs**: Click "Logs" to see real-time output
   - **Delete**: Remove a bot permanently (requires confirmation)

3. **Monitor Status**:
   - **Running** (green): Bot is active
   - **Stopped** (gray): Bot is not running
   - **Error** (red): Bot encountered an error
   - **Restarting** (yellow): Bot is automatically restarting after a crash

### Bot Structure Example

```
my-discord-bot.zip
├── index.js          # Main bot file
├── package.json      # Dependencies (optional)
├── commands/         # Your bot structure
│   └── ping.js
└── config.json       # Configuration files
```

## Known Limitations

- Bots must be Node.js-based
- Maximum upload size: 50MB
- Each bot runs in isolated process
- Logs are kept in memory (max 1000 entries per bot)
- No user authentication (single-tenant deployment)

## Future Enhancements

Potential future features (not yet implemented):
- User authentication and multi-tenancy
- Resource monitoring (CPU, memory usage)
- Bot analytics and uptime statistics
- Environment variable management UI
- Scheduled bot operations
- Bot deployment history
