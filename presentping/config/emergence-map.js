// ── EMERGENCE MAP COMPONENT ───────────────────────────────────────────
// Single grouped object showing system emergence stages

const EMERGENCE_STAGES = [
  { id: 'gateway', label: 'Gateway', active: true },
  { id: 'authority', label: 'Authority', active: false },
  { id: 'execution', label: 'Execution', active: false },
  { id: 'agents', label: 'Agents', active: false },
  { id: 'os', label: 'OS', active: false }
];

function createEmergenceMap(currentStage) {
  const components = [];
  const mapX = 8.5;
  const mapY = 0.2;
  const mapW = 1.3;
  const mapH = 1.2;
  
  // Background panel
  components.push({
    type: 'rect',
    x: mapX, y: mapY, w: mapW, h: mapH,
    fill: '#111111',
    line: { color: '#333333', width: 1 },
    name: 'emergence_map_background'
  });
  
  // Title
  components.push({
    type: 'text',
    x: mapX + 0.1, y: mapY + 0.05, w: mapW - 0.2, h: 0.15,
    text: 'SYSTEM EMERGENCE',
    fontSize: 7,
    color: '#FFFFFF',
    align: 'center',
    name: 'emergence_map_title'
  });
  
  // Stage indicators
  const stageY = mapY + 0.25;
  const stageSpacing = 0.18;
  
  EMERGENCE_STAGES.forEach((stage, index) => {
    const y = stageY + (index * stageSpacing);
    const isActive = index < currentStage;
    const isCurrent = index === currentStage - 1;
    
    // Stage dot
    components.push({
      type: 'ellipse',
      x: mapX + 0.2, y: y, w: 0.08, h: 0.08,
      fill: isActive ? '#FFC400' : '#333333',
      line: { color: isActive ? '#FFC400' : '#333333', width: 1 },
      shadow: isActive ? { type: 'outer', blur: 5, color: 'FFC400' } : null,
      name: `emergence_stage_${stage.id}_dot`
    });
    
    // Stage label
    components.push({
      type: 'text',
      x: mapX + 0.35, y: y - 0.02, w: 0.8, h: 0.12,
      text: stage.label.toUpperCase(),
      fontSize: 6,
      color: isActive ? '#FFC400' : '#666666',
      bold: isCurrent,
      name: `emergence_stage_${stage.id}_label`
    });
    
    // Connector line (except for last stage)
    if (index < EMERGENCE_STAGES.length - 1) {
      components.push({
        type: 'line',
        x: mapX + 0.24, y: y + 0.04, w: 0, h: stageSpacing - 0.08,
        line: { color: isActive ? '#FFFFFF' : '#333333', width: 1, endArrow: false },
        name: `emergence_connector_${stage.id}_to_next`
      });
    }
  });
  
  return components;
}

function renderEmergenceMapGrouped(slide, pres, currentStage) {
  const components = createEmergenceMap(currentStage);
  
  // Render all components - they will be grouped by naming convention
  components.forEach(comp => {
    if (comp.type === 'rect') {
      slide.addShape(pres.ShapeType.rect, {
        x: comp.x, y: comp.y, w: comp.w, h: comp.h,
        fill: comp.fill,
        line: comp.line,
        shadow: comp.shadow,
        name: comp.name
      });
    } else if (comp.type === 'text') {
      slide.addText(comp.text, {
        x: comp.x, y: comp.y, w: comp.w, h: comp.h,
        fontSize: comp.fontSize,
        color: comp.color,
        bold: comp.bold,
        align: comp.align,
        name: comp.name
      });
    } else if (comp.type === 'ellipse') {
      slide.addShape(pres.ShapeType.ellipse, {
        x: comp.x, y: comp.y, w: comp.w, h: comp.h,
        fill: comp.fill,
        line: comp.line,
        shadow: comp.shadow,
        name: comp.name
      });
    } else if (comp.type === 'line') {
      slide.addShape(pres.ShapeType.line, {
        x: comp.x, y: comp.y, w: comp.w, h: comp.h,
        line: comp.line,
        name: comp.name
      });
    }
  });
}

module.exports = {
  EMERGENCE_STAGES,
  createEmergenceMap,
  renderEmergenceMapGrouped
};
