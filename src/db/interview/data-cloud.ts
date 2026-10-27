import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

// Interview prep, data and cloud: SQL, MySQL and MongoDB, AWS, Docker and CI/CD.
// Authoring note: in the template strings below the section sign stands for a backtick, so code fences and inline code
// can be written without escaping. It is swapped back by `md`.
const md = (s: string) => s.replaceAll('§', '`').trim();

// ───────────────────────────── topics ─────────────────────────────

export const topics: DbTopic[] = [
	{
		id: 'iv-sql-optimization',
		title: 'SQL and query optimization',
		level: 'basic',
		summary: 'Answer the SQL questions asked at SDE 1 and SDE 2 interviews: joins, windows, indexes, plans, N+1, isolation and deadlocks.',
		scenes: [],
		notes: md(`
**Q. What is the difference between INNER JOIN and LEFT JOIN?** §SDE 1§
INNER JOIN keeps only rows that match on both sides. LEFT JOIN keeps every row from the left table and fills the right side with NULL when nothing matches. A common follow-up: a filter on the right table in WHERE turns a LEFT JOIN into an INNER JOIN, so put it in the ON clause when you want to keep the unmatched rows.

**Q. WHERE versus HAVING?** §SDE 1§
WHERE filters rows before grouping and cannot use aggregates. HAVING filters groups after GROUP BY and can use aggregates such as §COUNT(*) > 5§. Filter early with WHERE whenever you can, because it shrinks the data before grouping.

**Q. What is an index and why not index every column?** §SDE 1§
An index is a separate sorted structure (usually a B-tree) that lets the database find rows without scanning the table. Reads get faster, but every insert, update and delete must also maintain each index, and indexes use disk and memory. Index the columns you filter, join and sort on, not everything.

**Q. How does a composite index work?** §SDE 1§
An index on §(country, city, created_at)§ is sorted by country, then city within country, then date. It serves queries that use a leftmost prefix: country, or country and city. A query on city alone cannot use it well. Put equality columns first, then the range or sort column.

**Q. Find the second highest salary.** §SDE 1§
§§§sql
SELECT MAX(salary) FROM emp
WHERE salary < (SELECT MAX(salary) FROM emp);
§§§
Or use §DENSE_RANK() OVER (ORDER BY salary DESC)§ and keep rank 2, which generalises to the Nth value and handles ties.

**Q. What are the normal forms and when do you denormalize?** §SDE 1§
1NF: atomic values, no repeating groups. 2NF: every non-key column depends on the whole key. 3NF: no column depends on another non-key column. Normalize to avoid update anomalies. Denormalize on purpose for read-heavy paths, such as storing a cached order total, and accept the work of keeping it in sync.

**Q. What does ACID mean?** §SDE 1§
Atomicity: all or nothing. Consistency: constraints hold before and after. Isolation: concurrent transactions do not see each other's half-done work. Durability: committed data survives a crash.

**Q. How do you read an EXPLAIN plan?** §SDE 2§
Look at the access type and the chosen index first. A full table scan on a big table, a filesort, or a temporary table are the usual red flags. Compare estimated rows with actual rows (§EXPLAIN ANALYZE§ gives both): a big gap means stale statistics. Check that the join order starts from the most selective table.
Follow-up: why would the optimizer ignore your index? Low selectivity, a function on the column, a type mismatch, or a small table.

**Q. What is the N+1 query problem and how do you fix it?** §SDE 2§
You run one query for a list and then one more query per row, for example loading authors inside a loop over posts. 100 posts means 101 round trips. Fix it with a JOIN, or with one batched query using §WHERE id IN (...)§ and a map in memory. ORMs call this eager loading. Detect it by counting queries per request.
Follow-up: when is a join worse than two queries? When the join multiplies rows (one-to-many) and you only need parent fields.

**Q. Window functions versus GROUP BY?** §SDE 2§
GROUP BY collapses rows into one per group. A window function computes over a set of related rows but keeps every row. Examples: §ROW_NUMBER()§ (never ties), §RANK()§ (ties, then a gap), §DENSE_RANK()§ (ties, no gap), §SUM(x) OVER (ORDER BY d)§ for a running total, §LAG()§ for the previous row.
Follow-up: top 3 orders per customer? Rank with §PARTITION BY customer_id ORDER BY total DESC§ in a subquery, then filter rank <= 3.

**Q. Name the isolation levels and the problems they prevent.** §SDE 2§
READ UNCOMMITTED allows dirty reads. READ COMMITTED prevents them but allows non-repeatable reads. REPEATABLE READ keeps the same rows for the whole transaction (MySQL InnoDB default, using snapshots and gap locks, so phantoms are mostly blocked). SERIALIZABLE behaves as if transactions ran one at a time. Higher levels cost more locking or retries.
Follow-up: PostgreSQL defaults to READ COMMITTED. Why might you pick that for a busy service? Fewer locks and fewer deadlocks.

**Q. What is a deadlock and how do you handle it?** §SDE 2§
Two transactions each hold a lock the other needs, so neither can continue. The database detects the cycle and aborts one with an error. Reduce them by locking rows in a consistent order, keeping transactions short, and indexing the columns used in UPDATE and DELETE so fewer rows are locked. The application should catch the error and retry.

**Q. The query has an index but is still slow. Why?** §SDE 2§
Common causes: a function on the column (§WHERE DATE(created_at) = ...§), a leading wildcard (§LIKE '%abc'§), an implicit type cast, an OR across different columns, or returning too many rows. Deep §OFFSET§ pagination is slow because the database still reads and discards the skipped rows. Use keyset pagination: §WHERE id > :last ORDER BY id LIMIT 20§.

**What interviewers look for:** you can explain why, not only what. Say how you would measure first (EXPLAIN, query counts), name the trade-off of every index, and mention transactions and retries for concurrency.
`),
		try: [
			{
				label: 'Exercise: nested loop vs hash join',
				code: `// Exercise: count the comparisons each join strategy makes. Predict first: which is smaller for 200 orders and 50 users?
const users = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: 'u' + (i + 1) }));
const orders = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, userId: ((i * 7) % 50) + 1 }));

let nested = 0;
const out1 = [];
for (const o of orders) {
  for (const u of users) {
    nested++;
    if (u.id === o.userId) out1.push([o.id, u.name]);
  }
}

// TODO: build a Map of users by id (the build side), then probe it once per order.
// Count every probe as 1 comparison and push [o.id, user.name] into out2.
let hashed = 0;
const byId = new Map();
const out2 = [];

console.log('nested loop comparisons:', nested, 'rows:', out1.length);
console.log('hash join comparisons:', hashed, 'rows:', out2.length, '(goal: 200 rows)');`
			},
			{
				label: 'Exercise: fix the N+1',
				code: `// Exercise: fix the N+1 so the page uses 2 queries instead of 1 + N.
let queries = 0;
const authors = [{ id: 1, name: 'Asha' }, { id: 2, name: 'Ben' }, { id: 3, name: 'Chen' }];
const posts = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, authorId: (i % 3) + 1 }));
const selectPosts = () => { queries++; return posts; };
const selectAuthorsIn = (ids) => { queries++; return authors.filter((a) => ids.includes(a.id)); };

// The slow version: one author query per post.
queries = 0;
const slow = selectPosts().map((p) => ({ ...p, author: selectAuthorsIn([p.authorId])[0].name }));
console.log('N+1 queries:', queries);

// TODO: collect the distinct authorIds, call selectAuthorsIn ONCE, build a Map id -> name, then attach the name.
queries = 0;
const list = selectPosts();
const fixed = list.map((p) => ({ ...p, author: '?' }));
console.log('batched queries:', queries, '(goal: 2)');
console.log(fixed.slice(0, 3));`
			},
			{
				label: 'Exercise: RANK vs DENSE_RANK',
				code: `// Exercise: predict the RANK and DENSE_RANK of each row, then run. RANK leaves a gap after a tie, DENSE_RANK does not.
const rows = [{ n: 'a', s: 90 }, { n: 'b', s: 80 }, { n: 'c', s: 80 }, { n: 'd', s: 70 }];
let rank = 0, dense = 0, prev = null, seen = 0, running = 0;
for (const r of rows) {
  seen++;
  if (r.s !== prev) { rank = seen; dense++; prev = r.s; }
  running += r.s;
  // TODO: also print ROW_NUMBER (which never ties) as a last column. It is just seen.
  console.log(r.n, 'score', r.s, 'RANK', rank, 'DENSE_RANK', dense, 'running total', running);
}`
			}
		]
	},
	{
		id: 'iv-mysql-mongo',
		title: 'MySQL and MongoDB',
		level: 'mid',
		summary: 'Schema design, indexing, aggregation, replication and sharding for both databases, and how to choose between them.',
		scenes: [],
		notes: md(`
**Q. When would you pick MongoDB over MySQL, and the reverse?** §SDE 1§
Pick MySQL when the data is relational, you need multi-row transactions and strict constraints, and queries join many tables (orders, payments, inventory). Pick MongoDB when documents have a flexible or nested shape, are usually read whole, and the schema changes often (catalogs with varying attributes, event payloads). Many systems use both. Say what you would give up, not only what you gain.

**Q. What does InnoDB give you?** §SDE 1§
Transactions with ACID guarantees, row-level locking, foreign keys, crash recovery, and MVCC so readers do not block writers. It is the default engine in MySQL. The old MyISAM engine has none of these and is not used for new work.

**Q. What is a clustered index in InnoDB?** §SDE 1§
The table itself is stored in primary key order, so the primary key is the clustered index. Every secondary index stores the primary key value as its row pointer. So a wide primary key makes every secondary index bigger, and a random key (like a UUID v4) causes page splits. Prefer a short, increasing key, or a time-ordered UUID.

**Q. Embed or reference in MongoDB?** §SDE 1§
Embed when the child data is read with the parent, is bounded in size, and belongs to one parent (an order with its line items). Reference when the child grows without limit (all comments on a post), is shared by many parents, or is updated on its own. A document is limited to 16 MB, so unbounded arrays are a bug waiting to happen.

**Q. How do you design a MongoDB index?** §SDE 1§
Follow Equality, Sort, Range: equality fields first, then the sort field, then range fields. Use §explain("executionStats")§ and compare §totalDocsExamined§ with §nReturned§. A compound index also serves its prefixes. Too many indexes slow writes, as in SQL.

**Q. Explain the aggregation pipeline.** §SDE 1§
Documents flow through stages, each transforming the stream: §$match§ filters, §$group§ aggregates, §$sort§, §$project§, §$lookup§ joins, §$unwind§ flattens arrays.
§§§js
db.orders.aggregate([
  { $match: { status: "paid", createdAt: { $gte: start } } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } }, { $limit: 10 }
])
§§§
Put §$match§ and §$limit§ early so indexes are used and fewer documents flow on.

**Q. Is $lookup a replacement for joins?** §SDE 2§
It works, but it is a per-document lookup and gets expensive on large collections, and it needs an index on the foreign field. If you join on every read, the model is probably wrong: embed, or duplicate the few fields you need.
Follow-up: what is the cost of duplicating data? You must update every copy, so duplicate fields that rarely change.

**Q. How does replication work in each?** §SDE 2§
MySQL: one primary writes to a binary log, replicas apply it, usually asynchronously, so replicas can lag and a read right after a write may miss it. MongoDB: a replica set has one primary and secondaries, with automatic election if the primary fails. Use write concern §majority§ to avoid losing acknowledged writes on failover.
Follow-up: how do you handle read-your-writes? Read from the primary for that user for a short time, or pass a causal-consistency session token.

**Q. How does sharding work and how do you choose a shard key?** §SDE 2§
Sharding splits data across machines. MongoDB has it built in; MySQL usually needs an application layer or a proxy. A good key has high cardinality, spreads writes evenly, and appears in most queries. A steadily increasing key (timestamp, auto-increment) sends all new writes to one shard. A hashed key spreads writes but makes range queries scatter to every shard.
Follow-up: why shard late? It adds operations cost, cross-shard queries and no cheap undo. Scale up, add replicas, and index first.

**Q. Does MongoDB support transactions?** §SDE 2§
Yes, multi-document ACID transactions exist (replica sets from 4.0, sharded clusters from 4.2). They cost performance and hold locks, so a good document model needs them rarely, because one document is already atomic.

**Q. How do you change a large MySQL table without downtime?** §SDE 2§
Use an online schema change: InnoDB online DDL for supported changes, or a tool that copies the table in the background and swaps it. Roll out in steps: add the nullable column, deploy code that writes both, backfill in small batches, switch reads, then drop the old column later.

**What interviewers look for:** a choice justified by access patterns, honesty about trade-offs, and awareness of failure cases: lag, failover, hot shards, unbounded documents.
`),
		try: [
			{
				label: 'Exercise: aggregation pipeline',
				code: `// Exercise: finish the $group stage, like db.orders.aggregate([{ $match }, { $group }, { $sort }]).
const orders = [
  { userId: 'a', status: 'paid', amount: 40 },
  { userId: 'b', status: 'paid', amount: 25 },
  { userId: 'a', status: 'refunded', amount: 90 },
  { userId: 'a', status: 'paid', amount: 10 },
  { userId: 'c', status: 'paid', amount: 70 },
  { userId: 'b', status: 'paid', amount: 30 },
];

const matched = orders.filter((o) => o.status === 'paid');   // $match

// TODO: $group by userId and sum amount into total (use a Map or an object).
const groups = [];

const sorted = groups.sort((x, y) => y.total - x.total);     // $sort descending
console.log(sorted);
console.log('goal: c 70, b 55, a 50');`
			},
			{
				label: 'Exercise: which index prefix is usable',
				code: `// Exercise: given an index on (country, city, created_at), how many leading index columns can a query use?
// Rule: equality columns extend the prefix; the first range column can still use the index but stops it there.
function usablePrefix(indexCols, equalityCols, rangeCols) {
  let used = 0;
  for (const col of indexCols) {
    if (equalityCols.includes(col)) { used++; continue; }
    // TODO: if col is in rangeCols, count it (used++) and then stop. Otherwise stop.
    break;
  }
  return used;
}
const idx = ['country', 'city', 'created_at'];
console.log(usablePrefix(idx, ['country'], []), 'goal 1');
console.log(usablePrefix(idx, ['country', 'city'], ['created_at']), 'goal 3');
console.log(usablePrefix(idx, ['city'], []), 'goal 0 (no leftmost column)');
console.log(usablePrefix(idx, ['country'], ['city']), 'goal 2');`
			},
			{
				label: 'Exercise: hot shard',
				code: `// Exercise: predict which shard key spreads the newest 1000 writes evenly across 4 shards. Then run.
// Ranges: shard 0 holds ids 0-999999, shard 1 holds 1000000-1999999, and so on.
const shards = 4;
const rangeShard = (id) => Math.min(shards - 1, Math.floor(id / 1000000));
const hashShard = (id) => (Math.imul(id, 2654435761) >>> 16) % shards;

const newest = Array.from({ length: 1000 }, (_, i) => 3500000 + i); // auto-increment ids at the tail

const count = (fn) => { const c = new Array(shards).fill(0); for (const id of newest) c[fn(id)]++; return c; };
console.log('range on increasing id:', count(rangeShard));
console.log('hashed id:', count(hashShard));
// TODO: write rangeShard2(userId) for random user ids and compare. What would a query for "all orders from the last hour" cost on the hashed key?`
			}
		]
	},
	{
		id: 'iv-aws',
		title: 'AWS',
		level: 'mid',
		summary: 'The AWS questions asked of application developers: S3, IAM, compute choices, CloudFront, RDS, queues, VPC, cost and reliability.',
		scenes: [],
		notes: md(`
**Q. How would you store and serve user uploads with S3?** §SDE 1§
Keep the bucket private with Block Public Access on. The browser uploads directly using a presigned URL that your backend creates for one key and a short time, so large files never pass through your servers. Serve downloads through presigned URLs or CloudFront. Turn on versioning and a lifecycle rule to move old data to cheaper classes. S3 gives strong read-after-write consistency.

**Q. IAM user versus role, and what is least privilege?** §SDE 1§
A user has long-lived credentials. A role is assumed and gives temporary credentials, so an EC2 instance, Lambda or container should use a role and never hard-coded keys. Least privilege means granting only the actions and resources needed, such as §s3:GetObject§ on one bucket prefix, not §s3:*§ on everything.

**Q. How is an IAM request evaluated?** §SDE 1§
Everything is denied by default. An explicit Allow in a matching policy grants access, but any explicit Deny wins over every Allow. Permission boundaries and organization policies can further limit what is allowed.

**Q. EC2, ECS/Fargate or Lambda: how do you choose?** §SDE 1§
Lambda: event-driven or spiky work, short tasks (15 minute limit), no servers to manage, pay per use. Fargate: long-running containers without managing hosts. EC2: full control, special hardware, steady heavy load where reserved pricing wins. Start with the simplest that meets the need.

**Q. What is a Lambda cold start?** §SDE 1§
The first request on a new execution environment must start the runtime and run your init code, which adds latency. Reduce it with smaller packages, lazy imports, initialising clients outside the handler so warm calls reuse them, and provisioned concurrency for latency-critical paths.
Follow-up: what protects a database from a Lambda burst? Reserved concurrency, a connection proxy, and a queue in front.

**Q. How does CloudFront help?** §SDE 1§
It caches content at edge locations close to users, cutting latency and origin load. Control it with cache headers and TTLs. Invalidations purge cached files but cost time, so prefer versioned file names (§app.3f9a.js§). Use an origin access control so the S3 bucket is reachable only through CloudFront.

**Q. RDS Multi-AZ versus read replicas?** §SDE 2§
Multi-AZ keeps a synchronous standby in another zone for failover and high availability, and you cannot read from it in the classic setup. Read replicas are asynchronous copies used to scale reads, and they can lag. They solve different problems, and you often use both.
Follow-up: a replica lags and users see stale data after saving. What do you do? Read your own writes from the primary.

**Q. SQS versus SNS, and how do you handle duplicates?** §SDE 2§
SQS is a queue: consumers pull messages, which is good for buffering and decoupling workers. SNS is publish-subscribe: it pushes one message to many subscribers. The common fan-out pattern is SNS to several SQS queues. Standard queues deliver at least once and may reorder, so make consumers idempotent, for example by checking an id before processing.
Follow-up: what is the visibility timeout? It hides a received message while a worker processes it. Set it above the processing time, and use a dead-letter queue for messages that keep failing.

**Q. Explain public and private subnets in a VPC.** §SDE 2§
A public subnet has a route to an internet gateway. A private subnet does not, and reaches the internet outbound through a NAT gateway. Typical layout: load balancer in public subnets, app servers and databases in private subnets, spread across at least two availability zones.

**Q. Security group versus network ACL?** §SDE 2§
A security group is attached to an instance or interface, is stateful (return traffic is allowed automatically), and has allow rules only. A network ACL is attached to a subnet, is stateless (you must allow return traffic) and supports allow and deny. Security groups do most of the daily work.

**Q. Your AWS bill doubled. How do you investigate?** §SDE 2§
Use Cost Explorer grouped by service and tag to find the spike. Usual suspects: NAT gateway data transfer, idle or oversized instances, unattached volumes, S3 without lifecycle rules, and logs kept forever. Fixes: right-size, auto scale, use reserved or savings plans for steady load, add VPC endpoints for S3, and set budgets with alerts.

**Q. How do you make a service survive a zone failure?** §SDE 2§
Run at least two zones behind a load balancer with health checks, use an auto scaling group to replace bad instances, keep state in Multi-AZ managed stores, and make deployments and queue consumers retry-safe. Test failure, do not assume.

**What interviewers look for:** the secure default (private, roles, least privilege), reasons for a service choice, and awareness of cost and failure, not a list of service names.
`),
		try: [
			{
				label: 'Exercise: IAM evaluation',
				code: `// Exercise: implement the IAM rule: default deny, an explicit Allow grants, an explicit Deny always wins.
const match = (pattern, value) => pattern === '*' || (pattern.endsWith('*') ? value.startsWith(pattern.slice(0, -1)) : pattern === value);

function isAllowed(policies, action, resource) {
  let allowed = false;
  for (const p of policies) {
    const hit = match(p.action, action) && match(p.resource, resource);
    if (!hit) continue;
    // TODO: if p.effect is 'Deny' return false immediately. If it is 'Allow', set allowed = true.
  }
  return allowed;
}

const policies = [
  { effect: 'Allow', action: 's3:*', resource: 'bucket/photos/*' },
  { effect: 'Deny', action: 's3:Delete*', resource: 'bucket/photos/*' },
];
console.log('read photo:', isAllowed(policies, 's3:GetObject', 'bucket/photos/a.png'), 'goal true');
console.log('delete photo:', isAllowed(policies, 's3:DeleteObject', 'bucket/photos/a.png'), 'goal false');
console.log('read other bucket:', isAllowed(policies, 's3:GetObject', 'other/x'), 'goal false');`
			},
			{
				label: 'Exercise: idempotent queue consumer',
				code: `// Exercise: a standard SQS queue can deliver a message more than once. Make the consumer idempotent.
const queue = [
  { id: 'm1', orderId: 1, amount: 100 },
  { id: 'm2', orderId: 2, amount: 50 },
  { id: 'm1', orderId: 1, amount: 100 }, // duplicate delivery of m1
  { id: 'm3', orderId: 3, amount: 25 },
  { id: 'm2', orderId: 2, amount: 50 },  // duplicate delivery of m2
];

let revenue = 0;
const processed = new Set();
for (const msg of queue) {
  // TODO: skip the message if its id is already in processed, otherwise add it.
  revenue += msg.amount;
}
console.log('revenue:', revenue, '(goal: 175, not 325)');`
			},
			{
				label: 'Exercise: cache TTL and origin load',
				code: `// Exercise: simulate a CDN edge cache. Predict how many requests reach the origin with TTL 10 vs TTL 60. Then run.
function simulate(ttl) {
  const cache = new Map(); // key -> expiresAt
  let origin = 0, hits = 0;
  for (let t = 0; t < 300; t++) {          // one request per second for 300 seconds
    const key = '/img/' + (t % 3);         // three different files, requested in turn
    const exp = cache.get(key);
    if (exp !== undefined && exp > t) { hits++; continue; }
    origin++;
    cache.set(key, t + ttl);
  }
  return { ttl, origin, hits, hitRatio: (hits / 300).toFixed(2) };
}
console.log(simulate(10));
console.log(simulate(60));
// TODO: try ttl 0 and ttl 3600. What is the cost of a long TTL when the file changes? (Answer: stale files, so use versioned names.)`
			}
		]
	},
	{
		id: 'iv-docker-cicd',
		title: 'Docker and CI/CD',
		level: 'mid',
		summary: 'Containers, image builds, networking, pipelines, configuration, zero-downtime deploys and observability.',
		scenes: [],
		notes: md(`
**Q. What is the difference between an image and a container?** §SDE 1§
An image is a read-only, layered template holding the app and its dependencies. A container is a running instance of an image with a thin writable layer, its own process space and network. Many containers can run from one image, and data in the writable layer disappears when the container is removed.

**Q. How do image layers and the build cache work?** §SDE 1§
Each Dockerfile instruction creates a layer. Docker reuses a cached layer if the instruction and its inputs are unchanged, but once one layer changes every later layer rebuilds. So copy the dependency manifest and install first, and copy the source after:
§§§dockerfile
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
§§§
Add a §.dockerignore§ so §node_modules§ and §.git§ never enter the build context.

**Q. What is a multi-stage build and why use it?** §SDE 1§
You use several §FROM§ stages: a build stage with compilers and dev tools, and a final stage that copies in only the built output. The final image is smaller, starts faster and has less attack surface, and build tools never ship.

**Q. CMD versus ENTRYPOINT?** §SDE 1§
ENTRYPOINT sets the executable that always runs. CMD gives default arguments, which can be overridden on the command line. Use the exec form (§["node", "server.js"]§) so the app is PID 1 and receives stop signals directly.

**Q. Volumes versus bind mounts, and what is Docker Compose?** §SDE 1§
A volume is managed by Docker and is the right choice for persistent data such as a database. A bind mount maps a host folder, handy for live code in development. Compose describes several services, networks and volumes in one file and starts them with one command, which makes a good local environment.

**Q. How do containers talk to each other?** §SDE 1§
On a user-defined bridge network, which Compose creates, containers reach each other by service name through built-in DNS (§db:5432§). Ports are not reachable from the host unless published with §-p host:container§. A common bug is using §localhost§ inside a container to reach another service, because localhost is the container itself.

**Q. How do you handle configuration and secrets?** §SDE 1§
Follow twelve-factor: build one image and inject settings at run time with environment variables or mounted files. Never bake secrets into an image or commit them, because layers keep them forever. Use the platform secret store and rotate keys. Run as a non-root user.

**Q. What stages does a CI/CD pipeline have?** §SDE 1§
On each push: install, lint and type-check, unit tests, build the image, scan it, push it to a registry tagged with the commit SHA. Then deploy to staging, run smoke tests, and promote to production. CI is integrating and testing often; continuous delivery means every change is releasable; continuous deployment releases automatically.

**Q. How do you deploy with zero downtime?** §SDE 2§
Run several instances behind a load balancer and replace them gradually (rolling), or stand up a full new environment and switch traffic (blue-green), or send a small percentage first (canary). The load balancer only sends traffic to instances that pass a readiness check. On shutdown, handle SIGTERM: stop accepting new requests, finish in-flight ones, then exit.
Follow-up: how do you roll back? Redeploy the previous image tag, or switch traffic back in blue-green. Never rebuild.

**Q. How do database migrations fit into zero-downtime deploys?** §SDE 2§
Old and new code run together during a rollout, so each migration must work with both versions. Use expand and contract: add the new column (nullable), deploy code that writes both, backfill, switch reads, and drop the old column in a later release. Do not rename or drop in the same release that stops using it.

**Q. How do you make builds fast and reliable?** §SDE 2§
Cache dependencies and layers, run independent jobs in parallel, pin base image versions and lockfiles for reproducible builds, and fail early with the cheap checks first. Flaky tests need fixing or quarantining, because a pipeline nobody trusts gets bypassed.

**Q. How do you observe a service in production?** §SDE 2§
Three signals: logs (structured, with a request id), metrics (rate, errors, duration) and traces across services. Add a liveness probe (restart if stuck) and a readiness probe (take out of rotation). Alert on user impact, such as error rate or latency against a target, not on every CPU spike.
Follow-up: what does a good alert look like? It is actionable, links to a runbook, and fires when users are hurt.

**What interviewers look for:** a pipeline you have actually run, the reasons behind each step, safe rollbacks, and a habit of measuring before and after a change.
`),
		try: [
			{
				label: 'Exercise: Docker layer cache',
				code: `// Exercise: a step is rebuilt if its own input changed OR any earlier step was rebuilt.
// The developer changed one source file. Count rebuilt steps for each Dockerfile order.
function rebuilt(steps, changedInputs) {
  let dirty = false, count = 0;
  for (const s of steps) {
    if (dirty || changedInputs.includes(s.input)) { dirty = true; count++; }
  }
  return count;
}

const slowOrder = [
  { run: 'COPY . .', input: 'src' },
  { run: 'RUN install', input: 'package.json' },
  { run: 'RUN build', input: 'src' },
];
console.log('copy-everything-first rebuilds:', rebuilt(slowOrder, ['src']), 'steps');

// TODO: reorder the steps so install comes before the source copy and the install step is not rebuilt.
const fastOrder = slowOrder;
console.log('deps-first rebuilds:', rebuilt(fastOrder, ['src']), 'steps (goal: 2)');`
			},
			{
				label: 'Exercise: rolling deploy with health check',
				code: `// Exercise: roll out a new version one instance at a time. Stop if the new instance is unhealthy.
const instances = ['a', 'b', 'c', 'd'].map((name) => ({ name, version: 1, healthy: true }));
const newVersionIsHealthy = (step) => step < 2;   // the third new instance fails its readiness check

for (let i = 0; i < instances.length; i++) {
  const live = instances.filter((x) => x.healthy).length;
  const candidate = { version: 2, healthy: newVersionIsHealthy(i) };
  // TODO: if the candidate is not healthy, print 'halt, rolling back at step' and the step, and break out of the loop.
  instances[i].version = candidate.version;
  instances[i].healthy = candidate.healthy;
  console.log('step', i, 'live before:', live);
}
console.log(instances.map((x) => x.name + ':v' + x.version + (x.healthy ? '' : ' (unhealthy)')).join(' '));
console.log('goal: stop with a and b on v2, c and d still on v1 and healthy');`
			},
			{
				label: 'Exercise: canary traffic split',
				code: `// Exercise: send 10 percent of requests to the canary version. Predict how many of 50 requests it gets. Then run.
// A stable, deterministic split: hash the user id so the same user always gets the same version.
const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h; };
const route = (userId, percent) => (hash(userId) % 100 < percent ? 'canary' : 'stable');

const users = Array.from({ length: 50 }, (_, i) => 'user-' + i);
const counts = { canary: 0, stable: 0 };
for (const u of users) counts[route(u, 10)]++;
console.log(counts);
console.log('same user twice:', route('user-7', 10), route('user-7', 10));
// TODO: raise the percent to 50, then add a rule that sends everyone to stable if the canary error rate (pass it in) is above 2 percent.`
			}
		]
	}
];

// ───────────────────────────── quiz ─────────────────────────────

const t = (topic: string) => builder('IV', topic);

// ── SQL and query optimization ──
const sql = t('iv-sql-optimization');

sql.add('basic', 'joins',
	"A query is: SELECT c.name, o.id FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.status = 'paid'. Customers with no orders are missing from the result. Why?",
	"The WHERE filter on o.status removes the NULL rows the LEFT JOIN produced, so it acts like an INNER JOIN",
	["LEFT JOIN only returns rows that exist on both sides, the same as INNER JOIN does",
	 "The ON clause runs after WHERE, so the unmatched rows are already gone before the join",
	 "Customers without orders are dropped because the database always applies DISTINCT to a LEFT JOIN"],
	"For a customer with no orders the right side is all NULL, and NULL = 'paid' is not true, so WHERE drops that row. Move the condition into ON (AND o.status = 'paid') to keep those customers. LEFT JOIN does keep unmatched left rows, WHERE runs after the join, and there is no automatic DISTINCT.");

sql.add('basic', 'grouping',
	"You need customers with more than 5 orders. Which is correct?",
	"GROUP BY customer_id HAVING COUNT(*) > 5",
	["WHERE COUNT(*) > 5 GROUP BY customer_id",
	 "GROUP BY customer_id WHERE COUNT(*) > 5",
	 "HAVING COUNT(*) > 5 before the GROUP BY clause"],
	"Aggregates exist only after grouping, so the condition belongs in HAVING, which comes after GROUP BY. WHERE runs on individual rows before grouping and cannot use COUNT(*), and the clause order in SQL is fixed: GROUP BY, then HAVING.");

sql.add('basic', 'indexes',
	"Why not add an index to every column of a busy table?",
	"Every insert, update and delete must also maintain each index, and indexes cost storage and memory",
	["Databases allow only one index per table, so extra ones are ignored",
	 "Indexes make reads slower, because the database has to read the index first and then the table",
	 "More than three indexes on a table makes the primary key stop working"],
	"An index speeds up reads on its columns but adds work to every write and takes space, so you index what queries filter, join and sort on. A table can have many indexes, a useful index makes reads faster, and the number of indexes has no effect on the primary key.");

sql.add('basic', 'composite-index',
	"There is an index on (country, city, created_at). Which query can use it best?",
	"WHERE country = 'IN' AND city = 'Pune' ORDER BY created_at",
	["WHERE city = 'Pune' ORDER BY created_at",
	 "WHERE created_at > '2025-01-01' AND city = 'Pune'",
	 "WHERE city = 'Pune' AND country LIKE '%a'"],
	"A composite index is sorted by its first column, then the second within it, so it needs a leftmost prefix. Equality on country and city leaves the rows already ordered by created_at. The other filters skip country or use a leading wildcard, so the index cannot narrow the search the same way.");

sql.add('basic', 'second-highest',
	"Which query returns the second highest distinct salary and still works when two people share the top salary?",
	"SELECT MAX(salary) FROM emp WHERE salary < (SELECT MAX(salary) FROM emp)",
	["SELECT salary FROM emp ORDER BY salary DESC LIMIT 1 OFFSET 1",
	 "SELECT MIN(salary) FROM emp WHERE salary > 0",
	 "SELECT salary FROM emp GROUP BY salary HAVING COUNT(*) = 2"],
	"The subquery finds the top salary and the outer query takes the highest value below it, so ties at the top do not matter. LIMIT 1 OFFSET 1 over all rows would return the top salary again when two people share it, unless you add DISTINCT. MIN and the HAVING query answer different questions.");

sql.add('basic', 'normalization',
	"A table stores order_id, customer_id, customer_email and customer_city, and the email changes often. Which problem does normalizing it solve?",
	"The update anomaly: the email is repeated on many rows and one missed row leaves the data inconsistent",
	["Normalizing makes every query faster, because fewer tables are always quicker to read",
	 "Normalizing removes the need for primary keys, because the data is no longer repeated",
	 "The insert limit: a table may hold only one row per customer"],
	"Customer facts depend on the customer, not the order, so they should live in a customers table and be updated once. Normalizing usually adds joins, so reads can get slower, which is why you denormalize on purpose for hot read paths. Keys are still required, and nothing limits rows per customer.");

sql.add('basic', 'acid',
	"A transfer debits one account and credits another, and the server crashes between the two steps. Which property makes the database undo the debit?",
	"Atomicity: the transaction is all or nothing",
	["Durability: committed data survives a crash, so the debit stays",
	 "Isolation: other transactions cannot see the half-finished transfer, so they undo it",
	 "Consistency: the database refuses any state where the debit exists"],
	"Atomicity means a transaction is applied fully or not at all, so an unfinished transfer is rolled back. Durability concerns committed work only, isolation hides intermediate states from others but does not undo them, and consistency is about constraints holding, not about rolling back crashed work.");

sql.add('advanced', 'explain',
	"EXPLAIN shows a full table scan with an estimated 100 rows, but the query really reads 5 million rows. What is the most likely cause?",
	"Stale table statistics, so the optimizer is working from wrong row estimates",
	["The index is too large to fit on disk, so the optimizer ignores it",
	 "The query has too few columns in SELECT for the optimizer to choose a plan",
	 "The plan is correct, because EXPLAIN always shows the real row count"],
	"The optimizer plans from stored statistics, so a large gap between estimated and actual rows (visible with EXPLAIN ANALYZE) usually means the statistics are out of date and need refreshing (ANALYZE TABLE). EXPLAIN shows estimates, not real counts. The number of selected columns does not decide the plan this way, and index size on disk is not the issue here.");

sql.add('advanced', 'n-plus-one',
	"An API endpoint loads 50 posts and then runs one query per post for its author. What is the best fix?",
	"Fetch the authors in one query with WHERE id IN (...) or a JOIN, then attach them in memory",
	["Add a bigger connection pool so the 51 queries run in parallel",
	 "Cache the endpoint result forever, so the queries happen only once",
	 "Index the posts table on every column to speed up each of the author queries"],
	"The cost is the number of round trips, which grows with the list size. Batching reduces 51 queries to 2 whatever the page size. A bigger pool still makes 51 queries and loads the database harder, a permanent cache serves stale data and hides the problem, and indexing posts does not change the per-post lookups.");

sql.add('advanced', 'window-functions',
	"Scores are 90, 80, 80, 70. What does RANK() OVER (ORDER BY score DESC) return for the row with 70?",
	"4, because RANK leaves a gap after the tie",
	["3, because RANK never leaves gaps",
	 "2, because RANK counts only distinct scores before it",
	 "1, because RANK restarts at every change in value"],
	"RANK gives tied rows the same number and then skips ahead by the size of the tie: 1, 2, 2, 4. DENSE_RANK would give 1, 2, 2, 3, which is the answer if you thought gaps never happen. ROW_NUMBER would give 1, 2, 3, 4. Neither function restarts at every value change.");

sql.add('advanced', 'isolation',
	"A report runs twice inside one transaction and the second run shows a row committed by another transaction in between. Which isolation level allows this?",
	"READ COMMITTED, because each statement sees the latest committed data",
	["REPEATABLE READ, because it always shows the newest committed rows",
	 "SERIALIZABLE, because it lets other transactions commit in the middle",
	 "No level allows it, because a transaction always sees a fixed snapshot"],
	"READ COMMITTED takes a fresh view for each statement, so a non-repeatable read or a phantom is possible. REPEATABLE READ keeps the first snapshot (in InnoDB), and SERIALIZABLE is stricter still. The snapshot-for-the-whole-transaction behaviour is not universal, it depends on the level.");

sql.add('advanced', 'deadlocks',
	"Two transactions update rows A and B, one in the order A then B and the other B then A, and they deadlock. What is the standard prevention?",
	"Touch rows in the same order in every transaction, keep transactions short, and retry the one that is aborted",
	["Raise the isolation level to SERIALIZABLE, which makes deadlocks impossible",
	 "Disable the lock timeout, so each transaction waits as long as it needs",
	 "Run each statement in its own connection, so no transaction holds two locks"],
	"A deadlock needs a cycle of waits, so a consistent lock order removes the cycle, short transactions shrink the window, and the application retries the victim the database aborts. SERIALIZABLE usually adds more locking, waiting forever makes the hang permanent, and splitting a transaction across connections breaks atomicity.");

sql.add('advanced', 'pagination',
	"Page 5000 of a list using OFFSET 100000 LIMIT 20 is slow even with an index on the sort column. What is better?",
	"Keyset pagination: WHERE id > :last_seen_id ORDER BY id LIMIT 20",
	["Increase LIMIT to 1000 so fewer pages are needed",
	 "Add another index on the same column, so the database can pick the faster one",
	 "Sort in the application instead, so the database only reads the rows"],
	"With OFFSET the database still walks and discards the first 100000 rows, so cost grows with the page number. Keyset pagination jumps straight to the right place using the index, so cost stays flat. A larger LIMIT does not remove the skipped rows, a duplicate index adds nothing, and sorting in the application means reading far more data.");

// ── MySQL and MongoDB ──
const mm = t('iv-mysql-mongo');

mm.add('basic', 'choosing',
	"Which workload is the strongest fit for MySQL rather than MongoDB?",
	"Orders, payments and inventory that need multi-row transactions, constraints and joins",
	["A product catalog where every product has different, changing attributes",
	 "Storing raw event payloads whose shape changes with every release",
	 "Caching a few large documents that are always read and written as a whole"],
	"Strong relationships, foreign keys and multi-row transactions are what a relational database is built for. The other three describe flexible, document-shaped data that is read whole, which suits a document store. Many systems use both, picking per workload.");

mm.add('basic', 'innodb',
	"Which feature does InnoDB provide that the older MyISAM engine does not?",
	"Transactions with row-level locking and crash recovery",
	["Full-text search, which only InnoDB has ever supported",
	 "Tables without a primary key, which MyISAM forbids",
	 "Compatibility with the SQL language, which MyISAM lacks"],
	"InnoDB offers ACID transactions, row-level locks, foreign keys and crash recovery, so it is the default. MyISAM locks whole tables and has no transactions. Both accept normal SQL, and a table can exist without an explicit primary key in either engine.");

mm.add('basic', 'clustered-index',
	"In InnoDB, why does a very wide primary key make the table slower and larger?",
	"Every secondary index stores a copy of the primary key as its row pointer",
	["The primary key is stored once per row in a separate file, which doubles reads",
	 "InnoDB must sort the whole table again after every insert",
	 "Wide keys are not allowed, so InnoDB silently truncates them"],
	"The table is stored in primary key order, and each secondary index entry holds the primary key value to find the full row. A wide key is therefore copied into every secondary index. There is no separate key file, it does not re-sort the table on each insert (though random keys cause page splits), and long keys are stored, not truncated.");

mm.add('basic', 'embedding',
	"An order has up to 10 line items that are always read with it. How should it be modelled in MongoDB?",
	"Embed the line items as an array inside the order document",
	["Store each line item in its own collection and look them up on every read",
	 "Store all orders in one single document so reads are fast",
	 "Keep line items in a separate database, so the order document stays small"],
	"Bounded child data that is read together with its parent belongs inside the parent: one read, one atomic write. Separate collections add lookups for no gain, and one giant document hits the 16 MB limit. Reference instead when the children are unbounded or shared.");

mm.add('basic', 'esr-rule',
	"A query filters on status = 'paid', sorts by createdAt, and has a range on amount. What is the best compound index order?",
	"status, createdAt, amount",
	["amount, createdAt, status",
	 "createdAt, amount, status",
	 "amount, status, createdAt"],
	"The Equality, Sort, Range rule: equality fields first, then the sort field, then range fields. That way the index narrows by status, returns rows already sorted by createdAt, and only then scans the amount range. Putting the range first breaks the sort order for the rest of the index.");

mm.add('basic', 'aggregation',
	"Why should $match come early in an aggregation pipeline?",
	"It can use an index and reduces the number of documents the later stages must process",
	["Because stages run in alphabetical order, so $match must come first",
	 "Because $match is required to start every pipeline or it returns an error",
	 "Because $group can only read documents that were filtered by $match"],
	"Filtering first shrinks the stream, and a leading $match can use an index. Stages run in the order you write them, a pipeline works without $match, and $group accepts any input. The same idea applies to $limit and to filtering before a join.");

mm.add('advanced', 'lookup',
	"A feature runs $lookup on every read of a large collection and is slow. What is the likely design lesson?",
	"The model is probably wrong: embed the data or duplicate the few fields that are read together",
	["Replace $lookup with a second $lookup, which the database optimizes better",
	 "Move the whole collection to a larger instance and keep the design as it is",
	 "Convert every field to a string, so the lookup compares faster"],
	"$lookup runs per document and needs an index on the foreign field, so reading across collections on every request defeats the document model. Embedding or duplicating rarely-changing fields turns it into a single read. Hardware only delays the problem, and field types are not the cause.");

mm.add('advanced', 'replication',
	"A user saves a profile and the next page, served by a read replica, shows the old data. What explains it, and what is a fix?",
	"Asynchronous replication lag. Read from the primary for that user for a short time after a write",
	["Replicas are always exact copies, so the old data must come from the browser cache only",
	 "The primary rolled back the write. Retry the write until the replica agrees",
	 "Replicas ignore writes made in the last hour. Wait an hour before reading"],
	"Most replicas apply changes after the primary has committed, so a read right after a write can miss it. Routing the user's reads to the primary for a short window (or using causal consistency in MongoDB) gives read-your-writes. It is not a rollback, there is no fixed one-hour rule, and browser cache is not the only possible cause.");

mm.add('advanced', 'write-concern',
	"In a MongoDB replica set, what protects an acknowledged write from being lost when the primary fails?",
	"Write concern majority, so the write is on most members before it is acknowledged",
	["Write concern 1, because the primary has the data and will recover it",
	 "Adding more indexes, which are replicated before the data is",
	 "Running the aggregation pipeline after the write, which pins it"],
	"With w: majority the write is stored on most voting members, so any newly elected primary has it. With w: 1 only the old primary has it, and if it fails before replicating, the new primary may not have the write and it is rolled back. Indexes and aggregations do not affect durability.");

mm.add('advanced', 'shard-key',
	"Why is a timestamp or auto-increment id a poor shard key for range-based sharding?",
	"All new writes go to the single shard that holds the highest range, creating a hot shard",
	["Timestamps cannot be compared across machines, so ranges are impossible",
	 "Sharded collections reject numeric keys, so the insert fails",
	 "Every query becomes a full scan of all shards, but writes are spread evenly"],
	"New values are always the largest, so they all land in the last chunk on one shard, which becomes the bottleneck while others sit idle. A hashed key spreads writes at the cost of scattering range queries. Numbers and timestamps are valid keys, and the problem here is hot writes, not even writes.");

mm.add('advanced', 'transactions',
	"What is the best approach for atomic updates in MongoDB when you can design the schema?",
	"Model related fields in one document, because a single-document write is already atomic",
	["Always wrap every write in a multi-document transaction for safety",
	 "Avoid atomicity entirely, because MongoDB cannot provide it",
	 "Split the data into as many collections as possible so locks stay small"],
	"A write to one document is atomic, so keeping data that changes together in one document avoids the cost of multi-document transactions, which exist but hold locks and slow things down. Splitting data across collections makes atomicity harder, not easier, and the claim that MongoDB has no atomicity is wrong.");

mm.add('advanced', 'online-migration',
	"You must rename a heavily used column in MySQL with no downtime. Which plan is safest?",
	"Add the new column, write to both, backfill in batches, switch reads, then drop the old one in a later release",
	["Run ALTER TABLE RENAME COLUMN during peak traffic and restart the app afterwards",
	 "Take the site offline overnight, rename it, and deploy everything at once",
	 "Rename it in the database first, and the old code will adapt automatically"],
	"During a rollout old and new code run at the same time, so both must work with the schema at each step. Expand and contract keeps that true. A direct rename breaks the running old version, and code does not adapt to a renamed column by itself. An offline window is the downtime you set out to avoid.");

// ── AWS ──
const aws = t('iv-aws');

aws.add('basic', 's3-uploads',
	"What is the recommended way to let a browser upload a large file to a private S3 bucket?",
	"Your backend creates a short-lived presigned URL for one key, and the browser uploads straight to S3",
	["Make the bucket public for writes, so the browser can upload to it",
	 "Embed your AWS access keys in the front-end code",
	 "Send the file to your server first so it can forward the bytes"],
	"A presigned URL grants one action on one object for a short time, without exposing credentials, and the bytes skip your servers. A public write bucket lets anyone upload, keys in front-end code can be stolen, and proxying large files through your server wastes bandwidth and compute.");

aws.add('basic', 'iam-roles',
	"An EC2 instance needs to read objects from one S3 bucket. What is the best setup?",
	"Attach an IAM role with s3:GetObject on that bucket to the instance",
	["Store an administrator user's access keys in an environment file on the instance",
	 "Give the instance the AdministratorAccess policy, so it never hits a permission error",
	 "Make the bucket public, so no credentials are needed"],
	"A role gives the instance temporary credentials that rotate automatically, and limiting it to one action on one bucket is least privilege. Long-lived admin keys can leak and do far more damage, AdministratorAccess breaks least privilege, and a public bucket exposes the data to everyone.");

aws.add('basic', 'iam-evaluation',
	"One IAM policy allows s3:* on a bucket, and another attached policy explicitly denies s3:DeleteObject on it. Can the user delete an object?",
	"No, an explicit Deny always overrides any Allow",
	["Yes, the broader Allow wins because it is more general",
	 "Yes, whichever policy was attached last takes effect",
	 "No, but only if both policies were attached to the same group rather than to the user"],
	"Evaluation starts from deny, an Allow grants access, and any matching explicit Deny wins over every Allow. Policy order and breadth do not matter, and region has no role here.");

aws.add('basic', 'compute-choice',
	"A job runs for about 30 seconds a few times an hour in response to file uploads. Which compute choice fits best?",
	"Lambda triggered by the S3 event, because it is event-driven and you pay only while it runs",
	["A large EC2 instance running all day, to keep the job fast",
	 "A Fargate service with ten always-on containers",
	 "A reserved EC2 instance, because reservations remove the need to scale"],
	"Sporadic, short, event-driven work is the textbook Lambda case: nothing to run when idle and no servers to manage. Always-on EC2 or Fargate capacity would sit idle most of the time and cost more. Reserved pricing helps with steady load, not rare jobs.");

aws.add('basic', 'cold-start',
	"Which change reduces Lambda cold start impact on a latency-sensitive endpoint?",
	"Use provisioned concurrency and create SDK clients outside the handler",
	["Increase the function timeout to 15 minutes",
	 "Import every library inside the handler, so they load only when needed",
	 "Deploy a larger zip with all possible dependencies, so nothing is fetched later"],
	"Provisioned concurrency keeps environments initialised, and creating clients outside the handler lets warm invocations reuse them. A longer timeout does not change startup time, and a bigger package makes cold starts slower. Lazy imports can help in some cases but putting them inside the handler repeats work on warm calls if done carelessly.");

aws.add('basic', 'cloudfront',
	"You deploy a new app.js and users still get the old file from CloudFront. What is the better long-term fix than invalidating every time?",
	"Put a content hash in the file name (app.3f9a.js) and give old names long cache lifetimes",
	["Set the cache TTL to zero for all files, so nothing is cached",
	 "Ask users to clear their browser cache after each release",
	 "Disable CloudFront for static files and serve them from the application server"],
	"A new file name is a new cache key, so the new version is fetched at once while old names stay cached safely. Zero TTL gives up the main benefit of a CDN, users cannot be relied on to clear caches, and serving static files from the app moves load back to your servers.");

aws.add('advanced', 'rds-ha',
	"What is the main difference between RDS Multi-AZ and a read replica?",
	"Multi-AZ keeps a standby for failover and availability, and a read replica copies data to scale reads",
	["Multi-AZ scales reads across zones, and a read replica is only a backup",
	 "They are the same feature with different names in different regions",
	 "A read replica gives automatic failover with zero data loss, and Multi-AZ does not"],
	"Multi-AZ is about availability: a standby in another zone takes over when the primary fails. Read replicas serve extra read traffic and are asynchronous, so they can lag. They are separate features that are often combined, and a replica is not a zero-loss failover target.");

aws.add('advanced', 'sqs-duplicates',
	"A standard SQS queue delivered the same payment message twice and the customer was charged twice. What is the right design fix?",
	"Make the consumer idempotent, for example by recording processed message or payment ids",
	["Switch to SNS, which never delivers a message twice",
	 "Lower the visibility timeout to zero, so duplicates are hidden",
	 "Add more consumers, so that one of them rejects the duplicate"],
	"Standard queues guarantee at-least-once delivery, so a consumer must tolerate repeats, and an idempotency check makes a second delivery harmless. SNS also may deliver more than once, a zero visibility timeout actually causes more repeated delivery, and more consumers do not remove duplicates on their own.");

aws.add('advanced', 'dlq',
	"A message keeps failing and is retried forever, blocking the logs with errors. What should you configure?",
	"A dead-letter queue with a maximum receive count, so poison messages are moved aside for inspection",
	["A longer retention period, so the message eventually expires on its own",
	 "A FIFO queue, because FIFO queues drop messages that fail",
	 "An SNS topic in front, because topics delete failing messages"],
	"After the set number of failed receives, SQS moves the message to a dead-letter queue, where you can inspect and replay it. Long retention only keeps the bad message for longer, FIFO queues do not drop failed messages, and SNS does not remove them either.");

aws.add('advanced', 'vpc-subnets',
	"Which layout is the common secure design for a web application in a VPC?",
	"Load balancer in public subnets, app servers and database in private subnets across two zones",
	["Everything in public subnets with public IPs, protected by a strong password",
	 "The database in a public subnet, so developers can connect from home",
	 "All instances in one subnet in one zone, to keep latency low"],
	"Only the load balancer needs to be reachable from the internet. App servers and databases stay private and reach out through a NAT gateway if needed, and using two zones survives the loss of one. Public databases and single-zone designs are the classic mistakes.");

aws.add('advanced', 'security-groups',
	"What is the key difference between a security group and a network ACL?",
	"A security group is stateful and allow-only, and a network ACL is stateless and supports allow and deny rules",
	["A security group is stateless and a network ACL is stateful",
	 "A security group is attached to a subnet and a network ACL to an instance",
	 "Both are stateful, and the only difference is their price"],
	"Security groups remember connections, so return traffic is automatically allowed, and they attach to instances or network interfaces. Network ACLs attach to subnets, treat each packet separately (you must allow replies) and can deny. The first wrong option reverses the two, and neither costs anything.");

aws.add('advanced', 'cost',
	"A private app's AWS bill jumped, and Cost Explorer shows NAT gateway data processing as the top item. Which change usually helps most?",
	"Add VPC endpoints so S3 and similar traffic stays inside AWS instead of going through the NAT gateway",
	["Move the NAT gateway to a public subnet, which makes it free",
	 "Turn on S3 versioning, which compresses transfers",
	 "Increase the instance size, so it makes fewer network calls"],
	"NAT gateways charge per gigabyte processed, and heavy traffic to S3 or DynamoDB can go through a gateway endpoint instead, which avoids that charge. Subnet placement does not remove the fee, versioning does not compress anything, and a larger instance does not reduce the data it moves.");

// ── Docker and CI/CD ──
const dk = t('iv-docker-cicd');

dk.add('basic', 'image-vs-container',
	"What is the relationship between a Docker image and a container?",
	"A container is a running instance of an image with a thin writable layer on top",
	["An image is a running container that has been paused",
	 "A container is a stored file, and an image is the process that runs it",
	 "Each image can start only one container at a time"],
	"The image is the read-only template, and every container started from it adds its own writable layer, which is lost when the container is removed. Many containers can run from the same image at once.");

dk.add('basic', 'layer-cache',
	"A Dockerfile starts with COPY . . and then runs the dependency install. Every small code change reinstalls everything. What is the fix?",
	"Copy only the dependency manifest and install first, then copy the rest of the source",
	["Run the install twice, so the second run is cached",
	 "Add more RUN lines, because more layers are always cached better",
	 "Delete the .dockerignore file so Docker can see all files"],
	"A layer is rebuilt when its inputs change, and then so is every layer after it. Copying the manifest first means the install layer only changes when the dependencies change. More layers do not help by themselves, and removing .dockerignore sends more files into the build context, making things worse.");

dk.add('basic', 'multi-stage',
	"What is the main benefit of a multi-stage Docker build?",
	"The final image holds only the built output, so it is smaller and has less attack surface",
	["It makes the build run in parallel on several machines automatically",
	 "It lets one container run several different images at once",
	 "It encrypts the layers so secrets in them cannot be read"],
	"Compilers and dev dependencies stay in the build stage and only the artifacts are copied into the last stage. It does not distribute the build, and a container runs one image. Layers are not encrypted, so secrets copied into any shipped layer remain readable.");

dk.add('basic', 'entrypoint',
	"Why is the exec form CMD [\"node\", \"server.js\"] preferred over the shell form CMD node server.js?",
	"The app runs as PID 1 and receives stop signals such as SIGTERM directly",
	["The exec form starts the app faster by skipping the image layers",
	 "The shell form is deprecated and no longer runs",
	 "The exec form lets the container use more memory"],
	"The shell form wraps the command in a shell that may not forward signals, so a graceful shutdown never happens and docker stop waits and then kills the process. Both forms run, and neither changes memory limits or layer loading.");

dk.add('basic', 'networking',
	"In Docker Compose, a web service cannot reach the database using localhost:5432. What should it use?",
	"The service name, such as db:5432, because containers on the same network resolve each other by name",
	["The host machine's public IP address, which always works inside containers",
	 "localhost, but only after the port is published with -p",
	 "The image name of the database, such as postgres:16"],
	"Inside a container, localhost means that container itself. Compose puts services on a shared network with DNS, so the service name resolves to the right container. Publishing ports is for access from the host, and the image name is not a network address.");

dk.add('basic', 'secrets',
	"A developer uses ARG or COPY to put an API key into the image and deletes it in a later layer. Is the secret safe?",
	"No, the earlier layer still contains it and anyone with the image can extract it",
	["Yes, deleting a file in a later layer removes it from the image completely",
	 "Yes, because images are encrypted by default",
	 "Yes, but only when the image is pushed to a private registry"],
	"Layers are stacked and immutable, so a deleted file is only hidden in the final view, and the earlier layer keeps the bytes. Inject secrets at run time or use build-time secret mounts. Images are not encrypted, and a private registry still means anyone with access can read the secret.");

dk.add('basic', 'pipeline',
	"Which order is most sensible for a CI pipeline on every push?",
	"Install, lint and type-check, unit tests, build image, push to registry tagged with the commit SHA",
	["Build and push the image, then deploy, and only then run the tests",
	 "Run the slowest end-to-end tests first, and the linter last",
	 "Tag every image latest, so the pipeline does not need to know the commit"],
	"Cheap checks first give fast feedback, and an image should only be built and published after the code passed. A commit SHA tag makes each image traceable and a rollback exact. Testing after deploying ships unchecked code, and latest hides which version is running.");

dk.add('advanced', 'zero-downtime',
	"What lets a rolling deployment avoid dropping requests?",
	"A readiness check so the load balancer only sends traffic to ready instances, plus graceful shutdown on SIGTERM",
	["Stopping all old instances first, then starting new ones as fast as possible",
	 "A larger instance type, so deploys finish faster than users notice",
	 "Disabling health checks so instances are never taken out of rotation"],
	"New instances receive traffic only after they report ready, and old ones finish in-flight requests before exiting. Stopping everything first is downtime by definition, bigger servers only shorten it, and disabling health checks sends traffic to instances that are not ready.");

dk.add('advanced', 'rollback',
	"A bad release is live. What is the fastest safe rollback in a well-built pipeline?",
	"Redeploy the previous image tag, or switch the traffic back to the previous environment",
	["Rebuild the old commit from scratch and hope the dependencies have not changed",
	 "Edit the files on the running servers by hand",
	 "Delete the registry so the new image can no longer be pulled"],
	"Immutable images tagged per commit mean the previous version already exists and can be redeployed in minutes, or traffic can simply move back in a blue-green setup. Rebuilding can pick up different dependencies, hand edits are untracked and lost on restart, and deleting the registry breaks every deploy.");

dk.add('advanced', 'expand-contract',
	"During a rolling deploy old and new code run together. How should you rename a database column?",
	"Expand and contract: add the new column, write both, backfill, switch reads, and drop the old column in a later release",
	["Rename it in the same release that deploys the new code, so they match",
	 "Drop the old column first, so the new code is forced to use the new one",
	 "Rename it manually while the deployment is in progress"],
	"At every step both code versions must work with the schema, which a direct rename or drop breaks for the version still running. Spreading the change over releases keeps each step reversible. Doing it by hand during a rollout is a race.");

dk.add('advanced', 'canary',
	"What is the point of a canary release?",
	"Send a small share of traffic to the new version, watch errors and latency, and expand only if it is healthy",
	["Deploy to every user at once, but at night",
	 "Run the tests twice before deploying",
	 "Keep two copies of the database so the new version cannot break anything"],
	"A canary limits the blast radius: only a few users see a bad release, and the metrics show it before everyone does. Releasing to everyone at night is still a big-bang release, running tests twice does not test real traffic, and a second database copy does not address application bugs.");

dk.add('advanced', 'observability',
	"Which alert is best for an on-call engineer?",
	"Error rate above the agreed target for five minutes, with a link to a runbook",
	["CPU above 70 percent for one second on any host",
	 "Every log line that contains the word error",
	 "A daily email of all the metrics, with no thresholds"],
	"Good alerts are tied to user impact, require action, and say what to do next. Brief CPU spikes and every error line create noise that teaches people to ignore pages, and a metrics email is a report, not an alert.");

export const banks: { out: Question[] }[] = [sql, mm, aws, dk];
