import type { LearnEngine } from './types';
import type { Question } from '../quiz/types';
import * as foundations from './auth/foundations';
import * as web from './auth/web';
import * as oauth from './auth/oauth';
import * as access from './auth/access';

const areas = [foundations, web, oauth, access];
const topics = areas.flatMap((a) => a.topics);
const questions: Question[] = areas
	.flatMap((a) => a.banks)
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'AU' + String(i + 1).padStart(3, '0') }));

/** Authentication and authorization for web apps: passwords, sessions, JWT, where tokens live in a browser, cookies and CSRF, OAuth 2.0 and OpenID Connect, MFA and passkeys, API keys, and the compliance rules around them. Basic = the core ideas, advanced = production design. */
export const auth: LearnEngine = {
	id: 'auth',
	name: 'Auth and tokens',
	tagline: 'Passwords, sessions, JWT, OAuth, and where a token may live in a browser, with the compliance rules that apply.',
	topics,
	questions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'Passwords, sessions, JWT, cookies and CSRF, OAuth 2.0 and OpenID Connect, MFA and passkeys, API keys, GDPR and PCI DSS'
};
