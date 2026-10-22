import type { Scene, Topic } from './types';
import { backendScenes } from './scenes/backend';
import { postgresScenes } from './scenes/postgres';
import { mysqlScenes } from './scenes/mysql';
import { mongodbScenes } from './scenes/mongodb';

export const allScenes: Scene[] = [...backendScenes, ...postgresScenes, ...mysqlScenes, ...mongodbScenes];
const byId = new Map(allScenes.map((s) => [s.id, s]));

export const sceneById = (id: string) => byId.get(id);
export const scenesFor = (topic: Topic, group?: string) => allScenes.filter((s) => s.topic === topic && (!group || s.group === group));
export const sceneIdsFor = (topic: Topic, group?: string) => scenesFor(topic, group).map((s) => s.id);

/** Rough watch time: reading speed of a caption, as the player paces it. */
export const captionMs = (say: string) => Math.max(2800, say.length * 62);
export const sceneSeconds = (s: Scene) => Math.round(s.steps.reduce((t, st) => t + captionMs(st.say), 0) / 1000);

export const TOPIC_LABEL: Record<Topic, string> = { backend: 'Backend lab', postgres: 'PostgreSQL', mysql: 'MySQL', mongodb: 'MongoDB' };
