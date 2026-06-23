// ── ECONOMIC FLOWS ───────────────────────────────────────────────────
// V14+: Civilizations become memorable when resources move
// For a substrate, the key resources are: Information, Authority, Evidence, Knowledge, Decisions

const ECONOMIC_RESOURCES = {
  INFORMATION: {
    name: 'Information',
    color: '#00E5FF',
    flow: 'Reality → Events → Knowledge',
    description: 'Raw data from external world',
    velocity: 'high',
    volume: 'continuous'
  },
  AUTHORITY: {
    name: 'Authority',
    color: '#FFC400',
    flow: 'Constitution → Reasoning → Action',
    description: 'Constitutional permission to act',
    velocity: 'medium',
    volume: 'constrained'
  },
  EVIDENCE: {
    name: 'Evidence',
    color: '#FFFFFF',
    flow: 'Verification → Canonical State',
    description: 'Verifiable proof of truth',
    velocity: 'medium',
    volume: 'accumulating'
  },
  KNOWLEDGE: {
    name: 'Knowledge',
    color: '#FF00FF',
    flow: 'Learning → Reasoning → Planning',
    description: 'Semantic understanding',
    velocity: 'low',
    volume: 'growing'
  },
  DECISIONS: {
    name: 'Decisions',
    color: '#00FF00',
    flow: 'Reasoning → Action → Impact',
    description: 'Executable choices',
    velocity: 'high',
    volume: 'continuous'
  }
};

const FLOW_PATHS = [
  {
    resource: 'INFORMATION',
    path: ['REALITY', 'EVENTS', 'CANONICAL_STATE', 'KNOWLEDGE'],
    type: 'observation'
  },
  {
    resource: 'AUTHORITY',
    path: ['CONSTITUTION', 'REASONING', 'ACTION'],
    type: 'authorization'
  },
  {
    resource: 'EVIDENCE',
    path: ['VERIFICATION', 'CANONICAL_STATE'],
    type: 'validation'
  },
  {
    resource: 'KNOWLEDGE',
    path: ['LEARNING', 'REASONING', 'PLANNING'],
    type: 'cognitive'
  },
  {
    resource: 'DECISIONS',
    path: ['REASONING', 'ACTION', 'REALITY'],
    type: 'execution'
  }
];

class EconomicFlowsEngine {
  constructor(pres) {
    this.pres = pres;
    this.flowHistory = new Map();
  }

  renderEconomicFlows(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('ECONOMIC FLOWS', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'economic_title' });

    // Subtitle
    slide.addText('Resources move through the system. Civilization is metabolism.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'economic_subtitle' });

    // Render resource flows
    const flowY = bounds.y + 0.6;
    const flowSpacing = bounds.h / 7;

    Object.entries(ECONOMIC_RESOURCES).forEach(([resourceKey, resource], index) => {
      const y = flowY + index * flowSpacing;

      const flowElements = this.renderResourceFlow(slide, resourceKey, resource, bounds.x, y, bounds.w, 0.4, theme);
      elements.push(...flowElements);
    });

    // Render flow summary
    const summaryElements = this.renderFlowSummary(slide, bounds, theme);
    elements.push(...summaryElements);

    return { elements };
  }

  renderResourceFlow(slide, resourceKey, resource, x, y, w, h, theme) {
    const elements = [];

    // Resource name
    slide.addText(resource.name, {
      x: x + 0.2,
      y: y,
      w: 1.5,
      h: 0.15,
      fontSize: 9,
      color: resource.color,
      bold: true
    });
    elements.push({ type: 'text', name: `resource_name_${resourceKey}` });

    // Resource flow path
    slide.addText(resource.flow, {
      x: x + 2,
      y: y,
      w: 4,
      h: 0.15,
      fontSize: 7,
      color: '#CCCCCC',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: `resource_flow_${resourceKey}` });

    // Resource description
    slide.addText(resource.description, {
      x: x + 2,
      y: y + 0.15,
      w: 4,
      h: 0.1,
      fontSize: 6,
      color: '#666666'
    });
    elements.push({ type: 'text', name: `resource_desc_${resourceKey}` });

    // Velocity indicator
    slide.addText(`VEL: ${resource.velocity}`, {
      x: x + 6.2,
      y: y,
      w: 1,
      h: 0.1,
      fontSize: 6,
      color: '#666666',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: `resource_velocity_${resourceKey}` });

    // Volume indicator
    slide.addText(`VOL: ${resource.volume}`, {
      x: x + 6.2,
      y: y + 0.1,
      w: 1,
      h: 0.1,
      fontSize: 6,
      color: '#666666',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: `resource_volume_${resourceKey}` });

    // Flow animation indicator
    const arrowCount = 5;
    const arrowSpacing = 0.15;

    for (let i = 0; i < arrowCount; i++) {
      const arrowX = x + 7.5 + i * arrowSpacing;

      slide.addShape(this.pres.ShapeType.line, {
        x: arrowX,
        y: y + 0.075,
        w: arrowSpacing * 0.8,
        h: 0,
        line: { color: resource.color, width: 2 }
      });
      elements.push({ type: 'line', name: `resource_arrow_line_${resourceKey}_${i}` });

      slide.addShape(this.pres.ShapeType.triangle, {
        x: arrowX + arrowSpacing * 0.8,
        y: y + 0.055,
        w: 0.04,
        h: 0.04,
        fill: { color: resource.color, transparency: 70 },
        line: { color: resource.color, width: 1 }
      });
      elements.push({ type: 'triangle', name: `resource_arrow_${resourceKey}_${i}` });
    }

    return elements;
  }

  renderFlowSummary(slide, bounds, theme) {
    const elements = [];
    const summaryY = bounds.y + bounds.h - 1.2;

    slide.addText('FLOW CHARACTERISTICS', {
      x: bounds.x + 0.2,
      y: summaryY,
      w: 2,
      h: 0.15,
      fontSize: 8,
      color: theme.primary || '#00E5FF',
      bold: true
    });
    elements.push({ type: 'text', name: 'flow_summary_title' });

    const characteristics = [
      { name: 'Information Flow', value: 'High velocity, continuous volume' },
      { name: 'Authority Flow', value: 'Medium velocity, constrained volume' },
      { name: 'Evidence Accumulation', value: 'Medium velocity, growing volume' },
      { name: 'Knowledge Growth', value: 'Low velocity, accelerating volume' },
      { name: 'Decision Execution', value: 'High velocity, continuous volume' }
    ];

    const charSpacing = 0.12;

    characteristics.forEach((char, index) => {
      const y = summaryY + 0.2 + index * charSpacing;

      slide.addText(char.name, {
        x: bounds.x + 0.2,
        y: y,
        w: 2,
        h: 0.1,
        fontSize: 6,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `flow_char_name_${index}` });

      slide.addText(char.value, {
        x: bounds.x + 2.3,
        y: y,
        w: 6,
        h: 0.1,
        fontSize: 6,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `flow_char_value_${index}` });
    });

    return elements;
  }

  renderMetabolismDiagram(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('METABOLISM DIAGRAM', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'metabolism_diagram_title' });

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
    elements.push({ type: 'text', name: 'metabolism_diagram_subtitle' });

    // Central metabolism circle
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Outer ring (Reality)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 2.5,
      y: centerY - 1.5,
      w: 5,
      h: 3,
      fill: { color: '#FFFFFF', transparency: 95 },
      line: { color: '#FFFFFF', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'metabolism_outer_ring' });

    // Inner ring (Processing)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 1.8,
      y: centerY - 1.1,
      w: 3.6,
      h: 2.2,
      fill: { color: '#00E5FF', transparency: 90 },
      line: { color: '#00E5FF', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'metabolism_inner_ring' });

    // Core (Constitution)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 1,
      y: centerY - 0.6,
      w: 2,
      h: 1.2,
      fill: { color: '#FFC400', transparency: 85 },
      line: { color: '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'metabolism_core' });

    // Labels
    slide.addText('REALITY', {
      x: centerX - 0.4,
      y: centerY - 1.8,
      w: 0.8,
      h: 0.15,
      fontSize: 8,
      color: '#FFFFFF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'metabolism_reality_label' });

    slide.addText('PROCESSING', {
      x: centerX - 0.5,
      y: centerY - 0.1,
      w: 1,
      h: 0.15,
      fontSize: 8,
      color: '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'metabolism_processing_label' });

    slide.addText('CONSTITUTION', {
      x: centerX - 0.6,
      y: centerY + 0.4,
      w: 1.2,
      h: 0.15,
      fontSize: 8,
      color: '#FFC400',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'metabolism_constitution_label' });

    // Flow indicators (arrows showing inward flow)
    const flowAngles = [0, 72, 144, 216, 288];
    const outerRadius = 2.5;
    const innerRadius = 1.8;

    flowAngles.forEach((angle, index) => {
      const rad = angle * Math.PI / 180;
      const startX = centerX + Math.cos(rad) * outerRadius;
      const startY = centerY + Math.sin(rad) * outerRadius * 0.6;
      const endX = centerX + Math.cos(rad) * innerRadius;
      const endY = centerY + Math.sin(rad) * innerRadius * 0.6;

      slide.addShape(this.pres.ShapeType.line, {
        x: startX,
        y: startY,
        w: endX - startX,
        h: endY - startY,
        line: { color: '#00E5FF', width: 2 }
      });
      elements.push({ type: 'line', name: `metabolism_flow_in_${index}` });

      // Arrow head
      const arrowSize = 0.08;
      const arrowAngle = Math.atan2(endY - startY, endX - startX);

      slide.addShape(this.pres.ShapeType.triangle, {
        x: endX - arrowSize / 2 - Math.cos(arrowAngle) * 0.1,
        y: endY - arrowSize / 2 - Math.sin(arrowAngle) * 0.1,
        w: arrowSize,
        h: arrowSize,
        fill: { color: '#00E5FF', transparency: 70 },
        line: { color: '#00E5FF', width: 1 }
      });
      elements.push({ type: 'triangle', name: `metabolism_flow_arrow_${index}` });
    });

    // Resource labels around the ring
    const resourceLabels = [
      { text: 'INFORMATION', angle: 0 },
      { text: 'AUTHORITY', angle: 72 },
      { text: 'EVIDENCE', angle: 144 },
      { text: 'KNOWLEDGE', angle: 216 },
      { text: 'DECISIONS', angle: 288 }
    ];

    resourceLabels.forEach((label, index) => {
      const rad = label.angle * Math.PI / 180;
      const labelX = centerX + Math.cos(rad) * 3;
      const labelY = centerY + Math.sin(rad) * 0.6;

      slide.addText(label.text, {
        x: labelX - 0.5,
        y: labelY - 0.05,
        w: 1,
        h: 0.1,
        fontSize: 6,
        color: '#CCCCCC',
        align: 'center',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `metabolism_resource_label_${index}` });
    });

    return { elements };
  }

  getResource(resourceKey) {
    return ECONOMIC_RESOURCES[resourceKey];
  }

  getAllResources() {
    return ECONOMIC_RESOURCES;
  }

  getFlowPaths() {
    return FLOW_PATHS;
  }
}

module.exports = {
  EconomicFlowsEngine,
  ECONOMIC_RESOURCES,
  FLOW_PATHS
};
