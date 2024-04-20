import { run } from 'go-slang';
import { SagaIterator } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { notifyProgramEvaluated } from 'src/commons/workspace/WorkspaceActions';

import { EventType } from '../../../../features/achievement/AchievementTypes';
import { actions } from '../../../utils/ActionsHelper';
import { WorkspaceLocation } from '../../../workspace/WorkspaceTypes';

export function* evalCode(
  code: string,
  execTime: number,
  workspaceLocation: WorkspaceLocation,
  actionType: string
): SagaIterator {
  try {
    const result = yield call(run, code);
    result.type = 'result';
    yield put(notifyProgramEvaluated(result, code, workspaceLocation));
    yield put(actions.evalInterpreterSuccess(result.value, workspaceLocation));
  } catch (err) {
    yield put(actions.addEvent([EventType.ERROR]));
    yield put(actions.evalInterpreterError(err, workspaceLocation));
  }
}
