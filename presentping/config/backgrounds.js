// ── LAYERED BACKGROUND SYSTEM ─────────────────────────────────────────
// Backgrounds should contribute meaning, not merely provide contrast

const BACKGROUND_LAYERS = {
  // Slide 1: Inference Decoupling - Border checkpoint theme
  SLIDE_1: {
    base: { color: "#0A0A0F" }, // Deep navy-black
    grid: {
      color: "#1A1A2E",
      spacing: 0.5,
      opacity: 30
    },
    glow: {
      color: "#FFC400",
      x: 4.0,
      y: 2.5,
      radius: 2.0,
      opacity: 15
    },
    dataStreams: {
      enabled: true,
      color: "#00E5FF",
      count: 5,
      opacity: 20
    }
  },

  // Slide 2: Retrieval Authority - Archaeological cross-section
  SLIDE_2: {
    base: { color: "#0D0D12" }, // Dark earth tone
    terrain: {
      surfaceColor: "#1A1A24",
      strataColors: ["#252530", "#303040", "#3A3A50"],
      depth: 3.0
    },
    excavation: {
      x: 4.0,
      y: 2.5,
      width: 3.0,
      depth: 2.0
    },
    undergroundGlow: {
      color: "#FFC400",
      y: 4.5,
      opacity: 25
    }
  },

  // Slide 3: Execution Authority - Industrial reactor chamber
  SLIDE_3: {
    base: { color: "#0C0C10" }, // Industrial dark
    reactorChamber: {
      wallColor: "#1A1A22",
      floorColor: "#121218"
    },
    energyField: {
      color: "#FFC400",
      x: 4.0,
      y: 2.5,
      radius: 1.5,
      opacity: 20
    },
    heatGlow: {
      color: "#FF6B35",
      intensity: 15
    }
  },

  // Slide 4: Plane Integration - City hologram
  SLIDE_4: {
    base: { color: "#08080C" }, // Cyber dark
    cityGrid: {
      color: "#1A1A28",
      spacing: 0.3,
      opacity: 25
    },
    hologramField: {
      color: "#00E5FF",
      x: 4.0,
      y: 2.0,
      width: 3.0,
      height: 2.0,
      opacity: 10
    },
    projectionBeams: {
      color: "#FFC400",
      count: 3,
      opacity: 20
    },
    infrastructure: {
      color: "#2A2A38",
      opacity: 15
    }
  },

  // Slide 5: Agent Runtime - Industrial factory floor
  SLIDE_5: {
    base: { color: "#0B0B10" }, // Factory dark
    assemblyLines: {
      color: "#1A1A24",
      count: 2,
      opacity: 30
    },
    conveyorBelt: {
      color: "#FFC400",
      y: 4.0,
      opacity: 25
    },
    roboticsBay: {
      ambientColor: "#00E5FF",
      opacity: 15
    },
    industrialLighting: {
      color: "#FFFFFF",
      intensity: 10
    }
  },

  // Slide 6: Personal OS - Planetary command center
  SLIDE_6: {
    base: { color: "#050508" }, // Space dark
    starfield: {
      count: 50,
      color: "#FFFFFF",
      opacity: 40
    },
    orbitalRings: {
      color: "#FFC400",
      count: 3,
      opacity: 20
    },
    timelineConstellation: {
      color: "#00E5FF",
      pattern: "lineage",
      opacity: 25
    },
    commandCenter: {
      ambientGlow: "#1A1A2E",
      opacity: 30
    }
  }
};

function renderBackground(slide, backgroundConfig) {
  const layers = [];
  
  // Base layer
  layers.push({
    type: 'rect',
    x: 0, y: 0, w: 10, h: 5.625,
    fill: backgroundConfig.base.color,
    name: 'background_base'
  });

  // Grid layer (if present)
  if (backgroundConfig.grid) {
    const grid = backgroundConfig.grid;
    for (let x = 0; x < 10; x += grid.spacing) {
      layers.push({
        type: 'line',
        x: x, y: 0, w: 0, h: 5.625,
        line: { color: grid.color, width: 1, transparency: grid.opacity },
        name: `grid_vertical_${x}`
      });
    }
    for (let y = 0; y < 5.625; y += grid.spacing) {
      layers.push({
        type: 'line',
        x: 0, y: y, w: 10, h: 0,
        line: { color: grid.color, width: 1, transparency: grid.opacity },
        name: `grid_horizontal_${y}`
      });
    }
  }

  // Glow layer (if present)
  if (backgroundConfig.glow) {
    const glow = backgroundConfig.glow;
    layers.push({
      type: 'ellipse',
      x: glow.x - glow.radius, y: glow.y - glow.radius,
      w: glow.radius * 2, h: glow.radius * 2,
      fill: { color: glow.color, transparency: 100 - glow.opacity },
      line: { color: glow.color, width: 0 },
      name: 'background_glow'
    });
  }

  // Data streams (if present)
  if (backgroundConfig.dataStreams) {
    const streams = backgroundConfig.dataStreams;
    for (let i = 0; i < streams.count; i++) {
      const x = 1 + (i * 1.5);
      layers.push({
        type: 'line',
        x: x, y: 0, w: 0, h: 5.625,
        line: { color: streams.color, width: 2, dashType: 'dash', transparency: streams.opacity },
        name: `data_stream_${i}`
      });
    }
  }

  // Terrain/strata (if present)
  if (backgroundConfig.terrain) {
    const terrain = backgroundConfig.terrain;
    let currentY = 2.0;
    terrain.strataColors.forEach((color, index) => {
      layers.push({
        type: 'rect',
        x: 0, y: currentY, w: 10, h: 0.5,
        fill: color,
        line: { color: color, width: 0 },
        name: `strata_${index}`
      });
      currentY += 0.5;
    });
  }

  // Underground glow (if present)
  if (backgroundConfig.undergroundGlow) {
    const glow = backgroundConfig.undergroundGlow;
    layers.push({
      type: 'rect',
      x: 0, y: glow.y, w: 10, h: 1.0,
      fill: { color: glow.color, transparency: 100 - glow.opacity },
      line: { color: glow.color, width: 0 },
      name: 'underground_glow'
    });
  }

  // Energy field (if present)
  if (backgroundConfig.energyField) {
    const field = backgroundConfig.energyField;
    layers.push({
      type: 'ellipse',
      x: field.x - field.radius, y: field.y - field.radius,
      w: field.radius * 2, h: field.radius * 2,
      fill: { color: field.color, transparency: 100 - field.opacity },
      line: { color: field.color, width: 2, transparency: field.opacity },
      name: 'energy_field'
    });
  }

  // Starfield (if present)
  if (backgroundConfig.starfield) {
    const stars = backgroundConfig.starfield;
    for (let i = 0; i < stars.count; i++) {
      const x = Math.random() * 10;
      const y = Math.random() * 5.625;
      layers.push({
        type: 'ellipse',
        x: x, y: y, w: 0.03, h: 0.03,
        fill: stars.color,
        line: { color: stars.color, width: 0 },
        name: `star_${i}`
      });
    }
  }

  return layers;
}

module.exports = {
  BACKGROUND_LAYERS,
  renderBackground
};
