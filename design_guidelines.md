# Design Guidelines: Discord Bot Hosting Platform

## Design Approach

**System:** Modern Developer Tool Aesthetic
Inspired by Linear, Vercel Dashboard, and Railway - clean, functional interfaces prioritizing information density and user efficiency over decorative elements.

**Core Principles:**
- Clarity over decoration
- Information hierarchy through typography and spacing
- Dark-first design for technical users
- Immediate visual feedback for all actions

## Typography System

**Font Family:** 
- Primary: Inter or DM Sans via Google Fonts CDN
- Monospace: JetBrains Mono for logs and technical data

**Hierarchy:**
- Page Headers: text-2xl md:text-3xl, font-semibold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base
- Helper Text: text-sm text-gray-400
- Logs/Code: text-sm font-mono

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (gaps, padding): p-2, p-4
- Component spacing: p-6, p-8
- Section spacing: my-12, my-16

**Grid Structure:**
- Dashboard: 12-column grid
- Bot cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- Max container width: max-w-7xl mx-auto

## Component Library

### Navigation/Header
- Fixed top bar with platform logo and user actions
- Height: h-16
- Content: Logo left, upload button + user menu right
- Border bottom separator

### Dashboard Main View
**Bot Status Cards:**
- Card container: rounded-lg border with hover elevation
- Status badge (top-right): Small pill showing Running/Stopped/Error/Restarting
- Bot name: text-lg font-semibold
- Metadata row: Upload date, uptime
- Action buttons row: Start, Stop, Restart, Delete, View Logs (icon buttons with tooltips)
- Visual status indicator: Left border accent (green=running, red=stopped, yellow=error)

**Empty State:**
- Centered content with upload illustration placeholder
- Large text: "No bots hosted yet"
- CTA button to upload first bot

### Upload Area
**Drag & Drop Zone:**
- Large dashed border area (min-h-64)
- Centered icon (upload cloud) and text
- "Drag .zip file here or click to browse"
- File size limit displayed: "Max 50MB"
- Active state: Border color change, background tint on dragover
- Progress bar component: Full width, percentage display, file name

### Log Viewer Terminal
**Full-Screen Modal or Side Panel:**
- Full black/dark background (bg-gray-950)
- Header: Bot name, close button, clear logs button
- Log content area: 
  - Font: Monospace, text-sm
  - Auto-scroll to bottom
  - Timestamp prefix for each line
  - Color coding: Errors (red), Warnings (yellow), Info (white/gray)
  - Max height with scrollbar
- Footer: Connection status indicator

### Status Indicators
**Visual System:**
- Running: Green dot + "Running" text
- Stopped: Gray dot + "Stopped" 
- Error: Red pulsing dot + "Error"
- Restarting: Yellow animated spinner + "Restarting"

### Buttons & Controls
**Primary Actions:**
- Upload Bot: Prominent button (bg-blue-600, rounded-lg, px-6 py-3)
- Start Bot: Green accent
- Stop Bot: Red accent (outline variant)
- Restart: Blue accent (outline variant)
- Delete: Red text button with confirmation modal

**Icon Buttons:**
- Size: w-9 h-9 or w-10 h-10
- Rounded: rounded-md
- Hover state: Background tint
- Icons: Use Heroicons (outline style)

### Modals & Confirmations
**Delete Confirmation:**
- Overlay: bg-black/50
- Modal: Centered, max-w-md, rounded-lg
- Header with warning icon
- Action buttons: Cancel (secondary) + Delete (danger red)

## Layout Specifications

### Dashboard Page Structure
1. **Header Bar** (h-16, fixed top)
2. **Main Content Area** (pt-20 for fixed header offset)
   - Upload section (if no bots or prominent CTA)
   - Bot grid section
3. **Footer** (simple, centered links)

### Upload Flow
- Inline upload area at top of dashboard when bots exist
- Full-screen upload state for first-time users
- Success toast notification on successful upload
- Error alert banner for failed uploads

## Interaction Patterns

**Real-time Updates:**
- WebSocket connection indicator in header (small dot)
- Live bot status updates without page refresh
- Log streaming with auto-scroll

**Loading States:**
- Skeleton cards while fetching bots
- Spinner overlay on bot actions (start/stop)
- Inline spinners for individual operations

**Feedback:**
- Toast notifications for: Upload success, bot started/stopped, errors
- Inline error messages in forms
- Success confirmations with auto-dismiss

## Responsive Behavior

**Desktop (lg+):** 3-column bot grid, side-by-side content
**Tablet (md):** 2-column bot grid, stacked sections
**Mobile (base):** Single column, bottom sheet for logs, hamburger menu

## Icons

Use **Heroicons** (outline style) via CDN:
- Upload: CloudArrowUpIcon
- Start: PlayIcon
- Stop: StopIcon  
- Restart: ArrowPathIcon
- Delete: TrashIcon
- Logs: DocumentTextIcon
- Status indicators: CheckCircleIcon, ExclamationCircleIcon

## Images

**Hero Section:** Not applicable - this is a functional dashboard application with no marketing elements.

**Placeholder Graphics:**
- Empty state illustration for "no bots yet" view (simple SVG illustration or icon)
- Upload zone icon (cloud with arrow)