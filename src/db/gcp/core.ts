import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Google Cloud, core area: the request path, projects and billing, Cloud Storage, IAM, the load balancer and CDN, DNS and certificates.
// A generic online store is the running example. No prices or fast-changing quotas are stated as facts; a number that appears is a
// long-standing documented default or limit, checked against the Google Cloud documentation. `try` snippets are plain, deterministic
// JavaScript for the playground: no imports, no network, they only model the idea. They use String.raw; keep backticks and the dollar-brace sequence out.
const SHOTS = 'Screenshots: Google Cloud documentation, CC BY 4.0, https://docs.cloud.google.com/billing/docs/how-to/budgets';

export const topics: DbTopic[] = [
	// ───────────────────────── gcp-request-path ─────────────────────────
	{
		id: 'gcp-request-path',
		title: 'The store request path',
		level: 'basic',
		summary: 'Follow one page view through Cloud DNS, the load balancer with Cloud CDN, Cloud Storage, Cloud Run and Cloud SQL.',
		scenes: ['gc-request-path'],
		notes: md(
			'An online store on Google Cloud is a short chain of services, each with one job. A request for **shop.example.com** goes:',
			'',
			'- **Cloud DNS**: turns the name into the address of the load balancer.',
			'- **Global external Application Load Balancer + Cloud CDN**: one worldwide entry point with a single anycast IP address. Cloud CDN keeps copies of cacheable responses at Google\'s edge.',
			'- **Cloud Storage**: a *backend bucket* behind the load balancer serves images and scripts.',
			'- **Cloud Run**: your app in a container. The load balancer reaches it through a *serverless NEG* (a network endpoint group for serverless backends).',
			'- **Cloud SQL**: the relational database behind the app.',
			'',
			'Around that chain sit **IAM** (who may do what), **Certificate Manager** (TLS certificates), **Secret Manager** (passwords), and **Cloud Logging and Cloud Monitoring** (logs and alerts).',
			'',
			'```js',
			'const path = ["Cloud DNS", "Load balancer + CDN", "Cloud Run", "Cloud SQL"];',
			'console.log(path.join(" -> "));',
			'```',
			'',
			'**Common trap:** the database is the hardest layer to scale, so the design goal is to answer as many requests as possible before they reach it: the CDN first, then a cache such as Memorystore.'
		),
		try: [
			{
				label: 'Which layer answers?',
				code: String.raw`// Toy model: a request is answered by the first layer that already has it.
const edge = new Set(['/logo.png', '/app.4f3a.js']);
const cache = new Set(['product:42']);
function answer(req) {
  if (req.static && edge.has(req.path)) return 'Cloud CDN (edge cache)';
  if (req.key && cache.has(req.key)) return 'Memorystore (app cache)';
  return 'Cloud SQL (slowest, most expensive)';
}
console.log(answer({ path: '/logo.png', static: true }));
console.log(answer({ path: '/p/42', key: 'product:42' }));
console.log(answer({ path: '/orders/9', key: 'order:9' }));`
			}
		]
	},

	// ───────────────────────── gcp-projects-and-billing ─────────────────────────
	{
		id: 'gcp-projects-and-billing',
		title: 'Projects, billing and budgets',
		level: 'basic',
		summary: 'Know the resource hierarchy, why a project is the unit of isolation, how billing accounts pay for projects, and what a budget does not do.',
		scenes: ['gc-resource-hierarchy', 'gc-budget-alerts', 'gc-budget-list', 'gc-budget-thresholds'],
		notes: md(
			'Google Cloud resources live in a **hierarchy**. The **organization** is the root (usually a company). Under it come optional **folders**, then **projects**, and inside projects the **resources**: buckets, Cloud Run services, databases. Every resource has exactly one parent.',
			'',
			'**The project is the unit that matters.** It is where you enable APIs, link billing and grant access, and quotas generally apply per project. A project has three identifiers: a **name** (a display label you can change), an **ID** that you choose, and a **number** that Google assigns and you cannot edit. Production and staging usually get separate projects, so a mistake or a runaway loop in one cannot touch the other.',
			'',
			'**Billing accounts pay for projects.** A billing account can be linked to many projects, and a project is billed to one linked account. If billing is disabled on a project, its billable services stop and some resources may be deleted.',
			'',
			'**Budgets and alerts** watch spending. By default a budget emails at 50%, 90% and 100% of the budget, measured against *actual* spend; you can also alert on *forecasted* spend, the projected total for the period. Emails go to billing account administrators and users by default, and a budget can publish status messages to a Pub/Sub topic for automation. Its scope can be projects, services or, for budgets on a billing account, one label.',
			'',
			'**Labels** are key-value pairs such as `env=prod` that filter and group resources and costs.',
			'',
			'**Common trap:** an alerts-only budget does **not** cap or stop spending. It only tells people. To react automatically you build something on the Pub/Sub notifications.',
			'',
			SHOTS
		),
		try: [
			{
				label: 'Which budget alerts fire?',
				code: String.raw`// Toy model of threshold rules: percent of the budget, on actual or forecasted spend.
const budget = 1000;
const rules = [
  { pct: 50, on: 'actual' }, { pct: 90, on: 'actual' }, { pct: 100, on: 'actual' }, { pct: 100, on: 'forecasted' }
];
function fired(actual, forecast) {
  return rules.filter((r) => (r.on === 'actual' ? actual : forecast) >= (budget * r.pct) / 100);
}
const day10 = fired(520, 1380);
console.log('day 10:', day10.map((r) => r.pct + '% ' + r.on).join(', '));
console.log('services stopped by an alert-only budget:', 0);
console.log('day 25:', fired(1010, 1250).map((r) => r.pct + '% ' + r.on).join(', '));`
			}
		]
	},

	// ───────────────────────── gcs-storage ─────────────────────────
	{
		id: 'gcs-storage',
		title: 'Cloud Storage',
		level: 'basic',
		summary: 'Know buckets, object names, location types, storage classes, uniform bucket-level access, versioning and lifecycle rules.',
		scenes: ['gc-gcs-bucket-object', 'gc-gcs-console-objects'],
		notes: md(
			'**Cloud Storage** keeps **objects** (bytes plus metadata) in **buckets**. A bucket name is **globally unique** and cannot be changed later; you pick the name and the **location** when you create it. In a standard bucket the namespace is flat: the slashes in `products/42/front.jpg` are just characters, and the console only draws them as folders. (Buckets with *hierarchical namespace* enabled do have real folders.)',
			'',
			'**Location types:**',
			'',
			'- **Region**: one place, data redundant across zones in it.',
			'- **Dual-region**: a specific pair of regions, replicated asynchronously.',
			'- **Multi-region**: a large area such as the US, with two or more regions.',
			'',
			'**Storage classes** are Standard, Nearline, Coldline and Archive, with minimum storage durations of none, 30, 90 and 365 days. Every class is read with low latency (even Archive answers in milliseconds), so the choice is about how often you read, not how fast. A bucket\'s default class applies only to objects written later; existing objects keep theirs until you rewrite them or a lifecycle rule moves them.',
			'',
			'**Uniform bucket-level access** turns ACLs off, so access is decided by IAM only. It cannot be switched off once it has been active for 90 consecutive days.',
			'',
			'**Versioning** (Protection tab) keeps earlier versions when you overwrite or delete. **Lifecycle rules** change the class or delete objects automatically, for example by age.',
			'',
			'**Common trap:** a bucket that is public by accident. Prefer IAM with uniform access, and put the CDN or signed URLs in front instead.'
		),
		try: [
			{
				label: 'Lifecycle rules by age',
				code: String.raw`// Toy model of Object Lifecycle Management: the first matching rule for an object's age decides.
const rules = [
  { minAgeDays: 365, action: 'Delete' },
  { minAgeDays: 90, action: 'SetStorageClass Coldline' },
  { minAgeDays: 30, action: 'SetStorageClass Nearline' }
];
function actionFor(ageDays) {
  const hit = rules.find((r) => ageDays >= r.minAgeDays);
  return hit ? hit.action : 'keep in Standard';
}
for (const age of [3, 45, 120, 400]) console.log('age ' + age + ' days -> ' + actionFor(age));`
			}
		]
	},

	// ───────────────────────── gcs-signed-urls-and-cors ─────────────────────────
	{
		id: 'gcs-signed-urls-and-cors',
		title: 'Signed URLs, uploads and CORS',
		level: 'mid',
		summary: 'Let shoppers upload and download directly with signed URLs, resumable uploads and a CORS configuration, without making the bucket public.',
		scenes: ['gc-signed-url-flow', 'gc-gcs-cors'],
		notes: md(
			'A **signed URL** is a URL whose query string carries a signature. It gives whoever holds it **time-limited access to one object, for the action it was signed for** (read, write or delete), with no Google account needed. It works until it expires or the signing key is rotated, so treat it like a password.',
			'',
			'- **V4 signing**: the longest expiry is **604800 seconds (7 days)**. Documentation examples use short expiries, such as 15 minutes.',
			'- **Who signs**: usually a **service account**, which must itself have permission for the request. The signing code belongs on your **server**, never in the browser.',
			'- Signed URLs use the XML API endpoints (`storage.googleapis.com`).',
			'',
			'**Resumable uploads** send an object in several requests. Cloud Storage returns a **session URI**; the data goes to it in one or more PUTs, and after an interruption you ask for the persisted offset and send only the rest. A session lasts up to a week, and the URI works as an authentication token, so share it only over HTTPS. This is the recommended method for large files.',
			'',
			'**CORS** (cross-origin resource sharing) is set **on the bucket**. A browser on `shop.example.com` that PUTs to `storage.googleapis.com` first sends a *preflight* request; the bucket answers from its CORS entries: `origin`, `method`, `responseHeader` and `maxAgeSeconds` (how long the browser may cache the preflight).',
			'',
			'```json',
			'[{ "origin": ["https://shop.example.com"],',
			'   "method": ["PUT", "GET"],',
			'   "responseHeader": ["Content-Type", "x-goog-resumable"],',
			'   "maxAgeSeconds": 3600 }]',
			'```',
			'',
			'**Common traps:** a long expiry on a URL that leaks, `"origin": ["*"]` on a bucket that takes uploads, and forgetting CORS, which makes a valid URL fail only in the browser.'
		),
		try: [
			{
				label: 'Is the signed URL still valid?',
				code: String.raw`// Toy model of V4 timing: X-Goog-Expires counts seconds from X-Goog-Date; the longest allowed is 604800 seconds (7 days).
const MAX = 604800;
function check(signedAtSec, expiresSec, nowSec) {
  if (expiresSec > MAX) return 'rejected: expiry above 7 days';
  return nowSec < signedAtSec + expiresSec ? 'valid' : 'expired';
}
const t0 = 1000000;
console.log('after 5 min, 15 min expiry:', check(t0, 900, t0 + 300));
console.log('after 20 min, 15 min expiry:', check(t0, 900, t0 + 1200));
console.log('30 day expiry:', check(t0, 30 * 86400, t0));`
			}
		]
	},

	// ───────────────────────── gcp-iam-basics ─────────────────────────
	{
		id: 'gcp-iam-basics',
		title: 'IAM basics',
		level: 'basic',
		summary: 'Understand principals, roles, allow policies and service accounts, and why least privilege means avoiding broad roles.',
		scenes: ['gc-iam-binding', 'gc-iam-console'],
		notes: md(
			'**IAM** answers who can do what on which resource. You cannot grant a permission directly. A grant has three parts, a **principal**, a **role** and a **resource**, and it is stored in an **allow policy**: a list of **role bindings** attached to the resource.',
			'',
			'**Principals** include Google accounts, Google groups, **service accounts** (identities for apps and jobs) and federated identities. Grant to groups rather than individuals so access follows the team.',
			'',
			'**Roles** are collections of permissions, written `SERVICE.RESOURCE.VERB`, such as `compute.instances.list`. There are three kinds:',
			'',
			'- **Basic roles**: broad access across all services (Admin, Writer, Reader, and the older Owner, Editor and Viewer).',
			'- **Predefined roles**: granular, per service, maintained by Google, such as Storage Object Viewer.',
			'- **Custom roles**: your own list of permissions, for when nothing predefined fits.',
			'',
			'```json',
			'{ "bindings": [',
			'  { "role": "roles/storage.objectViewer",',
			'    "members": ["group:support@example.com"] } ] }',
			'```',
			'',
			'**Least privilege**: give each identity only what it needs. Google\'s guidance is not to grant basic roles in production unless there is no alternative, and to prefer the narrowest predefined or custom role.',
			'',
			'**Common trap:** Editor or Owner on a project "to make it work". The app (a Cloud Run service) should run as its own service account with one narrow role on the one bucket it reads.'
		),
		try: [
			{
				label: 'Does this principal have the role?',
				code: String.raw`// Toy model of an allow policy: a list of bindings, each giving a role to some principals.
const policy = [
  { role: 'storage.objectViewer', members: ['group:support@example.com', 'serviceAccount:web@shop.iam'] },
  { role: 'storage.objectAdmin', members: ['serviceAccount:uploader@shop.iam'] }
];
const roles = {
  'storage.objectViewer': ['storage.objects.get', 'storage.objects.list'],
  'storage.objectAdmin': ['storage.objects.get', 'storage.objects.list', 'storage.objects.create', 'storage.objects.delete']
};
function can(principal, permission) {
  return policy.some((b) => b.members.includes(principal) && roles[b.role].includes(permission));
}
console.log(can('serviceAccount:web@shop.iam', 'storage.objects.get'));
console.log(can('serviceAccount:web@shop.iam', 'storage.objects.delete'));
console.log(can('serviceAccount:uploader@shop.iam', 'storage.objects.delete'));`
			}
		]
	},

	// ───────────────────────── gcp-iam-advanced ─────────────────────────
	{
		id: 'gcp-iam-advanced',
		title: 'IAM inheritance, deny and keyless access',
		level: 'advanced',
		summary: 'Follow how policies inherit down the hierarchy, how deny policies and Conditions narrow access, and how impersonation and federation replace service account keys.',
		scenes: ['gc-iam-inherit-deny', 'gc-iam-keyless'],
		notes: md(
			'**Inheritance.** An allow policy on an organization, folder or project applies to everything beneath it. The **effective allow policy** of a resource is its own policy combined with those of all its ancestors. Granting once on a folder is easy, and so is granting too much, so grant as low as makes sense.',
			'',
			'**Deny policies** are guardrails. They attach to an organization, folder or project and list denied principals, denied permissions and optional exception principals. IAM checks deny policies **before** allow policies, so a denied permission stays blocked even when a role grants it. Only some permissions can be denied, and a deny rule\'s condition can only use resource tag functions.',
			'',
			'**IAM Conditions** put an expression on a role binding, so the role applies only when it evaluates to true. For a temporary grant:',
			'',
			'```',
			"request.time < timestamp('2026-12-31T00:00:00Z')",
			'```',
			'',
			'A conditional binding does not cancel an unconditional one: if the same principal has the role without a condition, they keep it. On a bucket, conditions need uniform bucket-level access.',
			'',
			'**Service account keys** are long-lived: having the private key is like knowing a password. Google advises treating keys as an exception, and organizations created from May 2024 onward block key creation by default.',
			'',
			'**Impersonation.** A principal with the **Service Account Token Creator** role (permission `iam.serviceAccounts.getAccessToken`) can get short-lived credentials for a service account instead. Audit logs record both identities.',
			'',
			'**Workload Identity Federation** lets an outside workload (GitHub Actions, AWS, Azure, any OIDC or SAML provider) swap its own token with the Security Token Service for a short-lived Google credential. No key file exists to leak.'
		),
		try: [
			{
				label: 'Inheritance, then deny',
				code: String.raw`// Toy model: allow policies add up the hierarchy; a matching deny wins over any allow.
const chain = ['org', 'folder:production', 'project:shop-prod', 'bucket:invoices'];
const allow = { 'folder:production': [{ who: 'group:billing', perms: ['objects.get', 'objects.delete'] }] };
const deny = { org: [{ who: 'group:billing', perms: ['objects.delete'], except: ['group:security'] }] };
function decide(who, perm) {
  for (const node of chain) {
    for (const d of deny[node] || []) {
      if (d.who === who && d.perms.includes(perm) && !(d.except || []).includes(who)) return 'DENIED by ' + node;
    }
  }
  for (const node of chain) {
    for (const a of allow[node] || []) if (a.who === who && a.perms.includes(perm)) return 'allowed via ' + node;
  }
  return 'no access';
}
console.log(decide('group:billing', 'objects.get'));
console.log(decide('group:billing', 'objects.delete'));
console.log(decide('group:support', 'objects.get'));`
			}
		]
	},

	// ───────────────────────── gcp-cdn-and-load-balancing ─────────────────────────
	{
		id: 'gcp-cdn-and-load-balancing',
		title: 'Load balancing and Cloud CDN',
		level: 'mid',
		summary: 'Know the pieces of the global external Application Load Balancer, the three Cloud CDN cache modes, cache keys and invalidation.',
		scenes: ['gc-lb-chain', 'gc-cdn-cache'],
		notes: md(
			'The **global external Application Load Balancer** is one worldwide front door. A request passes through a chain of pieces:',
			'',
			'1. **Forwarding rule**: a global external IP address and a port (one port per rule).',
			'2. **Target HTTPS proxy**: ends the client\'s TLS connection, using the certificates you attach.',
			'3. **URL map**: routes by host, path, cookies or headers, and can redirect.',
			'4. **Backend service** (a group of healthy backends, such as a serverless NEG for Cloud Run) **or backend bucket** (a Cloud Storage bucket).',
			'',
			'A **health check** probes backends. Firewall rules must allow the probe ranges, or healthy instances look dead.',
			'',
			'**Cloud CDN** caches at Google\'s edge, on the backend service or backend bucket. Its **cache modes**:',
			'',
			'- **CACHE_ALL_STATIC** (the default when created with gcloud or the API): caches successful responses for static types such as images, CSS and JavaScript, plus anything the origin marks cacheable.',
			'- **USE_ORIGIN_HEADERS**: caches only what the origin\'s cache headers allow.',
			'- **FORCE_CACHE_ALL**: caches every successful response, overriding the origin. It can cache private, per-user pages, so use it with care.',
			'',
			'A response is cacheable only for a GET with no `Set-Cookie` and no `private` or `no-store` (unless forced).',
			'',
			'The **cache key** decides what counts as "the same request". For a backend service it is the whole URI by default (protocol, host, path and query string). You can drop the host, protocol or query string, or include or exclude chosen query parameters, so tracking parameters stop creating copies.',
			'',
			'**Invalidation** removes cached copies by path pattern (trailing `*`), host or cache tag. Use targeted patterns; invalidating everything can send a spike of traffic to your backends. Better still, use versioned file names such as `app.4f3a.js`, so you rarely invalidate at all.'
		),
		try: [
			{
				label: 'Build a cache key',
				code: String.raw`// Toy model of a Cloud CDN cache key: the default is the whole URI; you can drop parts or keep only listed query params.
function key(url, opts = {}) {
  const u = new URL(url);
  const parts = [];
  if (!opts.omitProtocol) parts.push(u.protocol + '//');
  if (!opts.omitHost) parts.push(u.host);
  parts.push(u.pathname);
  const q = [...u.searchParams].filter(([k]) => !opts.includeOnly || opts.includeOnly.includes(k)).sort(([a], [b]) => a.localeCompare(b));
  if (q.length) parts.push('?' + q.map(([k, v]) => k + '=' + v).join('&'));
  return parts.join('');
}
const a = 'https://shop.example.com/p/42?color=red&utm_source=mail';
const b = 'https://shop.example.com/p/42?utm_source=ad&color=red';
console.log('default keys equal?', key(a) === key(b));
console.log('keep only color equal?', key(a, { includeOnly: ['color'] }) === key(b, { includeOnly: ['color'] }));
console.log(key(a, { includeOnly: ['color'] }));`
			}
		]
	},

	// ───────────────────────── gcp-dns-and-certificates ─────────────────────────
	{
		id: 'gcp-dns-and-certificates',
		title: 'Cloud DNS and certificates',
		level: 'basic',
		summary: 'Host a domain in Cloud DNS, point the registrar at it, and get a Google-managed certificate validated with a DNS record.',
		scenes: ['gc-dns-cert'],
		notes: md(
			'**Cloud DNS** hosts your DNS zones and publishes them to the global DNS. A **public zone** is visible on the internet; a **private zone** is visible only from the VPC networks you attach to it.',
			'',
			'A zone holds **record sets**. The common types: **A** (name to IPv4), **AAAA** (name to IPv6), **CNAME** (an alias to another name), **MX** (mail servers), **TXT** (text), **NS** (the zone\'s name servers) and **SOA** (created for you with the zone). Each record has a **TTL**, how long resolvers may cache it. A CNAME cannot sit at the zone **apex** (`example.com`), because it cannot exist next to the SOA and NS records that are always there.',
			'',
			'**Delegation.** Creating a public zone is not enough. At your **registrar** (Cloud Domains or a third party) you must change the domain\'s name servers to the zone\'s Cloud DNS name servers, at least two and ideally all of them. Until then the world still asks the old name servers.',
			'',
			'**Certificates.** **Certificate Manager** obtains and manages TLS certificates for Google Cloud load balancers. **Google-managed** certificates are issued and renewed automatically; **self-managed** ones you obtain, upload and renew yourself.',
			'',
			'To prove you control the domain, **DNS authorization** gives you a **CNAME record** to add to your zone, named like `_acme-challenge.shop.example.com`, pointing at a Google-provided target. It must be the only record at that name. For a wildcard certificate you authorize the parent domain. Certificates reach the load balancer through the HTTPS proxy, directly or through a certificate map.',
			'',
			'**Common traps:** forgetting the registrar step, putting a CNAME at the apex, and deleting the validation CNAME that renewals rely on.'
		),
		try: [
			{
				label: 'Resolve a name in a zone',
				code: String.raw`// Toy model of record lookup: follow a CNAME to its target, and refuse a CNAME at the apex.
const zone = 'example.com';
const records = [
  { name: 'example.com', type: 'A', value: '203.0.113.10', ttl: 300 },
  { name: 'shop.example.com', type: 'CNAME', value: 'lb.example.com', ttl: 300 },
  { name: 'lb.example.com', type: 'A', value: '203.0.113.10', ttl: 300 }
];
function resolve(name, hops = 0) {
  if (hops > 5) return 'loop';
  const r = records.find((x) => x.name === name);
  if (!r) return 'NXDOMAIN';
  return r.type === 'CNAME' ? name + ' -> ' + resolve(r.value, hops + 1) : r.value + ' (ttl ' + r.ttl + ')';
}
console.log(resolve('shop.example.com'));
const bad = { name: zone, type: 'CNAME' };
console.log('CNAME at apex allowed?', bad.name !== zone);`
			}
		]
	}
];

// ───────────────────────── question banks ─────────────────────────
const rp = builder('GC', 'gcp-request-path');
rp.add('basic', 'dns-role',
	'In a store hosted on Google Cloud, what does Cloud DNS do for a request to shop.example.com?',
	'It answers with the address to connect to',
	['It keeps cached copies of images at locations close to each shopper', 'It starts the app containers whenever traffic arrives from a browser', 'It stores the orders and customers in a relational database'],
	'Cloud DNS is the DNS service: it resolves a name to an address, here the load balancer\'s IP. Caching copies is Cloud CDN, starting containers is Cloud Run, and storing orders is the database.');
rp.add('basic', 'static-where',
	'Product photos rarely change and are requested constantly. Where should most of those requests be answered?',
	'At the CDN edge, with a bucket as the origin',
	['By Cloud SQL, using an index on an image column', 'By the Cloud Run container, reading each file from disk every single time', 'By Cloud DNS, which keeps one copy of every image'],
	'Static files that change rarely are ideal for an edge cache with a bucket behind it. Serving them from the database or the app container spends expensive capacity, and DNS only resolves names.');
rp.add('mid', 'to-cloud-run',
	'How does the load balancer send a dynamic request to a Cloud Run service?',
	'Through a serverless NEG used as a backend',
	['By opening an SSH session to each running container on demand', 'Through a CNAME record that points straight at the container', 'By copying the app\'s container image into the load balancer itself'],
	'A serverless network endpoint group represents a Cloud Run service as a backend, so the URL map can route to it like any other backend service. Containers are not reached over SSH, and DNS records do not do request routing.');
rp.add('mid', 'personal-page',
	'A shopper\'s cart page is different for every user. How should the CDN treat it?',
	'Do not cache it, or key the entry by user',
	['Cache it for a day, because every page is basically static', 'Store it in a bucket with a long TTL and serve that copy to everyone', 'Skip the app and read it straight from Cloud SQL'],
	'Per-user content must not be shared between shoppers, so it is either left out of the cache or keyed per user. A long TTL or a bucket copy would show one shopper another\'s cart, and the app, not the browser, owns the database.');
rp.add('advanced', 'db-last',
	'Why is the design goal to answer as many requests as possible before they reach Cloud SQL?',
	'It is the hardest layer to scale, so upstream hits protect it',
	['Cloud SQL cannot store product data such as names and prices', 'Each query is billed at the same rate as one CDN request', 'The load balancer only contacts Cloud SQL once every cache in front of it has filled up'],
	'Stateless layers such as Cloud Run scale out easily, but a relational database is much harder to scale. Every request answered by the CDN or a cache is one the database never sees. The other options describe things that are not true.');

const pb = builder('GC', 'gcp-projects-and-billing');
pb.add('basic', 'hierarchy-order',
	'Which list shows the Google Cloud resource hierarchy from the top down?',
	'Organization, folder, project, resource',
	['Project, organization, folder, resource', 'Organization, project, folder, then the resources inside', 'Folder, organization, resource, project'],
	'The organization is the root, folders group projects (and other folders), projects hold the resources, and each resource has exactly one parent. A project cannot contain a folder.');
pb.add('basic', 'project-unit',
	'Why do teams usually keep production and staging in separate projects?',
	'A project bounds APIs, access, billing and quotas',
	['Google Cloud allows only one database per project, so staging needs its own', 'Resources in different projects can never talk to each other, which keeps them apart', 'A project\'s name must match the environment it serves'],
	'APIs, billing links, IAM grants and quotas all attach to the project, so separate projects contain mistakes and runaway usage. Projects can still connect over networks and IAM, there is no one-database rule, and names are free labels.');
pb.add('mid', 'budget-no-cap',
	'A monthly budget has alerts at 50%, 90% and 100%. Spend reaches 130% of the budget. What happens to the running services?',
	'They keep running; alerts-only budgets never stop usage',
	['They stop at 100% and restart on the first day of the next month', 'They are scaled down to the free tier until someone approves more', 'They are paused only if the project has been labelled as production'],
	'An alerts-only budget notifies people and never caps spending. Stopping anything needs your own automation (for example reacting to the budget\'s Pub/Sub messages) or a different control. There is no automatic downgrade and labels do not matter.');
pb.add('mid', 'forecast-rule',
	'What does a forecasted threshold rule do?',
	'It alerts when projected spend will pass the threshold',
	['It alerts only after the monthly invoice has been issued to the account', 'It limits spending to the forecasted amount until the period ends', 'It predicts which project will be deleted'],
	'Forecasted rules use the projected total through the end of the period, so you hear about an overrun before it happens. Actual rules use spend so far. Neither one issues invoices or limits usage.');
pb.add('advanced', 'label-scope',
	'One billing account pays for several teams\' projects. How can a budget watch just the shop team across all of its projects?',
	'Scope it to a label such as team=shop',
	['Give each team its own organization so the totals stay separate', 'Rename the shop projects so that they all sort next to each other in lists', 'Raise the alert thresholds for the projects that belong to that team'],
	'A budget on a billing account can filter by a label key and value, which works across projects. Organizations, project names and threshold percentages do not group spend by team.');

const gs = builder('GC', 'gcs-storage');
gs.add('basic', 'flat-names',
	'In a standard (flat namespace) bucket, what are the slashes in products/42/front.jpg?',
	'Ordinary characters that the console draws as folders',
	['Separators that create real folders with their own permissions', 'A request to store the file in three regions at once', 'Markers that must be escaped before the upload'],
	'A flat namespace has no folders: the whole string is the name, and the console splits it on slashes for display. Only buckets with hierarchical namespace enabled have real folders. Slashes are legal in names and do not choose locations.');
gs.add('basic', 'location-types',
	'Which bucket location type is a specific pair of regions that you choose?',
	'Dual-region',
	['Region', 'Multi-region', 'Zone'],
	'A dual-region bucket replicates data across two chosen regions. A region is a single place, a multi-region is a large area with two or more regions, and a zone is not a bucket location.');
gs.add('mid', 'cold-class',
	'A bucket of year-old invoices is read about once a year. Which change fits, and what does it cost in read speed?',
	'Coldline or Archive via a lifecycle rule; reads stay in milliseconds',
	['Standard, because it is the only class with millisecond reads', 'Archive, and accept that every retrieval then takes hours', 'Deletion, because the colder classes cannot be read back at all'],
	'All storage classes serve reads with low latency; colder classes trade lower storage cost for retrieval fees and longer minimum storage durations. Archive is not offline storage, and Standard is not special for speed.');
gs.add('mid', 'uniform-access',
	'What does turning on uniform bucket-level access change?',
	'ACLs stop working; only IAM decides access',
	['Every object is encrypted with a key that you supply yourself', 'The bucket becomes readable by anyone who knows its name', 'Objects can no longer be overwritten once they exist'],
	'Uniform bucket-level access disables ACLs so there is one permission system, IAM. It does not change encryption, make anything public, or block overwrites. After 90 consecutive days it cannot be turned off again.');
gs.add('advanced', 'default-class',
	'You change a bucket\'s default storage class from Standard to Nearline. What happens to the objects already in it?',
	'They keep their class; the default applies to new objects',
	['They are all rewritten to Nearline within about a day', 'They are deleted and uploaded again by the console', 'Each one moves to Nearline the next time it is read'],
	'A bucket\'s default class is applied to new objects only. To change existing objects you rewrite them or add a lifecycle rule. Reading an object never changes its class.');

const su = builder('GC', 'gcs-signed-urls-and-cors');
su.add('basic', 'what-signed',
	'What does a V4 signed URL give the person who holds it?',
	'Time-limited access to one object, for one action',
	['Owner rights on the whole bucket until the signing key is rotated', 'A permanent link to every object that shares the same prefix', 'A new service account created for their email address'],
	'A signed URL carries a signature for one object, one action and an expiry, and no account is needed. It is not bucket-wide, not permanent, and creates no identity. Anyone who has the URL can use it, so keep it private.');
su.add('basic', 'max-expiry',
	'What is the longest expiry a V4 signed URL can have?',
	'7 days',
	['1 hour', '30 days', '1 year'],
	'The V4 limit is 604800 seconds, which is 7 days. Shorter is better: examples in the documentation use minutes, because a leaked URL works until it expires.');
su.add('mid', 'where-sign',
	'Where should the code that signs upload URLs run?',
	'On your server, using a service account',
	['In the shopper\'s browser, with the key bundled into the JavaScript', 'At the CDN edge, using whatever cookies the viewer sends along', 'Inside Cloud DNS, right next to the zone that serves the name'],
	'Signing needs a credential, usually a service account, which must stay on the server. Shipping it to the browser hands everyone the ability to sign. The CDN and DNS are not signing services.');
su.add('mid', 'cors-fix',
	'A browser PUT from shop.example.com to a valid signed URL fails with a CORS error. What is the likely fix?',
	'Add the origin and PUT to the bucket\'s CORS entry',
	['Lengthen the URL\'s expiry to the maximum of seven days', 'Make the bucket public so the preflight is allowed through', 'Switch the signing service account to a custom role'],
	'The URL is fine; the browser\'s preflight is being refused because the bucket has no CORS entry for that origin and method. Expiry, public access and the signer\'s role do not affect a CORS preflight.');
su.add('advanced', 'resumable',
	'A shopper uploads a 2 GB video over an unreliable connection. Which approach avoids starting from zero after a drop?',
	'A resumable upload that continues from the stored offset',
	['A single-request upload with a longer signed-URL expiry', 'Uploading to the CDN edge cache first, then copying it across', 'Splitting the file by hand into ten separate buckets'],
	'A resumable upload keeps a session, so after an interruption the client reads the stored offset and sends only the rest. A longer expiry only makes a failed single request retry from the start, and neither the cache nor extra buckets provide resuming.');

const ib = builder('GC', 'gcp-iam-basics');
ib.add('basic', 'three-parts',
	'What three things does a grant in IAM combine?',
	'A principal, a role and a resource',
	['A user, a password and a project to sign in to', 'A bucket, a key and a region where the key lives', 'A group, a label and a quota'],
	'IAM grants a role to a principal on a resource, and the allow policy stores that as a role binding. Passwords, keys, labels and quotas are not part of a grant.');
ib.add('basic', 'basic-roles',
	'What does Google advise about basic roles such as Owner and Editor in production?',
	'Avoid them unless nothing else works; use narrower roles',
	['Use them everywhere, because they are the easiest to audit later', 'Grant them only to service accounts and never to people', 'Use them for every new project, then remove them after a year'],
	'Basic roles contain thousands of permissions across all services, which defeats least privilege. Narrow predefined roles, or custom ones, give people and services only what they need.');
ib.add('mid', 'app-identity',
	'Which identity should the Cloud Run service use to read product images from one bucket?',
	'Its own service account with a read-only Storage role on that bucket',
	['A developer\'s personal account with the Editor role on the project', 'One shared service account that has Owner on the whole project', 'No identity at all, with the bucket made public'],
	'A dedicated service account with one narrow role on one resource is least privilege. Personal or shared broad accounts spread power and are hard to audit, and a public bucket exposes every object to everyone.');
ib.add('mid', 'permission-shape',
	'In the permission compute.instances.list, what are the three parts?',
	'Service, resource type and action',
	['The project, the region and the user making the request', 'The role, the group and the folder it was granted on', 'The API key, the zone and the tense of the verb'],
	'Permissions follow SERVICE.RESOURCE.VERB: Compute Engine (service), instances (resource type), list (action). Roles are collections of such permissions.');
ib.add('advanced', 'custom-role',
	'When is a custom role the right choice?',
	'When no predefined role fits and you want least privilege',
	['Whenever a predefined role exists, so that the names stay consistent across teams', 'When you want a role that works on every project without ever being created', 'When a service account needs the Owner role without the usual warnings'],
	'Predefined roles are maintained by Google and are the first choice. A custom role lets you list exactly the permissions you need when none fits. Custom roles must be created and kept up to date by you, and they are not a way around Owner.');

const ia = builder('GC', 'gcp-iam-advanced');
ia.add('basic', 'deny-wins',
	'A group is allowed to delete objects by a role binding, but an organization deny policy covers that permission for the group. Can members delete objects?',
	'No: deny is checked before allow, and wins',
	['Yes, because the more specific allow binding wins over a general rule', 'Yes, but only during business hours when the binding applies', 'Only if the group also holds the Viewer role on the project'],
	'IAM evaluates deny policies first, so a denied permission is blocked regardless of the roles granted, unless the principal is listed as an exception. Specificity of an allow binding does not beat a deny.');
ia.add('mid', 'inheritance',
	'A role is granted to a group on the folder "production". Which resources does it reach?',
	'Every project and resource under that folder',
	['Only the folder itself and nothing that sits inside it', 'Only the first project that was ever created in the folder', 'Every project in the organization, including other folders'],
	'Allow policies on a container apply to all resources beneath it. The grant does not reach siblings or other folders, and it does not stop at the folder\'s own boundary.');
ia.add('mid', 'condition',
	'Which feature grants a role only until a given date?',
	'A condition on the binding that checks request.time',
	['A label on the project that holds an expiry value', 'A longer TTL on the Cloud DNS record for the service', 'A signed URL attached to the role itself'],
	'IAM Conditions put an expression on a binding, and request.time lets it expire. Labels, DNS TTLs and signed URLs do not change when an IAM role applies.');
ia.add('advanced', 'impersonation',
	'Which permission lets a principal obtain short-lived credentials for a service account?',
	'iam.serviceAccounts.getAccessToken',
	['storage.objects.create, included in Storage Object Creator', 'iam.roles.create, included in Role Administrator', 'resourcemanager.projects.get, included in Browser'],
	'Impersonation needs the permission to mint tokens for the target service account, which the Service Account Token Creator role contains. The other permissions manage objects, roles or project metadata. Audit logs show both the caller and the service account.');
ia.add('advanced', 'federation',
	'A GitHub Actions job must deploy to Google Cloud. What replaces a downloaded service account key?',
	'Workload Identity Federation',
	['A signed URL stored in the repository secrets', 'A custom role that carries an expiry date', 'A longer-lived key that is rotated every year'],
	'Federation lets an external workload trade its identity token with the Security Token Service for a short-lived credential, so there is no key file to leak. A signed URL or a custom role is not an identity, and a rotated key is still a key.');

const cl = builder('GC', 'gcp-cdn-and-load-balancing');
cl.add('basic', 'url-map',
	'In the global external Application Load Balancer, which piece chooses a backend from the host and path of a request?',
	'The URL map',
	['The forwarding rule', 'The health check', 'The SSL policy'],
	'The URL map holds the routing rules by host, path, cookies or headers. The forwarding rule only accepts traffic on an IP and port, the health check tests backends, and an SSL policy sets TLS options.');
cl.add('basic', 'force-cache',
	'Which Cloud CDN cache mode caches every successful response, even when the origin says it is private?',
	'FORCE_CACHE_ALL',
	['USE_ORIGIN_HEADERS', 'CACHE_ALL_STATIC', 'No mode can do that'],
	'FORCE_CACHE_ALL overrides the origin\'s directives, which is why it can expose per-user pages. USE_ORIGIN_HEADERS obeys the origin, and CACHE_ALL_STATIC caches static content types plus what the origin marks cacheable.');
cl.add('mid', 'cache-key',
	'Product pages differ only by a tracking query parameter such as utm_source, yet each link creates a separate cache entry. What helps?',
	'Exclude that parameter from the cache key',
	['Use FORCE_CACHE_ALL so that keys no longer matter', 'Invalidate the whole cache every hour to stay clean', 'Move the pages into a different project'],
	'The default key for a backend service includes the full query string, so every tracking value is a new key. Excluding the parameter, or including only the ones that change the page, lets requests share an entry.');
cl.add('mid', 'health-probe',
	'Every instance behind the load balancer shows unhealthy, though the app answers on its own address. What is a common cause?',
	'A firewall rule blocks the probe ranges',
	['The URL map has a trailing slash on the default route', 'The certificate on the proxy is self-managed rather than managed by Google', 'The CDN cache mode is set to USE_ORIGIN_HEADERS'],
	'Health check probes come from Google ranges, and firewall rules must allow them, otherwise healthy instances look dead. URL map details, certificate type and cache mode do not affect probes.');
cl.add('advanced', 'invalidate',
	'A bad image release must be cleared from the CDN. What is the best-targeted action?',
	'Invalidate /images/*, not everything',
	['Invalidate /* so that nothing is missed anywhere', 'Delete the URL map and recreate it from scratch', 'Turn the CDN off for a day and turn it back on'],
	'A trailing-wildcard path pattern removes only what is wrong. Invalidating everything can send a spike of traffic to the backends, and the other options are far more disruptive. Versioned file names would avoid the problem next time.');

const dc = builder('GC', 'gcp-dns-and-certificates');
dc.add('basic', 'delegation',
	'You created a public Cloud DNS zone for your domain, but the world still resolves the old addresses. What is the missing step?',
	'Point the registrar\'s name servers at the zone',
	['Add a second A record with a much lower TTL', 'Attach a certificate to the forwarding rule', 'Turn the zone into a private zone for the whole domain'],
	'Resolvers find a domain through the name servers set at the registrar. Until those point at Cloud DNS, the new zone is never asked. Extra records, certificates and private zones do not change delegation.');
dc.add('basic', 'private-zone',
	'Who can resolve names in a private Cloud DNS zone?',
	'Only the VPC networks you attach',
	['Anyone on the internet, like a public zone', 'Only people who hold the Owner role on the project', 'Only clients that sit in the same region as the zone'],
	'A private zone is visible from the VPC networks you choose, not the public internet. Roles do not decide DNS visibility, and DNS zones are not tied to a region.');
dc.add('mid', 'apex-cname',
	'Why can you not put a CNAME record at the zone apex (example.com)?',
	'A CNAME cannot coexist with the SOA and NS records there',
	['CNAME records may only point to IPv6 addresses, never to names', 'The apex must use a TTL below 60 seconds, which CNAMEs forbid', 'CNAME records are only allowed in private zones'],
	'A CNAME makes the name an alias of another and so cannot coexist with other record types, but the apex always carries SOA and NS records. The other options describe rules that do not exist.');
dc.add('mid', 'managed-cert',
	'What is the main benefit of a Google-managed certificate?',
	'Google issues and renews it automatically',
	['It works without the domain being validated first', 'It can be downloaded and installed on any server you run', 'It never expires, so it never needs attention'],
	'Google-managed certificates are obtained and renewed for you once the domain is validated. Self-managed certificates are the ones you obtain and renew yourself. Validation is still required and certificates still expire.');
dc.add('advanced', 'dns-auth',
	'How does DNS authorization show that you control a domain?',
	'You publish the _acme-challenge CNAME it gives you',
	['You upload the domain\'s private key to a Cloud Storage bucket', 'You email the registrar a screenshot of the finished DNS zone', 'You make a bucket public for ten minutes and wait for a check'],
	'Certificate Manager gives you a CNAME record under _acme-challenge that you publish in your zone; seeing it proves control, and it must remain the only record at that name for renewals. Keys, emails and public buckets are not part of validation.');

export const banks: { out: Question[] }[] = [rp, pb, gs, su, ib, ia, cl, dc];
