// ── SELF-IMPROVEMENT LOOP ─────────────────────────────────────────────
// V14+: The loop is the product. Components are implementation details.
// Reality → Events → Canonical State → Knowledge → Reasoning → Action → Verification → Improved Constitution → Improved System → Reality

const SELF_IMPROVEMENT_LOOP = {
  REALITY: {
    name: 'Reality',
    position: { x: 5, y: 6.5 },
    description: 'External World',
    color: '#FFFFFF',
    type: 'input'
  },
  EVENTS: {
    name: 'Events',
    position: { x: 5, y: 5.5 },
    description: 'Raw Observations',
    color: '#00E5FF',
    type: 'capture'
  },
  CANONICAL_STATE: {
    name: 'Canonical State',
    position: { x: 5, y: 4.5 },
    description: 'Verified Truth',
    color: '#FFC400',
    type: 'storage'
  },
  KNOWLEDGE: {
    name: 'Knowledge',
    position: { x: 5, y: 3.5 },
    description: 'Semantic Understanding',
    color: '#FF00FF',
    type: 'processing'
  },
  REASONING: {
    name: 'Reasoning',
    position: { x: 5, y: 2.5 },
    description: 'Cognitive Processing',
    color: '#FF00FF',
    type: 'processing'
  },
  ACTION: {
    name: 'Action',
    position: { x: 5, y: 1.5 },
    description: 'Execution',
    color: '#00FF00',
    type: 'output'
  },
  VERIFICATION: {
    name: 'Verification',
    position: { x: 7.5, y: 4 },
    description: 'Ground Truth Generation',
    color: '#FFC400',
    type: 'validation'
  },
  IMPROVED_CONSTITUTION: {
    name: 'Improved Constitution',
    position: { x: 2.5, y: 4 },
    description: 'Adaptive Rules',
    color: '#FFC400',
    type: 'evolution'
  },
  IMPROVED_SYSTEM: {
    name: 'Improved System',
    position: { x: 5, y: 0.5 },
    description: 'Self-Reconstruction',
    color: '#00FF00',
    type: 'output'
  }
};

const LOOP_CONNECTIONS = [
  { from: 'REALITY', to: 'EVENTS', type: 'observation' },
  { from: 'EVENTS', to: 'CANONICAL_STATE', type: 'capture' },
  { from: 'CANONICAL_STATE', to: 'KNOWLEDGE', type: 'learning' },
  { from: 'KNOWLEDGE', to: 'REASONING', type: 'reasoning' },
  { from: 'REASONING', to: 'ACTION', type: 'decision' },
  { from: 'ACTION', to: 'REALITY', type: 'impact' },
  { from: 'ACTION', to: 'VERIFICATION', type: 'verification' },
  { from: 'VERIFICATION', to: 'IMPROVED_CONSTITUTION', type: 'validation' },
  { from: 'IMPROVED_CONSTITUTION', to: 'IMPROVED_SYSTEM', type: 'evolution' },
  { from: 'IMPROVED_SYSTEM', to: 'REALITY', type: 'rebuild' },
  { from: 'VERIFICATION', to: 'CANONICAL_STATE', type: 'feedback' },
  { from: 'IMPROVED_CONSTITUTION', to: 'REASONING', type: 'constraint' }
];

class SelfImprovementLoopEngine {
  constructor(pres) {
    this.pres = pres;
    this.loopHistory = new Map();
  }

  renderSelfImprovementLoop(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Title
    slide.addText('SELF-IMPROVEMENT LOOP', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'loop_title' });

    // Subtitle
    slide.addText('The loop is the product. Components are implementation details.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'loop_subtitle' });

    // Render loop nodes
    Object.entries(SELF_IMPROVEMENT_LOOP).forEach(([nodeKey, node]) => {
      const nodeBounds = {
        x: bounds.x + node.position.x * bounds.w / 10 - 0.6,
        y: bounds.y + node.position.y * bounds.h / 7.5 - 0.3,
        w: 1.2,
        h: 0.6
      };

      const nodeElements = this.renderLoopNode(slide, nodeKey, node, nodeBounds, theme);
      elements.push(...nodeElements);

      this.loopHistory.set(nodeKey, nodeBounds);
    });

    // Render loop connections
    const connectionElements = this.renderLoopConnections(slide, bounds, theme);
    elements.push(...connectionElements);

    // Render loop indicators (arrows showing flow direction)
    const indicatorElements = this.renderLoopIndicators(slide, bounds, theme);
    elements.push(...indicatorElements);

    return { elements };
  }

  renderLoopNode(slide, nodeKey, node, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Node frame (architectural)
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: node.color, transparency: 85 },
      line: { color: node.color, width: 2 }
    });
    elements.push({ type: 'rect', name: `loop_node_${nodeKey}`, semanticType: nodeKey });

    // Node name
    slide.addText(node.name, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.05,
      w: bounds.w - 0.1,
      h: 0.2,
      fontSize: 7,
      color: node.color,
      bold: true
    });
    elements.push({ type: 'text', name: `loop_node_name_${nodeKey}` });

    // Node description
    slide.addText(node.description, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.25,
      w: bounds.w - 0.1,
      h: 0.15,
      fontSize: 5,
      color: '#CCCCCC'
    });
    elements.push({ type: 'text', name: `loop_node_desc_${nodeKey}` });

    // Node type indicator
    slide.addText(node.type.toUpperCase(), {
      x: bounds.x + 0.05,
      y: bounds.y + bounds.h - 0.15,
      w: bounds.w - 0.1,
      h: 0.1,
      fontSize: 5,
      color: '#666666',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: `loop_node_type_${nodeKey}` });

    return elements;
  }

  renderLoopConnections(slide, bounds, theme) {
    const elements = [];

    LOOP_CONNECTIONS.forEach(conn => {
      const fromBounds = this.loopHistory.get(conn.from);
      const toBounds = this.loopHistory.get(conn.to);

      if (fromBounds && toBounds) {
        const fromCenterX = fromBounds.x + fromBounds.w / 2;
        const fromCenterY = fromBounds.y + fromBounds.h / 2;
        const toCenterX = toBounds.x + toBounds.w / 2;
        const toCenterY = toBounds.y + toBounds.h / 2;

        // Connection line with curvature based on type
        if (conn.type === 'feedback' || conn.type === 'constraint') {
          // Curved line for feedback/constraint
          const midX = (fromCenterX + toCenterX) / 2;
          const midY = (fromCenterY + toCenterY) / 2;
          const curveOffset = conn.type === 'feedback' ? 0.5 : -0.5;

          slide.addShape(this.pres.ShapeType.line, {
            x: fromCenterX,
            y: fromCenterY,
            w: midX - fromCenterX,
            h: midY + curveOffset - fromCenterY,
            line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `loop_conn_${conn.from}_${conn.to}_1` });

          slide.addShape(this.pres.ShapeType.line, {
            x: midX,
            y: midY + curveOffset,
            w: toCenterX - midX,
            h: toCenterY - (midY + curveOffset),
            line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `loop_conn_${conn.from}_${conn.to}_2` });
        } else {
          // Straight line for direct connections
          slide.addShape(this.pres.ShapeType.line, {
            x: fromCenterX,
            y: fromCenterY,
            w: toCenterX - fromCenterX,
            h: toCenterY - fromCenterY,
            line: { color: theme.primary || '#00E5FF', width: 1.5 }
          });
          elements.push({ type: 'line', name: `loop_conn_${conn.from}_${conn.to}` });
        }

        // Connection label
        const midX = (fromCenterX + toCenterX) / 2;
        const midY = (fromCenterY + toCenterY) / 2;

        slide.addText(conn.type.toUpperCase(), {
          x: midX - 0.3,
          y: midY - 0.05,
          w: 0.6,
          h: 0.1,
          fontSize: 5,
          color: '#666666',
          align: 'center',
          fontFace: 'Courier New'
        });
        elements.push({ type: 'text', name: `loop_conn_label_${conn.from}_${conn.to}` });
      }
    });

    return elements;
  }

  renderLoopIndicators(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Central loop indicator (shows the cycle)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.15,
      y: centerY - 0.15,
      w: 0.3,
      h: 0.3,
      fill: { color: theme.primary || '#00E5FF', transparency: 90 },
      line: { color: theme.primary || '#00E5FF', width: 2, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'loop_center_indicator' });

    // Loop direction arrows
    const arrowPositions = [
      { x: centerX, y: centerY - 0.2, rotation: 0 },
      { x: centerX + 0.2, y: centerY, rotation: 90 },
      { x: centerX, y: centerY + 0.2, rotation: 180 },
      { x: centerX - 0.2, y: centerY, rotation: 270 }
    ];

    arrowPositions.forEach((pos, index) => {
      slide.addShape(this.pres.ShapeType.triangle, {
        x: pos.x - 0.03,
        y: pos.y - 0.03,
        w: 0.06,
        h: 0.06,
        fill: { color: theme.primary || '#00E5FF', transparency: 70 },
        line: { color: theme.primary || '#00E5FF', width: 1 }
      });
      elements.push({ type: 'triangle', name: `loop_arrow_${index}` });
    });

    return elements;
  }

  renderMetabolismView(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('METABOLISM VIEW', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'metabolism_title' });

    // Subtitle
    slide.addText('Resources flow through the system. The loop processes them.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'metabolism_subtitle' });

    // Resource types
    const resources = [
      { name: 'Information', color: '#00E5FF', flow: 'Reality → Events → Knowledge' },
      { name: 'Authority', color: '#FFC400', flow: 'Constitution → Reasoning → Action' },
      { name: 'Evidence', color: '#FFFFFF', flow: 'Verification → Canonical State' },
      { name: 'Knowledge', color: '#FF00FF', flow: 'Learning → Reasoning → Planning' },
      { name: 'Decisions', color: '#00FF00', flow: 'Reasoning → Action → Impact' }
    ];

    const resourceY = bounds.y + 0.6;
    const resourceSpacing = bounds.h / 6;

    resources.forEach((resource, index) => {
      const y = resourceY + index * resourceSpacing;

      // Resource name
      slide.addText(resource.name, {
        x: bounds.x + 0.2,
        y: y,
        w: 1.5,
        h: 0.15,
        fontSize: 9,
        color: resource.color,
        bold: true
      });
      elements.push({ type: 'text', name: `metabolism_resource_name_${index}` });

      // Resource flow
      slide.addText(resource.flow, {
        x: bounds.x + 2,
        y: y,
        w: 6,
        h: 0.15,
        fontSize: 7,
        color: '#CCCCCC',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `metabolism_resource_flow_${index}` });

      // Flow indicator
      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x + 8.2,
        y: y + 0.075,
        w: 0.3,
        h: 0,
        line: { color: resource.color, width: 2 }
      });
      elements.push({ type: 'line', name: `metabolism_flow_indicator_${index}` });

      slide.addShape(this.pres.ShapeType.triangle, {
        x: bounds.x + 8.5,
        y: y + 0.045,
        w: 0.06,
        h: 0.06,
        fill: { color: resource.color, transparency: 70 },
        line: { color: resource.color, width: 1 }
      });
      elements.push({ type: 'triangle', name: `metabolism_flow_arrow_${index}` });
    });

    return { elements };
  }

  getLoopNode(nodeKey) {
    return SELF_IMPROVEMENT_LOOP[nodeKey];
  }

  getAllLoopNodes() {
    return SELF_IMPROVEMENT_LOOP;
  }

  getLoopConnections() {
    return LOOP_CONNECTIONS;
  }
}

module.exports = {
  SelfImprovementLoopEngine,
  SELF_IMPROVEMENT_LOOP,
  LOOP_CONNECTIONS
};
