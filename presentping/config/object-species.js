// ── OBJECT SPECIES SYSTEM ─────────────────────────────────────────────
// Critical Failure #3: Concept cards make everything look the same
// Different object species with unique geometry

const OBJECT_SPECIES = {
  AUTHORITY: {
    name: 'Monument',
    geometry: 'monument',
    baseShape: 'hexagon',
    visualCharacteristics: {
      solid: true,
      grounded: true,
      symmetrical: true,
      prominent: true
    },
    renderingHints: {
      useHexagon: true,
      addBase: true,
      addCrown: true,
      addPillars: true,
      weight: 'heavy'
    }
  },
  GATEWAY: {
    name: 'Portal',
    geometry: 'portal',
    baseShape: 'arch',
    visualCharacteristics: {
      solid: false,
      grounded: true,
      symmetrical: true,
      prominent: true
    },
    renderingHints: {
      useArch: true,
      addFrame: true,
      addGlow: true,
      addDepth: true,
      weight: 'medium'
    }
  },
  EVENT_LOG: {
    name: 'Foundation',
    geometry: 'foundation',
    baseShape: 'rectangle',
    visualCharacteristics: {
      solid: true,
      grounded: true,
      symmetrical: true,
      prominent: false
    },
    renderingHints: {
      useRectangle: true,
      addLayers: true,
      addTexture: true,
      addDepth: true,
      weight: 'heavy'
    }
  },
  WORKER: {
    name: 'Machine',
    geometry: 'machine',
    baseShape: 'complex',
    visualCharacteristics: {
      solid: true,
      grounded: false,
      symmetrical: false,
      prominent: false
    },
    renderingHints: {
      useComplex: true,
      addGears: true,
      addConnectors: true,
      addMotion: true,
      weight: 'medium'
    }
  },
  PROJECTION: {
    name: 'Hologram',
    geometry: 'hologram',
    baseShape: 'ellipse',
    visualCharacteristics: {
      solid: false,
      grounded: false,
      symmetrical: true,
      prominent: false
    },
    renderingHints: {
      useEllipse: true,
      addGlow: true,
      addTransparency: true,
      addPulse: true,
      weight: 'light'
    }
  },
  EVIDENCE: {
    name: 'Artifact',
    geometry: 'artifact',
    baseShape: 'irregular',
    visualCharacteristics: {
      solid: true,
      grounded: false,
      symmetrical: false,
      prominent: false
    },
    renderingHints: {
      useIrregular: true,
      addTexture: true,
      addEdges: true,
      addDetail: true,
      weight: 'light'
    }
  },
  LEGACY: {
    name: 'Relic',
    geometry: 'relic',
    baseShape: 'fragmented',
    visualCharacteristics: {
      solid: true,
      grounded: true,
      symmetrical: false,
      prominent: false
    },
    renderingHints: {
      useFragmented: true,
      addCracks: true,
      addAging: true,
      addShadow: true,
      weight: 'medium'
    }
  },
  FLOW: {
    name: 'Stream',
    geometry: 'stream',
    baseShape: 'path',
    visualCharacteristics: {
      solid: false,
      grounded: false,
      symmetrical: false,
      prominent: false
    },
    renderingHints: {
      usePath: true,
      addDirection: true,
      addGradient: true,
      addMotion: true,
      weight: 'light'
    }
  }
};

class ObjectSpeciesRenderer {
  constructor(pres) {
    this.pres = pres;
  }

  renderSpecies(slide, species, bounds, theme) {
    switch (species) {
      case 'AUTHORITY':
        return this.renderMonument(slide, bounds, theme);
      case 'GATEWAY':
        return this.renderPortal(slide, bounds, theme);
      case 'EVENT_LOG':
        return this.renderFoundation(slide, bounds, theme);
      case 'WORKER':
        return this.renderMachine(slide, bounds, theme);
      case 'PROJECTION':
        return this.renderHologram(slide, bounds, theme);
      case 'EVIDENCE':
        return this.renderArtifact(slide, bounds, theme);
      case 'LEGACY':
        return this.renderRelic(slide, bounds, theme);
      case 'FLOW':
        return this.renderStream(slide, bounds, theme);
      default:
        return this.renderDefault(slide, bounds, theme);
    }
  }

  renderMonument(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Hexagonal monument
    const hexRadius = Math.min(bounds.w, bounds.h) * 0.4;
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      hexPoints.push({
        x: centerX + hexRadius * Math.cos(angle),
        y: centerY + hexRadius * Math.sin(angle)
      });
    }
    
    // Render hexagon using lines (pptxgenjs doesn't have polygon)
    for (let i = 0; i < 6; i++) {
      const next = (i + 1) % 6;
      slide.addShape(this.pres.ShapeType.line, {
        x: hexPoints[i].x,
        y: hexPoints[i].y,
        w: hexPoints[next].x - hexPoints[i].x,
        h: hexPoints[next].y - hexPoints[i].y,
        line: { color: theme.primary || '#FFC400', width: 3 }
      });
      elements.push({ type: 'line', name: `monument_edge_${i}` });
    }
    
    // Add crown (top triangle)
    slide.addShape(this.pres.ShapeType.triangle, {
      x: centerX - hexRadius * 0.3,
      y: centerY - hexRadius - hexRadius * 0.4,
      w: hexRadius * 0.6,
      h: hexRadius * 0.4,
      fill: { color: theme.primary || '#FFC400', transparency: 70 },
      line: { color: theme.primary || '#FFC400', width: 2 }
    });
    elements.push({ type: 'triangle', name: 'monument_crown' });
    
    // Add pillars (vertical lines)
    for (let i = 0; i < 3; i++) {
      const px = centerX - hexRadius * 0.5 + i * hexRadius * 0.5;
      slide.addShape(this.pres.ShapeType.line, {
        x: px,
        y: centerY + hexRadius * 0.3,
        w: 0,
        h: hexRadius * 0.4,
        line: { color: theme.primary || '#FFC400', width: 2 }
      });
      elements.push({ type: 'line', name: `monument_pillar_${i}` });
    }
    
    return elements;
  }

  renderPortal(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Arch frame
    const archWidth = bounds.w * 0.6;
    const archHeight = bounds.h * 0.8;
    
    // Left pillar
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX - archWidth / 2 - 0.1,
      y: centerY - archHeight / 2,
      w: 0.2,
      h: archHeight,
      fill: { color: theme.primary || '#00E5FF', transparency: 60 },
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'rect', name: 'portal_left_pillar' });
    
    // Right pillar
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX + archWidth / 2 - 0.1,
      y: centerY - archHeight / 2,
      w: 0.2,
      h: archHeight,
      fill: { color: theme.primary || '#00E5FF', transparency: 60 },
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'rect', name: 'portal_right_pillar' });
    
    // Top arch (ellipse top half)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - archWidth / 2,
      y: centerY - archHeight / 2 - archWidth * 0.3,
      w: archWidth,
      h: archWidth * 0.6,
      fill: { color: theme.primary || '#00E5FF', transparency: 80 },
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'portal_arch' });
    
    // Inner glow
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - archWidth * 0.3,
      y: centerY - archHeight * 0.3,
      w: archWidth * 0.6,
      h: archHeight * 0.6,
      fill: { color: theme.primary || '#00E5FF', transparency: 90 },
      line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'portal_glow' });
    
    return elements;
  }

  renderFoundation(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Layered foundation rectangles
    const layerCount = 4;
    for (let i = 0; i < layerCount; i++) {
      const layerWidth = bounds.w * (1 - i * 0.15);
      const layerHeight = bounds.h * 0.2;
      const layerY = centerY + bounds.h * 0.3 - i * layerHeight;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: centerX - layerWidth / 2,
        y: layerY,
        w: layerWidth,
        h: layerHeight,
        fill: { color: theme.primary || '#C0C0C0', transparency: 60 + i * 10 },
        line: { color: theme.primary || '#C0C0C0', width: 2 }
      });
      elements.push({ type: 'rect', name: `foundation_layer_${i}` });
    }
    
    // Add texture (grid pattern)
    const gridSize = 0.15;
    const gridCols = Math.floor(bounds.w / gridSize);
    const gridRows = Math.floor(bounds.h * 0.5 / gridSize);
    
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        if ((x + y) % 2 === 0) {
          slide.addShape(this.pres.ShapeType.rect, {
            x: bounds.x + x * gridSize,
            y: centerY + bounds.h * 0.3 + y * gridSize,
            w: gridSize,
            h: gridSize,
            fill: { color: theme.primary || '#C0C0C0', transparency: 85 },
            line: { color: theme.primary || '#C0C0C0', width: 0.5 }
          });
          elements.push({ type: 'rect', name: `foundation_texture_${x}_${y}` });
        }
      }
    }
    
    return elements;
  }

  renderMachine(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Central gear
    const gearRadius = Math.min(bounds.w, bounds.h) * 0.25;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - gearRadius,
      y: centerY - gearRadius,
      w: gearRadius * 2,
      h: gearRadius * 2,
      fill: { color: theme.primary || '#00FF00', transparency: 60 },
      line: { color: theme.primary || '#00FF00', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'machine_central_gear' });
    
    // Gear teeth (small rectangles around circle)
    const toothCount = 8;
    for (let i = 0; i < toothCount; i++) {
      const angle = (i / toothCount) * Math.PI * 2;
      const tx = centerX + gearRadius * Math.cos(angle);
      const ty = centerY + gearRadius * Math.sin(angle);
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: tx - 0.05,
        y: ty - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: theme.primary || '#00FF00', transparency: 60 },
        line: { color: theme.primary || '#00FF00', width: 1 }
      });
      elements.push({ type: 'rect', name: `machine_tooth_${i}` });
    }
    
    // Connecting arms
    const armCount = 3;
    for (let i = 0; i < armCount; i++) {
      const angle = (i / armCount) * Math.PI * 2;
      const armLength = gearRadius * 0.8;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: Math.cos(angle) * armLength,
        h: Math.sin(angle) * armLength,
        line: { color: theme.primary || '#00FF00', width: 2 }
      });
      elements.push({ type: 'line', name: `machine_arm_${i}` });
    }
    
    // Small satellite gears
    const satelliteCount = 2;
    for (let i = 0; i < satelliteCount; i++) {
      const sx = centerX + bounds.w * 0.35 * (i === 0 ? -1 : 1);
      const sy = centerY + bounds.h * 0.2;
      const sr = gearRadius * 0.4;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: sx - sr,
        y: sy - sr,
        w: sr * 2,
        h: sr * 2,
        fill: { color: theme.primary || '#00FF00', transparency: 70 },
        line: { color: theme.primary || '#00FF00', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `machine_satellite_${i}` });
    }
    
    return elements;
  }

  renderHologram(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Main hologram ellipse
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
    elements.push({ type: 'ellipse', name: 'hologram_main' });
    
    // Inner glow ellipse
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - holoWidth * 0.3,
      y: centerY - holoHeight * 0.3,
      w: holoWidth * 0.6,
      h: holoHeight * 0.6,
      fill: { color: theme.primary || '#00E5FF', transparency: 90 },
      line: { color: theme.primary || '#00E5FF', width: 1 }
    });
    elements.push({ type: 'ellipse', name: 'hologram_inner' });
    
    // Scan lines (horizontal)
    const scanCount = 5;
    for (let i = 0; i < scanCount; i++) {
      const sy = centerY - holoHeight / 2 + (i + 1) * (holoHeight / (scanCount + 1));
      
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX - holoWidth / 2,
        y: sy,
        w: holoWidth,
        h: 0,
        line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `hologram_scan_${i}` });
    }
    
    // Pulse rings
    const pulseCount = 2;
    for (let i = 0; i < pulseCount; i++) {
      const pulseRadius = holoWidth * 0.4 * (1 + i * 0.3);
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - pulseRadius,
        y: centerY - pulseRadius,
        w: pulseRadius * 2,
        h: pulseRadius * 2,
        fill: { color: theme.primary || '#00E5FF', transparency: 95 },
        line: { color: theme.primary || '#00E5FF', width: 0.5, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `hologram_pulse_${i}` });
    }
    
    return elements;
  }

  renderArtifact(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Irregular polygon (artifact shape)
    const points = [
      { x: centerX - bounds.w * 0.3, y: centerY - bounds.h * 0.3 },
      { x: centerX + bounds.w * 0.2, y: centerY - bounds.h * 0.4 },
      { x: centerX + bounds.w * 0.35, y: centerY - bounds.h * 0.1 },
      { x: centerX + bounds.w * 0.3, y: centerY + bounds.h * 0.3 },
      { x: centerX - bounds.w * 0.1, y: centerY + bounds.h * 0.35 },
      { x: centerX - bounds.w * 0.35, y: centerY + bounds.h * 0.1 }
    ];
    
    // Draw polygon edges
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length;
      slide.addShape(this.pres.ShapeType.line, {
        x: points[i].x,
        y: points[i].y,
        w: points[next].x - points[i].x,
        h: points[next].y - points[i].y,
        line: { color: theme.primary || '#FFFFFF', width: 2 }
      });
      elements.push({ type: 'line', name: `artifact_edge_${i}` });
    }
    
    // Add texture (small dots)
    const dotCount = 6;
    for (let i = 0; i < dotCount; i++) {
      const dx = centerX + (Math.random() - 0.5) * bounds.w * 0.4;
      const dy = centerY + (Math.random() - 0.5) * bounds.h * 0.4;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: dx - 0.03,
        y: dy - 0.03,
        w: 0.06,
        h: 0.06,
        fill: { color: theme.primary || '#FFFFFF', transparency: 70 },
        line: { color: theme.primary || '#FFFFFF', width: 0.5 }
      });
      elements.push({ type: 'ellipse', name: `artifact_dot_${i}` });
    }
    
    // Add edge highlights
    const highlightCount = 3;
    for (let i = 0; i < highlightCount; i++) {
      const hx = points[i].x;
      const hy = points[i].y;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: hx - 0.05,
        y: hy - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: theme.primary || '#FFFFFF', transparency: 50 },
        line: { color: theme.primary || '#FFFFFF', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `artifact_highlight_${i}` });
    }
    
    return elements;
  }

  renderRelic(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Fragmented rectangle (relic)
    const fragments = [
      { x: centerX - bounds.w * 0.3, y: centerY - bounds.h * 0.3, w: bounds.w * 0.25, h: bounds.h * 0.25 },
      { x: centerX + bounds.w * 0.05, y: centerY - bounds.h * 0.35, w: bounds.w * 0.3, h: bounds.h * 0.2 },
      { x: centerX - bounds.w * 0.2, y: centerY + bounds.h * 0.05, w: bounds.w * 0.35, h: bounds.h * 0.2 },
      { x: centerX + bounds.w * 0.15, y: centerY + bounds.h * 0.15, w: bounds.w * 0.2, h: bounds.h * 0.25 }
    ];
    
    fragments.forEach((frag, i) => {
      slide.addShape(this.pres.ShapeType.rect, {
        x: frag.x,
        y: frag.y,
        w: frag.w,
        h: frag.h,
        fill: { color: theme.primary || '#FF0000', transparency: 60 },
        line: { color: theme.primary || '#FF0000', width: 2 }
      });
      elements.push({ type: 'rect', name: `relic_fragment_${i}` });
    });
    
    // Add cracks (lines)
    const cracks = [
      { x1: centerX - bounds.w * 0.1, y1: centerY - bounds.h * 0.2, x2: centerX + bounds.w * 0.1, y2: centerY + bounds.h * 0.1 },
      { x1: centerX + bounds.w * 0.15, y1: centerY - bounds.h * 0.1, x2: centerX + bounds.w * 0.25, y2: centerY + bounds.h * 0.2 }
    ];
    
    cracks.forEach((crack, i) => {
      slide.addShape(this.pres.ShapeType.line, {
        x: crack.x1,
        y: crack.y1,
        w: crack.x2 - crack.x1,
        h: crack.y2 - crack.y1,
        line: { color: theme.primary || '#FF0000', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `relic_crack_${i}` });
    });
    
    // Add aging effect (darker edges)
    fragments.forEach((frag, i) => {
      slide.addShape(this.pres.ShapeType.rect, {
        x: frag.x + 0.02,
        y: frag.y + 0.02,
        w: frag.w - 0.04,
        h: frag.h - 0.04,
        fill: { color: theme.primary || '#FF0000', transparency: 80 },
        line: { color: theme.primary || '#FF0000', width: 0.5 }
      });
      elements.push({ type: 'rect', name: `relic_aging_${i}` });
    });
    
    return elements;
  }

  renderStream(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Flow path (curved line using segments)
    const pathPoints = [];
    const segmentCount = 10;
    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const x = bounds.x + bounds.w * t;
      const y = centerY + Math.sin(t * Math.PI * 2) * bounds.h * 0.2;
      pathPoints.push({ x, y });
    }
    
    // Draw path segments
    for (let i = 0; i < pathPoints.length - 1; i++) {
      slide.addShape(this.pres.ShapeType.line, {
        x: pathPoints[i].x,
        y: pathPoints[i].y,
        w: pathPoints[i + 1].x - pathPoints[i].x,
        h: pathPoints[i + 1].y - pathPoints[i].y,
        line: { color: theme.primary || '#00E5FF', width: 2 }
      });
      elements.push({ type: 'line', name: `stream_segment_${i}` });
    }
    
    // Add direction arrows
    const arrowCount = 3;
    for (let i = 0; i < arrowCount; i++) {
      const idx = Math.floor((i + 1) * (pathPoints.length - 1) / (arrowCount + 1));
      const ax = pathPoints[idx].x;
      const ay = pathPoints[idx].y;
      
      slide.addShape(this.pres.ShapeType.triangle, {
        x: ax - 0.08,
        y: ay - 0.08,
        w: 0.16,
        h: 0.16,
        fill: { color: theme.primary || '#00E5FF', transparency: 60 },
        line: { color: theme.primary || '#00E5FF', width: 1 }
      });
      elements.push({ type: 'triangle', name: `stream_arrow_${i}` });
    }
    
    // Add gradient effect (multiple parallel lines)
    const gradientCount = 3;
    for (let i = 0; i < gradientCount; i++) {
      const offset = (i - 1) * 0.05;
      for (let j = 0; j < pathPoints.length - 1; j++) {
        slide.addShape(this.pres.ShapeType.line, {
          x: pathPoints[j].x,
          y: pathPoints[j].y + offset,
          w: pathPoints[j + 1].x - pathPoints[j].x,
          h: pathPoints[j + 1].y - pathPoints[j].y,
          line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: `stream_gradient_${i}_${j}` });
      }
    }
    
    return elements;
  }

  renderDefault(slide, bounds, theme) {
    const elements = [];
    
    // Default rectangle
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: theme.primary || '#FFFFFF', transparency: 70 },
      line: { color: theme.primary || '#FFFFFF', width: 2 }
    });
    elements.push({ type: 'rect', name: 'default_shape' });
    
    return elements;
  }
}

module.exports = {
  OBJECT_SPECIES,
  ObjectSpeciesRenderer
};
