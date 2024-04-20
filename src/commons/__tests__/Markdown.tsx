import { Chapter, Variant } from 'js-slang/dist/types';

import { getLanguageConfig } from '../application/ApplicationTypes';
import Markdown from '../Markdown';
import { generateLanguageIntroduction } from '../utils/IntroductionHelper';
import { renderTreeJson } from '../utils/TestUtils';

const mockProps = (sourceChapter: Chapter, sourceVariant: Variant) => {
  return {
    content: generateLanguageIntroduction(getLanguageConfig(sourceChapter, sourceVariant)),
    openLinksInNewWindow: true
  };
};
