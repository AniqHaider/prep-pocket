import type { Scene, SceneNode, Tone } from '../types';

/** AWS: the services an online store meets most. Ids `aw-*`; `group` = a topic id in src/db/aws.ts. A generic online store, no vendor names. */

// A vertical chain of boxes joined by arrows: box ids `<p>0..n`, edge ids `<p>e0..` (edge i joins box i and box i+1). The first box starts visible.
type Item = { l: string; s?: string; tone?: Tone };
const stack = (p: string, items: Item[], o: { x?: number; w?: number; y?: number; h?: number; gap?: number } = {}): SceneNode[] => {
	const { x = 16, w = 200, y = 14, h = 44, gap = 28 } = o;
	const out: SceneNode[] = [];
	items.forEach((it, i) => {
		out.push({ id: p + i, kind: 'box', x, y: y + i * (h + gap), w, h, label: it.l, sub: it.s, tone: it.tone, visible: i === 0 ? true : undefined });
		if (i) out.push({ id: p + 'e' + (i - 1), kind: 'edge', from: p + (i - 1), to: p + i });
	});
	return out;
};

export const awsScenes: Scene[] = [
	// ───────────── storefront-request-path ─────────────
	{
		id: 'aw-request-path',
		topic: 'aws',
		group: 'storefront-request-path',
		title: 'A page view across AWS',
		blurb: 'Which AWS service touches a shopper\'s request, in order?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('a', [
				{ l: 'Browser', s: 'opens shop.example.com' },
				{ l: 'Route 53', s: 'turns the name into an address' },
				{ l: 'CloudFront', s: 'edge cache near the shopper' },
				{ l: 'Load balancer + ECS', s: 'your app containers' },
				{ l: 'RDS database', s: 'orders and products' }
			]),
			{ id: 's3', kind: 'box', x: 240, y: 158, w: 104, h: 62, label: 'S3', sub: 'images and scripts' }
		],
		steps: [
			{ say: 'A shopper types shop.example.com. Every AWS service in this path has one small job, and each hands the request to the next.', focus: ['a0'] },
			{ say: 'Route 53 is DNS. It answers with the address of CloudFront, because the store\'s domain is pointed there.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The browser connects to a nearby CloudFront edge location, which keeps copies of content so most requests never travel far.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'Static files like images and scripts live in S3. CloudFront fetches them from there once, then serves cached copies.', show: ['s3'], set: { s3: { tone: 'accent' } }, focus: ['s3'] },
			{ say: 'A page that needs fresh data is not cached. CloudFront forwards it to a load balancer, which spreads it over your ECS containers.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'The app reads and writes orders in the RDS database. The response then flows back out, and CloudFront may keep a copy if the headers allow it.', show: ['a4', 'ae3'], focus: ['a4'] }
		]
	},

	// ───────────── s3-storage ─────────────
	{
		id: 'aw-s3-bucket-key',
		topic: 'aws',
		group: 's3-storage',
		title: 'S3 is buckets and keys',
		blurb: 'What are S3 folders really, and what happens on overwrite?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'b', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'Bucket: shop-assets-prod', sub: 'one Region, name unique across AWS', visible: true },
			{ id: 'keys', kind: 'doc', x: 16, y: 74, w: 328, title: 'Objects: key to bytes', lines: ['products/42/front.jpg', 'products/42/back.jpg', 'invoices/2025/A-1042.pdf'] },
			{ id: 'ls', kind: 'box', x: 16, y: 190, w: 328, h: 44, label: 'List with prefix products/42/', sub: 'returns the first two keys' },
			{ id: 'put', kind: 'box', x: 16, y: 262, w: 328, h: 44, label: 'PUT products/42/front.jpg again', sub: 'replaces it unless versioning is on', tone: 'warn' }
		],
		steps: [
			{ say: 'A bucket is the top-level container. Its name must be unique across all AWS accounts, and it lives in one Region.', focus: ['b'] },
			{ say: 'Inside, an object is just bytes plus metadata, found by its key. Bucket plus key is the whole address.', show: ['keys'], focus: ['keys'] },
			{ say: 'There are no real folders. The slashes are ordinary characters in the key, and the console only draws them as folders.', set: { keys: { hl: [0, 1] } }, focus: ['keys'] },
			{ say: 'A prefix is the start of a key. Listing by a prefix is how code finds "everything for product 42".', show: ['ls'], pulse: ['ls'] },
			{ say: 'Writing to a key that already exists replaces the object. Strong read-after-write consistency means the next read returns the new bytes.', show: ['put'], focus: ['put'] },
			{ say: 'To keep old copies you turn on versioning, so each overwrite becomes a new version instead of losing the previous one.', set: { put: { sub: 'with versioning: a new version is kept', tone: 'accent' } }, focus: ['put'] }
		]
	},
	{
		id: 'aw-s3-private-by-default',
		topic: 'aws',
		group: 's3-storage',
		title: 'Private bucket, public site',
		blurb: 'How do shoppers see images while the bucket stays private?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Shopper', s: 'asks for /img/front.jpg' },
				{ l: 'CloudFront', s: 'with origin access control' },
				{ l: 'Bucket policy', s: 'allows that distribution only' },
				{ l: 'S3 bucket', s: 'Block Public Access: on', tone: 'accent' }
			]),
			{ id: 'direct', kind: 'box', x: 240, y: 158, w: 104, h: 76, label: 'Direct S3 URL from anyone else', sub: 'denied', tone: 'neg' }
		],
		steps: [
			{ say: 'New S3 buckets are private by default. The goal is to serve images to everyone without ever making the bucket itself public.', focus: ['a0'] },
			{ say: 'The shopper asks CloudFront, not S3. CloudFront signs its own requests to the bucket using origin access control.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The bucket policy names that one CloudFront distribution as allowed to read objects. Nothing else is granted.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'Block Public Access stays on. It overrides any policy or ACL that would make the bucket public, even by mistake later.', show: ['a3', 'ae2'], pulse: ['a3'] },
			{ say: 'Someone who guesses the raw S3 URL is rejected, because only the CloudFront path is allowed.', show: ['direct'], focus: ['direct'] }
		]
	},

	// ───────────── s3-presigned-and-cors ─────────────
	{
		id: 'aw-presigned-upload',
		topic: 'aws',
		group: 's3-presigned-and-cors',
		title: 'Upload with a presigned URL',
		blurb: 'How does a browser upload to S3 without AWS keys?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Browser', s: 'wants to upload front.jpg' },
				{ l: 'Your API', s: 'checks login, signs a URL' },
				{ l: 'Browser sends the file', s: 'PUT to the signed URL' },
				{ l: 'S3 checks the signature', s: 'stores the object', tone: 'accent' }
			]),
			{ id: 'warn', kind: 'box', x: 240, y: 158, w: 104, h: 78, label: 'Anyone holding the URL can use it until it expires', tone: 'warn' }
		],
		steps: [
			{ say: 'The browser must not hold AWS keys. Instead it asks your own API for permission to upload one specific file.', focus: ['a0'] },
			{ say: 'The API checks the user is logged in, then uses its own IAM role to sign an S3 URL for that key, valid for a short time.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The browser sends the file straight to S3 using that URL. The upload never passes through your servers.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'S3 verifies the signature and expiry, and stores the object. It acts with the permissions of whoever signed, not of the browser.', show: ['a3', 'ae2'], pulse: ['a3'] },
			{ say: 'The URL is a bearer token. Keep the lifetime short and the key fixed, because anyone who has the link can use it.', show: ['warn'], focus: ['warn'] }
		]
	},
	{
		id: 'aw-cors-preflight',
		topic: 'aws',
		group: 's3-presigned-and-cors',
		title: 'CORS preflight to S3',
		blurb: 'Why does the browser block a call that the server accepts?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Page on app.example.com', s: 'wants to PUT to the bucket' },
				{ l: 'Browser sends OPTIONS', s: 'the preflight question' },
				{ l: 'S3 CORS rule answers', s: 'origins and methods allowed' },
				{ l: 'Browser sends the PUT', s: 'the real request', tone: 'accent' }
			]),
			{ id: 'curl', kind: 'box', x: 240, y: 158, w: 104, h: 78, label: 'curl or a server ignores CORS', tone: 'warn' }
		],
		steps: [
			{ say: 'A page on one origin calls a different origin, the bucket. Browsers only allow that if the other side says so.', focus: ['a0'] },
			{ say: 'For a PUT like this, the browser first sends a harmless OPTIONS request asking: may this origin do this?', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'S3 answers from the bucket\'s CORS configuration, listing allowed origins, methods and headers.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'If the origin and method match, the browser sends the real PUT. If not, it never sends it and the page sees a CORS error.', show: ['a3', 'ae2'], pulse: ['a3'] },
			{ say: 'CORS is the browser protecting its user, not a firewall. A script on a server, or curl, is not stopped by it.', show: ['curl'], focus: ['curl'] }
		]
	},

	// ───────────── cloudfront-caching ─────────────
	{
		id: 'aw-cf-hit-miss',
		topic: 'aws',
		group: 'cloudfront-caching',
		title: 'CloudFront hit and miss',
		blurb: 'When does CloudFront go back to the origin?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Viewer asks /logo.png' },
				{ l: 'Edge cache lookup', s: 'by cache key' },
				{ l: 'Origin (S3 or app)', s: 'only on a miss' },
				{ l: 'Edge stores a copy', s: 'until its TTL ends' }
			]),
			{ id: 'v2', kind: 'box', x: 240, y: 14, w: 104, h: 62, label: 'Second viewer, same file', tone: 'accent' }
		],
		steps: [
			{ say: 'A viewer asks for /logo.png. The request lands at the nearest CloudFront edge location.', focus: ['a0'] },
			{ say: 'The edge looks up the file by its cache key: the URL plus whichever headers, cookies or query strings you chose to include.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'Nothing is stored yet, so this is a miss. CloudFront fetches the file from the origin.', set: { a1: { sub: 'MISS', tone: 'warn' } }, show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The edge keeps a copy for the allowed time and returns it to the viewer. That first request was the slow one.', show: ['a3', 'ae2'], set: { a1: { sub: 'stored', tone: 'neutral' } }, pulse: ['a3'] },
			{ say: 'A second viewer near the same edge asks for it. The edge has it: a hit, served without touching the origin.', show: ['v2'], set: { a1: { sub: 'HIT', tone: 'accent' } }, hide: ['a2', 'ae1', 'a3', 'ae2'], focus: ['a1'] },
			{ say: 'When the copy expires, CloudFront asks the origin whether it changed. A 304 reply means keep it and reset the clock.', set: { a1: { sub: 'expired: revalidate', tone: 'warn' } }, show: ['a2', 'ae1'], focus: ['a2'] }
		]
	},
	{
		id: 'aw-cf-versioned-assets',
		topic: 'aws',
		group: 'cloudfront-caching',
		title: 'Invalidate or rename files?',
		blurb: 'What is the cleanest way to ship a new JavaScript file?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'dep', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'Deploy: app.js changed', sub: 'edges still hold the old copy', visible: true },
			{ id: 'inv', kind: 'box', x: 16, y: 90, w: 156, h: 74, label: 'Invalidate /app.js', sub: 'edge copies removed' },
			{ id: 'brw', kind: 'box', x: 188, y: 90, w: 156, h: 74, label: 'Browsers keep theirs', sub: 'until their own max-age ends', tone: 'warn' },
			{ id: 'hash', kind: 'box', x: 16, y: 196, w: 328, h: 44, label: 'Name by content: app.4f3a9c.js', sub: 'a new name is a new cache key', tone: 'accent' },
			{ id: 'html', kind: 'box', x: 16, y: 262, w: 328, h: 44, label: 'index.html points to the new name', sub: 'short TTL; assets: one year, immutable' }
		],
		steps: [
			{ say: 'You deploy a new app.js. CloudFront edges around the world still hold the old file under the same URL.', focus: ['dep'] },
			{ say: 'An invalidation removes the edge copies of /app.js. It works, but it takes a short while and covers only CloudFront.', show: ['inv'], focus: ['inv'] },
			{ say: 'Browsers keep their own copy until its max-age ends, so some visitors can still run the old file.', show: ['brw'], focus: ['brw'] },
			{ say: 'The cleaner fix is to put a content hash in the file name. A changed file gets a new URL, so there is nothing stale to remove.', show: ['hash'], pulse: ['hash'] },
			{ say: 'Only the small HTML page changes name references and keeps a short TTL. The hashed assets can be cached for a year as immutable.', show: ['html'], focus: ['html'] }
		]
	},
	{
		id: 'aw-cf-ttl-headers',
		topic: 'aws',
		group: 'cloudfront-caching',
		title: 'Who obeys which Cache-Control',
		blurb: 'How long do CloudFront and the browser each keep a response?',
		stage: { w: 360, h: 240 },
		nodes: [
			...stack('a', [
				{ l: 'Cache-Control: public, s-maxage=300, max-age=60', tone: 'neutral' },
				{ l: 'CloudFront edge', s: 'keeps it for s-maxage' },
				{ l: 'Browser', s: 'keeps it for max-age' }
			]),
			{ id: 'lim', kind: 'box', x: 240, y: 86, w: 104, h: 64, label: 'Min and max TTL still apply', tone: 'warn' }
		],
		steps: [
			{ say: 'Your origin sets Cache-Control on a response. Two different numbers can ride in the same header.', focus: ['a0'] },
			{ say: 'CloudFront prefers s-maxage, which is meant for shared caches. This edge keeps the response for 300 seconds.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The browser is a private cache and uses max-age. It keeps its own copy for only 60 seconds.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The distribution\'s minimum and maximum TTL can still clamp the value CloudFront uses. With no header at all, the default TTL applies.', show: ['lim'], focus: ['lim'] }
		]
	},

	// ───────────── iam-basics ─────────────
	{
		id: 'aw-iam-policy-role',
		topic: 'aws',
		group: 'iam-basics',
		title: 'A policy attached to a role',
		blurb: 'How does app code get S3 access without keys in the code?',
		stage: { w: 360, h: 350 },
		nodes: [
			{ id: 'pol', kind: 'doc', x: 16, y: 14, w: 328, title: 'Policy (JSON)', lines: ['{', '  "Effect": "Allow",', '  "Action": "s3:GetObject",', '  "Resource": "arn:aws:s3:::shop-assets/*"', '}'], visible: true },
			{ id: 'role', kind: 'box', x: 16, y: 150, w: 328, h: 44, label: 'Role: shop-api-task', sub: 'an identity with no password or keys' },
			{ id: 'task', kind: 'box', x: 16, y: 222, w: 328, h: 44, label: 'ECS task runs as that role', sub: 'gets temporary credentials' },
			{ id: 'ok', kind: 'box', x: 16, y: 294, w: 328, h: 44, label: 'Code calls S3, nothing else', sub: 'no access keys in the code', tone: 'accent' },
			{ id: 'e1', kind: 'edge', from: 'pol', to: 'role', label: 'attached' },
			{ id: 'e2', kind: 'edge', from: 'role', to: 'task' },
			{ id: 'e3', kind: 'edge', from: 'task', to: 'ok' }
		],
		steps: [
			{ say: 'A policy is a JSON document of rules. This one says: allow reading objects, but only in the shop-assets bucket.', focus: ['pol'] },
			{ say: 'A policy does nothing until it is attached to an identity. A role is an identity meant to be assumed, with no password or long-lived keys.', show: ['role', 'e1'], focus: ['role'] },
			{ say: 'The ECS task runs as the role, and AWS hands it short-lived credentials automatically.', show: ['task', 'e2'], focus: ['task'] },
			{ say: 'The code can read from that bucket and nothing more. Least privilege: grant only the actions and resources needed.', show: ['ok', 'e3'], pulse: ['ok'] }
		]
	},

	// ───────────── iam-evaluation-and-sts ─────────────
	{
		id: 'aw-iam-evaluation',
		topic: 'aws',
		group: 'iam-evaluation-and-sts',
		title: 'How AWS decides allow or deny',
		blurb: 'In what order does AWS weigh the policies on a request?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('a', [
				{ l: 'A request arrives', s: 'starts as denied' },
				{ l: 'Any explicit Deny?', s: 'in any applicable policy' },
				{ l: 'Is there an Allow?', s: 'identity or resource policy' },
				{ l: 'Boundary and org limits', s: 'permissions boundary, SCP' },
				{ l: 'Allowed', tone: 'accent' }
			]),
			{ id: 'd1', kind: 'box', x: 240, y: 86, w: 104, h: 44, label: 'Denied', tone: 'neg' },
			{ id: 'd2', kind: 'box', x: 240, y: 158, w: 104, h: 44, label: 'Denied', sub: 'implicit', tone: 'neg' },
			{ id: 'd3', kind: 'box', x: 240, y: 230, w: 104, h: 44, label: 'Denied', sub: 'not within limit', tone: 'neg' }
		],
		steps: [
			{ say: 'Every request starts from a default of deny. Nothing is allowed until some policy says yes.', focus: ['a0'] },
			{ say: 'First AWS looks for an explicit Deny anywhere that applies. One Deny wins over any number of Allows.', show: ['a1', 'ae0', 'd1'], focus: ['a1'] },
			{ say: 'Next it needs an Allow, from the caller\'s identity policy or from the resource\'s own policy. No Allow means an implicit deny.', show: ['a2', 'ae1', 'd2'], focus: ['a2'] },
			{ say: 'A permissions boundary or an organisation SCP can only limit. The action must also be inside those limits.', show: ['a3', 'ae2', 'd3'], focus: ['a3'] },
			{ say: 'Only a request that passes every check is allowed. Those limits never grant anything by themselves.', show: ['a4', 'ae3'], pulse: ['a4'] }
		]
	},
	{
		id: 'aw-sts-assume-role',
		topic: 'aws',
		group: 'iam-evaluation-and-sts',
		title: 'Assuming a role with STS',
		blurb: 'What do temporary credentials look like, and when do they end?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Role with two policies', s: 'trust and permissions' },
				{ l: 'Caller asks STS', s: 'AssumeRole on that role' },
				{ l: 'STS returns credentials', s: 'key, secret, session token' },
				{ l: 'Calls signed with them', s: 'until they expire', tone: 'accent' }
			]),
			{ id: 'life', kind: 'box', x: 240, y: 158, w: 104, h: 86, label: 'Default session: 1 hour', sub: 'you can set up to the role max', tone: 'warn' }
		],
		steps: [
			{ say: 'A role carries two policies. The trust policy says who may assume it. The permissions policy says what it can do.', focus: ['a0'] },
			{ say: 'A caller that the trust policy allows asks the Security Token Service, STS, to assume the role.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'STS returns temporary credentials: an access key, a secret key, and a session token. All three are needed.', show: ['a2', 'ae1'], pulse: ['a2'] },
			{ say: 'The caller signs its AWS calls with them and acts with the role\'s permissions, not its own.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'They expire. A role session lasts one hour by default, and chained roles are limited to one hour. SDKs refresh them for you.', show: ['life'], focus: ['life'] }
		]
	},

	// ───────────── route53-acm ─────────────
	{
		id: 'aw-route53-alias',
		topic: 'aws',
		group: 'route53-acm',
		title: 'Alias records for the apex',
		blurb: 'How does the bare domain point at CloudFront?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Browser asks example.com', s: 'the zone apex' },
				{ l: 'Route 53 hosted zone', s: 'holds your records' },
				{ l: 'Alias A and AAAA record', s: 'target: the CloudFront domain' },
				{ l: 'Answer: CloudFront IPs', tone: 'accent' }
			]),
			{ id: 'cname', kind: 'box', x: 240, y: 86, w: 104, h: 64, label: 'CNAME at the apex: not allowed', tone: 'neg' }
		],
		steps: [
			{ say: 'The shopper types the bare domain, example.com. That name is the zone apex, the top of your DNS zone.', focus: ['a0'] },
			{ say: 'Route 53 is the DNS service, and your hosted zone holds the records for the domain.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'DNS does not allow a CNAME at the apex, because the apex must also hold other records. That would be the usual way to point at CloudFront.', show: ['cname'], focus: ['cname'] },
			{ say: 'Route 53\'s alias record is the fix. It works at the apex and points straight at an AWS resource, such as a CloudFront distribution.', show: ['a2', 'ae1'], pulse: ['a2'] },
			{ say: 'It is answered as ordinary A and AAAA records, so clients see addresses. Queries to AWS targets are free, and you do not set the TTL.', show: ['a3', 'ae2'], focus: ['a3'] }
		]
	},
	{
		id: 'aw-acm-certificate',
		topic: 'aws',
		group: 'route53-acm',
		title: 'Getting an HTTPS certificate',
		blurb: 'How does ACM issue a certificate, and where must it live?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('a', [
				{ l: 'Request in ACM', s: 'example.com and www' },
				{ l: 'ACM asks for proof', s: 'a DNS record to add' },
				{ l: 'Add the record', s: 'one click if in Route 53' },
				{ l: 'Certificate issued', tone: 'accent' },
				{ l: 'Attach to CloudFront', s: 'then it serves HTTPS' }
			]),
			{ id: 'reg', kind: 'box', x: 240, y: 14, w: 104, h: 90, label: 'For CloudFront request it in us-east-1', tone: 'warn' },
			{ id: 'alb', kind: 'box', x: 240, y: 230, w: 104, h: 76, label: 'A load balancer needs one in its own Region', tone: 'warn' }
		],
		steps: [
			{ say: 'AWS Certificate Manager, ACM, issues free public certificates for AWS-integrated services. You start by requesting one for your domain names.', focus: ['a0'] },
			{ say: 'Where you request it matters. A certificate used by CloudFront must be requested in the N. Virginia Region, us-east-1.', show: ['reg'], focus: ['reg'] },
			{ say: 'ACM must be sure you control the domain, so it gives you a DNS record to create. This is DNS validation.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'You add that record. In Route 53 the console can do it for you. ACM then sees it and validates.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The certificate is issued. While the validation record stays in place, ACM renews it automatically.', show: ['a3', 'ae2'], pulse: ['a3'] },
			{ say: 'Attach it to the CloudFront distribution. A regional resource such as a load balancer needs a certificate in its own Region.', show: ['a4', 'ae3', 'alb'], focus: ['a4'] }
		]
	},

	// ───────────── rds-and-aurora ─────────────
	{
		id: 'aw-rds-multi-az',
		topic: 'aws',
		group: 'rds-and-aurora',
		title: 'Multi-AZ failover',
		blurb: 'What happens to the database when one zone fails?',
		stage: { w: 360, h: 280 },
		nodes: [
			{ id: 'app', kind: 'box', x: 80, y: 14, w: 200, h: 44, label: 'App', sub: 'uses one endpoint name', visible: true },
			{ id: 'pri', kind: 'db', x: 16, y: 120, w: 148, h: 70, label: 'Primary', sub: 'zone a' },
			{ id: 'stb', kind: 'db', x: 196, y: 120, w: 148, h: 70, label: 'Standby', sub: 'zone b' },
			{ id: 'e1', kind: 'edge', from: 'app', to: 'pri', label: 'reads, writes' },
			{ id: 'e2', kind: 'edge', from: 'pri', to: 'stb' },
			{ id: 'sync', kind: 'text', x: 180, y: 222, w: 328, text: 'copied synchronously before a write is confirmed', size: 'sm', anchor: 'middle' },
			{ id: 'note', kind: 'text', x: 180, y: 262, w: 328, text: 'A Multi-AZ standby is for failover; it does not serve reads.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'The app connects to one endpoint name. In a Multi-AZ setup, RDS runs a primary database in one Availability Zone.', show: ['pri', 'e1'], focus: ['pri'] },
			{ say: 'A standby sits in a second zone. Every write is copied to it synchronously before the commit is confirmed.', show: ['stb', 'e2', 'sync'], focus: ['stb'] },
			{ say: 'Now the primary or its zone fails.', set: { pri: { tone: 'neg', sub: 'zone a failed' } }, focus: ['pri'] },
			{ say: 'RDS promotes the standby and repoints the same endpoint name. The app reconnects with no configuration change after a short interruption.', set: { stb: { tone: 'accent', label: 'New primary' }, e1: { to: 'stb' } }, pulse: ['stb'] },
			{ say: 'The standby was for failover only. To spread reads across servers you use read replicas, which are a separate feature.', show: ['note'], focus: ['note'] }
		]
	},
	{
		id: 'aw-read-replica-lag',
		topic: 'aws',
		group: 'rds-and-aurora',
		title: 'Read replicas lag behind',
		blurb: 'Why can a user not see the edit they just saved?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'w', kind: 'box', x: 16, y: 14, w: 148, h: 44, label: 'App writes', visible: true },
			{ id: 'r', kind: 'box', x: 196, y: 14, w: 148, h: 44, label: 'App reads', visible: true },
			{ id: 'pri', kind: 'db', x: 16, y: 120, w: 148, h: 70, label: 'Primary', sub: 'name = Asha R.' },
			{ id: 'rep', kind: 'db', x: 196, y: 120, w: 148, h: 70, label: 'Replica', sub: 'name = Asha R.' },
			{ id: 'ew', kind: 'edge', from: 'w', to: 'pri' },
			{ id: 'er', kind: 'edge', from: 'r', to: 'rep' },
			{ id: 'ec', kind: 'edge', from: 'pri', to: 'rep' },
			{ id: 'fix', kind: 'box', x: 16, y: 232, w: 328, h: 56, label: 'Read your own write from the primary', sub: 'use replicas only for reads that can be a moment stale', tone: 'accent' }
		],
		steps: [
			{ say: 'Writes go to the primary database. Reads for lighter work can go to a read replica, a copy used to spread the load.', show: ['pri', 'rep', 'ew', 'er'], focus: ['pri', 'rep'] },
			{ say: 'Changes reach the replica after the primary commits them, which is asynchronous replication. Usually that is a tiny delay.', show: ['ec'], focus: ['ec'] },
			{ say: 'A user saves a new name. The primary has it, but the replica has not caught up yet.', set: { pri: { tone: 'accent', sub: 'name = Asha Rao' } }, pulse: ['pri'] },			{ say: 'The next page reads from the replica and shows the old name. The user thinks the save failed. This is replica lag.', set: { rep: { tone: 'warn' } }, focus: ['rep'] },
			{ say: 'The fix is routing: read right after a write from the primary, and use replicas for dashboards and lists that can be a moment stale.', show: ['fix'], pulse: ['fix'] }
		]
	},

	// ───────────── elasticache-redis ─────────────
	{
		id: 'aw-cache-aside',
		topic: 'aws',
		group: 'elasticache-redis',
		title: 'Cache-aside with Redis',
		blurb: 'How does a cache take load off the database?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('a', [
				{ l: 'App needs product 42' },
				{ l: 'Redis (ElastiCache)', s: 'GET product:42' },
				{ l: 'Database', s: 'SELECT the row' },
				{ l: 'Fill the cache', s: 'SET product:42, TTL 60 s' },
				{ l: 'Return the product' }
			]),
			{ id: 'stale', kind: 'box', x: 240, y: 230, w: 104, h: 76, label: 'After an edit: delete the key or wait for the TTL', tone: 'warn' }
		],
		steps: [
			{ say: 'A product page needs product 42. Reading it from the database every time is slow and puts load on the database.', focus: ['a0'] },
			{ say: 'Cache-aside: the app asks Redis first, using a key such as product:42.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'Nothing is stored yet, a miss. Only now does the app query the database.', set: { a1: { sub: 'MISS', tone: 'warn' } }, show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'The app writes the result into Redis with a TTL, so it expires on its own and cannot go stale forever.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'The next request finds the key in Redis, a hit, in well under a millisecond of work. The database is not touched.', set: { a1: { sub: 'HIT', tone: 'accent' } }, hide: ['a2', 'ae1', 'a3', 'ae2'], show: ['a4', 'ae3'], pulse: ['a1'] },
			{ say: 'The risk is stale data. When the product changes, delete its key so the next read refills it, or accept staleness until the TTL ends.', show: ['stale'], focus: ['stale'] }
		]
	},

	// ───────────── containers-ecr-ecs-eks ─────────────
	{
		id: 'aw-ecr-ecs-deploy',
		topic: 'aws',
		group: 'containers-ecr-ecs-eks',
		title: 'Shipping a container to ECS',
		blurb: 'What happens between a git push and live traffic?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('a', [
				{ l: 'CI builds the image', s: 'tag: shop-api:1.4.2' },
				{ l: 'ECR stores it', s: 'a private image registry' },
				{ l: 'ECS service updated', s: 'new task definition revision' },
				{ l: 'New tasks start', s: 'behind the load balancer' },
				{ l: 'Health checks pass', s: 'old tasks drain and stop', tone: 'accent' }
			]),
			{ id: 'role', kind: 'box', x: 240, y: 230, w: 104, h: 76, label: 'Task role gives the app AWS access', tone: 'neutral' }
		],
		steps: [
			{ say: 'A deployment starts with a build. The pipeline packages the app into a container image and tags it with a version.', focus: ['a0'] },
			{ say: 'The image is pushed to ECR, the Elastic Container Registry. It is just storage for images, in your account.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'You register a new task definition that points at the new image, and tell the ECS service to use it.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'ECS pulls the image and starts new tasks. Each runs with a task role, which is how the code gets AWS permissions.', show: ['a3', 'ae2', 'role'], focus: ['a3'] },
			{ say: 'The load balancer only sends traffic to tasks that pass health checks. Then the old tasks drain and stop, so users see no downtime.', show: ['a4', 'ae3'], pulse: ['a4'] }
		]
	},

	// ───────────── lambda-and-api-gateway ─────────────
	{
		id: 'aw-apigw-lambda',
		topic: 'aws',
		group: 'lambda-and-api-gateway',
		title: 'API Gateway into Lambda',
		blurb: 'What runs, and when, for one HTTP call to a function?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'HTTP request', s: 'POST /orders' },
				{ l: 'API Gateway', s: 'routes, auth, throttling' },
				{ l: 'Lambda function', s: 'your handler runs' },
				{ l: 'JSON response', tone: 'accent' }
			]),
			{ id: 'cold', kind: 'box', x: 240, y: 158, w: 104, h: 78, label: 'First call also pays a cold start', tone: 'warn' }
		],
		steps: [
			{ say: 'A client sends an HTTP request. There is no server of yours listening; API Gateway is the public front door.', focus: ['a0'] },
			{ say: 'API Gateway matches the route, can check authorisation, and throttles callers. It then invokes the function.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'Lambda runs your handler in an execution environment. If none is free, it creates one first, which is the cold start.', show: ['a2', 'ae1', 'cold'], focus: ['a2'] },
			{ say: 'The handler returns, and API Gateway turns the result into an HTTP response. Later calls can reuse the warm environment.', show: ['a3', 'ae2'], hide: ['cold'], pulse: ['a3'] },
			{ say: 'You pay per invocation and run time, and the function has hard limits such as a 15 minute timeout. Long jobs belong elsewhere.', set: { a2: { sub: 'max 15 minutes per call' } }, focus: ['a2'] }
		]
	},

	// ───────────── sqs-and-sns ─────────────
	{
		id: 'aw-sqs-visibility',
		topic: 'aws',
		group: 'sqs-and-sns',
		title: 'SQS visibility timeout and DLQ',
		blurb: 'What if a worker crashes halfway through a message?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('a', [
				{ l: 'Producer sends a message', s: 'order A-1042' },
				{ l: 'SQS queue', s: 'message waits' },
				{ l: 'Worker receives it', s: 'hidden for 30 s' },
				{ l: 'Worker crashes', s: 'never deleted it', tone: 'neg' },
				{ l: 'Dead-letter queue', s: 'after maxReceiveCount', tone: 'warn' }
			]),
			{ id: 'del', kind: 'box', x: 240, y: 158, w: 104, h: 62, label: 'Success: worker deletes it', tone: 'accent' }
		],
		steps: [
			{ say: 'A producer puts a message on an SQS queue. The queue holds it durably until some worker handles it.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'A worker receives the message. SQS does not remove it; it hides it for the visibility timeout, 30 seconds by default.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'When the work succeeds, the worker deletes the message. Deleting is the acknowledgement.', show: ['del'], focus: ['del'] },
			{ say: 'If the worker crashes instead, nothing deletes it. After the timeout the message becomes visible again and another worker gets it.', show: ['a3', 'ae2'], hide: ['del'], set: { a1: { sub: 'visible again' } }, focus: ['a3'] },
			{ say: 'That means at-least-once delivery, so a handler may see the same message twice and must be safe to repeat.', set: { a2: { sub: 'may be processed twice' } }, focus: ['a2'] },
			{ say: 'A poison message that keeps failing would loop forever. After a set number of receives, a redrive policy moves it to a dead-letter queue to inspect.', show: ['a4', 'ae3'], pulse: ['a4'] }
		]
	},
	{
		id: 'aw-sns-fanout',
		topic: 'aws',
		group: 'sqs-and-sns',
		title: 'SNS fan-out to queues',
		blurb: 'How does one event reach several independent consumers?',
		stage: { w: 360, h: 300 },
		nodes: [
			{ id: 'pub', kind: 'box', x: 80, y: 14, w: 200, h: 44, label: 'Order service publishes', sub: 'event: order.placed', visible: true },
			{ id: 'sns', kind: 'box', x: 80, y: 94, w: 200, h: 44, label: 'SNS topic', sub: 'one-to-many' },
			{ id: 'q1', kind: 'box', x: 16, y: 194, w: 96, h: 56, label: 'Email queue' },
			{ id: 'q2', kind: 'box', x: 132, y: 194, w: 96, h: 56, label: 'Stock queue' },
			{ id: 'q3', kind: 'box', x: 248, y: 194, w: 96, h: 56, label: 'Report queue' },
			{ id: 'e0', kind: 'edge', from: 'pub', to: 'sns' },
			{ id: 'e1', kind: 'edge', from: 'sns', to: 'q1' },
			{ id: 'e2', kind: 'edge', from: 'sns', to: 'q2' },
			{ id: 'e3', kind: 'edge', from: 'sns', to: 'q3' },
			{ id: 'note', kind: 'text', x: 180, y: 284, w: 328, text: 'Each queue has its own pace, retries and dead-letter queue.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'The order service has one event to announce: an order was placed. It should not need to know who cares.', focus: ['pub'] },
			{ say: 'It publishes once to an SNS topic. SNS is publish and subscribe: it pushes each message to every subscriber.', show: ['sns', 'e0'], focus: ['sns'] },
			{ say: 'Each consumer has its own SQS queue subscribed to the topic. The email, stock and reporting services each get a copy.', show: ['q1', 'q2', 'q3', 'e1', 'e2', 'e3'], pulse: ['q1', 'q2', 'q3'] },
			{ say: 'A slow or failing consumer does not hold up the others. Its queue absorbs the backlog while it catches up.', set: { q3: { tone: 'warn', sub: 'slow, backlog' } }, focus: ['q3'] },
			{ say: 'Adding a fourth consumer later means subscribing another queue. The publisher does not change.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────────── msk-kafka ─────────────
	{
		id: 'aw-kafka-partitions',
		topic: 'aws',
		group: 'msk-kafka',
		title: 'Kafka partitions and consumers',
		blurb: 'How does Kafka keep order and still scale out?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'prod', kind: 'box', x: 80, y: 14, w: 200, h: 44, label: 'Producer', sub: 'key = order-7', visible: true },
			{ id: 'p0', kind: 'box', x: 16, y: 104, w: 96, h: 50, label: 'Partition 0' },
			{ id: 'p1', kind: 'box', x: 132, y: 104, w: 96, h: 50, label: 'Partition 1' },
			{ id: 'p2', kind: 'box', x: 248, y: 104, w: 96, h: 50, label: 'Partition 2' },
			{ id: 'c1', kind: 'box', x: 16, y: 214, w: 156, h: 44, label: 'Consumer A', sub: 'group: billing' },
			{ id: 'c2', kind: 'box', x: 188, y: 214, w: 156, h: 44, label: 'Consumer B', sub: 'group: billing' },
			{ id: 'e1', kind: 'edge', from: 'prod', to: 'p1' },
			{ id: 'k0', kind: 'edge', from: 'p0', to: 'c1' },
			{ id: 'k1', kind: 'edge', from: 'p1', to: 'c1' },
			{ id: 'k2', kind: 'edge', from: 'p2', to: 'c2' },
			{ id: 'note', kind: 'text', x: 180, y: 300, w: 328, text: 'More consumers than partitions leaves the extras idle.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'A Kafka topic is split into partitions, each an ordered log. Amazon MSK runs the Kafka brokers for you.', show: ['p0', 'p1', 'p2'], focus: ['p0', 'p1', 'p2'] },
			{ say: 'A producer sends a message with a key. Kafka hashes the key to pick a partition, so every message for order-7 lands in the same one.', show: ['e1'], set: { p1: { tone: 'accent' } }, pulse: ['p1'] },
			{ say: 'Order is guaranteed only inside a partition. Events for one order stay in sequence; events across orders have no global order.', focus: ['p1'] },
			{ say: 'Consumers join a group. Kafka gives each partition to exactly one consumer in the group, so the work is shared.', show: ['c1', 'c2', 'k0', 'k1', 'k2'], focus: ['c1', 'c2'] },
			{ say: 'Another group, such as analytics, can read the same topic independently at its own position. Messages are not removed when read.', set: { c1: { sub: 'group: billing, offset 41' } }, focus: ['c1'] },
			{ say: 'Parallelism is capped by the partition count. Add consumers beyond that and the extras sit idle.', show: ['note'], focus: ['note'] }
		]
	},

	// ───────────── ses-email ─────────────
	{
		id: 'aw-ses-sending',
		topic: 'aws',
		group: 'ses-email',
		title: 'Sending email with SES',
		blurb: 'What must be set up before real customers get your email?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Verify your domain', s: 'plus DKIM DNS records' },
				{ l: 'Sandbox mode', s: 'verified recipients only' },
				{ l: 'Request production', s: 'higher limits, any recipient' },
				{ l: 'Send and track', s: 'bounces and complaints', tone: 'accent' }
			]),
			{ id: 'from', kind: 'box', x: 240, y: 14, w: 104, h: 72, label: 'The From address must be verified too', tone: 'warn' }
		],
		steps: [
			{ say: 'First prove you own the sending domain by adding DNS records. DKIM signs your mail so receivers can trust where it came from.', focus: ['a0'] },
			{ say: 'A new SES account starts in the sandbox. It can only send to addresses you have verified, and at a low rate.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'To email real customers you request production access. After approval, the recipient restriction is lifted and the limits grow.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'Sending is an API call. Wire bounces and complaints back, for example through SNS, so you stop emailing addresses that reject you.', show: ['a3', 'ae2'], pulse: ['a3'] },
			{ say: 'Your sender identity must be verified even in production. A poor bounce or complaint rate can get sending paused.', show: ['from'], focus: ['from'] }
		]
	},

	// ───────────── cloudwatch-and-xray ─────────────
	{
		id: 'aw-trace-slow-request',
		topic: 'aws',
		group: 'cloudwatch-and-xray',
		title: 'Finding a slow checkout',
		blurb: 'Which of metrics, logs and traces answers which question?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Alarm fires', s: 'p99 latency over 2 s', tone: 'warn' },
				{ l: 'Metrics graph', s: 'it began at 14:10' },
				{ l: 'Logs for that request id', s: 'no errors, just slow' },
				{ l: 'X-Ray trace', s: '1.8 s inside one DB call', tone: 'accent' }
			]),
			{ id: 'q', kind: 'box', x: 240, y: 86, w: 104, h: 64, label: 'Metrics: how many, how bad?' },
			{ id: 'l', kind: 'box', x: 240, y: 158, w: 104, h: 64, label: 'Logs: what happened?' },
			{ id: 't', kind: 'box', x: 240, y: 230, w: 104, h: 64, label: 'Traces: where did time go?' }
		],
		steps: [
			{ say: 'A CloudWatch alarm watches a metric and fires when it crosses a threshold. Here the 99th percentile checkout latency is too high.', focus: ['a0'] },
			{ say: 'Metrics are numbers over time. The graph tells you how bad it is and when it started, but not why.', show: ['a1', 'ae0', 'q'], focus: ['a1', 'q'] },
			{ say: 'Logs are events written by the app. Searching by the request id shows nothing failed, so the requests were simply slow.', show: ['a2', 'ae1', 'l'], focus: ['a2', 'l'] },
            { say: 'A trace follows one request across services and times each part. X-Ray shows most of the time was spent in a single database call.', show: ['a3', 'ae2', 't'], pulse: ['a3'] },
			{ say: 'Together they answer different questions: metrics say that something is wrong, logs say what happened, and traces say where the time went.', focus: ['q', 'l', 't'] }
		]
	},

	// ───────────── secrets-and-parameters ─────────────
	{
		id: 'aw-secret-injection',
		topic: 'aws',
		group: 'secrets-and-parameters',
		title: 'A secret reaches the container',
		blurb: 'How does an app get a password without it being in the code?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Secret in Secrets Manager', s: 'encrypted with KMS' },
				{ l: 'Execution role may read it', s: 'secretsmanager:GetSecretValue' },
				{ l: 'ECS injects it at start', s: 'as an environment variable' },
				{ l: 'Rotation changes the value', s: 'running tasks keep the old one', tone: 'warn' }
			]),
			{ id: 'ps', kind: 'box', x: 240, y: 158, w: 104, h: 86, label: 'Parameter Store suits plain config', sub: 'SecureString for secrets' }
		],
		steps: [
			{ say: 'The password lives in AWS Secrets Manager, stored encrypted with a KMS key, not in the repository or the image.', focus: ['a0'] },
			{ say: 'Access is an IAM question. ECS fetches the secret with the task execution role, so that role must be allowed to read it.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'When ECS starts the task, it fetches the secret and puts it in the container as an environment variable. The code just reads it.', show: ['a2', 'ae1'], pulse: ['a2'] },
			{ say: 'Secrets Manager can rotate the value on a schedule. But ECS injects only at launch, so running tasks keep the old value until restarted.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'Parameter Store is a lighter-weight sibling for ordinary configuration. Use its SecureString type, or Secrets Manager, when the value is sensitive.', show: ['ps'], focus: ['ps'] }
		]
	},

	// ───────────── waf-and-shield ─────────────
	{
		id: 'aw-waf-rate-limit',
		topic: 'aws',
		group: 'waf-and-shield',
		title: 'A WAF rate-based rule',
		blurb: 'How does WAF stop one client from hammering your login?',
		stage: { w: 360, h: 300 },
		nodes: [
			...stack('a', [
				{ l: 'Requests reach the Web ACL', s: 'on CloudFront or the ALB' },
				{ l: 'Rules run in priority order' },
				{ l: 'Rate rule: over 100 in 5 min', s: 'counted per IP address' },
				{ l: 'Block extra requests', tone: 'neg' }
			]),
			{ id: 'shield', kind: 'box', x: 240, y: 14, w: 104, h: 78, label: 'Shield Standard is on by default', sub: 'network floods' }
		],
		steps: [
			{ say: 'AWS WAF is a web application firewall. You attach a Web ACL to CloudFront or a load balancer, and every request is checked against it.', focus: ['a0'] },
			{ say: 'A Web ACL is a list of rules evaluated in priority order. Each rule can allow, block, count or challenge matching requests.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'A rate-based rule counts requests per aggregation key, here each IP address, over a window looking back 1, 2, 5 or 10 minutes.', show: ['a2', 'ae1'], pulse: ['a2'] },
			{ say: 'When one IP goes over the limit, the rule\'s action applies to its extra requests. It is near the limit, not an exact line.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'WAF handles application-layer abuse. AWS Shield defends against network floods, and the Standard tier is already on for AWS customers.', show: ['shield'], focus: ['shield'] }
		]
	},

	// ───────────── shared-responsibility-and-cost ─────────────
	{
		id: 'aw-shared-responsibility',
		topic: 'aws',
		group: 'shared-responsibility-and-cost',
		title: 'Who is responsible for what',
		blurb: 'Which security jobs are AWS\'s and which are yours?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'h1', kind: 'box', x: 16, y: 14, w: 156, h: 34, label: 'AWS: of the cloud', shape: 'pill', visible: true },
			{ id: 'h2', kind: 'box', x: 188, y: 14, w: 156, h: 34, label: 'You: in the cloud', shape: 'pill', visible: true },
			{ id: 'a1', kind: 'box', x: 16, y: 64, w: 156, h: 48, label: 'Data centres and hardware' },
			{ id: 'a2', kind: 'box', x: 16, y: 126, w: 156, h: 48, label: 'The S3 and RDS service software' },
			{ id: 'a3', kind: 'box', x: 16, y: 188, w: 156, h: 48, label: 'Regions and zones' },
			{ id: 'y1', kind: 'box', x: 188, y: 64, w: 156, h: 48, label: 'IAM policies and keys', tone: 'accent' },
			{ id: 'y2', kind: 'box', x: 188, y: 126, w: 156, h: 48, label: 'Who can read your bucket', tone: 'accent' },
			{ id: 'y3', kind: 'box', x: 188, y: 188, w: 156, h: 48, label: 'Your code and dependencies', tone: 'accent' },
			{ id: 'note', kind: 'text', x: 180, y: 270, w: 328, text: 'More managed (Lambda, S3) shifts more to AWS; EC2 leaves more to you, like OS patching.', size: 'sm', anchor: 'middle' }
		],
		steps: [
			{ say: 'AWS secures the cloud itself: the buildings, hardware, network, and the software that runs services such as S3 and RDS.', show: ['a1', 'a2', 'a3'], focus: ['a1', 'a2', 'a3'] },
			{ say: 'You secure what you put in it: identity and access, your data, your configuration, and your own application.', show: ['y1', 'y2', 'y3'], focus: ['y1', 'y2', 'y3'] },
			{ say: 'A public S3 bucket is not an AWS failure. AWS built a private-by-default service, and the setting that exposed it was a customer choice.', set: { y2: { tone: 'warn', label: 'A bucket opened to the public' } }, focus: ['y2'] },
			{ say: 'The line moves with the service. Managed services take more of the work, while raw virtual machines leave patching to you.', show: ['note'], focus: ['note'] }
		]
	}
];
