import type { Scene } from '../types';
import { apCalls } from './apis/calls';
import { apPractices } from './apis/practices';
import { apDesign } from './apis/design';

/** APIs in practice: a real API (Cardify Lite) started locally, called and read. Ids `ap-*`; `group` = a topic id in src/db/apis.ts. */
export const apisScenes: Scene[] = [...apCalls, ...apPractices, ...apDesign];
