// ── OBSERVABILITY PROJECTION LAYER ───────────────────────────────────
// V14: Visualize Reality → Events → Canonical State → Knowledge Graph → Witness Layer → Projection Layer → Human View
// The projection layer is not another box - it is the viewing window into civilization

const OBSERVABILITY_LAYERS = {
  REALITY: {
    name: 'Reality',
    order: 1,
    description: 'External world state',
    color: '#FFFFFF',
    icon: 'world'
  },
  EVENTS: {
    name: 'Events',
    order: 2,
    description: 'Event emissions from reality',
    color: '#00E5FF',
    icon: 'event'
  },
  CANONICAL_STATE: {
    name: 'Canonical State',
    order: 3,
    description: 'Reconstructable system state',
    color: '#C0C0C0',
    icon: 'state'
  },
  KNOWLEDGE_GRAPH: {
    name: 'Knowledge Graph',
    order: 4,
    description: 'Semantic knowledge relationships',
    color: '#FF00FF',
    icon: 'graph'
  },
  WITNESS_LAYER: {
    name: 'Witness Layer',
    order: 5,
    description: 'Constitutional compliance verification',
    color: '#FFC400',
    icon: 'witness'
  },
  PROJECTION_LAYER: {
    name: 'Projection Layer',
    order: 6,
    description: 'Visualization window',
    color: '#00E5FF',
    icon: 'projection'
  },
  HUMAN_VIEW: {
    name: 'Human View',
    order: 7,
    description: 'User-facing presentation',
    color: '#00FF00',
    icon: 'human'
  }
};

class ObservabilityProjectionEngine {
  constructor(pres) {
    this.pres = pres;
    this.layerHistory = new Map();
  }

  renderObservabilityStack(slide, bounds, theme) {
    const elements = [];
    const layers = Object.values(OBSERVABILITY_LAYERS).sort((a, b) => a.order - b.order);
    const layerHeight = bounds.h / layers.length;
    
    layers.forEach((layer, index) => {
      const y = bounds.y + index * layerHeight;
      const layerY = y + layerHeight / 2;
      
      // Layer container (architectural frame, not transparent box)
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x,
        y: y,
        w: bounds.w,
        h: layerHeight,
        fill: { color: layer.color, transparency: 85 },
        line: { color: layer.color, width: 2 }
      });
      elements.push({ type: 'rect', name: `observability_layer_${layer.name}` });
      
      // Layer name
      slide.addText(layer.name, {
        x: bounds.x + 0.2,
        y: layerY - 0.1,
        w: 2,
        h: 0.2,
        fontSize: 10,
        color: layer.color,
        bold: true
      });
      elements.push({ type: 'text', name: `observability_label_${layer.name}` });
      
      // Layer description
      slide.addText(layer.description, {
        x: bounds.x + 0.2,
        y: layerY + 0.05,
        w: 2,
        h: 0.15,
        fontSize: 7,
        color: '#CCCCCC'
      });
      elements.push({ type: 'text', name: `observability_desc_${layer.name}` });
      
      // Layer icon
      this.renderLayerIcon(slide, layer.icon, bounds.x + bounds.w - 0.3, layerY, layer.color, elements);
      
      // Connection arrow to next layer
      if (index < layers.length - 1) {
        const nextLayer = layers[index + 1];
        const nextY = y + layerHeight;
        
        slide.addShape(this.pres.ShapeType.line, {
          x: bounds.x + bounds.w / 2,
          y: y + layerHeight - 0.1,
          w: 0,
          h: 0.2,
          line: { color: layer.color, width: 2 }
        });
        elements.push({ type: 'line', name: `observability_connection_${index}` });
        
        slide.addShape(this.pres.ShapeType.triangle, {
          x: bounds.x + bounds.w / 2 - 0.08,
          y: nextY - 0.12,
          w: 0.16,
          h: 0.16,
          fill: { color: layer.color, transparency: 70 },
          line: { color: layer.color, width: 1 }
        });
        elements.push({ type: 'triangle', name: `observability_arrow_${index}` });
      }
    });
    
    return { elements };
  }

  renderLayerIcon(slide, iconType, x, y, color, elements) {
    switch (iconType) {
      case 'world':
        // World icon (circle with grid)
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.1,
          w: 0.2,
          h: 0.2,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_world' });
        
        // Grid lines
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.1,
          y: y,
          w: 0.2,
          h: 0,
          line: { color: color, width: 0.5 }
        });
        elements.push({ type: 'line', name: 'icon_world_h' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: y - 0.1,
          w: 0,
          h: 0.2,
          line: { color: color, width: 0.5 }
        });
        elements.push({ type: 'line', name: 'icon_world_v' });
        break;

      case 'event':
        // Event icon (lightning bolt)
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.05,
          y: y - 0.1,
          w: 0.05,
          h: 0.1,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_event_1' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: y,
          w: 0.05,
          h: -0.08,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_event_2' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x + 0.05,
          y: y - 0.08,
          w: 0,
          h: 0.08,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_event_3' });
        break;

      case 'state':
        // State icon (database cylinder)
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.12,
          w: 0.2,
          h: 0.08,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_state_top' });
        
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.1,
          y: y - 0.08,
          w: 0.2,
          h: 0.16,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'rect', name: 'icon_state_body' });
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y + 0.08,
          w: 0.2,
          h: 0.08,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_state_bottom' });
        break;

      case 'graph':
        // Graph icon (network nodes)
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.05,
          w: 0.08,
          h: 0.08,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_graph_node1' });
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x + 0.02,
          y: y - 0.1,
          w: 0.08,
          h: 0.08,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_graph_node2' });
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x + 0.02,
          y: y + 0.05,
          w: 0.08,
          h: 0.08,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_graph_node3' });
        
        // Connections
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.06,
          y: y - 0.01,
          w: 0.08,
          h: -0.09,
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: 'icon_graph_conn1' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.06,
          y: y - 0.01,
          w: 0.08,
          h: 0.06,
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: 'icon_graph_conn2' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x + 0.06,
          y: y - 0.06,
          w: 0,
          h: 0.11,
          line: { color: color, width: 1, dashType: 'dash' }
        });
        elements.push({ type: 'line', name: 'icon_graph_conn3' });
        break;

      case 'witness':
        // Witness icon (eye)
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.1,
          y: y - 0.06,
          w: 0.2,
          h: 0.12,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'ellipse', name: 'icon_witness_eye' });
        
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.04,
          y: y - 0.04,
          w: 0.08,
          h: 0.08,
          fill: { color: '#000000', transparency: 50 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_witness_pupil' });
        break;

      case 'projection':
        // Projection icon (screen)
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.1,
          y: y - 0.08,
          w: 0.2,
          h: 0.16,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'rect', name: 'icon_projection_screen' });
        
        // Stand
        slide.addShape(this.pres.ShapeType.line, {
          x: x,
          y: y + 0.08,
          w: 0,
          h: 0.08,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_projection_stand' });
        
        slide.addShape(this.pres.ShapeType.line, {
          x: x - 0.05,
          y: y + 0.16,
          w: 0.1,
          h: 0,
          line: { color: color, width: 2 }
        });
        elements.push({ type: 'line', name: 'icon_projection_base' });
        break;

      case 'human':
        // Human icon (person)
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.04,
          y: y - 0.12,
          w: 0.08,
          h: 0.08,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_human_head' });
        
        slide.addShape(this.pres.ShapeType.rect, {
          x: x - 0.06,
          y: y - 0.04,
          w: 0.12,
          h: 0.12,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'rect', name: 'icon_human_body' });
        break;

      default:
        // Default circle
        slide.addShape(this.pres.ShapeType.ellipse, {
          x: x - 0.08,
          y: y - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: color, transparency: 70 },
          line: { color: color, width: 1 }
        });
        elements.push({ type: 'ellipse', name: 'icon_default' });
        break;
    }
  }

  renderObservatoryView(slide, bounds, theme) {
    const elements = [];
    
    // Observatory dome (viewing window into civilization)
    const domeRadius = Math.min(bounds.w, bounds.h) * 0.4;
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    
    // Dome structure
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - domeRadius,
      y: centerY - domeRadius * 1.2,
      w: domeRadius * 2,
      h: domeRadius * 2.4,
      fill: { color: '#1A1A1F', transparency: 80 },
      line: { color: theme.primary || '#00E5FF', width: 3 }
    });
    elements.push({ type: 'ellipse', name: 'observatory_dome' });
    
    // Viewing port (projection window)
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - domeRadius * 0.6,
      y: centerY - domeRadius * 0.6,
      w: domeRadius * 1.2,
      h: domeRadius * 1.2,
      fill: { color: theme.primary || '#00E5FF', transparency: 90 },
      line: { color: theme.primary || '#00E5FF', width: 2, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'observatory_viewport' });
    
    // Render observability layers inside viewport
    const viewportBounds = {
      x: centerX - domeRadius * 0.5,
      y: centerY - domeRadius * 0.5,
      w: domeRadius,
      h: domeRadius
    };
    
    const layerElements = this.renderObservabilityStack(slide, viewportBounds, theme);
    elements.push(...layerElements.elements);
    
    // Observatory base
    slide.addShape(this.pres.ShapeType.rect, {
      x: centerX - domeRadius * 0.7,
      y: centerY + domeRadius * 0.4,
      w: domeRadius * 1.4,
      h: bounds.h * 0.3,
      fill: { color: '#1A1A1F', transparency: 70 },
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'rect', name: 'observatory_base' });
    
    // Title
    slide.addText('OBSERVABILITY PROJECTION LAYER', {
      x: bounds.x,
      y: bounds.y + bounds.h - 0.25,
      w: bounds.w,
      h: 0.2,
      fontSize: 11,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'observatory_title' });
    
    return { elements };
  }

  getLayer(layerKey) {
    return OBSERVABILITY_LAYERS[layerKey];
  }

  getAllLayers() {
    return OBSERVABILITY_LAYERS;
  }
}

module.exports = {
  ObservabilityProjectionEngine,
  OBSERVABILITY_LAYERS
};
