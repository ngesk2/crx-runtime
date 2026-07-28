// ── BUILDER/GENERATOR/SELF-RECONSTRUCTION ENGINE ─────────────────────
// V14+: A self-improving substrate must eventually be capable of modifying itself
// Knowledge → Plan → Generate → Verify → Deploy → Observe

const BUILDER_PIPELINE = {
  KNOWLEDGE: {
    name: 'Knowledge',
    position: { x: 1, y: 3.75 },
    description: 'Current Understanding',
    color: '#FF00FF',
    type: 'input'
  },
  PLAN: {
    name: 'Plan',
    position: { x: 2.5, y: 3.75 },
    description: 'Improvement Strategy',
    color: '#FF00FF',
    type: 'processing'
  },
  GENERATE: {
    name: 'Generate',
    position: { x: 4, y: 3.75 },
    description: 'Code/Architecture Synthesis',
    color: '#00FF00',
    type: 'processing'
  },
  VERIFY: {
    name: 'Verify',
    position: { x: 5.5, y: 3.75 },
    description: 'Evidence Chain Validation',
    color: '#FFC400',
    type: 'validation'
  },
  DEPLOY: {
    name: 'Deploy',
    position: { x: 7, y: 3.75 },
    description: 'Live System Update',
    color: '#00E5FF',
    type: 'output'
  },
  OBSERVE: {
    name: 'Observe',
    position: { x: 8.5, y: 3.75 },
    description: 'Reality Verification',
    color: '#FFFFFF',
    type: 'feedback'
  }
};

const BUILDER_CONSTRAINTS = {
  CONSTITUTIONAL: {
    name: 'Constitutional',
    description: 'Must satisfy constitutional rules',
    color: '#FFC400'
  },
  EVIDENCE: {
    name: 'Evidence-Based',
    description: 'Must have verifiable evidence chain',
    color: '#FFFFFF'
  },
  SAFE: {
    name: 'Safe',
    description: 'Must pass safety verification',
    color: '#00FF00'
  },
  REVERSIBLE: {
    name: 'Reversible',
    description: 'Must be rollback-capable',
    color: '#00E5FF'
  }
};

class BuilderEngine {
  constructor(pres) {
    this.pres = pres;
    this.builderHistory = new Map();
  }

  renderBuilderPipeline(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('SELF-RECONSTRUCTION ENGINE', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'builder_title' });

    // Subtitle
    slide.addText('Knowledge → Plan → Generate → Verify → Deploy → Observe', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'builder_subtitle' });

    // Render pipeline nodes
    Object.entries(BUILDER_PIPELINE).forEach(([nodeKey, node]) => {
      const nodeBounds = {
        x: bounds.x + node.position.x * bounds.w / 10 - 0.4,
        y: bounds.y + node.position.y * bounds.h / 7.5 - 0.4,
        w: 0.8,
        h: 0.8
      };

      const nodeElements = this.renderBuilderNode(slide, nodeKey, node, nodeBounds, theme);
      elements.push(...nodeElements);

      this.builderHistory.set(nodeKey, nodeBounds);
    });

    // Render pipeline connections
    const connectionElements = this.renderPipelineConnections(slide, bounds, theme);
    elements.push(...connectionElements);

    // Render constraints
    const constraintElements = this.renderConstraints(slide, bounds, theme);
    elements.push(...constraintElements);

    return { elements };
  }

  renderBuilderNode(slide, nodeKey, node, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Node shape based on type
    switch (node.type) {
      case 'input':
        slide.addShape(this.pres.ShapeType.rect, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: node.color, transparency: 85 },
          line: { color: node.color, width: 2 }
        });
        break;
      case 'processing':
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: node.color, transparency: 85 },
          line: { color: node.color, width: 2 }
        });
        break;
      case 'validation':
        slide.addShape(this.pres.ShapeType.diamond, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: node.color, transparency: 85 },
          line: { color: node.color, width: 2 }
        });
        break;
      case 'output':
        slide.addShape(this.pres.ShapeType.rect, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: node.color, transparency: 85 },
          line: { color: node.color, width: 3 }
        });
        break;
      case 'feedback':
        slide.addShape(this.pres.ShapeType.rect, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: node.color, transparency: 85 },
          line: { color: node.color, width: 2, dashType: 'dash' }
        });
        break;
    }

    elements.push({ type: 'shape', name: `builder_node_${nodeKey}`, semanticType: nodeKey });

    // Node name
    slide.addText(node.name, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.05,
      w: bounds.w - 0.1,
      h: 0.2,
      fontSize: 7,
      color: node.color,
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: `builder_node_name_${nodeKey}` });

    // Node description
    slide.addText(node.description, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.25,
      w: bounds.w - 0.1,
      h: 0.15,
      fontSize: 5,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: `builder_node_desc_${nodeKey}` });

    // Node type indicator
    slide.addText(node.type.toUpperCase(), {
      x: bounds.x + 0.05,
      y: bounds.y + bounds.h - 0.15,
      w: bounds.w - 0.1,
      h: 0.1,
      fontSize: 5,
      color: '#666666',
      align: 'center',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: `builder_node_type_${nodeKey}` });

    return elements;
  }

  renderPipelineConnections(slide, bounds, theme) {
    const elements = [];
    const pipelineKeys = Object.keys(BUILDER_PIPELINE);

    for (let i = 0; i < pipelineKeys.length - 1; i++) {
      const from = pipelineKeys[i];
      const to = pipelineKeys[i + 1];

      const fromBounds = this.builderHistory.get(from);
      const toBounds = this.builderHistory.get(to);

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
        elements.push({ type: 'line', name: `builder_conn_${from}_${to}` });

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
        elements.push({ type: 'triangle', name: `builder_arrow_${from}_${to}` });
      }
    }

    // Feedback loop from Observe back to Knowledge
    const observeBounds = this.builderHistory.get('OBSERVE');
    const knowledgeBounds = this.builderHistory.get('KNOWLEDGE');

    if (observeBounds && knowledgeBounds) {
      const observeCenterX = observeBounds.x + observeBounds.w / 2;
      const observeCenterY = observeBounds.y + observeBounds.h / 2;
      const knowledgeCenterX = knowledgeBounds.x + knowledgeBounds.w / 2;
      const knowledgeCenterY = knowledgeBounds.y + knowledgeBounds.h / 2;

      // Curved feedback line
      const midX = (observeCenterX + knowledgeCenterX) / 2;
      const midY = observeCenterY + 1;

      slide.addShape(this.pres.ShapeType.line, {
        x: observeCenterX,
        y: observeCenterY,
        w: midX - observeCenterX,
        h: midY - observeCenterY,
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: 'builder_feedback_1' });

      slide.addShape(this.pres.ShapeType.line, {
        x: midX,
        y: midY,
        w: knowledgeCenterX - midX,
        h: knowledgeCenterY - midY,
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: 'builder_feedback_2' });

      // Feedback label
      slide.addText('FEEDBACK LOOP', {
        x: midX - 0.4,
        y: midY - 0.05,
        w: 0.8,
        h: 0.1,
        fontSize: 5,
        color: '#666666',
        align: 'center',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: 'builder_feedback_label' });
    }

    return elements;
  }

  renderConstraints(slide, bounds, theme) {
    const elements = [];
    const constraintY = bounds.y + bounds.h - 1.2;
    const constraintSpacing = 0.15;

    slide.addText('CONSTRAINTS', {
      x: bounds.x + 0.2,
      y: constraintY,
      w: 1.5,
      h: 0.15,
      fontSize: 8,
      color: theme.primary || '#00E5FF',
      bold: true
    });
    elements.push({ type: 'text', name: 'constraints_title' });

    Object.entries(BUILDER_CONSTRAINTS).forEach(([key, constraint], index) => {
      const y = constraintY + 0.2 + index * constraintSpacing;

      // Constraint indicator
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x + 0.2,
        y: y,
        w: 0.06,
        h: 0.06,
        fill: { color: constraint.color, transparency: 70 },
        line: { color: constraint.color, width: 1 }
      });
      elements.push({ type: 'ellipse', name: `constraint_indicator_${index}` });

      // Constraint name
      slide.addText(constraint.name, {
        x: bounds.x + 0.3,
        y: y - 0.03,
        w: 1.5,
        h: 0.1,
        fontSize: 6,
        color: constraint.color
      });
      elements.push({ type: 'text', name: `constraint_name_${index}` });

      // Constraint description
      slide.addText(constraint.description, {
        x: bounds.x + 2,
        y: y - 0.03,
        w: 7,
        h: 0.1,
        fontSize: 6,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `constraint_desc_${index}` });
    });

    return elements;
  }

  renderAutonomousOperation(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('AUTONOMOUS OPERATION', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'autonomous_title' });

    // Subtitle
    slide.addText('The system runs itself. Components are implementation details.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'autonomous_subtitle' });

    // Autonomous characteristics
    const characteristics = [
      { name: 'Self-Driving', description: 'System initiates its own improvement cycles', status: 'ACTIVE' },
      { name: 'Self-Validating', description: 'Every action has an evidence chain', status: 'ACTIVE' },
      { name: 'Self-Correcting', description: 'Violations trigger automatic correction', status: 'ACTIVE' },
      { name: 'Self-Evolving', description: 'Constitution improves over time', status: 'ACTIVE' },
      { name: 'Self-Protecting', description: 'Constitutional rules prevent degradation', status: 'ACTIVE' }
    ];

    const charY = bounds.y + 0.6;
    const charSpacing = bounds.h / 7;

    characteristics.forEach((char, index) => {
      const y = charY + index * charSpacing;

      // Status indicator
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x + 0.2,
        y: y,
        w: 0.08,
        h: 0.08,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `autonomous_status_${index}` });

      // Characteristic name
      slide.addText(char.name, {
        x: bounds.x + 0.35,
        y: y - 0.04,
        w: 2,
        h: 0.1,
        fontSize: 8,
        color: '#00FF00',
        bold: true
      });
      elements.push({ type: 'text', name: `autonomous_name_${index}` });

      // Characteristic description
      slide.addText(char.description, {
        x: bounds.x + 2.5,
        y: y - 0.04,
        w: 5,
        h: 0.1,
        fontSize: 7,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `autonomous_desc_${index}` });

      // Status text
      slide.addText(char.status, {
        x: bounds.x + 7.7,
        y: y - 0.04,
        w: 1,
        h: 0.1,
        fontSize: 7,
        color: '#00FF00',
        align: 'right'
      });
      elements.push({ type: 'text', name: `autonomous_status_text_${index}` });
    });

    return { elements };
  }

  getPipelineNode(nodeKey) {
    return BUILDER_PIPELINE[nodeKey];
  }

  getAllPipelineNodes() {
    return BUILDER_PIPELINE;
  }

  getConstraints() {
    return BUILDER_CONSTRAINTS;
  }
}

module.exports = {
  BuilderEngine,
  BUILDER_PIPELINE,
  BUILDER_CONSTRAINTS
};
