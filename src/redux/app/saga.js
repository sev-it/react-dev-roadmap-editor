import { all, takeEvery, put, select, call } from 'redux-saga/effects';

import MathUtils from '../../utils/MathUtils';
import DiagramUtils from '../../utils/DiagramUtils';
import { gridStep } from '../../config';
import { TYPES } from '../../constants/common';
import { SIZE_CONTROLS } from '../../constants/layout';

import diagramActions from '../diagram/actions';
import appActions from './actions';

import { selectShape, selectCurves } from '../diagram/selectors';
import { selectResizeData, selectCreateData } from './selectors';

import { rebuildTouchedCurves } from '../generators';

const minCellWH = gridStep * 2;

function selectState(state) {
  const { App, Diagram } = state;
  const { activeShapeID } = App;

  return {
    activeShapeID,
    activeShape : selectShape(activeShapeID)(state),
    resizeData  : selectResizeData(state),
    createData  : selectCreateData(state),
    shapes      : Diagram.shapes,
    curves      : selectCurves(state),
  };
}

function* resizeComplete() {

  const { activeShapeID, activeShape, resizeData } = yield select(selectState);
  const { x, y, width, height } = activeShape;
  const { controlID } = resizeData;

  const isTop    = (controlID === SIZE_CONTROLS.top);
  const isBottom = (controlID === SIZE_CONTROLS.bottom);
  const isLeft   = (controlID === SIZE_CONTROLS.left);
  const isRight  = (controlID === SIZE_CONTROLS.right);

  const resShape = {
    x      : isLeft ? MathUtils.roundCoord(x) : x,
    y      : isTop  ? MathUtils.roundCoord(y) : y,
    width  : (isLeft || isRight) ? MathUtils.roundCoord(width, minCellWH) : width,
    height : (isTop || isBottom) ? MathUtils.roundCoord(height, minCellWH) : height,
  };

  yield put(diagramActions.shapeUpdate(activeShapeID, resShape));
  yield put(appActions.resizeDataReset());
  yield call(rebuildTouchedCurves, activeShapeID);
}

function* createComplete({ payload }) {

  const { createData } = yield select(selectState);
  const { shapeType } = createData;
  const { position } = payload;
  const { x, y } = position;

  const resX = MathUtils.roundCoord(x);
  const resY = MathUtils.roundCoord(y);

  // Box
  if (shapeType === TYPES.box) {
    const shape = DiagramUtils.createBox(resX, resY);
    const shapeContent = DiagramUtils.createShapeContent(shape.id);

    yield put(diagramActions.shapeContentSet(shape.id, shapeContent));
    yield put(diagramActions.shapeSet(shape.id, shape));
    yield put(appActions.activeShapeIDSet(shape.id));
  }

  // Circle
  if (shapeType === TYPES.circle) {
    const shape = DiagramUtils.createCircle(resX, resY);

    yield put(diagramActions.shapeSet(shape.id, shape));
    yield put(appActions.activeShapeIDSet(shape.id));
  }

  yield put(appActions.createDataReset());
}

function* createCurveComplete({ payload }) {

  const { shapes } = yield select(selectState);
  const { startShapeID, endShapeID } = payload;

  const startShape = shapes[startShapeID];
  const endShape   = shapes[endShapeID];

  const { start, end } = MathUtils.calculateCurve(startShape, endShape);

  const curve = DiagramUtils.createCurve(start, end);

  yield put(diagramActions.shapeSet(curve.id, curve));
  yield put(appActions.activeShapeIDSet(endShapeID));
  yield put(appActions.createDataReset());
}

function* dndComplete({ payload }) {

  const { activeShapeID } = yield select(selectState);
  const { position } = payload;
  const { x, y } = position;

  const resPosition = {
    x : MathUtils.roundCoord(x),
    y : MathUtils.roundCoord(y),
  };

  yield put(diagramActions.shapeUpdate(activeShapeID, resPosition));
  yield call(rebuildTouchedCurves, activeShapeID);
}

export default function* appSaga() {
  yield all([
    takeEvery(appActions.RESIZE_COMPLETE, resizeComplete),
    takeEvery(appActions.CREATE_COMPLETE, createComplete),
    takeEvery(appActions.CREATE_CURVE_COMPLETE, createCurveComplete),
    takeEvery(appActions.DND_COMPLETE, dndComplete),
  ]);
}
