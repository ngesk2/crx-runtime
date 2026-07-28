// ── FUTURE ROADMAP SYSTEM ─────────────────────────────────────────────
// Critical Failure #10: Future state is too weak
// Current → Verified → Emerging → Planned roadmap

const ROADMAP_STATES = {
  CURRENT: {
    name: 'Current',
    description: 'What exists',
    color: '#00FF00',
    icon: 'check',
    characteristics: ['implemented', 'deployed', 'verified', 'stable']
  },
  VERIFIED: {
    name: 'Verified',
    description: 'What runtime evidence proves',
    color: '#00E5FF',
    icon: 'verified',
    characteristics: ['tested', 'measured', 'validated', 'documented']
  },
  EMERGING: {
    name: 'Emerging',
    description: 'What is partially built',
    color: '#FFC400',
    icon: 'emerging',
    characteristics: ['in_development', 'partial', 'experimental', 'iterating']
  },
  PLANNED: {
    name: 'Planned',
    description: 'What constitutional architecture enables next',
    color: '#FF00FF',
    icon: 'planned',
    characteristics: ['designed', 'architected', 'specified', 'roadmapped']
  }
};

const PING_ROADMAP = {
  GATEWAY: {
    current: 'Gateway constitutional enforcement at Layer 0',
    verified: '0 provider lock-in, 100% constitutional compliance',
    emerging: 'Multi-provider routing optimization',
    planned: 'Provider-agnostic constitutional federation'
  },
  AUTHORITY: {
    current: 'Runtime policy enforcement engine',
    verified: 'All actions constitutionally validated',
    emerging: 'Dynamic policy evolution',
    planned: 'Self-modifying constitutional rules'
  },
  EVENT_LOG: {
    current: 'Append-only event sourcing',
    verified: 'Complete system reconstruction possible',
    emerging: 'Event compression and archival',
    planned: 'Distributed event log federation'
  },
  MCP: {
    current: 'Extensible tool execution framework',
    verified: '20+ tools available, 0 tool lock-in',
    emerging: 'Tool marketplace and discovery',
    planned: 'Cross-constitution tool federation'
  },
  RAG: {
    current: 'Semantic knowledge retrieval',
    verified: '95% retrieval accuracy, 0.3s latency',
    emerging: 'Multi-modal knowledge (code, docs, images)',
    planned: 'Constitutional knowledge graph reasoning'
  },
  REPLAY: {
    current: 'Time-travel state reconstruction',
    verified: '100% reconstruction accuracy, 0 state drift',
    emerging: 'Predictive replay (what-if scenarios)',
    planned: 'Parallel universe exploration'
  },
  WITNESS: {
    current: 'Constitutional compliance verification',
    verified: '100% action coverage, 0 verification failures',
    emerging: 'Real-time compliance monitoring',
    planned: 'Automated constitutional remediation'
  },
  PLANE: {
    current: 'Holographic UI projection',
    verified: '60fps rendering, 0 projection lag',
    emerging: 'Multi-user collaborative Plane',
    planned: 'Immersive constitutional visualization'
  },
  AGENTS: {
    current: 'Autonomous agent workforce',
    verified: 'Agents can use any registered tool',
    emerging: 'Agent specialization and roles',
    planned: 'Self-organizing agent societies'
  },
  GOVERNANCE: {
    current: 'Constitutional governance framework',
    verified: 'Governance rules enforced',
    emerging: 'Constitutional voting mechanisms',
    planned: 'Democratic constitutional evolution'
  }
};

class FutureRoadmapEngine {
  constructor(pres) {
    this.pres = pres;
    this.roadmapHistory = new Map();
  }

  renderRoadmap(slide, componentKey, bounds, theme) {
    const roadmap = PING_ROADMAP[componentKey];
    if (!roadmap) return [];

    const elements = [];
    const stateWidth = bounds.w / 4;
    const states = Object.values(ROADMAP_STATES);

    states.forEach((state, index) => {
      const x = bounds.x + index * stateWidth;
      const y = bounds.y;
      const stateKey = Object.keys(ROADMAP_STATES)[index];
      const stateValue = roadmap[stateKey.toLowerCase()];

      // State container
      slide.addShape(this.pres.ShapeType.rect, {
        x: x + 0.1,
        y: y + 0.1,
        w: stateWidth - 0.2,
        h: bounds.h - 0.2,
        fill: { color: state.color, transparency: 85 },
        line: { color: state.color, width: 2 }
      });
      elements.push({ type: 'rect', name: `roadmap_state_${stateKey}` });

      // State name
      slide.addText(state.name, {
        x: x + 0.2,
        y: y + 0.2,
        w: stateWidth - 0.4,
        h: 0.2,
        fontSize: 10,
        color: state.color,
        bold: true
      });
      elements.push({ type: 'text', name: `roadmap_label_${stateKey}` });

      // State description
      slide.addText(state.description, {
        x: x + 0.2,
        y: y + 0.4,
        w: stateWidth - 0.4,
        h: 0.15,
        fontSize: 7,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `roadmap_desc_${stateKey}` });

      // State value (component-specific)
      if (stateValue) {
        slide.addText(stateValue, {
          x: x + 0.2,
          y: y + 0.6,
          w: stateWidth - 0.4,
          h: 0.25,
          fontSize: 6,
          color: '#FFFFFF'
        });
        elements.push({ type: 'text', name: `roadmap_value_${stateKey}` });
      }

      // State characteristics
      const charY = y + bounds.h - 0.4;
      state.characteristics.forEach((char, charIndex) => {
        const charX = x + 0.2 + charIndex * 0.4;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: charX - 0.03,
          y: charY - 0.03,
          w: 0.06,
          h: 0.06,
          fill: { color: state.color, transparency: 70 },
          line: { color: state.color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: `roadmap_char_${stateKey}_${charIndex}` });
      });

      // Connection arrow to next state
      if (index < states.length - 1) {
        slide.addShape(this.pres.ShapeType.line, {
          x: x + stateWidth - 0.1,
          y: y + bounds.h / 2,
          w: 0.2,
          h: 0,
          line: { color: '#00E5FF', width: 2 }
        });
        elements.push({ type: 'line', name: `roadmap_arrow_${index}` });

        slide.addShape(this.pres.ShapeType.triangle, {
          x: x + stateWidth + 0.05,
          y: y + bounds.h / 2 - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: '#00E5FF', transparency: 70 },
          line: { color: '#00E5FF', width: 1 }
        });
        elements.push({ type: 'triangle', name: `roadmap_arrow_head_${index}` });
      }

      // State icon
      this.renderStateIcon(slide, state.icon, x + stateWidth / 2, y + bounds.h - 0.15, state.color, elements);
    });

    // Component title
    slide.addText(componentKey, {
      x: bounds.x,
      y: bounds.y - 0.3,
      w: bounds.w,
      h: 0.2,
      fontSize: 11,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'roadmap_title' });

    this.roadmapHistory.set(componentKey, elements);
    return { componentKey, elements };
  }

  renderStateIcon(slide, iconType, x, y, color, elements) {
    switch (iconType) {
      case 'check':
        // Checkmark
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.08,
          y: y + 0.02,
          w: 0.06,
          h: -0.06,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_check_1' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.02,
          y: y - 0.04,
          w: 0.08,
          h: 0.08,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_check_2' });
        break;

      case 'verified':
        // Verified badge
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.08,
          y: y - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_verified_badge' });
        
        slide.addText('✓', {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: 0.1,
          fontSize: 10,
          color: '#FFFFFF',
          align: 'center'
        });
        elements.push({ type: 'text', name: 'icon_verified_check' });
        break;

      case 'emerging':
        // Emerging spark
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_emerging_center' });
        
        // Radiating lines
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          slide.addShape(this.pres.ShapeType.line, {
            x: x,
            y: y,
            w: Math.cos(angle) * 0.1,
            h: Math.sin(angle) * 0.1,
            line: { color: color, width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `icon_emerging_ray_${i}` });
        }
        break;

      case 'planned':
        // Planned target
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.08,
          y: y - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'icon_planned_target' });
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.04,
          y: y - 0.04,
          w: 0.08,
          h: 0.08,
          fill: { color: color, transparency: 85 },
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'icon_planned_inner' });
        break;

      default:
        // Default circle
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_default' });
        break;
    }
  }

  renderRoadmapSummary(slide, bounds, theme) {
    const elements = [];
    const components = Object.keys(PING_ROADMAP);
    const componentSpacing = bounds.h / components.length;

    components.forEach((componentKey, index) => {
      const roadmap = PING_ROADMAP[componentKey];
      const y = bounds.y + index * componentSpacing + componentSpacing / 2;

      // Component name
      slide.addText(componentKey, {
        x: bounds.x + 0.2,
        y: y - 0.1,
        w: 1.5,
        h: 0.2,
        fontSize: 9,
        color: theme.primary || '#00E5FF',
        bold: true
      });
      elements.push({ type: 'text', name: `summary_component_${index}` });

      // State indicators
      const states = ['current', 'verified', 'emerging', 'planned'];
      states.forEach((state, stateIndex) => {
        const stateKey = state.toUpperCase();
        const stateConfig = ROADMAP_STATES[stateKey];
        const sx = bounds.x + 2 + stateIndex * 0.3;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: sx - 0.04,
          y: y - 0.04,
          w: 0.08,
          h: 0.08,
          fill: { color: stateConfig.color, transparency: 70 },
          line: { color: stateConfig.color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: `summary_state_${index}_${state}` });
      });

      // Progress indicator
      const progressWidth = bounds.w - 3.5;
      const progressX = bounds.x + 3.5;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: progressX,
        y: y - 0.03,
        w: progressWidth,
        h: 0.06,
        fill: { color: '#333333', transparency: 70 },
        line: { color: '#333333', width: 1 }
      });
      elements.push({ type: 'rect', name: `summary_progress_bg_${index}` });

      // Calculate progress (current = 25%, verified = 50%, emerging = 75%, planned = 100%)
      let progress = 0;
      if (roadmap.current) progress += 25;
      if (roadmap.verified) progress += 25;
      if (roadmap.emerging) progress += 25;
      if (roadmap.planned) progress += 25;

      slide.addShape(this.pres.ShapeType.rect, {
        x: progressX,
        y: y - 0.03,
        w: progressWidth * (progress / 100),
        h: 0.06,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'rect', name: `summary_progress_fg_${index}` });
    });

    // Legend
    const legendY = bounds.y + bounds.h - 0.3;
    const legendStates = Object.values(ROADMAP_STATES);
    const legendSpacing = bounds.w / legendStates.length;

    legendStates.forEach((state, index) => {
      const lx = bounds.x + index * legendSpacing + legendSpacing / 2;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: lx - 0.04,
        y: legendY - 0.04,
        w: 0.08,
        h: 0.08,
        fill: { color: state.color, transparency: 70 },
        line: { color: state.color, width: 1 }
      });
      elements.push({ type: 'ellipse', name: `legend_icon_${index}` });

      slide.addText(state.name, {
        x: lx + 0.06,
        y: legendY - 0.05,
        w: 0.5,
        h: 0.1,
        fontSize: 7,
        color: state.color
      });
      elements.push({ type: 'text', name: `legend_text_${index}` });
    });

    return { elements };
  }

  getRoadmapForComponent(componentKey) {
    return PING_ROADMAP[componentKey];
  }

  getAllRoadmaps() {
    return PING_ROADMAP;
  }

  calculateRoadmapProgress(componentKey) {
    const roadmap = PING_ROADMAP[componentKey];
    if (!roadmap) return 0;

    let progress = 0;
    if (roadmap.current) progress += 25;
    if (roadmap.verified) progress += 25;
    if (roadmap.emerging) progress += 25;
    if (roadmap.planned) progress += 25;

    return progress;
  }

  calculateOverallProgress() {
    const components = Object.keys(PING_ROADMAP);
    const totalProgress = components.reduce((sum, component) => {
      return sum + this.calculateRoadmapProgress(component);
    }, 0);

    return totalProgress / components.length;
  }
}

module.exports = {
  FutureRoadmapEngine,
  ROADMAP_STATES,
  PING_ROADMAP
};
