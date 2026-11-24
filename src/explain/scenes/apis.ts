import type { Scene } from '../types';
import { apCalls } from './apis/calls';
import { apPractices } from './apis/practices';
import { apDesign } from './apis/design';

/** APIs in practice: a real online store's API traffic, observed. Ids `ap-*`; `group` = a topic id in src/db/apis.ts. Names, hosts and ids are changed. */
export const apisScenes: Scene[] = [...apCalls, ...apPractices, ...apDesign];
