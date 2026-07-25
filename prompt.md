# Google Stitch Prompt — The Marauder's Ledger

Build the complete frontend for "The Marauder's Ledger" — a Harry Potter-themed
financial anomaly detection dashboard. The app analyzes bank transaction CSVs,
detects fraudulent/anomalous spending using ML (Isolation Forest + XGBoost + 
LightGBM + Rule-Based scoring), visualizes them on an animated "Marauder's Map",
narrates findings via Gemini AI, and reads them aloud via ElevenLabs TTS.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (parchment theme)
- Framer Motion (all animations)
- Recharts (charts)
- React Router v6 (routing)
- TanStack Query (API data fetching/caching)
- react-dropzone (CSV upload)
- axios (HTTP client)

---

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| parchment | `#f5e6c8` | Main background — aged paper |
| parchment-dark | `#e8d5b0` | Darker parchment for cards |
| parchment-light | `#faf3e6` | Lighter parchment |
| ink | `#2c1810` | Primary text — dark brown ink |
| ink-light | `#5c3d2e` | Secondary text |
| gold | `#d4af37` | Accents, active states, borders |
| gold-light | `#f0d878` | Hover states |
| blood | `#dc2626` | Anomaly / high severity |
| blood-glow | `#ef4444` | Anomaly pulse glow |
| emerald | `#2d6a4f` | Normal / low severity |
| amber | `#d97706` | Medium severity / warning |
| shadow | `rgba(44, 24, 16, 0.15)` | Box shadows |

### Fonts

| Font | Family | Usage |
|------|--------|-------|
| Headings | `Cinzel Decorative`, serif | Wizardly headings |
| Body | `Crimson Pro`, serif | Readable parchment body text |
| Mono | `JetBrains Mono`, monospace | Scores / numbers |

### CSS Base

- Body background: parchment color with subtle CSS noise texture overlay (use `repeating-linear-gradient` or SVG noise filter for aged paper effect)
- All text ink-colored by default
- Scrollbars styled: thin, gold thumb on parchment track
- Selection color: gold background with ink text

---

## Pages & Routing

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Upload + empty state |
| `/dashboard` | Dashboard | Main map + anomaly sidebar |
| `/anomaly/:id` | Anomaly Detail | Full anomaly detail view |

---

## Page 1: Landing (`/`)

A full-screen parchment page with:

### 1. Header Section

- **Title:** "The Marauder's Ledger" in Cinzel Decorative, large (`text-4xl`), ink color, with subtle gold `text-shadow` glow
- **Tagline:** "I solemnly swear I am up to no good" in Crimson Pro italic, ink-light color, below title
- **Decorative gold rule line** (horizontal rule with ornamental ends)

### 2. Upload Zone (center of page)

- Large dashed-border box (`border-2 border-dashed border-gold`)
- Rounded corners, `parchment-dark` background
- Drag-drop area with `react-dropzone`
- **Default state:** wand icon (or upload icon) + text "Tap with your wand to upload a CSV"
- **Drag-over state:** border turns gold, background lightens, pulsing glow
- **Accepted format:** `.csv` only
- On file drop: validate CSV has required columns (`amount`, `category`, `merchant`, `hour`, `day`)
- **Invalid file:** show error "The map cannot read this scroll" in blood color
- **Valid file:** show filename, row count, "Analyze" button in gold

### 3. Load Sample Button

- Below upload zone: "Or load a sample cursed ledger" text link
- Clicking loads a pre-defined sample CSV (from `/api/sample` endpoint or hardcoded)
- Shows loading state: "Unfolding the map..."

### 4. Empty State (before any upload)

- Blank parchment SVG illustration (just a subtle paper texture outline)
- Text: "The map is blank" in Cinzel Decorative
- Subtext: "Upload a transaction CSV to reveal hidden mischief"

### 5. Recent Analyses (if any)

- Below upload zone, show previous analyses as scroll-styled cards
- Each card: filename, date, anomaly count, "View" button
- Click → navigate to `/dashboard?batch_id=xxx`

---

## Page 2: Dashboard (`/dashboard`)

The main view — Marauder's Map on left, Anomaly sidebar on right.

### Layout

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Map 60% width, sidebar 40% |
| Tablet (768-1024px) | 50/50 split |
| Mobile (<768px) | Map full width, sidebar as bottom sheet (draggable up) |

### Left Panel — Marauder's Map

A large interactive SVG visualization showing spending clusters.

#### Map Structure (SVG, `viewBox "0 0 1000 600"`)

- Background: parchment texture with aged borders (dark ink edges)
- Title at top: "Marauder's Map" in Cinzel Decorative, faded
- Footer: "Moony, Wormtail, Padfoot & Prongs" in small italic

#### 5 Location Clusters

Each is a `<g>` group with icon + label. Position them in a scattered layout across the SVG:

| # | Name | Category | Position | Icon | Color |
|---|------|----------|----------|------|-------|
| 1 | Hogwarts | Food | `(500, 120)` | Castle/house | Warm brown |
| 2 | Hogsmeade | Shopping | `(180, 250)` | Shop/building | Teal |
| 3 | Gringotts | Bills | `(820, 250)` | Bank/coin | Gold |
| 4 | Diagon Alley | Entertainment | `(250, 450)` | Wand/star | Purple |
| 5 | Platform 9¾ | Travel | `(750, 450)` | Train/platform | Deep red |

#### Connecting Paths

- Dotted/dashed lines connecting the 5 locations (like walking paths)
- Ink color, low opacity
- Animated: dashed `stroke-dashoffset` that slowly moves (like a walking path)

#### Transaction Footprints (animated dots)

- Each transaction = small circle (`r=4`) on the map
- Position: scatter randomly within the cluster's radius (±60px from center)
- Color: ink (`#2c1810`) for normal transactions
- **Animation:** appear with staggered fade-in + scale (Framer Motion)
  ```tsx
  initial: { scale: 0, opacity: 0 }
  animate: { scale: 1, opacity: 0.7 }
  transition: { delay: index * 0.03, type: "spring" }
  ```
- On hover: tooltip shows "₹{amount} at {merchant}"

#### Anomaly Markers

- Larger circles (`r=8`) with red fill (`#dc2626`)
- **Pulsing glow animation** (Framer Motion):
  ```tsx
  animate: {
    filter: [
      "drop-shadow(0 0 4px #dc2626)",
      "drop-shadow(0 0 12px #dc2626)",
      "drop-shadow(0 0 4px #dc2626)"
    ]
  }
  transition: { repeat: Infinity, duration: 2 }
  ```
- Click handler: set selected anomaly → opens sidebar detail
- Size varies by severity: high=12, medium=8, low=6

#### Map Interaction

- **Pan:** click + drag to move map (Framer Motion drag)
- **Zoom:** scroll wheel or pinch (Framer Motion scale)
- **Reset view button:** "Reset Map" in corner

#### Map Legend (bottom-left corner)

Small parchment card:
- ● Normal transaction (ink dot)
- ◉ Anomaly detected (red glowing dot)
- ── Walking path (dotted line)

#### "Mischief Managed" Toast

- When analysis completes, show a brief toast at bottom:
  - Parchment background, gold border
  - Text: "Mischief Managed!" in Cinzel Decorative
  - Auto-dismiss after 3 seconds
  - Framer Motion slide-up + fade-out

---

### Right Sidebar — Anomaly Panel

Scrollable panel showing analysis results.

#### Header

- "Detected Mischief" title in Cinzel Decorative
- Summary stats: "{total} transactions · {anomalyCount} anomalies found"
- Close button (X) to collapse sidebar (mobile only)

#### Messrs Tabs (category filters)

4 horizontal tabs styled as parchment scrolls:

| Tab | Filter | Icon |
|-----|--------|------|
| Moony | Food | 🍽 |
| Wormtail | Shopping | 🛒 |
| Padfoot | Bills | 💰 |
| Prongs | All | ⚡ |

- **Active tab:** gold underline, bold text, slight scale-up
- Click: filter both map footprints AND anomaly list below
- Framer Motion: underline slides to active tab (`layoutId` animation)

#### Anomaly List

- Vertical scrollable list of anomaly cards
- **Each card** (parchment-dark background, ink border, rounded):
  - Severity badge (top-right):
    - "Peeves" (green bg) — low severity
    - "Boggart" (amber bg) — medium severity
    - "Dementor" (red bg) — high severity
    - Badge has small icon (ghost for Peeves, shape-shift for Boggart, hooded figure for Dementor)
  - Merchant name (bold, ink)
  - Amount: "₹{amount}" (large, gold for anomalies)
  - Category + time: "{category} · {hour}:{minute}"
  - Triggered rules: small tags like "Amount Spike", "Unusual Hour"
  - Probability score: progress bar from 0-1, red fill
  - Click → navigate to `/anomaly/:id` or expand inline

#### Empty Anomaly List

- If no anomalies: "No mischief detected. The map is clean."
- With a small checkmark icon in emerald

#### Spend Trend Chart (below anomaly list)

- Recharts `LineChart`
- X-axis: transaction time/order
- Y-axis: amount (₹)
- Line: ink color, 2px stroke
- Anomaly points: red dots (`r=6`), with pulse animation on hover
- Tooltip on hover: shows amount, merchant, category
- Normal points: small ink dots (`r=3`)
- Reference line at anomaly threshold (dashed gold)

---

## Page 3: Anomaly Detail (`/anomaly/:id`)

Full-page detail view for a single anomaly.

### Layout

- Back button (top-left): "< Back to Map" in ink
- Centered content, max-width 700px

### Anomaly Header

- Large severity badge (Peeves/Boggart/Dementor)
- Merchant name (Cinzel Decorative, `text-2xl`)
- Amount: "₹{amount}" (`text-4xl`, gold, bold)
- Time: "{date} at {time}" in ink-light
- Category pill: "Food" / "Shopping" etc.

### Anomaly Scores (3 score cards in a row)

| Card | Label | Source |
|------|-------|--------|
| ML Score | Probability from ensemble model (0-1) | Circular progress |
| Rule Score | Rule-based score (0-1) | Circular progress |
| Final Score | Combined score (0-1) | Circular progress with severity color |

Each card: parchment background, gold border, label + large number

### Triggered Rules

- Section: "Why was this flagged?"
- List of triggered rules as scroll-styled tags:
  - "Amount Spike" — "₹8,500 is 56x the average food spend"
  - "Unusual Hour" — "Transaction at 3:15 AM"
  - "New Merchant" — "Unknown Merchant has never been seen"
- Each rule: icon + title + explanation text

### Gemini Narrative

- Section styled as an **aged scroll** (parchment background, torn edges via CSS `clip-path`)
- **Loading:** "The Map speaks..." with animated dots
- **Text:** typewriter animation (character by character, 30ms interval)
- Font: Crimson Pro, slightly larger (`text-lg`)
- Loading state: "Consulting the Marauder's Map..."
- Error state: "The Map is silent... Try again" with retry button

### Voice Narration

- Below narrative: audio player
- **Play/Pause button:** circular, gold border, ink icon
- **Waveform visualization:** 5-7 animated bars (CSS keyframes, different heights)
- Loading state: "The Map prepares to speak..." with spinning wand icon
- Audio source: `GET /api/narratives/{id}/audio` (returns MP3)
- After first play: cache in IndexedDB for instant replay
- Severity-based voice indicator:
  - Low: "Rachel speaks softly"
  - Medium: "Adam warns you"
  - High: "Dementors are near"

### Transaction Context

- Below audio: "Related Transactions" section
- Show 3-5 recent transactions from same category/merchant
- Simple list: amount, merchant, time
- Helps user understand if this is truly anomalous

---

## Components Inventory

| # | Component | Props | Description |
|---|-----------|-------|-------------|
| 1 | `Layout.tsx` | `children` | Wrapper for all pages. Parchment bg, noise texture. Top nav bar. Mobile bottom nav. |
| 2 | `UploadZone.tsx` | `onUpload, isLoading` | react-dropzone drag-drop. Accepts .csv. States: idle, dragOver, uploading, success, error. Ink-spreading animation on upload. |
| 3 | `MaraudersMap.tsx` | `transactions, anomalies, onSelect, filter` | SVG container with pan/zoom. Renders 5 clusters, FootprintDots, AnomalyMarkers, paths, legend. |
| 4 | `FootprintDot.tsx` | `x, y, amount, merchant, delay` | Small circle, ink color. Staggered entrance animation. Hover tooltip. |
| 5 | `AnomalyMarker.tsx` | `x, y, severity, id, onClick` | Red circle with pulsing glow. Size varies by severity. Click handler. |
| 6 | `AnomalyPanel.tsx` | `anomalies, selected, onSelect, filter` | Right sidebar container. Contains tabs, list, chart. Scrollable. |
| 7 | `MessrsTabs.tsx` | `active, onChange` | 4 tabs: Moony, Wormtail, Padfoot, Prongs. Framer Motion underline. |
| 8 | `AnomalyCard.tsx` | `anomaly, onClick, isSelected` | Card with severity badge, details, triggered rules. Click handler. |
| 9 | `SeverityBadge.tsx` | `severity` | "Peeves" / "Boggart" / "Dementor" label. Color-coded. Icon. |
| 10 | `NarrativeCard.tsx` | `text, isLoading, onRetry` | Scroll-styled container. Typewriter animation. Loading/error states. |
| 11 | `VoiceNarration.tsx` | `anomalyId, severity` | Play/Pause button. Waveform bars. Audio element. IndexedDB caching. |
| 12 | `SpendTrendChart.tsx` | `transactions, anomalies` | Recharts LineChart. Red dots for anomalies. Tooltips. |
| 13 | `LoadingInk.tsx` | — | Full-screen loading overlay. Ink blob expanding animation. Rotating sub-messages. |
| 14 | `EmptyMap.tsx` | — | Blank parchment SVG. "The map is blank" text. Wand cursor icon. |
| 15 | `Toast.tsx` | `message, onDismiss` | "Mischief Managed!" notification. Parchment bg, gold border. Auto-dismiss. |
| 16 | `ScoreGauge.tsx` | `value, label, color` | Circular progress indicator. For anomaly detail page. |

---

## API Integration

**Base URL:** from env var `VITE_API_URL` or default `http://localhost:8000`

### Endpoints

| Method | Endpoint | Body | Response | Description |
|--------|----------|------|----------|-------------|
| `POST` | `/api/upload` | FormData (CSV file) | `{ batch_id, status: "processing", txn_count }` | Upload CSV |
| `POST` | `/api/analyze?batch_id=xxx` | — | `{ anomalies_found, total_txns, status: "completed" }` | Run ML analysis |
| `GET` | `/api/batches/:batch_id` | — | `{ batch_id, status, txn_count }` | Poll batch status |
| `GET` | `/api/transactions?user_id=xxx` | — | `Transaction[]` | Fetch all transactions |
| `GET` | `/api/anomalies?user_id=xxx` | — | `Anomaly[]` | Fetch anomalies |
| `GET` | `/api/anomalies/:id` | — | `Anomaly` | Single anomaly detail |
| `POST` | `/api/narratives` | `{ anomaly_id }` | `{ narrative_id, text }` | Generate narrative via Gemini |
| `GET` | `/api/narratives/:anomaly_id` | — | `{ narrative_id, text }` | Fetch narrative text |
| `GET` | `/api/narratives/:anomaly_id/audio` | — | MP3 blob | Fetch TTS audio |
| `GET` | `/api/sample` | — | CSV data | Load sample demo data |

### Data Types

```typescript
interface Transaction {
  txn_id: string;
  amount: number;
  category: string;
  merchant: string;
  hour: number;
  day: number;
  timestamp: string;
}

interface Anomaly {
  anomaly_id: string;
  txn_id: string;
  amount: number;
  category: string;
  merchant: string;
  hour: number;
  day: number;
  probability: number;
  is_anomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  triggered_rules: string[];
}

interface Narrative {
  narrative_id: string;
  anomaly_id: string;
  text: string;
}

interface Batch {
  batch_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  txn_count: number;
}
```

### TanStack Query Usage

- `useQuery` for fetching transactions, anomalies, narratives
- `useMutation` for upload, analyze
- `useQueryClient().invalidateQueries` to refresh data after analysis
- Poll batch status with `refetchInterval`

---

## State Management

### React Context (`AppContext`)

```typescript
interface AppState {
  currentUser: { userId: string };  // hardcoded "demo-user" for demo
  currentBatch: { batchId: string; status: string } | null;
  selectedAnomaly: string | null;
  activeFilter: 'all' | 'food' | 'shopping' | 'bills';
  mapZoom: number;
  mapPosition: { x: number; y: number };
}
```

### Local Component State

| Component | State |
|-----------|-------|
| UploadZone | file, errors, loading |
| AnomalyPanel | scroll position, expanded card |
| VoiceNarration | isPlaying, audioBlob, currentTime |
| NarrativeCard | displayedText (typewriter), isLoading |

---

## Animations (Framer Motion)

| # | Animation | Trigger | Details |
|---|-----------|---------|---------|
| 1 | Page transitions | Route change | `initial: { opacity: 0 }` → `animate: { opacity: 1 }` → `exit: { opacity: 0 }` |
| 2 | Upload ink spread | Successful upload | Expanding circle from center. `{ scale: [0, 50], opacity: [0.8, 0] }`. Duration 1.5s. |
| 3 | Footprint entrance | Data load | Staggered: `{ scale: 0→1, opacity: 0→0.7 }`. Delay: `index * 0.03s` |
| 4 | Anomaly pulse | Always | Infinite loop: glow intensity oscillates via `filter: drop-shadow` |
| 5 | Sidebar slide | Anomaly selected | `{ x: "100%" → "0%" }` from right. Spring physics. |
| 6 | Tab underline | Tab change | `layoutId: "tab-underline"` for smooth sliding |
| 7 | Typewriter text | Narrative loaded | Character-by-character reveal. `useEffect` + `setInterval`, 30ms per char. |
| 8 | Waveform bars | Audio playing | CSS keyframes: height oscillates randomly. 5-7 bars, different `animation-delay`. |
| 9 | Loading ink blob | Data fetching | SVG path animation or Framer Motion scale. Expanding organic shape. |
| 10 | Toast | Analysis complete | Slide up from bottom, auto-dismiss. `{ y: 100→0, opacity: 0→1→0 }` |

---

## Responsive Design

### Mobile (< 768px)

- **Upload:** full width, stacked layout
- **Dashboard:** Map full height, anomaly panel as bottom sheet
  - Bottom sheet: draggable up/down, peek state shows summary
  - Full state shows full anomaly list
- **Tabs:** horizontally scrollable
- **Anomaly detail:** full screen, back button prominent
- **Font sizes:** reduce by ~20%

### Tablet (768-1024px)

- **Dashboard:** 50/50 split
- **Anomaly panel:** fixed right side
- **Chart:** smaller, below anomaly list

### Desktop (> 1024px)

- **Dashboard:** 60% map, 40% sidebar
- **Full sidebar** always visible
- **Larger fonts** and spacing
- **Hover states** active

---

## Key UX Details

- All data fetching shows `LoadingInk` component
- Empty states: "The map is blank" with wand icon
- Error states: "Something went wrong" with retry button
- Success toast: "Mischief Managed!" after analysis
- Score displays: always formatted as percentages (`0.825` → `"82.5%"`)
- Amounts: formatted with ₹ symbol and commas (`₹8,500`)
- Time: 12-hour format with AM/PM (`3:15 AM`)
- All interactive elements have hover states (scale 1.02, gold border)
- Focus states for accessibility (gold outline)
- Smooth scroll behavior on all panels

---

## Wizarding World Theme Integration

| Element | Implementation |
|---------|----------------|
| Background | Aged parchment texture (`#f5e6c8` sepia + CSS noise) |
| Map | SVG with 5 themed spending cluster "locations" |
| Normal txns | Animated footprint dots |
| Anomalies | Glowing red footprints + "Mischief Managed" toast |
| Sidebar | Scroll-styled panel |
| Filters | "Moony, Wormtail, Padfoot, Prongs" tabs |
| Empty state | "The map is blank — tap it with your wand" |
| Voice | "The Map speaks..." — ElevenLabs narration |
| Fonts | Cinzel Decorative (headings) + Crimson Pro (body) |
| Severity | "Peeves" (low), "Boggart" (medium), "Dementor" (high) |
