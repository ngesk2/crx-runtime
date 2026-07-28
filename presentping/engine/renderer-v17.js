// ── RENDERER V17.JS ─────────────────────────────────────────────────
// V17.5: CRITICAL DESIGN INTERVENTION
// Optimize for: Architectural Presence + Narrative Clarity + Presentation Power
// V14 emotional architecture restored with V16/V17 rigor

const PptxGenJS = require('pptxgenjs');

class V17Renderer {
  constructor(pres) {
    this.pres = pres;
    this.zoomLevel = 'out';
  }

  setZoomLevel(level) {
    this.zoomLevel = level;
  }

  renderBedrockFoundation(slide, bounds, theme, architecture) {
    const elements = [];

    // V17.5: Bedrock is environmental - layered substrate, glowing memory strata, archive lattice beneath city
    // V17.5: Visual message: IF IT IS NOT HERE, IT DID NOT HAPPEN (communicated visually, not through text)
    const internalStructure = architecture.internalStructure;

    // Foundation bounds based on architecture scale - V17.5: Environmental substrate spans entire map
    const foundationBounds = {
      x: 0,
      y: bounds.y + bounds.h - 2.0 * architecture.scale,
      w: 10,
      h: 2.0 * architecture.scale
    };

    // V17.5: Foundational Grid (base_layer, scale 1.0 - new component for environmental feel)
    const gridScale = internalStructure.foundational_grid.scale;
    const gridSize = 0.6;
    const gridLines = Math.floor(foundationBounds.w / gridSize);
    
    for (let i = 0; i <= gridLines; i++) {
      const x = foundationBounds.x + i * gridSize;
      // Vertical lines
      slide.addShape(this.pres.ShapeType.line, {
        x: x,
        y: foundationBounds.y,
        w: 0,
        h: foundationBounds.h,
        line: { color: '#505050', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `bedrock_foundational_grid_v_${i}` });
    }

    const gridRows = Math.floor(foundationBounds.h / gridSize);
    for (let i = 0; i <= gridRows; i++) {
      const y = foundationBounds.y + i * gridSize;
      // Horizontal lines
      slide.addShape(this.pres.ShapeType.line, {
        x: foundationBounds.x,
        y: y,
        w: foundationBounds.w,
        h: 0,
        line: { color: '#505050', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `bedrock_foundational_grid_h_${i}` });
    }

    // V17.7: Foundation Plates (horizontal, count 10, scale 1.5 - MASSIVE for environmental feel)
    const plateCount = internalStructure.foundation_plates.count;
    const plateScale = internalStructure.foundation_plates.scale;
    const plateSpacing = (foundationBounds.w - 1.0) / (plateCount + 1);

    for (let i = 0; i < plateCount; i++) {
      const plateX = foundationBounds.x + 0.5 + (i + 1) * plateSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: plateX - 1.0 * plateScale,
        y: foundationBounds.y + foundationBounds.h * 0.35,
        w: 2.0 * plateScale,
        h: 0.5 * plateScale,
        fill: { color: '#404040', transparency: 82 },
        line: { color: '#606060', width: 3 }
      });
      elements.push({ type: 'rect', name: `bedrock_foundation_plate_${i}` });
    }

    // V17.7: Glowing Memory Strata (vertical, count 12, scale 1.2 - MASSIVE for environmental feel)
    const strataCount = internalStructure.glowing_memory_strata.count;
    const strataScale = internalStructure.glowing_memory_strata.scale;
    const strataSpacing = (foundationBounds.w - 1.0) / (strataCount + 1);

    for (let i = 0; i < strataCount; i++) {
      const strataX = foundationBounds.x + 0.5 + (i + 1) * strataSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: strataX - 0.2 * strataScale,
        y: foundationBounds.y + foundationBounds.h * 0.45,
        w: 0.4 * strataScale,
        h: foundationBounds.h * 0.5,
        fill: { color: '#FFC400', transparency: 88 }, // V17.7: Glowing effect
        line: { color: '#FF8C00', width: 2 }
      });
      elements.push({ type: 'rect', name: `bedrock_glowing_memory_strata_${i}` });
    }

    // V17.7: Archive Lattice (beneath, count 10, scale 1.2 - MASSIVE for environmental feel)
    const latticeCount = internalStructure.archive_lattice.count;
    const latticeScale = internalStructure.archive_lattice.scale;
    const latticeSpacing = (foundationBounds.w - 1.5) / (latticeCount + 1);

    for (let i = 0; i < latticeCount; i++) {
      const latticeX = foundationBounds.x + 0.5 + (i + 1) * latticeSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: latticeX - 0.7 * latticeScale,
        y: foundationBounds.y + foundationBounds.h * 0.6,
        w: 1.4 * latticeScale,
        h: 0.4 * latticeScale,
        fill: { color: '#505050', transparency: 85 },
        line: { color: '#707070', width: 2 }
      });
      elements.push({ type: 'rect', name: `bedrock_archive_lattice_${i}` });
    }

    // V17.7: Deep Audit Vaults (deep, count 8, scale 1.0 - MASSIVE for environmental feel)
    const vaultCount = internalStructure.deep_audit_vaults.count;
    const vaultScale = internalStructure.deep_audit_vaults.scale;
    const vaultSpacing = (foundationBounds.w - 1.5) / (vaultCount + 1);

    for (let i = 0; i < vaultCount; i++) {
      const vaultX = foundationBounds.x + 0.5 + (i + 1) * vaultSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: vaultX - 0.5 * vaultScale,
        y: foundationBounds.y + foundationBounds.h * 0.75,
        w: 1.0 * vaultScale,
        h: 0.3 * vaultScale,
        fill: { color: '#FF4500', transparency: 82 }, // V17.7: Hazard illumination
        line: { color: '#8B0000', width: 2.5 }
      });
      elements.push({ type: 'rect', name: `bedrock_deep_audit_vault_${i}` });
    }

    // V17.7: Audit Vaults (distributed, count 8, scale 1.0 - MASSIVE for environmental feel)
    const auditCount = internalStructure.audit_vaults.count;
    const auditScale = internalStructure.audit_vaults.scale;
    const auditSpacing = (foundationBounds.w - 1.0) / (auditCount + 1);

    for (let i = 0; i < auditCount; i++) {
      const auditX = foundationBounds.x + 0.5 + (i + 1) * auditSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: auditX - 0.45 * auditScale,
        y: foundationBounds.y + foundationBounds.h * 0.68,
        w: 0.9 * auditScale,
        h: 0.25 * auditScale,
        fill: { color: '#404040', transparency: 85 },
        line: { color: '#606060', width: 2 }
      });
      elements.push({ type: 'rect', name: `bedrock_audit_vault_${i}` });
    }

    // V17.7: Temporal Foundations (base, count 6, scale 0.8 - MASSIVE for environmental feel)
    const temporalCount = internalStructure.temporal_foundations.count;
    const temporalScale = internalStructure.temporal_foundations.scale;
    const temporalSpacing = (foundationBounds.w - 1.5) / (temporalCount + 1);

    for (let i = 0; i < temporalCount; i++) {
      const temporalX = foundationBounds.x + 0.5 + (i + 1) * temporalSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: temporalX - 0.4 * temporalScale,
        y: foundationBounds.y + foundationBounds.h * 0.85,
        w: 0.8 * temporalScale,
        h: 0.18 * temporalScale,
        fill: { color: '#404040', transparency: 88 },
        line: { color: '#606060', width: 1.5 }
      });
      elements.push({ type: 'rect', name: `bedrock_temporal_foundation_${i}` });
    }

    // V17.7: Memory Strata (vertical, count 12, scale 1.2 - MASSIVE for environmental feel)
    const memoryCount = internalStructure.memory_strata.count;
    const memoryScale = internalStructure.memory_strata.scale;
    const memorySpacing = (foundationBounds.w - 1.0) / (memoryCount + 1);

    for (let i = 0; i < memoryCount; i++) {
      const memoryX = foundationBounds.x + 0.5 + (i + 1) * memorySpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: memoryX - 0.18 * memoryScale,
        y: foundationBounds.y + foundationBounds.h * 0.5,
        w: 0.36 * memoryScale,
        h: foundationBounds.h * 0.45,
        fill: { color: '#606060', transparency: 88 },
        line: { color: '#808080', width: 1.5 }
      });
      elements.push({ type: 'rect', name: `bedrock_memory_strata_${i}` });
    }

    // V17.7: District name - increased font size for environmental dominance
    slide.addText('BEDROCK', {
      x: foundationBounds.x + 0.2,
      y: foundationBounds.y + foundationBounds.h - 0.15,
      w: 1.8,
      h: 0.2,
      fontSize: 24, // V17.7: Increased to 24 for environmental dominance
      color: '#606060',
      bold: true
    });
    elements.push({ type: 'text', name: 'bedrock_label' });

    return elements;
  }

  renderWitnessLandmark(slide, bounds, theme, architecture) {
    const elements = [];

    // V17.7: Witness is the visual center of gravity - Mission Control/Constitutional Observatory feel
    // V17.7: 45-50% of visible world space, visual center of gravity, MASSIVE presence
    // V17.7: Text reduction: Removed component labels, kept only essential district name
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    const internalStructure = architecture.internalStructure;

    // V17.7: Evidence Core (center, scale 4.5 - MASSIVE for skyline dominance)
    const coreScale = internalStructure.evidence_core.scale;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - 3.0 * coreScale,
      y: centerY - 2.2 * coreScale,
      w: 6.0 * coreScale,
      h: 4.4 * coreScale,
      fill: { color: '#FFC400', transparency: 78 },
      line: { color: '#FFC400', width: 8 }
    });
    elements.push({ type: 'ellipse', name: 'witness_evidence_core' });

    // V17.7: Validation Rings (surrounding, count 12, scale 3.0 - MASSIVE for dominance)
    const ringCount = internalStructure.validation_rings.count;
    const ringScale = internalStructure.validation_rings.scale;
    for (let i = 0; i < ringCount; i++) {
      const ringRadius = 3.0 * coreScale + (i + 1) * 0.8 * ringScale;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: centerX - ringRadius,
        y: centerY - ringRadius * 0.73,
        w: ringRadius * 2,
        h: ringRadius * 2 * 0.73,
        fill: { color: '#FFC400', transparency: 92 },
        line: { color: '#FF8C00', width: 5, dashType: 'dash' }
      });
      elements.push({ type: 'ellipse', name: `witness_validation_ring_${i}` });
    }

    // V17.7: Confidence Lattice (perimeter, scale 2.5 - MASSIVE for dominance)
    const latticeScale = internalStructure.confidence_lattice.scale;
    const latticeRadius = 3.0 * coreScale + ringCount * 0.8 * ringScale + 0.8 * latticeScale;
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - latticeRadius,
      y: centerY - latticeRadius * 0.73,
      w: latticeRadius * 2,
      h: latticeRadius * 2 * 0.73,
      fill: { color: '#FFC400', transparency: 94 },
      line: { color: '#FF8C00', width: 3, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'witness_confidence_lattice' });

    // V17.7: Causal Tracing Towers (upper, count 6, scale 3.0 - MASSIVE for skyline height)
    const towerCount = internalStructure.causal_tracing_towers.count;
    const towerScale = internalStructure.causal_tracing_towers.scale;
    const towerSpacing = 1.8 * towerScale;
    for (let i = 0; i < towerCount; i++) {
      const towerX = centerX - (towerCount - 1) * towerSpacing / 2 + i * towerSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: towerX - 0.8 * towerScale,
        y: bounds.y - 0.1,
        w: 1.6 * towerScale,
        h: 1.2 * towerScale,
        fill: { color: '#FFC400', transparency: 80 },
        line: { color: '#FF8C00', width: 4 }
      });
      elements.push({ type: 'rect', name: `witness_causal_tower_${i}` });
    }

    // V17.7: Reproduction Chambers (lower, count 6, scale 2.5 - MASSIVE for visible footprint)
    const chamberCount = internalStructure.reproduction_chambers.count;
    const chamberScale = internalStructure.reproduction_chambers.scale;
    const chamberSpacing = 1.5 * chamberScale;
    for (let i = 0; i < chamberCount; i++) {
      const chamberX = centerX - (chamberCount - 1) * chamberSpacing / 2 + i * chamberSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: chamberX - 0.7 * chamberScale,
        y: bounds.y + bounds.h - 1.0 * chamberScale,
        w: 1.4 * chamberScale,
        h: 0.8 * chamberScale,
        fill: { color: '#FFC400', transparency: 80 },
        line: { color: '#FF8C00', width: 3 }
      });
      elements.push({ type: 'rect', name: `witness_reproduction_chamber_${i}` });
    }

    // V17.7: Verification Transit (connecting, count 10, scale 2.0 - MASSIVE for visibility)
    const transitCount = internalStructure.verification_transit.count;
    const transitScale = internalStructure.verification_transit.scale;
    for (let i = 0; i < transitCount; i++) {
      const angle = (i / transitCount) * Math.PI * 2;
      const transitX = centerX + Math.cos(angle) * 4.0 * coreScale;
      const transitY = centerY + Math.sin(angle) * 3.2 * coreScale;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: transitX - 0.25 * transitScale,
        y: transitY - 0.25 * transitScale,
        w: 0.5 * transitScale,
        h: 0.5 * transitScale,
        fill: { color: '#FFC400', transparency: 88 },
        line: { color: '#FF8C00', width: 2.5 }
      });
      elements.push({ type: 'ellipse', name: `witness_verification_transit_${i}` });
    }

    // V17.7: Rejection Chute (lower_right, scale 2.0 - MASSIVE for visibility)
    const rejectionScale = internalStructure.rejection_chute.scale;
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x + bounds.w - 1.5 * rejectionScale,
      y: bounds.y + bounds.h - 1.0 * rejectionScale,
      w: 1.2 * rejectionScale,
      h: 0.8 * rejectionScale,
      fill: { color: '#FF0000', transparency: 82 },
      line: { color: '#800000', width: 3 }
    });
    elements.push({ type: 'rect', name: 'witness_rejection_chute' });

    // V17.7: Ownership Gate (upper_right, scale 2.0 - MASSIVE for visibility)
    const ownershipScale = internalStructure.ownership_gate.scale;
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x + bounds.w - 1.5 * ownershipScale,
      y: bounds.y + 0.1,
      w: 1.2 * ownershipScale,
      h: 0.8 * ownershipScale,
      fill: { color: '#00E5FF', transparency: 82 },
      line: { color: '#008B8B', width: 3 }
    });
    elements.push({ type: 'rect', name: 'witness_ownership_gate' });

    // V17.7: District name - increased font size for skyline dominance
    slide.addText('WITNESS', {
      x: centerX - 0.8,
      y: bounds.y + bounds.h - 0.15,
      w: 1.6,
      h: 0.2,
      fontSize: 24, // V17.7: Increased to 24 for skyline dominance
      color: '#FFC400',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'witness_name' });

    return elements;
  }

  renderReplayTemporal(slide, bounds, theme, architecture) {
    const elements = [];

    // Replay is historical reconstruction complex - architecture defines: timeline_highways, ghost_reconstructions, fork_corridors, historical_overlays, archival_projections, event_recovery_lanes
    // V18: Historical reconstruction drama - walking backward through history
    // Text reduction: Removed component labels, kept only essential district name
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    const internalStructure = architecture.internalStructure;

    // V17.7: Timeline Highways (central, count 8, scale 2.0 - MASSIVE for historical reconstruction drama)
    const highwayCount = internalStructure.timeline_highways.count;
    const highwayScale = internalStructure.timeline_highways.scale;
    const highwaySpacing = 0.6 * highwayScale;
    
    for (let i = 0; i < highwayCount; i++) {
      const highwayY = centerY - (highwayCount - 1) * highwaySpacing / 2 + i * highwaySpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x + 0.5,
        y: highwayY,
        w: bounds.w - 1,
        h: 0,
        line: { color: '#C0C0C0', width: 5 * highwayScale }
      });
      elements.push({ type: 'line', name: `replay_timeline_highway_${i}` });
    }

    // V17.7: Ghost Reconstructions (overlay, count 10, scale 1.5 - MASSIVE for historical reconstruction drama)
    const ghostCount = internalStructure.ghost_reconstructions.count;
    const ghostScale = internalStructure.ghost_reconstructions.scale;
    const ghostSpacing = (bounds.w - 1) / (ghostCount + 1);

    for (let i = 0; i < ghostCount; i++) {
      const ghostX = bounds.x + 0.5 + (i + 1) * ghostSpacing;
      const ghostY = centerY - 0.5 * ghostScale;
      slide.addShape(this.pres.ShapeType.rect, {
        x: ghostX - 0.25 * ghostScale,
        y: ghostY - 0.3 * ghostScale,
        w: 0.5 * ghostScale,
        h: 0.6 * ghostScale,
        fill: { color: '#C0C0C0', transparency: 80 },
        line: { color: '#808080', width: 2.5, dashType: 'dash' }
      });
      elements.push({ type: 'rect', name: `replay_ghost_reconstruction_${i}` });
    }

    // V17.7: Fork Corridors (branching, count 12, scale 1.2 - MASSIVE for historical reconstruction drama)
    const forkCount = internalStructure.fork_corridors.count;
    const forkScale = internalStructure.fork_corridors.scale;
    const forkSpacing = (bounds.w - 1) / (forkCount + 1);

    for (let i = 0; i < forkCount; i++) {
      const forkX = bounds.x + 0.5 + (i + 1) * forkSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: forkX,
        y: centerY,
        w: 0,
        h: 0.6 * forkScale,
        line: { color: '#C0C0C0', width: 3 * forkScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `replay_fork_corridor_${i}` });
    }

    // V17.7: Historical Overlays (layered, count 8, scale 1.0 - MASSIVE for historical reconstruction drama)
    const overlayCount = internalStructure.historical_overlays.count;
    const overlayScale = internalStructure.historical_overlays.scale;

    for (let i = 0; i < overlayCount; i++) {
      const overlayY = bounds.y + 0.25 + i * 0.35 * overlayScale;
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x + 0.5,
        y: overlayY,
        w: bounds.w - 1,
        h: 0.25 * overlayScale,
        fill: { color: '#C0C0C0', transparency: 88 },
        line: { color: '#808080', width: 2, dashType: 'dash' }
      });
      elements.push({ type: 'rect', name: `replay_historical_overlay_${i}` });
    }

    // V17.7: Archival Projections (projected, count 10, scale 0.9 - MASSIVE for historical reconstruction drama)
    const projectionCount = internalStructure.archival_projections.count;
    const projectionScale = internalStructure.archival_projections.scale;
    const projectionSpacing = (bounds.w - 1) / (projectionCount + 1);

    for (let i = 0; i < projectionCount; i++) {
      const projectionX = bounds.x + 0.5 + (i + 1) * projectionSpacing;
      const projectionY = bounds.y + bounds.h - 0.5 * projectionScale;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: projectionX - 0.2 * projectionScale,
        y: projectionY - 0.2 * projectionScale,
        w: 0.4 * projectionScale,
        h: 0.4 * projectionScale,
        fill: { color: '#C0C0C0', transparency: 85 },
        line: { color: '#808080', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `replay_archival_projection_${i}` });
    }

    // V17.7: Event Recovery Lanes (recovery, count 8, scale 1.0 - MASSIVE for historical reconstruction drama)
    const recoveryCount = internalStructure.event_recovery_lanes.count;
    const recoveryScale = internalStructure.event_recovery_lanes.scale;
    const recoverySpacing = (bounds.w - 1) / (recoveryCount + 1);

    for (let i = 0; i < recoveryCount; i++) {
      const recoveryX = bounds.x + 0.5 + (i + 1) * recoverySpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: recoveryX - 0.15 * recoveryScale,
        y: bounds.y + bounds.h - 0.6 * recoveryScale,
        w: 0.3 * recoveryScale,
        h: 0.4 * recoveryScale,
        fill: { color: '#C0C0C0', transparency: 84 },
        line: { color: '#808080', width: 2 }
      });
      elements.push({ type: 'rect', name: `replay_event_recovery_lane_${i}` });
    }

    // V17.7: Reconstruction Streams (flowing, count 10, scale 1.0 - MASSIVE for historical reconstruction drama)
    const streamCount = internalStructure.reconstruction_streams.count;
    const streamScale = internalStructure.reconstruction_streams.scale;
    const streamSpacing = (bounds.w - 1) / (streamCount + 1);

    for (let i = 0; i < streamCount; i++) {
      const streamX = bounds.x + 0.5 + (i + 1) * streamSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: streamX,
        y: bounds.y + 0.15,
        w: 0,
        h: 0.5 * streamScale,
        line: { color: '#C0C0C0', width: 2.5 * streamScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `replay_reconstruction_stream_${i}` });
    }

    // V17.7: Evidence Recovery Channels (recovery, count 8, scale 0.8 - MASSIVE for historical reconstruction drama)
    const channelCount = internalStructure.evidence_recovery_channels.count;
    const channelScale = internalStructure.evidence_recovery_channels.scale;
    const channelSpacing = (bounds.w - 1) / (channelCount + 1);

    for (let i = 0; i < channelCount; i++) {
      const channelX = bounds.x + 0.5 + (i + 1) * channelSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: channelX - 0.12 * channelScale,
        y: bounds.y + bounds.h - 0.4 * channelScale,
        w: 0.24 * channelScale,
        h: 0.3 * channelScale,
        fill: { color: '#C0C0C0', transparency: 86 },
        line: { color: '#808080', width: 1.5 }
      });
      elements.push({ type: 'rect', name: `replay_evidence_recovery_channel_${i}` });
    }

    // V17.7: Archive Ghosts (overlay, count 15, scale 0.6 - MASSIVE for historical reconstruction drama)
    const ghostsCount = internalStructure.archive_ghosts.count;
    const ghostsScale = internalStructure.archive_ghosts.scale;
    const ghostsSpacing = (bounds.w - 1) / (ghostsCount + 1);

    for (let i = 0; i < ghostsCount; i++) {
      const ghostsX = bounds.x + 0.5 + (i + 1) * ghostsSpacing;
      const ghostsY = bounds.y + bounds.h * 0.35 + Math.sin(i) * 0.25;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: ghostsX - 0.1 * ghostsScale,
        y: ghostsY - 0.08 * ghostsScale,
        w: 0.2 * ghostsScale,
        h: 0.16 * ghostsScale,
        fill: { color: '#C0C0C0', transparency: 90 },
        line: { color: '#808080', width: 1.5 }
      });
      elements.push({ type: 'ellipse', name: `replay_archive_ghost_${i}` });
    }

    // V17.7: Branch Visualizations (branching, count 10, scale 0.8 - MASSIVE for historical reconstruction drama)
    const branchCount = internalStructure.branch_visualizations.count;
    const branchScale = internalStructure.branch_visualizations.scale;
    const branchSpacing = (bounds.w - 1) / (branchCount + 1);

    for (let i = 0; i < branchCount; i++) {
      const branchX = bounds.x + 0.5 + (i + 1) * branchSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: branchX,
        y: centerY - 0.35,
        w: 0,
        h: 0.4 * branchScale,
        line: { color: '#C0C0C0', width: 2 * branchScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `replay_branch_visualization_${i}` });
    }

    // V17.7: District name - increased font size for historical reconstruction dominance
    slide.addText('REPLAY', {
      x: centerX - 0.6,
      y: bounds.y + bounds.h - 0.15,
      w: 1.2,
      h: 0.2,
      fontSize: 24, // V17.7: Increased to 24 for historical reconstruction dominance
      color: '#C0C0C0',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'replay_name' });

    return elements;
  }

  renderBuilderOperational(slide, bounds, theme, architecture) {
    const elements = [];

    // V17.5: Builder active feel - industrial productivity, work becomes reality
    // V17.5: Text reduction: Removed component labels, kept only essential district name
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    const internalStructure = architecture.internalStructure;

    // V17.5: Artifact Foundries (central, count 6, scale 1.5 - increased for active feel)
    const foundryCount = internalStructure.artifact_foundries.count;
    const foundryScale = internalStructure.artifact_foundries.scale;
    const foundrySpacing = (bounds.w - 1.5) / foundryCount;

    for (let i = 0; i < foundryCount; i++) {
      const foundryX = bounds.x + 0.5 + i * foundrySpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: foundryX,
        y: bounds.y + 0.3,
        w: 1.2 * foundryScale,
        h: 0.8 * foundryScale,
        fill: { color: '#00FF00', transparency: 82 },
        line: { color: '#008000', width: 3 }
      });
      elements.push({ type: 'rect', name: `builder_artifact_foundry_${i}` });
    }

    // V17.5: Deployment Railways (radiating, count 8, scale 1.2 - increased for active feel)
    const railwayCount = internalStructure.deployment_railways.count;
    const railwayScale = internalStructure.deployment_railways.scale;
    const railwaySpacing = (bounds.w - 1.0) / (railwayCount + 1);

    for (let i = 0; i < railwayCount; i++) {
      const railwayX = bounds.x + 0.5 + (i + 1) * railwaySpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: railwayX - 0.1 * railwayScale,
        y: bounds.y + bounds.h - 1.0 * railwayScale,
        w: 0.2 * railwayScale,
        h: 0.8 * railwayScale,
        fill: { color: '#00FF00', transparency: 88 },
        line: { color: '#008000', width: 2 }
      });
      elements.push({ type: 'rect', name: `builder_deployment_railway_${i}` });

      // Arrow indicating flow outward
      slide.addShape(this.pres.ShapeType.triangle, {
        x: railwayX - 0.05 * railwayScale,
        y: bounds.y + bounds.h - 0.2 * railwayScale,
        w: 0.1 * railwayScale,
        h: 0.1 * railwayScale,
        fill: { color: '#00FF00', transparency: 70 },
        line: { color: '#008000', width: 1.5 }
      });
      elements.push({ type: 'triangle', name: `builder_deployment_railway_arrow_${i}` });
    }

    // V17.5: Execution Pipelines (flowing, count 7, scale 1.0 - increased for active feel)
    const pipelineCount = internalStructure.execution_pipelines.count;
    const pipelineScale = internalStructure.execution_pipelines.scale;
    const pipelineSpacing = (bounds.w - 1.5) / (pipelineCount + 1);

    for (let i = 0; i < pipelineCount; i++) {
      const pipelineX = bounds.x + 0.5 + (i + 1) * pipelineSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: pipelineX,
        y: bounds.y + 1.2,
        w: 0,
        h: 1.0 * pipelineScale,
        line: { color: '#00FF00', width: 2.5 * pipelineScale }
      });
      elements.push({ type: 'line', name: `builder_execution_pipeline_${i}` });
    }

    // V17.5: Tool Docks (perimeter, count 10, scale 0.7 - increased for active feel)
    const dockCount = internalStructure.tool_docks.count;
    const dockScale = internalStructure.tool_docks.scale;
    const dockSpacing = (bounds.w - 1.0) / (dockCount + 1);

    for (let i = 0; i < dockCount; i++) {
      const dockX = bounds.x + 0.5 + (i + 1) * dockSpacing;
      const dockY = bounds.y + 0.2 + (i % 2) * 0.2 * dockScale;
      slide.addShape(this.pres.ShapeType.rect, {
        x: dockX - 0.08 * dockScale,
        y: dockY,
        w: 0.16 * dockScale,
        h: 0.12 * dockScale,
        fill: { color: '#00FF00', transparency: 85 },
        line: { color: '#008000', width: 1.5 }
      });
      elements.push({ type: 'rect', name: `builder_tool_dock_${i}` });
    }

    // V17.5: Construction Gantries (overhead, count 5, scale 0.8 - increased for active feel)
    const gantryCount = internalStructure.construction_gantries.count;
    const gantryScale = internalStructure.construction_gantries.scale;
    const gantrySpacing = (bounds.w - 1.5) / (gantryCount + 1);

    for (let i = 0; i < gantryCount; i++) {
      const gantryX = bounds.x + 0.5 + (i + 1) * gantrySpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: gantryX,
        y: bounds.y + 0.1,
        w: 0,
        h: 0.5 * gantryScale,
        line: { color: '#00FF00', width: 4 * gantryScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `builder_construction_gantry_${i}` });
    }

    // V17.5: Production Lanes (connecting, count 6, scale 0.7 - increased for active feel)
    const productionCount = internalStructure.production_lanes.count;
    const productionScale = internalStructure.production_lanes.scale;
    const productionSpacing = (bounds.w - 1.5) / (productionCount + 1);

    for (let i = 0; i < productionCount; i++) {
      const productionX = bounds.x + 0.5 + (i + 1) * productionSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: productionX - 0.12 * productionScale,
        y: bounds.y + bounds.h - 0.5 * productionScale,
        w: 0.24 * productionScale,
        h: 0.3 * productionScale,
        fill: { color: '#00FF00', transparency: 86 },
        line: { color: '#008000', width: 2 }
      });
      elements.push({ type: 'rect', name: `builder_production_lane_${i}` });
    }

    // V17.5: Deployment Lanes (radiating, count 8, scale 1.0 - new component for active feel)
    const laneCount = internalStructure.deployment_lanes.count;
    const laneScale = internalStructure.deployment_lanes.scale;
    const laneSpacing = (bounds.w - 1.0) / (laneCount + 1);

    for (let i = 0; i < laneCount; i++) {
      const laneX = bounds.x + 0.5 + (i + 1) * laneSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: laneX - 0.1 * laneScale,
        y: bounds.y + bounds.h - 0.7 * laneScale,
        w: 0.2 * laneScale,
        h: 0.5 * laneScale,
        fill: { color: '#00FF00', transparency: 88 },
        line: { color: '#008000', width: 1.5 }
      });
      elements.push({ type: 'rect', name: `builder_deployment_lane_${i}` });
    }

    // V17.5: Execution Tracks (flowing, count 7, scale 0.8 - new component for active feel)
    const trackCount = internalStructure.execution_tracks.count;
    const trackScale = internalStructure.execution_tracks.scale;
    const trackSpacing = (bounds.w - 1.5) / (trackCount + 1);

    for (let i = 0; i < trackCount; i++) {
      const trackX = bounds.x + 0.5 + (i + 1) * trackSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: trackX,
        y: bounds.y + 0.8,
        w: 0,
        h: 0.6 * trackScale,
        line: { color: '#00FF00', width: 2 * trackScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `builder_execution_track_${i}` });
    }

    // V17.5: Build Queues (central, count 5, scale 0.6 - new component for active feel)
    const queueCount = internalStructure.build_queues.count;
    const queueScale = internalStructure.build_queues.scale;
    const queueSpacing = (bounds.w - 1.5) / (queueCount + 1);

    for (let i = 0; i < queueCount; i++) {
      const queueX = bounds.x + 0.5 + (i + 1) * queueSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: queueX - 0.1 * queueScale,
        y: bounds.y + bounds.h - 0.3 * queueScale,
        w: 0.2 * queueScale,
        h: 0.2 * queueScale,
        fill: { color: '#00FF00', transparency: 90 },
        line: { color: '#008000', width: 1 }
      });
      elements.push({ type: 'rect', name: `builder_build_queue_${i}` });
    }

    // V17.5: Construction Pipelines (flowing, count 6, scale 0.7 - new component for active feel)
    const constructionCount = internalStructure.construction_pipelines.count;
    const constructionScale = internalStructure.construction_pipelines.scale;
    const constructionSpacing = (bounds.w - 1.5) / (constructionCount + 1);

    for (let i = 0; i < constructionCount; i++) {
      const constructionX = bounds.x + 0.5 + (i + 1) * constructionSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: constructionX,
        y: bounds.y + 0.5,
        w: 0,
        h: 0.5 * constructionScale,
        line: { color: '#00FF00', width: 1.5 * constructionScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `builder_construction_pipeline_${i}` });
    }

    // V17.5: District name - increased font size for typography recovery (readable from across a room)
    slide.addText('BUILDER', {
      x: centerX - 0.6,
      y: bounds.y + bounds.h - 0.12,
      w: 1.2,
      h: 0.15,
      fontSize: 18, // V17.5: Increased to 18 for readability from across a room
      color: '#00FF00',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'builder_name' });

    return elements;
  }

  renderGovernanceAuthoritative(slide, bounds, theme, architecture) {
    const elements = [];

    // V17.5: Governance authority - dangerous authority, nothing proceeds without passing
    // V17.5: Text reduction: Removed component labels, kept only essential district name
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    const internalStructure = architecture.internalStructure;

    // V17.5: Constitutional Gates (entrance, count 5, scale 1.5 - increased for authoritative feel)
    const gateCount = internalStructure.constitutional_gates.count;
    const gateScale = internalStructure.constitutional_gates.scale;
    const gateSpacing = 1.2 * gateScale;

    for (let i = 0; i < gateCount; i++) {
      const gateX = centerX - (gateCount - 1) * gateSpacing / 2 + i * gateSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: gateX - 0.5 * gateScale,
        y: centerY - 0.6 * gateScale,
        w: 1.0 * gateScale,
        h: 1.2 * gateScale,
        fill: { color: '#FFC400', transparency: 82 },
        line: { color: '#FF8C00', width: 4 }
      });
      elements.push({ type: 'rect', name: `governance_constitutional_gate_${i}` });
    }

    // V17.5: Approval Corridors (internal, count 6, scale 1.2 - increased for authoritative feel)
    const approvalCount = internalStructure.approval_corridors.count;
    const approvalScale = internalStructure.approval_corridors.scale;
    const approvalSpacing = (bounds.w - 1.5) / (approvalCount + 1);

    for (let i = 0; i < approvalCount; i++) {
      const approvalX = bounds.x + 0.5 + (i + 1) * approvalSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: approvalX - 0.12 * approvalScale,
        y: bounds.y + 0.3,
        w: 0.24 * approvalScale,
        h: 0.5 * approvalScale,
        fill: { color: '#00FF00', transparency: 82 },
        line: { color: '#008000', width: 2.5 }
      });
      elements.push({ type: 'rect', name: `governance_approval_corridor_${i}` });
    }

    // V17.5: Rejection Walls (blocking, count 7, scale 1.3 - increased for authoritative feel)
    const wallCount = internalStructure.rejection_walls.count;
    const wallScale = internalStructure.rejection_walls.scale;
    const wallSpacing = (bounds.w - 1.5) / (wallCount + 1);

    for (let i = 0; i < wallCount; i++) {
      const wallX = bounds.x + 0.5 + (i + 1) * wallSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: wallX - 0.15 * wallScale,
        y: bounds.y + bounds.h - 0.7 * wallScale,
        w: 0.3 * wallScale,
        h: 0.6 * wallScale,
        fill: { color: '#FF0000', transparency: 82 },
        line: { color: '#800000', width: 3 }
      });
      elements.push({ type: 'rect', name: `governance_rejection_wall_${i}` });
    }

    // V17.5: Constraint Barriers (perimeter, count 8, scale 1.0 - increased for authoritative feel)
    const barrierCount = internalStructure.constraint_barriers.count;
    const barrierScale = internalStructure.constraint_barriers.scale;
    const barrierSpacing = (bounds.w - 1.0) / (barrierCount + 1);

    for (let i = 0; i < barrierCount; i++) {
      const barrierX = bounds.x + 0.5 + (i + 1) * barrierSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: barrierX,
        y: bounds.y + 0.2,
        w: 0,
        h: bounds.h - 0.4,
        line: { color: '#FFC400', width: 2 * barrierScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `governance_constraint_barrier_${i}` });
    }

    // V17.5: Rollback Vaults (secure, count 4, scale 1.2 - increased for authoritative feel)
    const vaultCount = internalStructure.rollback_vaults.count;
    const vaultScale = internalStructure.rollback_vaults.scale;
    const vaultSpacing = 1.5 * vaultScale;

    for (let i = 0; i < vaultCount; i++) {
      const vaultX = centerX - (vaultCount - 1) * vaultSpacing / 2 + i * vaultSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: vaultX - 0.4 * vaultScale,
        y: bounds.y + bounds.h - 1.0 * vaultScale,
        w: 0.8 * vaultScale,
        h: 0.6 * vaultScale,
        fill: { color: '#FFC400', transparency: 82 },
        line: { color: '#FF8C00', width: 3 }
      });
      elements.push({ type: 'rect', name: `governance_rollback_vault_${i}` });
    }

    // V17.5: Enforcement Towers (overwatch, count 5, scale 0.9 - increased for authoritative feel)
    const towerCount = internalStructure.enforcement_towers.count;
    const towerScale = internalStructure.enforcement_towers.scale;
    const towerSpacing = (bounds.w - 1.5) / (towerCount + 1);

    for (let i = 0; i < towerCount; i++) {
      const towerX = bounds.x + 0.5 + (i + 1) * towerSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: towerX - 0.1 * towerScale,
        y: bounds.y + 0.1,
        w: 0.2 * towerScale,
        h: 0.45 * towerScale,
        fill: { color: '#FFC400', transparency: 82 },
        line: { color: '#FF8C00', width: 2.5 }
      });
      elements.push({ type: 'rect', name: `governance_enforcement_tower_${i}` });
    }

    // V17.5: Constitutional Walls (perimeter, count 6, scale 1.0 - new component for authoritative feel)
    const wall2Count = internalStructure.constitutional_walls.count;
    const wall2Scale = internalStructure.constitutional_walls.scale;
    const wall2Spacing = (bounds.w - 1.0) / (wall2Count + 1);

    for (let i = 0; i < wall2Count; i++) {
      const wall2X = bounds.x + 0.5 + (i + 1) * wall2Spacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: wall2X,
        y: bounds.y + 0.15,
        w: 0,
        h: bounds.h - 0.3,
        line: { color: '#FFC400', width: 2.5 * wall2Scale }
      });
      elements.push({ type: 'line', name: `governance_constitutional_wall_${i}` });
    }

    // V17.5: Gate Complexes (entrance, count 4, scale 1.2 - new component for authoritative feel)
    const complexCount = internalStructure.gate_complexes.count;
    const complexScale = internalStructure.gate_complexes.scale;
    const complexSpacing = 1.3 * complexScale;

    for (let i = 0; i < complexCount; i++) {
      const complexX = centerX - (complexCount - 1) * complexSpacing / 2 + i * complexSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: complexX - 0.4 * complexScale,
        y: centerY - 0.3 * complexScale,
        w: 0.8 * complexScale,
        h: 0.6 * complexScale,
        fill: { color: '#FFC400', transparency: 85 },
        line: { color: '#FF8C00', width: 3 }
      });
      elements.push({ type: 'rect', name: `governance_gate_complex_${i}` });
    }

    // V17.5: Checkpoint Towers (perimeter, count 6, scale 0.8 - new component for authoritative feel)
    const checkpointCount = internalStructure.checkpoint_towers.count;
    const checkpointScale = internalStructure.checkpoint_towers.scale;
    const checkpointSpacing = (bounds.w - 1.0) / (checkpointCount + 1);

    for (let i = 0; i < checkpointCount; i++) {
      const checkpointX = bounds.x + 0.5 + (i + 1) * checkpointSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: checkpointX - 0.08 * checkpointScale,
        y: bounds.y + bounds.h - 0.4 * checkpointScale,
        w: 0.16 * checkpointScale,
        h: 0.3 * checkpointScale,
        fill: { color: '#FFC400', transparency: 85 },
        line: { color: '#FF8C00', width: 2 }
      });
      elements.push({ type: 'rect', name: `governance_checkpoint_tower_${i}` });
    }

    // V17.5: Rejection Barriers (blocking, count 8, scale 1.0 - new component for authoritative feel)
    const barrier2Count = internalStructure.rejection_barriers.count;
    const barrier2Scale = internalStructure.rejection_barriers.scale;
    const barrier2Spacing = (bounds.w - 1.5) / (barrier2Count + 1);

    for (let i = 0; i < barrier2Count; i++) {
      const barrier2X = bounds.x + 0.5 + (i + 1) * barrier2Spacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: barrier2X - 0.12 * barrier2Scale,
        y: bounds.y + bounds.h - 0.55 * barrier2Scale,
        w: 0.24 * barrier2Scale,
        h: 0.4 * barrier2Scale,
        fill: { color: '#FF0000', transparency: 85 },
        line: { color: '#800000', width: 2.5 }
      });
      elements.push({ type: 'rect', name: `governance_rejection_barrier_${i}` });
    }

    // V17.5: District name - increased font size for typography recovery (readable from across a room)
    slide.addText('GOVERNANCE', {
      x: centerX - 0.7,
      y: bounds.y + bounds.h - 0.12,
      w: 1.4,
      h: 0.15,
      fontSize: 18, // V17.5: Increased to 18 for readability from across a room
      color: '#FFC400',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'governance_name' });

    return elements;
  }

  renderGatewayPort(slide, bounds, theme, architecture) {
    const elements = [];

    // V17.5: Gateway is civilization interface - constant incoming activity, massive port complex
    // V17.5: Text reduction: Removed component labels, kept only essential district name
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2;
    const internalStructure = architecture.internalStructure;

    // V17.5: Ingress Towers (perimeter, count 6, scale 1.2 - increased for monumental feel)
    const towerCount = internalStructure.ingress_towers.count;
    const towerScale = internalStructure.ingress_towers.scale;
    const towerSpacing = (bounds.w - 1.5) / (towerCount + 1);

    for (let i = 0; i < towerCount; i++) {
      const towerX = bounds.x + 0.5 + (i + 1) * towerSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: towerX - 0.2 * towerScale,
        y: bounds.y + 0.2,
        w: 0.4 * towerScale,
        h: 0.7 * towerScale,
        fill: { color: '#00E5FF', transparency: 82 },
        line: { color: '#008B8B', width: 3 }
      });
      elements.push({ type: 'rect', name: `gateway_ingress_tower_${i}` });
    }

    // V17.5: Traffic Corridors (radiating, count 8, scale 1.0 - increased for monumental feel)
    const corridorCount = internalStructure.traffic_corridors.count;
    const corridorScale = internalStructure.traffic_corridors.scale;
    const corridorSpacing = (bounds.w - 1.0) / (corridorCount + 1);

    for (let i = 0; i < corridorCount; i++) {
      const corridorX = bounds.x + 0.5 + (i + 1) * corridorSpacing;
      slide.addShape(this.pres.ShapeType.line, {
        x: corridorX,
        y: bounds.y + 0.8,
        w: 0,
        h: bounds.h - 1.0,
        line: { color: '#00E5FF', width: 2.5 * corridorScale, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `gateway_traffic_corridor_${i}` });
    }

    // V17.5: Observation Ports (upper, count 5, scale 0.8 - increased for monumental feel)
    const portCount = internalStructure.observation_ports.count;
    const portScale = internalStructure.observation_ports.scale;
    const portSpacing = (bounds.w - 1.5) / (portCount + 1);

    for (let i = 0; i < portCount; i++) {
      const portX = bounds.x + 0.5 + (i + 1) * portSpacing;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: portX - 0.12 * portScale,
        y: bounds.y + 0.1,
        w: 0.24 * portScale,
        h: 0.18 * portScale,
        fill: { color: '#00E5FF', transparency: 85 },
        line: { color: '#008B8B', width: 2 }
      });
      elements.push({ type: 'ellipse', name: `gateway_observation_port_${i}` });
    }

    // V17.5: Event Docks (lower, count 7, scale 0.7 - increased for monumental feel)
    const dockCount = internalStructure.event_docks.count;
    const dockScale = internalStructure.event_docks.scale;
    const dockSpacing = (bounds.w - 1.5) / (dockCount + 1);

    for (let i = 0; i < dockCount; i++) {
      const dockX = bounds.x + 0.5 + (i + 1) * dockSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: dockX - 0.1 * dockScale,
        y: bounds.y + bounds.h - 0.5 * dockScale,
        w: 0.2 * dockScale,
        h: 0.3 * dockScale,
        fill: { color: '#00E5FF', transparency: 82 },
        line: { color: '#008B8B', width: 2 }
      });
      elements.push({ type: 'rect', name: `gateway_event_dock_${i}` });
    }

    // V17.5: Reality Intake Lanes (central, count 5, scale 1.0 - increased for monumental feel)
    const intakeCount = internalStructure.reality_intake_lanes.count;
    const intakeScale = internalStructure.reality_intake_lanes.scale;
    const intakeSpacing = (bounds.w - 1.5) / (intakeCount + 1);

    for (let i = 0; i < intakeCount; i++) {
      const intakeX = bounds.x + 0.5 + (i + 1) * intakeSpacing;
      slide.addShape(this.pres.ShapeType.rect, {
        x: intakeX - 0.12 * intakeScale,
        y: centerY - 0.25 * intakeScale,
        w: 0.24 * intakeScale,
        h: 0.5 * intakeScale,
        fill: { color: '#00E5FF', transparency: 82 },
        line: { color: '#008B8B', width: 2.5 }
      });
      elements.push({ type: 'rect', name: `gateway_reality_intake_lane_${i}` });

      // Arrow indicating inward flow
      slide.addShape(this.pres.ShapeType.triangle, {
        x: intakeX - 0.05 * intakeScale,
        y: centerY + 0.2 * intakeScale,
        w: 0.1 * intakeScale,
        h: 0.1 * intakeScale,
        fill: { color: '#00E5FF', transparency: 70 },
        line: { color: '#008B8B', width: 1.5 }
      });
      elements.push({ type: 'triangle', name: `gateway_reality_intake_arrow_${i}` });
    }

    // V17.5: External Packet Streams (flowing, count 12, scale 0.6 - increased for monumental feel)
    const streamCount = internalStructure.external_packet_streams.count;
    const streamScale = internalStructure.external_packet_streams.scale;
    const streamSpacing = (bounds.w - 1.0) / (streamCount + 1);

    for (let i = 0; i < streamCount; i++) {
      const streamX = bounds.x + 0.5 + (i + 1) * streamSpacing;
      const streamY = bounds.y + bounds.h - 0.25 + (i % 2) * 0.12;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: streamX - 0.08 * streamScale,
        y: streamY - 0.05 * streamScale,
        w: 0.16 * streamScale,
        h: 0.1 * streamScale,
        fill: { color: '#00E5FF', transparency: 78 },
        line: { color: '#008B8B', width: 1.5 }
      });
      elements.push({ type: 'ellipse', name: `gateway_external_packet_stream_${i}` });
    }

    // V17.5: District name - increased font size for typography recovery (readable from across a room)
    slide.addText('GATEWAY', {
      x: centerX - 0.6,
      y: bounds.y + bounds.h - 0.12,
      w: 1.2,
      h: 0.15,
      fontSize: 18, // V17.5: Increased to 18 for readability from across a room
      color: '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'gateway_name' });

    return elements;
  }

  renderPacketCapsule(slide, packet, bounds, theme) {
    const elements = [];

    // Agent 6: Packets as MASSIVE signature visuals - impossible to miss from back of conference room
    // Agent 6: Huge scale for 60-second visual impact
    const capsuleScale = 6.0; // Agent 6: Even more massive for back-of-conference-room visibility

    // Capsule shape - enormous for signature visual presence
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w * capsuleScale,
      h: bounds.h * capsuleScale,
      fill: { color: '#1A1A1F', transparency: 70 },
      line: { color: '#00E5FF', width: 12 } // Agent 6: Extra thick border for conference room visibility
    });
    elements.push({ type: 'ellipse', name: 'packet_capsule' });

    // Agent 6: Visible metadata: owner, claim, confidence, status - always visible at all zoom levels
    const metadataY = bounds.y + 0.08;
    const metadataSpacing = 0.18;

    // Agent 6: Owner - giant font for conference room readability
    slide.addText('OWNER:', {
      x: bounds.x + 0.06,
      y: metadataY,
      w: 0.5,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font for conference room visibility
      color: '#00E5FF',
      bold: true,
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_owner_label' });

    slide.addText(packet.owner || 'UNKNOWN', {
      x: bounds.x + 0.55,
      y: metadataY,
      w: bounds.w * capsuleScale - 0.6,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font
      color: '#FFFFFF',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_owner_value' });

    // Agent 6: Claim - giant font
    slide.addText('CLAIM:', {
      x: bounds.x + 0.06,
      y: metadataY + metadataSpacing,
      w: 0.5,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font
      color: '#00E5FF',
      bold: true,
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_claim_label' });

    slide.addText(packet.claim || 'NONE', {
      x: bounds.x + 0.55,
      y: metadataY + metadataSpacing,
      w: bounds.w * capsuleScale - 0.6,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font
      color: '#FFFFFF',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_claim_value' });

    // Agent 6: Confidence - giant font
    slide.addText('CONFIDENCE:', {
      x: bounds.x + 0.06,
      y: metadataY + metadataSpacing * 2,
      w: 0.5,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font
      color: '#00E5FF',
      bold: true,
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_confidence_label' });

    slide.addText(String(packet.confidence || '0'), {
      x: bounds.x + 0.55,
      y: metadataY + metadataSpacing * 2,
      w: bounds.w * capsuleScale - 0.6,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font
      color: '#FFFFFF',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_confidence_value' });

    // Agent 6: Status - giant font
    slide.addText('STATUS:', {
      x: bounds.x + 0.06,
      y: metadataY + metadataSpacing * 3,
      w: 0.5,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font
      color: '#00E5FF',
      bold: true,
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_status_label' });

    slide.addText(packet.status || 'UNKNOWN', {
      x: bounds.x + 0.55,
      y: metadataY + metadataSpacing * 3,
      w: bounds.w * capsuleScale - 0.6,
      h: 0.12,
      fontSize: 14, // Agent 6: Giant font
      color: '#FFFFFF',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'packet_status_value' });

    // Agent 6: Status indicator - massive for signature visual presence
    const statusColor = packet.status === 'Verified' || packet.status === 'Approved' || packet.status === 'Stored' ? '#00FF00' : '#FF0000';
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: bounds.x + bounds.w * capsuleScale - 0.15,
      y: bounds.y + bounds.h * capsuleScale - 0.15,
      w: 0.12, // Agent 6: Massive indicator
      h: 0.12,
      fill: { color: statusColor, transparency: 40 },
      line: { color: statusColor, width: 5 }
    });
    elements.push({ type: 'ellipse', name: 'packet_status_indicator' });

    return elements;
  }

  renderFailureDestination(slide, destination, bounds, theme) {
    const elements = [];

    // V17.5: Failure infrastructure as permanent geography - always visible, part of world geography
    // V17.5: REJECTION SINK, ROLLBACK VAULT, VIOLATION LOG, FAILURE CHANNEL, OWNERSHIP CONFLICT CHAMBER, VERIFICATION FAILURE PIT
    
    // Destination frame - larger and more prominent for permanent geography
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y,
      w: bounds.w,
      h: bounds.h,
      fill: { color: '#FF0000', transparency: 80 },
      line: { color: '#800000', width: 3 } // V17.5: Thicker border for permanent geography
    });
    elements.push({ type: 'rect', name: `failure_dest_${destination.id}` });

    // V17.5: Destination label - increased font size for readability from across a room
    slide.addText(destination.id.toUpperCase().replace('_', ' '), {
      x: bounds.x + 0.05,
      y: bounds.y + 0.06,
      w: bounds.w - 0.1,
      h: 0.12,
      fontSize: 10, // V17.5: Increased to 10 for readability from across a room
      color: '#FFFFFF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: `failure_dest_label_${destination.id}` });

    // V17.5: Render specific components based on destination type - increased scales for permanent geography
    if (destination.components) {
      Object.entries(destination.components).forEach(([compType, comp]) => {
        if (comp.type === 'basin') {
          slide.addShape(this.pres.ShapeType.ellipse, {
            x: bounds.x + bounds.w / 2 - 0.3,
            y: bounds.y + bounds.h / 2 - 0.2,
            w: 0.6, // V17.5: Increased for permanent geography
            h: 0.4,
            fill: { color: '#800000', transparency: 65 },
            line: { color: '#FF0000', width: 2 } // V17.5: Thicker border for permanent geography
          });
          elements.push({ type: 'ellipse', name: `failure_${destination.id}_basin` });
        } else if (comp.type === 'door') {
          slide.addShape(this.pres.ShapeType.rect, {
            x: bounds.x + bounds.w / 2 - 0.2,
            y: bounds.y + bounds.h / 2 - 0.25,
            w: 0.4, // V17.5: Increased for permanent geography
            h: 0.5,
            fill: { color: '#800000', transparency: 65 },
            line: { color: '#FF0000', width: 2.5 } // V17.5: Thicker border for permanent geography
          });
          elements.push({ type: 'rect', name: `failure_${destination.id}_door` });
        } else if (comp.type === 'lock') {
          slide.addShape(this.pres.ShapeType.rect, {
            x: bounds.x + bounds.w / 2 - 0.15,
            y: bounds.y + bounds.h / 2 - 0.15,
            w: 0.3, // V17.5: Increased for permanent geography
            h: 0.3,
            fill: { color: '#800000', transparency: 65 },
            line: { color: '#FF0000', width: 2.5 } // V17.5: Thicker border for permanent geography
          });
          elements.push({ type: 'rect', name: `failure_${destination.id}_lock` });
        }
      });
    }

    return elements;
  }

  renderSuccessRoute(slide, fromBounds, toBounds, theme) {
    const elements = [];

    const fromCenterX = fromBounds.x + fromBounds.w / 2;
    const fromCenterY = fromBounds.y + fromBounds.h / 2;
    const toCenterX = toBounds.x + toBounds.w / 2;
    const toCenterY = toBounds.y + toBounds.h / 2;

    // Agent 6: Much thicker connection line for visibility from back of room
    slide.addShape(this.pres.ShapeType.line, {
      x: fromCenterX,
      y: fromCenterY,
      w: toCenterX - fromCenterX,
      h: toCenterY - fromCenterY,
      line: { color: theme.primary || '#00E5FF', width: 6 }
    });
    elements.push({ type: 'line', name: 'success_route' });

    // Agent 6: Larger arrow head
    const arrowSize = 0.2;
    const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX);

    slide.addShape(this.pres.ShapeType.triangle, {
      x: toCenterX - arrowSize / 2 - Math.cos(angle) * 0.3,
      y: toCenterY - arrowSize / 2 - Math.sin(angle) * 0.3,
      w: arrowSize,
      h: arrowSize,
      fill: { color: theme.primary || '#00E5FF', transparency: 60 },
      line: { color: theme.primary || '#00E5FF', width: 3 }
    });
    elements.push({ type: 'triangle', name: 'success_route_arrow' });

    return elements;
  }

  renderFailureRoute(slide, fromBounds, toBounds, failureType, theme) {
    const elements = [];

    const fromCenterX = fromBounds.x + fromBounds.w / 2;
    const fromCenterY = fromBounds.y + fromBounds.h / 2;
    const toCenterX = toBounds.x + toBounds.w / 2;
    const toCenterY = toBounds.y + toBounds.h / 2;

    // Curved failure route
    const midX = (fromCenterX + toCenterX) / 2;
    const midY = fromCenterY + (failureType === 'rollback' ? -1 : 1);

    // First segment
    slide.addShape(this.pres.ShapeType.line, {
      x: fromCenterX,
      y: fromCenterY,
      w: midX - fromCenterX,
      h: midY - fromCenterY,
      line: { color: '#FF0000', width: 2, dashType: 'dash' }
    });
    elements.push({ type: 'line', name: 'failure_route_1' });

    // Second segment
    slide.addShape(this.pres.ShapeType.line, {
      x: midX,
      y: midY,
      w: toCenterX - midX,
      h: toCenterY - midY,
      line: { color: '#FF0000', width: 2, dashType: 'dash' }
    });
    elements.push({ type: 'line', name: 'failure_route_2' });

    // Failure type label
    slide.addText(failureType.toUpperCase().replace('_', ' '), {
      x: midX - 0.3,
      y: midY - 0.05,
      w: 0.6,
      h: 0.1,
      fontSize: 5,
      color: '#FF0000',
      align: 'center',
      fontFace: 'Courier New'
    });
    elements.push({ type: 'text', name: 'failure_route_label' });

    // Arrow head
    const arrowSize = 0.08;
    const angle = Math.atan2(toCenterY - midY, toCenterX - midX);

    slide.addShape(this.pres.ShapeType.triangle, {
      x: toCenterX - arrowSize / 2 - Math.cos(angle) * 0.15,
      y: toCenterY - arrowSize / 2 - Math.sin(angle) * 0.15,
      w: arrowSize,
      h: arrowSize,
      fill: { color: '#FF0000', transparency: 70 },
      line: { color: '#FF0000', width: 2 }
    });
    elements.push({ type: 'triangle', name: 'failure_route_arrow' });

    return elements;
  }

  renderFullTopology(slide, world, bounds, theme) {
    const elements = [];
    const { DISTRICT_GEOMETRY } = require('./district-geometry');

    // V17.5: 80-90% canvas utilization - render worldbuilding background first
    const worldbuildingElements = this.renderWorldbuilding(slide, bounds, theme);
    elements.push(...worldbuildingElements);

    // Render Bedrock foundation first (under everything) - V17.5: Environmental substrate
    const bedrockArchitecture = DISTRICT_GEOMETRY.bedrock;
    const bedrockElements = this.renderBedrockFoundation(slide, bounds, theme, bedrockArchitecture);
    elements.push(...bedrockElements);

    // V17.5: Increase canvas utilization - larger district positions, structures extending off-screen
    const centerX = bounds.x + bounds.w / 2;
    const centerY = bounds.y + bounds.h / 2 - 0.5;
    const radius = 3.5; // V17.5: Increased from 2.5 for 80-90% canvas utilization

    const districtPositions = {
      gateway: { x: centerX, y: centerY - radius },
      witness: { x: centerX + radius * 0.866, y: centerY - radius * 0.5 },
      bedrock: { x: centerX + radius * 0.866, y: centerY + radius * 0.5 },
      replay: { x: centerX, y: centerY + radius },
      builder: { x: centerX - radius * 0.866, y: centerY + radius * 0.5 },
      governance: { x: centerX - radius * 0.866, y: centerY - radius * 0.5 }
    };

    const districtBounds = {};

    // Render districts with landmark geometries - V17.5: Larger base bounds for canvas utilization
    world.districts.forEach(district => {
      const pos = districtPositions[district.id];
      const architecture = DISTRICT_GEOMETRY[district.id];

      // V17.5: Increased base bounds for 80-90% canvas utilization
      const baseWidth = 3.0; // V17.5: Increased from 2.0
      const baseHeight = 2.2; // V17.5: Increased from 1.5
      const districtBoundsLocal = {
        x: pos.x - (baseWidth * architecture.scale) / 2,
        y: pos.y - (baseHeight * architecture.scale) / 2,
        w: baseWidth * architecture.scale,
        h: baseHeight * architecture.scale
      };

      let districtElements;

      switch (district.id) {
        case 'witness':
          districtElements = this.renderWitnessLandmark(slide, districtBoundsLocal, theme, architecture);
          break;
        case 'replay':
          districtElements = this.renderReplayTemporal(slide, districtBoundsLocal, theme, architecture);
          break;
        case 'builder':
          districtElements = this.renderBuilderOperational(slide, districtBoundsLocal, theme, architecture);
          break;
        case 'governance':
          districtElements = this.renderGovernanceAuthoritative(slide, districtBoundsLocal, theme, architecture);
          break;
        case 'gateway':
          districtElements = this.renderGatewayPort(slide, districtBoundsLocal, theme, architecture);
          break;
        case 'bedrock':
          // Bedrock is already rendered as foundation
          districtElements = [];
          break;
        default:
          districtElements = [];
      }

      elements.push(...districtElements);
      districtBounds[district.id] = districtBoundsLocal;
    });

    // Render success routes with packet capsules - V17.5: More capsules, larger
    world.successTopology.forEach(route => {
      const fromBounds = districtBounds[route.from];
      const toBounds = districtBounds[route.to];

      if (fromBounds && toBounds) {
        const routeElements = this.renderSuccessRoute(slide, fromBounds, toBounds, theme);
        elements.push(...routeElements);

        // V17.5: More packet capsules, larger for signature visuals
        const fromCenterX = fromBounds.x + fromBounds.w / 2;
        const fromCenterY = fromBounds.y + fromBounds.h / 2;
        const toCenterX = toBounds.x + toBounds.w / 2;
        const toCenterY = toBounds.y + toBounds.h / 2;

        const capsuleCount = 8; // V17.5: Increased from 4 for signature visuals
        const { INFRASTRUCTURE } = require('./infrastructure');
        const packet = INFRASTRUCTURE[route.from]?.packets[0];

        for (let i = 0; i < capsuleCount; i++) {
          const t = (i + 1) / (capsuleCount + 1);
          const capsuleX = fromCenterX + (toCenterX - fromCenterX) * t;
          const capsuleY = fromCenterY + (toCenterY - fromCenterY) * t;

          if (packet) {
            // V17.5: Larger capsule bounds for signature visuals
            const capsuleBounds = {
              x: capsuleX - 0.25,
              y: capsuleY - 0.15,
              w: 0.5,
              h: 0.3
            };

            const capsuleElements = this.renderPacketCapsule(slide, packet, capsuleBounds, theme);
            elements.push(...capsuleElements);
          }
        }
      }
    });

    // Render failure routes and destinations (visible at all zoom levels) - V17.5: Permanent geography
    const { FAILURE_DESTINATIONS } = require('./district-geometry');

    world.failureRoutes.forEach((route, index) => {
      const fromBounds = districtBounds[route.from];
      const destKey = Object.keys(FAILURE_DESTINATIONS)[index % Object.keys(FAILURE_DESTINATIONS).length];
      const dest = FAILURE_DESTINATIONS[destKey];

      if (fromBounds && dest) {
        const toBounds = {
          x: dest.position.x,
          y: dest.position.y,
          w: dest.bounds.w,
          h: dest.bounds.h
        };

        const failureElements = this.renderFailureRoute(slide, fromBounds, toBounds, route.type, theme);
        elements.push(...failureElements);

        // Render failure destination - V17.5: Permanent geography, larger
        const destElements = this.renderFailureDestination(slide, dest, toBounds, theme);
        elements.push(...destElements);
      }
    });

    return elements;
  }

  // V17.5: Worldbuilding elements - star field, fog layers, grid layers, depth planes, distant structures, background transit systems, substrate glow, constitutional horizon
  renderWorldbuilding(slide, bounds, theme) {
    const elements = [];

    // V17.5: Star field - distant background stars for depth
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const starX = bounds.x + Math.random() * bounds.w;
      const starY = bounds.y + Math.random() * bounds.h;
      const starSize = 0.02 + Math.random() * 0.03;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: starX - starSize / 2,
        y: starY - starSize / 2,
        w: starSize,
        h: starSize,
        fill: { color: '#FFFFFF', transparency: 95 },
        line: { color: 'transparent', width: 0 }
      });
      elements.push({ type: 'ellipse', name: `star_field_${i}` });
    }

    // V17.5: Deep background layers - multiple depth planes
    const depthLayerCount = 3;
    for (let i = 0; i < depthLayerCount; i++) {
      const depthY = bounds.y + bounds.h * 0.1 + i * bounds.h * 0.25;
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x,
        y: depthY,
        w: bounds.w,
        h: bounds.h * 0.15,
        fill: { color: '#0A0A15', transparency: 98 - i * 2 },
        line: { color: 'transparent', width: 0 }
      });
      elements.push({ type: 'rect', name: `depth_layer_${i}` });
    }

    // V17.5: Fog layers - subtle atmospheric depth
    const fogCount = 4;
    for (let i = 0; i < fogCount; i++) {
      const fogY = bounds.y + bounds.h * 0.2 + i * bounds.h * 0.2;
      slide.addShape(this.pres.ShapeType.rect, {
        x: bounds.x,
        y: fogY,
        w: bounds.w,
        h: bounds.h * 0.25,
        fill: { color: '#1A1A25', transparency: 97 },
        line: { color: 'transparent', width: 0 }
      });
      elements.push({ type: 'rect', name: `fog_layer_${i}` });
    }

    // V17.5: Grid layers - foundational grid for structure
    const gridSize = 0.8;
    const gridLines = Math.floor(bounds.w / gridSize);
    
    for (let i = 0; i <= gridLines; i++) {
      const x = bounds.x + i * gridSize;
      // Vertical lines
      slide.addShape(this.pres.ShapeType.line, {
        x: x,
        y: bounds.y,
        w: 0,
        h: bounds.h,
        line: { color: '#2A2A35', width: 0.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `grid_v_${i}` });
    }

    const gridRows = Math.floor(bounds.h / gridSize);
    for (let i = 0; i <= gridRows; i++) {
      const y = bounds.y + i * gridSize;
      // Horizontal lines
      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x,
        y: y,
        w: bounds.w,
        h: 0,
        line: { color: '#2A2A35', width: 0.5, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `grid_h_${i}` });
    }

    // V17.5: Distant structures - background architectural hints
    const structureCount = 5;
    for (let i = 0; i < structureCount; i++) {
      const structX = bounds.x + bounds.w * 0.15 + i * bounds.w * 0.18;
      const structY = bounds.y + bounds.h * 0.25;
      slide.addShape(this.pres.ShapeType.rect, {
        x: structX,
        y: structY,
        w: bounds.w * 0.12,
        h: bounds.h * 0.5,
        fill: { color: '#1A1A25', transparency: 96 },
        line: { color: '#3A3A45', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'rect', name: `distant_structure_${i}` });
    }

    // V17.5: Background transit systems - distant movement
    const transitCount = 6;
    for (let i = 0; i < transitCount; i++) {
      const transitX = bounds.x + bounds.w * 0.1 + i * bounds.w * 0.15;
      const transitY = bounds.y + bounds.h * 0.6 + Math.sin(i) * 0.4;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: transitX - 0.08,
        y: transitY - 0.04,
        w: 0.16,
        h: 0.08,
        fill: { color: '#3A3A45', transparency: 92 },
        line: { color: '#5A5A65', width: 1 }
      });
      elements.push({ type: 'ellipse', name: `background_transit_${i}` });
    }

    // V17.5: Substrate glow - foundational glow beneath city
    slide.addShape(this.pres.ShapeType.rect, {
      x: bounds.x,
      y: bounds.y + bounds.h * 0.7,
      w: bounds.w,
      h: bounds.h * 0.3,
      fill: { color: '#404040', transparency: 95 },
      line: { color: 'transparent', width: 0 }
    });
    elements.push({ type: 'rect', name: 'substrate_glow' });

    // V17.5: Constitutional horizon - silhouette at top
    const horizonY = bounds.y + 0.4;
    const horizonPoints = [
      { x: bounds.x, y: horizonY },
      { x: bounds.x + bounds.w * 0.12, y: horizonY - 0.25 },
      { x: bounds.x + bounds.w * 0.25, y: horizonY },
      { x: bounds.x + bounds.w * 0.38, y: horizonY - 0.2 },
      { x: bounds.x + bounds.w * 0.5, y: horizonY },
      { x: bounds.x + bounds.w * 0.62, y: horizonY - 0.3 },
      { x: bounds.x + bounds.w * 0.75, y: horizonY },
      { x: bounds.x + bounds.w * 0.88, y: horizonY - 0.15 },
      { x: bounds.x + bounds.w, y: horizonY - 0.1 }
    ];

    for (let i = 0; i < horizonPoints.length - 1; i++) {
      const start = horizonPoints[i];
      const end = horizonPoints[i + 1];
      slide.addShape(this.pres.ShapeType.line, {
        x: start.x,
        y: start.y,
        w: end.x - start.x,
        h: end.y - start.y,
        line: { color: '#4A4A55', width: 2 }
      });
      elements.push({ type: 'line', name: `constitutional_horizon_${i}` });
    }

    // V17.5: Floating infrastructure - subtle floating elements
    const floatCount = 8;
    for (let i = 0; i < floatCount; i++) {
      const floatX = bounds.x + bounds.w * 0.08 + i * bounds.w * 0.12;
      const floatY = bounds.y + bounds.h * 0.55 + Math.sin(i * 0.8) * 0.4;
      slide.addShape(this.pres.ShapeType.ellipse, {
        x: floatX - 0.06,
        y: floatY - 0.06,
        w: 0.12,
        h: 0.12,
        fill: { color: '#3A3A45', transparency: 90 },
        line: { color: '#5A5A65', width: 1.5 }
      });
      elements.push({ type: 'ellipse', name: `floating_infrastructure_${i}` });
    }

    // V17.5: Terrain contours - subtle depth markers
    const contourCount = 6;
    for (let i = 0; i < contourCount; i++) {
      const contourY = bounds.y + bounds.h * 0.65 + i * 0.12;
      slide.addShape(this.pres.ShapeType.line, {
        x: bounds.x,
        y: contourY,
        w: bounds.w,
        h: 0,
        line: { color: '#2A2A35', width: 1, dashType: 'dash' }
      });
      elements.push({ type: 'line', name: `terrain_contour_${i}` });
    }

    return elements;
  }
}

module.exports = { V17Renderer };
