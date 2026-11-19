import type { Scene } from '../types';
import { gcCore } from './gcp/core';
import { gcCompute } from './gcp/compute';
import { gcOps } from './gcp/ops';

/** Google Cloud: the services an online store meets most. Ids `gc-*`; `group` = a topic id in src/db/gcp.ts. */
export const gcpScenes: Scene[] = [...gcCore, ...gcCompute, ...gcOps];
