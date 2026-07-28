// ── ADAPTIVE GOVERNANCE ───────────────────────────────────────────────
// V14+: Rules evolve under constraints, not static rules
// Static governance is documentation. Adaptive governance is a substrate.

const ADAPTIVE_CONSTRAINTS = {
  CONSTITUTIONAL: {
    name: 'Constitutional',
    description: 'Rules must satisfy constitutional principles',
    color: '#FFC400',
    type: 'hard'
  },
  EVIDENCE: {
    name: 'Evidence-Based',
    description: 'Changes must have verifiable evidence chains',
    color: '#FFFFFF',
    type: 'hard'
  },
  SAFE: {
    name: 'Safe',
    description: 'Changes must pass safety verification',
    color: '#00FF00',
    type: 'hard'
  },
  REVERSIBLE: {
    name: 'Reversible',
    description: 'Changes must be rollback-capable',
    color: '#00E5FF',
    type: 'soft'
  },
  BENEFICIAL: {
    name: 'Beneficial',
    description: 'Changes must improve system performance',
    color: '#FF00FF',
    type: 'soft'
  }
};

const EVOLUTION_STAGES = {
  OBSERVE: {
    name: 'Observe',
    description: 'Monitor system behavior',
    color: '#00E5FF',
    position: { x: 1, y: 3.75 }
  },
  ANALYZE: {
    name: 'Analyze',
    description: 'Identify improvement opportunities',
    color: '#FF00FF',
    position: { x: 2.5, y: 3.75 }
  },
  PROPOSE: {
    name: 'Propose',
    description: 'Generate constitutional amendment',
    color: '#FFC400',
    position: { x: 4, y: 3.75 }
  },
  VERIFY: {
    name: 'Verify',
    description: 'Validate against constraints',
    color: '#FFFFFF',
    position: { x: 5.5, y: 3.75 }
  },
  DEPLOY: {
    name: 'Deploy',
    description: 'Apply to live system',
    color: '#00FF00',
    position: { x: 7, y: 3.75 }
  },
  MONITOR: {
    name: 'Monitor',
    description: 'Track improvement impact',
    color: '#00E5FF',
    position: { x: 8.5, y: 3.75 }
  }
};

class AdaptiveGovernanceEngine {
  constructor(pres) {
    this.pres = pres;
    this.governanceHistory = new Map();
  }

  renderAdaptiveGovernance(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('ADAPTIVE GOVERNANCE', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'adaptive_title' });

    // Subtitle
    slide.addText('Rules evolve under constraints. Governance is a substrate.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'adaptive_subtitle' });

    // Render evolution stages
    Object.entries(EVOLUTION_STAGES).forEach(([stageKey, stage]) => {
      const stageBounds = {
        x: bounds.x + stage.position.x * bounds.w / 10 - 0.4,
        y: bounds.y + stage.position.y * bounds.h / 7.5 - 0.4,
        w: 0.8,
        h: 0.8
      };

      const stageElements = this.renderEvolutionStage(slide, stageKey, stage, stageBounds, theme);
      elements.push(...stageElements);

      this.governanceHistory.set(stageKey, stageBounds);
    });

    // Render evolution connections
    const connectionElements = this.renderEvolutionConnections(slide, bounds, theme);
    elements.push(...connectionElements);

    // Render constraints
    const constraintElements = this.renderConstraints(slide, bounds, theme);
    elements.push(...constraintElements);

    return { elements };
  }

  renderEvolutionStage(slide, stageKey, stage, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Stage shape
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: stage.color, transparency: 85 },
      line: { color: stage.color, width: 2 }
    });
    elements.push({ type: 'ellipse', name: `evolution_stage_${stageKey}` });

    // Stage name
    slide.addText(stage.name, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.05,
      w: bounds.w - 0.1,
      h: 0.2,
      fontSize: 7,
      color: stage.color,
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: `evolution_stage_name_${stageKey}` });

    // Stage description
    slide.addText(stage.description, {
      x: bounds.x + 0.05,
      y: bounds.y + 0.25,
      w: bounds.w - 0.1,
      h: 0.15,
      fontSize: 5,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: `evolution_stage_desc_${stageKey}` });

    return elements;
  }

  renderEvolutionConnections(slide, bounds, theme) {
    const elements = [];
    const stageKeys = Object.keys(EVOLUTION_STAGES);

    for (let i = 0; i < stageKeys.length - 1; i++) {
      const from = stageKeys[i];
      const to = stageKeys[i + 1];

      const fromBounds = this.governanceHistory.get(from);
      const toBounds = this.governanceHistory.get(to);

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
        elements.push({ type: 'line', name: `evolution_conn_${from}_${to}` });

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
        elements.push({ type: 'triangle', name: `evolution_arrow_${from}_${to}` });
      }
    }

    // Feedback loop from Monitor back to Observe
    const monitorBounds = this.governanceHistory.get('MONITOR');
    const observeBounds = this.governanceHistory.get('OBSERVE');

    if (monitorBounds && observeBounds) {
      const monitorCenterX = monitorBounds.x + monitorBounds.w / 2;
      const monitorCenterY = monitorBounds.y + monitorBounds.h / 2;
      const observeCenterX = observeBounds.x + observeBounds.w / 2;
      const observeCenterY = observeBounds.y + observeBounds.h / 2;

      // Curved feedback line
      const midX = (monitorCenterX + observeCenterX) / 2;
      const midY = monitorCenterY + 1;

      slide.addShape(this.pres.ShapeType.line, {
        x: monitorCenterX,
        y: monitorCenterY,
        w: midX - monitorCenterX,
        h: midY - monitorCenterY,
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: 'evolution_feedback_1' });

      slide.addShape(this.pres.ShapeType.line, {
        x: midX,
        y: midY,
        w: observeCenterX - midX,
        h: observeCenterY - midY,
        line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: 'evolution_feedback_2' });

      // Feedback label
      slide.addText('CONTINUOUS IMPROVEMENT', {
        x: midX - 0.6,
        y: midY - 0.05,
        w: 1.2,
        h: 0.1,
        fontSize: 5,
        color: '#666666',
        align: 'center',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: 'evolution_feedback_label' });
    }

    return elements;
  }

  renderConstraints(slide, bounds, theme) {
    const elements = [];
    const constraintY = bounds.y + bounds.h - 1.2;
    const constraintSpacing = 0.15;

    slide.addText('EVOLUTION CONSTRAINTS', {
      x: bounds.x + 0.2,
      y: constraintY,
      w: 2,
      h: 0.15,
      fontSize: 8,
      color: theme.primary || '#00E5FF',
      bold: true
    });
    elements.push({ type: 'text', name: 'constraints_title' });

    Object.entries(ADAPTIVE_CONSTRAINTS).forEach(([key, constraint], index) => {
      const y = constraintY + 0.2 + index * constraintSpacing;

      // Constraint type indicator
      const typeColor = constraint.type === 'hard' ? '#FF0000' : '#00FF00';
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x + 0.2,
        y: y,
        w: 0.06,
        h: 0.06,
        fill: { color: typeColor, transparency: 70 },
        line: { color: typeColor, width: 1 }
      });
      elements.push({ type: 'ellipse', name: `constraint_type_${index}` });

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

      // Type label
      slide.addText(constraint.type.toUpperCase(), {
        x: bounds.x + 9.2,
        y: y - 0.03,
        w: 0.6,
        h: 0.1,
        fontSize: 5,
        color: typeColor,
        align: 'right',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `constraint_type_label_${index}` });
    });

    return elements;
  }

  renderStaticVsAdaptive(slide, bounds, theme) {
    const elements = [];

    // Title
    slide.addText('STATIC vs ADAPTIVE GOVERNANCE', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.25,
      fontSize: 14,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'static_adaptive_title' });

    // Subtitle
    slide.addText('Static governance is documentation. Adaptive governance is a substrate.', {
      x: bounds.x,
      y: bounds.y + 0.3,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'static_adaptive_subtitle' });

    // Static governance column
    slide.addText('STATIC GOVERNANCE', {
      x: bounds.x + 0.5,
      y: bounds.y + 0.6,
      w: 4,
      h: 0.2,
      fontSize: 10,
      color: '#FF0000',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'static_title' });

    const staticCharacteristics = [
      'Rules exist',
      'Documentation',
      'Manual updates',
      'No evolution',
      'Static compliance',
      'One-time validation'
    ];

    const staticY = bounds.y + 0.9;
    const staticSpacing = 0.15;

    staticCharacteristics.forEach((char, index) => {
      const y = staticY + index * staticSpacing;

      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x + 0.7,
        y: y + 0.05,
        w: 0.1,
        h: 0,
        line: { color: '#FF0000', width: 2 }
      });
      elements.push({ type: 'line', name: `static_bullet_${index}` });

      slide.addText(char, {
        x: bounds.x + 0.9,
        y: y,
        w: 3.5,
        h: 0.1,
        fontSize: 7,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `static_char_${index}` });
    });

    // Adaptive governance column
    slide.addText('ADAPTIVE GOVERNANCE', {
      x: bounds.x + 5.5,
      y: bounds.y + 0.6,
      w: 4,
      h: 0.2,
      fontSize: 10,
      color: '#00FF00',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'adaptive_title' });

    const adaptiveCharacteristics = [
      'Rules evolve',
      'Substrate',
      'Automatic updates',
      'Continuous evolution',
      'Dynamic compliance',
      'Continuous validation'
    ];

    const adaptiveY = bounds.y + 0.9;
    const adaptiveSpacing = 0.15;

    adaptiveCharacteristics.forEach((char, index) => {
      const y = adaptiveY + index * adaptiveSpacing;

      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x + 5.7,
        y: y + 0.05,
        w: 0.1,
        h: 0,
        line: { color: '#00FF00', width: 2 }
      });
      elements.push({ type: 'line', name: `adaptive_bullet_${index}` });

      slide.addText(char, {
        x: bounds.x + 5.9,
        y: y,
        w: 3.5,
        h: 0.1,
        fontSize: 7,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `adaptive_char_${index}` });
    });

    // Arrow between columns
    const arrowX = bounds.x + bounds.w / 2;
    const arrowY = bounds.y + bounds.h / 2;

    slide.addShape(this.pres.ShapeType.line, {
      x: arrowX - 0.5,
      y: arrowY,
      w: 1,
      h: 0,
      line: { color: theme.primary || '#00E5FF', width: 3 }
    });
    elements.push({ type: 'line', name: 'transition_arrow' });

    slide.addShape(this.pres.ShapeType.triangle, {
      x: arrowX + 0.5,
      y: arrowY - 0.08,
      w: 0.16,
      h: 0.16,
      fill: { color: theme.primary || '#00E5FF', transparency: 70 },
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'triangle', name: 'transition_arrow_head' });

    return { elements };
  }

  getConstraint(constraintKey) {
    return ADAPTIVE_CONSTRAINTS[constraintKey];
  }

  getAllConstraints() {
    return ADAPTIVE_CONSTRAINTS;
  }

  getEvolutionStage(stageKey) {
    return EVOLUTION_STAGES[stageKey];
  }

  getAllEvolutionStages() {
    return EVOLUTION_STAGES;
  }
}

module.exports = {
  AdaptiveGovernanceEngine,
  ADAPTIVE_CONSTRAINTS,
  EVOLUTION_STAGES
};
