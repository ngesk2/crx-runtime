// ── TRANSITION ARCHITECTURE SYSTEM ─────────────────────────────────────
// Critical Failure #6: Animation system missing
// Authority=slow emergence, Workers=rapid movement, Replay=orbital reveal, Knowledge=network expansion, Pipeline=tracing animation

const TRANSITION_TYPES = {
  SLOW_EMERGENCE: 'slow_emergence',
  RAPID_MOVEMENT: 'rapid_movement',
  ORBITAL_REVEAL: 'orbital_reveal',
  NETWORK_EXPANSION: 'network_expansion',
  TRACING_ANIMATION: 'tracing_animation'
};

const SEMANTIC_TRANSITIONS = {
  AUTHORITY: {
    type: TRANSITION_TYPES.SLOW_EMERGENCE,
    duration: 2.0,
    characteristics: {
      fade_in: true,
      scale_up: true,
      glow_increase: true,
      sequential_layers: true
    }
  },
  WORKER: {
    type: TRANSITION_TYPES.RAPID_MOVEMENT,
    duration: 0.5,
    characteristics: {
      slide_in: true,
      bounce: true,
      rapid_appearance: true,
      simultaneous: true
    }
  },
  REPLAY: {
    type: TRANSITION_TYPES.ORBITAL_REVEAL,
    duration: 1.5,
    characteristics: {
      rotate_in: true,
      spiral_reveal: true,
      concentric_expansion: true,
      orbital_motion: true
    }
  },
  KNOWLEDGE: {
    type: TRANSITION_TYPES.NETWORK_EXPANSION,
    duration: 1.0,
    characteristics: {
      node_appear: true,
      connection_draw: true,
      sequential_growth: true,
      network_spread: true
    }
  },
  PIPELINE: {
    type: TRANSITION_TYPES.TRACING_ANIMATION,
    duration: 1.2,
    characteristics: {
      path_trace: true,
      flow_animation: true,
      sequential_stages: true,
      directional_flow: true
    }
  },
  PROJECTION: {
    type: TRANSITION_TYPES.SLOW_EMERGENCE,
    duration: 1.8,
    characteristics: {
      fade_in: true,
      hologram_effect: true,
      scan_lines: true,
      pulse_effect: true
    }
  },
  EVIDENCE: {
    type: TRANSITION_TYPES.RAPID_MOVEMENT,
    duration: 0.4,
    characteristics: {
      pop_in: true,
      scale_bounce: true,
      highlight_effect: true,
      simultaneous: true
    }
  },
  FLOW: {
    type: TRANSITION_TYPES.TRACING_ANIMATION,
    duration: 0.8,
    characteristics: {
      stream_flow: true,
      gradient_animation: true,
      directional_motion: true,
      continuous_flow: true
    }
  }
};

class TransitionArchitectureEngine {
  constructor(pres) {
    this.pres = pres;
    this.transitionHistory = new Map();
  }

  applyTransition(slide, object, semanticType, options = {}) {
    const transition = SEMANTIC_TRANSITIONS[semanticType];
    if (!transition) return;

    switch (transition.type) {
      case TRANSITION_TYPES.SLOW_EMERGENCE:
        return this.applySlowEmergence(slide, object, transition, options);
      case TRANSITION_TYPES.RAPID_MOVEMENT:
        return this.applyRapidMovement(slide, object, transition, options);
      case TRANSITION_TYPES.ORBITAL_REVEAL:
        return this.applyOrbitalReveal(slide, object, transition, options);
      case TRANSITION_TYPES.NETWORK_EXPANSION:
        return this.applyNetworkExpansion(slide, object, transition, options);
      case TRANSITION_TYPES.TRACING_ANIMATION:
        return this.applyTracingAnimation(slide, object, transition, options);
      default:
        return null;
    }
  }

  applySlowEmergence(slide, object, transition, options) {
    const elements = [];
    const { x, y, w, h } = object;

    // Fade in effect (multiple transparency layers)
    const layerCount = 5;
    for (let i = 0; i < layerCount; i++) {
      const transparency = 100 - (i * 20);
      const scale = 0.6 + (i * 0.08);
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: x + (w * (1 - scale)) / 2,
        y: y + (h * (1 - scale)) / 2,
        w: w * scale,
        h: h * scale,
        fill: { color: options.fill || '#FFC400', transparency: transparency },
        line: { color: options.line || '#FFC400', width: 2 }
      });
      elements.push({ type: 'rect', name: `emergence_layer_${i}` });
    }

    // Sequential layers for authority objects
    if (transition.characteristics.sequential_layers) {
      const authorityLayers = 3;
      for (let i = 0; i < authorityLayers; i++) {
        const layerY = y + (h * 0.2) + (i * h * 0.25);
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: layerY,
          w: w,
          h: 0,
          line: { color: options.line || '#FFC400', width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: `authority_layer_${i}` });
      }
    }

    // Glow increase effect
    if (transition.characteristics.glow_increase) {
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: x - 0.1,
        y: y - 0.1,
        w: w + 0.2,
        h: h + 0.2,
        fill: { color: options.fill || '#FFC400', transparency: 90 },
        line: { color: options.line || '#FFC400', width: 1 }
      });
      elements.push({ type: 'ellipse', name: 'emergence_glow' });
    }

    return { transitionType: 'slow_emergence', elements };
  }

  applyRapidMovement(slide, object, transition, options) {
    const elements = [];
    const { x, y, w, h } = object;

    // Slide in effect (motion blur representation)
    const blurCount = 3;
    for (let i = 0; i < blurCount; i++) {
      const offsetX = (i + 1) * -0.15;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: x + offsetX,
        y: y,
        w: w,
        h: h,
        fill: { color: options.fill || '#00FF00', transparency: 70 + i * 10 },
        line: { color: options.line || '#00FF00', width: 1 }
      });
      elements.push({ type: 'rect', name: `motion_blur_${i}` });
    }

    // Main object
    slide.addShape(this.pres.ShapeType.rect, {
      x: x,
      y: y,
      w: w,
      h: h,
      fill: { color: options.fill || '#00FF00', transparency: 60 },
      line: { color: options.line || '#00FF00', width: 2 }
    });
    elements.push({ type: 'rect', name: 'rapid_main' });

    // Bounce effect (scale variation)
    if (transition.characteristics.bounce) {
      const bounceScale = 1.1;
      slide.addShape(this.pres.ShapeType.rect, {
        x: x - (w * (bounceScale - 1)) / 2,
        y: y - (h * (bounceScale - 1)) / 2,
        w: w * bounceScale,
        h: h * bounceScale,
        fill: { color: options.fill || '#00FF00', transparency: 85 },
        line: { color: options.line || '#00FF00', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'rect', name: 'bounce_outline' });
    }

    return { transitionType: 'rapid_movement', elements };
  }

  applyOrbitalReveal(slide, object, transition, options) {
    const elements = [];
    const { x, y, w, h } = object;
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    // Orbital rings
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const radius = (Math.min(w, h) / 2) * (0.3 + i * 0.2);
      const rotation = i * 15;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - radius,
        y: centerY - radius,
        w: radius * 2,
        h: radius * 2,
        fill: { color: options.fill || '#C0C0C0', transparency: 80 + i * 5 },
        line: { color: options.line || '#C0C0C0', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `orbital_ring_${i}` });
    }

    // Spiral reveal effect
    const spiralPoints = 8;
    for (let i = 0; i < spiralPoints; i++) {
      const angle = (i / spiralPoints) * Math.PI * 2;
      const radius = (Math.min(w, h) / 2) * (0.2 + (i / spiralPoints) * 0.6);
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: px - 0.05,
        y: py - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: options.fill || '#C0C0C0', transparency: 60 },
        line: { color: options.line || '#C0C0C0', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `spiral_point_${i}` });
    }

    // Main object at center
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - w * 0.3,
      y: centerY - h * 0.3,
      w: w * 0.6,
      h: h * 0.6,
      fill: { color: options.fill || '#C0C0C0', transparency: 60 },
      line: { color: options.line || '#C0C0C0', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'orbital_center' });

    return { transitionType: 'orbital_reveal', elements };
  }

  applyNetworkExpansion(slide, object, transition, options) {
    const elements = [];
    const { x, y, w, h } = object;
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    // Central node
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.15,
      y: centerY - 0.15,
      w: 0.3,
      h: 0.3,
      fill: { color: options.fill || '#FF00FF', transparency: 60 },
      line: { color: options.line || '#FF00FF', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'network_center' });

    // Expanding nodes
    const nodeCount = 6;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const distance = Math.min(w, h) * 0.3;
      const nx = centerX + Math.cos(angle) * distance;
      const ny = centerY + Math.sin(angle) * distance;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: nx - 0.08,
        y: ny - 0.08,
        w: 0.16,
        h: 0.16,
        fill: { color: options.fill || '#FF00FF', transparency: 70 },
        line: { color: options.line || '#FF00FF', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `network_node_${i}` });

      // Connection line
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: nx - centerX,
        h: ny - centerY,
        line: { color: options.line || '#FF00FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `network_connection_${i}` });
    }

    // Secondary expansion
    const secondaryCount = 4;
    for (let i = 0; i < secondaryCount; i++) {
      const angle = (i / secondaryCount) * Math.PI * 2 + Math.PI / 4;
      const distance = Math.min(w, h) * 0.5;
      const sx = centerX + Math.cos(angle) * distance;
      const sy = centerY + Math.sin(angle) * distance;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: sx - 0.05,
        y: sy - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: options.fill || '#FF00FF', transparency: 80 },
        line: { color: options.line || '#FF00FF', width: 0.5 }
      });
      elements.push({ type: 'ellipse', name: `network_secondary_${i}` });
    }

    return { transitionType: 'network_expansion', elements };
  }

  applyTracingAnimation(slide, object, transition, options) {
    const elements = [];
    const { x, y, w, h } = object;

    // Path trace effect
    const segmentCount = 8;
    const segmentWidth = w / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      const sx = x + i * segmentWidth;
      const sy = y + h / 2;
      const opacity = 0.3 + (i / segmentCount) * 0.7;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: sx,
        y: sy,
        w: segmentWidth,
        h: 0,
        line: { color: options.line || '#00E5FF', width: 2 }
      });
      elements.push({ type: 'line', name: `trace_segment_${i}` });

      // Arrow head at end
      if (i === segmentCount - 1) {
        slide.addShape(this.pres.ShapeType.triangle, {
          x: sx + segmentWidth - 0.1,
          y: sy - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: options.fill || '#00E5FF', transparency: 60 },
          line: { color: options.line || '#00E5FF', width: 1 }
        });
        elements.push({ type: 'triangle', name: 'trace_arrow' });
      }
    }

    // Flow animation (gradient effect)
    if (transition.characteristics.flow_animation) {
      const flowCount = 3;
      for (let i = 0; i < flowCount; i++) {
        const offset = (i - 1) * 0.05;
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: sy + offset,
          w: w,
          h: 0,
          line: { color: options.line || '#00E5FF', width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: `flow_line_${i}` });
      }
    }

    // Sequential stages indicators
    if (transition.characteristics.sequential_stages) {
      const stageCount = 4;
      const stageSpacing = w / stageCount;
      
      for (let i = 0; i < stageCount; i++) {
        const stageX = x + i * stageSpacing + stageSpacing / 2;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: stageX - 0.05,
          y: sy - 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: options.fill || '#00E5FF', transparency: 70 },
          line: { color: options.line || '#00E5FF', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `stage_indicator_${i}` });
      }
    }

    return { transitionType: 'tracing_animation', elements };
  }

  getTransitionForSemantic(semanticType) {
    return SEMANTIC_TRANSITIONS[semanticType];
  }

  getAllTransitions() {
    return SEMANTIC_TRANSITIONS;
  }
}

module.exports = {
  TransitionArchitectureEngine,
  TRANSITION_TYPES,
  SEMANTIC_TRANSITIONS
};
