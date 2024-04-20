import { createReducer } from '@reduxjs/toolkit';
import { stringify } from 'js-slang/dist/utils/stringify';
import { Reducer } from 'redux';
import { LOG_OUT } from 'src/commons/application/types/CommonsTypes';
import { DebuggerContext } from 'src/commons/workspace/WorkspaceTypes';

import {
  createDefaultStoriesEnv,
  defaultStories,
  ErrorOutput,
  InterpreterOutput,
  ResultOutput
} from '../../commons/application/ApplicationTypes';
import { SourceActionType } from '../../commons/utils/ActionsHelper';
import { addStoryEnv, clearStoryEnv, evalStory } from './StoriesActions';
import { DEFAULT_ENV } from './storiesComponents/UserBlogContent';
import {
  CLEAR_STORIES_USER_AND_GROUP,
  EVAL_STORY_ERROR,
  EVAL_STORY_SUCCESS,
  HANDLE_STORIES_CONSOLE_LOG,
  NOTIFY_STORIES_EVALUATED,
  SET_CURRENT_STORIES_GROUP,
  SET_CURRENT_STORIES_USER,
  SET_CURRENT_STORY,
  SET_CURRENT_STORY_ID,
  StoriesState,
  TOGGLE_STORIES_USING_SUBST,
  UPDATE_STORIES_LIST
} from './StoriesTypes';

export const StoriesReducer: Reducer<StoriesState, SourceActionType> = (
  state = defaultStories,
  action
) => {
  state = newStoriesReducer(state, action);
  state = oldStoriesReducer(state, action);
  return state;
};

const getStoriesEnv = (action: any) => action.payload?.env ?? DEFAULT_ENV;

const newStoriesReducer = createReducer(defaultStories, builder => {
  builder
    .addCase(addStoryEnv, (state, action) => {
      const env = getStoriesEnv(action);
      state.envs[env] = createDefaultStoriesEnv(
        action.payload.env,
        action.payload.chapter,
        action.payload.variant
      );
    })
    .addCase(clearStoryEnv, (state, action) => {
      if (!action.payload.env) {
        state.envs = {};
      } else {
        const { chapter, variant } = state.envs[action.payload.env].context;
        state.envs[action.payload.env] = createDefaultStoriesEnv(
          action.payload.env,
          chapter,
          variant
        );
      }
    })
    .addCase(evalStory, (state, action) => {
      const env = getStoriesEnv(action);
      state.envs[env].isRunning = true;
    });
});

const oldStoriesReducer: Reducer<StoriesState, SourceActionType> = (
  state = defaultStories,
  action
) => {
  const env: string = getStoriesEnv(action);
  let newOutput: InterpreterOutput[];
  let lastOutput: InterpreterOutput;
  switch (action.type) {
    case HANDLE_STORIES_CONSOLE_LOG:
      /* Possible cases:
       * (1) state.envs[env].output === [], i.e. state.envs[env].output[-1] === undefined
       * (2) state.envs[env].output[-1] is not RunningOutput
       * (3) state.envs[env].output[-1] is RunningOutput */
      lastOutput = state.envs[env].output.slice(-1)[0];
      if (lastOutput === undefined || lastOutput.type !== 'running') {
        // New block of output.
        newOutput = state.envs[env].output.concat({
          type: 'running',
          consoleLogs: [...action.payload.logString]
        });
      } else {
        const updatedLastOutput = {
          type: lastOutput.type,
          consoleLogs: lastOutput.consoleLogs.concat(action.payload.logString)
        };
        newOutput = state.envs[env].output.slice(0, -1);
        newOutput.push(updatedLastOutput);
      }
      return {
        ...state,
        envs: {
          ...state.envs,
          [env]: {
            ...state.envs[env],
            output: newOutput
          }
        }
      };
    case TOGGLE_STORIES_USING_SUBST:
      return {
        ...state,
        envs: {
          ...state.envs,
          [env]: {
            ...state.envs[env],
            usingSubst: action.payload.usingSubst
          }
        }
      };
    // New cases post-refactor
    case UPDATE_STORIES_LIST:
      return {
        ...state,
        storyList: action.payload
      };
    case SET_CURRENT_STORY_ID:
      return {
        ...state,
        currentStoryId: action.payload
      };
    case SET_CURRENT_STORY:
      return {
        ...state,
        currentStory: action.payload
      };
    case CLEAR_STORIES_USER_AND_GROUP:
      return {
        ...state,
        userId: undefined,
        userName: undefined,
        groupId: undefined,
        groupName: undefined,
        role: undefined
      };
    case SET_CURRENT_STORIES_USER:
      return {
        ...state,
        userName: action.payload.name,
        userId: action.payload.id
      };
    case SET_CURRENT_STORIES_GROUP:
      return {
        ...state,
        groupId: action.payload.id,
        groupName: action.payload.name,
        role: action.payload.role
      };
    case LOG_OUT:
      return defaultStories;
    default:
      return state;
  }
};
