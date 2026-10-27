import type { Topic } from './types';
import { postgres } from '../db/postgres';
import { mysql } from '../db/mysql';
import { mongodb } from '../db/mongodb';
import { cs } from '../db/cs';
import { ai } from '../db/ai';
import { aws } from '../db/aws';
import { javascript } from '../db/javascript';
import { typescript } from '../db/typescript';
import { react } from '../db/react';
import { nextjs } from '../db/nextjs';
import { interview } from '../db/interview';
import { pyai } from '../db/pyai';

const BACKEND: Record<string, string> = {
	ch1: 'Python fundamentals', ch2: 'Python intermediate and async', ch3: 'SQL fundamentals', ch4: 'Data modelling and indexes',
	ch5: 'Building an API', ch6: 'API structure and errors', ch7: 'Authentication', ch8: 'Concurrency', ch9: 'Caching',
	ch10: 'Resilience and background jobs', ch11: 'Testing and Docker', ch12: 'System design'
};
const DB = { postgres, mysql, mongodb, cs, ai, aws, javascript, typescript, react, nextjs, interview, pyai };

/** Heading for a group of scenes: a Backend lab chapter name or a database topic title. */
export function groupTitle(topic: Topic, group: string): string {
	if (topic === 'backend') return BACKEND[group] ? `${group.replace('ch', 'Chapter ')} · ${BACKEND[group]}` : group;
	return DB[topic].topics.find((t) => t.id === group)?.title ?? group.replace(/-/g, ' ');
}
