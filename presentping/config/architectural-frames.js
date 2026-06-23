// ── ARCHITECTURAL FRAMES SYSTEM ───────────────────────────────────────
// V14: Remove translucent box culture
// Replace with: architectural frames, glow systems, line work, connectors, callouts, environmental structures
// Text should frequently sit directly on the environment

const FRAME_STYLES = {
  ARCHITECTURAL: {
    name: 'Architectural Frame',
    characteristics: ['solid_lines', 'corner_brackets', 'structural_appearance'],
    lineStyle: { width: 2, dashType: 'solid' },
    fillStyle: { transparency: 95 }
  },
  GLOW: {
    name: 'Glow System',
    characteristics: ['soft_edges', 'light_emission', 'atmospheric'],
    lineStyle: { width: 1, dashType: 'solid' },
    fillStyle: { transparency: 85 }
  },
  LINE_WORK: {
    name: 'Line Work',
    characteristics: ['thin_lines', 'geometric_patterns', 'technical_appearance'],
    lineStyle: { width: 0.5, dashType: 'dash' },
    fillStyle: { transparency: 100 }
  },
  CONNECTOR: {
    name: 'Connector',
    characteristics: ['relationship_lines', 'arrows', 'flow_indicators'],
    lineStyle: { width: 1.5, dashType: 'solid' },
    fillStyle: { transparency: 100 }
  },
  CALLOUT: {
    name: 'Callout',
    characteristics: ['pointers', 'annotations', 'informational'],
    lineStyle: { width: 1, dashType: 'solid' },
    fillStyle: { transparency: 90 }
  },
  ENVIRONMENTAL: {
    name: 'Environmental Structure',
    characteristics: ['background', 'atmospheric', 'subtle', 'ambient'],
    lineStyle: { width: 0.5, dashType: 'dash' },
    fillStyle: { transparency: 95 }
  }
};

class ArchitecturalFramesEngine {
  constructor(pres) {
    this.pres = pres;
    this.frameHistory = new Map();
  }

  renderArchitecturalFrame(slide, bounds, theme, style = 'ARCHITECTURAL') {
    const elements = [];
    const frameStyle = FRAME_STYLES[style];

    // Main frame (architectural, not transparent box)
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: '#1A1A1F', transparency: frameStyle.fillStyle.transparency },
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
    });
    elements.push({ type: 'rect', name: 'architectural_frame_main', style });

    // Corner brackets (architectural detail)
    const bracketSize = 0.2;
    const lineLength = 0.4;

    // Top-left bracket
    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x,
      y: bounds.y,
      w: lineLength,
      h: 0,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_tl_h', style });

    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x,
      y: bounds.y,
      w: 0,
      h: lineLength,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_tl_v', style });

    // Top-right bracket
    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x + bounds.w - lineLength,
      y: bounds.y,
      w: lineLength,
      h: 0,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_tr_h', style });

    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x + bounds.w,
      y: bounds.y,
      w: 0,
      h: lineLength,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_tr_v', style });

    // Bottom-left bracket
    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x,
      y: bounds.y + bounds.h - lineLength,
      w: lineLength,
      h: 0,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_bl_h', style });

    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x,
      y: bounds.y + bounds.h,
      w: 0,
      h: -lineLength,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_bl_v', style });

    // Bottom-right bracket
    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x + bounds.w - lineLength,
      y: bounds.y + bounds.h,
      w: lineLength,
      h: 0,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_br_h', style });

    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x + bounds.w,
      y: bounds.y + bounds.h - lineLength,
      w: 0,
      h: lineLength,
      line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
    });
    elements.push({ type: 'line', name: 'architectural_bracket_br_v', style });

    this.frameHistory.set(bounds, { style, theme });
    return elements;
  }

  renderGlowSystem(slide, bounds, theme, intensity = 0.7) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Outer glow
    const glowRadius = Math.max(bounds.w, bounds.h) * 0.6;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - glowRadius,
      y: centerY - glowRadius,
      w: glowRadius * 2,
      h: glowRadius * 2,
      fill: { color: theme.primary || '#00E5FF', transparency: 100 - intensity * 30 },
      line: { color: theme.primary || '#00E5FF', width: 1 }
    });
    elements.push({ type: 'ellipse', name: 'glow_outer', style: 'GLOW' });

    // Inner glow
    const innerGlowRadius = glowRadius * 0.6;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - innerGlowRadius,
      y: centerY - innerGlowRadius,
      w: innerGlowRadius * 2,
      h: innerGlowRadius * 2,
      fill: { color: theme.primary || '#00E5FF', transparency: 100 - intensity * 20 },
      line: { color: theme.primary || '#00E5FF', width: 0.5 }
    });
    elements.push({ type: 'ellipse', name: 'glow_inner', style: 'GLOW' });

    return elements;
  }

  renderLineWork(slide, bounds, theme, pattern = 'grid') {
    const elements = [];
    const frameStyle = FRAME_STYLES.LINE_WORK;

    switch (pattern) {
      case 'grid':
        const gridSize = 0.3;
        const gridCols = Math.floor(bounds.w / gridSize);
        const gridRows = Math.floor(bounds.h / gridSize);

        for (let i = 0; i <= gridCols; i++) {
          slide.addShape(this.pres.ShapeType.line, {
            x: bounds.x + i * gridSize,
            y: bounds.y,
            w: 0,
            h: bounds.h,
            line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
          });
          elements.push({ type: 'line', name: `linework_grid_v_${i}`, style: 'LINE_WORK' });
        }

        for (let i = 0; i <= gridRows; i++) {
          slide.addShape(this.pres.ShapeType.line, {
            x: bounds.x,
            y: bounds.y + i * gridSize,
            w: bounds.w,
            h: 0,
            line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
          });
          elements.push({ type: 'line', name: `linework_grid_h_${i}`, style: 'LINE_WORK' });
        }
        break;

      case 'diagonal':
        const diagonalSpacing = 0.4;
        const diagonalCount = Math.floor((bounds.w + bounds.h) / diagonalSpacing);

        for (let i = -diagonalCount; i <= diagonalCount; i++) {
          const x1 = bounds.x + i * diagonalSpacing;
          const y1 = bounds.y;
          const x2 = bounds.x + i * diagonalSpacing + bounds.h;
          const y2 = bounds.y + bounds.h;

          if (x1 >= bounds.x - bounds.h && x1 <= bounds.x + bounds.w) {
            slide.addShape(this.pres.ShapeType.line, {
              x: Math.max(bounds.x, Math.min(x1, bounds.x + bounds.w)),
              y: bounds.y,
              w: Math.min(x2, bounds.x + bounds.w) - Math.max(x1, bounds.x),
              h: bounds.h,
              line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
            });
            elements.push({ type: 'line', name: `linework_diagonal_${i}`, style: 'LINE_WORK' });
          }
        }
        break;

      case 'circular':
        const centerX = bounds.x + bounds.w / 2;
        const centerY = bounds.y + bounds.h / 2;
        const circleCount = 3;
        const maxRadius = Math.min(bounds.w, bounds.h) * 0.4;

        for (let i = 1; i <= circleCount; i++) {
          const radius = maxRadius * (i / circleCount);
          slide.addShape(this.pres.ShapeType.ellipse, {
            x: centerX - radius,
            y: centerY - radius,
            w: radius * 2,
            h: radius * 2,
            fill: { color: '#1A1A1F', transparency: 100 },
            line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
          });
          elements.push({ type: 'ellipse', name: `linework_circle_${i}`, style: 'LINE_WORK' });
        }
        break;
    }

    return elements;
  }

  renderConnector(slide, fromBounds, toBounds, theme, style = 'straight') {
    const elements = [];
    const frameStyle = FRAME_STYLES.CONNECTOR;

    const fromCenterX = fromBounds.x + fromBounds.w / 2;
    const fromCenterY = fromBounds.y + fromBounds.h / 2;
    const toCenterX = toBounds.x + toBounds.w / 2;
    const toCenterY = toBounds.y + toBounds.h / 2;

    switch (style) {
      case 'straight':
        slide.addShape(this.pres.ShapeType.line, {
          x: fromCenterX,
          y: fromCenterY,
          w: toCenterX - fromCenterX,
          h: toCenterY - fromCenterY,
          line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
        });
        elements.push({ type: 'line', name: 'connector_straight', style: 'CONNECTOR' });
        break;

      case 'elbow':
        const midX = (fromCenterX + toCenterX) / 2;
        slide.addShape(this.pres.ShapeType.line, {
          x: fromCenterX,
          y: fromCenterY,
          w: midX - fromCenterX,
          h: 0,
          line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
        });
        elements.push({ type: 'line', name: 'connector_elbow_1', style: 'CONNECTOR' });

        slide.addShape(this.pres.ShapeType.line, {
          x: midX,
          y: fromCenterY,
          w: 0,
          h: toCenterY - fromCenterY,
          line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
        });
        elements.push({ type: 'line', name: 'connector_elbow_2', style: 'CONNECTOR' });

        slide.addShape(this.pres.ShapeType.line, {
          x: midX,
          y: toCenterY,
          w: toCenterX - midX,
          h: 0,
          line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
        });
        elements.push({ type: 'line', name: 'connector_elbow_3', style: 'CONNECTOR' });
        break;

      case 'curved':
        // Approximate curve with line segments
        const segments = 10;
        for (let i = 0; i < segments; i++) {
          const t = i / segments;
          const nextT = (i + 1) / segments;
          const x1 = fromCenterX + (toCenterX - fromCenterX) * t;
          const y1 = fromCenterY + (toCenterY - fromCenterY) * t + Math.sin(t * Math.PI) * 0.5;
          const x2 = fromCenterX + (toCenterX - fromCenterX) * nextT;
          const y2 = fromCenterY + (toCenterY - fromCenterY) * nextT + Math.sin(nextT * Math.PI) * 0.5;

          slide.addShape(this.pres.ShapeType.line, {
            x: x1,
            y: y1,
            w: x2 - x1,
            h: y2 - y1,
            line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width }
          });
          elements.push({ type: 'line', name: `connector_curve_${i}`, style: 'CONNECTOR' });
        }
        break;
    }

    // Arrow head
    const arrowSize = 0.1;
    const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX);
    slide.addShape(this.pres.ShapeType.triangle, {
      x: toCenterX - arrowSize / 2 - Math.cos(angle) * 0.15,
      y: toCenterY - arrowSize / 2 - Math.sin(angle) * 0.15,
      w: arrowSize,
      h: arrowSize,
      fill: { color: theme.primary || '#00E5FF', transparency: 70 },
      line: { color: theme.primary || '#00E5FF', width: 1 }
    });
    elements.push({ type: 'triangle', name: 'connector_arrow', style: 'CONNECTOR' });

    return elements;
  }

  renderEnvironmentalStructure(slide, bounds, theme, type = 'atmosphere') {
    const elements = [];
    const frameStyle = FRAME_STYLES.ENVIRONMENTAL;

    switch (type) {
      case 'atmosphere':
        // Subtle atmospheric gradient (simulated with multiple ellipses)
        const centerX = bounds.x + bounds.w / 2;
        const centerY = bounds.y + bounds.h / 2;
        const atmosphereCount = 3;

        for (let i = 0; i < atmosphereCount; i++) {
          const radius = Math.min(bounds.w, bounds.h) * 0.4 * (1 + i * 0.2);
          slide.addShape(this.pres.ShapeType.ellipse, {
            x: centerX - radius,
            y: centerY - radius,
            w: radius * 2,
            h: radius * 2,
            fill: { color: theme.primary || '#00E5FF', transparency: 95 - i * 3 },
            line: { color: theme.primary || '#00E5FF', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
          });
          elements.push({ type: 'ellipse', name: `environmental_atmosphere_${i}`, style: 'ENVIRONMENTAL' });
        }
        break;

      case 'particles':
        // Ambient particles
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
          const px = bounds.x + Math.random() * bounds.w;
          const py = bounds.y + Math.random() * bounds.h;
          const size = 0.02 + Math.random() * 0.03;

          slide.addShape(this.pres.ShapeType.ellipse, {
            x: px - size,
            y: py - size,
            w: size * 2,
            h: size * 2,
            fill: { color: theme.primary || '#00E5FF', transparency: 90 },
            line: { color: theme.primary || '#00E5FF', width: 0.5 }
          });
          elements.push({ type: 'ellipse', name: `environmental_particle_${i}`, style: 'ENVIRONMENTAL' });
        }
        break;

      case 'grid_background':
        // Background grid
        const gridSize = 0.5;
        const gridCols = Math.floor(bounds.w / gridSize);
        const gridRows = Math.floor(bounds.h / gridSize);

        for (let i = 0; i <= gridCols; i++) {
          slide.addShape(this.pres.ShapeType.line, {
            x: bounds.x + i * gridSize,
            y: bounds.y,
            w: 0,
            h: bounds.h,
            line: { color: '#333333', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
          });
          elements.push({ type: 'line', name: `environmental_grid_v_${i}`, style: 'ENVIRONMENTAL' });
        }

        for (let i = 0; i <= gridRows; i++) {
          slide.addShape(this.pres.ShapeType.line, {
            x: bounds.x,
            y: bounds.y + i * gridSize,
            w: bounds.w,
            h: 0,
            line: { color: '#333333', width: frameStyle.lineStyle.width, dashType: frameStyle.lineStyle.dashType }
          });
          elements.push({ type: 'line', name: `environmental_grid_h_${i}`, style: 'ENVIRONMENTAL' });
        }
        break;
    }

    return elements;
  }

  renderTextOnEnvironment(slide, text, bounds, theme) {
    const elements = [];

    // Text sits directly on environment (no background box)
    slide.addText(text, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fontSize: 10,
      color: '#FFFFFF',
      align: 'center',
      valign: 'middle'
    });
    elements.push({ type: 'text', name: 'text_on_environment', isDirect: true });

    return elements;
  }

  validateNoTranslucentBoxes(objects) {
    const violations = [];

    objects.forEach(obj => {
      if (obj.type === 'rect' && obj.fill && obj.fill.transparency > 70 && obj.fill.transparency < 95) {
        violations.push({ object: obj.name, transparency: obj.fill.transparency });
      }
    });

    return { valid: violations.length === 0, violations };
  }

  getFrameStyle(styleName) {
    return FRAME_STYLES[styleName];
  }

  getAllFrameStyles() {
    return FRAME_STYLES;
  }
}

module.exports = {
  ArchitecturalFramesEngine,
  FRAME_STYLES
};
