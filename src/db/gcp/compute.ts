import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Google Cloud compute, data and messaging for a generic online store. Facts were checked against the Google Cloud documentation (docs.cloud.google.com);
// no prices and no fast-changing quotas are stated as facts. `try` snippets are plain deterministic JavaScript for the playground: they model the idea,
// they do not call Google Cloud. They use String.raw; keep backticks and the dollar-brace sequence out.
export const topics: DbTopic[] = [
	{
		id: 'gcp-cloud-run',
		title: 'Cloud Run',
		level: 'mid',
		summary: 'Deploy containers as services and jobs, and understand revisions, traffic splitting, scale to zero, concurrency and the two billing modes.',
		scenes: ['gc-run-revisions', 'gc-run-scaling', 'gc-run-job-vs-service'],
		notes: md(
			'**Cloud Run** runs containers without servers to manage. A **service** listens for web requests. Every deploy creates a new **revision**, a frozen copy of the code and its settings, and traffic is routed to revisions by percentage (the percentages add up to 100).',
			'',
			'- **Rollout and rollback:** deploy with no traffic, send 5% to the new revision, then raise it. A rollback is one change: send 100% to an older revision. It takes effect at once, and Cloud Run does not re-check that revision first. A **tag** gives a revision its own test URL with no production traffic.',
			'- **Scaling:** instances are added as requests arrive and removed when they stop. The minimum defaults to 0, so an idle service **scales to zero**, and the first request after that pays a **cold start** while a container boots. **Minimum instances** keep some warm; they are billed and are a best-effort target.',
			'- **Concurrency:** how many requests one instance handles at once. Created in the console it defaults to 80 (the gcloud default is 80 per vCPU) and the maximum is 1,000. Higher concurrency means fewer instances for the same load, so the code must be safe for parallel requests.',
			'- **Billing mode:** with **request-based** billing (the default) CPU is only allocated while a request is being processed, so work after the response is sent gets no CPU. **Instance-based** billing keeps CPU for the whole life of the instance and suits background work.',
			'- **Jobs:** a **job** runs its tasks to the end and stops. It serves no HTTP. Use it for batch work such as a nightly order export.',
			'',
			'```js',
			'// instances needed = requests in flight / concurrency',
			'const inFlight = 200 * 0.5; // 200 requests a second, 0.5 s each',
			'console.log(Math.ceil(inFlight / 80)); // 2',
			'```',
			'',
			'**Common trap:** starting background work after returning the response. With request-based billing the CPU is throttled, so that work stalls.'
		),
		try: [
			{
				label: 'How many instances for a load?',
				code: String.raw`// instances needed = requests in flight / concurrency, rounded up
function instances(rps, seconds, concurrency) {
  const inFlight = rps * seconds;
  return Math.ceil(inFlight / concurrency);
}
console.log('200 rps, 0.5 s each, concurrency 80  ->', instances(200, 0.5, 80), 'instances');
console.log('200 rps, 0.5 s each, concurrency 1   ->', instances(200, 0.5, 1), 'instances');
console.log('200 rps, 0.5 s each, concurrency 250 ->', instances(200, 0.5, 250), 'instance');`
			},
			{
				label: 'Splitting traffic between revisions',
				code: String.raw`// A 95/5 split, tried on 2000 pretend requests.
const split = [{ rev: 'api-00008', pct: 5 }, { rev: 'api-00007', pct: 95 }];
console.log('percentages add up to', split.reduce((n, r) => n + r.pct, 0));
let seed = 7;
const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
function pick() {
  let x = rand() * 100;
  for (const r of split) { if (x < r.pct) return r.rev; x -= r.pct; }
  return split[split.length - 1].rev;
}
const hits = {};
for (let i = 0; i < 2000; i++) { const r = pick(); hits[r] = (hits[r] || 0) + 1; }
console.log(hits);`
			}
		]
	},
	{
		id: 'gcp-artifact-and-build',
		title: 'Artifact Registry and Cloud Build',
		level: 'basic',
		summary: 'Follow an image from a git push to a Cloud Run revision, and know why a digest pins a deploy and a tag does not.',
		scenes: ['gc-build-pipeline', 'gc-tag-vs-digest'],
		notes: md(
			'**Artifact Registry** stores your container images and packages such as npm or Python. A **repository** lives in one region, and an image path looks like `us-west1-docker.pkg.dev/PROJECT/REPOSITORY/IMAGE:TAG`. Repositories can be standard (your own artifacts), remote (a cache of a public source) or virtual (several repositories behind one address).',
			'',
			'**Cloud Build** turns source into an image. A **trigger** starts a build on a push to a branch, a new tag, a pull request, or a manual run, and points at a build file such as `cloudbuild.yaml`. Each trigger names the **service account** its builds run as, so give that account only what the build needs: pushing images and deploying.',
			'',
			'**The path from a commit to a revision:** push, then the trigger fires, the build tests and builds the image, the image is pushed to Artifact Registry, and a last step deploys it to Cloud Run as a new revision.',
			'',
			'**Tag or digest?** A **tag** such as `v12` or `latest` is a label that can move: tagging a different image with a name already in use moves the tag to it. A **digest** (`sha256:...`) names exactly one image version. Deploy by digest when you need to know exactly what runs, and to roll back to the identical bytes. Docker applies `latest` if you give no tag.',
			'',
			'```sh',
			'# a digest pins the exact image',
			'gcloud run deploy store-api --image us-west1-docker.pkg.dev/PROJECT/store/api@sha256:...',
			'```',
			'',
			'**Common trap:** deploying `latest`. Two deploys of the same name can run different code, and "what is in production?" has no answer.'
		),
		try: [
			{
				label: 'A tag moves, a digest does not',
				code: String.raw`// Toy registry: a digest names exact content, a tag is a label that can move.
const hash = (s) => { let h = 5381; for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0; return 'sha256:' + h.toString(16).padStart(8, '0'); };
const images = {};
const tags = {};
function push(tag, content) { const d = hash(content); images[d] = content; tags[tag] = d; return d; }
const pinned = push('latest', 'storefront code at commit a1');
console.log('deploy by tag    ->', images[tags.latest]);
push('latest', 'storefront code at commit b2');
console.log('deploy by tag    ->', images[tags.latest], '(the tag moved)');
console.log('deploy by digest ->', images[pinned], '(still the same image)');`
			}
		]
	},
	{
		id: 'gcp-gke-and-compute-engine',
		title: 'GKE and Compute Engine',
		level: 'mid',
		summary: 'Know what a managed instance group does, how GKE Autopilot differs from Standard, and how to pick between Cloud Run, GKE and a VM.',
		scenes: ['gc-mig-autohealing', 'gc-gke-modes'],
		notes: md(
			'**Compute Engine** gives you virtual machines. You choose the machine, patch the operating system and install your software. A **managed instance group (MIG)** keeps many identical VMs built from one **instance template**. It **autoscales** on signals such as CPU or load-balancer capacity, **autoheals** by recreating a VM that fails its application health check, and does rolling updates. A regional MIG spreads its VMs over zones.',
			'',
			'**GKE** is managed Kubernetes. In **Autopilot** mode GKE manages the nodes and scaling, and applies guardrails such as blocking privileged Pods. Google recommends it for most workloads. In **Standard** mode you configure node pools and have fine control over the nodes. Autopilot clusters do not expose node pools.',
			'',
			'**How to choose** (a rule of thumb, not an official table):',
			'',
			'- A stateless web or API container: **Cloud Run** first. It is the least to operate.',
			'- Many services sharing a platform, or a need for Kubernetes features, sidecars or custom controllers: **GKE**, Autopilot unless you need node-level control.',
			'- A particular operating system setup, licensed software, or a lift-and-shift of an existing server: a **VM**, in a MIG if it must scale or heal.',
			'',
			'In GKE a **readiness probe** decides when a Pod starts receiving traffic, and an autoscaler adds Pods or nodes as load rises.',
			'',
			'**Common trap:** choosing Kubernetes for one small stateless API. You then own cluster upgrades, probes and quotas for little gain.'
		),
		try: [
			{
				label: 'Which compute service?',
				code: String.raw`// A rule-of-thumb chooser for the store's components.
function choose(app) {
  if (app.needsOsControl || app.licensedSoftware) return 'Compute Engine VM (a managed instance group if it must scale or heal)';
  if (app.needsKubernetesApi || app.manyServicesOnOnePlatform) return app.needsNodeControl ? 'GKE Standard' : 'GKE Autopilot';
  if (app.statelessHttpContainer) return 'Cloud Run';
  return 'talk it through first';
}
console.log('product API      ->', choose({ statelessHttpContainer: true }));
console.log('legacy ERP box   ->', choose({ licensedSoftware: true }));
console.log('20 services      ->', choose({ manyServicesOnOnePlatform: true }));
console.log('custom GPU nodes ->', choose({ needsKubernetesApi: true, needsNodeControl: true }));`
			}
		]
	},
	{
		id: 'gcp-functions-and-gateway',
		title: 'Cloud Run functions and API Gateway',
		level: 'mid',
		summary: 'Run small pieces of code on events or HTTP, keep backends private with the Cloud Run Invoker role, and put API Gateway in front of them.',
		scenes: ['gc-functions-event', 'gc-gateway-auth'],
		notes: md(
			'**Cloud Run functions** (the new name for Cloud Functions 2nd gen) take your source code, build it into a container and deploy it as a Cloud Run service. Compared with the 1st generation they allow longer HTTP timeouts, many requests per instance and traffic splitting.',
			'',
			'A function runs for one of two reasons: an **HTTP request**, or an **event**. Events arrive through **Eventarc**, which delivers them in the CloudEvents format: "an object was uploaded", "a message was published". In the store, an upload to a Cloud Storage bucket can start a function that makes thumbnails.',
			'',
			'**Who may call it?** Cloud Run services and functions are **private by default**. The caller needs the **Cloud Run Invoker** role (`roles/run.invoker`) and sends a Google-signed **ID token** as `Authorization: Bearer ...`. Allowing unauthenticated calls makes the service public, which suits a public website and little else.',
			'',
			'**API Gateway** gives several backends one consistent REST front door. You describe the API in an **OpenAPI 2.0** file, deploy it as an **API config** to a gateway, and choose how callers authenticate: API keys, service accounts or Google ID tokens. The config also names a **backend service account** that signs the tokens used to call the backend, so that account must be allowed to invoke it. The gateway checks who is calling, but you still decide what each caller may do.',
			'',
			'**Common trap:** making a backend public so a gateway can reach it. Keep it private and grant invoke permission to the gateway\'s service account instead.'
		),
		try: [
			{
				label: 'Who may invoke a private service?',
				code: String.raw`// Toy check: a private service needs the invoker role; a public one allows anyone.
const service = { name: 'orders-api', allowUnauthenticated: false, invokers: ['gateway-sa', 'web-sa'] };
function canCall(who) {
  if (service.allowUnauthenticated) return 'allowed (public service)';
  if (!who) return 'denied (no ID token sent)';
  return service.invokers.includes(who) ? 'allowed (has the invoker role)' : 'denied (no invoker role)';
}
console.log('gateway-sa ->', canCall('gateway-sa'));
console.log('intern-sa  ->', canCall('intern-sa'));
console.log('anonymous  ->', canCall(null));`
			}
		]
	},
	{
		id: 'gcp-cloud-sql',
		title: 'Cloud SQL and AlloyDB',
		level: 'mid',
		summary: 'Tell high availability from read replicas, plan backups and point-in-time recovery, connect safely, and size connection pools.',
		scenes: ['gc-sql-ha', 'gc-sql-console'],
		notes: md(
			'**Cloud SQL** runs PostgreSQL, MySQL or SQL Server for you: backups, patching and failover. You still design the schema, indexes and queries.',
			'',
			'**High availability is not a read replica.**',
			'',
			'- **HA** makes the instance **regional**: a primary and a standby in different zones, with every write copied synchronously to both disks. If the primary or its zone fails, the standby takes over and clients reconnect to the same address after about a minute.',
			'- A **read replica** is a separate copy fed **asynchronously**, so it can lag. It takes read traffic off the primary, but it has no automatic failover: you promote it by hand and may lose recent writes.',
			'',
			'**Backups and point-in-time recovery (PITR)** need a successful backup plus the logs that cover the moment you want. A restore always creates a **new instance**; it never rewinds the old one.',
			'',
			'**Connecting safely:** the **Cloud SQL Auth Proxy** (or a language connector for Java, Python or Go) authorises with IAM and encrypts with TLS, so you need no IP allowlists. From Cloud Run the built-in connection uses a socket named after the **instance connection name**, `project:region:instance`. A private IP needs Direct VPC egress or a Serverless VPC Access connector.',
			'',
			'**Connection limits:** every connection costs the database memory. Use a pool with a cap, and remember each Cloud Run instance has its own pool, so the total is instances times pool size.',
			'',
			'**AlloyDB** is a PostgreSQL-compatible service that separates compute from a distributed storage layer, scales reads with read pool instances and adds a columnar engine for analytics. Consider it when mixed transactional and analytical work outgrows one Cloud SQL instance.'
		),
		try: [
			{
				label: 'Will the pools fit the database?',
				code: String.raw`// total connections wanted = Cloud Run instances x pool size
function check(instances, poolSize, maxConnections) {
  const total = instances * poolSize;
  return total + ' wanted, database allows ' + maxConnections + ' -> ' + (total <= maxConnections ? 'ok' : 'too many, some connections are refused');
}
console.log('5 instances x 10   :', check(5, 10, 100));
console.log('40 instances x 10  :', check(40, 10, 100));
console.log('40 instances x 2   :', check(40, 2, 100));`
			}
		]
	},
	{
		id: 'gcp-memorystore',
		title: 'Memorystore',
		level: 'mid',
		summary: 'Use Memorystore as a disposable cache: tiers, private access from Cloud Run, the cache-aside pattern and how to avoid a stampede.',
		scenes: ['gc-cache-aside'],
		notes: md(
			'**Memorystore** is managed in-memory data. In the store it holds sessions, carts and hot product data.',
			'',
			'- **Memorystore for Redis** has two tiers. **Basic** has no replication and no automatic failover, so a node failure leaves an empty cache. **Standard** replicates across zones, fails over automatically and can add read replicas. Memorystore for Redis Cluster has its own documentation.',
			'- **Memorystore for Valkey** is managed **Valkey**, the community fork of Redis. It can run in **cluster mode**: the data is split into equal **shards**, each with a primary and 0 to 5 replicas spread across zones, and clients use a discovery endpoint.',
			'',
			'**Private access.** Memorystore instances get private IP addresses inside your VPC network. Cloud Run is outside it, so it needs **Direct VPC egress** (or a Serverless VPC Access connector) to reach the cache.',
			'',
			'**Cache-aside:** read the cache; on a miss read the database, write the value to the cache **with a TTL**, and return it. On a write, delete or update the cached key. A TTL on every key is the safety net: stale data ages out even if an invalidation is missed.',
			'',
			'**Treat the cache as disposable.** Any key can vanish through eviction, a restart or a failover, so the app must keep working, only slower, with an empty cache.',
			'',
			'**Common traps:** caching without a TTL, and the **stampede**: a hot key expires and hundreds of requests hit the database together. Add a little random jitter to TTLs and let one request rebuild the key.'
		),
		try: [
			{
				label: 'Cache-aside with a TTL',
				code: String.raw`// A virtual clock keeps the demo deterministic.
let now = 0;
const cache = new Map();
let dbReads = 0;
const db = (id) => { dbReads++; return { id, name: 'Product ' + id }; };
function getProduct(id, ttl) {
  const hit = cache.get(id);
  if (hit && hit.expires > now) return 'hit  (t=' + now + ')';
  cache.set(id, { value: db(id), expires: now + ttl });
  return 'miss (t=' + now + ') -> database read, cached for ' + ttl + ' s';
}
console.log(getProduct(42, 300));
now = 10; console.log(getProduct(42, 300));
now = 400; console.log(getProduct(42, 300));
console.log('database reads:', dbReads);`
			}
		]
	},
	{
		id: 'gcp-firestore-and-spanner',
		title: 'Firestore, Spanner and Cloud SQL',
		level: 'advanced',
		summary: 'Choose between a document database, a relational database that scales out, and a regional SQL instance, and avoid the Spanner key hotspot.',
		scenes: ['gc-store-data-fit', 'gc-spanner-hotspot'],
		notes: md(
			'Three databases suit three shapes of data, and choosing wrongly is expensive to undo.',
			'',
			'**Firestore** (Native mode) is a serverless **document** database: a database holds **collections**, a collection holds **documents** (small JSON-like records), and a document can have **subcollections**, so `users/asha/orders/1042` is a path. It is schemaless and strongly consistent, with real-time updates and mobile and web SDKs. Queries need an index: single-field indexes are automatic, but a query that combines fields, such as a range filter with a sort on another field, needs a **composite index** that you create. Without one the query fails with an error that links to the fix. **Datastore mode** is a compatibility layer for older App Engine apps, without the newer features.',
			'',
			'**Spanner** is a **relational** database with SQL that scales out horizontally and gives **externally consistent** transactions, a stronger guarantee than ordinary strong consistency. Instances are regional, dual-region or multi-region. Its key design rule: do not start the primary key of a busy table with a steadily growing value (an order number, a timestamp), because the inserts pile onto one server, a **hotspot**. Use a UUID version 4 or a bit-reversed sequence.',
			'',
			'**Cloud SQL** stays the default for a store\'s orders and payments: joins, transactions and familiar PostgreSQL or MySQL.',
			'',
			'**Rule of thumb:** carts, sessions and profiles fit Firestore; orders fit Cloud SQL; stock that must stay consistent across continents at huge scale justifies Spanner.',
			'',
			'**Common trap:** choosing Spanner "to be safe". One regional Cloud SQL instance is simpler to run until it genuinely runs out of room.'
		),
		try: [
			{
				label: 'Sequential keys make a hotspot',
				code: String.raw`// Four key ranges, one per server. Where do 12 new orders land?
const servers = 4, maxKey = 1000;
const serverOf = (key) => Math.min(servers - 1, Math.floor((key / maxKey) * servers));
function spread(keys) { const n = new Array(servers).fill(0); keys.forEach((k) => n[serverOf(k)]++); return n; }
const sequential = Array.from({ length: 12 }, (_, i) => 1001 - 12 + i);
let seed = 11;
const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
const random = Array.from({ length: 12 }, () => Math.floor(rand() * maxKey));
console.log('growing order numbers ->', spread(sequential));
console.log('random UUID-like keys  ->', spread(random));`
			}
		]
	},
	{
		id: 'gcp-pubsub-and-tasks',
		title: 'Pub/Sub and Cloud Tasks',
		level: 'mid',
		summary: 'Decouple services with topics and subscriptions, handle the ack deadline and redelivery, use dead-letter topics and ordering keys, and know when Cloud Tasks fits better.',
		scenes: ['gc-pubsub-flow', 'gc-pubsub-ack', 'gc-tasks-vs-pubsub'],
		notes: md(
			'**Pub/Sub** decouples services. A **publisher** sends messages to a **topic** and does not know who reads them. Each **subscription** on the topic gets its own copy, so "order placed" can feed email, stock and analytics independently.',
			'',
			'- **Pull:** your subscriber asks for messages. **Push:** Pub/Sub POSTs each message to an HTTPS endpoint, such as a Cloud Run service. **Export** subscriptions write straight to BigQuery or Cloud Storage.',
			'- **Acknowledge or it comes back.** After delivery you must **ack** within the **ack deadline**: 10 seconds by default for the console and samples, extendable, and the client libraries extend it for you. A missed deadline means **redelivery**.',
			'- **At-least-once:** a message can arrive twice, so the consumer must be **idempotent**. An exactly-once option exists, but design for duplicates anyway.',
			'- **Dead-letter topic:** after the **maximum delivery attempts** (default 5, up to 100) the message moves to a dead-letter topic, so one poison message does not retry forever. Create a subscription on that topic to inspect them.',
			'- **Ordering keys:** messages with the same key arrive in order, with no order across keys. Ordering must be enabled when the subscription is created.',
			'',
			'**Cloud Tasks** is different. Your code creates each task, and the queue dispatches it to an HTTP target at a **configurable rate**, optionally at a scheduled time, retrying any non-2xx reply. A task name prevents duplicates. Use it to protect a slow or rate-limited service, such as a payment provider.',
			'',
			'**Common trap:** a 10-second ack deadline on a 2-minute job. The message is redelivered while the first worker is still busy.'
		),
		try: [
			{
				label: 'Ack deadline, redelivery and a dead letter',
				code: String.raw`const maxDeliveryAttempts = 5;
function run(ackDeadline, jobSeconds) {
  for (let attempt = 1; attempt <= maxDeliveryAttempts; attempt++) {
    if (jobSeconds <= ackDeadline) return 'attempt ' + attempt + ': acked after ' + jobSeconds + ' s';
    console.log('attempt ' + attempt + ': deadline ' + ackDeadline + ' s passed (the job needs ' + jobSeconds + ' s), redelivered');
  }
  return 'moved to the dead-letter topic after ' + maxDeliveryAttempts + ' attempts';
}
console.log(run(10, 25));
console.log(run(30, 25));`
			}
		]
	},
	{
		id: 'gcp-vpc-networking',
		title: 'VPC networking',
		level: 'mid',
		summary: 'Know what is global and regional in a VPC, how firewall rules decide, and the private paths out: Private Google Access, private services access, Direct VPC egress and Cloud NAT.',
		scenes: ['gc-vpc-layout', 'gc-vpc-egress-paths'],
		notes: md(
			'A **VPC network** is your private network inside Google Cloud. It is **global**, but its **subnets** are **regional**, each with an IP range. **Custom mode**, where you choose the subnets, is recommended for production. **Auto mode** creates one subnet per region with predefined ranges.',
			'',
			'**Firewall rules** are global too and are enforced on the VMs. Every network has an implied rule that denies ingress and one that allows egress, so you add higher-priority allow rules for what you need.',
			'',
			'**Private paths**',
			'',
			'- **Private Google Access**, a per-subnet setting, lets VMs with no external IP reach Google APIs.',
			'- **Cloud NAT** gives resources without external IPs outbound internet access. It is regional, configured on a Cloud Router, and allows no unsolicited inbound connections.',
			'- **Private services access** connects your VPC to Google-managed services over internal IPs, using VPC Network Peering and an IP range you allocate. Cloud SQL private IP uses it.',
			'- **Direct VPC egress** lets a Cloud Run service send traffic into your VPC from addresses in a subnet you choose, with no connector to run. Its egress setting decides whether only private ranges or all traffic goes through the VPC. Serverless VPC Access connectors are the alternative, and the documentation recommends a connector when Cloud NAT is combined with Direct VPC egress, because of slow cold starts.',
			'',
			'**In the store:** Cloud Run sends traffic into the subnet, reaches Cloud SQL and Memorystore on private IPs, and leaves through Cloud NAT for calls to a payment provider.',
			'',
			'**Common trap:** relying on the default network. Create a custom VPC with the subnets and rules you chose.'
		),
		try: [
			{
				label: 'Firewall rule priority',
				code: String.raw`// Lowest priority number wins; the implied rules are last.
const rules = [
  { priority: 1000, direction: 'ingress', action: 'allow', port: 443 },
  { priority: 900, direction: 'ingress', action: 'deny', port: 22 }
];
function verdict(direction, port) {
  const hit = rules.filter((r) => r.direction === direction && r.port === port).sort((a, b) => a.priority - b.priority)[0];
  if (hit) return hit.action + ' (rule, priority ' + hit.priority + ')';
  return direction === 'ingress' ? 'deny (implied rule)' : 'allow (implied rule)';
}
console.log('ingress 443 ->', verdict('ingress', 443));
console.log('ingress 22  ->', verdict('ingress', 22));
console.log('ingress 80  ->', verdict('ingress', 80));
console.log('egress 5432 ->', verdict('egress', 5432));`
			}
		]
	}
];

// ───────────────────────── quiz ─────────────────────────
const q = (topic: string) => builder('GC', topic);

// gcp-cloud-run
const cr = q('gcp-cloud-run');
cr.add('basic', 'revision',
	'What does each deploy of a Cloud Run service create?',
	'A new revision, a frozen copy of the code and its settings',
	['A new project that has to be billed on its own', 'A new region that the service then moves to', 'A replacement that deletes every earlier version at once'],
	'Every deploy creates an immutable revision. Earlier revisions stay available, which is what makes traffic splitting and rollback possible. A deploy does not create a project or change the region, and old revisions are not removed automatically.');
cr.add('mid', 'rollback',
	'A new revision raises errors for 5% of shoppers. What is the fastest safe rollback?',
	'Send 100% of the traffic back to the previous revision',
	['Delete the service and deploy it again from source', 'Wait for Cloud Run to notice the errors and revert by itself', 'Raise minimum instances so the errors are absorbed'],
	'Routing is separate from deploying, so one traffic change returns every request to the older revision at once. Cloud Run does not revert on its own, deleting the service is slow and loses the history, and extra instances do not fix a code bug.');
cr.add('mid', 'concurrency',
	'A Cloud Run service has concurrency 80. What does that number mean?',
	'One instance can handle up to 80 requests at the same time',
	['Each shopper may send at most 80 requests a minute', 'The service may run at most 80 instances', 'A failed request is retried up to 80 times'],
	'Concurrency is the number of simultaneous requests one instance accepts. Higher values mean fewer instances for the same load, but the code must be safe for parallel requests. It is not a rate limit, an instance cap or a retry count.');
cr.add('mid', 'billing-mode',
	'A handler sends its response and then keeps uploading a report in the background, but the upload stalls. Under default settings, what is the likely cause?',
	'Request-based billing gives CPU only while a request is being processed',
	['Concurrency is set too high for the instance', 'With a minimum of 0 the instance is deleted the very moment it sends its reply, so nothing can run', 'Cloud Run blocks all outbound calls once a reply is sent'],
	'With request-based billing, the default, CPU is allocated only while a request is processed, so work after the response gets no CPU. Instance-based billing keeps CPU for the whole instance life. Concurrency, the minimum and outbound networking are not the cause.');
cr.add('advanced', 'min-instances',
	'Product pages feel slow for the first visitor after quiet periods. What reduces this, and what does it cost?',
	'Set minimum instances above 0 to avoid cold starts; the warm instances are billed',
	['Lower concurrency to 1 on every instance, which removes cold starts entirely and costs nothing extra', 'Switch to a job, which starts instantly and is never billed', 'Tag the revision, which keeps its containers running for free'],
	'The slow first request is a cold start. Minimum instances keep containers warm so there is no boot wait, but idle warm instances are billed and the minimum is a best-effort target. Concurrency, jobs and tags do not keep containers running.');
cr.add('basic', 'job',
	'A nightly export of orders runs to completion and needs no web address. Which Cloud Run resource fits?',
	'A job, which runs its tasks and then stops',
	['A service that keeps one instance alive so it never sleeps', 'A revision tag that the clock triggers each night', 'A service whose concurrency is set to 0'],
	'A job runs to completion and serves no HTTP, which suits batch work. A service is built to listen for requests, a tag only gives a revision a test URL, and concurrency 0 is not a valid way to make a service do batch work.');

// gcp-artifact-and-build
const ab = q('gcp-artifact-and-build');
ab.add('basic', 'registry',
	'In a typical store pipeline, where does Cloud Run get the container image it deploys?',
	'From an Artifact Registry repository that the build pushed it to',
	['From the git repository, which stores built images beside the code', 'From a Cloud Storage bucket mounted into every instance', 'From the developer\'s laptop at the moment of the deploy'],
	'Cloud Build pushes the built image to Artifact Registry, and Cloud Run deploys that image. Git stores source, not images, a mounted bucket is not how Cloud Run starts containers, and nothing is pulled from a laptop in a repeatable pipeline.');
ab.add('basic', 'trigger',
	'Which event can start a Cloud Build trigger automatically?',
	'A push to a branch that matches the trigger',
	['A shopper placing an order', 'A change to an IAM policy', 'A Cloud Run instance scaling to zero'],
	'Triggers start builds on repository events: a push to a matching branch, a new tag or a pull request, plus manual runs. Orders, IAM changes and scaling are runtime events that Cloud Build does not watch.');
ab.add('mid', 'trigger-sa',
	'A trigger\'s builds must push an image and deploy a revision. How should access be granted?',
	'Give the trigger\'s service account only those permissions',
	['Give every developer the Owner role on the project', 'Make the repository public so that no permission needs to be granted at all', 'Write a long-lived key into cloudbuild.yaml'],
	'Each trigger runs its builds as one service account, so grant that account the few permissions the build needs. Owner for everyone is far too broad, a public repository does not authorise pushes, and keys in a build file leak.');
ab.add('mid', 'tag-moves',
	'What happens when you push a different image with a tag that is already in use, such as latest?',
	'The tag moves to the new image, and the old image keeps its digest',
	['The push is refused until the old tag has been deleted by an administrator', 'Both images share the tag and Cloud Run picks one at random', 'The old image is deleted at once'],
	'A tag points at one image version at a time, so reusing a name moves it. The earlier version stays in the repository, untagged, and is still reachable by its digest. Nothing is refused, shared or deleted automatically.');
ab.add('advanced', 'digest',
	'Why deploy production by digest rather than by tag?',
	'A digest always names the same bytes, so you know exactly what runs and can redeploy it exactly',
	['Digests make images pull faster across regions because they are cached at every Google edge location worldwide', 'Cloud Run refuses images that are not deployed by digest', 'Tags are deleted automatically a week after the push'],
	'A digest is a fingerprint of one image version, so it cannot silently change. A tag can be moved, which makes "what is in production?" unanswerable. Digests do not speed up pulls, Cloud Run accepts tags, and tags are not expired automatically.');

// gcp-gke-and-compute-engine
const gk = q('gcp-gke-and-compute-engine');
gk.add('basic', 'autoheal',
	'What does autohealing do in a managed instance group?',
	'Recreates a VM that fails its application health check',
	['Patches the operating system on a schedule', 'Moves a VM to a bigger machine type when CPU is high', 'Backs up the disk of every VM each night'],
	'Autohealing uses an application health check and recreates a VM from the instance template when it stops answering. Patching, resizing a machine and backups are different features, and none of them replaces a failed VM.');
gk.add('mid', 'autopilot',
	'What is the main difference between GKE Autopilot and Standard?',
	'In Autopilot GKE manages the nodes; in Standard you manage node pools',
	['Autopilot runs plain containers without Kubernetes and Standard runs full Kubernetes', 'Standard is for development and Autopilot is for production only', 'Autopilot has no load balancing and Standard has it'],
	'Both modes are Kubernetes. Autopilot lets GKE manage nodes and scaling and applies guardrails, while Standard exposes node pools and gives you fine control. Neither mode is dev-only or production-only, and both support load balancing.');
gk.add('mid', 'choose',
	'Which is the best first choice for one stateless web API in a container with spiky traffic?',
	'Cloud Run',
	['A GKE Standard cluster with several node pools', 'One large Compute Engine VM that starts the container by hand', 'A regional managed instance group with a custom OS image'],
	'A stateless HTTP container is what Cloud Run is built for: it scales with traffic, even to zero, and has no cluster or VM to run. The other options all add operations work, such as node pools, a hand-managed VM or a custom image, for no benefit here.');
gk.add('mid', 'readiness',
	'In GKE, what does a readiness probe decide?',
	'Whether a Pod should receive traffic yet',
	['Whether the node should be deleted', 'Whether the image should be rebuilt', 'Whether the cluster may scale down to zero nodes'],
	'A readiness probe tells Kubernetes when a Pod is ready to serve, so traffic is held back until the app has started. It does not delete nodes, rebuild images or control cluster scaling to zero.');
gk.add('advanced', 'vm-fit',
	'When is a Compute Engine VM a better fit than Cloud Run or GKE for a store component?',
	'When it needs a particular operating system setup or licensed software that containers do not suit',
	['When it must serve HTTP traffic to shoppers, which containers are not able to do on Google Cloud at all', 'When traffic is unpredictable, because VMs scale instantly', 'When it has no state, because VMs cost the least for stateless work'],
	'VMs give full control of the operating system, which suits licensed software or lift-and-shift servers. Containers serve HTTP perfectly well, VMs do not scale instantly (a managed instance group takes time), and stateless work is where Cloud Run is simplest.');

// gcp-functions-and-gateway
const fg = q('gcp-functions-and-gateway');
fg.add('basic', 'name',
	'What is Cloud Run functions?',
	'Cloud Functions 2nd gen under a new name: your source is built and deployed as a Cloud Run service',
	['A separate product that runs on its own dedicated servers and is unrelated to Cloud Run or containers entirely', 'A way to run virtual machines for a fixed nine minutes', 'The language used to write an API Gateway config'],
	'Cloud Run functions is the current name for Cloud Functions 2nd gen. The platform builds your source into a container and deploys it as a Cloud Run service. It is not a separate server fleet, a VM runner or an API Gateway format.');
fg.add('mid', 'event-trigger',
	'A product photo lands in a bucket and a thumbnail must be made. How should the function start?',
	'From an event trigger delivered through Eventarc',
	['The function polls the bucket every second from a VM', 'A shopper must call the function from the browser', 'Cloud Build reruns the function on every build'],
	'Eventarc routes the upload as a CloudEvents message to the function, so nothing polls and no one has to call it. Polling wastes work, shoppers should not trigger back-office jobs, and builds are unrelated to uploads.');
fg.add('mid', 'private',
	'A new Cloud Run service is deployed with default settings. Who can call it?',
	'Only callers with permission, such as the Cloud Run Invoker role, sending an ID token',
	['Anyone on the internet, because Google Cloud applies no authentication to new services unless you add it yourself', 'Only callers inside the same VPC network', 'Only the person who deployed it, through the console'],
	'Cloud Run services are private by default: requests need credentials and the caller must be allowed to invoke the service. They are not public until you allow unauthenticated calls, and the check is IAM, not the network or the deployer.');
fg.add('mid', 'gateway',
	'What does API Gateway add in front of backend services?',
	'One REST front door described by an OpenAPI file, with API key or token checks',
	['A managed database that stores every API request and response so that they can be reused later on', 'A cache that keeps every response for a full day', 'A VPN into the backend network'],
	'API Gateway exposes backends through one consistent API defined by an OpenAPI 2.0 spec, and checks callers with API keys, service accounts or ID tokens. It is not a response store, a day-long cache or a VPN.');
fg.add('advanced', 'public-backend',
	'A team makes its Cloud Run backend public so the gateway can reach it. What is the better design?',
	'Keep it private and let the gateway\'s backend service account invoke it',
	['Keep it public but never publish its URL anywhere, so that nobody can find it', 'Put an API key in the backend URL path', 'Make the gateway private and call the backend directly'],
	'The gateway signs calls with a backend service account, which can hold the invoker permission, so the backend can stay private. A secret URL or a key in the path is not authentication, and removing the gateway removes the control point.');

// gcp-cloud-sql
const sq = q('gcp-cloud-sql');
sq.add('basic', 'ha',
	'What does enabling high availability on a Cloud SQL instance create?',
	'A standby in another zone with synchronously copied writes and automatic failover',
	['A read-only copy that you must promote by hand', 'A second instance in another region that is refreshed from a nightly export of the primary database', 'A backup that restores itself every hour'],
	'HA makes the instance regional: a primary and a standby in different zones, with writes copied to both before they are confirmed. If the primary fails the standby is promoted automatically. A promoted-by-hand copy describes a read replica instead.');
sq.add('mid', 'replica',
	'What is a Cloud SQL read replica good for?',
	'Taking read traffic off the primary; it can lag and is promoted by hand',
	['Automatic failover to the replica with no data loss whenever the primary instance becomes unavailable', 'Making writes faster by sharing them between copies', 'Storing the backups used for point-in-time recovery'],
	'A replica is fed asynchronously, so it can lag. It adds read capacity, but it has no automatic failover and promoting it can lose recent writes. It does not speed up writes or hold the backups.');
sq.add('mid', 'pitr',
	'After a bad migration at 14:03 you use point-in-time recovery. What does the restore produce?',
	'A new instance as the database was at the chosen time',
	['The same instance, rewound in place', 'A read replica of the damaged instance', 'A copy of only the tables that changed'],
	'Point-in-time recovery always creates a new instance, from a backup plus logs up to the chosen time. It never rewinds the original, and it is a full instance, not a replica or a partial copy.');
sq.add('mid', 'connect',
	'Cloud Run must reach Cloud SQL without allowlisting IP addresses. What is the recommended approach?',
	'Use the built-in connection or the Auth Proxy, which uses IAM and encrypts the link',
	['Open the instance to 0.0.0.0/0 and rely on the database password to keep strangers out', 'Copy the database to a bucket and read it from there', 'Run a VM that forwards port 5432 without encryption'],
	'The Auth Proxy and the built-in Cloud Run connection authorise with IAM and encrypt with TLS, so no IP allowlist is needed. Opening the database to the world, copying it to a bucket or forwarding plain traffic are all unsafe or impractical.');
sq.add('advanced', 'pool',
	'40 Cloud Run instances each keep a pool of 10 connections and the database allows 100. What happens at full scale?',
	'400 connections are wanted, so some are refused; cap the pool or the instances',
	['Cloud SQL raises its own connection limit and opens the 300 extra connections automatically', 'Cloud Run shares one pool across all instances', 'Only 10 connections are used in total because pools are shared'],
	'Each instance has its own pool, so the total is instances times pool size: 400 here against a limit of 100. Cloud SQL does not raise the limit by itself, and pools are not shared between instances.');

// gcp-memorystore
const ms = q('gcp-memorystore');
ms.add('basic', 'tier',
	'Which Memorystore for Redis tier has no replication and no automatic failover?',
	'Basic',
	['Standard', 'Cluster', 'Premium'],
	'The Basic tier is a single node with no replication, so a failure leaves an empty cache. Standard replicates across zones and fails over automatically. Memorystore for Redis Cluster is documented separately, and there is no Premium tier.');
ms.add('mid', 'private-access',
	'Why does Cloud Run need Direct VPC egress or a connector to use Memorystore?',
	'The cache has only a private IP address inside your VPC network',
	['Memorystore accepts requests only from other Google APIs and never from application code', 'Cloud Run cannot make outbound TCP connections', 'The cache would otherwise be billed per request'],
	'Memorystore instances get private IPs in your VPC, and Cloud Run does not run inside that network, so it needs a path in. Cloud Run can make outbound connections, Memorystore is not an API, and the cost is not per request.');
ms.add('mid', 'cache-aside',
	'In the cache-aside pattern, what happens on a cache miss?',
	'Read the database, store the value in the cache with a TTL, then return it',
	['Return an error so the client retries later', 'Write the request itself to the cache and wait for another service to come and fill the value in', 'Flush the whole cache and rebuild it from scratch'],
	'Cache-aside means the app looks in the cache first and, on a miss, loads from the source of truth and fills the cache itself, with a TTL so stale data ages out. Errors, waiting for another filler or flushing everything defeat the purpose.');
ms.add('advanced', 'stampede',
	'A hot product key expires and hundreds of requests reach the database together. What reduces that?',
	'Add random jitter to TTLs and let one request rebuild the key',
	['Remove all TTLs so keys never expire', 'Raise the database connection limit to several hundred', 'Use the Basic tier because it never expires keys'],
	'A stampede happens when many requests rebuild the same key at once. Jittered TTLs stop many keys expiring together, and letting one request rebuild shields the database. No TTL means stale data forever, and more connections only moves the load.');
ms.add('advanced', 'disposable',
	'How should the app treat the cache?',
	'As disposable: it must still work, more slowly, when a key or the whole cache is gone',
	['As the single source of truth for orders, with the database kept only as an occasional backup', 'As durable storage, because the Standard tier replicates', 'As a database replacement for carts that must survive restarts'],
	'Keys can vanish through eviction, a restart or a failover, so the database must stay the source of truth and the app must tolerate an empty cache. Replication improves availability but does not make a cache a database.');

// gcp-firestore-and-spanner
const fs = q('gcp-firestore-and-spanner');
fs.add('basic', 'document-model',
	'How does Firestore organise data?',
	'Collections that hold documents, which can hold subcollections',
	['Tables of typed rows that are joined together by foreign keys and constraints', 'One key-value namespace with no nesting', 'Graphs of nodes and typed edges'],
	'Firestore is a document database: collections contain documents, and a document can have subcollections, giving paths such as users/asha/orders/1042. It is not tables with foreign keys, a flat key-value store or a graph database.');
fs.add('mid', 'composite-index',
	'A Firestore query that filters on a range and sorts by another field fails with a link in the error. What is missing?',
	'A composite index, which you create',
	['A bigger instance size', 'A schema for the collection', 'A read replica'],
	'Single-field indexes are automatic, but a query that combines fields in this way needs a composite index. Firestore does not create those for you, and its error message links to the page that creates it. Instance size, schemas and replicas are not involved.');
fs.add('mid', 'spanner-key',
	'Which primary key is the safest first key part for a very busy Spanner orders table?',
	'A random UUID version 4',
	['An auto-incrementing order number', 'The order timestamp', 'The customer\'s signup date'],
	'Values that only grow send every new row to the last key range, one server, creating a hotspot. A random UUID version 4 spreads inserts across all key ranges. Timestamps and signup dates are monotonic or clustered in the same way.');
fs.add('advanced', 'firestore-fit',
	'Which data fits Firestore best?',
	'Shopping carts and sessions, read and written by key',
	['Payments that need joins across several tables', 'Stock that must stay consistent across continents at huge scale', 'Scans over years of sales for a report'],
	'Carts and sessions are small documents accessed by key, which is what Firestore does best without capacity planning. Payments suit a relational database, globally consistent stock suggests Spanner, and large scans belong in an analytics warehouse.');
fs.add('advanced', 'spanner-overkill',
	'A store has one regional Postgres workload that fits comfortably. Why is Spanner probably the wrong choice?',
	'Its scale-out design adds complexity you do not need yet',
	['It cannot run SQL, so every query would have to be written against documents', 'It is not strongly consistent', 'It only works for documents'],
	'Spanner is a relational, strongly consistent database built to scale out, but that power brings schema and operations choices you do not need for a workload one regional Cloud SQL instance handles. The other statements about it are false.');

// gcp-pubsub-and-tasks
const ps = q('gcp-pubsub-and-tasks');
ps.add('basic', 'subscription-copy',
	'What does each subscription on a Pub/Sub topic receive?',
	'Its own copy of every message published to the topic',
	['A share of the messages, so each one is split between subscriptions', 'Only messages published after the first subscriber connects', 'Only messages below a size set on the topic'],
	'Each subscription gets every message independently, which is what lets email, stock and analytics all react to one order. Messages are not divided between subscriptions, and delivery does not depend on a first subscriber or a topic size filter.');
ps.add('mid', 'ack-deadline',
	'A worker needs 2 minutes but the ack deadline is 10 seconds and is not extended. What happens?',
	'The message is redelivered while the first worker is still busy',
	['The message is deleted without ever being processed, and the publisher is told so', 'Pub/Sub pauses the topic until the worker finishes', 'Pub/Sub marks the subscription as failed'],
	'If no ack arrives before the deadline, Pub/Sub assumes the worker failed and delivers the message again, so two workers can handle it. The message is not dropped, the topic is not paused and the subscription is not marked failed.');
ps.add('mid', 'idempotent',
	'Why must a Pub/Sub consumer be idempotent?',
	'Delivery is at least once, so the same message can arrive more than once',
	['Messages always arrive out of order even within the same ordering key, so order cannot be trusted', 'Subscriptions drop one message in a hundred', 'Publishers send every message to all topics'],
	'At-least-once delivery means redelivery and duplicates are normal, so handling a message twice must be safe. Messages with the same ordering key keep their order, subscriptions do not drop messages at random, and publishers write to one topic.');
ps.add('advanced', 'dead-letter',
	'What does a dead-letter topic protect against?',
	'A poison message that keeps failing and is retried forever',
	['Publishers sending faster than allowed', 'Subscribers losing their credentials', 'Topics running out of storage'],
	'After the maximum number of delivery attempts (5 by default) Pub/Sub moves the message to the dead-letter topic, where you can inspect it, so it stops blocking or wasting retries. It does not address publish rates, credentials or topic storage.');
ps.add('advanced', 'tasks-fit',
	'When is Cloud Tasks a better fit than Pub/Sub?',
	'When you must call one target at a controlled rate',
	['When several independent services each need a copy of an event', 'When messages must be exported straight to BigQuery', 'When the publisher should not know who consumes the message'],
	'Cloud Tasks is an explicit queue: you create tasks for a known target and the queue dispatches at a rate you set, which protects a slow or limited service. The other three describe Pub/Sub strengths: fan-out, export subscriptions and publisher decoupling.');
ps.add('mid', 'ordering',
	'Messages for one customer must be processed in order. What do you use?',
	'The same ordering key, with ordering enabled on the subscription',
	['Publish each message from a different region', 'A longer ack deadline', 'A separate topic for every message'],
	'Ordering keys guarantee order within a key, and message ordering has to be enabled on the subscription when it is created. Regions, deadlines and a topic per message do nothing for order.');

// gcp-vpc-networking
const vp = q('gcp-vpc-networking');
vp.add('basic', 'scope',
	'Which statement about a VPC network is correct?',
	'The network is global and its subnets are regional',
	['The network and its subnets are both zonal', 'The network is regional and its subnets are global', 'Each VM has its own VPC network'],
	'A VPC network, with its routes and firewall rules, is a global resource, while each subnet belongs to one region and has an IP range. Neither is zonal, and VMs share a network rather than each having one.');
vp.add('basic', 'implied-rules',
	'What do the implied firewall rules do in a new custom network?',
	'Deny incoming traffic and allow outgoing traffic',
	['Allow all traffic in both directions', 'Deny all traffic in both directions', 'Allow incoming web traffic only'],
	'Every network has an implied rule that denies ingress and one that allows egress, both at the lowest priority. You add higher-priority allow rules for the incoming traffic you want. Nothing implied allows web traffic in.');
vp.add('mid', 'nat',
	'A private VM must download packages from the internet but accept no inbound connections from it. What fits?',
	'Cloud NAT on a Cloud Router',
	['An external IP address on every VM', 'Private Google Access', 'A firewall rule that allows ingress from 0.0.0.0/0'],
	'Cloud NAT translates outbound traffic for resources without external IPs and allows no unsolicited inbound connections. External IPs and open ingress expose the VM, and Private Google Access reaches Google APIs only, not the general internet.');
vp.add('mid', 'direct-egress',
	'What does Direct VPC egress give a Cloud Run service?',
	'Outbound traffic into your VPC from private IPs in a subnet, with no connector',
	['A dedicated VM that you must run and patch to proxy all of the service\'s outbound traffic', 'A static public IP for every inbound request', 'Automatic peering with every Google service'],
	'Direct VPC egress assigns addresses from a subnet you choose, so the service can reach private resources without running a connector. It is not a proxy VM, a public inbound address or blanket peering.');
vp.add('advanced', 'private-services-access',
	'How is a Cloud SQL instance with a private IP reached from your VPC?',
	'Through private services access: a VPC peering with an IP range you allocate',
	['Through a public IP address and an allowlist containing the office network and each developer', 'Through Private Google Access on the Cloud SQL subnet', 'Through Cloud NAT, which translates the database address'],
	'Private services access connects your VPC to the service producer\'s network with VPC Network Peering and an allocated IP range, and Cloud SQL private IP uses it. A public address, Private Google Access or NAT are different mechanisms.');

export const banks: { out: Question[] }[] = [cr, ab, gk, fg, sq, ms, fs, ps, vp];
