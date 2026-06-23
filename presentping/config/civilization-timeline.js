// ── CIVILIZATION TIMELINE EMERGENCE MAP ─────────────────────────────
// Critical Failure #7: Emergence map too small
// Make emergence a civilization timeline that grows visibly across slides

const EMERGENCE_STAGES = {
  GATEWAY: {
    name: 'Gateway',
    order: 1,
    description: 'Constitutional enforcement at Layer 0',
    color: '#00E5FF',
    icon: 'portal'
  },
  AUTHORITY: {
    name: 'Authority',
    order: 2,
    description: 'Runtime policy enforcement',
    color: '#FFC400',
    icon: 'monument'
  },
  EXECUTION: {
    name: 'Execution',
    order: 3,
    description: 'MCP agent orchestration',
    color: '#00FF00',
    icon: 'machine'
  },
  PROJECTION: {
    name: 'Projection',
    order: 4,
    description: 'Plane UI visualization',
    color: '#00E5FF',
    icon: 'hologram'
  },
  AGENTS: {
    name: 'Agents',
    order: 5,
    description: 'Autonomous workforce',
    color: '#00FF00',
    icon: 'worker'
  },
  REPLAY: {
    name: 'Replay',
    order: 6,
    description: 'Time-travel state reconstruction',
    color: '#C0C0C0',
    icon: 'ring'
  },
  WITNESS: {
    name: 'Witness',
    order: 7,
    description: 'Constitutional compliance verification',
    color: '#FFC400',
    icon: 'eye'
  },
  GOVERNANCE: {
    name: 'Governance',
    order: 8,
    description: 'Self-improvement architecture',
    color: '#FFC400',
    icon: 'crown'
  },
  SELF_IMPROVEMENT: {
    name: 'Self-Improvement',
    order: 9,
    description: 'Constitutional evolution',
    color: '#FFC400',
    icon: 'spiral'
  }
};

const SLIDE_EMERGENCE_MAP = {
  SLIDE_1: ['GATEWAY'],
  SLIDE_2: ['GATEWAY', 'AUTHORITY'],
  SLIDE_3: ['GATEWAY', 'AUTHORITY', 'EXECUTION'],
  SLIDE_4: ['GATEWAY', 'AUTHORITY', 'EXECUTION', 'PROJECTION'],
  SLIDE_5: ['GATEWAY', 'AUTHORITY', 'EXECUTION', 'PROJECTION', 'AGENTS'],
  SLIDE_6: ['GATEWAY', 'AUTHORITY', 'EXECUTION', 'PROJECTION', 'AGENTS', 'REPLAY', 'WITNESS', 'GOVERNANCE', 'SELF_IMPROVEMENT']
};

class CivilizationTimelineEngine {
  constructor(pres) {
    this.pres = pres;
    this.timelineHistory = new Map();
    this.currentStages = [];
  }

  renderTimeline(slide, slideNumber, bounds, theme) {
    const stages = SLIDE_EMERGENCE_MAP[`SLIDE_${slideNumber}`] || [];
    this.currentStages = stages;
    
    const elements = [];
    const stageWidth = bounds.w / 9;
    const stageHeight = bounds.h;
    
    // Render timeline base
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: stageHeight,
      fill: { color: '#0A0A0F', transparency: 50 },
      line: { color: '#333333', width: 1 }
    });
    elements.push({ type: 'rect', name: 'timeline_base' });

    // Render timeline progression line
    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x,
      y: bounds.y + stageHeight / 2,
      w: bounds.w,
      h: 0,
      line: { color: '#333333', width: 2 }
    });
    elements.push({ type: 'line', name: 'timeline_progression' });

    // Render stages
    stages.forEach((stageKey, index) => {
      const stage = EMERGENCE_STAGES[stageKey];
      if (!stage) return;

      const x = bounds.x + (stage.order - 1) * stageWidth + stageWidth / 2;
      const y = bounds.y + stageHeight / 2;

      // Stage node
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: x - 0.2,
        y: y - 0.2,
        w: 0.4,
        h: 0.4,
        fill: { color: stage.color, transparency: 60 },
        line: { color: stage.color, width: 3 }
      });
      elements.push({ type: 'ellipse', name: `timeline_stage_${stageKey}` });

      // Stage icon (simplified geometric representation)
      this.renderStageIcon(slide, stage.icon, x, y, stage.color, elements);

      // Stage label
      slide.addText(stage.name, {
        x: x - 0.3,
        y: y + 0.3,
        w: 0.6,
        h: 0.2,
        fontSize: 8,
        color: stage.color,
        bold: true,
        align: 'center'
      });
      elements.push({ type: 'text', name: `timeline_label_${stageKey}` });

      // Connection to previous stage
      if (index > 0) {
        const prevStage = EMERGENCE_STAGES[stages[index - 1]];
        const prevX = bounds.x + (prevStage.order - 1) * stageWidth + stageWidth / 2;
        
        slide.addShape(this.pres.ShapeType.line, {
          x: prevX + 0.2,
          y: y,
          w: x - prevX - 0.4,
          h: 0,
          line: { color: '#00E5FF', width: 2 }
        });
        elements.push({ type: 'line', name: `timeline_connection_${index}` });
      }

      // Stage description (tooltip-style)
      slide.addText(stage.description, {
        x: x - 0.4,
        y: y - 0.5,
        w: 0.8,
        h: 0.15,
        fontSize: 6,
        color: '#CCCCCC',
        align: 'center'
      });
      elements.push({ type: 'text', name: `timeline_desc_${stageKey}` });
    });

    // Render future stages (dimmed)
    Object.keys(EMERGENCE_STAGES).forEach(stageKey => {
      if (!stages.includes(stageKey)) {
        const stage = EMERGENCE_STAGES[stageKey];
        const x = bounds.x + (stage.order - 1) * stageWidth + stageWidth / 2;
        const y = bounds.y + stageHeight / 2;

        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.15,
          y: y - 0.15,
          w: 0.3,
          h: 0.3,
          fill: { color: '#333333', transparency: 70 },
          line: { color: '#333333', width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: `timeline_future_${stageKey}` });
      }
    });

    // Timeline title
    slide.addText('CIVILIZATION EMERGENCE', {
      x: bounds.x,
      y: bounds.y - 0.3,
      w: bounds.w,
      h: 0.2,
      fontSize: 10,
      color: '#FFC400',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'timeline_title' });

    this.timelineHistory.set(slideNumber, stages);
    return { slideNumber, stages, elements };
  }

  renderStageIcon(slide, iconType, x, y, color, elements) {
    switch (iconType) {
      case 'portal':
        // Arch shape
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.15,
          w: 0.24,
          h: 0.3,
          fill: { color: color, transparency: 80 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_portal' });
        break;

      case 'monument':
        // Hexagon-like shape
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.1,
          y: y - 0.15,
          w: 0.2,
          h: 0.3,
          fill: { color: color, transparency: 80 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'rect', name: 'icon_monument' });
        break;

      case 'machine':
        // Gear-like shape
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.1,
          w: 0.2,
          h: 0.2,
          fill: { color: color, transparency: 80 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_machine' });
        break;

      case 'hologram':
        // Ellipse with glow
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.08,
          w: 0.24,
          h: 0.16,
          fill: { color: color, transparency: 85 },
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'icon_hologram' });
        break;

      case 'worker':
        // Small rectangle
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.08,
          y: y - 0.1,
          w: 0.16,
          h: 0.2,
          fill: { color: color, transparency: 80 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'rect', name: 'icon_worker' });
        break;

      case 'ring':
        // Concentric rings
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.12,
          w: 0.24,
          h: 0.24,
          fill: { color: color, transparency: 85 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_ring_outer' });
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.06,
          y: y - 0.06,
          w: 0.12,
          h: 0.12,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_ring_inner' });
        break;

      case 'eye':
        // Eye shape
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.08,
          w: 0.24,
          h: 0.16,
          fill: { color: color, transparency: 80 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_eye' });
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: '#000000', transparency: 50 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_eye_pupil' });
        break;

      case 'crown':
        // Triangle crown
        slide.addShape(this.pres.ShapeType.triangle, {
          x: x - 0.1,
          y: y - 0.15,
          w: 0.2,
          h: 0.15,
          fill: { color: color, transparency: 80 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'triangle', name: 'icon_crown' });
        break;

      case 'spiral':
        // Spiral representation (concentric arcs)
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.12,
          w: 0.24,
          h: 0.24,
          fill: { color: color, transparency: 90 },
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'icon_spiral_outer' });
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.08,
          y: y - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: color, transparency: 85 },
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'icon_spiral_inner' });
        break;

      default:
        // Default circle
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.1,
          w: 0.2,
          h: 0.2,
          fill: { color: color, transparency: 80 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_default' });
        break;
    }
  }

  getCurrentStages() {
    return this.currentStages;
  }

  getStageForSlide(slideNumber) {
    return SLIDE_EMERGENCE_MAP[`SLIDE_${slideNumber}`] || [];
  }

  validateEmergenceGrowth(slideNumber) {
    const currentStages = this.getStageForSlide(slideNumber);
    const previousStages = slideNumber > 1 ? this.getStageForSlide(slideNumber - 1) : [];
    
    // Check that stages only grow (append-only)
    const removedStages = previousStages.filter(stage => !currentStages.includes(stage));
    
    if (removedStages.length > 0) {
      throw new Error(`EMERGENCE GROWTH ERROR: Stages removed: ${removedStages.join(', ')}. Emergence must be append-only.`);
    }
    
    // Check that stages are in correct order
    const stageOrders = currentStages.map(stage => EMERGENCE_STAGES[stage]?.order).filter(Boolean);
    for (let i = 1; i < stageOrders.length; i++) {
      if (stageOrders[i] <= stageOrders[i - 1]) {
        throw new Error(`EMERGENCE ORDER ERROR: Stages not in correct order.`);
      }
    }
    
    return { valid: true, currentStages, previousStages };
  }

  getAllStages() {
    return EMERGENCE_STAGES;
  }
}

module.exports = {
  CivilizationTimelineEngine,
  EMERGENCE_STAGES,
  SLIDE_EMERGENCE_MAP
};
