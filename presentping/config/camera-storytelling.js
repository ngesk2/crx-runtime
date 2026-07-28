// ── CAMERA-BASED STORYTELLING SYSTEM ─────────────────────────────────
// V14: Every slide is a place/location in the PING civilization
// The audience should feel like they are moving through districts of a city

const CIVILIZATION_LOCATIONS = {
  SLIDE_1: {
    name: 'Gateway Chamber',
    description: 'The constitutional enforcement gateway at Layer 0',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Gateway Portal',
    environment: 'entry_chamber',
    heroObject: 'Gateway',
    supportingSystems: ['Event Log', 'Constitutional Marker'],
    contextSystems: ['Layer 0 Indicator', 'Provider Status', 'Connection Monitor'],
    environmentalSystems: ['Chamber Walls', 'Floor Grid', 'Atmospheric Glow', 'Entry Portal Frame']
  },
  SLIDE_2: {
    name: 'Authority Archive',
    description: 'The constitutional policy enforcement archive',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Authority Reactor',
    environment: 'archive_hall',
    heroObject: 'Authority',
    supportingSystems: ['Policy Database', 'Validation Engine', 'Witness Feed'],
    contextSystems: ['Constitutional Rules', 'Policy History', 'Compliance Metrics'],
    environmentalSystems: ['Archive Shelves', 'Data Streams', 'Authority Rings', 'Validation Glow']
  },
  SLIDE_3: {
    name: 'Execution Reactor',
    description: 'The MCP agent orchestration and execution core',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Execution Core',
    environment: 'reactor_chamber',
    heroObject: 'Execution',
    supportingSystems: ['MCP Gateway', 'Agent Pool', 'Workflow Engine'],
    contextSystems: ['Tool Registry', 'Execution Metrics', 'Resource Monitor'],
    environmentalSystems: ['Reactor Core', 'Cooling Systems', 'Energy Flows', 'Safety Barriers']
  },
  SLIDE_4: {
    name: 'Observability Projection Layer',
    description: 'The viewing window into the living system',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Projection Window',
    environment: 'observatory',
    heroObject: 'Projection',
    supportingSystems: ['Reality Feed', 'Event Stream', 'Canonical State'],
    contextSystems: ['Knowledge Graph', 'Witness Layer', 'Human View'],
    environmentalSystems: ['Observatory Dome', 'Viewing Ports', 'Data Streams', 'Holographic Displays']
  },
  SLIDE_5: {
    name: 'Agent Factory',
    description: 'The autonomous agent workforce production line',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Factory Floor',
    environment: 'industrial_complex',
    heroObject: 'Agents',
    supportingSystems: ['Agent Spawner', 'Tool Assigner', 'Task Router'],
    contextSystems: ['Agent Registry', 'Performance Metrics', 'Task Queue'],
    environmentalSystems: ['Assembly Lines', 'Tool Racks', 'Conveyor Systems', 'Status Displays']
  },
  SLIDE_6: {
    name: 'Replay Civilization',
    description: 'The time-travel state reconstruction system',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Orbital Replay System',
    environment: 'orbital_station',
    heroObject: 'Replay',
    supportingSystems: ['Event Log Archive', 'State Reconstructor', 'Timeline Navigator'],
    contextSystems: ['Event Timeline', 'State Snapshots', 'Replay Controls'],
    environmentalSystems: ['Orbital Rings', 'Time Streams', 'State Orbits', 'Navigation Console']
  },
  SLIDE_7: {
    name: 'Witness Observatory',
    description: 'The constitutional compliance verification center',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Witness Node',
    environment: 'observatory_tower',
    heroObject: 'Witness',
    supportingSystems: ['Verification Engine', 'Audit Trail', 'Compliance Monitor'],
    contextSystems: ['Constitutional Rules', 'Action Log', 'Verification Status'],
    environmentalSystems: ['Observatory Dome', 'Verification Rings', 'Audit Streams', 'Status Indicators']
  },
  SLIDE_8: {
    name: 'Constitutional Governance Layer',
    description: 'The self-improvement and governance architecture',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Governance Core',
    environment: 'governance_chamber',
    heroObject: 'Governance',
    supportingSystems: ['Self-Improvement Engine', 'Constitutional Evolution', 'Policy Generator'],
    contextSystems: ['Governance Rules', 'Evolution History', 'Improvement Metrics'],
    environmentalSystems: ['Governance Rings', 'Evolution Streams', 'Policy Archives', 'Decision Displays']
  },
  SLIDE_9: {
    name: 'Self-Improvement Engine',
    description: 'The constitutional evolution and optimization system',
    cameraPosition: { x: 5, y: 3.75, z: 10 },
    cameraFocus: 'Evolution Core',
    environment: 'evolution_chamber',
    heroObject: 'Self-Improvement',
    supportingSystems: ['Optimization Engine', 'Pattern Learner', 'Constitutional Mutator'],
    contextSystems: ['Performance Metrics', 'Evolution History', 'Optimization Targets'],
    environmentalSystems: ['Evolution Rings', 'Pattern Streams', 'Mutation Displays', 'Progress Indicators']
  },
  SLIDE_10: {
    name: 'Full PING Civilization',
    description: 'The complete constitutional civilization from orbit',
    cameraPosition: { x: 5, y: 3.75, z: 20 },
    cameraFocus: 'Civilization Overview',
    environment: 'orbital_view',
    heroObject: 'Civilization',
    supportingSystems: ['Brain', 'Witness', 'Replay', 'Authority', 'Execution', 'Knowledge', 'Gateway', 'Projection'],
    contextSystems: ['External Systems', 'Data Flows', 'System Interconnections'],
    environmentalSystems: ['Civilization Grid', 'System Districts', 'Connection Highways', 'Atmospheric Glow']
  }
};

class CameraStorytellingEngine {
  constructor(pres) {
    this.pres = pres;
    this.locationHistory = new Map();
  }

  getLocation(slideNumber) {
    return CIVILIZATION_LOCATIONS[`SLIDE_${slideNumber}`];
  }

  setLocation(slide, slideNumber) {
    const location = this.getLocation(slideNumber);
    if (!location) return null;

    // Render location title
    slide.addText(location.name, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.4,
      fontSize: 20,
      color: '#00E5FF',
      bold: true,
      align: 'center',
      shadow: { type: 'outer', blur: 6, color: '00E5FF' }
    });

    // Render location description
    slide.addText(location.description, {
      x: 0.5,
      y: 0.7,
      w: 9,
      h: 0.25,
      fontSize: 11,
      color: '#CCCCCC',
      align: 'center'
    });

    // Render camera position indicator
    slide.addText(`CAMERA: ${location.cameraPosition.x}, ${location.cameraPosition.y}, ${location.cameraPosition.z}`, {
      x: 8.5,
      y: 0.1,
      w: 1.4,
      h: 0.15,
      fontSize: 6,
      color: '#666666',
      align: 'right',
      fontFace: 'Courier New'
    });

    // Render camera focus
    slide.addText(`FOCUS: ${location.cameraFocus}`, {
      x: 8.5,
      y: 0.25,
      w: 1.4,
      h: 0.15,
      fontSize: 6,
      color: '#FFC400',
      align: 'right',
      fontFace: 'Courier New'
    });

    this.locationHistory.set(slideNumber, location);
    return location;
  }

  getHeroObject(slideNumber) {
    const location = this.getLocation(slideNumber);
    return location ? location.heroObject : null;
  }

  getSupportingSystems(slideNumber) {
    const location = this.getLocation(slideNumber);
    return location ? location.supportingSystems : [];
  }

  getContextSystems(slideNumber) {
    const location = this.getLocation(slideNumber);
    return location ? location.contextSystems : [];
  }

  getEnvironmentalSystems(slideNumber) {
    const location = this.getLocation(slideNumber);
    return location ? location.environmentalSystems : [];
  }

  validateCameraContinuity(slideNumber) {
    // Ensure camera movements are smooth and logical
    const currentLocation = this.getLocation(slideNumber);
    const previousLocation = slideNumber > 1 ? this.getLocation(slideNumber - 1) : null;

    if (previousLocation && currentLocation) {
      // Check for reasonable camera movement
      const dx = Math.abs(currentLocation.cameraPosition.x - previousLocation.cameraPosition.x);
      const dy = Math.abs(currentLocation.cameraPosition.y - previousLocation.cameraPosition.y);
      const dz = Math.abs(currentLocation.cameraPosition.z - previousLocation.cameraPosition.z);

      if (dx > 2 || dy > 2 || dz > 5) {
        console.warn(`Camera jump detected on slide ${slideNumber}: dx=${dx}, dy=${dy}, dz=${dz}`);
      }
    }

    return { valid: true, currentLocation, previousLocation };
  }

  getAllLocations() {
    return CIVILIZATION_LOCATIONS;
  }
}

module.exports = {
  CameraStorytellingEngine,
  CIVILIZATION_LOCATIONS
};
