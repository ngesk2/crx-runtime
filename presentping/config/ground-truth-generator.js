// ── GROUND TRUTH GENERATOR (WITNESS) ─────────────────────────────────
// V14+: Witness is not compliance verification. Witness is Ground Truth Generator.
// Without Witness: no trust, no evidence, no learning, no improvement.
// Witness should almost be the center of the civilization.

const WITNESS_FUNCTIONS = {
  TRUTH_GENERATION: {
    name: 'Truth Generation',
    description: 'Generate verifiable ground truth from observations',
    color: '#FFFFFF',
    priority: 'critical'
  },
  EVIDENCE_CHAIN: {
    name: 'Evidence Chain',
    description: 'Maintain complete provenance for every truth claim',
    color: '#FFC400',
    priority: 'critical'
  },
  TRUST_ANCHOR: {
    name: 'Trust Anchor',
    description: 'Provide cryptographic trust foundation',
    color: '#00E5FF',
    priority: 'critical'
  },
  LEARNING_ENABLER: {
    name: 'Learning Enabler',
    description: 'Enable learning from verified truth',
    color: '#FF00FF',
    priority: 'high'
  },
  IMPROVEMENT_ENABLER: {
    name: 'Improvement Enabler',
    description: 'Enable system improvement through truth',
    color: '#00FF00',
    priority: 'high'
  }
};

const TRUTH_FLOW = {
  OBSERVATION: {
    name: 'Observation',
    description: 'Raw data from reality',
    color: '#00E5FF',
    position: { x: 5, y: 6.5 }
  },
  CAPTURE: {
    name: 'Capture',
    description: 'Event logging',
    color: '#00E5FF',
    position: { x: 5, y: 5.5 }
  },
  VERIFICATION: {
    name: 'Verification',
    description: 'Witness validation',
    color: '#FFC400',
    position: { x: 5, y: 4.5 }
  },
  CANONICAL_TRUTH: {
    name: 'Canonical Truth',
    description: 'Verified ground truth',
    color: '#FFFFFF',
    position: { x: 5, y: 3.5 }
  },
  KNOWLEDGE: {
    name: 'Knowledge',
    description: 'Semantic understanding',
    color: '#FF00FF',
    position: { x: 5, y: 2.5 }
  },
  IMPROVEMENT: {
    name: 'Improvement',
    description: 'System enhancement',
    color: '#00FF00',
    position: { x: 5, y: 1.5 }
  }
};

class GroundTruthGeneratorEngine {
  constructor(pres) {
    this.pres = pres;
    this.witnessHistory = new Map();
  }

  renderGroundTruthGenerator(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('GROUND TRUTH GENERATOR', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'witness_title' });

    // Subtitle
    slide.addText('Witness is central to civilization. Without Witness: no trust, no evidence, no learning, no improvement.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'witness_subtitle' });

    // Render truth flow
    Object.entries(TRUTH_FLOW).forEach(([flowKey, flow]) => {
      const flowBounds = {
        x: bounds.x + flow.position.x * bounds.w / 10 - 0.6,
        y: bounds.y + flow.position.y * bounds.h / 7.5 - 0.3,
        w: 1.2,
        h: 0.6
      };

      const flowElements = this.renderTruthFlowNode(slide, flowKey, flow, flowBounds, theme);
      elements.push(...flowElements);

      this.witnessHistory.set(flowKey, flowBounds);
    });

    // Render truth flow connections
    const connectionElements = this.renderTruthFlowConnections(slide, bounds, theme);
    elements.push(...connectionElements);

    // Render witness functions
    const functionElements = this.renderWitnessFunctions(slide, bounds, theme);
    elements.push(...functionElements);

    return { elements };
  }

  renderTruthFlowNode(slide, flowKey, flow, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Node shape based on position in flow
    if (flowKey === 'VERIFICATION') {
      // Verification is the center - larger, more prominent
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x - 0.2,
        y: bounds.y - 0.2,
        w: bounds.w + 0.4,
        h: bounds.h + 0.4,
        fill: { color: flow.color, transparency: 80 },
        line: { color: flow.color, width: 3 }
      });
      elements.push({ type: 'ellipse', name: `truth_flow_${flowKey}`, isCentral: true });
    } else {
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x,
        y: bounds.y,
        w: bounds.w,
        h: bounds.h,
        fill: { color: flow.color, transparency: 85 },
        line: { color: flow.color, width: 2 }
      });
      elements.push({ type: 'rect', name: `truth_flow_${flowKey}` });
    }

    // Node name
    slide.addText(flow.name, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.05,
      w: bounds.w - 0.1,
      h: 0.2,
      fontSize: 7,
      color: flow.color,
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: `truth_flow_name_${flowKey}` });

    // Node description
    slide.addText(flow.description, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.25,
      w: bounds.w - 0.1,
      h: 0.15,
      fontSize: 5,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: `truth_flow_desc_${flowKey}` });

    return elements;
  }

  renderTruthFlowConnections(slide, bounds, theme) {
    const elements = [];
    const flowKeys = Object.keys(TRUTH_FLOW);

    for (let i = 0; i < flowKeys.length - 1; i++) {
      const from = flowKeys[i];
      const to = flowKeys[i + 1];

      const fromBounds = this.witnessHistory.get(from);
      const toBounds = this.witnessHistory.get(to);

      if (fromBounds && toBounds) {
        const fromCenterX = fromBounds.x + fromBounds.w / 2;
        const fromCenterY = fromBounds.y + fromBounds.h / 2;
        const toCenterX = toBounds.x + toBounds.w / 2;
        const toCenterY = toBounds.y + toBounds.h / 2;

        // Connection line
        slide.addShape(this.pres.ShapeType.line, {
          x: fromCenterX,
          y: fromCenterY,
          w: toCenterX - fromCenterX,
          h: toCenterY - fromCenterY,
          line: { color: theme.primary || '#00E5FF', width: 2 }
        });
        elements.push({ type: 'line', name: `truth_flow_conn_${from}_${to}` });

        // Arrow head
        const arrowSize = 0.08;
        const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX);

        slide.addShape(this.pres.ShapeType.triangle, {
          x: toCenterX - arrowSize / 2 - Math.cos(angle) * 0.15,
          y: toCenterY - arrowSize / 2 - Math.sin(angle) * 0.15,
          w: arrowSize,
          h: arrowSize,
          fill: { color: theme.primary || '#00E5FF', transparency: 70 },
          line: { color: theme.primary || '#00E5FF', width: 1 }
        });
        elements.push({ type: 'triangle', name: `truth_flow_arrow_${from}_${to}` });
      }
    }

    return elements;
  }

  renderWitnessFunctions(slide, bounds, theme) {
    const elements = [];
    const functionY = bounds.y + bounds.h - 1.2;
    const functionSpacing = 0.15;

    slide.addText('WITNESS FUNCTIONS', {
      x: bounds.x + 0.2,
      y: functionY,
      w: 2,
      h: 0.15,
      fontSize: 8,
      color: theme.primary || '#00E5FF',
      bold: true
    });
    elements.push({ type: 'text', name: 'witness_functions_title' });

    Object.entries(WITNESS_FUNCTIONS).forEach(([key, func], index) => {
      const y = functionY + 0.2 + index * functionSpacing;

      // Priority indicator
      const priorityColor = func.priority === 'critical' ? '#FF0000' : '#00FF00';
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x + 0.2,
        y: y,
        w: 0.06,
        h: 0.06,
        fill: { color: priorityColor, transparency: 70 },
        line: { color: priorityColor, width: 1 }
      });
      elements.push({ type: 'ellipse', name: `witness_priority_${index}` });

      // Function name
      slide.addText(func.name, {
        x: bounds.x + 0.3,
        y: y - 0.03,
        w: 2,
        h: 0.1,
        fontSize: 6,
        color: func.color
      });
      elements.push({ type: 'text', name: `witness_func_name_${index}` });

      // Function description
      slide.addText(func.description, {
        x: bounds.x + 2.4,
        y: y - 0.03,
        w: 6.5,
        h: 0.1,
        fontSize: 6,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `witness_func_desc_${index}` });

      // Priority label
      slide.addText(func.priority.toUpperCase(), {
        x: bounds.x + 9.2,
        y: y - 0.03,
        w: 0.6,
        h: 0.1,
        fontSize: 5,
        color: priorityColor,
        align: 'right',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `witness_priority_label_${index}` });
    });

    return elements;
  }

  renderWitnessImportance(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('WHY WITNESS IS CENTRAL', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'witness_importance_title' });

    // Subtitle
    slide.addText('Without Witness: no trust, no evidence, no learning, no improvement', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'witness_importance_subtitle' });

    // Central Witness node
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 1.5,
      y: centerY - 1,
      w: 3,
      h: 2,
      fill: { color: '#FFC400', transparency: 80 },
      line: { color: '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'witness_central' });

    slide.addText('WITNESS', {
      x: centerX - 0.4,
      y: centerY - 0.1,
      w: 0.8,
      h: 0.2,
      fontSize: 12,
      color: '#FFC400',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'witness_central_label' });

    slide.addText('Ground Truth Generator', {
      x: centerX - 0.8,
      y: centerY + 0.15,
      w: 1.6,
      h: 0.15,
      fontSize: 7,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'witness_central_desc' });

    // Dependent systems around Witness
    const dependencies = [
      { name: 'TRUST', angle: 0, description: 'Cryptographic foundation' },
      { name: 'EVIDENCE', angle: 72, description: 'Verifiable provenance' },
      { name: 'LEARNING', angle: 144, description: 'Knowledge from truth' },
      { name: 'IMPROVEMENT', angle: 216, description: 'System enhancement' },
      { name: 'COMPLIANCE', angle: 288, description: 'Constitutional adherence' }
    ];

    const radius = 2.5;

    dependencies.forEach((dep, index) => {
      const rad = dep.angle * Math.PI / 180;
      const depX = centerX + Math.cos(rad) * radius;
      const depY = centerY + Math.sin(rad) * radius * 0.6;

      // Connection line
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX + Math.cos(rad) * 1.5,
        y: centerY + Math.sin(rad) * 1,
        w: depX - (centerX + Math.cos(rad) * 1.5),
        h: depY - (centerY + Math.sin(rad) * 1),
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `witness_dep_conn_${index}` });

      // Dependency node
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: depX - 0.4,
        y: depY - 0.2,
        w: 0.8,
        h: 0.4,
        fill: { color: '#00E5FF', transparency: 85 },
        line: { color: '#00E5FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `witness_dep_${index}` });

      slide.addText(dep.name, {
        x: depX - 0.35,
        y: depY - 0.05,
        w: 0.7,
        h: 0.1,
        fontSize: 6,
        color: '#00E5FF',
        bold: true,
        align: 'center'
      });
      elements.push({ type: 'text', name: `witness_dep_name_${index}` });
    });

    return { elements };
  }

  getWitnessFunction(funcKey) {
    return WITNESS_FUNCTIONS[funcKey];
  }

  getAllWitnessFunctions() {
    return WITNESS_FUNCTIONS;
  }

  getTruthFlow(flowKey) {
    return TRUTH_FLOW[flowKey];
  }

  getAllTruthFlow() {
    return TRUTH_FLOW;
  }
}

module.exports = {
  GroundTruthGeneratorEngine,
  WITNESS_FUNCTIONS,
  TRUTH_FLOW
};
