// ── SEMANTIC COLOR SYSTEM ─────────────────────────────────────────────
// Colors encode ontology, not just aesthetics

const SEMANTIC_COLORS = {
  // Authority: Constitutional layer, Event Log, Replay, Gateway
  AUTHORITY: {
    primary: "#FFC400",
    secondary: "#FFD700",
    accent: "#FFA500",
    glow: "FFC400",
    shadow: "CC9900"
  },

  // Projection: Qdrant, Plane UI, derived state, holograms
  PROJECTION: {
    primary: "#00E5FF",
    secondary: "#00BFFF",
    accent: "#00FFFF",
    glow: "00E5FF",
    shadow: "008B8B"
  },

  // Evidence: Tasks, Actions, lineage threads, witness data
  EVIDENCE: {
    primary: "#FFFFFF",
    secondary: "#F0F0F0",
    accent: "#E0E0E0",
    glow: "FFFFFF",
    shadow: "A0A0A0"
  },

  // Legacy: Old architecture, CRUD, broken systems, drift
  LEGACY: {
    primary: "#FF1744",
    secondary: "#FF4081",
    accent: "#FF5252",
    glow: "FF1744",
    shadow: "C62828"
  },

  // Worker: Agents, MCP, labor, robotic systems
  WORKER: {
    primary: "#00E5FF",
    secondary: "#4FC3F7",
    accent: "#29B6F6",
    glow: "00E5FF",
    shadow: "0288D1"
  },

  // Flow: Arrows, connectors, data movement, event propagation
  FLOW: {
    primary: "#9E9E9E",
    secondary: "#BDBDBD",
    accent: "#E0E0E0",
    glow: "FFFFFF",
    shadow: "757575"
  },

  // Backgrounds: Layered, meaningful, not flat black
  BACKGROUND: {
    base: "#0A0A0F",
    grid: "#1A1A2E",
    terrain: "#0D0D12",
    industrial: "#0C0C10",
    cyber: "#08080C",
    factory: "#0B0B10",
    space: "#050508"
  }
};

function getSemanticColor(semanticType, shade = 'primary') {
  const typeMap = {
    'authority': SEMANTIC_COLORS.AUTHORITY,
    'projection': SEMANTIC_COLORS.PROJECTION,
    'evidence': SEMANTIC_COLORS.EVIDENCE,
    'legacy': SEMANTIC_COLORS.LEGACY,
    'worker': SEMANTIC_COLORS.WORKER,
    'flow': SEMANTIC_COLORS.FLOW
  };

  const colorSet = typeMap[semanticType];
  if (!colorSet) {
    return SEMANTIC_COLORS.FLOW.primary;
  }

  return colorSet[shade] || colorSet.primary;
}

function applySemanticTheme(slide, semanticType) {
  const colors = {
    'authority': SEMANTIC_COLORS.AUTHORITY,
    'projection': SEMANTIC_COLORS.PROJECTION,
    'evidence': SEMANTIC_COLORS.EVIDENCE,
    'legacy': SEMANTIC_COLORS.LEGACY,
    'worker': SEMANTIC_COLORS.WORKER,
    'flow': SEMANTIC_COLORS.FLOW
  };

  return colors[semanticType] || SEMANTIC_COLORS.FLOW;
}

module.exports = {
  SEMANTIC_COLORS,
  getSemanticColor,
  applySemanticTheme
};
