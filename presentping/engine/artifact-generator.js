// ── ARTIFACT GENERATOR.JS ───────────────────────────────────────────
// V17: Pre-generation artifact editing layer
// Generate reviewable JSON files before PPT generation

const { WORLD } = require('./world');
const { DISTRICT_GEOMETRY, FAILURE_DESTINATIONS } = require('./district-geometry');
const { INFRASTRUCTURE } = require('./infrastructure');
const { NARRATIVE, getAllNarrative } = require('./narrative');
const fs = require('fs');

function generateWorldLayout() {
  const layout = {
    version: 'V17',
    timestamp: new Date().toISOString(),
    districts: WORLD.districts.map(district => {
      const geometry = DISTRICT_GEOMETRY[district.id];
      return {
        id: district.id,
        name: district.name,
        owner: district.owner,
        scale: geometry.scale,
        landmarkType: geometry.landmarkType,
        baseBounds: geometry.baseBounds,
        visualIdentity: geometry.visualIdentity,
        position: calculateDistrictPosition(district.id, geometry.scale)
      };
    }),
    failureDestinations: Object.entries(FAILURE_DESTINATIONS).map(([id, dest]) => ({
      id,
      position: dest.position,
      bounds: dest.bounds,
      visualIdentity: dest.visualIdentity,
      visibleAtAllZoomLevels: dest.visibleAtAllZoomLevels
    }))
  };

  return layout;
}

function calculateDistrictPosition(districtId, scale) {
  // Circular layout for districts
  const centerX = 5;
  const centerY = 3.75;
  const radius = 2.5;

  const positions = {
    gateway: { x: centerX, y: centerY - radius },
    witness: { x: centerX + radius * 0.866, y: centerY - radius * 0.5 },
    bedrock: { x: centerX + radius * 0.866, y: centerY + radius * 0.5 },
    replay: { x: centerX, y: centerY + radius },
    builder: { x: centerX - radius * 0.866, y: centerY + radius * 0.5 },
    governance: { x: centerX - radius * 0.866, y: centerY - radius * 0.5 }
  };

  const basePos = positions[districtId];
  const geometry = DISTRICT_GEOMETRY[districtId];

  // Calculate bounds from architecture scale
  const baseWidth = 2.0;
  const baseHeight = 1.5;
  const width = baseWidth * geometry.scale;
  const height = baseHeight * geometry.scale;

  return {
    x: basePos.x - width / 2,
    y: basePos.y - height / 2,
    w: width,
    h: height
  };
}

function generateDistrictGeometry() {
  const geometry = {
    version: 'V17',
    timestamp: new Date().toISOString(),
    districts: {}
  };

  Object.entries(DISTRICT_GEOMETRY).forEach(([id, geom]) => {
    geometry.districts[id] = {
      id,
      scale: geom.scale,
      landmarkType: geom.landmarkType,
      baseBounds: geom.baseBounds,
      visualIdentity: geom.visualIdentity,
      components: geom.components,
      isFoundational: geom.isFoundational || false
    };
  });

  return geometry;
}

function generatePacketLayout() {
  const layout = {
    version: 'V17',
    timestamp: new Date().toISOString(),
    routes: [],
    packets: {}
  };

  // Generate packet positions along success routes
  WORLD.successTopology.forEach((route, index) => {
    const routePackets = [];
    const fromGeom = DISTRICT_GEOMETRY[route.from];
    const toGeom = DISTRICT_GEOMETRY[route.to];

    const fromPos = calculateDistrictPosition(route.from, fromGeom.scale);
    const toPos = calculateDistrictPosition(route.to, toGeom.scale);

    // Calculate route path
    const startX = fromPos.x + fromPos.w / 2;
    const startY = fromPos.y + fromPos.h / 2;
    const endX = toPos.x + toPos.w / 2;
    const endY = toPos.y + toPos.h / 2;

    // Place capsules along the route
    const capsuleCount = 4;
    for (let i = 0; i < capsuleCount; i++) {
      const t = (i + 1) / (capsuleCount + 1);
      const capsuleX = startX + (endX - startX) * t;
      const capsuleY = startY + (endY - startY) * t;

      routePackets.push({
        index: i,
        position: { x: capsuleX - 0.15, y: capsuleY - 0.1 },
        bounds: { w: 0.3, h: 0.2 },
        packet: INFRASTRUCTURE[route.from]?.packets[0] || null
      });
    }

    layout.routes.push({
      from: route.from,
      to: route.to,
      path: { start: { x: startX, y: startY }, end: { x: endX, y: endY } },
      capsules: routePackets
    });
  });

  // Generate packet positions along failure routes
  WORLD.failureRoutes.forEach((route, index) => {
    const fromGeom = DISTRICT_GEOMETRY[route.from];
    const fromPos = calculateDistrictPosition(route.from, fromGeom.scale);
    const dest = FAILURE_DESTINATIONS[Object.keys(FAILURE_DESTINATIONS)[index % Object.keys(FAILURE_DESTINATIONS).length]];

    const startX = fromPos.x + fromPos.w / 2;
    const startY = fromPos.y + fromPos.h / 2;
    const endX = dest.position.x;
    const endY = dest.position.y;

    // Curved failure route
    const midX = (startX + endX) / 2;
    const midY = startY + (route.type === 'rollback' ? -1 : 1);

    layout.routes.push({
      from: route.from,
      to: route.type,
      type: 'failure',
      path: {
        start: { x: startX, y: startY },
        mid: { x: midX, y: midY },
        end: { x: endX, y: endY }
      },
      capsules: []
    });
  });

  return layout;
}

function generateCameraPaths() {
  const paths = {
    version: 'V17',
    timestamp: new Date().toISOString(),
    slides: []
  };

  const narrative = getAllNarrative();

  narrative.forEach(slide => {
    paths.slides.push({
      slideNumber: slide.slideNumber,
      title: slide.slideTitle,
      subtitle: slide.slideSubtitle,
      camera: {
        position: slide.camera.position,
        zoom: slide.camera.zoom,
        focus: slide.camera.focus
      }
    });
  });

  return paths;
}

function generateFailureRoutes() {
  const routes = {
    version: 'V17',
    timestamp: new Date().toISOString(),
    failureRoutes: WORLD.failureRoutes.map(route => ({
      from: route.from,
      to: route.to,
      type: route.type,
      destination: FAILURE_DESTINATIONS[Object.keys(FAILURE_DESTINATIONS).find(
        key => key.includes(route.type) || key.includes('failure')
      )] || null
    }))
  };

  return routes;
}

function generateAllArtifacts(outputDir = './v17-artifacts') {
  console.log('Generating V17 artifacts...');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate artifacts
  const worldLayout = generateWorldLayout();
  fs.writeFileSync(`${outputDir}/world-layout.json`, JSON.stringify(worldLayout, null, 2));
  console.log(`✓ Generated world-layout.json`);

  const districtGeometry = generateDistrictGeometry();
  fs.writeFileSync(`${outputDir}/district-geometry.json`, JSON.stringify(districtGeometry, null, 2));
  console.log(`✓ Generated district-geometry.json`);

  const packetLayout = generatePacketLayout();
  fs.writeFileSync(`${outputDir}/packet-layout.json`, JSON.stringify(packetLayout, null, 2));
  console.log(`✓ Generated packet-layout.json`);

  const cameraPaths = generateCameraPaths();
  fs.writeFileSync(`${outputDir}/camera-paths.json`, JSON.stringify(cameraPaths, null, 2));
  console.log(`✓ Generated camera-paths.json`);

  const failureRoutes = generateFailureRoutes();
  fs.writeFileSync(`${outputDir}/failure-routes.json`, JSON.stringify(failureRoutes, null, 2));
  console.log(`✓ Generated failure-routes.json`);

  console.log(`\nArtifacts generated in ${outputDir}/`);
  console.log('Review and edit these files before running renderPresentation()');
}

module.exports = {
  generateWorldLayout,
  generateDistrictGeometry,
  generatePacketLayout,
  generateCameraPaths,
  generateFailureRoutes,
  generateAllArtifacts
};
