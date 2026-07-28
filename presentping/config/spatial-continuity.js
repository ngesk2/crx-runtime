// ── CONSTITUTIONAL SPATIAL CONTINUITY SYSTEM ─────────────────────────
// V14: Persistent objects may evolve, they may not teleport
// If Gateway is top-left on Slide 1, it remains approximately top-left throughout the deck
// The viewer builds a mental map. Protect that map.

const SPATIAL_ZONES = {
  TOP_LEFT: { name: 'top-left', x: 0, y: 0, w: 3, h: 3 },
  TOP_CENTER: { name: 'top-center', x: 3.5, y: 0, w: 3, h: 3 },
  TOP_RIGHT: { name: 'top-right', x: 7, y: 0, w: 3, h: 3 },
  MIDDLE_LEFT: { name: 'middle-left', x: 0, y: 2.25, w: 3, h: 3 },
  CENTER: { name: 'center', x: 3.5, y: 2.25, w: 3, h: 3 },
  MIDDLE_RIGHT: { name: 'middle-right', x: 7, y: 2.25, w: 3, h: 3 },
  BOTTOM_LEFT: { name: 'bottom-left', x: 0, y: 4.5, w: 3, h: 3 },
  BOTTOM_CENTER: { name: 'bottom-center', x: 3.5, y: 4.5, w: 3, h: 3 },
  BOTTOM_RIGHT: { name: 'bottom-right', x: 7, y: 4.5, w: 3, h: 3 }
};

const INITIAL_POSITIONS = {
  GATEWAY: 'TOP_LEFT',
  AUTHORITY: 'CENTER',
  EVENT_LOG: 'BOTTOM_LEFT',
  WITNESS: 'TOP_RIGHT',
  REPLAY: 'BOTTOM_RIGHT',
  PROJECTION: 'MIDDLE_RIGHT',
  AGENTS: 'MIDDLE_LEFT',
  BRAIN: 'TOP_CENTER',
  KNOWLEDGE: 'MIDDLE_CENTER',
  EXECUTION: 'BOTTOM_CENTER',
  GOVERNANCE: 'TOP_CENTER',
  SELF_IMPROVEMENT: 'CENTER'
};

const EVOLUTION_RULES = {
  MAX_ZONE_CHANGE: 1, // Maximum number of zones an object can move between slides
  MAX_DISTANCE: 2.0, // Maximum distance (inches) an object can move between slides
  MIN_PERSISTENCE: 0.7, // Minimum persistence (percentage of slides an object must appear)
  HERO_IMMOBILITY: true // Hero objects must remain in the same zone
};

class SpatialContinuityEngine {
  constructor(pres) {
    this.pres = pres;
    this.positionHistory = new Map();
    this.zoneHistory = new Map();
  }

  assignInitialPosition(objectId) {
    const zone = INITIAL_POSITIONS[objectId] || 'CENTER';
    this.positionHistory.set(objectId, { zone, slide: 1 });
    return SPATIAL_ZONES[zone];
  }

  updatePosition(objectId, slideNumber, bounds) {
    const previousPosition = this.positionHistory.get(objectId);
    if (!previousPosition) {
      // First appearance, assign initial position
      const zone = this.detectZone(bounds);
      this.positionHistory.set(objectId, { zone, slide: slideNumber });
      return zone;
    }

    // Calculate new zone based on bounds
    const newZone = this.detectZone(bounds);
    const previousZone = previousPosition.zone;

    // Validate zone change
    const zoneChange = this.calculateZoneChange(previousZone, newZone);
    if (zoneChange > EVOLUTION_RULES.MAX_ZONE_CHANGE) {
      console.warn(`Object ${objectId} moved ${zoneChange} zones from ${previousZone} to ${newZone} on slide ${slideNumber} (max: ${EVOLUTION_RULES.MAX_ZONE_CHANGE})`);
    }

    // Calculate distance
    const distance = this.calculateDistance(previousPosition, bounds);
    if (distance > EVOLUTION_RULES.MAX_DISTANCE) {
      console.warn(`Object ${objectId} moved ${distance.toFixed(2)} inches on slide ${slideNumber} (max: ${EVOLUTION_RULES.MAX_DISTANCE})`);
    }

    this.positionHistory.set(objectId, { zone: newZone, slide: slideNumber, bounds });
    return newZone;
  }

  detectZone(bounds) {
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;

    for (const [zoneName, zone] of Object.entries(SPATIAL_ZONES)) {
      if (centerX >= zone.x && centerX < zone.x + zone.w &&
          centerY >= zone.y && centerY < zone.y + zone.h) {
        return zoneName;
      }
    }

    // Default to center if not in any zone
    return 'CENTER';
  }

  calculateZoneChange(zone1, zone2) {
    const zones = Object.keys(SPATIAL_ZONES);
    const index1 = zones.indexOf(zone1);
    const index2 = zones.indexOf(zone2);
    return Math.abs(index2 - index1);
  }

  calculateDistance(previousPosition, currentBounds) {
    if (!previousPosition.bounds) return 0;

    const prevCenterX = previousPosition.bounds.x + previousPosition.bounds.w / 2;
    const prevCenterY = previousPosition.bounds.y + previousPosition.bounds.h / 2;
    const currCenterX = currentBounds.x + currentBounds.w / 2;
    const currCenterY = currentBounds.y + currentBounds.h / 2;

    return Math.sqrt(Math.pow(currCenterX - prevCenterX, 2) + Math.pow(currCenterY - prevCenterY, 2));
  }

  validateSpatialContinuity(objectId, slideNumber) {
    const history = this.positionHistory.get(objectId);
    if (!history) return { valid: true, message: 'No history' };

    const previousPosition = this.positionHistory.get(objectId);
    if (!previousPosition) return { valid: true, message: 'First appearance' };

    // Check persistence
    const totalSlides = slideNumber - 1;
    const appearanceCount = this.countAppearances(objectId);
    const persistence = appearanceCount / totalSlides;

    if (persistence < EVOLUTION_RULES.MIN_PERSISTENCE) {
      console.warn(`Object ${objectId} has low persistence: ${(persistence * 100).toFixed(0)}% (min: ${(EVOLUTION_RULES.MIN_PERSISTENCE * 100).toFixed(0)}%)`);
    }

    return { valid: true, persistence, zone: previousPosition.zone };
  }

  countAppearances(objectId) {
    let count = 0;
    for (const [id, position] of this.positionHistory.entries()) {
      if (id === objectId) count++;
    }
    return count;
  }

  getZone(objectId) {
    const position = this.positionHistory.get(objectId);
    return position ? position.zone : null;
  }

  getPositionHistory(objectId) {
    const history = [];
    for (const [id, position] of this.positionHistory.entries()) {
      if (id === objectId) {
        history.push(position);
      }
    }
    return history;
  }

  renderSpatialMap(slide, bounds, theme) {
    const elements = [];
    
    // Render zone grid
    Object.values(SPATIAL_ZONES).forEach(zone => {
      slide.addShape(this.pres.ShapeType.rect, {
        x: zone.x,
        y: zone.y,
        w: zone.w,
        h: zone.h,
        fill: { color: '#1A1A1F', transparency: 90 },
        line: { color: '#333333', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'rect', name: `spatial_zone_${zone.name}` });

      // Zone label
      slide.addText(zone.name, {
        x: zone.x + 0.1,
        y: zone.y + 0.1,
        w: zone.w - 0.2,
        h: 0.15,
        fontSize: 6,
        color: '#666666'
      });
      elements.push({ type: 'text', name: `spatial_label_${zone.name}` });
    });

    // Render object positions
    this.positionHistory.forEach((position, objectId) => {
      const zone = SPATIAL_ZONES[position.zone];
      if (zone) {
        const centerX = zone.x + zone.w / 2;
        const centerY = zone.y + zone.h / 2;

        slide.addShape(this.pres.ShapeType.ellipse, {
          x: centerX - 0.08,
          y: centerY - 0.08,
          w: 0.16,
          h: 0.16,
          fill: { color: theme.primary || '#00E5FF', transparency: 70 },
          line: { color: theme.primary || '#00E5FF', width: 1 }
        });
        elements.push({ type: 'ellipse', name: `spatial_object_${objectId}` });

        slide.addText(objectId.substring(0, 8), {
          x: centerX - 0.4,
          y: centerY + 0.1,
          w: 0.8,
          h: 0.1,
          fontSize: 5,
          color: '#CCCCCC',
          align: 'center'
        });
        elements.push({ type: 'text', name: `spatial_object_label_${objectId}` });
      }
    });

    // Title
    slide.addText('SPATIAL CONTINUITY MAP', {
      x: bounds.x,
      y: bounds.y - 0.3,
      w: bounds.w,
      h: 0.2,
      fontSize: 10,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'spatial_title' });

    return { elements };
  }

  validateAllContinuity(slideNumber) {
    const violations = [];

    this.positionHistory.forEach((position, objectId) => {
      const validation = this.validateSpatialContinuity(objectId, slideNumber);
      if (!validation.valid) {
        violations.push({ objectId, message: validation.message });
      }
    });

    return { valid: violations.length === 0, violations };
  }
}

module.exports = {
  SpatialContinuityEngine,
  SPATIAL_ZONES,
  INITIAL_POSITIONS,
  EVOLUTION_RULES
};
