// ── PALANTIR-STYLE VISUAL DENSITY ─────────────────────────────────────
// Critical Failure #8: Not enough visual density
// Background systems, labels, callouts, relationship lines, metadata, evidence nodes, mini diagrams, subsystem references

const DENSITY_ELEMENTS = {
  BACKGROUND_SYSTEMS: 'background_systems',
  LABELS: 'labels',
  CALLOUTS: 'callouts',
  RELATIONSHIP_LINES: 'relationship_lines',
  METADATA: 'metadata',
  EVIDENCE_NODES: 'evidence_nodes',
  MINI_DIAGRAMS: 'mini_diagrams',
  SUBSYSTEM_REFERENCES: 'subsystem_references'
};

const DENSITY_TARGETS = {
  MIN_BACKGROUND_SYSTEMS: 3,
  MIN_LABELS: 8,
  MIN_CALLOUTS: 2,
  MIN_RELATIONSHIP_LINES: 5,
  MIN_METADATA: 4,
  MIN_EVIDENCE_NODES: 3,
  MIN_MINI_DIAGRAMS: 2,
  MIN_SUBSYSTEM_REFERENCES: 2
};

class VisualDensityEngine {
  constructor(pres) {
    this.pres = pres;
    this.densityHistory = new Map();
  }

  addDensityLayer(slide, slideNumber, bounds, theme) {
    const elements = [];
    
    // Background systems
    this.addBackgroundSystems(slide, bounds, theme, elements);
    
    // Labels
    this.addSemanticLabels(slide, bounds, theme, elements);
    
    // Callouts
    this.addTechnicalCallouts(slide, bounds, theme, elements);
    
    // Relationship lines
    this.addRelationshipLines(slide, bounds, theme, elements);
    
    // Metadata
    this.addSystemMetadata(slide, bounds, theme, elements);
    
    // Evidence nodes
    this.addEvidenceNodes(slide, bounds, theme, elements);
    
    // Mini diagrams
    this.addMiniDiagrams(slide, bounds, theme, elements);
    
    // Subsystem references
    this.addSubsystemReferences(slide, bounds, theme, elements);
    
    this.densityHistory.set(slideNumber, elements);
    return { slideNumber, elements };
  }

  addBackgroundSystems(slide, bounds, theme, elements) {
    // Grid system
    const gridSize = 0.5;
    const gridCols = Math.floor(bounds.w / gridSize);
    const gridRows = Math.floor(bounds.h / gridSize);
    
    for (let x = 0; x < gridCols; x++) {
      for (let y = 0; y < gridRows; y++) {
        if ((x + y) % 3 === 0) {
          slide.addShape(this.pres.ShapeType.rect, {
            x: bounds.x + x * gridSize,
            y: bounds.y + y * gridSize,
            w: gridSize,
            h: gridSize,
            fill: { color: '#1A1A1F', transparency: 90 },
            line: { color: '#222227', width: 0.5 }
          });
          elements.push({ type: 'rect', name: `grid_${x}_${y}` });
        }
      }
    }

    // Coordinate system
    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x,
      y: bounds.y + bounds.h * 0.5,
      w: bounds.w,
      h: 0,
      line: { color: '#333333', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'line', name: 'coord_horizontal' });

    slide.addShape(this.pres.ShapeType.line, {
      x: bounds.x + bounds.w * 0.5,
      y: bounds.y,
      w: 0,
      h: bounds.h,
      line: { color: '#333333', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'line', name: 'coord_vertical' });

    // Zone markers
    const zones = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER'];
    zones.forEach((zone, index) => {
      const zx = bounds.x + bounds.w * (index % 3 === 0 ? 0.1 : index % 3 === 1 ? 0.5 : 0.9);
      const zy = bounds.y + bounds.h * (index < 3 ? 0.1 : 0.9);
      
      slide.addText(zone, {
        x: zx - 0.2,
        y: zy - 0.1,
        w: 0.4,
        h: 0.15,
        fontSize: 6,
        color: '#444444'
      });
      elements.push({ type: 'text', name: `zone_marker_${zone}` });
    });
  }

  addSemanticLabels(slide, bounds, theme, elements) {
    // Layer labels
    const layers = ['BRAIN', 'KNOWLEDGE', 'EXECUTION', 'CONSTITUTIONAL', 'REPLAY', 'PROJECTION'];
    const layerSpacing = bounds.h / layers.length;
    
    layers.forEach((layer, index) => {
      const y = bounds.y + index * layerSpacing + layerSpacing / 2;
      
      slide.addText(layer, {
        x: bounds.x + 0.1,
        y: y - 0.05,
        w: 0.8,
        h: 0.1,
        fontSize: 7,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `layer_label_${layer}` });
    });

    // Component labels
    const components = ['GATEWAY', 'AUTHORITY', 'EVENT_LOG', 'MCP', 'RAG', 'REPLAY', 'WITNESS', 'PLANE'];
    const compSpacing = bounds.w / components.length;
    
    components.forEach((comp, index) => {
      const x = bounds.x + index * compSpacing + compSpacing / 2;
      
      slide.addText(comp, {
        x: x - 0.2,
        y: bounds.y + bounds.h - 0.2,
        w: 0.4,
        h: 0.1,
        fontSize: 6,
        color: '#555555',
        align: 'center'
      });
      elements.push({ type: 'text', name: `component_label_${comp}` });
    });
  }

  addTechnicalCallouts(slide, bounds, theme, elements) {
    // System status indicators
    const statuses = ['ONLINE', 'COMPLIANT', 'VERIFIED', 'ACTIVE'];
    statuses.forEach((status, index) => {
      const x = bounds.x + bounds.w - 1.5 + index * 0.3;
      const y = bounds.y + 0.3;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: x - 0.05,
        y: y - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `status_indicator_${index}` });
      
      slide.addText(status, {
        x: x + 0.08,
        y: y - 0.05,
        w: 0.4,
        h: 0.1,
        fontSize: 6,
        color: '#00FF00'
      });
      elements.push({ type: 'text', name: `status_text_${index}` });
    });

    // Performance metrics
    const metrics = ['LATENCY: 45ms', 'THROUGHPUT: 1.2K/s', 'ACCURACY: 98.5%', 'UPTIME: 99.9%'];
    metrics.forEach((metric, index) => {
      const x = bounds.x + 0.2;
      const y = bounds.y + bounds.h - 0.5 + index * 0.1;
      
      slide.addText(metric, {
        x: x,
        y: y,
        w: 1.5,
        h: 0.08,
        fontSize: 6,
        color: '#00E5FF',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `metric_${index}` });
    });
  }

  addRelationshipLines(slide, bounds, theme, elements) {
    // Layer connection lines
    const layerY = [bounds.y + bounds.h * 0.2, bounds.y + bounds.h * 0.4, bounds.y + bounds.h * 0.6, bounds.y + bounds.h * 0.8];
    
    for (let i = 0; i < layerY.length - 1; i++) {
      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x + bounds.w * 0.2,
        y: layerY[i],
        w: 0,
        h: layerY[i + 1] - layerY[i],
        line: { color: '#00E5FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `layer_connection_${i}` });
    }

    // Component relationship arrows
    const compX = [bounds.x + bounds.w * 0.3, bounds.x + bounds.w * 0.5, bounds.x + bounds.w * 0.7];
    const compY = bounds.y + bounds.h * 0.5;
    
    for (let i = 0; i < compX.length - 1; i++) {
      slide.addShape(this.pres.ShapeType.line, {
        x: compX[i],
        y: compY,
        w: compX[i + 1] - compX[i],
        h: 0,
        line: { color: '#FFC400', width: 1 }
      });
      elements.push({ type: 'line', name: `component_arrow_${i}` });
      
      slide.addShape(this.pres.ShapeType.triangle, {
        x: compX[i + 1] - 0.08,
        y: compY - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: '#FFC400', transparency: 70 },
        line: { color: '#FFC400', width: 1 }
      });
      elements.push({ type: 'triangle', name: `component_arrow_head_${i}` });
    }
  }

  addSystemMetadata(slide, bounds, theme, elements) {
    // Version info
    slide.addText('PING v2.0.0 | CONSTITUTIONAL AI CIVILIZATION', {
      x: bounds.x + bounds.w - 2,
      y: bounds.y + bounds.h - 0.15,
      w: 1.8,
      h: 0.1,
      fontSize: 6,
      color: '#666666',
      align: 'right'
    });
    elements.push({ type: 'text', name: 'version_info' });

    // Build timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    slide.addText(`BUILT: ${timestamp}`, {
      x: bounds.x + bounds.w - 2,
      y: bounds.y + bounds.h - 0.05,
      w: 1.8,
      h: 0.08,
      fontSize: 5,
      color: '#444444',
      align: 'right'
    });
    elements.push({ type: 'text', name: 'build_timestamp' });

    // System identifiers
    const ids = ['SYS-ID: PING-CORE-001', 'AUTH: CONSTITUTIONAL-V2', 'REPLAY: EVENT-SOURCING'];
    ids.forEach((id, index) => {
      const x = bounds.x + 0.2;
      const y = bounds.y + 0.2 + index * 0.08;
      
      slide.addText(id, {
        x: x,
        y: y,
        w: 2,
        h: 0.07,
        fontSize: 5,
        color: '#444444',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `system_id_${index}` });
    });
  }

  addEvidenceNodes(slide, bounds, theme, elements) {
    // Evidence indicators
    const evidenceTypes = ['FILE', 'IMPORT', 'EXECUTION', 'METRIC'];
    evidenceTypes.forEach((type, index) => {
      const x = bounds.x + bounds.w * 0.15 + index * 0.2;
      const y = bounds.y + bounds.h * 0.85;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: x - 0.08,
        y: y - 0.05,
        w: 0.16,
        h: 0.1,
        fill: { color: '#00E5FF', transparency: 70 },
        line: { color: '#00E5FF', width: 1 }
      });
      elements.push({ type: 'rect', name: `evidence_node_${index}` });
      
      slide.addText(type, {
        x: x - 0.07,
        y: y - 0.04,
        w: 0.14,
        h: 0.08,
        fontSize: 5,
        color: '#FFFFFF',
        align: 'center'
      });
      elements.push({ type: 'text', name: `evidence_text_${index}` });
    });

    // Verification badges
    const badges = ['VERIFIED', 'COMPLIANT', 'AUDITED'];
    badges.forEach((badge, index) => {
      const x = bounds.x + bounds.w * 0.75 + index * 0.15;
      const y = bounds.y + bounds.h * 0.15;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: x - 0.06,
        y: y - 0.04,
        w: 0.12,
        h: 0.08,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `badge_${index}` });
      
      slide.addText(badge, {
        x: x - 0.05,
        y: y - 0.03,
        w: 0.1,
        h: 0.06,
        fontSize: 4,
        color: '#000000',
        align: 'center'
      });
      elements.push({ type: 'text', name: `badge_text_${index}` });
    });
  }

  addMiniDiagrams(slide, bounds, theme, elements) {
    // Mini system architecture diagram
    const miniX = bounds.x + bounds.w * 0.85;
    const miniY = bounds.y + bounds.h * 0.3;
    const miniSize = 0.8;
    
    // Mini container
    slide.addShape(this.pres.ShapeType.rect, {
      x: miniX,
      y: miniY,
      w: miniSize,
      h: miniSize,
      fill: { color: '#1A1A1F', transparency: 80 },
      line: { color: '#333333', width: 1 }
    });
    elements.push({ type: 'rect', name: 'mini_diagram_container' });

    // Mini layers
    const miniLayers = 4;
    const miniLayerHeight = miniSize / miniLayers;
    for (let i = 0; i < miniLayers; i++) {
      slide.addShape(this.pres.ShapeType.rect, {
        x: miniX + 0.05,
        y: miniY + i * miniLayerHeight + 0.05,
        w: miniSize - 0.1,
        h: miniLayerHeight - 0.1,
        fill: { color: '#00E5FF', transparency: 85 + i * 3 },
        line: { color: '#00E5FF', width: 0.5 }
      });
      elements.push({ type: 'rect', name: `mini_layer_${i}` });
    }

    // Mini flow diagram
    const flowX = bounds.x + bounds.w * 0.1;
    const flowY = bounds.y + bounds.h * 0.7;
    const flowNodes = 3;
    const flowSpacing = 0.3;
    
    for (let i = 0; i < flowNodes; i++) {
      const fx = flowX + i * flowSpacing;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: fx - 0.05,
        y: flowY - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: '#FFC400', transparency: 70 },
        line: { color: '#FFC400', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `flow_node_${i}` });
      
      if (i < flowNodes - 1) {
        slide.addShape(this.pres.ShapeType.line, {
          x: fx + 0.05,
          y: flowY,
          w: flowSpacing - 0.1,
          h: 0,
          line: { color: '#FFC400', width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: `flow_connection_${i}` });
      }
    }
  }

  addSubsystemReferences(slide, bounds, theme, elements) {
    // Subsystem callouts
    const subsystems = [
      { name: 'GATEWAY', ref: 'gateway.js:45' },
      { name: 'AUTHORITY', ref: 'authority.js:128' },
      { name: 'REPLAY', ref: 'replay.js:89' }
    ];
    
    subsystems.forEach((sub, index) => {
      const x = bounds.x + bounds.w * 0.25 + index * 0.5;
      const y = bounds.y + bounds.h * 0.92;
      
      slide.addText(`${sub.name}:`, {
        x: x - 0.15,
        y: y - 0.05,
        w: 0.3,
        h: 0.08,
        fontSize: 6,
        color: '#00E5FF',
        bold: true
      });
      elements.push({ type: 'text', name: `subsystem_name_${index}` });
      
      slide.addText(sub.ref, {
        x: x + 0.15,
        y: y - 0.05,
        w: 0.3,
        h: 0.08,
        fontSize: 5,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `subsystem_ref_${index}` });
    });

    // Dependency indicators
    const deps = ['DEPENDS: event-log', 'DEPENDS: authority', 'DEPENDS: witness'];
    deps.forEach((dep, index) => {
      const x = bounds.x + bounds.w * 0.7;
      const y = bounds.y + bounds.h * 0.3 + index * 0.08;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: x - 0.1,
        y: y + 0.04,
        w: 0.08,
        h: 0,
        line: { color: '#FF00FF', width: 1 }
      });
      elements.push({ type: 'line', name: `dep_line_${index}` });
      
      slide.addText(dep, {
        x: x,
        y: y,
        w: 1.2,
        h: 0.08,
        fontSize: 5,
        color: '#FF00FF',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `dep_text_${index}` });
    });
  }

  calculateDensityScore(elements) {
    const counts = {
      backgroundSystems: elements.filter(e => e.name?.startsWith('grid_') || e.name?.startsWith('coord_') || e.name?.startsWith('zone_')).length,
      labels: elements.filter(e => e.name?.startsWith('layer_label_') || e.name?.startsWith('component_label_')).length,
      callouts: elements.filter(e => e.name?.startsWith('status_') || e.name?.startsWith('metric_')).length,
      relationshipLines: elements.filter(e => e.name?.startsWith('layer_connection_') || e.name?.startsWith('component_arrow_')).length,
      metadata: elements.filter(e => e.name?.startsWith('version_') || e.name?.startsWith('build_') || e.name?.startsWith('system_id_')).length,
      evidenceNodes: elements.filter(e => e.name?.startsWith('evidence_') || e.name?.startsWith('badge_')).length,
      miniDiagrams: elements.filter(e => e.name?.startsWith('mini_') || e.name?.startsWith('flow_')).length,
      subsystemReferences: elements.filter(e => e.name?.startsWith('subsystem_') || e.name?.startsWith('dep_')).length
    };

    const scores = {
      backgroundSystems: Math.min(counts.backgroundSystems / DENSITY_TARGETS.MIN_BACKGROUND_SYSTEMS, 1) * 100,
      labels: Math.min(counts.labels / DENSITY_TARGETS.MIN_LABELS, 1) * 100,
      callouts: Math.min(counts.callouts / DENSITY_TARGETS.MIN_CALLOUTS, 1) * 100,
      relationshipLines: Math.min(counts.relationshipLines / DENSITY_TARGETS.MIN_RELATIONSHIP_LINES, 1) * 100,
      metadata: Math.min(counts.metadata / DENSITY_TARGETS.MIN_METADATA, 1) * 100,
      evidenceNodes: Math.min(counts.evidenceNodes / DENSITY_TARGETS.MIN_EVIDENCE_NODES, 1) * 100,
      miniDiagrams: Math.min(counts.miniDiagrams / DENSITY_TARGETS.MIN_MINI_DIAGRAMS, 1) * 100,
      subsystemReferences: Math.min(counts.subsystemReferences / DENSITY_TARGETS.MIN_SUBSYSTEM_REFERENCES, 1) * 100
    };

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return { counts, scores, overallScore };
  }
}

module.exports = {
  VisualDensityEngine,
  DENSITY_ELEMENTS,
  DENSITY_TARGETS
};
