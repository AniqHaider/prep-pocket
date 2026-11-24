import type { Scene } from '../types';
import { auFoundations } from './auth/foundations';
import { auWeb } from './auth/web';
import { auOauth } from './auth/oauth';
import { auAccess } from './auth/access';

/** Auth and tokens: passwords, sessions, JWT, where tokens live in a browser, OAuth and OpenID Connect, MFA, and compliance. Ids `au-*`; `group` = a topic id in src/db/auth.ts. */
export const authScenes: Scene[] = [...auFoundations, ...auWeb, ...auOauth, ...auAccess];
