import type { Scene } from '../types';
import { btOrigin } from './built/origin';
import { btCraft } from './built/craft';
import { btNative } from './built/native';

/** How Preppy was built: the decisions behind the app. Ids `bt-*`; `group` = a topic id in src/db/built.ts. */
export const builtScenes: Scene[] = [...btOrigin, ...btCraft, ...btNative];
