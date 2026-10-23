import type { Scene } from '../types';
import { csPart1 } from './cs/part1';
import { csPart2 } from './cs/part2';
import { csPart3 } from './cs/part3';

/** Computer science animated lessons (ids cs-*). Group = the id of the topic in src/db/cs/topics.ts. */
export const csScenes: Scene[] = [...csPart1, ...csPart2, ...csPart3];
