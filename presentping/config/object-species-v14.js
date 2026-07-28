// ── OBJECT SPECIES SYSTEM V14 ─────────────────────────────────────────
// Enhanced object species with unique silhouettes for V14
// Gateway: Portal, Authority: Reactor, Event Log: Archive Foundation, Witness: Observatory, Replay: Orbital System, Projection: Holographic Structure, Agents: Industrial Workforce, Brain: Neural Constellation

const OBJECT_SPECIES_V14 = {
  GATEWAY: {
    name: 'Portal',
    geometry: 'arched_entryway',
    characteristics: ['entry_point', 'layer_0', 'constitutional', 'enforcement'],
    renderingHints: ['curved_arch', 'glow_effects', 'prominent_position', 'frame_structure'],
    silhouette: 'arched_doorway_with_frame'
  },
  AUTHORITY: {
    name: 'Reactor',
    geometry: 'concentric_rings',
    characteristics: ['policy_enforcement', 'constitutional', 'validation', 'governance'],
    renderingHints: ['multiple_rings', 'energy_glow', 'center_placement', 'power_indicators'],
    silhouette: 'circular_reactor_with_rings'
  },
  EVENT_LOG: {
    name: 'Archive Foundation',
    geometry: 'layered_archive',
    characteristics: ['foundational', 'persistent', 'append_only', 'event_sourcing'],
    renderingHints: ['horizontal_layers', 'solid_base', 'bottom_placement', 'stack_appearance'],
    silhouette: 'horizontal_stack_of_layers'
  },
  WITNESS: {
    name: 'Observatory',
    geometry: 'domed_structure',
    characteristics: ['verification', 'compliance', 'audit', 'observation'],
    renderingHints: ['dome_shape', 'viewing_ports', 'elevated_position', 'status_indicators'],
    silhouette: 'domed_observatory_with_ports'
  },
  REPLAY: {
    name: 'Orbital System',
    geometry: 'orbital_rings',
    characteristics: ['time_travel', 'state_reconstruction', 'event_sourcing', 'navigation'],
    renderingHints: ['concentric_orbits', 'time_streams', 'center_core', 'navigation_controls'],
    silhouette: 'orbital_system_with_time_streams'
  },
  PROJECTION: {
    name: 'Holographic Structure',
    geometry: 'holographic_projection',
    characteristics: ['visual', 'holographic', 'ui_layer', 'plane'],
    renderingHints: ['translucent_fill', 'dashed_lines', 'glow_effects', 'projection_beams'],
    silhouette: 'holographic_projection_with_beams'
  },
  AGENTS: {
    name: 'Industrial Workforce',
    geometry: 'industrial_units',
    characteristics: ['autonomous', 'tool_orchestration', 'execution', 'mcp'],
    renderingHints: ['mechanical_appearance', 'connector_ports', 'active_indicators', 'assembly_line'],
    silhouette: 'industrial_units_with_connectors'
  },
  BRAIN: {
    name: 'Neural Constellation',
    geometry: 'neural_network',
    characteristics: ['orchestration', 'planning', 'routing', 'intelligence'],
    renderingHints: ['node_network', 'connection_lines', 'central_hub', 'pulsing_activity'],
    silhouette: 'neural_constellation_with_connections'
  },
  KNOWLEDGE: {
    name: 'Knowledge Graph',
    geometry: 'network_structure',
    characteristics: ['semantic', 'retrieval', 'rag', 'vector_search'],
    renderingHints: ['node_clusters', 'relationship_lines', 'semantic_colors', 'graph_layout'],
    silhouette: 'network_graph_with_clusters'
  },
  EXECUTION: {
    name: 'Execution Core',
    geometry: 'reactor_core',
    characteristics: ['execution', 'workflow', 'task_routing', 'resource_management'],
    renderingHints: ['core_structure', 'cooling_systems', 'energy_flows', 'safety_barriers'],
    silhouette: 'reactor_core_with_cooling'
  },
  GOVERNANCE: {
    name: 'Governance Chamber',
    geometry: 'circular_chamber',
    characteristics: ['governance', 'self_improvement', 'constitutional_evolution', 'policy_generation'],
    renderingHints: ['circular_layout', 'governance_rings', 'evolution_streams', 'decision_displays'],
    silhouette: 'circular_chamber_with_rings'
  },
  SELF_IMPROVEMENT: {
    name: 'Evolution Engine',
    geometry: 'evolution_core',
    characteristics: ['optimization', 'pattern_learning', 'constitutional_mutation', 'evolution'],
    renderingHints: ['evolution_rings', 'pattern_streams', 'mutation_displays', 'progress_indicators'],
    silhouette: 'evolution_core_with_patterns'
  }
};

class ObjectSpeciesRendererV14 {
  constructor(pres) {
    this.pres = pres;
  }

  renderSpecies(slide, species, bounds, theme) {
    switch (species) {
      case 'GATEWAY':
        return this.renderPortalV14(slide, bounds, theme);
      case 'AUTHORITY':
        return this.renderReactorV14(slide, bounds, theme);
      case 'EVENT_LOG':
        return this.renderArchiveFoundationV14(slide, bounds, theme);
      case 'WITNESS':
        return this.renderObservatoryV14(slide, bounds, theme);
      case 'REPLAY':
        return this.renderOrbitalSystemV14(slide, bounds, theme);
      case 'PROJECTION':
        return this.renderHolographicStructureV14(slide, bounds, theme);
      case 'AGENTS':
        return this.renderIndustrialWorkforceV14(slide, bounds, theme);
      case 'BRAIN':
        return this.renderNeuralConstellationV14(slide, bounds, theme);
      case 'KNOWLEDGE':
        return this.renderKnowledgeGraphV14(slide, bounds, theme);
      case 'EXECUTION':
        return this.renderExecutionCoreV14(slide, bounds, theme);
      case 'GOVERNANCE':
        return this.renderGovernanceChamberV14(slide, bounds, theme);
      case 'SELF_IMPROVEMENT':
        return this.renderEvolutionEngineV14(slide, bounds, theme);
      default:
        return this.renderDefaultV14(slide, bounds, theme);
    }
  }

  renderPortalV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Arched entryway frame
    const archWidth = bounds.w * 0.7;
    const archHeight = bounds.h * 0.8;
    
    // Left pillar
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX - archWidth / 2 - 0.15,
      y: centerY - archHeight / 2,
      w: 0.3,
      h: archHeight,
      fill: { color: theme.primary || '#00E5FF', transparency: 50 },
      line: { color: theme.primary || '#00E5FF', width: 3 }
    });
    elements.push({ type: 'rect', name: 'portal_left_pillar' });
    
    // Right pillar
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX + archWidth / 2 - 0.15,
      y: centerY - archHeight / 2,
      w: 0.3,
      h: archHeight,
      fill: { color: theme.primary || '#00E5FF', transparency: 50 },
      line: { color: theme.primary || '#00E5FF', width: 3 }
    });
    elements.push({ type: 'rect', name: 'portal_right_pillar' });
    
    // Top arch (ellipse)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - archWidth / 2,
      y: centerY - archHeight / 2 - archWidth * 0.4,
      w: archWidth,
      h: archWidth * 0.8,
      fill: { color: theme.primary || '#00E5FF', transparency: 70 },
      line: { color: theme.primary || '#00E5FF', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'portal_arch' });
    
    // Inner glow
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - archWidth * 0.35,
      y: centerY - archHeight * 0.35,
      w: archWidth * 0.7,
      h: archHeight * 0.7,
      fill: { color: theme.primary || '#00E5FF', transparency: 90 },
      line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'portal_glow' });
    
    // Frame structure (architectural frame, not transparent box)
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX - archWidth / 2 - 0.2,
      y: centerY - archHeight / 2 - archWidth * 0.5,
      w: archWidth + 0.4,
      h: archHeight + archWidth * 0.5,
      fill: { color: '#1A1A1F', transparency: 90 },
      line: { color: theme.primary || '#00E5FF', width: 1 }
    });
    elements.push({ type: 'rect', name: 'portal_frame' });
    
    return elements;
  }

  renderReactorV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Concentric rings (reactor)
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const radius = Math.min(bounds.w, bounds.h) * 0.4 * (1 - i * 0.15);
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - radius,
        y: centerY - radius,
        w: radius * 2,
        h: radius * 2,
        fill: { color: theme.primary || '#FFC400', transparency: 60 + i * 8 },
        line: { color: theme.primary || '#FFC400', width: 3 - i * 0.4 }
      });
      elements.push({ type: 'ellipse', name: `reactor_ring_${i}` });
    }
    
    // Energy glow (center)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.3,
      y: centerY - 0.3,
      w: 0.6,
      h: 0.6,
      fill: { color: theme.primary || '#FFC400', transparency: 40 },
      line: { color: theme.primary || '#FFC400', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'reactor_core' });
    
    // Power indicators (small markers on rings)
    const indicatorCount = 8;
    for (let i = 0; i < indicatorCount; i++) {
      const angle = (i / indicatorCount) * Math.PI * 2;
      const radius = Math.min(bounds.w, bounds.h) * 0.4 * 0.7;
      const ix = centerX + Math.cos(angle) * radius;
      const iy = centerY + Math.sin(angle) * radius;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: ix - 0.04,
        y: iy - 0.04,
        w: 0.08,
        h: 0.08,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `reactor_indicator_${i}` });
    }
    
    return elements;
  }

  renderArchiveFoundationV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Horizontal layers (stack)
    const layerCount = 5;
    for (let i = 0; i < layerCount; i++) {
      const layerWidth = bounds.w * (1 - i * 0.12);
      const layerHeight = bounds.h * 0.15;
      const layerY = centerY + bounds.h * 0.35 - i * layerHeight;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: centerX - layerWidth / 2,
        y: layerY,
        w: layerWidth,
        h: layerHeight,
        fill: { color: theme.primary || '#C0C0C0', transparency: 50 + i * 8 },
        line: { color: theme.primary || '#C0C0C0', width: 2 }
      });
      elements.push({ type: 'rect', name: `archive_layer_${i}` });
    }
    
    // Solid base
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX - bounds.w * 0.4,
      y: centerY + bounds.h * 0.35,
      w: bounds.w * 0.8,
      h: bounds.h * 0.1,
      fill: { color: theme.primary || '#C0C0C0', transparency: 40 },
      line: { color: theme.primary || '#C0C0C0', width: 3 }
    });
    elements.push({ type: 'rect', name: 'archive_base' });
    
    return elements;
  }

  renderObservatoryV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Dome shape
    const domeRadius = Math.min(bounds.w, bounds.h) * 0.4;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - domeRadius,
      y: centerY - domeRadius * 1.2,
      w: domeRadius * 2,
      h: domeRadius * 2.4,
      fill: { color: theme.primary || '#FFC400', transparency: 60 },
      line: { color: theme.primary || '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'observatory_dome' });
    
    // Viewing ports (windows)
    const portCount = 4;
    for (let i = 0; i < portCount; i++) {
      const angle = (i / portCount) * Math.PI * 2;
      const portRadius = domeRadius * 0.3;
      const px = centerX + Math.cos(angle) * domeRadius * 0.5;
      const py = centerY - domeRadius * 0.6 + Math.sin(angle) * domeRadius * 0.3;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: px - portRadius,
        y: py - portRadius,
        w: portRadius * 2,
        h: portRadius * 2,
        fill: { color: '#00E5FF', transparency: 70 },
        line: { color: '#00E5FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `observatory_port_${i}` });
    }
    
    // Elevated position (base)
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX - domeRadius * 0.6,
      y: centerY + domeRadius * 0.2,
      w: domeRadius * 1.2,
      h: bounds.h * 0.3,
      fill: { color: theme.primary || '#FFC400', transparency: 50 },
      line: { color: theme.primary || '#FFC400', width: 2 }
    });
    elements.push({ type: 'rect', name: 'observatory_base' });
    
    // Status indicators
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.05,
      y: centerY - domeRadius * 0.8,
      w: 0.1,
      h: 0.1,
      fill: { color: '#00FF00', transparency: 70 },
      line: { color: '#00FF00', width: 1 }
    });
    elements.push({ type: 'ellipse', name: 'observatory_status' });
    
    return elements;
  }

  renderOrbitalSystemV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Concentric orbits
    const orbitCount = 4;
    for (let i = 0; i < orbitCount; i++) {
      const orbitRadius = Math.min(bounds.w, bounds.h) * 0.4 * (0.3 + i * 0.2);
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - orbitRadius,
        y: centerY - orbitRadius,
        w: orbitRadius * 2,
        h: orbitRadius * 2,
        fill: { color: theme.primary || '#C0C0C0', transparency: 95 },
        line: { color: theme.primary || '#C0C0C0', width: 2, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `orbital_ring_${i}` });
    }
    
    // Center core
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.25,
      y: centerY - 0.25,
      w: 0.5,
      h: 0.5,
      fill: { color: theme.primary || '#C0C0C0', transparency: 50 },
      line: { color: theme.primary || '#C0C0C0', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'orbital_core' });
    
    // Time streams (curved lines)
    const streamCount = 3;
    for (let i = 0; i < streamCount; i++) {
      const angle = (i / streamCount) * Math.PI * 2;
      const streamRadius = Math.min(bounds.w, bounds.h) * 0.35;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: Math.cos(angle) * streamRadius,
        h: Math.sin(angle) * streamRadius,
        line: { color: theme.primary || '#00E5FF', width: 2, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `orbital_stream_${i}` });
    }
    
    // Navigation controls (small markers)
    const navCount = 8;
    for (let i = 0; i < navCount; i++) {
      const angle = (i / navCount) * Math.PI * 2;
      const navRadius = Math.min(bounds.w, bounds.h) * 0.45;
      const nx = centerX + Math.cos(angle) * navRadius;
      const ny = centerY + Math.sin(angle) * navRadius;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: nx - 0.03,
        y: ny - 0.03,
        w: 0.06,
        h: 0.06,
        fill: { color: theme.primary || '#00E5FF', transparency: 70 },
        line: { color: theme.primary || '#00E5FF', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `orbital_nav_${i}` });
    }
    
    return elements;
  }

  renderHolographicStructureV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Main holographic projection
    const holoWidth = bounds.w * 0.6;
    const holoHeight = bounds.h * 0.7;
    
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - holoWidth / 2,
      y: centerY - holoHeight / 2,
      w: holoWidth,
      h: holoHeight,
      fill: { color: theme.primary || '#00E5FF', transparency: 85 },
      line: { color: theme.primary || '#00E5FF', width: 2, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'hologram_main' });
    
    // Projection beams (lines from bottom)
    const beamCount = 3;
    for (let i = 0; i < beamCount; i++) {
      const bx = centerX + (i - 1) * holoWidth * 0.25;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: bx,
        y: centerY + holoHeight / 2,
        w: 0,
        h: bounds.h * 0.15,
        line: { color: theme.primary || '#00E5FF', width: 2, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `hologram_beam_${i}` });
    }
    
    // Scan lines (horizontal)
    const scanCount = 6;
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
    
    return elements;
  }

  renderIndustrialWorkforceV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Industrial units (multiple machines)
    const unitCount = 3;
    for (let i = 0; i < unitCount; i++) {
      const ux = centerX + (i - 1) * bounds.w * 0.3;
      const unitWidth = bounds.w * 0.25;
      const unitHeight = bounds.h * 0.5;
      
      // Unit body
      slide.addShape(this.pres.ShapeType.rect, {
        x: ux - unitWidth / 2,
        y: centerY - unitHeight / 2,
        w: unitWidth,
        h: unitHeight,
        fill: { color: theme.primary || '#00FF00', transparency: 60 },
        line: { color: theme.primary || '#00FF00', width: 2 }
      });
      elements.push({ type: 'rect', name: `industrial_unit_${i}` });
      
      // Connector ports (small circles)
      const portCount = 2;
      for (let j = 0; j < portCount; j++) {
        const px = ux + (j === 0 ? -unitWidth / 2 - 0.1 : unitWidth / 2 + 0.05);
        const py = centerY;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: px - 0.05,
          y: py - 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: '#00E5FF', transparency: 70 },
          line: { color: '#00E5FF', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `industrial_port_${i}_${j}` });
      }
      
      // Active indicators
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: ux - 0.05,
        y: centerY - unitHeight / 2 - 0.1,
        w: 0.1,
        h: 0.1,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `industrial_indicator_${i}` });
    }
    
    // Assembly line (connecting lines)
    for (let i = 0; i < unitCount - 1; i++) {
      const x1 = centerX + (i - 0.5) * bounds.w * 0.3 + bounds.w * 0.125;
      const x2 = centerX + (i + 0.5) * bounds.w * 0.3 - bounds.w * 0.125;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: x1,
        y: centerY,
        w: x2 - x1,
        h: 0,
        line: { color: theme.primary || '#00FF00', width: 2 }
      });
      elements.push({ type: 'line', name: `assembly_line_${i}` });
    }
    
    return elements;
  }

  renderNeuralConstellationV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Central hub
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.3,
      y: centerY - 0.3,
      w: 0.6,
      h: 0.6,
      fill: { color: theme.primary || '#FF00FF', transparency: 60 },
      line: { color: theme.primary || '#FF00FF', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'neural_hub' });
    
    // Node network (satellite nodes)
    const nodeCount = 8;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const nodeRadius = Math.min(bounds.w, bounds.h) * 0.35;
      const nx = centerX + Math.cos(angle) * nodeRadius;
      const ny = centerY + Math.sin(angle) * nodeRadius;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: nx - 0.12,
        y: ny - 0.12,
        w: 0.24,
        h: 0.24,
        fill: { color: theme.primary || '#FF00FF', transparency: 70 },
        line: { color: theme.primary || '#FF00FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `neural_node_${i}` });
      
      // Connection lines to hub
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: nx - centerX,
        h: ny - centerY,
        line: { color: theme.primary || '#FF00FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `neural_connection_${i}` });
    }
    
    // Pulsing activity (outer rings)
    const pulseCount = 2;
    for (let i = 0; i < pulseCount; i++) {
      const pulseRadius = 0.4 + i * 0.15;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - pulseRadius,
        y: centerY - pulseRadius,
        w: pulseRadius * 2,
        h: pulseRadius * 2,
        fill: { color: theme.primary || '#FF00FF', transparency: 95 },
        line: { color: theme.primary || '#FF00FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `neural_pulse_${i}` });
    }
    
    return elements;
  }

  renderKnowledgeGraphV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Node clusters (groups of related nodes)
    const clusterCount = 3;
    for (let i = 0; i < clusterCount; i++) {
      const clusterAngle = (i / clusterCount) * Math.PI * 2;
      const clusterRadius = Math.min(bounds.w, bounds.h) * 0.3;
      const cx = centerX + Math.cos(clusterAngle) * clusterRadius;
      const cy = centerY + Math.sin(clusterAngle) * clusterRadius;
      
      // Cluster nodes
      const nodesPerCluster = 4;
      for (let j = 0; j < nodesPerCluster; j++) {
        const nodeAngle = (j / nodesPerCluster) * Math.PI * 2;
        const nodeRadius = 0.2;
        const nx = cx + Math.cos(nodeAngle) * nodeRadius;
        const ny = cy + Math.sin(nodeAngle) * nodeRadius;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: nx - 0.08,
          y: ny - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: theme.primary || '#FF00FF', transparency: 70 },
          line: { color: theme.primary || '#FF00FF', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `knowledge_node_${i}_${j}` });
      }
      
      // Cluster center
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: cx - 0.1,
        y: cy - 0.1,
        w: 0.2,
        h: 0.2,
        fill: { color: theme.primary || '#FF00FF', transparency: 60 },
        line: { color: theme.primary || '#FF00FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `knowledge_cluster_${i}` });
    }
    
    // Relationship lines (between clusters)
    for (let i = 0; i < clusterCount; i++) {
      const next = (i + 1) % clusterCount;
      const angle1 = (i / clusterCount) * Math.PI * 2;
      const angle2 = (next / clusterCount) * Math.PI * 2;
      const clusterRadius = Math.min(bounds.w, bounds.h) * 0.3;
      
      const x1 = centerX + Math.cos(angle1) * clusterRadius;
      const y1 = centerY + Math.sin(angle1) * clusterRadius;
      const x2 = centerX + Math.cos(angle2) * clusterRadius;
      const y2 = centerY + Math.sin(angle2) * clusterRadius;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: x1,
        y: y1,
        w: x2 - x1,
        h: y2 - y1,
        line: { color: theme.primary || '#FF00FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `knowledge_relationship_${i}` });
    }
    
    return elements;
  }

  renderExecutionCoreV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Core structure
    const coreRadius = Math.min(bounds.w, bounds.h) * 0.3;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - coreRadius,
      y: centerY - coreRadius,
      w: coreRadius * 2,
      h: coreRadius * 2,
      fill: { color: theme.primary || '#00FF00', transparency: 60 },
      line: { color: theme.primary || '#00FF00', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'execution_core' });
    
    // Cooling systems (outer rings)
    const coolingCount = 2;
    for (let i = 0; i < coolingCount; i++) {
      const coolingRadius = coreRadius * (1.3 + i * 0.2);
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - coolingRadius,
        y: centerY - coolingRadius,
        w: coolingRadius * 2,
        h: coolingRadius * 2,
        fill: { color: '#00E5FF', transparency: 90 },
        line: { color: '#00E5FF', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `execution_cooling_${i}` });
    }
    
    // Energy flows (radial lines)
    const flowCount = 8;
    for (let i = 0; i < flowCount; i++) {
      const angle = (i / flowCount) * Math.PI * 2;
      const flowLength = coreRadius * 1.5;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: Math.cos(angle) * flowLength,
        h: Math.sin(angle) * flowLength,
        line: { color: theme.primary || '#00FF00', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `execution_flow_${i}` });
    }
    
    // Safety barriers (outer frame)
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX - bounds.w * 0.45,
      y: centerY - bounds.h * 0.45,
      w: bounds.w * 0.9,
      h: bounds.h * 0.9,
      fill: { color: '#1A1A1F', transparency: 90 },
      line: { color: theme.primary || '#00FF00', width: 1 }
    });
    elements.push({ type: 'rect', name: 'execution_barrier' });
    
    return elements;
  }

  renderGovernanceChamberV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Circular layout
    const chamberRadius = Math.min(bounds.w, bounds.h) * 0.4;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - chamberRadius,
      y: centerY - chamberRadius,
      w: chamberRadius * 2,
      h: chamberRadius * 2,
      fill: { color: theme.primary || '#FFC400', transparency: 50 },
      line: { color: theme.primary || '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'governance_chamber' });
    
    // Governance rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = chamberRadius * (0.3 + i * 0.25);
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - ringRadius,
        y: centerY - ringRadius,
        w: ringRadius * 2,
        h: ringRadius * 2,
        fill: { color: theme.primary || '#FFC400', transparency: 80 - i * 10 },
        line: { color: theme.primary || '#FFC400', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `governance_ring_${i}` });
    }
    
    // Evolution streams (curved lines)
    const streamCount = 4;
    for (let i = 0; i < streamCount; i++) {
      const angle = (i / streamCount) * Math.PI * 2;
      const streamLength = chamberRadius * 0.8;
      
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: Math.cos(angle) * streamLength,
        h: Math.sin(angle) * streamLength,
        line: { color: theme.primary || '#FFC400', width: 2, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `governance_stream_${i}` });
    }
    
    // Decision displays (small markers)
    const displayCount = 6;
    for (let i = 0; i < displayCount; i++) {
      const angle = (i / displayCount) * Math.PI * 2;
      const displayRadius = chamberRadius * 0.6;
      const dx = centerX + Math.cos(angle) * displayRadius;
      const dy = centerY + Math.sin(angle) * displayRadius;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: dx - 0.08,
        y: dy - 0.05,
        w: 0.16,
        h: 0.1,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'rect', name: `governance_display_${i}` });
    }
    
    return elements;
  }

  renderEvolutionEngineV14(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Evolution core
    const coreRadius = Math.min(bounds.w, bounds.h) * 0.25;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - coreRadius,
      y: centerY - coreRadius,
      w: coreRadius * 2,
      h: coreRadius * 2,
      fill: { color: theme.primary || '#FFC400', transparency: 60 },
      line: { color: theme.primary || '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'evolution_core' });
    
    // Evolution rings
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = coreRadius * (1.3 + i * 0.3);
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - ringRadius,
        y: centerY - ringRadius,
        w: ringRadius * 2,
        h: ringRadius * 2,
        fill: { color: theme.primary || '#FFC400', transparency: 85 - i * 5 },
        line: { color: theme.primary || '#FFC400', width: 2, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `evolution_ring_${i}` });
    }
    
    // Pattern streams (spiral lines)
    const streamCount = 3;
    for (let i = 0; i < streamCount; i++) {
      const startAngle = (i / streamCount) * Math.PI * 2;
      const endAngle = startAngle + Math.PI;
      const streamRadius = coreRadius * 1.8;
      
      // Approximate spiral with line segments
      const segments = 10;
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const angle = startAngle + t * (endAngle - startAngle);
        const radius = coreRadius * (1 + t * 0.8);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.03,
          y: y - 0.03,
          w: 0.06,
          h: 0.06,
          fill: { color: '#00E5FF', transparency: 70 },
          line: { color: '#00E5FF', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `evolution_pattern_${i}_${j}` });
      }
    }
    
    // Mutation displays (small rectangles)
    const displayCount = 5;
    for (let i = 0; i < displayCount; i++) {
      const angle = (i / displayCount) * Math.PI * 2;
      const displayRadius = coreRadius * 2.2;
      const dx = centerX + Math.cos(angle) * displayRadius;
      const dy = centerY + Math.sin(angle) * displayRadius;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: dx - 0.1,
        y: dy - 0.06,
        w: 0.2,
        h: 0.12,
        fill: { color: '#FF00FF', transparency: 70 },
        line: { color: '#FF00FF', width: 1 }
      });
      elements.push({ type: 'rect', name: `evolution_mutation_${i}` });
    }
    
    // Progress indicators (small circles)
    const progressCount = 8;
    for (let i = 0; i < progressCount; i++) {
      const angle = (i / progressCount) * Math.PI * 2;
      const progressRadius = coreRadius * 1.5;
      const px = centerX + Math.cos(angle) * progressRadius;
      const py = centerY + Math.sin(angle) * progressRadius;
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: px - 0.04,
        y: py - 0.04,
        w: 0.08,
        h: 0.08,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#00FF00', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `evolution_progress_${i}` });
    }
    
    return elements;
  }

  renderDefaultV14(slide, bounds, theme) {
    const elements = [];
    
    // Default rectangle with architectural frame
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
  OBJECT_SPECIES_V14,
  ObjectSpeciesRendererV14
};
