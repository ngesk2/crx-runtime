# CRX UI Evolution Specification

**Mission**: Transform CRX from a functional chat application into a premium local intelligence workspace.

**Focus**: User experience, visual hierarchy, observability, and product identity.

**Architecture Status**: FROZEN
- DO NOT modify gateway behavior
- DO NOT modify Ollama integration
- DO NOT modify streaming protocol
- DO NOT modify constitutional systems
- DO NOT modify replay systems

---

## Current State Analysis

### Existing Components

**Home Page** (`page.tsx`):
- Simple landing page with "CRX UI" title
- "Constitutional Replay Kernel Interface" subtitle
- Blue button to navigate to chat
- Basic Tailwind styling

**Chat Page** (`chat/page.tsx`):
- Functional chat interface
- Basic message bubbles (user: blue, assistant: gray)
- Simple input field with send button
- Fetches from localhost:8080/api/v1/chat
- Minimal styling (gray header, basic borders)
- No observability features
- No runtime status display
- No response metadata
- No prompt library
- No alternate views

### Current Issues

1. **Generic Chatbot Aesthetics**: Looks like a standard chat application
2. **No Product Identity**: Doesn't communicate "local sovereign intelligence"
3. **No Observability**: No runtime health, latency, or status indicators
4. **Poor Visual Hierarchy**: Flat design, no depth or premium feel
5. **No Explainability**: No response metadata or transparency
6. **Empty State**: No meaningful onboarding or product explanation
7. **No Prompt Library**: No reusable prompt templates
8. **No Motion System**: Static, no smooth transitions
9. **Limited Color System**: Only blue and gray
10. **No Alternate Views**: Only chat view available

---

## Phase 1 — Design Language

### Color System

**Gold (Constitutional)**:
- Primary: `#FFD700` (Gold)
- Secondary: `#B8860B` (Dark Goldenrod)
- Usage: Constitutional authority, replay protocol, promotion rights
- Contrast: Dark text on gold backgrounds, white text on gold buttons

**Blue (Runtime / Replay)**:
- Primary: `#4682B4` (Steel Blue)
- Secondary: `#1E3A8A` (Dark Blue)
- Usage: Runtime systems, replay machinery, event streams
- Contrast: White text on blue backgrounds, dark text on light blue

**Cyan (Observability)**:
- Primary: `#00CED1` (Dark Turquoise)
- Secondary: `#008B8B` (Dark Cyan)
- Usage: Metrics, audits, telemetry, tracing
- Contrast: Dark text on cyan backgrounds, white text on dark cyan

**Green (Learning)**:
- Primary: `#90EE90` (Light Green)
- Secondary: `#228B22` (Forest Green)
- Usage: Skills, reflection, summaries, embeddings
- Contrast: Dark text on green backgrounds, white text on dark green

**Purple (Retrieval)**:
- Primary: `#DDA0DD` (Plum)
- Secondary: `#9932CC` (Dark Orchid)
- Usage: Context packs, graphs, retrieval systems
- Contrast: Dark text on purple backgrounds, white text on dark purple

**Silver (Agents)**:
- Primary: `#C0C0C0` (Silver)
- Secondary: `#A9A9A9` (Dark Gray)
- Usage: AI agents, tools, automation
- Contrast: Dark text on silver backgrounds, white text on dark silver

**Orange (Production)**:
- Primary: `#FFA500` (Orange)
- Secondary: `#FF8C00` (Dark Orange)
- Usage: Recording, editing, publishing, workflows
- Contrast: Dark text on orange backgrounds, white text on dark orange

**Gray (Historical)**:
- Primary: `#696969` (Dim Gray)
- Secondary: `#2F4F4F` (Dark Slate Gray)
- Usage: Historical versions, retired models, obsolete systems
- Contrast: White text on gray backgrounds, dark text on light gray

### Design Rules

1. **High Contrast**: No black text on dark gray backgrounds
2. **No Muddy Backgrounds**: Use clear, vibrant colors
3. **No Generic Chatbot Aesthetics**: Avoid standard chat UI patterns
4. **Reference Aesthetics**: Linear, Raycast, Claude, NASA Mission Control
5. **Premium Feel**: Use subtle shadows, gradients, and depth
6. **Calm Confidence**: Avoid cyberpunk, terminal, or hacker themes

### Typography

**Font Family**: Inter or system-ui (clean, modern, readable)
**Headings**: Bold, tight letter-spacing
**Body**: Regular, comfortable line-height (1.6)
**Code**: Monospace (Fira Code or JetBrains Mono)
**Labels**: Uppercase, small, letter-spacing (0.1em)

---

## Phase 2 — Mission Control Header

### Design Specification

**Persistent Runtime Status Bar** at top of application

**Display Elements**:
- Model: `qwen3-coder`
- Gateway: `Gateway Healthy` (green indicator)
- Ollama: `Ollama Connected` (green indicator)
- Streaming: `42 tok/s`
- Latency: `2.1s`
- Context Usage: `12,345 / 32,768 tokens`

**Visual Design**:
- Dark background (`#1E3A8A` - Dark Blue)
- White text for labels
- Color-coded status indicators (green/yellow/red)
- Subtle border bottom
- Compact layout, no wasted space
- Monospace font for metrics
- Small icons for each metric

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ CRX │ qwen3-coder │ ● Gateway │ ● Ollama │ 42 tok/s │ 2.1s │
└─────────────────────────────────────────────────────────────┘
```

**Status Indicators**:
- Green (●): Healthy/Connected
- Yellow (●): Degraded/Slow
- Red (●): Error/Disconnected

**Implementation Notes**:
- Fetch status from runtime API
- Update every 5 seconds
- Show loading state on initial load
- Collapse on mobile (show summary only)

---

## Phase 3 — Premium Chat Experience

### Bubble Hierarchy

**User Messages**:
- Right-aligned
- Gold background (`#FFD700`)
- Dark text (`#1E3A8A`)
- Rounded corners (12px)
- Subtle shadow
- Timestamp in small gray text
- Copy button on hover

**Assistant Messages**:
- Left-aligned
- Light gray background (`#F5F5F5`)
- Dark text (`#1E3A8A`)
- Rounded corners (12px)
- Subtle shadow
- Timestamp in small gray text
- Copy button on hover
- Expand/collapse button for long responses

### Spacing

**Message Spacing**: 24px vertical gap between messages
**Bubble Padding**: 16px internal padding
**Input Area**: 20px padding, 12px gap between input and button
**Header**: 16px padding

### Typography

**Message Content**: 16px font size, 1.6 line-height
**Timestamps**: 12px font size, gray color (`#696969`)
**Labels**: 10px font size, uppercase, letter-spacing (0.1em)
**Code**: 14px font size, monospace

### Code Rendering

**Code Blocks**:
- Dark background (`#1E1E1E`)
- Light text (`#F5F5F5`)
- Syntax highlighting
- Copy button
- Language indicator
- Rounded corners (8px)
- 16px padding

**Inline Code**:
- Light gray background (`#E5E5E5`)
- Dark text (`#1E3A8A`)
- Rounded corners (4px)
- 4px padding

### Markdown Rendering

**Headers**: Bold, larger font size
**Lists**: Proper indentation, custom bullets
**Links**: Blue color (`#4682B4`), underline on hover
**Blockquotes**: Left border (4px gold), light gray background
**Tables**: Clean borders, alternating row colors

### Response Metadata

**Collapsible Section** below each assistant response:

```
┌─────────────────────────────────────────┐
│ Why this response? ▼                   │
├─────────────────────────────────────────┤
│ Model: qwen3-coder                      │
│ Provider: Ollama                        │
│ Temperature: 0.7                        │
│ Generation Duration: 2.1s               │
│ Context Size: 12,345 tokens            │
│ Streaming Duration: 2.0s                │
└─────────────────────────────────────────┘
```

**Visual Design**:
- Light gray background (`#F5F5F5`)
- Dark text (`#1E3A8A`)
- Small font size (12px)
- Monospace font for values
- Expand/collapse animation
- Copy button for metadata

---

## Phase 4 — Observatory Mode

### Toggle Switch

**View Toggle**: Chat | Observatory

**Placement**: Top-right of header, next to status bar

### Observatory View Design

**Layout**: Grid-based dashboard, not Grafana-style

**Metrics Display**:

**Runtime Health**:
- Large card with health score (0-100)
- Color-coded (green > 80, yellow 50-80, red < 50)
- Trend indicator (up/down arrow)
- Last updated timestamp

**Latency**:
- Line chart showing latency over time
- Current latency value
- Average latency
- P50, P95, P99 percentiles

**Model Activity**:
- Bar chart showing requests per minute
- Active model name
- Total requests count
- Success rate

**Requests**:
- Real-time request counter
- Request rate (requests/second)
- Active connections
- Queue depth

**Throughput**:
- Tokens per second chart
- Total tokens processed
- Average throughput
- Peak throughput

**Stream Activity**:
- Real-time stream status
- Active streams count
- Stream duration
- Stream errors

**Visual Design**:
- Clean, minimal charts (no grid lines, no axes labels)
- Smooth animations
- Color-coded metrics (green/yellow/red)
- Large, readable numbers
- Subtle gradients
- Card-based layout with shadows
- Responsive grid (2 columns on desktop, 1 on mobile)

**Implementation Notes**:
- Fetch metrics from runtime API
- Update every 2 seconds
- Show loading state on initial load
- Use Chart.js or similar for charts
- Implement smooth transitions

---

## Phase 5 — Architecture View

### Toggle Switch

**View Toggle**: Chat | Observatory | Architecture

### Architecture View Design

**Layout**: Vertical flow diagram with live status indicators

**Components**:

**UI Layer**:
- Card with "UI" label
- Status indicator (green/yellow/red)
- Version number
- Last updated timestamp

**Gateway Layer**:
- Card with "Gateway" label
- Status indicator (green/yellow/red)
- Connection status
- Request count

**Ollama Layer**:
- Card with "Ollama" label
- Status indicator (green/yellow/red)
- Model name
- API status

**Model Layer**:
- Card with "Model" label
- Status indicator (green/yellow/red)
- Model name
- Parameters

**Visual Design**:
- Vertical flow with arrows between layers
- Each layer in a card with shadow
- Status indicators on right side of each card
- Animated arrows showing data flow
- Color-coded status (green/yellow/red)
- Responsive layout (centered on desktop, stacked on mobile)

**Implementation Notes**:
- Fetch architecture status from runtime API
- Update every 5 seconds
- Show loading state on initial load
- Allow future expansion (add more layers)
- Animate arrows to show active data flow

---

## Phase 6 — Empty State Redesign

### Design Specification

**Replace generic empty chat** with product identity screen

**Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ CRX Runtime                                                  │
│ Local Sovereign Intelligence                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Model: qwen3-coder                                           │
│ Gateway: Connected                                          │
│                                                              │
│ Suggested Actions:                                          │
│                                                              │
│ [Review Repository]                                          │
│ [Debug Runtime]                                             │
│ [Analyze Architecture]                                       │
│ [Inspect Logs]                                              │
│ [Run Audit]                                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Centered layout
- Large, bold title ("CRX Runtime")
- Subtitle ("Local Sovereign Intelligence")
- Gold accent color for title
- Status indicators (green for connected)
- Action buttons with icons
- Hover effects on buttons
- Subtle background pattern

**Action Buttons**:
- Each button has an icon
- Gold border, dark text
- Hover: gold background, white text
- Smooth transition
- One-click insertion into chat

**Implementation Notes**:
- Show when no messages exist
- Hide after first message
- Can be accessed via menu
- Each action inserts a pre-defined prompt

---

## Phase 7 — Prompt Library

### Sidebar Design

**Placement**: Left sidebar, collapsible

**Categories**:

**Architecture**:
- System design prompts
- Architecture review prompts
- Pattern analysis prompts

**Debugging**:
- Error analysis prompts
- Debugging strategies
- Log analysis prompts

**Audits**:
- Security audit prompts
- Performance audit prompts
- Code review prompts

**Runtime**:
- Runtime analysis prompts
- Performance profiling
- Memory analysis

**Research**:
- Research prompts
- Documentation generation
- Knowledge extraction

**Development**:
- Code generation prompts
- Refactoring prompts
- Testing prompts

**Visual Design**:
- Collapsible categories
- Each prompt has title and description
- One-click insertion into chat
- Search functionality
- Hover effects
- Gold accent color for active category
- Smooth expand/collapse animation

**Implementation Notes**:
- Store prompts in JSON file
- Allow custom prompts
- Sync with runtime API
- Persist user preferences

---

## Phase 8 — Response Explainability

### Design Specification

**Every assistant response** supports "Why this response?" toggle

**Metadata Display**:

```
┌─────────────────────────────────────────┐
│ Why this response? ▼                   │
├─────────────────────────────────────────┤
│ Model: qwen3-coder                      │
│ Provider: Ollama                        │
│ Temperature: 0.7                        │
│ Generation Duration: 2.1s               │
│ Context Size: 12,345 tokens            │
│ Streaming Duration: 2.0s                │
│ Token Count: 847 tokens                 │
│ Prompt Tokens: 345 tokens               │
│ Completion Tokens: 502 tokens          │
└─────────────────────────────────────────┘
```

**Visual Design**:
- Collapsible section below response
- Light gray background
- Small font size (12px)
- Monospace font for values
- Expand/collapse animation
- Copy button for metadata
- Gold accent color for header

**Implementation Notes**:
- Fetch metadata from runtime API
- Include in response object
- Cache metadata locally
- Allow user to toggle visibility

---

## Phase 9 — Motion System

### Animation Specifications

**Message Appearance**:
- Slide in from bottom
- Fade in (0.3s)
- Subtle scale (0.95 → 1.0)
- Staggered for multiple messages

**Streaming Glow**:
- Subtle pulsing glow on streaming message
- Gold color (`#FFD700`)
- 1s duration, infinite loop

**Loading Transitions**:
- Spinner with gold accent
- Fade in/out (0.2s)
- Smooth transitions between states

**Hover Elevation**:
- Cards lift 4px on hover
- Shadow increases
- Transition duration (0.2s)
- Ease-in-out timing

**Panel Transitions**:
- Slide in from right (sidebar)
- Fade in (0.3s)
- Smooth easing

**View Switching**:
- Fade out (0.2s)
- Fade in (0.3s)
- Staggered for multiple elements

**Avoid**:
- Cyberpunk aesthetics
- Terminal aesthetics
- Hacker themes
- Excessive animations
- Jarring transitions

**Goal**:
- Calm confidence
- Premium feel
- Subtle, smooth animations
- No distractions

---

## Phase 10 — CRX Identity

### Product Identity

**The UI should communicate**:

**Local**:
- "Your runtime"
- "Sovereign intelligence"
- "No cloud dependencies"
- "Data stays local"

**Observable**:
- "See everything"
- "Full transparency"
- "Runtime metrics"
- "Response explainability"

**Deterministic**:
- "Replay architecture"
- "Constitutional truth"
- "No hidden state"
- "Reproducible results"

**Auditable**:
- "Full audit trail"
- "Response metadata"
- "Generation history"
- "Constitutional compliance"

**Replaceable Models**:
- "Model agnostic"
- "Switch anytime"
- "No vendor lock-in"
- "Your choice of model"

**Sovereign Runtime**:
- "Your rules"
- "Your data"
- "Your control"
- "Constitutional governance"

### Visual Identity

**Logo**:
- Gold "CRX" text
- Subtle glow effect
- Clean, modern font
- Small crown icon (optional)

**Color Palette**:
- Primary: Gold (constitutional)
- Secondary: Blue (runtime)
- Accent: Cyan (observability)
- Neutral: Gray (historical)

**Typography**:
- Clean, modern, readable
- Inter or system-ui
- Monospace for code/metrics

**Iconography**:
- Minimal, clean icons
- Gold accent color
- Consistent style
- Subtle animations

---

## Component Inventory

### New Components

1. **MissionControlHeader**
   - Runtime status bar
   - Model, gateway, Ollama status
   - Streaming, latency, context usage
   - Status indicators (green/yellow/red)

2. **PremiumChatBubble**
   - User/assistant message bubbles
   - Timestamps
   - Copy buttons
   - Expand/collapse for long responses
   - Response metadata toggle

3. **ObservatoryDashboard**
   - Runtime health card
   - Latency chart
   - Model activity chart
   - Requests counter
   - Throughput chart
   - Stream activity monitor

4. **ArchitectureView**
   - UI layer card
   - Gateway layer card
   - Ollama layer card
   - Model layer card
   - Status indicators
   - Animated arrows

5. **EmptyState**
   - Product identity screen
   - Model and gateway status
   - Suggested actions
   - Action buttons with icons

6. **PromptLibrarySidebar**
   - Collapsible categories
   - Prompt list with descriptions
   - Search functionality
   - One-click insertion

7. **ResponseMetadata**
   - Collapsible metadata section
   - Model, provider, temperature
   - Generation duration, context size
   - Token counts
   - Copy button

8. **ViewToggle**
   - Chat | Observatory | Architecture toggle
   - Smooth transitions
   - Active state indication

9. **StatusIndicator**
   - Green/yellow/red indicators
   - Animated pulse
   - Tooltip on hover

10. **MetricCard**
    - Card with metric value
    - Trend indicator
    - Last updated timestamp
    - Color-coded status

---

## CSS Inventory

### New CSS Variables

```css
:root {
  /* Gold (Constitutional) */
  --color-gold-primary: #FFD700;
  --color-gold-secondary: #B8860B;
  
  /* Blue (Runtime / Replay) */
  --color-blue-primary: #4682B4;
  --color-blue-secondary: #1E3A8A;
  
  /* Cyan (Observability) */
  --color-cyan-primary: #00CED1;
  --color-cyan-secondary: #008B8B;
  
  /* Green (Learning) */
  --color-green-primary: #90EE90;
  --color-green-secondary: #228B22;
  
  /* Purple (Retrieval) */
  --color-purple-primary: #DDA0DD;
  --color-purple-secondary: #9932CC;
  
  /* Silver (Agents) */
  --color-silver-primary: #C0C0C0;
  --color-silver-secondary: #A9A9A9;
  
  /* Orange (Production) */
  --color-orange-primary: #FFA500;
  --color-orange-secondary: #FF8C00;
  
  /* Gray (Historical) */
  --color-gray-primary: #696969;
  --color-gray-secondary: #2F4F4F;
  
  /* Status Colors */
  --color-status-green: #22C55E;
  --color-status-yellow: #EAB308;
  --color-status-red: #EF4444;
  
  /* Animation Durations */
  --duration-fast: 0.2s;
  --duration-normal: 0.3s;
  --duration-slow: 0.5s;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### New CSS Classes

```css
/* Animations */
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px var(--color-gold-primary);
  }
  50% {
    box-shadow: 0 0 20px var(--color-gold-primary);
  }
}

/* Utility Classes */
.animate-slide-in {
  animation: slideInUp var(--duration-normal) ease-out;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-glow {
  animation: glow 1s ease-in-out infinite;
}

/* Status Indicators */
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.green {
  background-color: var(--color-status-green);
}

.status-indicator.yellow {
  background-color: var(--color-status-yellow);
}

.status-indicator.red {
  background-color: var(--color-status-red);
}

/* Message Bubbles */
.message-bubble {
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration-fast) ease;
}

.message-bubble:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.message-bubble.user {
  background-color: var(--color-gold-primary);
  color: var(--color-blue-secondary);
}

.message-bubble.assistant {
  background-color: #F5F5F5;
  color: var(--color-blue-secondary);
}

/* Cards */
.card {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  transition: transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Buttons */
.button {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-gold-primary);
  background-color: transparent;
  color: var(--color-blue-secondary);
  font-weight: 600;
  transition: all var(--duration-fast) ease;
  cursor: pointer;
}

.button:hover {
  background-color: var(--color-gold-primary);
  color: white;
}

/* Metric Cards */
.metric-card {
  background-color: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-blue-secondary);
}

.metric-label {
  font-size: 0.875rem;
  color: var(--color-gray-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Code Blocks */
.code-block {
  background-color: #1E1E1E;
  color: #F5F5F5;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
}

/* Metadata Section */
.metadata-section {
  background-color: #F5F5F5;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
  font-size: 0.75rem;
}

.metadata-label {
  color: var(--color-gray-primary);
  font-weight: 600;
}

.metadata-value {
  color: var(--color-blue-secondary);
  font-family: 'Fira Code', monospace;
}
```

---

## UX Improvements

### Before/After Comparison

**Before**:
- Generic chat interface
- Blue/gray color scheme
- No runtime status
- No observability
- No response metadata
- Empty state shows nothing
- No prompt library
- Static, no animations
- Looks like a standard chatbot

**After**:
- Premium local intelligence workspace
- Gold/blue/cyan color system
- Mission Control header with runtime status
- Observatory mode for observability
- Architecture view for system health
- Response metadata with explainability
- Product identity empty state
- Prompt library sidebar
- Smooth animations and transitions
- Communicates "local sovereign intelligence"

### Key Improvements

1. **Product Identity**: Clear communication of CRX's value proposition
2. **Observability**: Real-time runtime metrics and health
3. **Explainability**: Response metadata and generation transparency
4. **Premium Feel**: High-quality design, animations, and interactions
5. **Visual Hierarchy**: Clear information architecture and prioritization
6. **Color System**: Meaningful color coding for different system aspects
7. **Motion System**: Smooth, calm animations that enhance UX
8. **Alternate Views**: Chat, Observatory, and Architecture views
9. **Prompt Library**: Reusable prompts for common tasks
10. **Empty State**: Meaningful onboarding and product explanation

---

## Performance Impact

### Expected Performance Changes

**Positive Impacts**:
- Optimized animations (CSS-based, GPU-accelerated)
- Efficient state management (React hooks)
- Lazy loading for charts and visualizations
- Caching for runtime metrics
- Debounced API calls for status updates

**Potential Concerns**:
- Additional API calls for runtime metrics (mitigated by caching)
- Chart rendering overhead (mitigated by lazy loading)
- Animation overhead (mitigated by CSS-based animations)
- Larger bundle size (mitigated by code splitting)

### Mitigation Strategies

1. **API Caching**: Cache runtime metrics for 5 seconds
2. **Lazy Loading**: Load charts and visualizations on demand
3. **Code Splitting**: Split code by route (chat, observatory, architecture)
4. **CSS Animations**: Use CSS instead of JavaScript for animations
5. **Debouncing**: Debounce API calls for status updates
6. **Virtual Scrolling**: Use virtual scrolling for long message lists

### Expected Metrics

- **Initial Load**: < 2 seconds
- **View Switch**: < 500ms
- **Animation Duration**: 200-500ms
- **API Call Latency**: < 100ms (cached)
- **Chart Rendering**: < 300ms
- **Bundle Size**: < 500KB (gzipped)

---

## Recommended Next UI Iteration

### Phase 11 — Advanced Observability

**Features**:
- Historical metrics (24h, 7d, 30d)
- Metric comparison (compare time periods)
- Custom dashboards
- Alert configuration
- Metric export (CSV, JSON)

### Phase 12 — Collaboration Features

**Features**:
- Share responses
- Export conversations
- Comment on responses
- Version history
- Collaborative editing

### Phase 13 — Advanced Prompt Management

**Features**:
- Custom prompt creation
- Prompt templates
- Prompt variables
- Prompt sharing
- Prompt analytics

### Phase 14 — Mobile Optimization

**Features**:
- Responsive design improvements
- Touch-optimized interactions
- Mobile-specific layouts
- Offline support
- Push notifications

### Phase 15 — Accessibility Improvements

**Features**:
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion mode
- ARIA labels and roles

---

## Implementation Priority

### High Priority (Phase 1-3)
1. Color system implementation
2. Mission Control Header
3. Premium Chat Experience

### Medium Priority (Phase 4-6)
4. Observatory Mode
5. Architecture View
6. Empty State Redesign

### Low Priority (Phase 7-10)
7. Prompt Library
8. Response Explainability
9. Motion System
10. CRX Identity

---

## Conclusion

This specification outlines a comprehensive UI evolution for CRX, transforming it from a functional chat application into a premium local intelligence workspace. The focus is on user experience, visual hierarchy, observability, and product identity, while keeping the architecture frozen.

The implementation should be phased, starting with the color system and Mission Control Header, then progressing through the premium chat experience, observability features, and finally the advanced features like prompt library and response explainability.

The result will be a UI that communicates CRX's core values: local, observable, deterministic, auditable, replaceable models, and sovereign runtime.
