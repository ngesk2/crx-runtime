// ── HUMAN EDITABILITY RULE ─────────────────────────────────────────────
// V14: Every semantic system must be editable with a single click
// Examples: Gateway (portal, label, glow, metadata grouped), Authority Reactor (reactor, rings, annotations, labels grouped)
// No fragmented assemblies. One click. One edit.

const EDITABILITY_GROUPS = {
  GATEWAY: {
    components: ['portal', 'label', 'glow', 'metadata', 'frame'],
    grouping: 'architectural_assembly'
  },
  AUTHORITY: {
    components: ['reactor', 'rings', 'annotations', 'labels', 'indicators'],
    grouping: 'reactor_assembly'
  },
  EVENT_LOG: {
    components: ['archive', 'layers', 'texture', 'base'],
    grouping: 'archive_assembly'
  },
  WITNESS: {
    components: ['observatory', 'dome', 'ports', 'status'],
    grouping: 'observatory_assembly'
  },
  REPLAY: {
    components: ['orbital_system', 'rings', 'core', 'navigation'],
    grouping: 'orbital_assembly'
  },
  PROJECTION: {
    components: ['hologram', 'beams', 'scan_lines', 'viewport'],
    grouping: 'projection_assembly'
  },
  AGENTS: {
    components: ['industrial_units', 'connectors', 'indicators', 'assembly_line'],
    grouping: 'workforce_assembly'
  },
  BRAIN: {
    components: ['neural_hub', 'nodes', 'connections', 'pulses'],
    grouping: 'neural_assembly'
  },
  KNOWLEDGE: {
    components: ['clusters', 'nodes', 'relationships', 'graph'],
    grouping: 'knowledge_assembly'
  },
  EXECUTION: {
    components: ['core', 'cooling', 'flows', 'barriers'],
    grouping: 'execution_assembly'
  },
  GOVERNANCE: {
    components: ['chamber', 'rings', 'streams', 'displays'],
    grouping: 'governance_assembly'
  },
  SELF_IMPROVEMENT: {
    components: ['evolution_core', 'rings', 'patterns', 'mutations'],
    grouping: 'evolution_assembly'
  }
};

const EDITABILITY_RULES = {
  MAX_GROUP_SIZE: 20, // Maximum number of components in a single group
  MIN_GROUP_COHESION: 0.8, // Minimum semantic cohesion (0-1)
  MAX_GROUP_DISTANCE: 2.0, // Maximum distance between grouped components (inches)
  SINGLE_CLICK_EDIT: true, // All components must be selectable with one click
  GROUP_NAMING: 'semantic', // Groups must be named by semantic type
  VISUAL_BOUNDARY: true, // Groups must have visual boundary indication
  METADATA_INCLUSION: true // Groups must include metadata components
};

class HumanEditabilityEngine {
  constructor(pres) {
    this.pres = pres;
    this.groupHistory = new Map();
  }

  createGroup(slide, semanticType, bounds, theme) {
    const groupConfig = EDITABILITY_GROUPS[semanticType];
    if (!groupConfig) return [];

    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Visual boundary (group frame)
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x - 0.1,
      y: bounds.y - 0.1,
      w: bounds.w + 0.2,
      h: bounds.h + 0.2,
      fill: { color: '#1A1A1F', transparency: 95 },
      line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'rect', name: `group_boundary_${semanticType}`, isGroupBoundary: true });

    // Group label (metadata)
    slide.addText(groupConfig.grouping, {
      x: bounds.x - 0.15,
      y: bounds.y - 0.25,
      w: 2,
      h: 0.15,
      fontSize: 6,
      color: '#666666',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: `group_label_${semanticType}`, isMetadata: true });

    // Edit indicator (visual cue that this is editable)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: bounds.x + bounds.w + 0.05,
      y: bounds.y + bounds.h + 0.05,
      w: 0.1,
      h: 0.1,
      fill: { color: '#00FF00', transparency: 70 },
      line: { color: '#00FF00', width: 1 }
    });
    elements.push({ type: 'ellipse', name: `group_edit_indicator_${semanticType}`, isEditIndicator: true });

    this.groupHistory.set(semanticType, { bounds, components: groupConfig.components, grouping: groupConfig.grouping });
    return elements;
  }

  validateGroupCohesion(slide, semanticType, objects) {
    const groupConfig = EDITABILITY_GROUPS[semanticType];
    if (!groupConfig) return { valid: true, message: 'No group config' };

    const groupObjects = objects.filter(obj => obj.semanticType === semanticType || obj.group === semanticType);
    
    // Check if all required components are present
    const missingComponents = groupConfig.components.filter(comp => 
      !groupObjects.some(obj => obj.component === comp || obj.name?.includes(comp))
    );

    if (missingComponents.length > 0) {
      return { valid: false, message: `Missing components: ${missingComponents.join(', ')}` };
    }

    // Check group size
    if (groupObjects.length > EDITABILITY_RULES.MAX_GROUP_SIZE) {
      return { valid: false, message: `Group too large: ${groupObjects.length} components (max: ${EDITABILITY_RULES.MAX_GROUP_SIZE})` };
    }

    // Check spatial coherence
    const distances = this.calculateGroupDistances(groupObjects);
    const maxDistance = Math.max(...distances);
    
    if (maxDistance > EDITABILITY_RULES.MAX_GROUP_DISTANCE) {
      return { valid: false, message: `Group too dispersed: max distance ${maxDistance.toFixed(2)} inches (max: ${EDITABILITY_RULES.MAX_GROUP_DISTANCE})` };
    }

    return { valid: true, componentCount: groupObjects.length, maxDistance };
  }

  calculateGroupDistances(objects) {
    if (objects.length < 2) return [0];

    const distances = [];
    const centers = objects.map(obj => ({
      x: (obj.x || 0) + (obj.w || 0) / 2,
      y: (obj.y || 0) + (obj.h || 0) / 2
    }));

    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        const distance = Math.sqrt(
          Math.pow(centers[j].x - centers[i].x, 2) +
          Math.pow(centers[j].y - centers[i].y, 2)
        );
        distances.push(distance);
      }
    }

    return distances;
  }

  renderEditabilityGuide(slide, bounds, theme) {
    const elements = [];
    
    // Guide title
    slide.addText('HUMAN EDITABILITY RULE', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.2,
      fontSize: 11,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'editability_title' });

    // Rule description
    slide.addText('Every semantic system must be editable with a single click', {
      x: bounds.x,
      y: bounds.y + 0.25,
      w: bounds.w,
      h: 0.15,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'editability_description' });

    // Example groups
    const exampleY = bounds.y + 0.5;
    const exampleSpacing = bounds.h / 4;
    
    Object.entries(EDITABILITY_GROUPS).forEach(([semanticType, config], index) => {
      const y = exampleY + index * exampleSpacing;
      
      // Group name
      slide.addText(semanticType, {
        x: bounds.x + 0.2,
        y: y,
        w: 1.5,
        h: 0.15,
        fontSize: 8,
        color: theme.primary || '#00E5FF',
        bold: true
      });
      elements.push({ type: 'text', name: `editability_example_name_${index}` });

      // Group components
      slide.addText(config.components.join(', '), {
        x: bounds.x + 2,
        y: y,
        w: 6,
        h: 0.15,
        fontSize: 7,
        color: '#CCCCCC',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `editability_example_components_${index}` });

      // Group type
      slide.addText(config.grouping, {
        x: bounds.x + 8.2,
        y: y,
        w: 1.5,
        h: 0.15,
        fontSize: 7,
        color: '#666666',
        align: 'right'
      });
      elements.push({ type: 'text', name: `editability_example_type_${index}` });
    });

    // Rules summary
    const rulesY = bounds.y + bounds.h - 0.8;
    const rules = [
      `Max group size: ${EDITABILITY_RULES.MAX_GROUP_SIZE} components`,
      `Max group distance: ${EDITABILITY_RULES.MAX_GROUP_DISTANCE} inches`,
      `Single-click edit: ${EDITABILITY_RULES.SINGLE_CLICK_EDIT ? 'Yes' : 'No'}`,
      `Visual boundary: ${EDITABILITY_RULES.VISUAL_BOUNDARY ? 'Yes' : 'No'}`,
      `Metadata inclusion: ${EDITABILITY_RULES.METADATA_INCLUSION ? 'Yes' : 'No'}`
    ];

    rules.forEach((rule, index) => {
      slide.addText(rule, {
        x: bounds.x + 0.2,
        y: rulesY + index * 0.12,
        w: bounds.w - 0.4,
        h: 0.1,
        fontSize: 6,
        color: '#666666',
        fontFace: 'Courier New'
      });
      elements.push({ type: 'text', name: `editability_rule_${index}` });
    });

    return { elements };
  }

  validateAllGroups(slide, objects) {
    const violations = [];

    Object.keys(EDITABILITY_GROUPS).forEach(semanticType => {
      const validation = this.validateGroupCohesion(slide, semanticType, objects);
      if (!validation.valid) {
        violations.push({ semanticType, message: validation.message });
      }
    });

    return { valid: violations.length === 0, violations };
  }

  getGroupConfig(semanticType) {
    return EDITABILITY_GROUPS[semanticType];
  }

  getAllGroupConfigs() {
    return EDITABILITY_GROUPS;
  }
}

module.exports = {
  HumanEditabilityEngine,
  EDITABILITY_GROUPS,
  EDITABILITY_RULES
};
