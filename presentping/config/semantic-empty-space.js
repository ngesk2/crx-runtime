// ── SEMANTIC EMPTY SPACE ENGINE ─────────────────────────────────────
// Critical Failure #2: Empty space engine is too dumb
// Every empty space must carry narrative meaning, not decorative filler

const SEMANTIC_FILL_PATTERNS = {
  SLIDE_1: {
    theme: 'network_topology',
    elements: ['provider_constellation', 'routing_graph', 'gateway_network'],
    description: 'Network topology showing provider constellation and routing architecture'
  },
  SLIDE_2: {
    theme: 'knowledge_graph',
    elements: ['vector_neighborhood', 'retrieval_lattice', 'knowledge_clusters'],
    description: 'Knowledge graph showing vector neighborhoods and retrieval lattice'
  },
  SLIDE_3: {
    theme: 'authority_reactor',
    elements: ['authority_internals', 'execution_pathways', 'constitutional_layers'],
    description: 'Authority reactor internals showing execution pathways'
  },
  SLIDE_4: {
    theme: 'plane_architecture',
    elements: ['projection_layers', 'holographic_planes', 'ui_components'],
    description: 'Plane projection architecture showing holographic layers'
  },
  SLIDE_5: {
    theme: 'mcp_workforce',
    elements: ['agent_assembly_lines', 'worker_clusters', 'tool_connections'],
    description: 'MCP workforce showing agent assembly lines and tool connections'
  },
  SLIDE_6: {
    theme: 'replay_civilization',
    elements: ['replay_rings', 'memory_topology', 'civilization_layers'],
    description: 'Replay rings showing civilization memory topology'
  }
};

class SemanticEmptySpaceEngine {
  constructor() {
    this.fillHistory = new Map();
  }

  detectSemanticVoid(slideNumber, objects) {
    // Detect empty areas that could carry narrative meaning
    const slideArea = 10 * 7.5;
    const objectArea = objects.reduce((sum, obj) => sum + (obj.w || 0) * (obj.h || 0), 0);
    const emptyRatio = (slideArea - objectArea) / slideArea;
    
    // Identify specific void regions
    const voidRegions = this.identifyVoidRegions(objects);
    
    return {
      emptyRatio,
      exceedsThreshold: emptyRatio > 0.18,
      voidRegions,
      semanticTheme: SEMANTIC_FILL_PATTERNS[`SLIDE_${slideNumber}`]
    };
  }

  identifyVoidRegions(objects) {
    // Divide slide into grid and identify empty cells
    const gridSize = 0.5; // 0.5 inch grid cells
    const cols = Math.ceil(10 / gridSize);
    const rows = Math.ceil(7.5 / gridSize);
    const grid = [];
    
    // Initialize grid
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid.push({ x: x * gridSize, y: y * gridSize, w: gridSize, h: gridSize, occupied: false });
      }
    }
    
    // Mark occupied cells
    objects.forEach(obj => {
      const startX = Math.floor((obj.x || 0) / gridSize);
      const startY = Math.floor((obj.y || 0) / gridSize);
      const endX = Math.ceil((obj.x + (obj.w || 0)) / gridSize);
      const endY = Math.ceil((obj.y + (obj.h || 0)) / gridSize);
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const index = y * cols + x;
          if (index >= 0 && index < grid.length) {
            grid[index].occupied = true;
          }
        }
      }
    });
    
    // Group adjacent empty cells into regions
    const regions = [];
    const visited = new Set();
    
    grid.forEach((cell, index) => {
      if (!cell.occupied && !visited.has(index)) {
        const region = this.floodFill(grid, index, cols, visited);
        if (region.length > 4) { // Only regions larger than 4 cells
          regions.push({
            cells: region,
            area: region.length * gridSize * gridSize,
            boundingBox: this.calculateBoundingBox(region, gridSize)
          });
        }
      }
    });
    
    return regions;
  }

  floodFill(grid, startIndex, cols, visited) {
    const region = [];
    const queue = [startIndex];
    
    while (queue.length > 0) {
      const index = queue.shift();
      if (visited.has(index)) continue;
      if (index < 0 || index >= grid.length) continue;
      if (grid[index].occupied) continue;
      
      visited.add(index);
      region.push(index);
      
      // Add neighbors
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      queue.push(index - 1); // Left
      queue.push(index + 1); // Right
      queue.push(index - cols); // Up
      queue.push(index + cols); // Down
    }
    
    return region;
  }

  calculateBoundingBox(region, gridSize) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    region.forEach(index => {
      const row = Math.floor(index / Math.ceil(10 / gridSize));
      const col = index % Math.ceil(10 / gridSize);
      
      minX = Math.min(minX, col * gridSize);
      minY = Math.min(minY, row * gridSize);
      maxX = Math.max(maxX, (col + 1) * gridSize);
      maxY = Math.max(maxY, (row + 1) * gridSize);
    });
    
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  addSemanticFill(slide, pres, slideNumber, voidInfo) {
    const theme = voidInfo.semanticTheme;
    if (!theme) return [];
    
    const fills = [];
    
    theme.elements.forEach((elementType, index) => {
      const region = voidInfo.voidRegions[index % voidInfo.voidRegions.length];
      if (!region) return;
      
      const fill = this.renderSemanticElement(slide, pres, elementType, region.boundingBox, theme.theme);
      fills.push(fill);
    });
    
    this.fillHistory.set(slideNumber, fills);
    return fills;
  }

  renderSemanticElement(slide, pres, elementType, bounds, theme) {
    switch (theme) {
      case 'network_topology':
        return this.renderNetworkTopology(slide, pres, elementType, bounds);
      case 'knowledge_graph':
        return this.renderKnowledgeGraph(slide, pres, elementType, bounds);
      case 'authority_reactor':
        return this.renderAuthorityReactor(slide, pres, elementType, bounds);
      case 'plane_architecture':
        return this.renderPlaneArchitecture(slide, pres, elementType, bounds);
      case 'mcp_workforce':
        return this.renderMCPWorkforce(slide, pres, elementType, bounds);
      case 'replay_civilization':
        return this.renderReplayCivilization(slide, pres, elementType, bounds);
      default:
        return null;
    }
  }

  renderNetworkTopology(slide, pres, elementType, bounds) {
    const elements = [];
    
    switch (elementType) {
      case 'provider_constellation':
        // Render constellation of provider nodes
        const nodeCount = 5;
        for (let i = 0; i < nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2;
          const radius = Math.min(bounds.w, bounds.h) * 0.3;
          const x = bounds.x + bounds.w / 2 + Math.cos(angle) * radius;
          const y = bounds.y + bounds.h / 2 + Math.sin(angle) * radius;
          
          slide.addShape(pres.ShapeType.ellipse, {
            x: x - 0.1, y: y - 0.1, w: 0.2, h: 0.2,
            fill: { color: '#00E5FF', transparency: 70 },
            line: { color: '#00E5FF', width: 1 },
            name: `provider_node_${i}`
          });
          elements.push({ type: 'ellipse', name: `provider_node_${i}`, x: x - 0.1, y: y - 0.1, w: 0.2, h: 0.2 });
        }
        break;
        
      case 'routing_graph':
        // Render routing lines between nodes
        slide.addShape(pres.ShapeType.line, {
          x: bounds.x, y: bounds.y + bounds.h / 2,
          w: bounds.w, h: 0,
          line: { color: '#00E5FF', width: 1, dashType: 'dash' },
          name: 'routing_line'
        });
        elements.push({ type: 'line', name: 'routing_line', x: bounds.x, y: bounds.y + bounds.h / 2, w: bounds.w, h: 0 });
        break;
        
      case 'gateway_network':
        // Render gateway network visualization
        slide.addShape(pres.ShapeType.rect, {
          x: bounds.x + bounds.w * 0.3, y: bounds.y + bounds.h * 0.3,
          w: bounds.w * 0.4, h: bounds.h * 0.4,
          fill: { color: '#FFC400', transparency: 80 },
          line: { color: '#FFC400', width: 2 },
          name: 'gateway_network'
        });
        elements.push({ type: 'rect', name: 'gateway_network', x: bounds.x + bounds.w * 0.3, y: bounds.y + bounds.h * 0.3, w: bounds.w * 0.4, h: bounds.h * 0.4 });
        break;
    }
    
    return { elementType, elements };
  }

  renderKnowledgeGraph(slide, pres, elementType, bounds) {
    const elements = [];
    
    switch (elementType) {
      case 'vector_neighborhood':
        // Render vector neighborhood as connected dots
        const dotCount = 8;
        for (let i = 0; i < dotCount; i++) {
          const x = bounds.x + Math.random() * bounds.w;
          const y = bounds.y + Math.random() * bounds.h;
          
          slide.addShape(pres.ShapeType.ellipse, {
            x: x - 0.05, y: y - 0.05, w: 0.1, h: 0.1,
            fill: { color: '#FF00FF', transparency: 60 },
            line: { color: '#FF00FF', width: 1 },
            name: `vector_dot_${i}`
          });
          elements.push({ type: 'ellipse', name: `vector_dot_${i}`, x: x - 0.05, y: y - 0.05, w: 0.1, h: 0.1 });
        }
        break;
        
      case 'retrieval_lattice':
        // Render lattice structure
        slide.addShape(pres.ShapeType.line, {
          x: bounds.x, y: bounds.y,
          w: bounds.w, h: bounds.h,
          line: { color: '#FF00FF', width: 1, dashType: 'dash' },
          name: 'lattice_diagonal'
        });
        elements.push({ type: 'line', name: 'lattice_diagonal', x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
        break;
        
      case 'knowledge_clusters':
        // Render knowledge clusters
        const clusterCount = 3;
        for (let i = 0; i < clusterCount; i++) {
          const cx = bounds.x + bounds.w * (0.2 + i * 0.3);
          const cy = bounds.y + bounds.h * 0.5;
          
          slide.addShape(pres.ShapeType.ellipse, {
            x: cx - 0.15, y: cy - 0.15, w: 0.3, h: 0.3,
            fill: { color: '#FF00FF', transparency: 50 },
            line: { color: '#FF00FF', width: 1 },
            name: `knowledge_cluster_${i}`
          });
          elements.push({ type: 'ellipse', name: `knowledge_cluster_${i}`, x: cx - 0.15, y: cy - 0.15, w: 0.3, h: 0.3 });
        }
        break;
    }
    
    return { elementType, elements };
  }

  renderAuthorityReactor(slide, pres, elementType, bounds) {
    const elements = [];
    
    switch (elementType) {
      case 'authority_internals':
        // Render concentric circles representing authority layers
        const layers = 3;
        for (let i = 0; i < layers; i++) {
          const radius = (bounds.w * 0.4) * (1 - i * 0.25);
          slide.addShape(pres.ShapeType.ellipse, {
            x: bounds.x + bounds.w / 2 - radius,
            y: bounds.y + bounds.h / 2 - radius,
            w: radius * 2, h: radius * 2,
            fill: { color: '#FFC400', transparency: 70 + i * 10 },
            line: { color: '#FFC400', width: 2 - i * 0.5 },
            name: `authority_layer_${i}`
          });
          elements.push({ type: 'ellipse', name: `authority_layer_${i}`, x: bounds.x + bounds.w / 2 - radius, y: bounds.y + bounds.h / 2 - radius, w: radius * 2, h: radius * 2 });
        }
        break;
        
      case 'execution_pathways':
        // Render execution pathways as radiating lines
        const pathwayCount = 6;
        for (let i = 0; i < pathwayCount; i++) {
          const angle = (i / pathwayCount) * Math.PI * 2;
          slide.addShape(pres.ShapeType.line, {
            x: bounds.x + bounds.w / 2,
            y: bounds.y + bounds.h / 2,
            w: Math.cos(angle) * bounds.w * 0.4,
            h: Math.sin(angle) * bounds.h * 0.4,
            line: { color: '#FFC400', width: 1 },
            name: `execution_pathway_${i}`
          });
          elements.push({ type: 'line', name: `execution_pathway_${i}`, x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2, w: Math.cos(angle) * bounds.w * 0.4, h: Math.sin(angle) * bounds.h * 0.4 });
        }
        break;
        
      case 'constitutional_layers':
        // Render horizontal layers
        const layerCount = 4;
        for (let i = 0; i < layerCount; i++) {
          const y = bounds.y + bounds.h * (0.2 + i * 0.2);
          slide.addShape(pres.ShapeType.line, {
            x: bounds.x, y: y,
            w: bounds.w, h: 0,
            line: { color: '#FFC400', width: 1, dashType: 'dash' },
            name: `constitutional_layer_${i}`
          });
          elements.push({ type: 'line', name: `constitutional_layer_${i}`, x: bounds.x, y: y, w: bounds.w, h: 0 });
        }
        break;
    }
    
    return { elementType, elements };
  }

  renderPlaneArchitecture(slide, pres, elementType, bounds) {
    const elements = [];
    
    switch (elementType) {
      case 'projection_layers':
        // Render stacked projection planes
        const planeCount = 3;
        for (let i = 0; i < planeCount; i++) {
          const offset = i * 0.15;
          slide.addShape(pres.ShapeType.rect, {
            x: bounds.x + offset, y: bounds.y + offset,
            w: bounds.w - offset * 2, h: bounds.h - offset * 2,
            fill: { color: '#00E5FF', transparency: 60 + i * 15 },
            line: { color: '#00E5FF', width: 1 },
            name: `projection_plane_${i}`
          });
          elements.push({ type: 'rect', name: `projection_plane_${i}`, x: bounds.x + offset, y: bounds.y + offset, w: bounds.w - offset * 2, h: bounds.h - offset * 2 });
        }
        break;
        
      case 'holographic_planes':
        // Render holographic effect with gradient
        slide.addShape(pres.ShapeType.rect, {
          x: bounds.x, y: bounds.y,
          w: bounds.w, h: bounds.h,
          fill: { color: '#00E5FF', transparency: 85 },
          line: { color: '#00E5FF', width: 1, dashType: 'dash' },
          name: 'holographic_plane'
        });
        elements.push({ type: 'rect', name: 'holographic_plane', x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h });
        break;
        
      case 'ui_components':
        // Render UI component placeholders
        const uiCount = 4;
        for (let i = 0; i < uiCount; i++) {
          const x = bounds.x + bounds.w * (0.1 + i * 0.25);
          const y = bounds.y + bounds.h * 0.5;
          slide.addShape(pres.ShapeType.rect, {
            x: x, y: y - 0.2,
            w: 0.3, h: 0.4,
            fill: { color: '#00E5FF', transparency: 70 },
            line: { color: '#00E5FF', width: 1 },
            name: `ui_component_${i}`
          });
          elements.push({ type: 'rect', name: `ui_component_${i}`, x: x, y: y - 0.2, w: 0.3, h: 0.4 });
        }
        break;
    }
    
    return { elementType, elements };
  }

  renderMCPWorkforce(slide, pres, elementType, bounds) {
    const elements = [];
    
    switch (elementType) {
      case 'agent_assembly_lines':
        // Render assembly line structure
        const lineCount = 2;
        for (let i = 0; i < lineCount; i++) {
          const y = bounds.y + bounds.h * (0.3 + i * 0.4);
          slide.addShape(pres.ShapeType.line, {
            x: bounds.x, y: y,
            w: bounds.w, h: 0,
            line: { color: '#00FF00', width: 2 },
            name: `assembly_line_${i}`
          });
          elements.push({ type: 'line', name: `assembly_line_${i}`, x: bounds.x, y: y, w: bounds.w, h: 0 });
        }
        break;
        
      case 'worker_clusters':
        // Render worker clusters
        const clusterCount = 3;
        for (let i = 0; i < clusterCount; i++) {
          const cx = bounds.x + bounds.w * (0.2 + i * 0.3);
          const cy = bounds.y + bounds.h * 0.5;
          
          // Render cluster of workers
          for (let j = 0; j < 3; j++) {
            const wx = cx + (j - 1) * 0.15;
            const wy = cy + (j % 2 === 0 ? -0.1 : 0.1);
            
            slide.addShape(pres.ShapeType.rect, {
              x: wx - 0.05, y: wy - 0.05,
              w: 0.1, h: 0.1,
              fill: { color: '#00FF00', transparency: 60 },
              line: { color: '#00FF00', width: 1 },
              name: `worker_${i}_${j}`
            });
            elements.push({ type: 'rect', name: `worker_${i}_${j}`, x: wx - 0.05, y: wy - 0.05, w: 0.1, h: 0.1 });
          }
        }
        break;
        
      case 'tool_connections':
        // Render tool connection lines
        const toolCount = 5;
        for (let i = 0; i < toolCount; i++) {
          const x1 = bounds.x + bounds.w * (0.1 + i * 0.2);
          const y1 = bounds.y + bounds.h * 0.3;
          const x2 = bounds.x + bounds.w * (0.15 + i * 0.2);
          const y2 = bounds.y + bounds.h * 0.7;
          
          slide.addShape(pres.ShapeType.line, {
            x: x1, y: y1,
            w: x2 - x1, h: y2 - y1,
            line: { color: '#00FF00', width: 1, dashType: 'dash' },
            name: `tool_connection_${i}`
          });
          elements.push({ type: 'line', name: `tool_connection_${i}`, x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
        }
        break;
    }
    
    return { elementType, elements };
  }

  renderReplayCivilization(slide, pres, elementType, bounds) {
    const elements = [];
    
    switch (elementType) {
      case 'replay_rings':
        // Render concentric replay rings
        const ringCount = 4;
        for (let i = 0; i < ringCount; i++) {
          const radius = (bounds.w * 0.4) * (1 - i * 0.2);
          slide.addShape(pres.ShapeType.ellipse, {
            x: bounds.x + bounds.w / 2 - radius,
            y: bounds.y + bounds.h / 2 - radius,
            w: radius * 2, h: radius * 2,
            fill: { color: '#C0C0C0', transparency: 70 + i * 5 },
            line: { color: '#C0C0C0', width: 1 },
            name: `replay_ring_${i}`
          });
          elements.push({ type: 'ellipse', name: `replay_ring_${i}`, x: bounds.x + bounds.w / 2 - radius, y: bounds.y + bounds.h / 2 - radius, w: radius * 2, h: radius * 2 });
        }
        break;
        
      case 'memory_topology':
        // Render memory topology as grid
        const gridSize = 0.2;
        const cols = Math.floor(bounds.w / gridSize);
        const rows = Math.floor(bounds.h / gridSize);
        
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if ((x + y) % 2 === 0) {
              slide.addShape(pres.ShapeType.rect, {
                x: bounds.x + x * gridSize,
                y: bounds.y + y * gridSize,
                w: gridSize, h: gridSize,
                fill: { color: '#C0C0C0', transparency: 80 },
                line: { color: '#C0C0C0', width: 0.5 },
                name: `memory_cell_${x}_${y}`
              });
              elements.push({ type: 'rect', name: `memory_cell_${x}_${y}`, x: bounds.x + x * gridSize, y: bounds.y + y * gridSize, w: gridSize, h: gridSize });
            }
          }
        }
        break;
        
      case 'civilization_layers':
        // Render civilization layers as stacked rectangles
        const layerCount = 5;
        for (let i = 0; i < layerCount; i++) {
          const y = bounds.y + bounds.h * (0.1 + i * 0.18);
          slide.addShape(pres.ShapeType.rect, {
            x: bounds.x + bounds.w * 0.1,
            y: y,
            w: bounds.w * 0.8,
            h: bounds.h * 0.12,
            fill: { color: '#C0C0C0', transparency: 70 + i * 5 },
            line: { color: '#C0C0C0', width: 1 },
            name: `civilization_layer_${i}`
          });
          elements.push({ type: 'rect', name: `civilization_layer_${i}`, x: bounds.x + bounds.w * 0.1, y: y, w: bounds.w * 0.8, h: bounds.h * 0.12 });
        }
        break;
    }
    
    return { elementType, elements };
  }
}

module.exports = {
  SemanticEmptySpaceEngine,
  SEMANTIC_FILL_PATTERNS
};
