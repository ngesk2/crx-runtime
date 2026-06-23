// ── FINAL CIVILIZATION SLIDE ───────────────────────────────────────────
// V14: The deck ends with PING CIVILIZATION
// All major systems visible simultaneously: Brain, Witness, Replay, Authority, Execution, Knowledge, Gateway, Projection, External Systems
// This should feel like viewing an entire civilization from orbit
// Every previous slide was a zoomed-in district. The final slide reveals the whole world.

const CIVILIZATION_SYSTEMS = {
  BRAIN: {
    name: 'Brain',
    position: { x: 5, y: 3.75 },
    description: 'Orchestration, Planning, Routing',
    color: '#FF00FF',
    icon: 'neural'
  },
  WITNESS: {
    name: 'Witness',
    position: { x: 7.5, y: 2 },
    description: 'Constitutional Compliance',
    color: '#FFC400',
    icon: 'observatory'
  },
  REPLAY: {
    name: 'Replay',
    position: { x: 7.5, y: 5.5 },
    description: 'Time-Travel Reconstruction',
    color: '#C0C0C0',
    icon: 'orbital'
  },
  AUTHORITY: {
    name: 'Authority',
    position: { x: 2.5, y: 2 },
    description: 'Policy Enforcement',
    color: '#FFC400',
    icon: 'reactor'
  },
  EXECUTION: {
    name: 'Execution',
    position: { x: 2.5, y: 5.5 },
    description: 'MCP Agent Orchestration',
    color: '#00FF00',
    icon: 'reactor'
  },
  KNOWLEDGE: {
    name: 'Knowledge',
    position: { x: 5, y: 1 },
    description: 'Semantic Retrieval',
    color: '#FF00FF',
    icon: 'graph'
  },
  GATEWAY: {
    name: 'Gateway',
    position: { x: 0.5, y: 3.75 },
    description: 'Layer 0 Enforcement',
    color: '#00E5FF',
    icon: 'portal'
  },
  PROJECTION: {
    name: 'Projection',
    position: { x: 9, y: 3.75 },
    description: 'Holographic UI',
    color: '#00E5FF',
    icon: 'hologram'
  },
  EXTERNAL: {
    name: 'External Systems',
    position: { x: 5, y: 6.5 },
    description: 'Provider Integration',
    color: '#FFFFFF',
    icon: 'world'
  }
};

const CIVILIZATION_LAYOUT = {
  ORBITAL_VIEW: {
    name: 'Orbital View',
    description: 'Viewing entire civilization from orbit',
    cameraDistance: 20,
    viewingAngle: 45
  },
  SYSTEM_DISTRICTS: {
    name: 'System Districts',
    description: 'Each system as a distinct district',
    layout: 'distributed'
  },
  CONNECTION_HIGHWAYS: {
    name: 'Connection Highways',
    description: 'Data flows between systems',
    layout: 'network'
  },
  ATMOSPHERIC_GLOW: {
    name: 'Atmospheric Glow',
    description: 'Civilization-wide ambient effects',
    style: 'glow'
  }
};

class FinalCivilizationEngine {
  constructor(pres) {
    this.pres = pres;
    this.systemPositions = new Map();
  }

  renderFinalCivilization(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Title
    slide.addText('PING CIVILIZATION', {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: 0.3,
      fontSize: 24,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center',
      shadow: { type: 'outer', blur: 10, color: '00E5FF' }
    });
    elements.push({ type: 'text', name: 'civilization_title' });

    // Subtitle
    slide.addText('Constitutional AI Civilization from Orbit', {
      x: bounds.x,
      y: bounds.y + 0.35,
      w: bounds.w,
      h: 0.2,
      fontSize: 12,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'civilization_subtitle' });

    // Render all systems
    Object.entries(CIVILIZATION_SYSTEMS).forEach(([systemKey, system]) => {
      const systemBounds = {
        x: bounds.x + system.position.x * bounds.w / 10 - 0.8,
        y: bounds.y + system.position.y * bounds.h / 7.5 - 0.6,
        w: 1.6,
        h: 1.2
      };

      const systemElements = this.renderSystemDistrict(slide, systemKey, systemBounds, theme);
      elements.push(...systemElements);

      this.systemPositions.set(systemKey, systemBounds);
    });

    // Render connection highways
    const connectionElements = this.renderConnectionHighways(slide, bounds, theme);
    elements.push(...connectionElements);

    // Render atmospheric glow
    const glowElements = this.renderAtmosphericGlow(slide, bounds, theme);
    elements.push(...glowElements);

    // Render civilization grid
    const gridElements = this.renderCivilizationGrid(slide, bounds, theme);
    elements.push(...gridElements);

    // Render legend
    const legendElements = this.renderCivilizationLegend(slide, bounds, theme);
    elements.push(...legendElements);

    return { elements };
  }

  renderSystemDistrict(slide, systemKey, bounds, theme) {
    const elements = [];
    const system = CIVILIZATION_SYSTEMS[systemKey];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // District frame (architectural)
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: system.color, transparency: 85 },
      line: { color: system.color, width: 2 }
    });
    elements.push({ type: 'rect', name: `district_frame_${systemKey}` });

    // System icon
    this.renderSystemIcon(slide, system.icon, centerX, centerY - 0.15, system.color, elements);

    // System name
    slide.addText(system.name, {
      x: bounds.x + 0.1,
      y: centerY + 0.1,
      w: bounds.w - 0.2,
      h: 0.15,
      fontSize: 9,
      color: system.color,
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: `district_name_${systemKey}` });

    // System description
    slide.addText(system.description, {
      x: bounds.x + 0.1,
      y: centerY + 0.25,
      w: bounds.w - 0.2,
      h: 0.15,
      fontSize: 6,
      color: '#CCCCCC',
      align: 'center'
    });
    elements.push({ type: 'text', name: `district_desc_${systemKey}` });

    // Status indicator
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: bounds.x + bounds.w - 0.15,
      y: bounds.y + 0.1,
      w: 0.08,
      h: 0.08,
      fill: { color: '#00FF00', transparency: 70 },
      line: { color: '#00FF00', width: 1 }
    });
    elements.push({ type: 'ellipse', name: `district_status_${systemKey}` });

    return elements;
  }

  renderSystemIcon(slide, iconType, x, y, color, elements) {
    switch (iconType) {
      case 'neural':
        // Neural network icon
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.15,
          y: y - 0.15,
          w: 0.3,
          h: 0.3,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_neural_center' });

        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const nx = x + Math.cos(angle) * 0.25;
          const ny = y + Math.sin(angle) * 0.25;

          slide.addShape(this.pres.ShapeType.ellipse, {
            x: nx - 0.05,
            y: ny - 0.05,
            w: 0.1,
            h: 0.1,
            fill: { color: color, transparency: 70 },
            line: { color: color, width: 1 }
          });
          elements.push({ type: 'ellipse', name: `icon_neural_node_${i}` });

          slide.addShape(this.pres.ShapeType.line, {
            x: x,
            y: y,
            w: nx - x,
            h: ny - y,
            line: { color: color, width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `icon_neural_conn_${i}` });
        }
        break;

      case 'observatory':
        // Observatory icon
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.15,
          y: y - 0.12,
          w: 0.3,
          h: 0.24,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_observatory_dome' });

        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.1,
          y: y + 0.12,
          w: 0.2,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'rect', name: 'icon_observatory_base' });
        break;

      case 'orbital':
        // Orbital icon
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.1,
          w: 0.2,
          h: 0.2,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_orbital_core' });

        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.18,
          y: y - 0.18,
          w: 0.36,
          h: 0.36,
          fill: { color: color, transparency: 95 },
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'icon_orbital_ring' });
        break;

      case 'reactor':
        // Reactor icon
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.12,
          w: 0.24,
          h: 0.24,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_reactor_core' });

        for (let i = 0; i < 2; i++) {
          const ringRadius = 0.12 + i * 0.06;
          slide.addShape(this.pres.ShapeType.ellipse, {
            x: x - ringRadius,
            y: y - ringRadius,
            w: ringRadius * 2,
            h: ringRadius * 2,
            fill: { color: color, transparency: 90 - i * 10 },
            line: { color: color, width: 1 }
          });
          elements.push({ type: 'ellipse', name: `icon_reactor_ring_${i}` });
        }
        break;

      case 'graph':
        // Graph icon
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.05,
          y: y - 0.1,
          w: 0.1,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_graph_node1' });

        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x + 0.05,
          y: y - 0.15,
          w: 0.1,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_graph_node2' });

        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x + 0.05,
          y: y + 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_graph_node3' });

        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: -0.1,
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: 'icon_graph_conn1' });

        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: 0.1,
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: 'icon_graph_conn2' });

        slide.addShape(this.pres.ShapeType.line, {
          x: x + 0.05,
          y: y - 0.1,
          w: 0,
          h: 0.15,
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: 'icon_graph_conn3' });
        break;

      case 'portal':
        // Portal icon
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.12,
          y: y - 0.15,
          w: 0.06,
          h: 0.3,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'rect', name: 'icon_portal_left' });

        slide.addShape(this.pres.ShapeType.rect, {
          x: x + 0.06,
          y: y - 0.15,
          w: 0.06,
          h: 0.3,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'rect', name: 'icon_portal_right' });

        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.2,
          w: 0.24,
          h: 0.12,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_portal_arch' });
        break;

      case 'hologram':
        // Hologram icon
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.15,
          y: y - 0.12,
          w: 0.3,
          h: 0.24,
          fill: { color: color, transparency: 85 },
          line: { color: color, width: 2, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'icon_hologram_main' });

        for (let i = 0; i < 3; i++) {
          const sy = y - 0.12 + (i + 1) * 0.06;
          slide.addShape(this.pres.ShapeType.line, {
            x: x - 0.15,
            y: sy,
            w: 0.3,
            h: 0,
            line: { color: color, width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `icon_hologram_scan_${i}` });
        }
        break;

      case 'world':
        // World icon
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.12,
          y: y - 0.12,
          w: 0.24,
          h: 0.24,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_world' });

        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.12,
          y: y,
          w: 0.24,
          h: 0,
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'line', name: 'icon_world_h' });

        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: y - 0.12,
          w: 0,
          h: 0.24,
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'line', name: 'icon_world_v' });
        break;

      default:
        // Default circle
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.1,
          w: 0.2,
          h: 0.2,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_default' });
        break;
    }
  }

  renderConnectionHighways(slide, bounds, theme) {
    const elements = [];
    const connections = [
      ['GATEWAY', 'AUTHORITY'],
      ['GATEWAY', 'EXECUTION'],
      ['AUTHORITY', 'BRAIN'],
      ['EXECUTION', 'BRAIN'],
      ['BRAIN', 'KNOWLEDGE'],
      ['BRAIN', 'WITNESS'],
      ['BRAIN', 'REPLAY'],
      ['KNOWLEDGE', 'PROJECTION'],
      ['WITNESS', 'PROJECTION'],
      ['REPLAY', 'PROJECTION'],
      ['EXECUTION', 'EXTERNAL'],
      ['KNOWLEDGE', 'EXTERNAL']
    ];

    connections.forEach(([from, to]) => {
      const fromBounds = this.systemPositions.get(from);
      const toBounds = this.systemPositions.get(to);

      if (fromBounds && toBounds) {
        const fromCenterX = fromBounds.x + fromBounds.w / 2;
        const fromCenterY = fromBounds.y + fromBounds.h / 2;
        const toCenterX = toBounds.x + toBounds.w / 2;
        const toCenterY = toBounds.y + toBounds.h / 2;

        slide.addShape(this.pres.ShapeType.line, {
          x: fromCenterX,
          y: fromCenterY,
          w: toCenterX - fromCenterX,
          h: toCenterY - fromCenterY,
          line: { color: theme.primary || '#00E5FF', width: 1.5, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: `connection_${from}_${to}` });

        // Flow indicator
        const midX = (fromCenterX + toCenterX) / 2;
        const midY = (fromCenterY + toCenterY) / 2;

        slide.addShape(this.pres.ShapeType.ellipse, {
          x: midX - 0.03,
          y: midY - 0.03,
          w: 0.06,
          h: 0.06,
          fill: { color: '#00E5FF', transparency: 70 },
          line: { color: '#00E5FF', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `connection_indicator_${from}_${to}` });
      }
    });

    return elements;
  }

  renderAtmosphericGlow(slide, bounds, theme) {
    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    // Civilization-wide glow
    const glowCount = 3;
    for (let i = 0; i < glowCount; i++) {
      const glowRadius = Math.min(bounds.w, bounds.h) * 0.4 * (1 + i * 0.2);

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - glowRadius,
        y: centerY - glowRadius,
        w: glowRadius * 2,
        h: glowRadius * 2,
        fill: { color: theme.primary || '#00E5FF', transparency: 98 - i * 2 },
        line: { color: theme.primary || '#00E5FF', width: 0.5, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `atmospheric_glow_${i}` });
    }

    return elements;
  }

  renderCivilizationGrid(slide, bounds, theme) {
    const elements = [];
    const gridSize = 1;
    const gridCols = Math.floor(bounds.w / gridSize);
    const gridRows = Math.floor(bounds.h / gridSize);

    for (let i = 0; i <= gridCols; i++) {
      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x + i * gridSize,
        y: bounds.y,
        w: 0,
        h: bounds.h,
        line: { color: '#1A1A1F', width: 0.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `civ_grid_v_${i}` });
    }

    for (let i = 0; i <= gridRows; i++) {
      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x,
        y: bounds.y + i * gridSize,
        w: bounds.w,
        h: 0,
        line: { color: '#1A1A1F', width: 0.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `civ_grid_h_${i}` });
    }

    return elements;
  }

  renderCivilizationLegend(slide, bounds, theme) {
    const elements = [];
    const legendY = bounds.y + bounds.h - 0.8;
    const legendSpacing = 0.12;

    Object.entries(CIVILIZATION_SYSTEMS).forEach(([systemKey, system], index) => {
      const y = legendY + index * legendSpacing;

      slide.addShape(this.pres.ShapeType.ellipse, {
        x: bounds.x + 0.2,
        y: y,
        w: 0.08,
        h: 0.08,
        fill: { color: system.color, transparency: 70 },
        line: { color: system.color, width: 1 }
      });
      elements.push({ type: 'ellipse', name: `legend_icon_${index}` });

      slide.addText(system.name, {
        x: bounds.x + 0.35,
        y: y - 0.04,
        w: 1.5,
        h: 0.1,
        fontSize: 7,
        color: system.color
      });
      elements.push({ type: 'text', name: `legend_text_${index}` });
    });

    return elements;
  }

  getSystemPosition(systemKey) {
    return this.systemPositions.get(systemKey);
  }

  getAllSystems() {
    return CIVILIZATION_SYSTEMS;
  }
}

module.exports = {
  FinalCivilizationEngine,
  CIVILIZATION_SYSTEMS,
  CIVILIZATION_LAYOUT
};
