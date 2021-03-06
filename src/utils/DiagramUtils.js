import { getShapesCount } from '../redux/utils';
import { THEME } from '../constants/theme';
import { TYPES } from '../constants/common';
import { ALIGN, DIRECTION, SIZE } from '../constants/editor';

import MathUtils from './MathUtils';

const { bg } = THEME;

class DiagramUtils {

  constructor() {
    this.generateShapeID          = this.generateShapeID.bind(this);
    this.createBox                = this.createBox.bind(this);
    this.createCircle             = this.createCircle.bind(this);
    this.createCurve              = this.createCurve.bind(this);
    this.createShapeContent       = this.createShapeContent.bind(this);

    this.calculateBorderRadius    = this.calculateBorderRadius.bind(this);
    this.calculateBezier          = this.calculateBezier.bind(this);

    this.determineBoxTextPosition = this.determineBoxTextPosition.bind(this);

    this.radiuses = {};
  }

  generateShapeID(prefix = 'shape') {
    const shapesCount = getShapesCount();
    return `${prefix}-${shapesCount}`;
  }

  // Creating shapes -------------------------------------------------------------------------------
  createBox(x, y) {
    return {
      id       : this.generateShapeID(),
      type     : TYPES.box,
      x        : x || 10,
      y        : y || 10,
      width    : 120,
      height   : 30,
      bg       : bg.grey,
      align    : ALIGN.center,
      noBorder : false,
      textBold : false,
      textSize : SIZE.md,
    };
  }

  createCircle(x, y) {
    return {
      id     : this.generateShapeID(),
      type   : TYPES.circle,
      x      : x || 10,
      y      : y || 10,
      radius : 10,
    };
  }

  createCurve(start, end) {
    const bezier = this.calculateBezier(start, end);

    return {
      id      : this.generateShapeID('curve'),
      type    : TYPES.curve,
      startID : start.id,
      endID   : end.id,
      dashed  : false,
      ...bezier,
    };
  }

  createShapeContent(id, title = '') {
    return {
      id,
      title : title || id,
      url   : '',
      info  : '',
    };
  }

  // Updating existing shapes ----------------------------------------------------------------------
  updateCurve(curve, start, end) {
    const bezier = this.calculateBezier(start, end);

    return {
      ...curve,
      ...bezier,
    };
  }

  // Calculations ----------------------------------------------------------------------------------
  calculateBorderRadius(width, height) {
    const roundedWidth  = MathUtils.roundCoord(width);
    const roundedHeight = MathUtils.roundCoord(height);
    const sidesKey = `${roundedWidth}:${roundedHeight}`;
    if (this[sidesKey]) {
      return this[sidesKey];
    }

    const min          = Math.min(roundedWidth, roundedHeight);
    const radius       = (min / 10) * 1.5;
    this.radiuses[min] = radius;
    this[sidesKey]     = radius;

    return radius;
  }

  calculateBezier(start, end) {

    const distanceX = Math.abs(end.x - start.x);
    const distanceY = Math.abs(end.y - start.y);
    const middleX   = Math.min(start.x, end.x) + (distanceX) / 2;
    const middleY   = Math.min(start.y, end.y) + (distanceY) / 2;

    const isStartVertical = (start.edgeDirection === DIRECTION.horizontal);
    const isEndVertical   = (end.edgeDirection === DIRECTION.horizontal);

    const cpx1 = isStartVertical ? start.x : middleX;
    const cpy1 = isStartVertical ? middleY : start.y;

    const cpx2 = isEndVertical ? end.x   : middleX;
    const cpy2 = isEndVertical ? middleY : end.y;

    return {
      x1   : start.x,
      y1   : start.y,
      x2   : end.x,
      y2   : end.y,
      cpx1 : cpx1,
      cpy1 : cpy1,
      cpx2 : cpx2,
      cpy2 : cpy2,
    };
  }

  // Determining -----------------------------------------------------------------------------------
  determineBoxTextPosition(shape, radius = 0) {
    const { x, y, width, height, align } = shape;

    const centerY = y + height / 2;
    const centerX = x + width / 2;
    const leftX   = x + radius;
    const rightX  = x + width - radius;

    let resultX = centerX;
    let textAnchor = 'middle';
    if (align === ALIGN.left) {
      resultX = leftX;
      textAnchor = 'start';
    }
    if (align === ALIGN.right) {
      resultX = rightX;
      textAnchor = 'end';
    }

    return {
      x: resultX,
      y: centerY,
      alignmentBaseline: 'middle',
      textAnchor,
    };
  }
}

export default new DiagramUtils();
