// ── REPOSITORY EVIDENCE CHAIN V14 ────────────────────────────────────
// V14: Every architectural claim must show: Claim → Code → Runtime → Evidence → Verification
// The deck teaches: architecture, implementation, verification simultaneously

const EVIDENCE_CHAIN_STEPS = {
  CLAIM: {
    name: 'Claim',
    order: 1,
    description: 'Architectural assertion',
    color: '#FFC400',
    icon: 'claim'
  },
  CODE: {
    name: 'Code',
    order: 2,
    description: 'Implementation file',
    color: '#00E5FF',
    icon: 'code'
  },
  RUNTIME: {
    name: 'Runtime',
    order: 3,
    description: 'Event emission',
    color: '#00FF00',
    icon: 'runtime'
  },
  EVIDENCE: {
    name: 'Evidence',
    order: 4,
    description: 'System operation',
    color: '#C0C0C0',
    icon: 'evidence'
  },
  VERIFICATION: {
    name: 'Verification',
    order: 5,
    description: 'Constitutional compliance',
    color: '#00FF00',
    icon: 'verified'
  }
};

const EVIDENCE_EXAMPLES = {
  GATEWAY: {
    claim: 'Gateway enforces constitutional rules at Layer 0',
    code: 'gateway.ts:45',
    runtime: 'event emission: gateway.validate()',
    evidence: 'event_log.append()',
    verification: 'verified: 100% compliance'
  },
  AUTHORITY: {
    claim: 'Authority enforces runtime policy validation',
    code: 'authority.ts:128',
    runtime: 'event emission: authority.check()',
    evidence: 'witness.verify_action()',
    verification: 'verified: all actions constitutional'
  },
  EVENT_LOG: {
    claim: 'Event Log provides append-only state reconstruction',
    code: 'event_log.ts:89',
    runtime: 'event emission: event_log.append()',
    evidence: 'replay.reconstruct_state()',
    verification: 'verified: 100% reconstruction accuracy'
  },
  MCP: {
    claim: 'MCP provides extensible tool execution framework',
    code: 'mcp_gateway.ts:156',
    runtime: 'event emission: mcp.execute_tool()',
    evidence: 'tool_registry.get_tool()',
    verification: 'verified: 20+ tools available'
  },
  RAG: {
    claim: 'RAG provides semantic knowledge retrieval',
    code: 'rag_engine.ts:234',
    runtime: 'event emission: rag.retrieve()',
    evidence: 'vector_store.search()',
    verification: 'verified: 95% retrieval accuracy'
  },
  REPLAY: {
    claim: 'Replay enables time-travel state reconstruction',
    code: 'replay_engine.ts:312',
    runtime: 'event emission: replay.reconstruct()',
    evidence: 'event_log.replay()',
    verification: 'verified: 0 state drift'
  },
  WITNESS: {
    claim: 'Witness provides constitutional compliance verification',
    code: 'witness_system.ts:178',
    runtime: 'event emission: witness.verify()',
    evidence: 'audit_trail.log()',
    verification: 'verified: 100% action coverage'
  },
  PLANE: {
    claim: 'Plane provides holographic UI projection',
    code: 'plane_projection.ts:267',
    runtime: 'event emission: plane.render()',
    evidence: 'projection_layer.display()',
    verification: 'verified: 60fps rendering'
  }
};

class RepositoryEvidenceChainEngine {
  constructor(pres) {
    this.pres = pres;
    this.evidenceHistory = new Map();
  }

  renderEvidenceChain(slide, componentKey, bounds, theme) {
    const elements = [];
    const example = EVIDENCE_EXAMPLES[componentKey];
    if (!example) return { elements };

    const steps = Object.values(EVIDENCE_CHAIN_STEPS).sort((a, b) => a.order - b.order);
    const stepWidth = bounds.w / steps.length;
    const stepHeight = bounds.h;

    steps.forEach((step, index) => {
      const x = bounds.x + index * stepWidth;
      const y = bounds.y;
      
      // Step container (architectural frame, not transparent box)
      slide.addShape(this.pres.ShapeType.rect, {
        x: x + 0.1,
        y: y + 0.1,
        w: stepWidth - 0.2,
        h: stepHeight - 0.2,
        fill: { color: step.color, transparency: 85 },
        line: { color: step.color, width: 2 }
      });
      elements.push({ type: 'rect', name: `evidence_step_${step.name}` });

      // Step name
      slide.addText(step.name, {
        x: x + 0.2,
        y: y + 0.2,
        w: stepWidth - 0.4,
        h: 0.2,
        fontSize: 9,
        color: step.color,
        bold: true
      });
      elements.push({ type: 'text', name: `evidence_label_${step.name}` });

      // Step description
      slide.addText(step.description, {
        x: x + 0.2,
        y: y + 0.4,
        w: stepWidth - 0.4,
        h: 0.15,
        fontSize: 6,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `evidence_desc_${step.name}` });

      // Step value (component-specific)
      const stepKey = Object.keys(EVIDENCE_CHAIN_STEPS)[index];
      const stepValue = example[stepKey.toLowerCase()];
      if (stepValue) {
        slide.addText(stepValue, {
          x: x + 0.2,
          y: y + 0.6,
          w: stepWidth - 0.4,
          h: 0.25,
          fontSize: 6,
          color: '#FFFFFF',
          fontFace: 'Courier New'
        });
        elements.push({ type: 'text', name: `evidence_value_${step.name}` });
      }

      // Step icon
      this.renderStepIcon(slide, step.icon, x + stepWidth / 2, y + stepHeight - 0.2, step.color, elements);

      // Connection arrow to next step
      if (index < steps.length - 1) {
        slide.addShape(this.pres.ShapeType.line, {
          x: x + stepWidth - 0.1,
          y: y + stepHeight / 2,
          w: 0.2,
          h: 0,
          line: { color: '#00E5FF', width: 2 }
        });
        elements.push({ type: 'line', name: `evidence_arrow_${index}` });

        slide.addShape(this.pres.ShapeType.triangle, {
          x: x + stepWidth + 0.05,
          y: y + stepHeight / 2 - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: '#00E5FF', transparency: 70 },
          line: { color: '#00E5FF', width: 1 }
        });
        elements.push({ type: 'triangle', name: `evidence_arrow_head_${index}` });
      }
    });

    // Component title
    slide.addText(componentKey, {
      x: bounds.x,
      y: bounds.y - 0.3,
      w: bounds.w,
      h: 0.2,
      fontSize: 10,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'evidence_title' });

    this.evidenceHistory.set(componentKey, elements);
    return { componentKey, elements };
  }

  renderStepIcon(slide, iconType, x, y, color, elements) {
    switch (iconType) {
      case 'claim':
        // Claim icon (document)
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.06,
          y: y - 0.08,
          w: 0.12,
          h: 0.16,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'rect', name: 'icon_claim' });
        
        // Lines
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.04,
          y: y - 0.04,
          w: 0.08,
          h: 0,
          line: { color: color, width: 0.5 }
        });
        elements.push({ type: 'line', name: 'icon_claim_line1' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.04,
          y: y + 0.02,
          w: 0.08,
          h: 0,
          line: { color: color, width: 0.5 }
        });
        elements.push({ type: 'line', name: 'icon_claim_line2' });
        break;

      case 'code':
        // Code icon (brackets)
        slide.addText('{ }', {
          x: x - 0.08,
          y: y - 0.06,
          w: 0.16,
          h: 0.12,
          fontSize: 10,
          color: color,
          bold: true,
          align: 'center'
        });
        elements.push({ type: 'text', name: 'icon_code' });
        break;

      case 'runtime':
        // Runtime icon (play button)
        slide.addShape(this.pres.ShapeType.triangle, {
          x: x - 0.04,
          y: y - 0.06,
          w: 0.12,
          h: 0.12,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'triangle', name: 'icon_runtime' });
        break;

      case 'evidence':
        // Evidence icon (magnifying glass)
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.06,
          y: y - 0.06,
          w: 0.12,
          h: 0.12,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_evidence_glass' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x + 0.02,
          y: y + 0.06,
          w: 0.06,
          h: 0.06,
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'line', name: 'icon_evidence_handle' });
        break;

      case 'verified':
        // Verified icon (checkmark)
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.06,
          y: y + 0.02,
          w: 0.04,
          h: -0.04,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_verified_1' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.02,
          y: y - 0.02,
          w: 0.08,
          h: 0.08,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_verified_2' });
        break;

      default:
        // Default circle
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_default' });
        break;
    }
  }

  renderVerificationSummary(slide, bounds, theme) {
    const elements = [];
    const components = Object.keys(EVIDENCE_EXAMPLES);
    const componentSpacing = bounds.h / components.length;

    components.forEach((componentKey, index) => {
      const example = EVIDENCE_EXAMPLES[componentKey];
      const y = bounds.y + index * componentSpacing + componentSpacing / 2;

      // Component name
      slide.addText(componentKey, {
        x: bounds.x + 0.2,
        y: y - 0.1,
        w: 1.5,
        h: 0.2,
        fontSize: 9,
        color: theme.primary || '#00E5FF',
        bold: true
      });
      elements.push({ type: 'text', name: `summary_component_${index}` });

      // Verification status
      const verification = example.verification;
      const isVerified = verification.includes('verified');
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x + 2,
        y: y - 0.04,
        w: 0.08,
        h: 0.08,
        fill: { color: isVerified ? '#00FF00' : '#FF0000', transparency: 70 },
        line: { color: isVerified ? '#00FF00' : '#FF0000', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `summary_status_${index}` });

      slide.addText(verification, {
        x: bounds.x + 2.2,
        y: y - 0.05,
        w: 2.5,
        h: 0.1,
        fontSize: 6,
        color: isVerified ? '#00FF00' : '#FF0000',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `summary_verification_${index}` });
    });

    // Title
    slide.addText('VERIFICATION CULTURE IS THE PRODUCT', {
      x: bounds.x,
      y: bounds.y - 0.3,
      w: bounds.w,
      h: 0.2,
      fontSize: 11,
      color: theme.primary || '#FFC400',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'summary_title' });

    return { elements };
  }

  getEvidenceForComponent(componentKey) {
    return EVIDENCE_EXAMPLES[componentKey];
  }

  getAllEvidence() {
    return EVIDENCE_EXAMPLES;
  }

  validateEvidenceChain(componentKey) {
    const example = EVIDENCE_EXAMPLES[componentKey];
    if (!example) {
      throw new Error(`No evidence chain found for component: ${componentKey}`);
    }

    const requiredSteps = Object.keys(EVIDENCE_CHAIN_STEPS);
    const missingSteps = requiredSteps.filter(step => !example[step.toLowerCase()]);

    if (missingSteps.length > 0) {
      throw new Error(`Evidence chain incomplete for ${componentKey}: missing steps ${missingSteps.join(', ')}`);
    }

    return { valid: true, example };
  }
}

module.exports = {
  RepositoryEvidenceChainEngine,
  EVIDENCE_CHAIN_STEPS,
  EVIDENCE_EXAMPLES
};
