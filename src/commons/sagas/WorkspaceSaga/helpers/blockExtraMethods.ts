import { Context } from 'js-slang';
import { call } from 'redux-saga/effects';

import { EVAL_SILENT, WorkspaceLocation } from '../../../workspace/WorkspaceTypes';
import { evalCode } from './evalCode';

export function* blockExtraMethods(
  elevatedContext: Context,
  context: Context,
  execTime: number,
  workspaceLocation: WorkspaceLocation,
  unblockKey?: string
) {
  // Extract additional methods available in the elevated context relative to the context
  if (unblockKey) {
    yield call(evalCode, '', execTime, workspaceLocation, EVAL_SILENT);
  }

  yield call(evalCode, '', execTime, workspaceLocation, EVAL_SILENT);
}
