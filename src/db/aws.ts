import type { LearnEngine, DbTopic } from './types';
import { awsQuestions } from './aws/questions';

const md = (...lines: string[]) => lines.join('\n');

// A generic online store is the running example. No prices or fast-changing quotas are stated as facts; a number that appears is a
// long-standing documented default or limit. `try` snippets are plain, deterministic JavaScript for the playground: no imports, no network,
// and they only model the idea (they do not call AWS or implement real signing). They use String.raw; keep backticks and the dollar-brace sequence out.
const topics: DbTopic[] = [
	{
		id: 'storefront-request-path',
		title: 'The store request path',
		level: 'basic',
		summary: 'Follow one page view through Route 53, CloudFront, S3, a load balancer, containers and a database.',
		scenes: ['aw-request-path'],
		notes: md(
			'An online store on AWS is a short chain of services, each with one job. A request for **shop.example.com** goes:',
			'',
			'- **Route 53**: DNS, turns the name into an address.',
			'- **CloudFront**: a CDN with edge locations near shoppers; caches what it can.',
			'- **S3**: object storage for images, scripts and uploads.',
			'- **Load balancer + ECS**: spreads dynamic requests over your app containers.',
			'- **RDS**: the relational database behind them.',
			'',
			'Around that chain sit **IAM** (who may do what), **ACM** (certificates), **WAF** (filtering), **Secrets Manager** (passwords) and **CloudWatch** (logs and alarms).',
			'',
			'```js',
			'const path = ["Route 53", "CloudFront", "ALB", "ECS task", "RDS"];',
			'console.log(path.join(" -> "));',
			'```',
			'',
			'**Common trap:** the database is the hardest part to scale, so the design goal is to answer as many requests as possible before they reach it: the CDN first, then a cache.'
		),
		try: [
			{
				label: 'Which layer answers?',
				code: String.raw`// Toy model: a request is answered by the first layer that has it.
const edge = new Set(['/logo.png', '/app.4f3a.js']);
const cache = new Set(['product:42']);
function answer(req) {
  if (req.static && edge.has(req.path)) return 'CloudFront (edge cache)';
  if (req.key && cache.has(req.key)) return 'Redis (app cache)';
  return 'database (slowest, most expensive)';
}
console.log(answer({ path: '/logo.png', static: true }));
console.log(answer({ path: '/p/42', key: 'product:42' }));
console.log(answer({ path: '/orders/9', key: 'order:9' }));`
			}
		]
	},
	{
		id: 's3-storage',
		title: 'S3 storage',
		level: 'basic',
		summary: 'Know buckets, keys, prefixes, consistency, versioning and how to keep a bucket private.',
		scenes: ['aw-s3-bucket-key', 'aw-s3-private-by-default'],
		notes: md(
			'**S3** stores **objects** (bytes plus metadata) in **buckets**. A bucket lives in one Region and its name is unique across AWS. An object is found by its **key**; the slashes in `products/42/front.jpg` are just characters, and a **prefix** is the start of a key. There are no true folders.',
			'',
			'S3 gives **strong read-after-write consistency**: after a successful PUT or DELETE, the next read or list shows it. Writing to an existing key **replaces** it; turn on **versioning** to keep earlier versions.',
			'',
			'Buckets are **private by default**, and **Block Public Access** overrides any policy or ACL that would open one. To serve public files, keep the bucket private and put **CloudFront with origin access control** in front.',
			'',
			'```js',
			'const key = "products/42/front.jpg";',
			'console.log(key.startsWith("products/42/")); // a prefix match, not a folder',
			'```',
			'',
			'**Common trap:** S3 is not a file system. Renaming means copy then delete, and there is no atomic update across several keys.'
		),
		try: [
			{
				label: 'Prefix listing and overwrite',
				code: String.raw`const bucket = new Map();
const put = (key, body) => bucket.set(key, body);
put('products/42/front.jpg', 'v1');
put('products/42/back.jpg', 'v1');
put('invoices/2025/A-1042.pdf', 'v1');
const list = (prefix) => [...bucket.keys()].filter((k) => k.startsWith(prefix));
console.log('prefix products/42/:', list('products/42/'));
put('products/42/front.jpg', 'v2'); // same key: replaced
console.log('front.jpg now:', bucket.get('products/42/front.jpg'), '| objects:', bucket.size);`
			}
		]
	},
	{
		id: 's3-presigned-and-cors',
		title: 'Presigned URLs and CORS',
		level: 'mid',
		summary: 'Let browsers upload and download directly with short-lived signed URLs, and understand the CORS rule that gates them.',
		scenes: ['aw-presigned-upload', 'aw-cors-preflight'],
		notes: md(
			'A **presigned URL** lets someone use S3 **without AWS credentials**. Your server signs a URL for one bucket, key and action (GET or PUT) with its own credentials and an **expiry**. Whoever holds the URL gets that one action until it expires, with the **permissions of the signer**.',
			'',
			'The upload flow: browser asks your API, the API checks the user and returns a signed URL, the browser sends the file **straight to S3**. Your servers never carry the bytes.',
			'',
			'The URL also stops working when the signer\'s credentials do: one made from a role session dies when that session expires, however long you asked for.',
			'',
			'**CORS** is a browser rule. A page may call another origin only if that side allows it, so the bucket needs a CORS configuration listing allowed origins, methods and headers.',
			'',
			'```js',
			'const cors = [{ AllowedOrigins: ["https://shop.example.com"], AllowedMethods: ["PUT"], AllowedHeaders: ["content-type"] }];',
			'```',
			'',
			'**Common trap:** a presigned URL is a bearer token. Keep it short-lived, and pin the key on the server so the client cannot choose any path.'
		),
		try: [
			{
				label: 'A toy signed URL (not real AWS signing)',
				code: String.raw`// Illustration only: AWS uses SigV4, not this. The point: the signature covers key and expiry, so edits are rejected.
const SECRET = 'server-only-secret';
const toyHash = (s) => { let h = 5381; for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h.toString(16); };
const sign = (key, expires) => toyHash(SECRET + '|' + key + '|' + expires);
function url(key, expires) { return 'https://bucket/' + key + '?exp=' + expires + '&sig=' + sign(key, expires); }
function check(key, expires, sig, now) {
  if (now > expires) return 'expired';
  return sign(key, expires) === sig ? 'ok' : 'bad signature';
}
const exp = 1000 + 300;
const sig = sign('uploads/u7/front.jpg', exp);
console.log(url('uploads/u7/front.jpg', exp));
console.log('valid now      :', check('uploads/u7/front.jpg', exp, sig, 1100));
console.log('after expiry   :', check('uploads/u7/front.jpg', exp, sig, 1400));
console.log('different key  :', check('uploads/other.jpg', exp, sig, 1100));`
			}
		]
	},
	{
		id: 'cloudfront-caching',
		title: 'CloudFront caching',
		level: 'mid',
		summary: 'Predict hits and misses, set TTLs with Cache-Control, and ship new files without stale copies.',
		scenes: ['aw-cf-hit-miss', 'aw-cf-versioned-assets', 'aw-cf-ttl-headers'],
		notes: md(
			'**CloudFront** serves content from **edge locations**. A request is looked up by its **cache key**: the URL plus the headers, cookies and query strings you choose to include. Found is a **hit**; not found is a **miss** and CloudFront fetches from the **origin** (S3, a load balancer, anything with HTTP).',
			'',
			'How long a copy lives comes from the origin\'s **Cache-Control**: **s-maxage** governs CloudFront and **max-age** governs the browser, and the distribution\'s minimum and maximum TTL clamp the result. With no header the default TTL (24 hours) applies. When a copy expires, CloudFront revalidates with the origin.',
			'',
			'To ship a change, prefer **versioned file names** (`app.4f3a9c.js`) with a one-year immutable TTL, and keep the HTML short-lived. An **invalidation** removes edge copies but not copies in browsers.',
			'',
			'```js',
			'const hashed = "Cache-Control: public, max-age=31536000, immutable";',
			'const html = "Cache-Control: public, s-maxage=60, max-age=0";',
			'```',
			'',
			'**Common trap:** caching a personalised response. If a cache key ignores the cookie that picks the user, one shopper can be served another shopper\'s page.'
		),
		try: [
			{
				label: 'Edge cache with TTL',
				code: String.raw`let now = 0, originCalls = 0;
const origin = (path) => { originCalls++; return 'body of ' + path; };
const edge = new Map(); // key -> { body, expires }
function get(path, ttl) {
  const hit = edge.get(path);
  if (hit && now < hit.expires) return 'HIT  ' + path;
  const body = origin(path);
  edge.set(path, { body, expires: now + ttl });
  return 'MISS ' + path;
}
for (const t of [0, 10, 59, 61, 70]) { now = t; console.log('t=' + String(t).padStart(2) + 's', get('/logo.png', 60)); }
console.log('origin calls:', originCalls);`
			},
			{
				label: 'A missing cache-key field leaks data',
				code: String.raw`// The cache key ignores the cookie, so the second shopper gets the first shopper's page.
const edge = new Map();
const render = (user) => 'Welcome back, ' + user;
function handle(path, user, cacheKey) {
  if (edge.has(cacheKey)) return edge.get(cacheKey) + '  (HIT)';
  const body = render(user);
  edge.set(cacheKey, body);
  return body + '  (MISS)';
}
console.log('bad key :', handle('/home', 'Asha', '/home'));
console.log('bad key :', handle('/home', 'Ben', '/home'));
edge.clear();
console.log('good key:', handle('/home', 'Asha', '/home|Asha'));
console.log('good key:', handle('/home', 'Ben', '/home|Ben'));`
			}
		]
	},
	{
		id: 'iam-basics',
		title: 'IAM basics',
		level: 'basic',
		summary: 'Tell users, roles and policies apart, and give an app access without keys in code.',
		scenes: ['aw-iam-policy-role'],
		notes: md(
			'**IAM** controls who can do what. A **policy** is a JSON document of statements, each with an **Effect** (Allow or Deny), **Actions**, **Resources** and optional **Conditions**.',
			'',
			'Identities: a **user** has long-lived credentials; a **role** has none and is **assumed** to get temporary credentials. Apps on AWS should use roles: an ECS task gets a **task role**, a Lambda function an **execution role**, an EC2 instance an **instance profile**. Keys never live in the code.',
			'',
			'```js',
			'const policy = {',
			'  Effect: "Allow",',
			'  Action: ["s3:GetObject"],',
			'  Resource: "arn:aws:s3:::shop-assets/*"',
			'};',
			'```',
			'',
			'Follow **least privilege**: grant the specific actions on the specific resources a job needs, not `s3:*` on `*`. The **root user** of the account should be locked away with MFA and not used day to day.',
			'',
			'**Common trap:** a resource ARN must match what the action targets. `s3:GetObject` applies to objects (`bucket/*`), while `s3:ListBucket` applies to the bucket itself, so a policy often needs both ARNs.'
		)
	},
	{
		id: 'iam-evaluation-and-sts',
		title: 'IAM evaluation and STS',
		level: 'advanced',
		summary: 'Predict an allow or deny from several policies, and explain how roles hand out temporary credentials.',
		scenes: ['aw-iam-evaluation', 'aw-sts-assume-role'],
		notes: md(
			'AWS starts every request at **deny**. Then: any **explicit Deny** in an applicable policy wins; otherwise the request needs an **Allow**. Inside one account, identity-based and resource-based policies are a **union**: either may supply the Allow. **Permissions boundaries** and organisation **SCPs** only **limit**: the action must also be inside them, and they never grant anything alone.',
			'',
			'**STS** issues temporary credentials. A role has a **trust policy** (who may assume it) and **permissions policies** (what it may do). `AssumeRole` returns an access key, secret key and **session token**. The session lasts one hour by default; chained roles are capped at one hour.',
			'',
			'```js',
			'const decide = (ps) => ps.some((p) => p.effect === "Deny") ? "Deny"',
			'  : ps.some((p) => p.effect === "Allow") ? "Allow" : "Deny (implicit)";',
			'```',
			'',
			'**Common trap:** a Deny elsewhere beats your Allow. When "my policy allows it but it fails", look for an explicit Deny, an SCP or a boundary, not only for a missing Allow.'
		),
		try: [
			{
				label: 'Tiny policy evaluator',
				code: String.raw`// Simplified: exact action or "service:*" matches, no conditions. Explicit deny beats allow, default is deny.
const match = (pat, action) => pat === '*' || pat === action || (pat.endsWith('*') && action.startsWith(pat.slice(0, -1)));
function evaluate(statements, action) {
  const hits = statements.filter((s) => s.actions.some((p) => match(p, action)));
  if (hits.some((s) => s.effect === 'Deny')) return 'DENY (explicit)';
  if (hits.some((s) => s.effect === 'Allow')) return 'ALLOW';
  return 'DENY (implicit)';
}
const policies = [
  { effect: 'Allow', actions: ['s3:*'] },
  { effect: 'Deny', actions: ['s3:DeleteObject'] }
];
for (const a of ['s3:GetObject', 's3:DeleteObject', 'ec2:StartInstances']) console.log(a.padEnd(20), evaluate(policies, a));`
			}
		]
	},
	{
		id: 'route53-acm',
		title: 'Route 53 and ACM',
		level: 'basic',
		summary: 'Point a domain at AWS resources with alias records and get a free HTTPS certificate in the right Region.',
		scenes: ['aw-route53-alias', 'aw-acm-certificate'],
		notes: md(
			'**Route 53** hosts your DNS **zone**: the records for a domain. DNS forbids a **CNAME at the zone apex** (`example.com`), so Route 53 offers an **alias record**: it works at the apex, points at an AWS resource such as a CloudFront distribution or a load balancer, is answered as ordinary **A/AAAA** records, and queries to AWS targets are free. You cannot set a TTL on an alias to an AWS resource.',
			'',
			'**ACM** issues free public certificates for integrated services. It proves you own the domain with a **DNS validation** record (a CNAME you add), then **renews automatically** while that record remains.',
			'',
			'**Region matters.** A certificate for CloudFront must be requested in **us-east-1**. A load balancer or a Regional API Gateway endpoint needs a certificate in its **own Region**.',
			'',
			'```js',
			'const records = [',
			'  { name: "example.com", type: "A", alias: "d111.cloudfront.net" },',
			'  { name: "www.example.com", type: "CNAME", value: "example.com" }',
			'];',
			'```',
			'',
			'**Common trap:** requesting the certificate in the Region where the rest of your stack lives, then not finding it in the CloudFront console. It must be in us-east-1.'
		)
	},
	{
		id: 'rds-and-aurora',
		title: 'RDS and Aurora',
		level: 'mid',
		summary: 'Separate Multi-AZ failover from read replicas, and know what Aurora changes.',
		scenes: ['aw-rds-multi-az', 'aw-read-replica-lag'],
		notes: md(
			'**RDS** runs a managed relational database (PostgreSQL, MySQL and others): AWS handles backups, patching windows and failover; you handle schema, queries and sizing. **Aurora** is AWS\'s own cloud-built engine with PostgreSQL- and MySQL-compatible editions and storage shared across zones.',
			'',
			'Two features get confused:',
			'',
			'- **Multi-AZ** is for **availability**. A standby in another zone is kept in sync; on failure RDS promotes it and the **same endpoint** follows. In the one-standby form, the standby does **not serve reads**.',
			'- **Read replicas** are for **read scaling**. They copy changes **asynchronously**, so they can lag.',
			'',
			'```js',
			'const route = (sql, justWrote) => (sql.startsWith("SELECT") && !justWrote ? "replica" : "primary");',
			'console.log(route("SELECT * FROM users", true)); // primary: read your own write',
			'```',
			'',
			'**Common trap:** reading from a replica straight after a write. The user saves a change and sees the old value. Send reads that must be fresh to the primary.'
		),
		try: [
			{
				label: 'Replica lag and read-your-writes',
				code: String.raw`const primary = { name: 'Asha R.' };
const replica = { name: 'Asha R.' };
let pending = []; // changes not yet replicated
function write(name) { primary.name = name; pending.push(name); }
function replicate() { if (pending.length) replica.name = pending.shift(); }
write('Asha Rao');
console.log('read replica :', replica.name, '(stale)');
console.log('read primary :', primary.name);
replicate();
console.log('after replication, replica:', replica.name);`
			}
		]
	},
	{
		id: 'elasticache-redis',
		title: 'ElastiCache and Redis',
		level: 'mid',
		summary: 'Use a cache-aside pattern with TTLs and keep stale data under control.',
		scenes: ['aw-cache-aside'],
		notes: md(
			'**ElastiCache** runs managed in-memory stores, usually **Redis** (or a Redis-compatible engine), or Memcached. Data sits in RAM, so reads take well under a millisecond of server time. It is used to take read load off the database, hold sessions, and rate-limit.',
			'',
			'The common recipe is **cache-aside**: look in the cache; on a **miss**, query the database, then store the result with a **TTL**; on a **hit**, skip the database.',
			'',
			'```js',
			'async function getProduct(id) {',
			'  const hit = await redis.get("product:" + id);',
			'  if (hit) return JSON.parse(hit);',
			'  const row = await db.product(id);',
			'  await redis.set("product:" + id, JSON.stringify(row), { EX: 60 });',
			'  return row;',
			'}',
			'```',
			'',
			'When data changes, **delete the key** (or accept staleness until the TTL ends). A cache is a copy: it can be lost, so treat it as disposable and never the only home of data.',
			'',
			'**Common trap:** a cache stampede. When a hot key expires, many requests miss at once and hit the database together. Add jitter to TTLs or let one request refill the key.'
		),
		try: [
			{
				label: 'Cache-aside and DB hits',
				code: String.raw`let now = 0, dbHits = 0;
const db = (id) => { dbHits++; return { id, name: 'Item ' + id }; };
const cache = new Map();
function getProduct(id, ttl) {
  const e = cache.get(id);
  if (e && now < e.expires) return 'hit';
  cache.set(id, { v: db(id), expires: now + ttl });
  return 'miss';
}
const log = [];
for (const t of [0, 5, 10, 59, 61, 62]) { now = t; log.push('t=' + t + ' ' + getProduct(42, 60)); }
console.log(log.join('\n'));
console.log('database queries:', dbHits, 'of 6 requests');`
			}
		]
	},
	{
		id: 'containers-ecr-ecs-eks',
		title: 'Containers: ECR, ECS, EKS',
		level: 'mid',
		summary: 'Know where images live, what ECS and EKS each run, and how a rolling deployment stays up.',
		scenes: ['aw-ecr-ecs-deploy'],
		notes: md(
			'A **container** packages your app and its dependencies into an **image**. **ECR** is the private registry that stores images. Something else has to run them:',
			'',
			'- **ECS** is AWS\'s own container orchestrator. You define a **task definition** (image, CPU, memory, ports, environment, task role) and run it as a **service** that keeps N tasks alive behind a load balancer.',
			'- **EKS** is managed **Kubernetes**: the standard API and tooling, more moving parts.',
			'- **Fargate** is a launch type for either that removes the servers: you pay for task size, not instances you manage.',
			'',
			'A **rolling deployment** starts tasks of the new revision, waits for **health checks**, then stops old ones, so traffic never drops to zero.',
			'',
			'```json',
			'{ "family": "shop-api", "cpu": "512", "memory": "1024",',
			'  "containerDefinitions": [{ "name": "api", "image": "123456789012.dkr.ecr.eu-west-1.amazonaws.com/shop-api:1.4.2" }] }',
			'```',
			'',
			'**Common trap:** a task has two IAM roles: the **execution role** (ECS uses it to pull the image and fetch secrets at launch) and the **task role** (your code uses it at run time). Mixing them up causes permission errors.'
		)
	},
	{
		id: 'lambda-and-api-gateway',
		title: 'Lambda and API Gateway',
		level: 'mid',
		summary: 'Explain cold starts, limits and when functions fit, and how API Gateway and EventBridge trigger them.',
		scenes: ['aw-apigw-lambda'],
		notes: md(
			'**Lambda** runs a function on demand with no servers to manage, billed by invocations and run time. Each call runs in an **execution environment**; if none is free, Lambda creates one, a **cold start**, otherwise it reuses a warm one. Code outside the handler runs once per environment.',
			'',
			'Key limits: a **maximum timeout of 15 minutes**, memory from 128 MB to 10,240 MB (CPU scales with memory), and about **6 MB** for a buffered synchronous request or response (response streaming allows more). Concurrency is capped per Region by a soft quota that can be raised; new accounts start lower.',
			'',
			'**API Gateway** is the managed HTTP front door: routes, authorisation, throttling. **EventBridge** routes events, including cron-style schedules, to targets such as a function.',
			'',
			'```js',
			'export const handler = async (event) => {',
			'  const order = JSON.parse(event.body);',
			'  return { statusCode: 201, body: JSON.stringify({ id: order.id }) };',
			'};',
			'```',
			'',
			'**Common trap:** assuming a function remembers state. Environments are created and discarded at will, so keep durable state in a database or S3, and treat the local disk as scratch.'
		)
	},
	{
		id: 'sqs-and-sns',
		title: 'SQS and SNS',
		level: 'mid',
		summary: 'Decouple services with queues and topics, and make workers safe to retry.',
		scenes: ['aw-sqs-visibility', 'aw-sns-fanout'],
		notes: md(
			'**SQS** is a managed **queue**: producers add messages, workers pull them. When a worker **receives** a message it is hidden for the **visibility timeout** (30 seconds by default). The worker **deletes** it on success; if it crashes, the message reappears. So delivery is **at-least-once**, and handlers must be **idempotent**.',
			'',
			'A **dead-letter queue** (DLQ) catches messages that fail repeatedly: after `maxReceiveCount` receives, a redrive policy moves them there. Use **long polling** (up to 20 seconds) to cut empty receives. A **FIFO** queue adds ordering and de-duplication at lower throughput.',
			'',
			'**SNS** is **publish/subscribe**: one message goes to every subscriber (SQS queues, Lambda functions, email). The classic pattern is **fan-out**: a topic feeding one queue per consumer.',
			'',
			'```js',
			'const done = new Set();',
			'function handle(msg) {',
			'  if (done.has(msg.id)) return; // a duplicate: safe to ignore',
			'  done.add(msg.id);',
			'}',
			'```',
			'',
			'**Common trap:** a visibility timeout shorter than the job. The message reappears while the first worker is still busy, and two workers process it.'
		),
		try: [
			{
				label: 'Visibility timeout and a dead-letter queue',
				code: String.raw`// A message is received, the worker "crashes", and after maxReceiveCount it moves to the DLQ.
const maxReceiveCount = 3;
const queue = [{ id: 'A-1042', receives: 0 }];
const dlq = [];
let attempt = 0;
while (queue.length) {
  const m = queue.shift();
  m.receives++;
  attempt++;
  console.log('attempt ' + attempt + ': worker receives ' + m.id + ' (receive #' + m.receives + ') and crashes');
  if (m.receives >= maxReceiveCount) { dlq.push(m); console.log('moved to DLQ'); }
  else queue.push(m); // visible again after the timeout
}
console.log('queue:', queue.length, 'dlq:', dlq.map((m) => m.id));`
			},
			{
				label: 'Idempotent handler with a duplicate',
				code: String.raw`const processed = new Set();
let charged = 0;
function handle(msg) {
  if (processed.has(msg.id)) return 'duplicate ignored';
  processed.add(msg.id);
  charged += msg.amount;
  return 'charged ' + msg.amount;
}
const deliveries = [{ id: 'A-1', amount: 40 }, { id: 'A-2', amount: 15 }, { id: 'A-1', amount: 40 }];
for (const m of deliveries) console.log(m.id, handle(m));
console.log('total charged:', charged);`
			}
		]
	},
	{
		id: 'msk-kafka',
		title: 'MSK and Kafka',
		level: 'advanced',
		summary: 'Explain partitions, keys and consumer groups, and when Kafka beats a queue.',
		scenes: ['aw-kafka-partitions'],
		notes: md(
			'**Amazon MSK** runs Apache **Kafka** for you. Kafka is a distributed **log**: a **topic** is split into **partitions**, each an ordered, append-only sequence. Messages are **kept** for a retention period, not deleted when read; each reader tracks its own **offset**.',
			'',
			'A producer\'s **key** is hashed to choose a partition, so everything for one key stays **in order**. Ordering holds **within a partition only**. A **consumer group** shares a topic: each partition goes to exactly one consumer in the group, so parallelism is capped by the partition count, and a different group reads the same topic independently.',
			'',
			'Pick Kafka over SQS when you need replay, many independent readers of the same stream, or very high throughput with ordering per key. Pick SQS for simple work queues.',
			'',
			'```js',
			'const partitionFor = (key, n) => [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % n;',
			'console.log(partitionFor("order-7", 3));',
			'```',
			'',
			'**Common trap:** adding partitions later changes which partition a key maps to, breaking per-key ordering for existing data. Choose the count with growth in mind.'
		),
		try: [
			{
				label: 'Keys map to partitions',
				code: String.raw`const partitionFor = (key, n) => [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % n;
const keys = ['order-7', 'order-7', 'order-8', 'order-9', 'order-7'];
for (const k of keys) console.log(k, '-> partition', partitionFor(k, 3));
// Same key, same partition, so events for one order stay in sequence.
const assign = (partitions, consumers) => partitions.map((p, i) => 'P' + p + ' -> ' + consumers[i % consumers.length]);
console.log(assign([0, 1, 2], ['A', 'B']).join(' | '));
console.log(assign([0, 1, 2], ['A', 'B', 'C', 'D']).join(' | '), '(D is idle)');`
			}
		]
	},
	{
		id: 'ses-email',
		title: 'SES email',
		level: 'basic',
		summary: 'Send transactional email, understand the sandbox, and protect your sender reputation.',
		scenes: ['aw-ses-sending'],
		notes: md(
			'**SES** (Simple Email Service) sends and receives email by API or SMTP. Receivers decide whether to trust you, so you prove your identity: **verify the domain** and publish **DKIM** records (and SPF/DMARC as appropriate). The **From** identity must be verified even in production.',
			'',
			'A new account starts in the **sandbox**, **per Region**: you may send only to verified addresses or domains (or the mailbox simulator), at a low daily quota and rate. Ask AWS for **production access** to email real customers.',
			'',
			'Handle **bounces** and **complaints** by publishing events to SNS or similar and **suppressing** bad addresses. A high bounce or complaint rate harms reputation and can pause sending.',
			'',
			'```js',
			'const msg = { Source: "orders@example.com", Destination: { ToAddresses: ["asha@example.org"] },',
			'  Message: { Subject: { Data: "Order A-1042" }, Body: { Text: { Data: "Thanks for your order." } } } };',
			'```',
			'',
			'**Common trap:** testing with a real customer address while still in the sandbox, then wondering why it is rejected. Verify the recipient, use the simulator, or request production access first.'
		)
	},
	{
		id: 'cloudwatch-and-xray',
		title: 'CloudWatch and X-Ray',
		level: 'basic',
		summary: 'Choose between metrics, logs, alarms and traces to find out what is wrong and where.',
		scenes: ['aw-trace-slow-request'],
		notes: md(
			'**CloudWatch** is the monitoring home on AWS:',
			'',
			'- **Metrics**: numbers over time (CPU, request count, latency). Many services publish them; you can add your own.',
			'- **Logs**: event text from your app and AWS services, searchable with Logs Insights.',
			'- **Alarms**: watch a metric against a threshold and notify, for example through SNS.',
			'',
			'**X-Ray** adds **distributed tracing**: one request is followed through several services, and each step is timed, so you can see where the latency sits.',
			'',
			'Use structured JSON logs with a **request id**, so one request can be found across services.',
			'',
			'```js',
			'console.log(JSON.stringify({ level: "info", requestId: "r-81f2", route: "/checkout", ms: 1840 }));',
			'```',
			'',
			'Alert on user-facing symptoms, such as **error rate and p99 latency**, before low-level causes like CPU.',
			'',
			'**Common trap:** averages hide pain. A 200 ms average can contain a few 5 second requests; watch percentiles such as p95 and p99.'
		),
		try: [
			{
				label: 'Average versus p99',
				code: String.raw`const ms = [120, 130, 110, 140, 125, 118, 135, 122, 5200, 128, 119, 5100, 121, 133, 117, 124, 126, 129, 131, 127];
const sorted = ms.slice().sort((a, b) => a - b);
const pct = (p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const avg = Math.round(ms.reduce((s, x) => s + x, 0) / ms.length);
console.log('average:', avg, 'ms');
console.log('p50    :', pct(50), 'ms');
console.log('p95    :', pct(95), 'ms');
console.log('p99    :', pct(99), 'ms');`
			}
		]
	},
	{
		id: 'secrets-and-parameters',
		title: 'Secrets and parameters',
		level: 'basic',
		summary: 'Keep credentials out of code and choose between Secrets Manager and Parameter Store.',
		scenes: ['aw-secret-injection'],
		notes: md(
			'Secrets such as database passwords and API keys must stay out of the repository, the image and the logs. AWS has two stores:',
			'',
			'- **Secrets Manager**: built for secrets, encrypted with **KMS**, with **automatic rotation** support (for example for RDS credentials).',
			'- **Systems Manager Parameter Store**: hierarchical config values (`/shop/prod/api-url`); the **SecureString** type encrypts a value with KMS. A simpler, lighter-weight option for ordinary settings.',
			'',
			'Access is **IAM**: the role that reads the secret gets `GetSecretValue` (or `GetParameter`) on that one secret. ECS can **inject** a secret as an environment variable at launch, and then it is the task **execution role** that needs the permission; code that fetches the secret itself uses the task role.',
			'',
			'```js',
			'const dbPassword = process.env.DB_PASSWORD; // injected at start, never in the repository',
			'```',
			'',
			'**Common trap:** rotation does not update running containers. A value injected at launch stays until the task restarts, so apps that must follow rotation should re-fetch the secret or be redeployed.'
		)
	},
	{
		id: 'waf-and-shield',
		title: 'WAF and Shield',
		level: 'mid',
		summary: 'Filter abusive web traffic with rate-based rules and know what Shield covers.',
		scenes: ['aw-waf-rate-limit'],
		notes: md(
			'**AWS WAF** inspects HTTP requests. You attach a **Web ACL** to CloudFront, an Application Load Balancer, API Gateway or similar. It holds **rules** evaluated in **priority order**; each rule can **allow, block, count**, or challenge (CAPTCHA or challenge) requests.',
			'',
			'Common rules: **AWS managed rule groups** (known bad inputs, SQL injection patterns, IP reputation), **IP sets**, geo matches, and **rate-based rules**. A rate-based rule counts requests per aggregation key (for example per IP) over a window of **1, 2, 5 or 10 minutes** (5 by default); the lowest limit allowed is 10. It rate-limits near, not exactly at, the limit.',
			'',
			'**AWS Shield** protects against DDoS: **Standard** is automatic and covers common network and transport layer attacks; **Advanced** is a paid tier with more protection and response support.',
			'',
			'```js',
			'const rule = { name: "login-rate", limit: 100, windowSeconds: 300, aggregateBy: "IP", action: "Block" };',
			'```',
			'',
			'**Common trap:** switching a new rule straight to Block. Start in **Count** mode, check the logs for legitimate traffic that matches, then enforce.'
		),
		try: [
			{
				label: 'A per-IP rate limit',
				code: String.raw`// Count requests per IP in a window; block once the limit is passed. Real WAF is approximate near the limit.
const limit = 5;
const seen = new Map();
function allow(ip) {
  const n = (seen.get(ip) || 0) + 1;
  seen.set(ip, n);
  return n <= limit ? 'allow' : 'block';
}
const traffic = [['10.0.0.1', 8], ['10.0.0.2', 3]];
for (const [ip, count] of traffic) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(allow(ip));
  console.log(ip, out.join(' '));
}`
			}
		]
	},
	{
		id: 'shared-responsibility-and-cost',
		title: 'Responsibility and cost',
		level: 'basic',
		summary: 'Know which security jobs are yours, and the habits that keep an AWS bill predictable.',
		scenes: ['aw-shared-responsibility'],
		notes: md(
			'The **shared responsibility model**: AWS is responsible for the security **of** the cloud (facilities, hardware, network, and the software of managed services). You are responsible for security **in** the cloud: IAM, your data, configuration, and your own code. The more managed the service (S3, Lambda), the less you run; with EC2 you also patch the operating system.',
			'',
			'Most breaches are **configuration**: a public bucket, a leaked key, an over-broad policy. Turn on **Block Public Access**, use roles instead of keys, enable **MFA** on the root user, and log activity with **CloudTrail**.',
			'',
			'Cost habits: tag resources, set a **budget alarm** in AWS Budgets, delete unused resources, and remember that **data transfer out** and idle resources are the usual surprises. Use lifecycle rules to move old S3 data to cheaper storage classes.',
			'',
			'```js',
			'const tags = { app: "shop", env: "prod", owner: "web-team" }; // lets you see who spends what',
			'```',
			'',
			'**Common trap:** assuming "managed" means "secured". AWS runs the service, but who can read your bucket, database or queue is still a policy you wrote.'
		)
	}
];

export const aws: LearnEngine = {
	id: 'aws',
	name: 'AWS',
	tagline: 'The AWS services a web engineer meets most: storage, CDN, access, data, compute and queues.',
	topics,
	questions: awsQuestions,
	quizTopics: topics.map((t) => ({ id: t.id, label: t.title })),
	playground: 'js',
	quizBlurb: 'AWS storage, CDN, IAM, DNS and TLS, databases, compute, queues and operations'
};
