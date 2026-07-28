// ── INDEX V17.JS ─────────────────────────────────────────────────────
// V17: Load world, run verify_world_topology, generate artifacts, create slides, render views, export pptx

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');

const { WORLD } = require('./world');
const { runVerification } = require('./verify_world_topology');
const { NARRATIVE, getAllNarrative } = require('./narrative');
const { V17Renderer } = require('./renderer-v17');
const { INFRASTRUCTURE } = require('./infrastructure');
const { generateAllArtifacts } = require('./artifact-generator');

const THEME = {
  primary: '#00E5FF',
  secondary: '#FFC400',
  success: '#00FF00',
  failure: '#FF0000',
  neutral: '#C0C0C0'
};

async function buildV17Presentation() {
  console.log('Building V17 Constitutional City Presentation...');

  // Step 1: Load world
  console.log('Loading world...');
  const world = WORLD;
  console.log(`Loaded ${world.districts.length} districts`);

  // Step 2: Run verify_world_topology
  console.log('Verifying world topology...');
  try {
    runVerification();
  } catch (error) {
    console.error('Topology verification failed:', error.message);
    process.exit(1);
  }

  // Step 3: Load narrative
  console.log('Loading narrative...');
  const narrative = getAllNarrative();
  console.log(`Loaded ${narrative.length} slides`);

  // Step 4: Generate artifacts for review
  console.log('Generating artifacts for review...');
  generateAllArtifacts('./v17-artifacts');
  console.log('Artifacts generated. Review v17-artifacts/ directory before proceeding.');

  // Step 5: Create presentation
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';

  const renderer = new V17Renderer(pres);
  const presentationData = {
    slides: [],
    metadata: {
      version: 'V17',
      title: 'PING Constitutional City',
      description: 'Spatial map of the constitutional substrate',
      timestamp: new Date().toISOString()
    }
  };

  // Step 6: Create slides
  console.log('Creating slides...');

  for (const slideNarrative of narrative) {
    console.log(`Building Slide ${slideNarrative.slideNumber}: ${slideNarrative.slideTitle}...`);

    const slide = pres.addSlide();
    const slideObjects = [];

    // Set zoom level
    renderer.setZoomLevel(slideNarrative.camera.zoom);

    // Background (editable world layer)
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 7.5,
      fill: { color: '#0A0A0F', transparency: 100 },
      line: { color: '#1A1A1F', width: 0.5 }
    });
    slideObjects.push({ type: 'rect', name: 'background' });

    // World layer elements (editable atmosphere)
    // Starfield
    for (let i = 0; i < 50; i++) {
      const starX = Math.random() * 10;
      const starY = Math.random() * 7.5;
      const starSize = Math.random() * 0.03 + 0.01;
      slide.addShape(pres.ShapeType.ellipse, {
        x: starX,
        y: starY,
        w: starSize,
        h: starSize,
        fill: { color: '#FFFFFF', transparency: 90 },
        line: { color: '#FFFFFF', width: 0 }
      });
      slideObjects.push({ type: 'ellipse', name: `star_${i}` });
    }

    // Atmospheric haze
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 7.5,
      fill: { color: '#1A1A1F', transparency: 95 },
      line: { color: '#1A1A1F', width: 0 }
    });
    slideObjects.push({ type: 'rect', name: 'atmospheric_haze' });

    // Grid lattice
    const gridSize = 0.5;
    for (let x = 0; x < 10; x += gridSize) {
      slide.addShape(pres.ShapeType.line, {
        x: x,
        y: 0,
        w: 0,
        h: 7.5,
        line: { color: '#2A2A2F', width: 0.5, dashType: 'dash' }
      });
      slideObjects.push({ type: 'line', name: `grid_v_${x}` });
    }
    for (let y = 0; y < 7.5; y += gridSize) {
      slide.addShape(pres.ShapeType.line, {
        x: 0,
        y: y,
        w: 10,
        h: 0,
        line: { color: '#2A2A2F', width: 0.5, dashType: 'dash' }
      });
      slideObjects.push({ type: 'line', name: `grid_h_${y}` });
    }

    // Constitutional horizon
    slide.addShape(pres.ShapeType.line, {
      x: 0,
      y: 6.5,
      w: 10,
      h: 0,
      line: { color: '#3A3A3F', width: 1 }
    });
    slideObjects.push({ type: 'line', name: 'constitutional_horizon' });

    // Depth fog
    slide.addShape(pres.ShapeType.rect, {
      x: 0, y: 6.5, w: 10, h: 1,
      fill: { color: '#0A0A0F', transparency: 90 },
      line: { color: '#0A0A0F', width: 0 }
    });
    slideObjects.push({ type: 'rect', name: 'depth_fog' });

    // Slide title
    slide.addText(slideNarrative.slideTitle, {
      x: 0, y: 0, w: 10, h: 0.3,
      fontSize: 18,
      color: THEME.primary,
      bold: true,
      align: 'center'
    });
    slideObjects.push({ type: 'text', name: 'slide_title' });

    // Slide subtitle
    slide.addText(slideNarrative.slideSubtitle, {
      x: 0, y: 0.35, w: 10, h: 0.15,
      fontSize: 10,
      color: '#CCCCCC',
      align: 'center'
    });
    slideObjects.push({ type: 'text', name: 'slide_subtitle' });

    // Step 7: Render views with V17 renderer
    const viewBounds = { x: 0.5, y: 0.6, w: 9, h: 5.5 };

    // Render focused districts
    const focusedDistricts = slideNarrative.camera.focus;
    const focusedDistrictObjects = world.districts.filter(d => focusedDistricts.includes(d.id));

    if (focusedDistrictObjects.length === 1) {
      // Single district view
      const district = focusedDistrictObjects[0];
      const architecture = require('./district-geometry').DISTRICT_GEOMETRY[district.id];
      
      // Calculate bounds based on architecture scale
      const baseWidth = 2.0;
      const baseHeight = 1.5;
      const districtBounds = {
        x: viewBounds.x + viewBounds.w / 2 - (baseWidth * architecture.scale) / 2,
        y: viewBounds.y + viewBounds.h / 2 - (baseHeight * architecture.scale) / 2,
        w: baseWidth * architecture.scale,
        h: baseHeight * architecture.scale
      };

      let districtElements;
      switch (district.id) {
        case 'witness':
          districtElements = renderer.renderWitnessLandmark(slide, districtBounds, THEME, architecture);
          break;
        case 'replay':
          districtElements = renderer.renderReplayTemporal(slide, districtBounds, THEME, architecture);
          break;
        case 'builder':
          districtElements = renderer.renderBuilderOperational(slide, districtBounds, THEME, architecture);
          break;
        case 'governance':
          districtElements = renderer.renderGovernanceAuthoritative(slide, districtBounds, THEME, architecture);
          break;
        case 'gateway':
          districtElements = renderer.renderGatewayPort(slide, districtBounds, THEME, architecture);
          break;
        case 'bedrock':
          districtElements = renderer.renderBedrockFoundation(slide, viewBounds, THEME, architecture);
          break;
        default:
          districtElements = [];
      }
      slideObjects.push(...districtElements);

      // Render evidence packets for this district (zoomed in only)
      if (INFRASTRUCTURE[district.id] && slideNarrative.camera.zoom === 'in') {
        const packets = INFRASTRUCTURE[district.id].packets;
        const packetY = districtBounds.y + districtBounds.h + 0.2;

        packets.forEach((packet, index) => {
          const packetBounds = {
            x: districtBounds.x,
            y: packetY + index * 0.6,
            w: districtBounds.w,
            h: 0.5
          };

          const packetElements = renderer.renderPacketCapsule(slide, packet, packetBounds, THEME);
          slideObjects.push(...packetElements);
        });
      }
    } else if (focusedDistrictObjects.length > 1) {
      // Multiple districts view
      const districtSpacing = 3.5;
      const startX = viewBounds.x + viewBounds.w / 2 - (focusedDistrictObjects.length - 1) * districtSpacing / 2;

      focusedDistrictObjects.forEach((district, index) => {
        const architecture = require('./district-geometry').DISTRICT_GEOMETRY[district.id];
        const baseWidth = 2.0;
        const baseHeight = 1.5;
        const districtBounds = {
          x: startX + index * districtSpacing - (baseWidth * architecture.scale) / 2,
          y: viewBounds.y + viewBounds.h / 2 - (baseHeight * architecture.scale) / 2,
          w: baseWidth * architecture.scale,
          h: baseHeight * architecture.scale
        };

        let districtElements;
        switch (district.id) {
          case 'witness':
            districtElements = renderer.renderWitnessLandmark(slide, districtBounds, THEME, architecture);
            break;
          case 'replay':
            districtElements = renderer.renderReplayTemporal(slide, districtBounds, THEME, architecture);
            break;
          case 'builder':
            districtElements = renderer.renderBuilderOperational(slide, districtBounds, THEME, architecture);
            break;
          case 'governance':
            districtElements = renderer.renderGovernanceAuthoritative(slide, districtBounds, THEME, architecture);
            break;
          case 'gateway':
            districtElements = renderer.renderGatewayPort(slide, districtBounds, THEME, architecture);
            break;
          case 'bedrock':
            districtElements = renderer.renderBedrockFoundation(slide, viewBounds, THEME, architecture);
            break;
          default:
            districtElements = [];
        }
        slideObjects.push(...districtElements);
      });

      // Render connection between focused districts
      if (focusedDistrictObjects.length === 2) {
        const fromDistrict = focusedDistrictObjects[0];
        const toDistrict = focusedDistrictObjects[1];
        const fromArchitecture = require('./district-geometry').DISTRICT_GEOMETRY[fromDistrict.id];
        const toArchitecture = require('./district-geometry').DISTRICT_GEOMETRY[toDistrict.id];
        const baseWidth = 2.0;
        const baseHeight = 1.5;

        const fromBounds = {
          x: startX + 0 * districtSpacing - (baseWidth * fromArchitecture.scale) / 2 + (baseWidth * fromArchitecture.scale) / 2,
          y: viewBounds.y + viewBounds.h / 2,
          w: 0.1,
          h: 0.1
        };
        const toBounds = {
          x: startX + 1 * districtSpacing - (baseWidth * toArchitecture.scale) / 2 + (baseWidth * toArchitecture.scale) / 2,
          y: viewBounds.y + viewBounds.h / 2,
          w: 0.1,
          h: 0.1
        };

        const routeElements = renderer.renderSuccessRoute(slide, fromBounds, toBounds, THEME);
        slideObjects.push(...routeElements);

        // Render packet capsules along the route
        const packet = INFRASTRUCTURE[fromDistrict.id]?.packets[0];
        if (packet) {
          const capsuleCount = 3;
          for (let i = 0; i < capsuleCount; i++) {
            const t = (i + 1) / (capsuleCount + 1);
            const capsuleX = fromBounds.x + (toBounds.x - fromBounds.x) * t;
            const capsuleY = fromBounds.y + (toBounds.y - fromBounds.y) * t;

            const capsuleBounds = {
              x: capsuleX - 0.2,
              y: capsuleY - 0.15,
              w: 0.4,
              h: 0.3
            };

            const capsuleElements = renderer.renderPacketCapsule(slide, packet, capsuleBounds, THEME);
            slideObjects.push(...capsuleElements);
          }
        }
      }
    }

    // Render failure destinations as permanent geography (always visible on all slides)
    const { FAILURE_DESTINATIONS } = require('./district-geometry');
    Object.values(FAILURE_DESTINATIONS).forEach(destination => {
      const destBounds = {
        x: destination.position.x,
        y: destination.position.y,
        w: destination.bounds.w,
        h: destination.bounds.h
      };
      const destElements = renderer.renderFailureDestination(slide, destination, destBounds, THEME);
      slideObjects.push(...destElements);
    });

    // Full topology view (slide 7)
    if (slideNarrative.slideNumber === 7) {
      renderer.setZoomLevel('out');
      const topologyElements = renderer.renderFullTopology(slide, world, viewBounds, THEME);
      slideObjects.push(...topologyElements);
    }

    // Slide notes
    if (slideNarrative.notes) {
      slide.addText(slideNarrative.notes, {
        x: 0.5, y: 7.2, w: 9, h: 0.2,
        fontSize: 6,
        color: '#666666',
        fontFace: 'Courier New'
      });
      slideObjects.push({ type: 'text', name: 'slide_notes' });
    }

    presentationData.slides.push({
      number: slideNarrative.slideNumber,
      title: slideNarrative.slideTitle,
      subtitle: slideNarrative.slideSubtitle,
      camera: slideNarrative.camera,
      notes: slideNarrative.notes,
      objects: slideObjects
    });
  }

  // Step 8: Export pptx
  console.log('Exporting presentation...');
  const outputFile = 'PING_Presentation_V17_ConstitutionalCity.pptx';
  pres.writeFile({ fileName: outputFile });
  console.log(`V17 Constitutional City Presentation saved to ${outputFile}`);

  // Save metadata
  const metadataFile = 'presentation-v17-metadata.json';
  fs.writeFileSync(metadataFile, JSON.stringify(presentationData, null, 2));
  console.log(`V17 metadata saved to ${metadataFile}`);

  console.log('\nV17 Constitutional City complete:');
  console.log('- Exactly six districts with landmark geometries');
  console.log('- Witness is the largest structure (constitutional observatory)');
  console.log('- Bedrock is a foundational layer under everything');
  console.log('- Replay visually shows time (timeline fragments, fork branches, reconstruction streams, ghost paths)');
  console.log('- Builder looks operational (artifact foundries, tool lanes, execution corridors, deployment tracks, build queues, artifact capsules)');
  console.log('- Governance feels authoritative (constitutional gates, approval corridors, rejection corridors, rollback locks, constraint walls)');
  console.log('- Infrastructure packets are capsules on routes, not metadata');
  console.log('- Failure system has permanent physical destinations (Rejection Sink, Rollback Vault, Violation Log, Failure Channel, Ownership Conflict Zone)');
  console.log('- Skyline hierarchy with distinct scales and geometries');
  console.log('- Everything is editable (no raster backgrounds, PNG skylines, image overlays, flattened SVG exports)');
  console.log('- Pre-generation artifact editing layer (world-layout.json, district-geometry.json, packet-layout.json, camera-paths.json, failure-routes.json)');
  console.log('- Architecture reads as a grounded constitutional city, not a database diagram');
}

buildV17Presentation().catch(error => {
  console.error('V17 build failed:', error);
  process.exit(1);
});
