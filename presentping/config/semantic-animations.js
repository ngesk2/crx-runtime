// ── SEMANTIC ANIMATION SYSTEM ─────────────────────────────────────────
// V14: Animations are behavior, not decoration
// Gateway=pulse, Authority=emerge, Replay=orbit, Witness=reveal, Knowledge Graph=expand, Agents=spawn, Brain=synchronize

const ANIMATION_TYPES = {
  GATEWAY: {
    name: 'pulse',
    description: 'Rhythmic activation indicating constitutional enforcement',
    parameters: {
      duration: 1.5,
      intensity: 0.8,
      rhythm: 'steady'
    }
  },
  AUTHORITY: {
    name: 'emerge',
    description: 'Gradual materialization showing policy enforcement',
    parameters: {
      duration: 2.0,
      intensity: 0.9,
      rhythm: 'slow'
    }
  },
  REPLAY: {
    name: 'orbit',
    description: 'Circular motion representing time-travel navigation',
    parameters: {
      duration: 3.0,
      intensity: 0.7,
      rhythm: 'continuous'
    }
  },
  WITNESS: {
    name: 'reveal',
    description: 'Progressive disclosure showing compliance verification',
    parameters: {
      duration: 1.8,
      intensity: 0.85,
      rhythm: 'sequential'
    }
  },
  KNOWLEDGE: {
    name: 'expand',
    description: 'Radial growth representing knowledge graph expansion',
    parameters: {
      duration: 2.5,
      intensity: 0.75,
      rhythm: 'accelerating'
    }
  },
  AGENTS: {
    name: 'spawn',
    description: 'Rapid appearance representing agent activation',
    parameters: {
      duration: 0.8,
      intensity: 0.9,
      rhythm: 'burst'
    }
  },
  BRAIN: {
    name: 'synchronize',
    description: 'Coordinated activity representing neural coordination',
    parameters: {
      duration: 2.0,
      intensity: 0.8,
      rhythm: 'wave'
    }
  },
  PROJECTION: {
    name: 'materialize',
    description: 'Gradual appearance representing holographic projection',
    parameters: {
      duration: 1.5,
      intensity: 0.85,
      rhythm: 'fade_in'
    }
  },
  EXECUTION: {
    name: 'flow',
    description: 'Continuous motion representing workflow execution',
    parameters: {
      duration: 2.0,
      intensity: 0.8,
      rhythm: 'stream'
    }
  },
  GOVERNANCE: {
    name: 'evolve',
    description: 'Progressive transformation representing constitutional evolution',
    parameters: {
      duration: 3.0,
      intensity: 0.7,
      rhythm: 'iterative'
    }
  }
};

class SemanticAnimationEngine {
  constructor(pres) {
    this.pres = pres;
    this.animationHistory = new Map();
  }

  applyAnimation(slide, semanticType, bounds, theme) {
    const animationConfig = ANIMATION_TYPES[semanticType];
    if (!animationConfig) return [];

    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    switch (animationConfig.name) {
      case 'pulse':
        elements.push(...this.renderPulseAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'emerge':
        elements.push(...this.renderEmergeAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'orbit':
        elements.push(...this.renderOrbitAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'reveal':
        elements.push(...this.renderRevealAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'expand':
        elements.push(...this.renderExpandAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'spawn':
        elements.push(...this.renderSpawnAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'synchronize':
        elements.push(...this.renderSynchronizeAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'materialize':
        elements.push(...this.renderMaterializeAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'flow':
        elements.push(...this.renderFlowAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      case 'evolve':
        elements.push(...this.renderEvolveAnimation(slide, bounds, theme, animationConfig.parameters));
        break;
      default:
        elements.push(...this.renderDefaultAnimation(slide, bounds, theme));
    }

    // Animation indicator
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: bounds.x + bounds.w - 0.15,
      y: bounds.y + bounds.h - 0.15,
      w: 0.1,
      h: 0.1,
      fill: { color: '#00FF00', transparency: 70 },
      line: { color: '#00FF00', width: 1 }
    });
    elements.push({ type: 'ellipse', name: `animation_indicator_${semanticType}` });

    this.animationHistory.set(semanticType, { animation: animationConfig.name, bounds, slide });
    return elements;
  }

  renderPulseAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    const pulseCount = 3;

    for (let i = 0; i < pulseCount; i++) {
      const pulseRadius = Math.min(bounds.w, bounds.h) * 0.3 * (1 + i * 0.3);
      const transparency = 80 + i * 10;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - pulseRadius,
        y: centerY - pulseRadius,
        w: pulseRadius * 2,
        h: pulseRadius * 2,
        fill: { color: theme.primary || '#00E5FF', transparency },
        line: { color: theme.primary || '#00E5FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `pulse_ring_${i}`, animation: 'pulse', delay: i * 0.3 });
    }

    return elements;
  }

  renderEmergeAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Core emergence
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.2,
      y: centerY - 0.2,
      w: 0.4,
      h: 0.4,
      fill: { color: theme.primary || '#FFC400', transparency: 60 },
      line: { color: theme.primary || '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'emerge_core', animation: 'emerge', delay: 0 });

    // Radiating emergence waves
    const waveCount = 4;
    for (let i = 0; i < waveCount; i++) {
      const waveRadius = 0.3 + i * 0.2;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - waveRadius,
        y: centerY - waveRadius,
        w: waveRadius * 2,
        h: waveRadius * 2,
        fill: { color: theme.primary || '#FFC400', transparency: 90 - i * 5 },
        line: { color: theme.primary || '#FFC400', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `emerge_wave_${i}`, animation: 'emerge', delay: 0.5 + i * 0.3 });
    }

    return elements;
  }

  renderOrbitAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Central core
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.15,
      y: centerY - 0.15,
      w: 0.3,
      h: 0.3,
      fill: { color: theme.primary || '#C0C0C0', transparency: 60 },
      line: { color: theme.primary || '#C0C0C0', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'orbit_core', animation: 'orbit', delay: 0 });

    // Orbital paths
    const orbitCount = 3;
    for (let i = 0; i < orbitCount; i++) {
      const orbitRadius = 0.4 + i * 0.2;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - orbitRadius,
        y: centerY - orbitRadius,
        w: orbitRadius * 2,
        h: orbitRadius * 2,
        fill: { color: theme.primary || '#C0C0C0', transparency: 95 },
        line: { color: theme.primary || '#C0C0C0', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `orbit_path_${i}`, animation: 'orbit', delay: i * 0.4 });

      // Orbiting object
      const orbitAngle = (i / orbitCount) * Math.PI * 2;
      const objX = centerX + Math.cos(orbitAngle) * orbitRadius;
      const objY = centerY + Math.sin(orbitAngle) * orbitRadius;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: objX - 0.05,
        y: objY - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: '#00E5FF', transparency: 70 },
        line: { color: '#00E5FF', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `orbit_object_${i}`, animation: 'orbit', delay: i * 0.4 });
    }

    return elements;
  }

  renderRevealAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Sequential reveal layers
    const layerCount = 4;
    for (let i = 0; i < layerCount; i++) {
      const layerSize = 0.3 + i * 0.15;
      const transparency = 70 + i * 8;

      slide.addShape(this.pres.ShapeType.rect, {
        x: centerX - layerSize / 2,
        y: centerY - layerSize / 2,
        w: layerSize,
        h: layerSize,
        fill: { color: theme.primary || '#FFC400', transparency },
        line: { color: theme.primary || '#FFC400', width: 2 }
      });
      elements.push({ type: 'rect', name: `reveal_layer_${i}`, animation: 'reveal', delay: i * 0.4 });
    }

    return elements;
  }

  renderExpandAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Central hub
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.15,
      y: centerY - 0.15,
      w: 0.3,
      h: 0.3,
      fill: { color: theme.primary || '#FF00FF', transparency: 60 },
      line: { color: theme.primary || '#FF00FF', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'expand_hub', animation: 'expand', delay: 0 });

    // Expanding nodes
    const nodeCount = 6;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const nodeRadius = 0.2 + i * 0.1;
      const nx = centerX + Math.cos(angle) * nodeRadius;
      const ny = centerY + Math.sin(angle) * nodeRadius;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: nx - 0.08,
        y: ny - 0.08,
        w: 0.16,
        h: 0.16,
        fill: { color: theme.primary || '#FF00FF', transparency: 70 },
        line: { color: theme.primary || '#FF00FF', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `expand_node_${i}`, animation: 'expand', delay: 0.3 + i * 0.2 });

      // Connection line
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: nx - centerX,
        h: ny - centerY,
        line: { color: theme.primary || '#FF00FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `expand_connection_${i}`, animation: 'expand', delay: 0.3 + i * 0.2 });
    }

    return elements;
  }

  renderSpawnAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Burst spawn
    const spawnCount = 5;
    for (let i = 0; i < spawnCount; i++) {
      const angle = (i / spawnCount) * Math.PI * 2;
      const spawnDistance = 0.4;
      const sx = centerX + Math.cos(angle) * spawnDistance;
      const sy = centerY + Math.sin(angle) * spawnDistance;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: sx - 0.08,
        y: sy - 0.08,
        w: 0.16,
        h: 0.16,
        fill: { color: theme.primary || '#00FF00', transparency: 70 },
        line: { color: theme.primary || '#00FF00', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `spawn_agent_${i}`, animation: 'spawn', delay: i * 0.1 });
    }

    return elements;
  }

  renderSynchronizeAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Central hub
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.15,
      y: centerY - 0.15,
      w: 0.3,
      h: 0.3,
      fill: { color: theme.primary || '#FF00FF', transparency: 60 },
      line: { color: theme.primary || '#FF00FF', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'sync_hub', animation: 'synchronize', delay: 0 });

    // Wave synchronization
    const waveCount = 3;
    for (let i = 0; i < waveCount; i++) {
      const waveRadius = 0.3 + i * 0.2;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - waveRadius,
        y: centerY - waveRadius,
        w: waveRadius * 2,
        h: waveRadius * 2,
        fill: { color: theme.primary || '#FF00FF', transparency: 90 - i * 5 },
        line: { color: theme.primary || '#FF00FF', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `sync_wave_${i}`, animation: 'synchronize', delay: i * 0.5 });
    }

    return elements;
  }

  renderMaterializeAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Fade-in materialization
    const holoWidth = bounds.w * 0.6;
    const holoHeight = bounds.h * 0.6;

    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - holoWidth / 2,
      y: centerY - holoHeight / 2,
      w: holoWidth,
      h: holoHeight,
      fill: { color: theme.primary || '#00E5FF', transparency: 85 },
      line: { color: theme.primary || '#00E5FF', width: 2, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'materialize_hologram', animation: 'materialize', delay: 0 });

    // Scan lines
    const scanCount = 4;
    for (let i = 0; i < scanCount; i++) {
      const sy = centerY - holoHeight / 2 + (i + 1) * (holoHeight / (scanCount + 1));

      slide.addShape(this.pres.ShapeType.line, {
        x: centerX - holoWidth / 2,
        y: sy,
        w: holoWidth,
        h: 0,
        line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `materialize_scan_${i}`, animation: 'materialize', delay: 0.3 + i * 0.2 });
    }

    return elements;
  }

  renderFlowAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Stream flow
    const streamCount = 3;
    for (let i = 0; i < streamCount; i++) {
      const yOffset = (i - 1) * 0.3;

      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x,
        y: centerY + yOffset,
        w: bounds.w,
        h: 0,
        line: { color: theme.primary || '#00FF00', width: 2 }
      });
      elements.push({ type: 'line', name: `flow_stream_${i}`, animation: 'flow', delay: i * 0.2 });

      // Flow arrows
      const arrowCount = 3;
      for (let j = 0; j < arrowCount; j++) {
        const ax = bounds.x + (j + 1) * (bounds.w / (arrowCount + 1));

        slide.addShape(this.pres.ShapeType.triangle, {
          x: ax - 0.06,
          y: centerY + yOffset - 0.06,
          w: 0.12,
          h: 0.12,
          fill: { color: theme.primary || '#00FF00', transparency: 60 },
          line: { color: theme.primary || '#00FF00', width: 1 }
        });
        elements.push({ type: 'triangle', name: `flow_arrow_${i}_${j}`, animation: 'flow', delay: i * 0.2 + j * 0.1 });
      }
    }

    return elements;
  }

  renderEvolveAnimation(slide, bounds, theme, params) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Evolution core
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.2,
      y: centerY - 0.2,
      w: 0.4,
      h: 0.4,
      fill: { color: theme.primary || '#FFC400', transparency: 60 },
      line: { color: theme.primary || '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'evolve_core', animation: 'evolve', delay: 0 });

    // Iterative evolution rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = 0.3 + i * 0.2;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - ringRadius,
        y: centerY - ringRadius,
        w: ringRadius * 2,
        h: ringRadius * 2,
        fill: { color: theme.primary || '#FFC400', transparency: 85 - i * 5 },
        line: { color: theme.primary || '#FFC400', width: 2, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `evolve_ring_${i}`, animation: 'evolve', delay: 0.5 + i * 0.5 });
    }

    return elements;
  }

  renderDefaultAnimation(slide, bounds, theme) {
    const elements = [];
    // Default fade-in
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: theme.primary || '#FFFFFF', transparency: 70 },
      line: { color: theme.primary || '#FFFFFF', width: 1 }
    });
    elements.push({ type: 'rect', name: 'default_animation', animation: 'fade', delay: 0 });
    return elements;
  }

  getAnimationConfig(semanticType) {
    return ANIMATION_TYPES[semanticType];
  }

  getAllAnimations() {
    return ANIMATION_TYPES;
  }

  validateAnimationBehavior(semanticType, animationName) {
    const config = ANIMATION_TYPES[semanticType];
    if (!config) return { valid: false, message: 'No animation config for semantic type' };

    if (config.name !== animationName) {
      return { valid: false, message: `Animation mismatch: expected ${config.name}, got ${animationName}` };
    }

    return { valid: true, animation: config.name, description: config.description };
  }
}

module.exports = {
  SemanticAnimationEngine,
  ANIMATION_TYPES
};
