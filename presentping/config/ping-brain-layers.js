// ── PING BRAIN LAYERS ─────────────────────────────────────────────
// Critical Failure #9: PING brains are missing
// Brain Layer, Knowledge Layer, Execution Layer, Constitutional Layer, Replay Layer, Projection Layer

const BRAIN_LAYERS = {
  BRAIN: {
    name: 'Brain Layer',
    order: 1,
    components: ['orchestration', 'planning', 'routing', 'memory'],
    responsibilities: ['Intent understanding', 'Task decomposition', 'Resource routing', 'Context management'],
    connections: ['Knowledge Layer', 'Execution Layer'],
    color: '#00E5FF',
    icon: 'brain'
  },
  KNOWLEDGE: {
    name: 'Knowledge Layer',
    order: 2,
    components: ['RAG', 'vector_search', 'graph_search', 'canonical_state'],
    responsibilities: ['Semantic retrieval', 'Knowledge organization', 'State management', 'Context synthesis'],
    connections: ['Brain Layer', 'Execution Layer', 'Replay Layer'],
    color: '#FF00FF',
    icon: 'knowledge'
  },
  EXECUTION: {
    name: 'Execution Layer',
    order: 3,
    components: ['MCP', 'agents', 'workflows'],
    responsibilities: ['Tool orchestration', 'Agent coordination', 'Workflow execution', 'Resource management'],
    connections: ['Brain Layer', 'Knowledge Layer', 'Constitutional Layer'],
    color: '#00FF00',
    icon: 'execution'
  },
  CONSTITUTIONAL: {
    name: 'Constitutional Layer',
    order: 4,
    components: ['authority', 'witness', 'governance'],
    responsibilities: ['Policy enforcement', 'Compliance verification', 'Constitutional governance', 'Self-improvement'],
    connections: ['Execution Layer', 'Replay Layer', 'Witness Layer'],
    color: '#FFC400',
    icon: 'constitutional'
  },
  REPLAY: {
    name: 'Replay Layer',
    order: 5,
    components: ['event_sourcing', 'replay_engine', 'state_reconstruction'],
    responsibilities: ['Event capture', 'Time-travel debugging', 'State reconstruction', 'Historical analysis'],
    connections: ['Knowledge Layer', 'Constitutional Layer', 'Projection Layer'],
    color: '#C0C0C0',
    icon: 'replay'
  },
  PROJECTION: {
    name: 'Projection Layer',
    order: 6,
    components: ['Plane', 'UI', 'dashboards', 'visualizations'],
    responsibilities: ['System visualization', 'User interaction', 'Real-time monitoring', 'Data presentation'],
    connections: ['Replay Layer', 'Knowledge Layer'],
    color: '#00E5FF',
    icon: 'projection'
  },
  WITNESS: {
    name: 'Witness Layer',
    order: 7,
    components: ['witness_system', 'audit_trail', 'verification'],
    responsibilities: ['Action verification', 'Compliance auditing', 'Evidence collection', 'Constitutional validation'],
    connections: ['Constitutional Layer', 'Replay Layer'],
    color: '#FFC400',
    icon: 'witness'
  }
};

const LAYER_INTERACTIONS = {
  BRAIN_TO_KNOWLEDGE: {
    type: 'query',
    flow: 'intent → semantic understanding → knowledge retrieval',
    frequency: 'high'
  },
  BRAIN_TO_EXECUTION: {
    type: 'command',
    flow: 'task decomposition → agent assignment → execution',
    frequency: 'high'
  },
  KNOWLEDGE_TO_REPLAY: {
    type: 'state_sync',
    flow: 'canonical state → event log → replay validation',
    frequency: 'medium'
  },
  EXECUTION_TO_CONSTITUTIONAL: {
    type: 'validation',
    flow: 'action → authority check → witness verification',
    frequency: 'high'
  },
  CONSTITUTIONAL_TO_REPLAY: {
    type: 'recording',
    flow: 'constitutional decision → event capture → replay storage',
    frequency: 'high'
  },
  REPLAY_TO_PROJECTION: {
    type: 'visualization',
    flow: 'reconstructed state → Plane projection → user display',
    frequency: 'medium'
  }
};

class PingBrainLayersEngine {
  constructor(pres) {
    this.pres = pres;
    this.layersHistory = new Map();
  }

  renderBrainLayers(slide, bounds, theme) {
    const elements = [];
    const layers = Object.values(BRAIN_LAYERS).sort((a, b) => a.order - b.order);
    const layerHeight = bounds.h / layers.length;
    
    layers.forEach((layer, index) => {
      const y = bounds.y + index * layerHeight;
      const layerY = y + layerHeight / 2;
      
      // Layer container
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x,
        y: y,
        w: bounds.w,
        h: layerHeight,
        fill: { color: layer.color, transparency: 85 },
        line: { color: layer.color, width: 2 }
      });
      elements.push({ type: 'rect', name: `layer_container_${layer.name}` });
      
      // Layer name
      slide.addText(layer.name, {
        x: bounds.x + 0.2,
        y: layerY - 0.1,
        w: 2,
        h: 0.2,
        fontSize: 11,
        color: layer.color,
        bold: true
      });
      elements.push({ type: 'text', name: `layer_name_${layer.name}` });
      
      // Layer components
      const componentSpacing = 0.8;
      layer.components.forEach((component, compIndex) => {
        const cx = bounds.x + 2.5 + compIndex * componentSpacing;
        
        slide.addShape(this.pres.ShapeType.rect, {
          x: cx - 0.3,
          y: layerY - 0.12,
          w: 0.6,
          h: 0.24,
          fill: { color: layer.color, transparency: 70 },
          line: { color: layer.color, width: 1 }
        });
        elements.push({ type: 'rect', name: `layer_component_${layer.name}_${compIndex}` });
        
        slide.addText(component, {
          x: cx - 0.25,
          y: layerY - 0.08,
          w: 0.5,
          h: 0.16,
          fontSize: 8,
          color: '#FFFFFF'
        });
        elements.push({ type: 'text', name: `layer_component_text_${layer.name}_${compIndex}` });
      });
      
      // Layer responsibilities (small text)
      const respY = layerY + 0.15;
      layer.responsibilities.forEach((resp, respIndex) => {
        const rx = bounds.x + 5.5 + respIndex * 1.5;
        
        slide.addText(resp, {
          x: rx,
          y: respY - 0.05,
          w: 1.4,
          h: 0.1,
          fontSize: 6,
          color: '#CCCCCC'
        });
        elements.push({ type: 'text', name: `layer_resp_${layer.name}_${respIndex}` });
      });
      
      // Connection lines to other layers
      layer.connections.forEach((connection, connIndex) => {
        const targetLayer = layers.find(l => l.name === connection);
        if (targetLayer && targetLayer.order > layer.order) {
          const targetY = bounds.y + (targetLayer.order - 1) * layerHeight + layerHeight / 2;
          
          slide.addShape(this.pres.ShapeType.line, {
            x: bounds.x + bounds.w - 0.5,
            y: layerY,
            w: 0,
            h: targetY - layerY,
            line: { color: layer.color, width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `layer_connection_${layer.name}_${connection}` });
        }
      });
    });
    
    // Layer interactions diagram
    this.renderLayerInteractions(slide, bounds, theme, elements);
    
    return { elements };
  }

  renderLayerInteractions(slide, bounds, theme, elements) {
    const interactionX = bounds.x + bounds.w * 0.85;
    const interactionY = bounds.y + bounds.h * 0.5;
    const interactionSize = bounds.h * 0.8;
    
    // Interaction container
    slide.addShape(this.pres.ShapeType.rect, {
      x: interactionX - interactionSize / 2,
      y: interactionY - interactionSize / 2,
      w: interactionSize,
      h: interactionSize,
      fill: { color: '#1A1A1F', transparency: 80 },
      line: { color: '#333333', width: 1 }
    });
    elements.push({ type: 'rect', name: 'interaction_container' });
    
    // Render interaction flows
    const interactions = Object.values(LAYER_INTERACTIONS);
    const interactionSpacing = interactionSize / interactions.length;
    
    interactions.forEach((interaction, index) => {
      const iy = interactionY - interactionSize / 2 + index * interactionSpacing + interactionSpacing / 2;
      
      // Flow type indicator
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: interactionX - interactionSize / 2 + 0.2,
        y: iy - 0.05,
        w: 0.1,
        h: 0.1,
        fill: { color: '#00E5FF', transparency: 70 },
        line: { color: '#00E5FF', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `interaction_type_${index}` });
      
      // Flow description
      slide.addText(interaction.flow, {
        x: interactionX - interactionSize / 2 + 0.4,
        y: iy - 0.04,
        w: interactionSize - 0.8,
        h: 0.08,
        fontSize: 5,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `interaction_flow_${index}` });
      
      // Frequency indicator
      slide.addText(interaction.frequency, {
        x: interactionX + interactionSize / 2 - 0.3,
        y: iy - 0.04,
        w: 0.25,
        h: 0.08,
        fontSize: 5,
        color: interaction.frequency === 'high' ? '#00FF00' : '#FFC400',
        align: 'right'
      });
      elements.push({ type: 'text', name: `interaction_freq_${index}` });
    });
  }

  renderLayerComponent(slide, layerKey, componentKey, bounds, theme) {
    const layer = BRAIN_LAYERS[layerKey];
    if (!layer) return [];

    const elements = [];
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Component container
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: layer.color, transparency: 80 },
      line: { color: layer.color, width: 2 }
    });
    elements.push({ type: 'rect', name: 'component_container' });
    
    // Component name
    slide.addText(componentKey, {
      x: bounds.x + 0.2,
      y: bounds.y + 0.2,
      w: bounds.w - 0.4,
      h: 0.3,
      fontSize: 12,
      color: layer.color,
      bold: true
    });
    elements.push({ type: 'text', name: 'component_name' });
    
    // Layer name
    slide.addText(layer.name, {
      x: bounds.x + 0.2,
      y: bounds.y + bounds.h - 0.3,
      w: bounds.w - 0.4,
      h: 0.2,
      fontSize: 9,
      color: '#CCCCCC'
    });
    elements.push({ type: 'text', name: 'component_layer' });
    
    // Component icon
    this.renderLayerIcon(slide, layer.icon, centerX, centerY - 0.2, layer.color, elements);
    
    return elements;
  }

  renderLayerIcon(slide, iconType, x, y, color, elements) {
    switch (iconType) {
      case 'brain':
        // Brain-like shape (network of nodes)
        const nodeCount = 5;
        for (let i = 0; i < nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2;
          const radius = 0.2;
          const nx = x + Math.cos(angle) * radius;
          const ny = y + Math.sin(angle) * radius;
          
          slide.addShape(this.pres.ShapeType.ellipse, {
            x: nx - 0.05,
            y: ny - 0.05,
            w: 0.1,
            h: 0.1,
            fill: { color: color, transparency: 70 },
            line: { color: color, width: 1 }
          });
          elements.push({ type: 'ellipse', name: `brain_node_${i}` });
          
          // Connection to center
          slide.addShape(this.pres.ShapeType.line, {
            x: x,
            y: y,
            w: nx - x,
            h: ny - y,
            line: { color: color, width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `brain_connection_${i}` });
        }
        break;

      case 'knowledge':
        // Knowledge graph representation
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.15,
          y: y - 0.15,
          w: 0.3,
          h: 0.3,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'knowledge_center' });
        
        // Satellite nodes
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2;
          const sx = x + Math.cos(angle) * 0.25;
          const sy = y + Math.sin(angle) * 0.25;
          
          slide.addShape(this.pres.ShapeType.ellipse, {
            x: sx - 0.04,
            y: sy - 0.04,
            w: 0.08,
            h: 0.08,
            fill: { color: color, transparency: 80 },
            line: { color: color, width: 1 }
          });
          elements.push({ type: 'ellipse', name: `knowledge_satellite_${i}` });
        }
        break;

      case 'execution':
        // Execution flow representation
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.2,
          y: y - 0.1,
          w: 0.4,
          h: 0.2,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'rect', name: 'execution_box' });
        
        // Flow arrows
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.3,
          y: y,
          w: 0.1,
          h: 0,
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'line', name: 'execution_arrow_in' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x + 0.2,
          y: y,
          w: 0.1,
          h: 0,
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'line', name: 'execution_arrow_out' });
        break;

      case 'constitutional':
        // Constitutional monument
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.1,
          y: y - 0.2,
          w: 0.2,
          h: 0.4,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'rect', name: 'constitutional_pillar' });
        
        // Crown
        slide.addShape(this.pres.ShapeType.triangle, {
          x: x - 0.08,
          y: y - 0.3,
          w: 0.16,
          h: 0.1,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'triangle', name: 'constitutional_crown' });
        break;

      case 'replay':
        // Replay rings
        for (let i = 0; i < 3; i++) {
          const radius = 0.15 - i * 0.04;
          slide.addShape(this.pres.ShapeType.ellipse, {
            x: x - radius,
            y: y - radius,
            w: radius * 2,
            h: radius * 2,
            fill: { color: color, transparency: 70 + i * 10 },
            line: { color: color, width: 1 }
          });
          elements.push({ type: 'ellipse', name: `replay_ring_${i}` });
        }
        break;

      case 'projection':
        // Projection hologram
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.2,
          y: y - 0.15,
          w: 0.4,
          h: 0.3,
          fill: { color: color, transparency: 85 },
          line: { color: color, width: 2, dashType: 'dash' }
        });
        elements.push({ type: 'ellipse', name: 'projection_hologram' });
        
        // Scan lines
        for (let i = 0; i < 3; i++) {
          const sy = y - 0.1 + i * 0.1;
          slide.addShape(this.pres.ShapeType.line, {
            x: x - 0.15,
            y: sy,
            w: 0.3,
            h: 0,
            line: { color: color, width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `projection_scan_${i}` });
        }
        break;

      case 'witness':
        // Witness eye
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.15,
          y: y - 0.1,
          w: 0.3,
          h: 0.2,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'witness_eye' });
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.05,
          y: y - 0.05,
          w: 0.1,
          h: 0.1,
          fill: { color: '#000000', transparency: 50 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'witness_pupil' });
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
        elements.push({ type: 'ellipse', name: 'default_icon' });
        break;
    }
  }

  getLayer(layerKey) {
    return BRAIN_LAYERS[layerKey];
  }

  getAllLayers() {
    return BRAIN_LAYERS;
  }

  getLayerInteraction(fromLayer, toLayer) {
    const interactionKey = `${fromLayer}_TO_${toLayer}`;
    return LAYER_INTERACTIONS[interactionKey];
  }

  getAllInteractions() {
    return LAYER_INTERACTIONS;
  }
}

module.exports = {
  PingBrainLayersEngine,
  BRAIN_LAYERS,
  LAYER_INTERACTIONS
};
