import type { Scene } from '../types';
import { paFoundations } from './pyai/foundations';
import { paDeep } from './pyai/deeplearning';
import { paLlm } from './pyai/llmeng';

/** Python for AI engineering: the libraries and skills behind AI work. Ids `pa-*`; `group` = a topic id in src/db/pyai.ts. */
export const pyaiScenes: Scene[] = [...paFoundations, ...paDeep, ...paLlm];
