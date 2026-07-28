// ── KNOWLEDGE RELATIONSHIP ENGINE ─────────────────────────────────────
// Critical Failure #4: No true information graph
// Generate diagrams from repository structure, pipeline connections, MCP tools, vector stores, replay systems, witness systems, authority systems

const KNOWLEDGE_GRAPH_TYPES = {
  REPOSITORY_STRUCTURE: 'repository_structure',
  PIPELINE_CONNECTIONS: 'pipeline_connections',
  MCP_TOOLS: 'mcp_tools',
  VECTOR_STORES: 'vector_stores',
  REPLAY_SYSTEMS: 'replay_systems',
  WITNESS_SYSTEMS: 'witness_systems',
  AUTHORITY_SYSTEMS: 'authority_systems'
};

const PING_REPOSITORY_STRUCTURE = {
  layers: [
    {
      name: 'Brain Layer',
      components: ['orchestration', 'planning', 'routing', 'memory'],
      connections: ['Knowledge Layer', 'Execution Layer']
    },
    {
      name: 'Knowledge Layer',
      components: ['RAG', 'vector_search', 'graph_search', 'canonical_state'],
      connections: ['Brain Layer', 'Execution Layer', 'Replay Layer']
    },
    {
      name: 'Execution Layer',
      components: ['MCP', 'agents', 'workflows'],
      connections: ['Brain Layer', 'Knowledge Layer', 'Constitutional Layer']
    },
    {
      name: 'Constitutional Layer',
      components: ['authority', 'witness', 'governance'],
      connections: ['Execution Layer', 'Replay Layer', 'Witness Layer']
    },
    {
      name: 'Replay Layer',
      components: ['event_sourcing', 'replay_engine', 'state_reconstruction'],
      connections: ['Knowledge Layer', 'Constitutional Layer', 'Projection Layer']
    },
    {
      name: 'Witness Layer',
      components: ['witness_system', 'audit_trail', 'verification'],
      connections: ['Constitutional Layer', 'Replay Layer']
    },
    {
      name: 'Projection Layer',
      components: ['Plane', 'UI', 'dashboards', 'visualizations'],
      connections: ['Replay Layer', 'Knowledge Layer']
    }
  ]
};

const PIPELINE_CONNECTIONS = {
  inference: {
    source: 'Brain Layer',
    components: ['orchestration', 'planning', 'routing'],
    destination: 'Knowledge Layer',
    flow: ['vector_search', 'graph_search', 'canonical_state']
  },
  retrieval: {
    source: 'Knowledge Layer',
    components: ['RAG', 'vector_search'],
    destination: 'Execution Layer',
    flow: ['MCP', 'agents']
  },
  execution: {
    source: 'Execution Layer',
    components: ['MCP', 'workflows'],
    destination: 'Constitutional Layer',
    flow: ['authority', 'witness']
  },
  replay: {
    source: 'Constitutional Layer',
    components: ['event_sourcing'],
    destination: 'Replay Layer',
    flow: ['replay_engine', 'state_reconstruction']
  },
  projection: {
    source: 'Replay Layer',
    components: ['state_reconstruction'],
    destination: 'Projection Layer',
    flow: ['Plane', 'UI', 'dashboards']
  }
};

const MCP_TOOLS = {
  filesystem: {
    category: 'data_access',
    connections: ['Knowledge Layer', 'Execution Layer']
  },
  web_search: {
    category: 'knowledge_retrieval',
    connections: ['Knowledge Layer', 'Brain Layer']
  },
  code_execution: {
    category: 'execution',
    connections: ['Execution Layer', 'Constitutional Layer']
  },
  memory: {
    category: 'state_management',
    connections: ['Brain Layer', 'Knowledge Layer', 'Replay Layer']
  },
  database: {
    category: 'data_access',
    connections: ['Knowledge Layer', 'Replay Layer']
  }
};

const VECTOR_STORES = {
  primary: {
    type: 'chromadb',
    purpose: 'semantic_search',
    connections: ['Knowledge Layer', 'RAG']
  },
  secondary: {
    type: 'pinecone',
    purpose: 'vector_similarity',
    connections: ['Knowledge Layer', 'graph_search']
  },
  cache: {
    type: 'in_memory',
    purpose: 'fast_retrieval',
    connections: ['Brain Layer', 'routing']
  }
};

const REPLAY_SYSTEMS = {
  event_log: {
    type: 'append_only',
    purpose: 'constitutional_record',
    connections: ['Constitutional Layer', 'Replay Layer']
  },
  replay_engine: {
    type: 'state_reconstruction',
    purpose: 'time_travel',
    connections: ['Replay Layer', 'Projection Layer']
  },
  witness: {
    type: 'verification',
    purpose: 'constitutional_compliance',
    connections: ['Constitutional Layer', 'Witness Layer']
  }
};

const AUTHORITY_SYSTEMS = {
  gateway: {
    type: 'constitutional_enforcement',
    purpose: 'layer_0_validation',
    connections: ['Brain Layer', 'Constitutional Layer']
  },
  authority_engine: {
    type: 'policy_enforcement',
    purpose: 'runtime_validation',
    connections: ['Execution Layer', 'Constitutional Layer']
  },
  governance: {
    type: 'constitutional_governance',
    purpose: 'self_improvement',
    connections: ['Constitutional Layer', 'Replay Layer']
  }
};

class KnowledgeRelationshipEngine {
  constructor(pres) {
    this.pres = pres;
    this.graphHistory = new Map();
  }

  generateGraph(graphType, slide, bounds, theme) {
    switch (graphType) {
      case KNOWLEDGE_GRAPH_TYPES.REPOSITORY_STRUCTURE:
        return this.generateRepositoryGraph(slide, bounds, theme);
      case KNOWLEDGE_GRAPH_TYPES.PIPELINE_CONNECTIONS:
        return this.generatePipelineGraph(slide, bounds, theme);
      case KNOWLEDGE_GRAPH_TYPES.MCP_TOOLS:
        return this.generateMCPGraph(slide, bounds, theme);
      case KNOWLEDGE_GRAPH_TYPES.VECTOR_STORES:
        return this.generateVectorGraph(slide, bounds, theme);
      case KNOWLEDGE_GRAPH_TYPES.REPLAY_SYSTEMS:
        return this.generateReplayGraph(slide, bounds, theme);
      case KNOWLEDGE_GRAPH_TYPES.WITNESS_SYSTEMS:
        return this.generateWitnessGraph(slide, bounds, theme);
      case KNOWLEDGE_GRAPH_TYPES.AUTHORITY_SYSTEMS:
        return this.generateAuthorityGraph(slide, bounds, theme);
      default:
        return this.generateDefaultGraph(slide, bounds, theme);
    }
  }

  generateRepositoryGraph(slide, bounds, theme) {
    const elements = [];
    const layers = PING_REPOSITORY_STRUCTURE.layers;
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
        fill: { color: theme.primary || '#00E5FF', transparency: 85 },
        line: { color: theme.primary || '#00E5FF', width: 2 }
      });
      elements.push({ type: 'rect', name: `layer_${index}` });
      
      // Layer name
      slide.addText(layer.name, {
        x: bounds.x + 0.1,
        y: layerY - 0.1,
        w: 2,
        h: 0.2,
        fontSize: 10,
        color: theme.primary || '#00E5FF',
        bold: true
      });
      elements.push({ type: 'text', name: `layer_name_${index}` });
      
      // Components
      const componentSpacing = bounds.w * 0.15;
      layer.components.forEach((component, compIndex) => {
        const cx = bounds.x + 2.5 + compIndex * componentSpacing;
        
        slide.addShape(this.pres.ShapeType.rect, {
          x: cx - 0.3,
          y: layerY - 0.15,
          w: 0.6,
          h: 0.3,
          fill: { color: theme.primary || '#00E5FF', transparency: 70 },
          line: { color: theme.primary || '#00E5FF', width: 1 }
        });
        elements.push({ type: 'rect', name: `component_${index}_${compIndex}` });
        
        slide.addText(component, {
          x: cx - 0.25,
          y: layerY - 0.1,
          w: 0.5,
          h: 0.2,
          fontSize: 8,
          color: '#FFFFFF'
        });
        elements.push({ type: 'text', name: `component_text_${index}_${compIndex}` });
      });
      
      // Connection lines to other layers
      layer.connections.forEach((connection, connIndex) => {
        const targetLayerIndex = layers.findIndex(l => l.name === connection);
        if (targetLayerIndex > index) {
          const targetY = bounds.y + targetLayerIndex * layerHeight + layerHeight / 2;
          
          slide.addShape(this.pres.ShapeType.line, {
            x: bounds.x + bounds.w - 0.5,
            y: layerY,
            w: 0,
            h: targetY - layerY,
            line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
          });
          elements.push({ type: 'line', name: `connection_${index}_${connIndex}` });
        }
      });
    });
    
    return { graphType: 'repository_structure', elements };
  }

  generatePipelineGraph(slide, bounds, theme) {
    const elements = [];
    const pipelines = Object.keys(PIPELINE_CONNECTIONS);
    const pipelineSpacing = bounds.h / pipelines.length;
    
    pipelines.forEach((pipelineName, index) => {
      const pipeline = PIPELINE_CONNECTIONS[pipelineName];
      const y = bounds.y + index * pipelineSpacing + pipelineSpacing / 2;
      
      // Source node
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x + 0.5,
        y: y - 0.2,
        w: 1.5,
        h: 0.4,
        fill: { color: theme.primary || '#FFC400', transparency: 70 },
        line: { color: theme.primary || '#FFC400', width: 2 }
      });
      elements.push({ type: 'rect', name: `pipeline_source_${index}` });
      
      slide.addText(pipeline.source, {
        x: bounds.x + 0.6,
        y: y - 0.1,
        w: 1.3,
        h: 0.2,
        fontSize: 9,
        color: '#FFFFFF'
      });
      elements.push({ type: 'text', name: `pipeline_source_text_${index}` });
      
      // Flow components
      const flowSpacing = 0.8;
      pipeline.flow.forEach((flowComponent, flowIndex) => {
        const fx = bounds.x + 2.5 + flowIndex * flowSpacing;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: fx - 0.15,
          y: y - 0.15,
          w: 0.3,
          h: 0.3,
          fill: { color: theme.primary || '#00E5FF', transparency: 70 },
          line: { color: theme.primary || '#00E5FF', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `pipeline_flow_${index}_${flowIndex}` });
        
        slide.addText(flowComponent, {
          x: fx - 0.2,
          y: y - 0.1,
          w: 0.4,
          h: 0.2,
          fontSize: 7,
          color: '#FFFFFF'
        });
        elements.push({ type: 'text', name: `pipeline_flow_text_${index}_${flowIndex}` });
        
        // Connection arrow
        if (flowIndex < pipeline.flow.length - 1) {
          slide.addShape(this.pres.ShapeType.line, {
            x: fx + 0.15,
            y: y,
            w: flowSpacing - 0.3,
            h: 0,
            line: { color: theme.primary || '#00E5FF', width: 1 }
          });
          elements.push({ type: 'line', name: `pipeline_arrow_${index}_${flowIndex}` });
        }
      });
      
      // Destination node
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x + bounds.w - 2,
        y: y - 0.2,
        w: 1.5,
        h: 0.4,
        fill: { color: theme.primary || '#FFC400', transparency: 70 },
        line: { color: theme.primary || '#FFC400', width: 2 }
      });
      elements.push({ type: 'rect', name: `pipeline_dest_${index}` });
      
      slide.addText(pipeline.destination, {
        x: bounds.x + bounds.w - 1.9,
        y: y - 0.1,
        w: 1.3,
        h: 0.2,
        fontSize: 9,
        color: '#FFFFFF'
      });
      elements.push({ type: 'text', name: `pipeline_dest_text_${index}` });
    });
    
    return { graphType: 'pipeline_connections', elements };
  }

  generateMCPGraph(slide, bounds, theme) {
    const elements = [];
    const tools = Object.keys(MCP_TOOLS);
    const toolSpacing = bounds.w / tools.length;
    
    tools.forEach((toolName, index) => {
      const tool = MCP_TOOLS[toolName];
      const x = bounds.x + index * toolSpacing + toolSpacing / 2;
      const y = bounds.y + bounds.h / 2;
      
      // Tool node
      slide.addShape(this.pres.ShapeType.rect, {
        x: x - 0.4,
        y: y - 0.3,
        w: 0.8,
        h: 0.6,
        fill: { color: theme.primary || '#00FF00', transparency: 70 },
        line: { color: theme.primary || '#00FF00', width: 2 }
      });
      elements.push({ type: 'rect', name: `mcp_tool_${index}` });
      
      slide.addText(toolName, {
        x: x - 0.35,
        y: y - 0.2,
        w: 0.7,
        h: 0.15,
        fontSize: 9,
        color: '#FFFFFF',
        bold: true
      });
      elements.push({ type: 'text', name: `mcp_tool_text_${index}` });
      
      slide.addText(tool.category, {
        x: x - 0.35,
        y: y + 0.05,
        w: 0.7,
        h: 0.15,
        fontSize: 7,
        color: '#FFFFFF'
      });
      elements.push({ type: 'text', name: `mcp_category_text_${index}` });
      
      // Connection lines
      tool.connections.forEach((connection, connIndex) => {
        const angle = (connIndex / tool.connections.length) * Math.PI * 2;
        const lineLength = 0.5;
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: y,
          w: Math.cos(angle) * lineLength,
          h: Math.sin(angle) * lineLength,
          line: { color: theme.primary || '#00FF00', width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: `mcp_connection_${index}_${connIndex}` });
      });
    });
    
    return { graphType: 'mcp_tools', elements };
  }

  generateVectorGraph(slide, bounds, theme) {
    const elements = [];
    const stores = Object.keys(VECTOR_STORES);
    const storeSpacing = bounds.w / stores.length;
    
    stores.forEach((storeName, index) => {
      const store = VECTOR_STORES[storeName];
      const x = bounds.x + index * storeSpacing + storeSpacing / 2;
      const y = bounds.y + bounds.h / 2;
      
      // Store node (cylinder-like)
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: x - 0.3,
        y: y - 0.4,
        w: 0.6,
        h: 0.3,
        fill: { color: theme.primary || '#FF00FF', transparency: 70 },
        line: { color: theme.primary || '#FF00FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `vector_top_${index}` });
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: x - 0.3,
        y: y - 0.25,
        w: 0.6,
        h: 0.5,
        fill: { color: theme.primary || '#FF00FF', transparency: 70 },
        line: { color: theme.primary || '#FF00FF', width: 2 }
      });
      elements.push({ type: 'rect', name: `vector_body_${index}` });
      
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: x - 0.3,
        y: y + 0.25,
        w: 0.6,
        h: 0.3,
        fill: { color: theme.primary || '#FF00FF', transparency: 70 },
        line: { color: theme.primary || '#FF00FF', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `vector_bottom_${index}` });
      
      slide.addText(storeName, {
        x: x - 0.25,
        y: y - 0.1,
        w: 0.5,
        h: 0.2,
        fontSize: 9,
        color: '#FFFFFF',
        bold: true
      });
      elements.push({ type: 'text', name: `vector_text_${index}` });
      
      slide.addText(store.type, {
        x: x - 0.25,
        y: y + 0.1,
        w: 0.5,
        h: 0.15,
        fontSize: 7,
        color: '#FFFFFF'
      });
      elements.push({ type: 'text', name: `vector_type_text_${index}` });
    });
    
    return { graphType: 'vector_stores', elements };
  }

  generateReplayGraph(slide, bounds, theme) {
    const elements = [];
    const systems = Object.keys(REPLAY_SYSTEMS);
    const systemSpacing = bounds.w / systems.length;
    
    systems.forEach((systemName, index) => {
      const system = REPLAY_SYSTEMS[systemName];
      const x = bounds.x + index * systemSpacing + systemSpacing / 2;
      const y = bounds.y + bounds.h / 2;
      
      // System node (ring structure)
      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        const radius = 0.3 - i * 0.08;
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - radius,
          y: y - radius,
          w: radius * 2,
          h: radius * 2,
          fill: { color: theme.primary || '#C0C0C0', transparency: 70 + i * 10 },
          line: { color: theme.primary || '#C0C0C0', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `replay_ring_${index}_${i}` });
      }
      
      slide.addText(systemName, {
        x: x - 0.25,
        y: y - 0.1,
        w: 0.5,
        h: 0.2,
        fontSize: 9,
        color: '#FFFFFF',
        bold: true
      });
      elements.push({ type: 'text', name: `replay_text_${index}` });
      
      // Connection lines
      system.connections.forEach((connection, connIndex) => {
        const angle = (connIndex / system.connections.length) * Math.PI * 2;
        const lineLength = 0.4;
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: y,
          w: Math.cos(angle) * lineLength,
          h: Math.sin(angle) * lineLength,
          line: { color: theme.primary || '#C0C0C0', width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: `replay_connection_${index}_${connIndex}` });
      });
    });
    
    return { graphType: 'replay_systems', elements };
  }

  generateWitnessGraph(slide, bounds, theme) {
    const elements = [];
    
    // Witness system central node
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 0.4,
      y: centerY - 0.4,
      w: 0.8,
      h: 0.8,
      fill: { color: theme.primary || '#FFC400', transparency: 70 },
      line: { color: theme.primary || '#FFC400', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'witness_central' });
    
    slide.addText('WITNESS', {
      x: centerX - 0.3,
      y: centerY - 0.1,
      w: 0.6,
      h: 0.2,
      fontSize: 10,
      color: '#FFFFFF',
      bold: true
    });
    elements.push({ type: 'text', name: 'witness_text' });
    
    // Satellite nodes
    const satellites = ['audit_trail', 'verification', 'compliance'];
    const satelliteCount = satellites.length;
    
    satellites.forEach((satellite, index) => {
      const angle = (index / satelliteCount) * Math.PI * 2;
      const radius = 0.6;
      const sx = centerX + Math.cos(angle) * radius;
      const sy = centerY + Math.sin(angle) * radius;
      
      slide.addShape(this.pres.ShapeType.rect, {
        x: sx - 0.2,
        y: sy - 0.15,
        w: 0.4,
        h: 0.3,
        fill: { color: theme.primary || '#FFC400', transparency: 70 },
        line: { color: theme.primary || '#FFC400', width: 2 }
      });
      elements.push({ type: 'rect', name: `witness_satellite_${index}` });
      
      slide.addText(satellite, {
        x: sx - 0.18,
        y: sy - 0.1,
        w: 0.36,
        h: 0.2,
        fontSize: 8,
        color: '#FFFFFF'
      });
      elements.push({ type: 'text', name: `witness_satellite_text_${index}` });
      
      // Connection line
      slide.addShape(this.pres.ShapeType.line, {
        x: centerX,
        y: centerY,
        w: sx - centerX,
        h: sy - centerY,
        line: { color: theme.primary || '#FFC400', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `witness_connection_${index}` });
    });
    
    return { graphType: 'witness_systems', elements };
  }

  generateAuthorityGraph(slide, bounds, theme) {
    const elements = [];
    const systems = Object.keys(AUTHORITY_SYSTEMS);
    const systemSpacing = bounds.w / systems.length;
    
    systems.forEach((systemName, index) => {
      const system = AUTHORITY_SYSTEMS[systemName];
      const x = bounds.x + index * systemSpacing + systemSpacing / 2;
      const y = bounds.y + bounds.h / 2;
      
      // Authority node (monument-like)
      slide.addShape(this.pres.ShapeType.rect, {
        x: x - 0.3,
        y: y - 0.4,
        w: 0.6,
        h: 0.8,
        fill: { color: theme.primary || '#FFC400', transparency: 70 },
        line: { color: theme.primary || '#FFC400', width: 3 }
      });
      elements.push({ type: 'rect', name: `authority_body_${index}` });
      
      // Crown
      slide.addShape(this.pres.ShapeType.triangle, {
        x: x - 0.2,
        y: y - 0.6,
        w: 0.4,
        h: 0.2,
        fill: { color: theme.primary || '#FFC400', transparency: 70 },
        line: { color: theme.primary || '#FFC400', width: 2 }
      });
      elements.push({ type: 'triangle', name: `authority_crown_${index}` });
      
      slide.addText(systemName, {
        x: x - 0.25,
        y: y - 0.1,
        w: 0.5,
        h: 0.2,
        fontSize: 9,
        color: '#FFFFFF',
        bold: true
      });
      elements.push({ type: 'text', name: `authority_text_${index}` });
      
      slide.addText(system.type, {
        x: x - 0.25,
        y: y + 0.1,
        w: 0.5,
        h: 0.15,
        fontSize: 7,
        color: '#FFFFFF'
      });
      elements.push({ type: 'text', name: `authority_type_text_${index}` });
    });
    
    return { graphType: 'authority_systems', elements };
  }

  generateDefaultGraph(slide, bounds, theme) {
    const elements = [];
    
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: theme.primary || '#FFFFFF', transparency: 70 },
      line: { color: theme.primary || '#FFFFFF', width: 2 }
    });
    elements.push({ type: 'rect', name: 'default_graph' });
    
    return { graphType: 'default', elements };
  }
}

module.exports = {
  KnowledgeRelationshipEngine,
  KNOWLEDGE_GRAPH_TYPES,
  PING_REPOSITORY_STRUCTURE,
  PIPELINE_CONNECTIONS,
  MCP_TOOLS,
  VECTOR_STORES,
  REPLAY_SYSTEMS,
  AUTHORITY_SYSTEMS
};
