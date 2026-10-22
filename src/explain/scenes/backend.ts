import type { Scene } from '../types';
import { backendPart1 } from './backend/part1';
import { backendPart2 } from './backend/part2';

export const backendScenes: Scene[] = [...backendPart1, ...backendPart2];
