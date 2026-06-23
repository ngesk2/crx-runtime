// ── SOFT SHAPE BOUNDARIES SYSTEM ───────────────────────────────────────
// V14: Shape boundaries are soft - external labels, callouts, side annotations allowed
// Professional diagrams routinely place labels outside geometry

const LABEL_POSITIONS = {
  EXTERNAL: 'external',
  CALLOUT: 'callout',
  SIDE_ANNOTATION: 'side_annotation',
  ORBITAL: 'orbital',
  REACTOR: 'reactor',
  SYSTEM_MARKER: 'system_marker'
};

class SoftBoundariesEngine {
  constructor(pres) {
    this.pres = pres;
    this.labelHistory = new Map();
  }

  renderExternalLabel(slide, text, targetBounds, position, theme) {
    const elements = [];
    
    let labelX, labelY, labelW, labelH;
    const labelPadding = 0.1;
    
    switch (position) {
      case 'top':
        labelX = targetBounds.x + targetBounds.w / 2 - 1;
        labelY = targetBounds.y - 0.4;
        labelW = 2;
        labelH = 0.3;
        break;
      case 'bottom':
        labelX = targetBounds.x + targetBounds.w / 2 - 1;
        labelY = targetBounds.y + targetBounds.h + 0.1;
        labelW = 2;
        labelH = 0.3;
        break;
      case 'left':
        labelX = targetBounds.x - 1.2;
        labelY = targetBounds.y + targetBounds.h / 2 - 0.15;
        labelW = 1;
        labelH = 0.3;
        break;
      case 'right':
        labelX = targetBounds.x + targetBounds.w + 0.2;
        labelY = targetBounds.y + targetBounds.h / 2 - 0.15;
        labelW = 1;
        labelH = 0.3;
        break;
      default:
        labelX = targetBounds.x + targetBounds.w / 2 - 1;
        labelY = targetBounds.y - 0.4;
        labelW = 2;
        labelH = 0.3;
    }
    
    // Render label text
    slide.addText(text, {
      x: labelX,
      y: labelY,
      w: labelW,
      h: labelH,
      fontSize: 9,
      color: theme.primary || '#00E5FF',
      bold: true,
      align: 'center'
    });
    elements.push({ type: 'text', name: 'external_label', position, text });
    
    // Render connection line to target
    const lineX = position === 'left' ? labelX + labelW : position === 'right' ? labelX : targetBounds.x + targetBounds.w / 2;
    const lineY = position === 'top' ? labelY + labelH : position === 'bottom' ? labelY : targetBounds.y + targetBounds.h / 2;
    
    slide.addShape(this.pres.ShapeType.line, {
      x: lineX,
      y: lineY,
      w: position === 'left' ? targetBounds.x - lineX : position === 'right' ? targetBounds.x + targetBounds.w - lineX : 0,
      h: position === 'top' ? targetBounds.y - lineY : position === 'bottom' ? targetBounds.y + targetBounds.h - lineY : 0,
      line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'line', name: 'external_label_connector', position });
    
    return elements;
  }

  renderCallout(slide, text, targetBounds, position, theme) {
    const elements = [];
    
    let calloutX, calloutY, calloutW, calloutH;
    
    switch (position) {
      case 'top-right':
        calloutX = targetBounds.x + targetBounds.w + 0.3;
        calloutY = targetBounds.y - 0.5;
        calloutW = 2;
        calloutH = 0.8;
        break;
      case 'bottom-right':
        calloutX = targetBounds.x + targetBounds.w + 0.3;
        calloutY = targetBounds.y + targetBounds.h - 0.3;
        calloutW = 2;
        calloutH = 0.8;
        break;
      case 'top-left':
        calloutX = targetBounds.x - 2.3;
        calloutY = targetBounds.y - 0.5;
        calloutW = 2;
        calloutH = 0.8;
        break;
      case 'bottom-left':
        calloutX = targetBounds.x - 2.3;
        calloutY = targetBounds.y + targetBounds.h - 0.3;
        calloutW = 2;
        calloutH = 0.8;
        break;
      default:
        calloutX = targetBounds.x + targetBounds.w + 0.3;
        calloutY = targetBounds.y - 0.5;
        calloutW = 2;
        calloutH = 0.8;
    }
    
    // Render callout background (architectural frame, not transparent box)
    slide.addShape(this.pres.ShapeType.rect, {
      x: calloutX,
      y: calloutY,
      w: calloutW,
      h: calloutH,
      fill: { color: '#1A1A1F', transparency: 30 },
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'rect', name: 'callout_frame', position });
    
    // Render callout text
    slide.addText(text, {
      x: calloutX + 0.1,
      y: calloutY + 0.1,
      w: calloutW - 0.2,
      h: calloutH - 0.2,
      fontSize: 8,
      color: '#CCCCCC',
      align: 'left'
    });
    elements.push({ type: 'text', name: 'callout_text', position, text });
    
    // Render callout pointer
    const pointerX = position.includes('right') ? calloutX : calloutX + calloutW;
    const pointerY = position.includes('top') ? calloutY + calloutH : calloutY;
    
    slide.addShape(this.pres.ShapeType.line, {
      x: pointerX,
      y: pointerY,
      w: position.includes('right') ? targetBounds.x + targetBounds.w - pointerX : targetBounds.x - pointerX,
      h: position.includes('top') ? targetBounds.y - pointerY : targetBounds.y + targetBounds.h - pointerY,
      line: { color: theme.primary || '#00E5FF', width: 1 }
    });
    elements.push({ type: 'line', name: 'callout_pointer', position });
    
    return elements;
  }

  renderSideAnnotation(slide, text, targetBounds, side, theme) {
    const elements = [];
    
    let annotationX, annotationY, annotationW, annotationH;
    
    switch (side) {
      case 'left':
        annotationX = targetBounds.x - 2.5;
        annotationY = targetBounds.y;
        annotationW = 2;
        annotationH = targetBounds.h;
        break;
      case 'right':
        annotationX = targetBounds.x + targetBounds.w + 0.5;
        annotationY = targetBounds.y;
        annotationW = 2;
        annotationH = targetBounds.h;
        break;
      default:
        annotationX = targetBounds.x - 2.5;
        annotationY = targetBounds.y;
        annotationW = 2;
        annotationH = targetBounds.h;
    }
    
    // Render annotation line
    slide.addShape(this.pres.ShapeType.line, {
      x: side === 'left' ? annotationX + annotationW : annotationX,
      y: annotationY + annotationH / 2,
      w: side === 'left' ? targetBounds.x - (annotationX + annotationW) : targetBounds.x + targetBounds.w - annotationX,
      h: 0,
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'line', name: 'side_annotation_line', side });
    
    // Render annotation text (vertical if needed)
    const lines = text.split('\n');
    const lineHeight = 0.15;
    lines.forEach((line, index) => {
      slide.addText(line, {
        x: annotationX,
        y: annotationY + index * lineHeight,
        w: annotationW,
        h: lineHeight,
        fontSize: 7,
        color: '#CCCCCC',
        align: side === 'left' ? 'right' : 'left'
      });
      elements.push({ type: 'text', name: `side_annotation_line_${index}`, side, text: line });
    });
    
    return elements;
  }

  renderOrbitalLabel(slide, text, centerBounds, radius, angle, theme) {
    const elements = [];
    
    const centerX = centerBounds.x + centerBounds.w / 2;
    const centerY = centerBounds.y + centerBounds.h / 2;
    
    const labelX = centerX + Math.cos(angle) * radius - 0.5;
    const labelY = centerY + Math.sin(angle) * radius - 0.1;
    
    // Render orbital path
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - radius,
      y: centerY - radius,
      w: radius * 2,
      h: radius * 2,
      fill: { color: theme.primary || '#00E5FF', transparency: 95 },
      line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'ellipse', name: 'orbital_path', radius });
    
    // Render label
    slide.addText(text, {
      x: labelX,
      y: labelY,
      w: 1,
      h: 0.2,
      fontSize: 8,
      color: theme.primary || '#00E5FF',
      align: 'center'
    });
    elements.push({ type: 'text', name: 'orbital_label', text, angle });
    
    // Render connection to center
    slide.addShape(this.pres.ShapeType.line, {
      x: labelX + 0.5,
      y: labelY + 0.1,
      w: centerX - (labelX + 0.5),
      h: centerY - (labelY + 0.1),
      line: { color: theme.primary || '#00E5FF', width: 1, dashType: 'dash' }
    });
    elements.push({ type: 'line', name: 'orbital_connector', angle });
    
    return elements;
  }

  renderReactorLabel(slide, text, reactorBounds, ringIndex, theme) {
    const elements = [];
    
    const centerX = reactorBounds.x + reactorBounds.w / 2;
    const centerY = reactorBounds.y + reactorBounds.h / 2;
    const ringRadius = 0.5 + ringIndex * 0.3;
    
    // Render reactor ring
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: centerX - ringRadius,
      y: centerY - ringRadius,
      w: ringRadius * 2,
      h: ringRadius * 2,
      fill: { color: theme.primary || '#FFC400', transparency: 90 - ringIndex * 10 },
      line: { color: theme.primary || '#FFC400', width: 2 }
    });
    elements.push({ type: 'ellipse', name: `reactor_ring_${ringIndex}`, radius: ringRadius });
    
    // Render label on ring
    const labelAngle = (ringIndex * 45) * (Math.PI / 180);
    const labelX = centerX + Math.cos(labelAngle) * ringRadius - 0.4;
    const labelY = centerY + Math.sin(labelAngle) * ringRadius - 0.1;
    
    slide.addText(text, {
      x: labelX,
      y: labelY,
      w: 0.8,
      h: 0.2,
      fontSize: 7,
      color: theme.primary || '#FFC400',
      align: 'center'
    });
    elements.push({ type: 'text', name: `reactor_label_${ringIndex}`, text });
    
    return elements;
  }

  renderSystemMarker(slide, text, position, theme) {
    const elements = [];
    
    // Render marker point
    slide.addShape(this.pres.ShapeType.ellipse, {
      x: position.x - 0.05,
      y: position.y - 0.05,
      w: 0.1,
      h: 0.1,
      fill: { color: theme.primary || '#00E5FF', transparency: 70 },
      line: { color: theme.primary || '#00E5FF', width: 2 }
    });
    elements.push({ type: 'ellipse', name: 'system_marker_point' });
    
    // Render marker label
    slide.addText(text, {
      x: position.x + 0.1,
      y: position.y - 0.05,
      w: 1,
      h: 0.15,
      fontSize: 7,
      color: theme.primary || '#00E5FF'
    });
    elements.push({ type: 'text', name: 'system_marker_label', text });
    
    return elements;
  }

  optimizeLabelPlacement(slide, objects) {
    // Analyze existing objects and suggest optimal label positions
    const suggestions = [];
    
    objects.forEach(obj => {
      if (obj.semanticType && !obj.labelPosition) {
        const bounds = { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
        
        // Check available space around object
        const spaceTop = bounds.y;
        const spaceBottom = 7.5 - (bounds.y + bounds.h);
        const spaceLeft = bounds.x;
        const spaceRight = 10 - (bounds.x + bounds.w);
        
        // Suggest position with most space
        const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
        
        if (maxSpace === spaceTop && spaceTop > 0.5) {
          suggestions.push({ object: obj, suggestedPosition: 'top' });
        } else if (maxSpace === spaceBottom && spaceBottom > 0.5) {
          suggestions.push({ object: obj, suggestedPosition: 'bottom' });
        } else if (maxSpace === spaceLeft && spaceLeft > 0.5) {
          suggestions.push({ object: obj, suggestedPosition: 'left' });
        } else if (maxSpace === spaceRight && spaceRight > 0.5) {
          suggestions.push({ object: obj, suggestedPosition: 'right' });
        }
      }
    });
    
    return suggestions;
  }
}

module.exports = {
  SoftBoundariesEngine,
  LABEL_POSITIONS
};
