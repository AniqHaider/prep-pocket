import type { Scene, SceneNode, Tone } from '../../types';
import { shot, ring, credit, consoleChrome } from '../consoleKit';

/** Google Cloud, core area. Ids `gc-*`; `group` = a topic id in src/db/gcp/core.ts. A generic online store. */

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

// A highlight ring placed on a region of a screenshot. `b` is the picture's box on the stage, `v` the zoom (file pixels, as in the image node's `view`),
// `r` the region in file pixels. The result is in stage units.
type Box = { x: number; y: number; w: number };
type View = { x: number; y: number; w: number };
type Region = { x: number; y: number; w: number; h: number };
const ringOn = (id: string, b: Box, v: View, r: Region): SceneNode => {
	const k = b.w / v.w;
	return ring(id, Math.round(b.x + (r.x - v.x) * k), Math.round(b.y + (r.y - v.y) * k), Math.round(r.w * k), Math.round(r.h * k));
};
const CR = 'Screenshot: Google Cloud documentation, CC BY 4.0';
const CRC = 'Screenshot (cropped): Google Cloud documentation, CC BY 4.0';

// ── geometry of the real screenshots ──
// billing-budgets.webp 1400x560, drawn 336 wide at (12,10)
const BB = { x: 12, y: 10, w: 336 };
const BB_V1: View = { x: 0, y: 60, w: 700 };
const BB_V2: View = { x: 230, y: 200, w: 900 };
const BB_V3: View = { x: 500, y: 200, w: 900 };
// billing-budget-list.webp 1400x798, drawn 336 wide at (12,10)
const BL = { x: 12, y: 10, w: 336 };
const BL_V1: View = { x: 0, y: 100, w: 700 };
const BL_V2: View = { x: 150, y: 200, w: 700 };
const BL_V3: View = { x: 0, y: 284, w: 900 };
const BL_V4: View = { x: 700, y: 200, w: 700 };
const BL_V5: View = { x: 0, y: 398, w: 700 };
// billing-thresholds.webp 448x226 at (12,10) 336 wide; billing-cost-trend.webp 486x507 at (70,10) 220 wide
const TH = { x: 12, y: 10, w: 336 };
const TH_V: View = { x: 0, y: 0, w: 448 };
const CT = { x: 70, y: 10, w: 220 };
const CT_V: View = { x: 0, y: 0, w: 486 };

export const gcCore: Scene[] = [
	// ───────────── gcp-request-path ─────────────
	{
		id: 'gc-request-path',
		topic: 'gcp',
		group: 'gcp-request-path',
		title: 'A page view across Google Cloud',
		blurb: 'Which Google Cloud service touches a shopper\'s request, in order?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('a', [
				{ l: 'Browser', s: 'opens shop.example.com' },
				{ l: 'Cloud DNS', s: 'turns the name into an address' },
				{ l: 'Load balancer + Cloud CDN', s: 'one global IP, edge cache' },
				{ l: 'Cloud Run', s: 'your app containers' },
				{ l: 'Cloud SQL', s: 'orders and products' }
			]),
			{ id: 's3', kind: 'box', x: 240, y: 158, w: 104, h: 62, label: 'Cloud Storage', sub: 'images and scripts' },
			{ id: 'se', kind: 'edge', from: 'a2', to: 's3' }
		],
		steps: [
			{ say: 'A shopper types shop.example.com. Every Google Cloud service in this path has one small job, and each hands the request on to the next.', focus: ['a0'] },
			{ say: 'Cloud DNS answers with the address of the load balancer, because the store\'s domain is pointed there.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The browser reaches the global external load balancer through one anycast IP. Cloud CDN keeps copies of cacheable responses at Google\'s edge.', show: ['a2', 'ae1'], focus: ['a2'] },
			{ say: 'Static files like images and scripts live in a Cloud Storage bucket, which the load balancer uses as a backend bucket. The CDN caches them.', show: ['s3', 'se'], set: { s3: { tone: 'accent' } }, focus: ['s3'] },
			{ say: 'A page that needs fresh data is sent on to your Cloud Run service, which the load balancer reaches through a serverless network endpoint group.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'The app reads and writes orders in Cloud SQL. The response flows back out, and the CDN may keep a copy if the headers allow it.', show: ['a4', 'ae3'], focus: ['a4'] }
		]
	},

	// ───────────── gcp-projects-and-billing ─────────────
	{
		id: 'gc-resource-hierarchy',
		topic: 'gcp',
		group: 'gcp-projects-and-billing',
		title: 'Organization, folders and projects',
		blurb: 'How do organizations, folders, projects and billing accounts fit together?',
		stage: { w: 360, h: 345 },
		nodes: [
			{ id: 'org', kind: 'box', x: 100, y: 12, w: 160, h: 44, label: 'Organization', sub: 'example.com, the root', visible: true },
			{ id: 'f1', kind: 'box', x: 16, y: 90, w: 150, h: 40, label: 'Folder: production' },
			{ id: 'f2', kind: 'box', x: 194, y: 90, w: 150, h: 40, label: 'Folder: staging' },
			{ id: 'o1', kind: 'edge', from: 'org', to: 'f1' },
			{ id: 'o2', kind: 'edge', from: 'org', to: 'f2' },
			{ id: 'p1', kind: 'box', x: 16, y: 166, w: 150, h: 48, label: 'Project: shop-prod', sub: 'APIs, IAM, quotas' },
			{ id: 'p2', kind: 'box', x: 194, y: 166, w: 150, h: 48, label: 'Project: shop-staging', sub: 'APIs, IAM, quotas' },
			{ id: 'e1', kind: 'edge', from: 'f1', to: 'p1' },
			{ id: 'e2', kind: 'edge', from: 'f2', to: 'p2' },
			{ id: 'b', kind: 'box', x: 80, y: 252, w: 200, h: 44, label: 'Billing account', sub: 'pays for the linked projects' },
			{ id: 'be1', kind: 'edge', from: 'b', to: 'p1', dashed: true },
			{ id: 'be2', kind: 'edge', from: 'b', to: 'p2', dashed: true },
			{ id: 'lab', kind: 'text', x: 16, y: 326, w: 328, text: 'Labels such as env=prod are key-value tags used to filter and group costs.', size: 'sm' }
		],
		steps: [
			{ say: 'The organization is the root of the hierarchy, usually a company. Every other resource sits somewhere beneath it, and each has exactly one parent.', focus: ['org'] },
			{ say: 'Folders are optional groups under the organization. Here production and staging each get a folder, so each can have its own rules.', show: ['f1', 'f2', 'o1', 'o2'], focus: ['f1', 'f2'] },
			{ say: 'Projects sit under folders and hold the real resources: buckets, Cloud Run services, databases. A project is where APIs, access and quotas live.', show: ['p1', 'p2', 'e1', 'e2'], focus: ['p1', 'p2'] },
			{ say: 'Keeping production and staging in separate projects contains mistakes. A runaway job or a wrong grant in staging cannot touch production.', set: { p1: { tone: 'accent' }, p2: { tone: 'warn' } }, pulse: ['p1', 'p2'] },
			{ say: 'A billing account pays for projects. One account can be linked to many projects; if billing is disabled on a project, its billable services stop.', show: ['b', 'be1', 'be2'], focus: ['b'] },
			{ say: 'IAM grants flow down the tree. A role granted on the production folder reaches shop-prod and everything inside it.', set: { f1: { tone: 'accent' } }, focus: ['f1', 'p1'] },
			{ say: 'Labels are key-value tags on resources. A budget can be scoped to one label, which is how a shared billing account is split by team.', show: ['lab'], focus: ['lab'] }
		]
	},
	{
		id: 'gc-budget-alerts',
		topic: 'gcp',
		group: 'gcp-projects-and-billing',
		title: 'The Budgets & alerts page',
		blurb: 'What does the Billing console show about budgets, and what does it promise?',
		stage: { w: 360, h: 270 },
		nodes: [
			shot('p', 'lessons/gcp/billing-budgets.webp', 1400, 560, { w: 336, y: 10, alt: 'The Budgets and alerts page in the Google Cloud Billing console' }),
			credit('c', 160, CR),
			ringOn('r1', BB, BB_V1, { x: 258, y: 135, w: 182, h: 38 }),
			ringOn('r2', BB, BB_V2, { x: 265, y: 282, w: 860, h: 50 }),
			ringOn('r3', BB, BB_V3, { x: 900, y: 385, w: 150, h: 78 }),
			ringOn('r4', BB, BB_V3, { x: 1040, y: 385, w: 300, h: 78 }),
			{ id: 'n1', kind: 'box', x: 16, y: 178, w: 328, h: 40, label: 'A budget notifies, it does not stop spending', tone: 'warn' },
			{ id: 'n2', kind: 'box', x: 16, y: 226, w: 328, h: 40, label: 'To react automatically, send it to Pub/Sub', sub: 'and let your own code act on the messages', tone: 'accent' }
		],
		steps: [
			{ say: 'This is the Budgets & alerts page in the Billing section of the Google Cloud console. The billing account is on the left and the budgets are listed in the middle.', focus: ['p'] },
			{ say: 'Top left, a project selector shows for people who can see several projects. A budget can cover all projects or only chosen ones.', set: { p: { view: BB_V1 }, c: { text: CRC } }, show: ['r1'], focus: ['p'] },
			{ say: 'The page says it plainly: setting a budget does not cap resource or API consumption. It tells people; it does not stop anything.', set: { p: { view: BB_V2 } }, hide: ['r1'], show: ['r2'] },
			{ say: 'The "Trigger alerts at" column shows the thresholds: 50%, 90% and 100% of the budget are the defaults.', set: { p: { view: BB_V3 } }, hide: ['r2'], show: ['r3'] },
			{ say: 'The progress bar and the amounts compare spend with the budget. This example shows nothing spent yet, out of a budget of 100.', hide: ['r3'], show: ['r4'] },
			{ say: 'Pulling it together: an alerts-only budget is a smoke alarm, not a sprinkler. It tells people the spend is high and leaves the services running.', set: { p: { view: { x: 0, y: 0, w: 1400 } }, c: { text: CR } }, hide: ['r4'], show: ['n1'] },
			{ say: 'A budget can also publish status messages to a Pub/Sub topic several times a day, which is how teams build their own automatic reactions.', show: ['n2'], pulse: ['n2'] }
		]
	},
	{
		id: 'gc-budget-list',
		topic: 'gcp',
		group: 'gcp-projects-and-billing',
		title: 'Reading the budget list',
		blurb: 'What do the columns and bars of a real budget list tell you?',
		stage: { w: 360, h: 290 },
		nodes: [
			shot('p', 'lessons/gcp/billing-budget-list.webp', 1400, 798, { w: 336, y: 10, alt: 'A list of Cloud Billing budgets with periods, scopes, thresholds and progress bars' }),
			credit('c', 218, CR),
			ringOn('r1', BL, BL_V1, { x: 20, y: 138, w: 680, h: 45 }),
			ringOn('r2', BL, BL_V2, { x: 170, y: 238, w: 520, h: 100 }),
			ringOn('r3', BL, BL_V3, { x: 50, y: 410, w: 730, h: 92 }),
			ringOn('r4', BL, BL_V4, { x: 1018, y: 266, w: 176, h: 20 }),
			ringOn('r5', BL, BL_V4, { x: 1018, y: 416, w: 176, h: 20 }),
			ringOn('r6', BL, BL_V5, { x: 316, y: 662, w: 40, h: 40 }),
			{ id: 'n1', kind: 'box', x: 16, y: 236, w: 328, h: 44, label: 'Watching spend is not controlling it', sub: 'budget messages to Pub/Sub can drive your own automation', tone: 'accent' }
		],
		steps: [
			{ say: 'The budget list has one row per budget: a name, a period, a type, what it applies to, its alert thresholds and a progress bar.', focus: ['p'] },
			{ say: 'The same reminder sits above the list: setting a budget does not cap resource or API consumption.', set: { p: { view: BL_V1 }, c: { text: CRC } }, show: ['r1'] },
			{ say: 'A budget has a period (monthly, quarterly, yearly or a custom range) and a type: a specified amount, or based on last period\'s spend.', set: { p: { view: BL_V2 } }, hide: ['r1'], show: ['r2'] },
			{ say: 'Expanding a row shows its scope. This budget covers one billing account, one project and one label. Scope can be projects, services or a label.', set: { p: { view: BL_V3 } }, hide: ['r2'], show: ['r3'] },
			{ say: 'The progress bar compares spend with the budget, and clicking it opens the cost report for that budget.', set: { p: { view: BL_V4 } }, hide: ['r3'], show: ['r4'] },
			{ say: 'This row shows 142 spent against a budget of 10, so the bar is full and red. The budget alerted, and the spending was not stopped.', hide: ['r4'], show: ['r5'], pulse: ['r5'] },
			{ say: 'A warning symbol marks a budget whose period has expired, here a custom range that ended in August 2021.', set: { p: { view: BL_V5 } }, hide: ['r5'], show: ['r6'] },
			{ say: 'The takeaway: budgets watch spend, they do not control it. Control comes from automation you build on the notifications.', set: { p: { view: { x: 0, y: 0, w: 1400 } }, c: { text: CR } }, hide: ['r6'], show: ['n1'] }
		]
	},
	{
		id: 'gc-budget-thresholds',
		topic: 'gcp',
		group: 'gcp-projects-and-billing',
		title: 'Threshold rules and the cost trend',
		blurb: 'How do actual and forecasted thresholds work, and what does the trend chart show?',
		stage: { w: 360, h: 285 },
		nodes: [
			shot('t', 'lessons/gcp/billing-thresholds.webp', 448, 226, { w: 336, y: 10, alt: 'Threshold rules for a budget: percent of budget, amount and trigger on' }),
			credit('c1', 200, CR),
			ringOn('r1', TH, TH_V, { x: 12, y: 16, w: 140, h: 152 }),
			ringOn('r2', TH, TH_V, { x: 300, y: 16, w: 140, h: 152 }),
			ringOn('r3', TH, TH_V, { x: 303, y: 55, w: 132, h: 36 }),
			shot('c', 'lessons/gcp/billing-cost-trend.webp', 486, 507, { x: 70, y: 10, w: 220, visible: false, alt: 'Cost trend chart shown while editing a budget' }),
			{ ...credit('c2', 258, CR), visible: false },
			ringOn('r4', CT, CT_V, { x: 20, y: 176, w: 440, h: 28 }),
			ringOn('r5', CT, CT_V, { x: 378, y: 168, w: 40, h: 52 })
		],
		steps: [
			{ say: 'When you create a budget you add threshold rules. Each rule has a percent of the budget, the amount that equals, and what to trigger on.', focus: ['t'] },
			{ say: 'Each rule is a percentage of the budget. The defaults are 50%, 90% and 100%, and the page shows the amount each one works out to.', show: ['r1'] },
			{ say: 'Trigger on is Actual or Forecasted. Actual fires when the spend so far passes the percentage. Forecasted fires when projected spend will.', hide: ['r1'], show: ['r2'] },
			{ say: 'Here all three rules trigger on Actual, so they fire only after the money has been spent. A forecasted rule gives a warning earlier.', hide: ['r2'], show: ['r3'], pulse: ['r3'] },
			{ say: 'While you set a budget, a cost trend chart shows actual cost by month, with a paler bar for the forecasted additional cost.', hide: ['t', 'r3', 'c1'], show: ['c', 'c2'] },
			{ say: 'The dashed red line marks the budget amount, here 50K, so you can see which months would have crossed it.', show: ['r4'], focus: ['c'] },
			{ say: 'The pale top of the last bar is forecasted additional cost for the rest of the period, the figure a Forecasted rule is based on.', hide: ['r4'], show: ['r5'] }
		]
	},

	// ───────────── gcs-storage ─────────────
	{
		id: 'gc-gcs-bucket-object',
		topic: 'gcp',
		group: 'gcs-storage',
		title: 'Cloud Storage is buckets and objects',
		blurb: 'What are Cloud Storage folders really, and what happens on overwrite?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'b', kind: 'box', x: 16, y: 14, w: 328, h: 44, label: 'Bucket: shop-assets-prod', sub: 'one location, name unique worldwide', visible: true },
			{ id: 'keys', kind: 'doc', x: 16, y: 74, w: 328, title: 'Objects: name to bytes', lines: ['products/42/front.jpg', 'products/42/back.jpg', 'invoices/2026/A-1042.pdf'] },
			{ id: 'ls', kind: 'box', x: 16, y: 190, w: 328, h: 44, label: 'List with prefix products/42/', sub: 'returns the first two names' },
			{ id: 'put', kind: 'box', x: 16, y: 262, w: 328, h: 44, label: 'Upload products/42/front.jpg again', sub: 'replaces it unless versioning is on', tone: 'warn' }
		],
		steps: [
			{ say: 'A bucket is the top-level container. Its name is unique across all of Cloud Storage and cannot be changed, and you pick its location when you create it.', focus: ['b'] },
			{ say: 'Inside, an object is bytes plus metadata, found by its name. Bucket plus object name is the whole address.', show: ['keys'], focus: ['keys'] },
			{ say: 'In a standard bucket the namespace is flat: the slashes are ordinary characters, and the console only draws them as folders.', set: { keys: { hl: [0, 1] } }, focus: ['keys'] },
			{ say: 'A prefix is the start of a name. Listing by prefix is how code finds everything for product 42.', show: ['ls'], pulse: ['ls'] },
			{ say: 'Uploading to a name that already exists replaces the object. The next read returns the new bytes.', show: ['put'], focus: ['put'] },
			{ say: 'Turn on object versioning to keep old copies. Each overwrite or delete then keeps the earlier version instead of losing it.', set: { put: { sub: 'with versioning: the old version is kept', tone: 'accent' } }, focus: ['put'] }
		]
	},
	{
		id: 'gc-gcs-console-objects',
		topic: 'gcp',
		group: 'gcs-storage',
		title: 'A bucket in the console',
		blurb: 'Which tab of a bucket holds which setting?',
		stage: { w: 360, h: 232 },
		nodes: [
			...consoleChrome('c', { path: 'Cloud Storage  >  Buckets  >  shop-assets-prod', h: 188 }),
			{ id: 'tb0', kind: 'text', x: 24, y: 54, text: 'Objects', size: 'sm', tone: 'accent', visible: true },
			{ id: 'tb1', kind: 'text', x: 71, y: 54, text: 'Configuration', size: 'sm', visible: true },
			{ id: 'tb2', kind: 'text', x: 152, y: 54, text: 'Permissions', size: 'sm', visible: true },
			{ id: 'tb3', kind: 'text', x: 221, y: 54, text: 'Protection', size: 'sm', visible: true },
			{ id: 'tb4', kind: 'text', x: 285, y: 54, text: 'Lifecycle', size: 'sm', visible: true },
			{ id: 't', kind: 'table', x: 24, y: 68, colW: 104, cols: ['Name', 'Size', 'Class'], rows: [['products/', '-', '-'], ['logo.png', '18 KB', 'Standard'], ['app.4f3a.js', '212 KB', 'Standard'], ['invoices/', '-', '-']], visible: true },
			{ id: 'cfg', kind: 'doc', x: 24, y: 68, w: 312, title: 'Configuration', lines: ['Location type: Region', 'Location: us-central1', 'Default storage class: Standard'] },
			{ id: 'perm', kind: 'doc', x: 24, y: 68, w: 312, title: 'Permissions', lines: ['Access control: Uniform (no ACLs)', 'Storage Object Viewer: web service account', 'Storage Object Admin: uploader'] },
			{ id: 'prot', kind: 'doc', x: 24, y: 68, w: 312, title: 'Protection', lines: ['Object versioning: On', 'Overwrites and deletes keep the old version'] },
			{ id: 'life', kind: 'doc', x: 24, y: 68, w: 312, title: 'Lifecycle', lines: ['Rule 1: age 30 days, move to Nearline', 'Rule 2: age 365 days, delete'] },
			{ id: 'note', kind: 'text', x: 180, y: 216, text: 'Illustration of the console layout, not a real screenshot', size: 'sm', anchor: 'middle', visible: true }
		],
		steps: [
			{ say: 'The Objects tab lists what is in the bucket. A slash in a name is shown as a folder, but in a flat bucket it is only part of the name.', set: { t: { hl: [1] } } },
			{ say: 'Configuration shows the location and the default storage class, both chosen when the bucket was created. The default class applies to new objects only.', hide: ['t'], show: ['cfg'], set: { tb0: { tone: 'neutral' }, tb1: { tone: 'accent' } } },
			{ say: 'Permissions is where uniform bucket-level access lives. With ACLs off, the roles listed here are the only way in.', hide: ['cfg'], show: ['perm'], set: { tb1: { tone: 'neutral' }, tb2: { tone: 'accent' } } },
			{ say: 'Protection holds object versioning. With it on, overwriting or deleting an object keeps the earlier version.', hide: ['perm'], show: ['prot'], set: { tb2: { tone: 'neutral' }, tb3: { tone: 'accent' } } },
			{ say: 'Lifecycle holds rules that change the storage class or delete objects by age and other conditions, so nobody has to remember to.', hide: ['prot'], show: ['life'], set: { tb3: { tone: 'neutral' }, tb4: { tone: 'accent' } } },
			{ say: 'Back on Objects, the whole bucket is visible again. Each tab is one decision: where it lives, who can reach it, whether to keep versions, and when to age things out.', hide: ['life'], show: ['t'], set: { tb4: { tone: 'neutral' }, tb0: { tone: 'accent' }, t: { hl: [] } }, pulse: ['t'] }
		]
	},

	// ───────────── gcs-signed-urls-and-cors ─────────────
	{
		id: 'gc-signed-url-flow',
		topic: 'gcp',
		group: 'gcs-signed-urls-and-cors',
		title: 'Direct upload with a signed URL',
		blurb: 'How does a browser upload to a private bucket without a key?',
		stage: { w: 360, h: 350 },
		nodes: [
			...stack('a', [
				{ l: 'Browser', s: 'shopper picks a photo' },
				{ l: 'App on Cloud Run', s: 'checks the shopper may upload' },
				{ l: 'Signed V4 URL', s: 'one object, PUT, 15 minutes' },
				{ l: 'Browser uploads', s: 'sends the bytes to that URL' },
				{ l: 'Cloud Storage', s: 'checks signature and expiry' }
			], { gap: 24 }),
			{ id: 'sa', kind: 'box', x: 236, y: 98, w: 108, h: 64, label: 'Service account', sub: 'signs; key stays on the server' }
		],
		steps: [
			{ say: 'A shopper wants to upload a product photo. The bucket is private, and the browser holds no Google credentials at all.', focus: ['a0'] },
			{ say: 'The browser asks your app. The app, running on Cloud Run, checks that this shopper is allowed to upload.', show: ['a1', 'ae0'], focus: ['a1'] },
			{ say: 'The app signs a URL with a service account. The URL names one object and one action (PUT) and carries an expiry; V4 allows at most 7 days, and minutes are better.', show: ['a2', 'ae1', 'sa'], set: { sa: { tone: 'accent' } }, focus: ['a2', 'sa'] },
			{ say: 'The signing credential never leaves the server. Only the finished URL goes back to the browser.', focus: ['sa'], pulse: ['sa'] },
			{ say: 'The browser sends the file straight to Cloud Storage with that URL. The bytes never pass through your app.', show: ['a3', 'ae2'], focus: ['a3'] },
			{ say: 'Cloud Storage checks the signature and the expiry, then stores the object. After the expiry the same URL is refused.', show: ['a4', 'ae3'], focus: ['a4'] },
			{ say: 'Anyone who holds the URL can use it until it expires, so keep the expiry short and treat the URL as a secret.', set: { a2: { tone: 'warn' } }, focus: ['a2'] }
		]
	},
	{
		id: 'gc-gcs-cors',
		topic: 'gcp',
		group: 'gcs-signed-urls-and-cors',
		title: 'CORS on a bucket',
		blurb: 'Why does a valid signed URL fail in the browser, and what fixes it?',
		stage: { w: 360, h: 384 },
		nodes: [
			...stack('c', [
				{ l: 'Browser on shop.example.com', s: 'wants to PUT to the bucket' },
				{ l: 'Preflight: OPTIONS', s: 'may this origin send a PUT?' },
				{ l: 'Bucket CORS configuration', s: 'answers the preflight' },
				{ l: 'Browser sends the PUT', s: 'the real upload follows' }
			], { w: 328, gap: 24 }),
			{
				id: 'cfg', kind: 'doc', x: 16, y: 282, w: 328, title: 'CORS entry on the bucket',
				lines: ['"origin": ["https://shop.example.com"]', '"method": ["PUT", "GET"]', '"responseHeader": ["Content-Type"]', '"maxAgeSeconds": 3600']
			}
		],
		steps: [
			{ say: 'The page at shop.example.com wants to upload to a bucket on another origin. Browsers block that unless the other side agrees, and the signed URL alone does not say so.', focus: ['c0'] },
			{ say: 'Before the real request, the browser sends a preflight OPTIONS request asking whether this origin may use this method.', show: ['c1', 'ce0'], focus: ['c1'] },
			{ say: 'The bucket answers from its CORS configuration, which is set on the bucket, not on the URL or the account.', show: ['c2', 'ce1', 'cfg'], focus: ['c2'] },
			{ say: 'The origin entry lists the sites allowed to call the bucket. A specific site is safer than an asterisk on a bucket that takes uploads.', set: { cfg: { hl: [0] } }, focus: ['cfg'] },
			{ say: 'The method entry lists the allowed HTTP methods, here PUT for uploads and GET for downloads.', set: { cfg: { hl: [1] } }, focus: ['cfg'] },
			{ say: 'maxAgeSeconds tells the browser how long it may reuse this answer, so it does not repeat the preflight before every request.', set: { cfg: { hl: [3] } }, focus: ['cfg'] },
			{ say: 'If origin and method match, the browser goes ahead with the PUT. If the entry is missing, a perfectly valid signed URL fails, and only in the browser.', show: ['c3', 'ce2'], set: { c3: { tone: 'accent' } }, focus: ['c3'] }
		]
	},

	// ───────────── gcp-iam-basics ─────────────
	{
		id: 'gc-iam-binding',
		topic: 'gcp',
		group: 'gcp-iam-basics',
		title: 'Principal, role, resource',
		blurb: 'What does one IAM grant consist of, and where is it stored?',
		stage: { w: 360, h: 322 },
		nodes: [
			{ id: 'p', kind: 'box', x: 16, y: 14, w: 104, h: 56, label: 'Principal', sub: 'support group', visible: true },
			{ id: 'r', kind: 'box', x: 128, y: 14, w: 104, h: 56, label: 'Role', sub: 'Storage Object Viewer' },
			{ id: 's', kind: 'box', x: 240, y: 14, w: 104, h: 56, label: 'Resource', sub: 'bucket shop-invoices' },
			{ id: 'e1', kind: 'edge', from: 'p', to: 'r' },
			{ id: 'e2', kind: 'edge', from: 'r', to: 's' },
			{ id: 'pol', kind: 'doc', x: 16, y: 96, w: 328, title: 'Allow policy on the bucket', lines: ['{ "bindings": [{', '  "role": "roles/storage.objectViewer",', '  "members": ["group:support@example.com"]', '}] }'] },
			{ id: 'ok', kind: 'box', x: 16, y: 208, w: 328, h: 44, label: 'Can list and read objects', sub: 'permissions inside the role', tone: 'accent' },
			{ id: 'no', kind: 'box', x: 16, y: 266, w: 328, h: 44, label: 'Cannot delete or upload', sub: 'those permissions are not in the role', tone: 'warn' }
		],
		steps: [
			{ say: 'IAM answers who can do what on which resource. First, the principal: the identity asking, such as a person, a group or a service account.', focus: ['p'] },
			{ say: 'Next, the role: a named collection of permissions. Storage Object Viewer holds the permissions to list and read objects.', show: ['r', 'e1'], focus: ['r'] },
			{ say: 'Then the resource the grant applies to. Here that is one bucket. The same grant on a project would reach every bucket in it.', show: ['s', 'e2'], focus: ['s'] },
			{ say: 'IAM never grants a permission directly. The three parts are stored as a role binding inside the resource\'s allow policy.', show: ['pol'], focus: ['pol'] },
			{ say: 'The role\'s name picks out the permissions, and the members list names who receives them. Granting to a group means new teammates only need to join it.', set: { pol: { hl: [1, 2] } } },
			{ say: 'Result: everyone in the group can list and read objects in that bucket.', show: ['ok'], pulse: ['ok'] },
			{ say: 'And only that. Delete and upload are not in the role, so they are refused. Least privilege means choosing the role with just what the job needs.', show: ['no'], focus: ['no'] }
		]
	},
	{
		id: 'gc-iam-console',
		topic: 'gcp',
		group: 'gcp-iam-basics',
		title: 'The IAM page, drawn out',
		blurb: 'What does a list of role bindings look like, and what does Grant access do?',
		stage: { w: 360, h: 232 },
		nodes: [
			...consoleChrome('c', { path: 'Google Cloud console  >  IAM  >  shop-prod', h: 192 }),
			{ id: 'btn', kind: 'box', x: 24, y: 48, w: 104, h: 26, label: 'Grant access', tone: 'accent', visible: true },
			{ id: 't', kind: 'table', x: 24, y: 88, colW: 156, cols: ['Principal', 'Role'], rows: [['support@example.com', 'Storage Object Viewer'], ['web-sa (service account)', 'Cloud SQL Client'], ['uploader-sa', 'Storage Object Admin']], visible: true },
			{ id: 'note', kind: 'text', x: 180, y: 220, text: 'Illustration of the console layout, not a real screenshot', size: 'sm', anchor: 'middle', visible: true }
		],
		steps: [
			{ say: 'The IAM page lists who has which role on the project. Each row is one role binding, shown by principal.', set: { t: { hl: [] } } },
			{ say: 'The first row is a group. Granting to groups means access follows the team: join the group, get the access.', set: { t: { hl: [0] } } },
			{ say: 'The second row is a service account, the identity the app runs as, with only the one role it needs.', set: { t: { hl: [1] } } },
			{ say: 'The third has Storage Object Admin, a broader role than reading. Only the uploader needs it, which is why the web account does not.', set: { t: { hl: [2] } } },
			{ say: 'Grant access opens a panel: enter a principal, pick a role, save. That adds one binding to the project\'s allow policy.', set: { t: { hl: [] } }, pulse: ['btn'] },
			{ say: 'The new row appears. A new teammate could be added to the group instead, which would leave this list unchanged.', set: { t: { rows: [['support@example.com', 'Storage Object Viewer'], ['web-sa (service account)', 'Cloud SQL Client'], ['uploader-sa', 'Storage Object Admin'], ['intern@example.com', 'Storage Object Viewer']], hl: [3] } } }
		]
	},

	// ───────────── gcp-iam-advanced ─────────────
	{
		id: 'gc-iam-inherit-deny',
		topic: 'gcp',
		group: 'gcp-iam-advanced',
		title: 'Inheritance, then deny',
		blurb: 'How do allow policies flow down the hierarchy, and what does a deny policy do?',
		stage: { w: 360, h: 345 },
		nodes: [
			...stack('h', [
				{ l: 'Organization' },
				{ l: 'Folder: production' },
				{ l: 'Project: shop-prod' },
				{ l: 'Bucket: invoices' }
			], { w: 170, h: 40, gap: 30 }),
			{ id: 'allow', kind: 'box', x: 206, y: 84, w: 138, h: 56, label: 'Allow: billing group reads and deletes objects', tone: 'accent' },
			{ id: 'ae', kind: 'edge', from: 'allow', to: 'h1' },
			{ id: 'deny', kind: 'box', x: 206, y: 14, w: 138, h: 56, label: 'Deny: delete objects, except security', tone: 'neg' },
			{ id: 'de', kind: 'edge', from: 'deny', to: 'h0' },
			{ id: 'res', kind: 'box', x: 16, y: 292, w: 328, h: 44, label: 'billing group: can read, cannot delete', sub: 'the deny is checked first', tone: 'warn' }
		],
		steps: [
			{ say: 'Resources form a tree. Allow policies can be set at any level, and each resource has its own policy plus the ones it inherits.', show: ['h1', 'h2', 'h3', 'he0', 'he1', 'he2'], focus: ['h0', 'h1', 'h2', 'h3'] },
			{ say: 'An allow policy on the production folder gives the billing group permission to read and delete objects.', show: ['allow', 'ae'], focus: ['allow'] },
			{ say: 'That grant is inherited. The project and the invoices bucket below the folder get it without any policy of their own.', set: { h2: { tone: 'accent' }, h3: { tone: 'accent' } }, pulse: ['h2', 'h3'] },
			{ say: 'Now a deny policy on the organization covers the delete permission for the same group. Denies follow the hierarchy downward too.', show: ['deny', 'de'], focus: ['deny'] },
			{ say: 'IAM checks deny policies before allow policies. Read is allowed through the folder grant, but delete is blocked, whatever roles the group holds.', show: ['res'], focus: ['res'] },
			{ say: 'A deny rule can list exception principals. The security group is exempt, so its members are not blocked by this rule.', set: { deny: { tone: 'warn' } }, focus: ['deny'] }
		]
	},
	{
		id: 'gc-iam-keyless',
		topic: 'gcp',
		group: 'gcp-iam-advanced',
		title: 'Deploying without a key file',
		blurb: 'How can an outside job use Google Cloud without a downloaded key?',
		stage: { w: 360, h: 360 },
		nodes: [
			...stack('k', [
				{ l: 'GitHub Actions job', s: 'has its own identity token' },
				{ l: 'Security Token Service', s: 'verifies it, returns a token' },
				{ l: 'Service account', s: 'impersonated, no key' },
				{ l: 'Short-lived access token', s: 'hours or less' },
				{ l: 'Deploy to Cloud Run', s: 'calls the Google Cloud API' }
			]).map((n) => (n.id === 'k0' ? { ...n, visible: false } : n)),
			{ id: 'bad', kind: 'box', x: 232, y: 14, w: 112, h: 70, label: 'Downloaded key file', sub: 'long-lived, like a password', tone: 'neg', visible: true }
		],
		steps: [
			{ say: 'A downloaded service account key is a long-lived secret. Whoever gets the file can act as the account until the key is disabled.', focus: ['bad'] },
			{ say: 'Workload Identity Federation removes the file. The job proves who it is with the identity token its own platform issues.', show: ['k0'], focus: ['k0'] },
			{ say: 'The job sends that token to the Security Token Service. It checks the token against rules you set and returns a federated token.', show: ['k1', 'ke0'], focus: ['k1'] },
			{ say: 'The job can then impersonate a service account. That needs the Service Account Token Creator role, and audit logs show both identities.', show: ['k2', 'ke1'], focus: ['k2'] },
			{ say: 'What comes back is a short-lived access token, valid for hours or less. If it leaks, it soon stops working.', show: ['k3', 'ke2'], focus: ['k3'] },
			{ say: 'With that token the job calls the Google Cloud API and deploys the app.', show: ['k4', 'ke3'], focus: ['k4'] },
			{ say: 'At no point did a key file exist, so there is nothing in the repository to leak or rotate.', set: { bad: { label: 'No key file', sub: 'nothing to leak', tone: 'accent' } }, pulse: ['bad'] }
		]
	},

	// ───────────── gcp-cdn-and-load-balancing ─────────────
	{
		id: 'gc-lb-chain',
		topic: 'gcp',
		group: 'gcp-cdn-and-load-balancing',
		title: 'Inside the load balancer',
		blurb: 'Which pieces make up the global external Application Load Balancer?',
		stage: { w: 360, h: 410 },
		nodes: [
			{ id: 'f', kind: 'box', x: 80, y: 14, w: 200, h: 44, label: 'Forwarding rule', sub: 'global IP address, one port', visible: true },
			{ id: 'px', kind: 'box', x: 80, y: 86, w: 200, h: 44, label: 'Target HTTPS proxy', sub: 'ends TLS, holds the certificate' },
			{ id: 'um', kind: 'box', x: 80, y: 158, w: 200, h: 44, label: 'URL map', sub: 'routes by host and path' },
			{ id: 'bs', kind: 'box', x: 16, y: 236, w: 150, h: 44, label: 'Backend service', sub: 'healthy backends' },
			{ id: 'bb', kind: 'box', x: 194, y: 236, w: 150, h: 44, label: 'Backend bucket', sub: 'a Cloud Storage bucket' },
			{ id: 'neg', kind: 'box', x: 16, y: 312, w: 150, h: 44, label: 'Serverless NEG', sub: 'the Cloud Run service' },
			{ id: 'hc', kind: 'box', x: 194, y: 312, w: 150, h: 44, label: 'Health check', sub: 'probes the backends' },
			{ id: 'e1', kind: 'edge', from: 'f', to: 'px' },
			{ id: 'e2', kind: 'edge', from: 'px', to: 'um' },
			{ id: 'e3', kind: 'edge', from: 'um', to: 'bs', label: '/api/*' },
			{ id: 'e4', kind: 'edge', from: 'um', to: 'bb', label: '/img/*' },
			{ id: 'e5', kind: 'edge', from: 'bs', to: 'neg' },
			{ id: 'e6', kind: 'edge', from: 'hc', to: 'bs', dashed: true },
			{ id: 'cdn', kind: 'text', x: 16, y: 386, w: 328, text: 'Cloud CDN is switched on per backend service or backend bucket.', size: 'sm' }
		],
		steps: [
			{ say: 'The forwarding rule is the front door: a global external IP address and a port. Requests from anywhere reach it through Google\'s edge.', focus: ['f'] },
			{ say: 'The target HTTPS proxy ends the shopper\'s TLS connection, using the certificates you attached to it.', show: ['px', 'e1'], focus: ['px'] },
			{ say: 'The URL map looks at the host and path and decides where to send the request. It can also redirect.', show: ['um', 'e2'], focus: ['um'] },
			{ say: 'Dynamic paths go to a backend service, a group of healthy backends that shares the traffic out.', show: ['bs', 'e3'], focus: ['bs'] },
			{ say: 'Static paths can go to a backend bucket instead, which serves a Cloud Storage bucket directly.', show: ['bb', 'e4'], focus: ['bb'] },
			{ say: 'For Cloud Run, the backend is a serverless network endpoint group that stands for the service.', show: ['neg', 'e5'], focus: ['neg'] },
			{ say: 'A health check probes backends so traffic only goes to healthy ones. Firewall rules must let the probe ranges through.', show: ['hc', 'e6'], focus: ['hc'] },
			{ say: 'Cloud CDN sits on top of a backend service or bucket and caches what it may, so many requests never get past the edge.', show: ['cdn'], set: { bs: { tone: 'accent' }, bb: { tone: 'accent' } } }
		]
	},
	{
		id: 'gc-cdn-cache',
		topic: 'gcp',
		group: 'gcp-cdn-and-load-balancing',
		title: 'Cache modes, keys and invalidation',
		blurb: 'What does each Cloud CDN cache mode cache, and how do you remove a bad copy?',
		stage: { w: 360, h: 340 },
		nodes: [
			{ id: 'modes', kind: 'table', x: 16, y: 14, colW: 164, cols: ['Cache mode', 'What gets cached'], rows: [['CACHE_ALL_STATIC', 'Static types and marked'], ['USE_ORIGIN_HEADERS', 'Only what origin allows'], ['FORCE_CACHE_ALL', 'Every successful reply']], visible: true },
			{ id: 'key', kind: 'doc', x: 16, y: 122, w: 328, title: 'Cache key: the whole URI by default', lines: ['https://shop.example.com/p/42?color=red', '?utm_source=mail makes a second key', 'exclude utm_source: one shared entry'] },
			{ id: 'inv', kind: 'box', x: 16, y: 226, w: 328, h: 44, label: 'Invalidate /images/*', sub: 'a targeted path pattern, not everything', tone: 'warn' },
			{ id: 'ver', kind: 'box', x: 16, y: 284, w: 328, h: 44, label: 'Better: versioned names', sub: 'app.4f3a.js is new when it changes', tone: 'accent' }
		],
		steps: [
			{ say: 'Cloud CDN has three cache modes. They decide which responses are stored at the edge.', focus: ['modes'] },
			{ say: 'CACHE_ALL_STATIC is the default when created with gcloud or the API. It caches static types like images, CSS and JavaScript, plus anything the origin marks cacheable.', set: { modes: { hl: [0] } } },
			{ say: 'USE_ORIGIN_HEADERS caches only what the origin\'s cache headers allow. Without valid headers, nothing is stored.', set: { modes: { hl: [1] } } },
			{ say: 'FORCE_CACHE_ALL caches every successful response and overrides the origin, so it can store private, per-user pages. Use it with care.', set: { modes: { hl: [2] } }, pulse: ['modes'] },
			{ say: 'The cache key decides what counts as the same request. For a backend service it is the whole URI: protocol, host, path and query string.', set: { modes: { hl: [] } }, show: ['key'], focus: ['key'] },
			{ say: 'A tracking parameter such as utm_source makes every link a different key, so the same page is cached again and again.', set: { key: { hl: [1] } } },
			{ say: 'Customizing the key to exclude that parameter lets all those links share one cache entry.', set: { key: { hl: [2] } } },
			{ say: 'To remove a bad copy, invalidate by path pattern. A trailing asterisk covers a whole prefix; invalidating everything can spike traffic to your backends.', show: ['inv'], focus: ['inv'] },
			{ say: 'The better habit is versioned file names. A changed file gets a new name, so there is nothing stale to invalidate.', show: ['ver'], focus: ['ver'] }
		]
	},

	// ───────────── gcp-dns-and-certificates ─────────────
	{
		id: 'gc-dns-cert',
		topic: 'gcp',
		group: 'gcp-dns-and-certificates',
		title: 'From domain to a valid certificate',
		blurb: 'What has to happen for shop.example.com to load over HTTPS?',
		stage: { w: 360, h: 440 },
		nodes: [
			...stack('d', [
				{ l: 'Registrar', s: 'name servers point at Cloud DNS' },
				{ l: 'Cloud DNS zone', s: 'A record and validation CNAME' },
				{ l: 'Certificate Manager', s: 'Google-managed certificate' },
				{ l: 'HTTPS proxy', s: 'holds the certificate' },
				{ l: 'Shopper', s: 'sees a valid padlock' }
			]),
			{ id: 'rec', kind: 'doc', x: 16, y: 350, w: 328, title: 'Records in the zone', lines: ['example.com  NS  (Cloud DNS name servers)', 'shop.example.com  A      203.0.113.10', '_acme-challenge.shop  CNAME  (Google target)'] }
		],
		steps: [
			{ say: 'Creating a public zone in Cloud DNS is not enough. At the registrar you change the domain\'s name servers to the zone\'s Cloud DNS name servers.', focus: ['d0'] },
			{ say: 'Now resolvers ask Cloud DNS. The zone holds the records for your names, each with a TTL that says how long resolvers may cache it.', show: ['d1', 'de0', 'rec'], set: { rec: { hl: [0] } }, focus: ['d1'] },
			{ say: 'An A record points shop.example.com at the load balancer\'s IP address. A CNAME cannot sit at the apex, because the apex always carries SOA and NS records.', set: { rec: { hl: [1] } } },
			{ say: 'For HTTPS you need a certificate. Certificate Manager can issue and renew a Google-managed one, so you never upload or renew anything by hand.', show: ['d2', 'de1'], focus: ['d2'] },
			{ say: 'Before issuing, it must see that you control the domain. DNS authorization gives you a CNAME record to add to your zone.', set: { rec: { hl: [2] } }, focus: ['d1', 'd2'] },
            { say: 'Keep that CNAME as the only record at its name and leave it in place: renewals use it too.', pulse: ['rec'] },
			{ say: 'The certificate is attached to the HTTPS proxy of the load balancer, directly or through a certificate map.', show: ['d3', 'de2'], set: { rec: { hl: [] } }, focus: ['d3'] },
			{ say: 'The shopper connects and the proxy presents the certificate: a valid padlock, with nothing to renew by hand.', show: ['d4', 'de3'], set: { d4: { tone: 'accent' } }, focus: ['d4'] }
		]
	}
];
