// ── CONCEPT TYPE DEFINITIONS ─────────────────────────────────────────
// Concept types determine visual scale, grouping, and rendering behavior

const CONCEPT_TYPES = {
  // Authority concepts: Large, dominant, gold-themed
  AUTHORITY: {
    baseScale: 1.5,
    minSize: { w: 2.5, h: 1.5 },
    preferredSize: { w: 3.5, h: 2.0 },
    grouping: 'auto',
    visualPriority: 'highest',
    requiresIllustration: true,
    composite: true // Always group shape + label
  },

  // Projection concepts: Medium, blue-themed, semi-transparent
  PROJECTION: {
    baseScale: 1.2,
    minSize: { w: 2.0, h: 1.0 },
    preferredSize: { w: 3.0, h: 1.5 },
    grouping: 'auto',
    visualPriority: 'high',
    requiresIllustration: true,
    composite: true
  },

  // Worker concepts: Medium-small, blue-themed, panel background
  WORKER: {
    baseScale: 1.0,
    minSize: { w: 1.0, h: 0.8 },
    preferredSize: { w: 1.5, h: 1.2 },
    grouping: 'auto',
    visualPriority: 'medium',
    requiresIllustration: false,
    composite: true
  },

  // Evidence concepts: Medium, white-themed, thick borders
  EVIDENCE: {
    baseScale: 1.1,
    minSize: { w: 1.5, h: 0.8 },
    preferredSize: { w: 2.0, h: 1.0 },
    grouping: 'auto',
    visualPriority: 'medium',
    requiresIllustration: false,
    composite: true
  },

  // Legacy concepts: Small, red-themed, dashed borders
  LEGACY: {
    baseScale: 0.8,
    minSize: { w: 1.0, h: 0.6 },
    preferredSize: { w: 1.5, h: 0.8 },
    grouping: 'auto',
    visualPriority: 'low',
    requiresIllustration: false,
    composite: true
  },

  // Gateway concepts: Medium, gold-themed, shadow effects
  GATEWAY: {
    baseScale: 1.2,
    minSize: { w: 1.5, h: 2.0 },
    preferredSize: { w: 2.0, h: 2.5 },
    grouping: 'auto',
    visualPriority: 'high',
    requiresIllustration: true,
    composite: true
  },

  // Flow concepts: Small, gray/white, arrows only
  FLOW: {
    baseScale: 0.6,
    minSize: { w: 0.5, h: 0.3 },
    preferredSize: { w: 1.0, h: 0.5 },
    grouping: 'manual', // Don't auto-group arrows
    visualPriority: 'low',
    requiresIllustration: false,
    composite: false
  }
};

function getConceptType(semanticType) {
  const typeMap = {
    'authority': CONCEPT_TYPES.AUTHORITY,
    'projection': CONCEPT_TYPES.PROJECTION,
    'worker': CONCEPT_TYPES.WORKER,
    'evidence': CONCEPT_TYPES.EVIDENCE,
    'legacy': CONCEPT_TYPES.LEGACY,
    'gateway': CONCEPT_TYPES.GATEWAY,
    'flow': CONCEPT_TYPES.FLOW
  };

  return typeMap[semanticType] || CONCEPT_TYPES.FLOW;
}

function scaleConceptSize(baseSize, semanticType) {
  const conceptType = getConceptType(semanticType);
  const scale = conceptType.baseScale;

  return {
    w: baseSize.w * scale,
    h: baseSize.h * scale
  };
}

function shouldAutoGroup(semanticType) {
  const conceptType = getConceptType(semanticType);
  return conceptType.grouping === 'auto';
}

function getPreferredSize(semanticType) {
  const conceptType = getConceptType(semanticType);
  return conceptType.preferredSize;
}

module.exports = {
  CONCEPT_TYPES,
  getConceptType,
  scaleConceptSize,
  shouldAutoGroup,
  getPreferredSize
};
