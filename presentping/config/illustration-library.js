// ── ILLUSTRATION LIBRARY ─────────────────────────────────────────────
// Visual metaphors for each slide - not boxes, not rectangles

const ILLUSTRATIONS = {
  // Slide 1: Border checkpoint metaphor
  BORDER_CHECKPOINT: {
    type: 'composite',
    elements: [
      {
        type: 'rect',
        description: 'Customs booth structure',
        style: 'architectural'
      },
      {
        type: 'path',
        description: 'Multiple roads converging',
        style: 'road-network'
      },
      {
        type: 'rect',
        description: 'Constitutional gate',
        style: 'border-crossing'
      },
      {
        type: 'ellipse',
        description: 'Provider clouds beyond gate',
        style: 'cloud-cluster'
      }
    ],
    visualMetaphor: 'Nation-state border crossing with passport control'
  },

  // Slide 2: Archaeological dig metaphor
  ARCHAEOLOGICAL_DIG: {
    type: 'composite',
    elements: [
      {
        type: 'rect',
        description: 'Surface layer with Qdrant',
        style: 'terrain-surface'
      },
      {
        type: 'rect',
        description: 'Knowledge graph stratum',
        style: 'sedimentary-layer'
      },
      {
        type: 'rect',
        description: 'Canonical state stratum',
        style: 'sedimentary-layer-deep'
      },
      {
        type: 'rect',
        description: 'Event log bedrock',
        style: 'bedrock-glowing'
      },
      {
        type: 'path',
        description: 'Excavation pit walls',
        style: 'cross-section'
      }
    ],
    visualMetaphor: 'Archaeological excavation revealing constitutional bedrock'
  },

  // Slide 3: Nuclear reactor metaphor
  NUCLEAR_REACTOR: {
    type: 'composite',
    elements: [
      {
        type: 'ellipse',
        description: 'Reactor core',
        style: 'energy-core'
      },
      {
        type: 'path',
        description: 'Energy channels radiating',
        style: 'power-lines'
      },
      {
        type: 'rect',
        description: 'Input fuel rod',
        style: 'fuel-assembly'
      },
      {
        type: 'rect',
        description: 'Output execution ports',
        style: 'cooling-pipes'
      },
      {
        type: 'ellipse',
        description: 'Containment field',
        style: 'shield-ring'
      }
    ],
    visualMetaphor: 'Nuclear reactor generating execution primitives from recommendations'
  },

  // Slide 4: Holographic projection metaphor
  HOLOGRAPHIC_PROJECTION: {
    type: 'composite',
    elements: [
      {
        type: 'rect',
        description: 'Golden city foundation',
        style: 'city-base'
      },
      {
        type: 'rect',
        description: 'Plane UI floating hologram',
        style: 'hologram-panel'
      },
      {
        type: 'path',
        description: 'Projection beams',
        style: 'light-columns'
      },
      {
        type: 'path',
        description: 'Golden tether connecting layers',
        style: 'energy-tether'
      },
      {
        type: 'ellipse',
        description: 'Projection field',
        style: 'hologram-glow'
      }
    ],
    visualMetaphor: 'Control room hologram showing Plane as projection of true state'
  },

  // Slide 5: Factory floor metaphor
  FACTORY_FLOOR: {
    type: 'composite',
    elements: [
      {
        type: 'rect',
        description: 'Conveyor belt (Event Log)',
        style: 'assembly-line'
      },
      {
        type: 'rect',
        description: 'MCP robotic workers',
        style: 'robot-arm'
      },
      {
        type: 'path',
        description: 'Worker connection threads',
        style: 'power-cable'
      },
      {
        type: 'rect',
        description: 'Factory floor grid',
        style: 'industrial-grid'
      },
      {
        type: 'ellipse',
        description: 'Bay lighting',
        style: 'overhead-light'
      }
    ],
    visualMetaphor: 'Industrial factory floor with robotic workers on event production line'
  },

  // Slide 6: Planetary command metaphor
  PLANETARY_COMMAND: {
    type: 'composite',
    elements: [
      {
        type: 'ellipse',
        description: 'Planet surface',
        style: 'planet-body'
      },
      {
        type: 'ellipse',
        description: 'Orbital replay rings',
        style: 'orbit-ring'
      },
      {
        type: 'path',
        description: 'Lineage constellation',
        style: 'constellation-lines'
      },
      {
        type: 'ellipse',
        description: 'Replay core at center',
        style: 'energy-core'
      },
      {
        type: 'path',
        description: 'Timeline reconstruction arcs',
        style: 'time-arc'
      },
      {
        type: 'ellipse',
        description: 'Starfield background',
        style: 'star-cluster'
      }
    ],
    visualMetaphor: 'Planetary command center viewing civilization through replay lens'
  }
};

function getIllustration(metaphorKey) {
  return ILLUSTRATIONS[metaphorKey] || null;
}

function renderIllustrationElements(slide, illustration, placement) {
  const elements = [];
  
  illustration.elements.forEach((element, index) => {
    const baseName = `${illustration.type}_${index}`;
    
    switch (element.style) {
      case 'energy-core':
        elements.push({
          type: 'ellipse',
          x: placement.x + placement.w / 2 - 0.5,
          y: placement.y + placement.h / 2 - 0.5,
          w: 1.0, h: 1.0,
          fill: { color: '#FFC400', transparency: 40 },
          line: { color: '#FFC400', width: 3 },
          shadow: { type: 'outer', blur: 20, color: 'FFC400' },
          name: `${baseName}_core`
        });
        break;
        
      case 'hologram-panel':
        elements.push({
          type: 'rect',
          x: placement.x + 0.2,
          y: placement.y + 0.2,
          w: placement.w - 0.4,
          h: placement.h - 0.4,
          fill: { color: '#00E5FF', transparency: 70 },
          line: { color: '#00E5FF', width: 2, dashType: 'dash' },
          shadow: { type: 'outer', blur: 15, color: '00E5FF' },
          name: `${baseName}_hologram`
        });
        break;
        
      case 'assembly-line':
        elements.push({
          type: 'rect',
          x: placement.x,
          y: placement.y + placement.h - 0.3,
          w: placement.w,
          h: 0.2,
          fill: '#FFC400',
          line: { color: '#FFC400', width: 2 },
          shadow: { type: 'outer', blur: 10, color: 'FFC400' },
          name: `${baseName}_conveyor`
        });
        break;
        
      case 'orbit-ring':
        elements.push({
          type: 'ellipse',
          x: placement.x + placement.w / 2 - 1.5,
          y: placement.y + placement.h / 2 - 1.5,
          w: 3.0, h: 3.0,
          fill: { color: 'transparent' },
          line: { color: '#FFC400', width: 1, dashType: 'dash' },
          name: `${baseName}_orbit`
        });
        break;
        
      default:
        // Default rectangle for unstyled elements
        elements.push({
          type: 'rect',
          x: placement.x + 0.1,
          y: placement.y + 0.1,
          w: placement.w - 0.2,
          h: placement.h - 0.2,
          fill: { color: '#1A1A2E', transparency: 50 },
          line: { color: '#333333', width: 1 },
          name: `${baseName}_default`
        });
    }
  });
  
  return elements;
}

module.exports = {
  ILLUSTRATIONS,
  getIllustration,
  renderIllustrationElements
};
