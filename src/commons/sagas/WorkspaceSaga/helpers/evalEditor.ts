import { FSModule } from 'browserfs/dist/node/core/FS';
import { call, put, select, StrictEffect } from 'redux-saga/effects';

import { EventType } from '../../../../features/achievement/AchievementTypes';
import { DeviceSession } from '../../../../features/remoteExecution/RemoteExecutionTypes';
import { WORKSPACE_BASE_PATHS } from '../../../../pages/fileSystem/createInBrowserFileSystem';
import { OverallState } from '../../../application/ApplicationTypes';
import { retrieveFilesInWorkspaceAsRecord } from '../../../fileSystem/utils';
import { actions } from '../../../utils/ActionsHelper';
import { EditorTabState, EVAL_EDITOR, WorkspaceLocation } from '../../../workspace/WorkspaceTypes';
import { clearContext } from './clearContext';
import { evalCode } from './evalCode';
import { insertDebuggerStatements } from './insertDebuggerStatements';

export function* evalEditor(
  workspaceLocation: WorkspaceLocation
): Generator<StrictEffect, void, any> {
  const [
    activeEditorTabIndex,
    editorTabs,
    execTime,
    isFolderModeEnabled,
    fileSystem,
    remoteExecutionSession
  ]: [number | null, EditorTabState[], number, boolean, FSModule, DeviceSession | undefined] =
    yield select((state: OverallState) => [
      state.workspaces[workspaceLocation].activeEditorTabIndex,
      state.workspaces[workspaceLocation].editorTabs,
      state.workspaces[workspaceLocation].execTime,
      state.workspaces[workspaceLocation].isFolderModeEnabled,
      state.fileSystem.inBrowserFileSystem,
      state.session.remoteExecutionSession
    ]);

  if (activeEditorTabIndex === null) {
    throw new Error('Cannot evaluate program without an entrypoint file.');
  }

  const defaultFilePath = `${WORKSPACE_BASE_PATHS[workspaceLocation]}/program.js`;
  let files: Record<string, string>;
  if (isFolderModeEnabled) {
    files = yield call(retrieveFilesInWorkspaceAsRecord, workspaceLocation, fileSystem);
  } else {
    files = {
      [defaultFilePath]: editorTabs[activeEditorTabIndex].value
    };
  }
  const entrypointFilePath = editorTabs[activeEditorTabIndex].filePath ?? defaultFilePath;

  yield put(actions.addEvent([EventType.RUN_CODE]));

  if (remoteExecutionSession && remoteExecutionSession.workspace === workspaceLocation) {
    yield put(actions.remoteExecRun(files, entrypointFilePath));
  } else {
    // End any code that is running right now.
    yield put(actions.beginInterruptExecution(workspaceLocation));
    const entrypointCode = files[entrypointFilePath];
    yield* clearContext(workspaceLocation, entrypointCode);
    yield put(actions.clearReplOutput(workspaceLocation));
    const context = yield select(
      (state: OverallState) => state.workspaces[workspaceLocation].context
    );

    // Insert debugger statements at the lines of the program with a breakpoint.
    for (const editorTab of editorTabs) {
      const filePath = editorTab.filePath ?? defaultFilePath;
      const code = editorTab.value;
      const breakpoints = editorTab.breakpoints;
      files[filePath] = yield* insertDebuggerStatements(
        workspaceLocation,
        code,
        breakpoints,
        context
      );
    }

    yield call(
      evalCode,
      editorTabs[activeEditorTabIndex].value,
      execTime,
      workspaceLocation,
      EVAL_EDITOR
    );
  }
}
