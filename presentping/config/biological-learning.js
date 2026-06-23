// ── BIOLOGICAL LEARNING (REPLAY) ───────────────────────────────────────
// V14+: Replay is not a city. Replay is a biological function.
// In a self-improving architecture: Observe → Store → Replay → Learn → Improve
// Replay is how learning occurs. It is not a destination.

const LEARNING_CYCLE = {
  OBSERVE: {
    name: 'Observe',
    description: 'Capture events from reality',
    color: '#00E5FF',
    position: { x: 1, y: 3.75 },
    type: 'input'
  },
  STORE: {
    name: 'Store',
    description: 'Archive events in canonical state',
    color: '#FFC400',
    position: { x: 2.5, y: 3.75 },
    type: 'storage'
  },
  REPLAY: {
    name: 'Replay',
    description: 'Reconstruct historical states',
    color: '#C0C0C0',
    position: { x: 4, y: 3.75 },
    type: 'processing'
  },
  LEARN: {
    name: 'Learn',
    description: 'Extract patterns from replay',
    color: '#FF00FF',
    position: { x: 5.5, y: 3.75 },
    type: 'cognitive'
  },
  IMPROVE: {
    name: 'Improve',
    description: 'Apply learning to system',
    color: '#00FF00',
    position: { x: 7, y: 3.75 },
    type: 'output'
  },
  VALIDATE: {
    name: 'Validate',
    description: 'Verify improvement impact',
    color: '#FFC400',
    position: { x: 8.5, y: 3.75 },
    type: 'validation'
  }
};

const REPLAY_FUNCTIONS = {
  STATE_RECONSTRUCTION: {
    name: 'State Reconstruction',
    description: 'Rebuild historical system states from event logs',
    color: '#C0C0C0',
    importance: 'critical'
  },
  PATTERN_EXTRACTION: {
    name: 'Pattern Extraction',
    description: 'Identify recurring patterns in historical data',
    color: '#FF00FF',
    importance: 'high'
  },
  CAUSAL_ANALYSIS: {
    name: 'Causal Analysis',
    description: 'Determine cause-effect relationships',
    color: '#FFC400',
    importance: 'high'
  },
  PREDICTION: {
    name: 'Prediction',
    description: 'Forecast future states based on patterns',
    color: '#00E5FF',
    importance: 'medium'
  },
  ANOMALY_DETECTION: {
    name: 'Anomaly Detection',
    description: 'Identify deviations from expected patterns',
    color: '#FF0000',
    importance: 'critical'
  }
};

class BiologicalLearningEngine {
  constructor(pres) {
    this.pres = pres;
    this.learningHistory = new Map();
  }

  renderBiologicalLearning(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('BIOLOGICAL LEARNING CYCLE', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'learning_title' });

    // Subtitle
    slide.addText('Replay is not a city. Replay is a biological function: Observe → Store → Replay → Learn → Improve', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'learning_subtitle' });

    // Render learning cycle
    Object.entries(LEARNING_CYCLE).forEach(([cycleKey, cycle]) => {
      const cycleBounds = {
        x: bounds.x + cycle.position.x * bounds.w / 10 - 0.4,
        y: bounds.y + cycle.position.y * bounds.h / 7.5 - 0.4,
        w: 0.8,
        h: 0.8
      };

      const cycleElements = this.renderLearningCycleNode(slide, cycleKey, cycle, cycleBounds, theme);
      elements.push(...cycleElements);

      this.learningHistory.set(cycleKey, cycleBounds);
    });

    // Render cycle connections
    const connectionElements = this.renderCycleConnections(slide, bounds, theme);
    elements.push(...connectionElements);

    // Render replay functions
    const functionElements = this.renderReplayFunctions(slide, bounds, theme);
    elements.push(...functionElements);

    return { elements };
  }

  renderLearningCycleNode(slide, cycleKey, cycle, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Node shape based on type
    switch (cycle.type) {
      case 'input':
        slide.addShape(this.pres.ShapeType.rect, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: cycle.color, transparency: 85 },
          line: { color: cycle.color, width: 2 }
        });
        break;
      case 'storage':
        slide.addShape(this.pres.ShapeType.rect, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: cycle.color, transparency: 85 },
          line: { color: cycle.color, width: 2 }
        });
        break;
      case 'processing':
        // Replay is the center - larger, more prominent
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: bounds.x - 0.2,
          y: bounds.y - 0.2,
          w: bounds.w + 0.4,
          h: bounds.h + 0.4,
          fill: { color: cycle.color, transparency: 80 },
          line: { color: cycle.color, width: 3 }
        });
        break;
      case 'cognitive':
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: cycle.color, transparency: 85 },
          line: { color: cycle.color, width: 2 }
        });
        break;
      case 'output':
        slide.addShape(this.pres.ShapeType.rect, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: cycle.color, transparency: 85 },
          line: { color: cycle.color, width: 3 }
        });
        break;
      case 'validation':
        slide.addShape(this.pres.ShapeType.diamond, {
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h,
          fill: { color: cycle.color, transparency: 85 },
          line: { color: cycle.color, width: 2 }
        });
        break;
    }

    elements.push({ type: 'shape', name: `learning_cycle_${cycleKey}`, semanticType: cycleKey });

    // Node name
    slide.addText(cycle.name, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.05,
      w: bounds.w - 0.1,
      h: 0.2,
      fontSize: 7,
      color: cycle.color,
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: `learning_cycle_name_${cycleKey}` });

    // Node description
    slide.addText(cycle.description, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.25,
      w: bounds.w - 0.1,
      h: 0.15,
      fontSize: 5,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: `learning_cycle_desc_${cycleKey}` });

    return elements;
  }

  renderCycleConnections(slide, bounds, theme) {
    const elements = [];
    const cycleKeys = Object.keys(LEARNING_CYCLE);

    for (let i = 0; i < cycleKeys.length - 1; i++) {
      const from = cycleKeys[i];
      const to = cycleKeys[i + 1];

      const fromBounds = this.learningHistory.get(from);
      const toBounds = this.learningHistory.get(to);

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
        elements.push({ type: 'line', name: `learning_cycle_conn_${from}_${to}` });

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
        elements.push({ type: 'triangle', name: `learning_cycle_arrow_${from}_${to}` });
      }
    }

    // Feedback loop from Validate back to Observe
    const validateBounds = this.learningHistory.get('VALIDATE');
    const observeBounds = this.learningHistory.get('OBSERVE');

    if (validateBounds && observeBounds) {
      const validateCenterX = validateBounds.x + validateBounds.w / 2;
      const validateCenterY = validateBounds.y + validateBounds.h / 2;
      const observeCenterX = observeBounds.x + observeBounds.w / 2;
      const observeCenterY = observeBounds.y + observeBounds.h / 2;

      // Curved feedback line
      const midX = (validateCenterX + observeCenterX) / 2;
      const midY = validateCenterY + 1;

      slide.addShape(this.pres.ShapeType.line, {
        x: validateCenterX,
        y: validateCenterY,
        w: midX - validateCenterX,
        h: midY - validateCenterY,
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: 'learning_cycle_feedback_1' });

      slide.addShape(this.pres.ShapeType.line, {
        x: midX,
        y: midY,
        w: observeCenterX - midX,
        h: observeCenterY - midY,
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: 'learning_cycle_feedback_2' });

      // Feedback label
      slide.addText('CONTINUOUS LEARNING', {
        x: midX - 0.5,
        y: midY - 0.05,
        w: 1,
        h: 0.1,
        fontSize: 5,
        color: '#666666',
        align: 'center',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: 'learning_cycle_feedback_label' });
    }

    return elements;
  }

  renderReplayFunctions(slide, bounds, theme) {
    const elements = [];
    const functionY = bounds.y + bounds.h - 1.2;
    const functionSpacing = 0.15;

    slide.addText('REPLAY FUNCTIONS', {
      x: bounds.x + 0.2,
      y: functionY,
      w: 2,
      h: 0.15,
      fontSize: 8,
      color: theme.primary || '#00E5FF',
      bold: true
    });
    elements.push({ type: 'text', name: 'replay_functions_title' });

    Object.entries(REPLAY_FUNCTIONS).forEach(([key, func], index) => {
      const y = functionY + 0.2 + index * functionSpacing;

      // Importance indicator
      const importanceColor = func.importance === 'critical' ? '#FF0000' : func.importance === 'high' ? '#FFC400' : '#00FF00';
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x + 0.2,
        y: y,
        w: 0.06,
        h: 0.06,
        fill: { color: importanceColor, transparency: 70 },
        line: { color: importanceColor, width: 1 }
      });
      elements.push({ type: 'ellipse', name: `replay_importance_${index}` });

      // Function name
      slide.addText(func.name, {
        x: bounds.x + 0.3,
        y: y - 0.03,
        w: 2,
        h: 0.1,
        fontSize: 6,
        color: func.color
      });
      elements.push({ type: 'text', name: `replay_func_name_${index}` });

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
      elements.push({ type: 'text', name: `replay_func_desc_${index}` });

      // Importance label
      slide.addText(func.importance.toUpperCase(), {
        x: bounds.x + 9.2,
        y: y - 0.03,
        w: 0.6,
        h: 0.1,
        fontSize: 5,
        color: importanceColor,
        align: 'right',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `replay_importance_label_${index}` });
    });

    return elements;
  }

  renderReplayImportance(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('WHY REPLAY IS CRITICAL', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'replay_importance_title' });

    // Subtitle
    slide.addText('Replay is not a destination. Replay is how learning occurs.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'replay_importance_subtitle' });

    // Central Replay node
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 1.5,
      y: centerY - 1,
      w: 3,
      h: 2,
      fill: { color: '#C0C0C0', transparency: 80 },
      line: { color: '#C0C0C0', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'replay_central' });

    slide.addText('REPLAY', {
      x: centerX - 0.3,
      y: centerY - 0.1,
      w: 0.6,
      h: 0.2,
      fontSize: 12,
      color: '#C0C0C0',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'replay_central_label' });

    slide.addText('Biological Function', {
      x: centerX - 0.7,
      y: centerY + 0.15,
      w: 1.4,
      h: 0.15,
      fontSize: 7,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'replay_central_desc' });

    // Learning outcomes around Replay
    const outcomes = [
      { name: 'PATTERNS', angle: 0, description: 'Extract recurring patterns' },
      { name: 'CAUSALITY', angle: 72, description: 'Understand cause-effect' },
      { name: 'PREDICTION', angle: 144, description: 'Forecast future states' },
      { name: 'ANOMALIES', angle: 216, description: 'Detect deviations' },
      { name: 'IMPROVEMENT', angle: 288, description: 'Drive system enhancement' }
    ];

    const radius = 2.5;

    outcomes.forEach((outcome, index) => {
      const rad = outcome.angle * Math.PI / 180;
      const outcomeX = centerX + Math.cos(rad) * radius;
      const outcomeY = centerY + Math.sin(rad) * radius * 0.6;

      // Connection line
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX + Math.cos(rad) * 1.5,
        y: centerY + Math.sin(rad) * 1,
        w: outcomeX - (centerX + Math.cos(rad) * 1.5),
        h: outcomeY - (centerY + Math.sin(rad) * 1),
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `replay_outcome_conn_${index}` });

      // Outcome node
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: outcomeX - 0.4,
        y: outcomeY - 0.2,
        w: 0.8,
        h: 0.4,
        fill: { color: '#00E5FF', transparency: 85 },
        line: { color: '#00E5FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `replay_outcome_${index}` });

      slide.addText(outcome.name, {
        x: outcomeX - 0.35,
        y: outcomeY - 0.05,
        w: 0.7,
        h: 0.1,
        fontSize: 6,
        color: '#00E5FF',
        bold: true,
        align: 'center'
      });
      elements.push({ type: 'text', name: `replay_outcome_name_${index}` });
    });

    return { elements };
  }

  getLearningCycle(cycleKey) {
    return LEARNING_CYCLE[cycleKey];
  }

  getAllLearningCycle() {
    return LEARNING_CYCLE;
  }

  getReplayFunction(funcKey) {
    return REPLAY_FUNCTIONS[funcKey];
  }

  getAllReplayFunctions() {
    return REPLAY_FUNCTIONS;
  }
}

module.exports = {
  BiologicalLearningEngine,
  LEARNING_CYCLE,
  REPLAY_FUNCTIONS
};
