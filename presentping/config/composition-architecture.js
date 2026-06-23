// ── COMPOSITION-FIRST ARCHITECTURE ───────────────────────────────────────
// V14: Composition score is now the primary score
// Every slide must contain: 1 Hero Object, 3-5 Supporting Systems, 5-20 Context Systems, unlimited Environmental Systems
// The viewer should instantly know: what matters first, what matters second, what matters third within three seconds

const COMPOSITION_HIERARCHY = {
  HERO: {
    name: 'Hero Object',
    priority: 1,
    count: { min: 1, max: 1 },
    characteristics: ['dominant', 'centered', 'largest', 'most_detailed'],
    visualWeight: 0.4
  },
  SUPPORTING: {
    name: 'Supporting Systems',
    priority: 2,
    count: { min: 3, max: 5 },
    characteristics: ['secondary', 'prominent', 'connected_to_hero', 'medium_detail'],
    visualWeight: 0.3
  },
  CONTEXT: {
    name: 'Context Systems',
    priority: 3,
    count: { min: 5, max: 20 },
    characteristics: ['tertiary', 'informative', 'peripheral', 'low_detail'],
    visualWeight: 0.2
  },
  ENVIRONMENTAL: {
    name: 'Environmental Systems',
    priority: 4,
    count: { min: 0, max: Infinity },
    characteristics: ['background', 'atmospheric', 'subtle', 'ambient'],
    visualWeight: 0.1
  }
};

const COMPOSITION_THRESHOLDS = {
  HERO_CENTER_DOMINANCE: 0.6, // Hero must occupy 60% of center area
  HERO_VISUAL_WEIGHT: 0.35, // Hero must have 35% of total visual weight
  SUPPORTING_VISUAL_WEIGHT: 0.25, // Supporting systems must have 25% of total visual weight
  CONTEXT_VISUAL_WEIGHT: 0.2, // Context systems must have 20% of total visual weight
  MAX_HIERARCHY_VIOLATIONS: 0, // Zero violations allowed
  MIN_READABILITY_SCORE: 80 // Minimum readability score (0-100)
};

class CompositionArchitectureEngine {
  constructor(pres) {
    this.pres = pres;
    this.compositionHistory = new Map();
  }

  analyzeComposition(objects) {
    const analysis = {
      hero: [],
      supporting: [],
      context: [],
      environmental: [],
      hierarchyViolations: []
    };

    objects.forEach(obj => {
      const hierarchy = this.determineHierarchy(obj);
      analysis[hierarchy].push(obj);
    });

    // Validate hierarchy counts
    this.validateHierarchyCounts(analysis);

    // Calculate visual weights
    analysis.visualWeights = this.calculateVisualWeights(analysis);

    // Validate visual weight distribution
    this.validateVisualWeightDistribution(analysis);

    // Calculate readability score
    analysis.readabilityScore = this.calculateReadabilityScore(analysis);

    return analysis;
  }

  determineHierarchy(obj) {
    // Determine hierarchy based on object properties
    if (obj.isHero || obj.priority === 1 || obj.semanticType === 'HERO') {
      return 'hero';
    }
    if (obj.isSupporting || obj.priority === 2 || obj.semanticType === 'SUPPORTING') {
      return 'supporting';
    }
    if (obj.isContext || obj.priority === 3 || obj.semanticType === 'CONTEXT') {
      return 'context';
    }
    if (obj.isEnvironmental || obj.priority === 4 || obj.semanticType === 'ENVIRONMENTAL') {
      return 'environmental';
    }

    // Default determination based on size and position
    const size = (obj.w || 0) * (obj.h || 0);
    const centerX = 5;
    const centerY = 3.75;
    const objCenterX = (obj.x || 0) + (obj.w || 0) / 2;
    const objCenterY = (obj.y || 0) + (obj.h || 0) / 2;
    const distanceFromCenter = Math.sqrt(Math.pow(objCenterX - centerX, 2) + Math.pow(objCenterY - centerY, 2));

    if (size > 3 && distanceFromCenter < 2) {
      return 'hero';
    }
    if (size > 1.5 && distanceFromCenter < 3) {
      return 'supporting';
    }
    if (size > 0.5) {
      return 'context';
    }
    return 'environmental';
  }

  validateHierarchyCounts(analysis) {
    const heroCount = analysis.hero.length;
    const supportingCount = analysis.supporting.length;
    const contextCount = analysis.context.length;

    if (heroCount < COMPOSITION_HIERARCHY.HERO.count.min) {
      analysis.hierarchyViolations.push(`Missing hero object (need ${COMPOSITION_HIERARCHY.HERO.count.min}, have ${heroCount})`);
    }
    if (heroCount > COMPOSITION_HIERARCHY.HERO.count.max) {
      analysis.hierarchyViolations.push(`Too many hero objects (max ${COMPOSITION_HIERARCHY.HERO.count.max}, have ${heroCount})`);
    }
    if (supportingCount < COMPOSITION_HIERARCHY.SUPPORTING.count.min) {
      analysis.hierarchyViolations.push(`Too few supporting systems (need ${COMPOSITION_HIERARCHY.SUPPORTING.count.min}, have ${supportingCount})`);
    }
    if (supportingCount > COMPOSITION_HIERARCHY.SUPPORTING.count.max) {
      analysis.hierarchyViolations.push(`Too many supporting systems (max ${COMPOSITION_HIERARCHY.SUPPORTING.count.max}, have ${supportingCount})`);
    }
    if (contextCount < COMPOSITION_HIERARCHY.CONTEXT.count.min) {
      analysis.hierarchyViolations.push(`Too few context systems (need ${COMPOSITION_HIERARCHY.CONTEXT.count.min}, have ${contextCount})`);
    }
    if (contextCount > COMPOSITION_HIERARCHY.CONTEXT.count.max) {
      analysis.hierarchyViolations.push(`Too many context systems (max ${COMPOSITION_HIERARCHY.CONTEXT.count.max}, have ${contextCount})`);
    }
  }

  calculateVisualWeights(analysis) {
    const totalArea = this.calculateTotalArea(analysis);
    
    return {
      hero: this.calculateArea(analysis.hero) / totalArea,
      supporting: this.calculateArea(analysis.supporting) / totalArea,
      context: this.calculateArea(analysis.context) / totalArea,
      environmental: this.calculateArea(analysis.environmental) / totalArea
    };
  }

  calculateArea(objects) {
    return objects.reduce((sum, obj) => sum + (obj.w || 0) * (obj.h || 0), 0);
  }

  calculateTotalArea(analysis) {
    return this.calculateArea(analysis.hero) +
           this.calculateArea(analysis.supporting) +
           this.calculateArea(analysis.context) +
           this.calculateArea(analysis.environmental);
  }

  validateVisualWeightDistribution(analysis) {
    if (analysis.visualWeights.hero < COMPOSITION_THRESHOLDS.HERO_VISUAL_WEIGHT) {
      analysis.hierarchyViolations.push(`Hero visual weight too low: ${(analysis.visualWeights.hero * 100).toFixed(1)}% (min: ${(COMPOSITION_THRESHOLDS.HERO_VISUAL_WEIGHT * 100).toFixed(0)}%)`);
    }
    if (analysis.visualWeights.supporting < COMPOSITION_THRESHOLDS.SUPPORTING_VISUAL_WEIGHT) {
      analysis.hierarchyViolations.push(`Supporting visual weight too low: ${(analysis.visualWeights.supporting * 100).toFixed(1)}% (min: ${(COMPOSITION_THRESHOLDS.SUPPORTING_VISUAL_WEIGHT * 100).toFixed(0)}%)`);
    }
    if (analysis.visualWeights.context < COMPOSITION_THRESHOLDS.CONTEXT_VISUAL_WEIGHT) {
      analysis.hierarchyViolations.push(`Context visual weight too low: ${(analysis.visualWeights.context * 100).toFixed(1)}% (min: ${(COMPOSITION_THRESHOLDS.CONTEXT_VISUAL_WEIGHT * 100).toFixed(0)}%)`);
    }
  }

  calculateReadabilityScore(analysis) {
    let score = 100;

    // Deduct for hierarchy violations
    score -= analysis.hierarchyViolations.length * 15;

    // Deduct for poor visual weight distribution
    const heroWeightDiff = Math.abs(analysis.visualWeights.hero - COMPOSITION_THRESHOLDS.HERO_VISUAL_WEIGHT);
    score -= heroWeightDiff * 30;

    // Deduct for clutter
    const totalObjects = analysis.hero.length + analysis.supporting.length + analysis.context.length + analysis.environmental.length;
    if (totalObjects > 30) {
      score -= (totalObjects - 30) * 2;
    }

    return Math.max(0, score);
  }

  renderCompositionGuide(slide, bounds, theme) {
    const elements = [];
    
    // Guide title
    slide.addText('COMPOSITION-FIRST ARCHITECTURE', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.2,
      fontSize: 11,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'composition_title' });

    // Hierarchy description
    slide.addText('1 Hero Object | 3-5 Supporting Systems | 5-20 Context Systems | Unlimited Environmental Systems', {
      x: bounds.x,
      y: bounds.y + 0.25,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'composition_description' });

    // Hierarchy levels
    const hierarchyY = bounds.y + 0.5;
    const hierarchySpacing = bounds.h / 5;
    
    Object.entries(COMPOSITION_HIERARCHY).forEach(([key, hierarchy], index) => {
      const y = hierarchyY + index * hierarchySpacing;
      
      // Level name
      slide.addText(hierarchy.name, {
        x: bounds.x + 0.2,
        y: y,
        w: 2,
        h: 0.15,
        fontSize: 9,
        color: theme.primary || '#00E5FF',
        bold: true
      });
      elements.push({ type: 'text', name: `composition_level_name_${index}` });

      // Count range
      slide.addText(`${hierarchy.count.min}-${hierarchy.count.max === Infinity ? '∞' : hierarchy.count.max}`, {
        x: bounds.x + 2.3,
        y: y,
        w: 1,
        h: 0.15,
        fontSize: 8,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `composition_level_count_${index}` });

      // Characteristics
      slide.addText(hierarchy.characteristics.join(', '), {
        x: bounds.x + 3.5,
        y: y,
        w: 4,
        h: 0.15,
        fontSize: 7,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `composition_level_characteristics_${index}` });

      // Visual weight
      slide.addText(`${(hierarchy.visualWeight * 100).toFixed(0)}%`, {
        x: bounds.x + 7.7,
        y: y,
        w: 1,
        h: 0.15,
        fontSize: 8,
        color: '#FFC400',
        align: 'right'
      });
      elements.push({ type: 'text', name: `composition_level_weight_${index}` });
    });

    // Thresholds summary
    const thresholdsY = bounds.y + bounds.h - 0.8;
    const thresholds = [
      `Hero center dominance: ${(COMPOSITION_THRESHOLDS.HERO_CENTER_DOMINANCE * 100).toFixed(0)}%`,
      `Hero visual weight: ${(COMPOSITION_THRESHOLDS.HERO_VISUAL_WEIGHT * 100).toFixed(0)}%`,
      `Supporting visual weight: ${(COMPOSITION_THRESHOLDS.SUPPORTING_VISUAL_WEIGHT * 100).toFixed(0)}%`,
      `Context visual weight: ${(COMPOSITION_THRESHOLDS.CONTEXT_VISUAL_WEIGHT * 100).toFixed(0)}%`,
      `Min readability score: ${COMPOSITION_THRESHOLDS.MIN_READABILITY_SCORE}`
    ];

    thresholds.forEach((threshold, index) => {
      slide.addText(threshold, {
        x: bounds.x + 0.2,
        y: thresholdsY + index * 0.12,
        w: bounds.w - 0.4,
        h: 0.1,
        fontSize: 6,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `composition_threshold_${index}` });
    });

    return { elements };
  }

  validateComposition(slideNumber, objects) {
    const analysis = this.analyzeComposition(objects);
    
    if (analysis.hierarchyViolations.length > 0) {
      throw new Error(`COMPOSITION FATAL: Slide ${slideNumber} has ${analysis.hierarchyViolations.length} hierarchy violation(s): ${analysis.hierarchyViolations.join('; ')}`);
    }

    if (analysis.readabilityScore < COMPOSITION_THRESHOLDS.MIN_READABILITY_SCORE) {
      throw new Error(`COMPOSITION FATAL: Slide ${slideNumber} readability score too low: ${analysis.readabilityScore.toFixed(0)} (min: ${COMPOSITION_THRESHOLDS.MIN_READABILITY_SCORE})`);
    }

    this.compositionHistory.set(slideNumber, analysis);
    return { valid: true, analysis };
  }

  getCompositionAnalysis(slideNumber) {
    return this.compositionHistory.get(slideNumber);
  }

  getAllCompositions() {
    return this.compositionHistory;
  }
}

module.exports = {
  CompositionArchitectureEngine,
  COMPOSITION_HIERARCHY,
  COMPOSITION_THRESHOLDS
};
