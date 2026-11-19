import type { Scene, SceneNode } from '../../types';
import { consoleChrome, credit, ring, shot } from '../consoleKit';

/**
 * Google Cloud, operations and analysis: logging, monitoring, secrets and security, BigQuery. Ids `gc-*`; `group` = a topic id in src/db/gcp/ops.ts.
 * Real screenshots come from the Google Cloud documentation (CC BY 4.0; see public/lessons/gcp/CREDITS.md). Each is placed in a fixed box, and a step
 * zooms by setting `view` (file pixels). Rings are placed from FILE-pixel regions by `at`, so they always follow the zoom in the same step.
 */

interface Pic { x: number; y: number; w: number; h: number; nw: number; nh: number }
type V = { x: number; y: number; w: number };
const pic = (nw: number, nh: number, o: { x?: number; y?: number; w?: number; h?: number } = {}): Pic => {
	const w = o.w ?? 336;
	return { x: o.x ?? 12, y: o.y ?? 10, w, h: o.h ?? Math.round((w * nh) / nw), nw, nh };
};
/** A ring on a region given in file pixels, drawn for the view `v` (default: the whole picture) and kept inside the picture's box. */
const at = (id: string, p: Pic, v: V | undefined, r: [number, number, number, number]): SceneNode => {
	const vv = v ?? { x: 0, y: 0, w: p.nw };
	const s = p.w / vv.w;
	const x1 = Math.max(p.x + (r[0] - vv.x) * s, p.x + 1), y1 = Math.max(p.y + (r[1] - vv.y) * s, p.y + 1);
	const x2 = Math.min(p.x + (r[0] + r[2] - vv.x) * s, p.x + p.w - 1), y2 = Math.min(p.y + (r[1] + r[3] - vv.y) * s, p.y + p.h - 1);
	const f = (n: number) => Math.round(n * 10) / 10;
	return ring(id, f(x1), f(y1), f(x2 - x1), f(y2 - y1));
};
const img = (id: string, src: string, p: Pic, o: { view?: V; visible?: boolean } = {}): SceneNode => shot(id, src, p.nw, p.nh, { x: p.x, y: p.y, w: p.w, h: p.h, view: o.view, visible: o.visible ?? true, alt: id });

const WHOLE = 'Screenshot: Google Cloud documentation, CC BY 4.0';
const CROP = 'Screenshot (zoomed): Google Cloud documentation, CC BY 4.0';
const whole = { c: { text: WHOLE } };
const crop = { c: { text: CROP } };
const ILLUS = 'Illustration of the console layout, not a screenshot';
const illus = (id: string, y: number): SceneNode => ({ id, kind: 'text', x: 180, y, text: ILLUS, size: 'sm', anchor: 'middle', visible: true });

export const gcOps: Scene[] = [
	// ───────────── gcp-logging ─────────────
	(() => {
		const p = pic(1400, 678);
		const Z = (x: number, y: number, w: number): V => ({ x, y, w });
		const top = Z(0, 30, 800), right = Z(700, 0, 700), fields = Z(0, 270, 560), tl = Z(310, 240, 900), res = Z(310, 330, 700);
		return {
			id: 'gc-logs-explorer-tour',
			topic: 'gcp',
			group: 'gcp-logging',
			title: 'A tour of the Logs Explorer',
			blurb: 'Where do you type the query, and what do the timeline and fields show?',
			stage: { w: 360, h: 200 },
			nodes: [
				img('p', 'lessons/gcp/logs-explorer.webp', p),
				credit('c', 192, WHOLE),
				at('r0', p, undefined, [0, 45, 1400, 195]),
				at('r1', p, top, [10, 52, 780, 40]),
				at('r2', p, top, [10, 98, 530, 40]),
				at('r3', p, top, [10, 135, 330, 26]),
				at('r4a', p, right, [960, 3, 295, 40]),
				at('r4b', p, right, [1286, 55, 100, 38]),
				at('r5', p, fields, [8, 380, 300, 135]),
				at('r6', p, tl, [330, 300, 880, 100]),
				at('r7', p, res, [315, 462, 695, 200])
			],
			steps: [
				{ say: 'The Logs Explorer: a query pane on top, the Fields pane and the Timeline in the middle, and the results below.', show: ['r0'] },
				{ say: 'Refine scope picks what to search, here Project logs, and Search all fields adds free-text terms to the query.', hide: ['r0'], set: { p: { view: top }, ...crop }, show: ['r1'] },
				{ say: 'Menus such as Audited Resource, All log names, All severities and Correlate by build the query without typing it.', hide: ['r1'], show: ['r2'] },
				{ say: 'The query itself is text in the Logging query language, here resource.type="audited_resource". Menus and clicks edit it for you.', hide: ['r2'], show: ['r3'] },
				{ say: 'The time range, Last 1 hour here, limits what is searched, and Run query executes the query.', hide: ['r3'], set: { p: { view: right } }, show: ['r4a', 'r4b'] },
				{ say: 'The Fields pane counts values: 349 entries, with Severity split into Notice and Default. Clicking a value adds it to the query.', hide: ['r4a', 'r4b'], set: { p: { view: fields } }, show: ['r5'] },
				{ say: 'The Timeline is a histogram of matching entries over time. Each bar is a slice of the range, so a spike stands out at once.', hide: ['r5'], set: { p: { view: tl } }, show: ['r6'] },
				{ say: 'Below are the results: severity, time and a summary of each entry, with an arrow on each row to expand it.', hide: ['r6'], set: { p: { view: res } }, show: ['r7'] }
			]
		};
	})(),
	(() => {
		const p = pic(1400, 633);
		const chip: V = { x: 430, y: 120, w: 900 };
		return {
			id: 'gc-logs-gke-menu',
			topic: 'gcp',
			group: 'gcp-logging',
			title: 'Severity, time and label chips',
			blurb: 'What do the columns and chips in the log results mean?',
			stage: { w: 360, h: 190 },
			nodes: [
				img('p', 'lessons/gcp/logs-gke-menu.webp', p),
				credit('c', 178, WHOLE),
				at('r1', p, undefined, [10, 70, 1380, 50]),
				at('r2', p, undefined, [10, 120, 110, 500]),
				at('r3', p, undefined, [435, 72, 90, 40]),
				at('r4', p, chip, [545, 135, 120, 40]),
				at('r5', p, chip, [545, 265, 295, 220])
			],
			steps: [
				{ say: 'Query results list log entries under three headings: Severity, Time and Summary.', show: ['r1'] },
				{ say: 'The icon at the start of each row shows that entry\'s severity, so errors stand out as you scroll.', hide: ['r1'], show: ['r2'] },
				{ say: 'The Time column has a time-zone selector, EDT in this screenshot, so timestamps can be read in the zone you work in.', hide: ['r2'], show: ['r3'] },
				{ say: 'Each summary starts with chips, short labels taken from the entry, such as server and mixer. They tell you which part of the system spoke.', hide: ['r3'], set: { p: { view: chip }, ...crop }, show: ['r4'] },
				{ say: 'Clicking a chip opens a menu: View monitoring details, View in GKE and Copy value. Logs link straight to the metrics and cluster pages of their source.', hide: ['r4'], show: ['r5'], pulse: ['r5'] }
			]
		};
	})(),
	(() => {
		const p = pic(1400, 588);
		const panel: V = { x: 900, y: 40, w: 500 };
		const meas: V = { x: 900, y: 290, w: 500 };
		const brk: V = { x: 900, y: 378, w: 500 };
		return {
			id: 'gc-logs-analytics',
			topic: 'gcp',
			group: 'gcp-logging',
			title: 'Counting log entries with SQL',
			blurb: 'How do you chart errors per hour from logs?',
			stage: { w: 360, h: 205 },
			nodes: [
				img('p', 'lessons/gcp/logs-analytics.webp', p),
				credit('c', 168, WHOLE),
				{ id: 'name', kind: 'text', x: 180, y: 186, text: 'Observability Analytics, once called Log Analytics', size: 'sm', anchor: 'middle' },
				at('r1', p, undefined, [0, 0, 420, 588]),
				at('r2', p, undefined, [430, 15, 630, 555]),
				at('r3', p, panel, [1068, 60, 325, 230]),
				at('r4', p, meas, [1068, 305, 325, 125]),
				at('r4b', p, brk, [1068, 465, 325, 123])
			],
			steps: [
				{ say: 'SQL results from your logs appear as a table: one row per log entry, with columns such as timestamp and severity.', show: ['r1'] },
				{ say: 'The same result drawn as a stacked bar chart: log entries per hour, split by severity (DEBUG, DEFAULT, ERROR, INFO, WARNING).', hide: ['r1'], show: ['r2'] },
				{ say: 'Chart display settings: a bar chart, with the timestamp column on the x-axis in a custom interval of one hour.', hide: ['r2'], set: { p: { view: panel }, ...crop }, show: ['r3'] },
				{ say: 'The measure is Count rows: each bar counts the log entries that fall in its hour.', hide: ['r3'], set: { p: { view: meas } }, show: ['r4'] },
				{ say: 'A breakdown by the severity column splits each bar into one segment per severity.', hide: ['r4'], set: { p: { view: brk } }, show: ['r4b'] },
				{ say: 'You need a bucket upgraded for this. The Logs Explorer filters and browses, while this view aggregates with SQL.', hide: ['r4b'], set: { p: { view: { x: 0, y: 0, w: 1400 } }, ...whole }, show: ['name'] }
			]
		};
	})(),

	// ───────────── gcp-monitoring-and-alerts ─────────────
	(() => {
		const p = pic(820, 358);
		const spike: V = { x: 120, y: 170, w: 300 };
		return {
			id: 'gc-mon-metrics-explorer',
			topic: 'gcp',
			group: 'gcp-monitoring-and-alerts',
			title: 'Reading a Metrics Explorer chart',
			blurb: 'What are the lines, the legend and the toggle on a metric chart?',
			stage: { w: 360, h: 200 },
			nodes: [
				img('p', 'lessons/gcp/mon-metrics-chart.webp', p),
				credit('c', 176, WHOLE),
				{ id: 'save', kind: 'text', x: 180, y: 194, text: 'Save as: Dashboard chart, or Alert policy', size: 'sm', anchor: 'middle' },
				at('r1', p, undefined, [8, 6, 168, 32]),
				at('r2', p, undefined, [10, 30, 770, 255]),
				at('r3', p, undefined, [5, 306, 590, 50]),
				at('r4', p, spike, [233, 226, 32, 60])
			],
			steps: [
				{ say: 'A Metrics Explorer chart of CPU utilization. CHART, TABLE and BOTH at the top left switch how the same data is shown.', show: ['r1'] },
				{ say: 'Each coloured line is one time series: the metric for one zone, us-central1-a, -b, -c and -f.', hide: ['r1'], show: ['r2'] },
				{ say: 'The legend lists the latest value of each series, such as us-central1-c at 15.88%. Grouping by a label such as zone gives one line per zone.', hide: ['r2'], show: ['r3'] },
				{ say: 'A short spike in one zone at about 2:55 PM stands out. This is how you notice trouble in one place while the rest looks calm.', hide: ['r3'], set: { p: { view: spike }, ...crop }, show: ['r4'] },
				{ say: 'When the chart is useful, keep it: Save as puts it on a dashboard or turns it into an alerting policy with the metric already filled in.', hide: ['r4'], set: { p: { view: { x: 0, y: 0, w: 820 } }, ...whole }, show: ['save'] }
			]
		};
	})(),
	(() => {
		const p = pic(537, 337, { x: 50, w: 260 });
		return {
			id: 'gc-mon-dashboard',
			topic: 'gcp',
			group: 'gcp-monitoring-and-alerts',
			title: 'A dashboard line chart',
			blurb: 'What can a line chart on a dashboard tell you, and what else goes on one?',
			stage: { w: 360, h: 300 },
			nodes: [
				img('p', 'lessons/gcp/mon-line-chart.webp', p),
				credit('c', 188, WHOLE),
				{ id: 'w', kind: 'doc', x: 16, y: 204, w: 328, title: 'Dashboard widgets', lines: ['Line, stacked area, stacked bar, heatmap: trends', 'Table, gauge, scorecard: the latest value', 'Text and groups: structure for the page'], hl: [] },
				at('r1', p, undefined, [0, 0, 537, 337]),
				at('r2a', p, undefined, [130, 25, 55, 105]),
				at('r2b', p, undefined, [295, 40, 55, 110]),
				at('r3', p, undefined, [0, 255, 537, 75])
			],
			steps: [
				{ say: 'A line chart widget on a dashboard: one line for each time series, drawn over the time range chosen for the whole dashboard.', show: ['r1'] },
				{ say: 'Two spikes appear at about the same times across several series. When lines rise together, look for one shared cause.', hide: ['r1'], show: ['r2a', 'r2b'] },
				{ say: 'Near the bottom a bundle of series stays low and flat. A chart with this many lines is hard to read, so filter or group.', hide: ['r2a', 'r2b'], show: ['r3'] },
				{ say: 'A dashboard mixes widget types. Charts show trends over time, and the first line of the list is the family this picture belongs to.', hide: ['r3'], show: ['w'], set: { w: { hl: [0] } } },
				{ say: 'Gauges and scorecards show only the latest value, and their background colour changes at the thresholds you set.', set: { w: { hl: [1] } } }
			]
		};
	})(),
	(() => {
		const p = pic(501, 733, { h: 190 });
		const v = (y: number): V => ({ x: 0, y, w: 501 });
		return {
			id: 'gc-mon-alert',
			topic: 'gcp',
			group: 'gcp-monitoring-and-alerts',
			title: 'What an alert notification says',
			blurb: 'What lands in the inbox when an alerting policy fires?',
			stage: { w: 360, h: 225 },
			nodes: [
				img('p', 'lessons/gcp/mon-alert-notification.webp', p, { view: v(0) }),
				credit('c', 218, CROP),
				at('r1', p, v(0), [5, 5, 490, 60]),
				at('r2', p, v(0), [5, 88, 490, 135]),
				at('r3', p, v(150), [5, 225, 490, 100]),
				at('r4', p, v(310), [5, 322, 490, 175]),
				at('r5', p, v(470), [5, 635, 490, 95])
			],
			steps: [
				{ say: 'The notification opens with the condition that fired: VM Instance CPU utilization is above a threshold of 0.05, and the value measured.', show: ['r1'] },
				{ say: 'Then when it started, which policy and condition fired, and the project, so the responder knows what to look at.', hide: ['r1'], show: ['r2'] },
				{ say: 'Chips list the metric and resource labels such as the instance name and zone, so you can tell which machine is involved.', hide: ['r2'], set: { p: { view: v(150) } }, show: ['r3'] },
				{ say: 'The policy documentation field travels in the message. Here it summarises that CPU exceeded 5% for over 60 seconds.', hide: ['r3'], set: { p: { view: v(310) } }, show: ['r4'] },
				{ say: 'The documentation can end with links, such as a playbook and a dashboard, so whoever is paged knows where to start.', hide: ['r4'], set: { p: { view: v(470) } }, show: ['r5'] }
			]
		};
	})(),

	// ───────────── gcp-secrets-and-security ─────────────
	{
		id: 'gc-secret-versions',
		topic: 'gcp',
		group: 'gcp-secrets-and-security',
		title: 'A secret and its versions',
		blurb: 'How does a secret change, and how does Cloud Run read it?',
		stage: { w: 360, h: 340 },
		nodes: [
			...consoleChrome('s', { path: 'Secret Manager > db-password', tabs: ['Versions', 'Permissions', 'Rotation'], active: 0, h: 306 }),
			{ id: 't', kind: 'table', x: 24, y: 64, colW: 100, cols: ['Version', 'State', 'Created'], rows: [['3', 'Enabled', 'Mon'], ['2', 'Enabled', 'Fri'], ['1', 'Destroyed', 'Wed']], visible: true },
			{ id: 'env', kind: 'box', x: 24, y: 200, w: 150, h: 46, label: 'Environment variable', sub: 'pin a version' },
			{ id: 'file', kind: 'box', x: 186, y: 200, w: 150, h: 46, label: 'Mounted file', sub: 'reads the latest' },
			{ id: 'iam', kind: 'text', x: 24, y: 276, text: 'The service identity needs Secret Manager Secret Accessor', w: 300, size: 'sm' },
			illus('il', 332)
		],
		steps: [
			{ say: 'The secret db-password is the name; each value is a version. Every version has a state, and the table lists them.', focus: ['t'] },
			{ say: 'Version 1 is destroyed: its contents are gone for good. A disabled version would be hidden but could be enabled again.', set: { t: { hl: [2] } } },
			{ say: 'To rotate, you do not edit a value, because secret data is immutable. You add a new version, here version 4, and old ones stay.', set: { t: { rows: [['4', 'Enabled', 'Tue'], ['3', 'Enabled', 'Mon'], ['2', 'Enabled', 'Fri'], ['1', 'Destroyed', 'Wed']], hl: [0] } } },
			{ say: 'A Cloud Run service can read it as an environment variable. The value is fetched before an instance starts, so pin a specific version.', show: ['env'], set: { env: { tone: 'accent' } } },
			{ say: 'Or mount it as a file. Each read fetches the latest version, which suits rotation, and a read fails if access is removed.', show: ['file'], set: { file: { tone: 'accent' } } },
			{ say: 'Either way the service identity needs the Secret Manager Secret Accessor role, or the read is refused.', show: ['iam'], set: { iam: { tone: 'warn' } } }
		]
	},
	{
		id: 'gc-kms-envelope',
		topic: 'gcp',
		group: 'gcp-secrets-and-security',
		title: 'Envelope encryption with Cloud KMS',
		blurb: 'Why is the data encrypted by one key and that key by another?',
		stage: { w: 360, h: 330 },
		nodes: [
			{ id: 'd', kind: 'box', x: 16, y: 20, w: 140, h: 42, label: 'Order data', sub: 'plaintext', visible: true },
			{ id: 'dek', kind: 'box', x: 204, y: 20, w: 140, h: 42, label: 'Data key (DEK)', sub: 'made locally' },
			{ id: 'enc', kind: 'box', x: 16, y: 112, w: 140, h: 42, label: 'Encrypted data' },
			{ id: 'kek', kind: 'box', x: 204, y: 112, w: 140, h: 54, label: 'Key in Cloud KMS', sub: 'the KEK, never leaves KMS' },
			{ id: 'wr', kind: 'box', x: 204, y: 206, w: 140, h: 42, label: 'Wrapped DEK' },
			{ id: 'st', kind: 'box', x: 16, y: 272, w: 328, h: 44, label: 'Stored together', sub: 'encrypted data + wrapped DEK' },
			{ id: 'e1', kind: 'edge', from: 'd', to: 'enc', label: 'encrypt' },
			{ id: 'e2', kind: 'edge', from: 'dek', to: 'enc' },
			{ id: 'e3', kind: 'edge', from: 'dek', to: 'kek', label: 'wrap' },
			{ id: 'e4', kind: 'edge', from: 'kek', to: 'wr' },
			{ id: 'e5', kind: 'edge', from: 'enc', to: 'st' },
			{ id: 'e6', kind: 'edge', from: 'wr', to: 'st' }
		],
		steps: [
			{ say: 'An order record needs protecting. First generate a data encryption key (DEK) locally, just for this object.', show: ['dek'], set: { dek: { tone: 'accent' } } },
			{ say: 'Encrypt the data with the DEK. The data itself never travels to Cloud KMS.', show: ['enc', 'e1', 'e2'] },
			{ say: 'Send the DEK to Cloud KMS, where the key encryption key (KEK) wraps it. The KEK never leaves KMS.', show: ['kek', 'e3'], set: { kek: { tone: 'accent' } } },
			{ say: 'Only the wrapped DEK comes back. Never store a plaintext DEK: once it is wrapped, throw the plain copy away.', show: ['wr', 'e4'], set: { dek: { tone: 'warn' } } },
			{ say: 'Store the encrypted data and the wrapped DEK together. One KEK can protect very many data keys.', show: ['st', 'e5', 'e6'] },
			{ say: 'To read, ask KMS to unwrap the DEK, then decrypt. Rotating the KEK means re-wrapping DEKs, not re-encrypting all the data.', set: { st: { tone: 'accent' } }, pulse: ['st'] }
		]
	},
	{
		id: 'gc-armor-rules',
		topic: 'gcp',
		group: 'gcp-secrets-and-security',
		title: 'A Cloud Armor policy',
		blurb: 'How are the rules of a web application firewall ordered and applied?',
		stage: { w: 360, h: 345 },
		nodes: [
			...consoleChrome('a', { path: 'Cloud Armor policies > store-policy', tabs: ['Rules', 'Targets', 'Logs'], active: 0, h: 318 }),
			{ id: 't', kind: 'table', x: 24, y: 64, colW: 100, cols: ['Priority', 'Match', 'Action'], rows: [['1000', 'path /admin', 'deny'], ['2000', 'rate per IP', 'throttle'], ['3000', 'SQL injection', 'deny'], ['default', 'everything else', 'allow']], visible: true },
			{ id: 'f0', kind: 'box', x: 24, y: 206, w: 90, h: 56, label: 'Shopper' },
			{ id: 'f1', kind: 'box', x: 135, y: 206, w: 90, h: 56, label: 'Load balancer', sub: 'with policy' },
			{ id: 'f2', kind: 'box', x: 246, y: 206, w: 90, h: 56, label: 'Backend' },
			{ id: 'fe0', kind: 'edge', from: 'f0', to: 'f1' },
			{ id: 'fe1', kind: 'edge', from: 'f1', to: 'f2' },
			{ id: 'lim', kind: 'text', x: 24, y: 288, text: 'Not a fix for vulnerable code. Always-on L3/L4 DDoS protection is automatic; L7 floods need rules you write.', w: 312, size: 'sm' },
			illus('il', 340)
		],
		steps: [
			{ say: 'A Cloud Armor policy is an ordered list of rules. It attaches to the backend service behind a Google Cloud load balancer.', focus: ['t'] },
			{ say: 'Rules are checked by priority: the highest-priority rule that matches decides. Here a request for /admin is denied.', set: { t: { hl: [0] } } },
			{ say: 'A rate-limit rule throttles clients that send too many requests, or bans them for a while. It helps against floods and scraping.', set: { t: { hl: [1] } } },
			{ say: 'Preconfigured rules, based on the OWASP ModSecurity Core Rule Set, catch common web attacks such as SQL injection.', set: { t: { hl: [2] } } },
			{ say: 'If no rule matches, the default rule applies. Here it allows the request.', set: { t: { hl: [3] } } },
			{ say: 'The policy runs at the Google edge, so denied traffic never reaches your containers.', show: ['f0', 'f1', 'f2', 'fe0', 'fe1'], set: { f1: { tone: 'accent' } } },
			{ say: 'It is one layer, not a cure: your code must still be safe, and layer-7 floods only stop if you write rules for them.', show: ['lim'], set: { lim: { tone: 'warn' } } }
		]
	},

	// ───────────── gcp-bigquery-console ─────────────
	(() => {
		const a = pic(1055, 726, { h: 200 });
		const b = pic(1400, 754);
		const va: V = { x: 0, y: 40, w: 1055 };
		return {
			id: 'gc-bq-sandbox',
			topic: 'gcp',
			group: 'gcp-bigquery-console',
			title: 'Starting in the BigQuery sandbox',
			blurb: 'What do you click through to try BigQuery with no billing account?',
			stage: { w: 360, h: 235 },
			nodes: [
				img('a', 'lessons/gcp/bq-sandbox-welcome.webp', a, { view: va }),
				img('b', 'lessons/gcp/bq-sandbox-project.webp', b, { visible: false }),
				credit('c', 226, CROP),
				at('ra1', a, va, [75, 78, 895, 60]),
				at('ra2', a, va, [75, 235, 890, 70]),
				at('ra3', a, va, [715, 600, 255, 45]),
				at('rb1', b, undefined, [60, 140, 820, 52]),
				at('rb2', b, undefined, [45, 250, 1320, 100]),
				at('rb3', b, undefined, [45, 632, 190, 90])
			],
			steps: [
				{ say: 'Sandbox sign-up begins on a welcome page. Choose your country first.', show: ['ra1'] },
				{ say: 'Then accept the Google Cloud terms of service. The email updates box is optional.', hide: ['ra1'], show: ['ra2'] },
				{ say: 'Agree and continue takes you on. There is no credit card and no billing account anywhere in this flow.', hide: ['ra2'], show: ['ra3'] },
				{ say: 'Next you create a project, the container for everything you build. BigQuery jobs run inside it.', hide: ['ra3', 'a'], show: ['b'], set: whole },
				{ say: 'The project ID follows the name, and the page says it cannot be changed later, so choose with care.', show: ['rb1'] },
				{ say: 'Organization can stay No organization for a personal account. The page adds that this choice cannot be changed later either.', hide: ['rb1'], show: ['rb2'] },
				{ say: 'Create finishes the setup. The sandbox has limits, and you can upgrade later by turning on billing.', hide: ['rb2'], show: ['rb3'], pulse: ['rb3'] }
			]
		};
	})(),
	(() => {
		const a = pic(1314, 609);
		const b = pic(1275, 421);
		const za: V = { x: 0, y: 0, w: 950 }, vb: V = { x: 0, y: 124, w: 900 };
		return {
			id: 'gc-bq-explorer',
			topic: 'gcp',
			group: 'gcp-bigquery-console',
			title: 'Projects, datasets and job history',
			blurb: 'How is data organised in BigQuery, and where do past jobs live?',
			stage: { w: 360, h: 200 },
			nodes: [
				img('a', 'lessons/gcp/bq-breadcrumbs.webp', a),
				img('b', 'lessons/gcp/bq-history.webp', b, { view: vb, visible: false }),
				credit('c', 188, WHOLE),
				at('r1', a, undefined, [30, 5, 880, 85]),
				at('r2', a, za, [0, 170, 660, 75]),
				at('r3', a, za, [10, 255, 450, 75]),
				at('r4', a, undefined, [0, 425, 1314, 180]),
				at('r5', b, vb, [10, 370, 175, 50]),
				at('r6', b, vb, [437, 210, 430, 55])
			],
			steps: [
				{ say: 'A dataset page. The breadcrumb reads project, Datasets, dataset. bigquery-public-data is the project that holds Google\'s public datasets.', show: ['r1'] },
				{ say: 'Tabs run along the dataset: Overview, Details and Insights, which carries a Preview tag in this screenshot.', hide: ['r1'], set: { a: { view: za }, ...crop }, show: ['r2'] },
				{ say: 'Inside Overview you switch between Tables, Models and Routines.', hide: ['r2'], show: ['r3'] },
				{ say: 'The table list shows each Table ID and its Type. Selecting a name opens that table in a tab.', hide: ['r3'], set: { a: { view: { x: 0, y: 0, w: 1314 } }, ...whole }, show: ['r4'] },
				{ say: 'Job history sits under Explorer, beside Home, Starred and Shared with me.', hide: ['r4', 'a'], show: ['b', 'r5'], set: crop },
				{ say: 'It has two views: Personal history for your own jobs, and Project history for recent jobs in the project.', hide: ['r5'], show: ['r6'] }
			]
		};
	})(),
	(() => {
		const a = pic(924, 291, { h: 150 }), b = pic(914, 362, { h: 150 }), c = pic(1150, 584, { h: 150 });
		const va: V = { x: 0, y: 0, w: 500 }, va2: V = { x: 404, y: 40, w: 520 }, vb: V = { x: 0, y: 60, w: 600 }, vc: V = { x: 0, y: 230, w: 700 };
		return {
			id: 'gc-bq-editor',
			topic: 'gcp',
			group: 'gcp-bigquery-console',
			title: 'The query editor and split tabs',
			blurb: 'How do you run a query, check it first, and read the schema beside it?',
			stage: { w: 360, h: 185 },
			nodes: [
				img('a', 'lessons/gcp/bq-tabs.webp', a, { view: va }),
				img('b', 'lessons/gcp/bq-query-split.webp', b, { view: vb, visible: false }),
				img('c', 'lessons/gcp/bq-field-split.webp', c, { view: vc, visible: false }),
				credit('c0', 176, CROP),
				at('r1', a, va, [35, 48, 75, 40]),
				at('r2', a, va, [418, 50, 40, 35]),
				at('r3', a, va2, [475, 98, 190, 22]),
				at('r3b', a, va2, [480, 140, 420, 56]),
				at('r4a', b, vb, [270, 90, 110, 28]),
				at('r4b', b, vb, [255, 135, 160, 125]),
				at('r5a', c, vc, [215, 388, 225, 35]),
				at('r5b', c, vc, [140, 415, 70, 40])
			],
			steps: [
				{ say: 'The editor holds the query on the left. Run executes it, and a small mark at the right of the toolbar is the validator.', show: ['r1'] },
				{ say: 'A green check mark means the query is valid and shows how much data it will process. An exclamation point would show an error.', hide: ['r1'], show: ['r2'] },
				{ say: 'Tabs can sit side by side: the query on the left and a table\'s schema on the right, so field names are in view while you type.', hide: ['r2'], set: { a: { view: va2 } }, show: ['r3', 'r3b'] },
				{ say: 'To query a table, open it and click Query. A small menu offers In new tab or In split tab.', hide: ['r3', 'r3b', 'a'], show: ['b', 'r4a', 'r4b'] },
				{ say: 'In the schema, hovering a field name shows Add to query in split tab, which sends that field into the query beside it.', hide: ['r4a', 'r4b', 'b'], show: ['c', 'r5a', 'r5b'], pulse: ['r5a'] }
			]
		};
	})(),
	(() => {
		const a = pic(834, 332), b = pic(841, 483);
		return {
			id: 'gc-bq-results',
			topic: 'gcp',
			group: 'gcp-bigquery-console',
			title: 'Results and the map view',
			blurb: 'What do the result tabs show, and how do you draw a map?',
			stage: { w: 360, h: 232 },
			nodes: [
				img('a', 'lessons/gcp/bq-query-results.webp', a),
				img('b', 'lessons/gcp/bq-visualization.webp', b, { visible: false }),
				credit('c', 222, WHOLE),
				at('r1', a, undefined, [0, 3, 745, 40]),
				at('r2', a, undefined, [0, 40, 834, 24]),
				at('r3', a, undefined, [710, 38, 124, 292]),
				at('r4', b, undefined, [237, 3, 125, 33]),
				at('r5', b, undefined, [530, 95, 305, 190]),
				at('r6', b, undefined, [0, 38, 515, 440])
			],
			steps: [
				{ say: 'Query results have tabs: Job information, Results, Visualization, JSON, Execution details and Execution graph.', show: ['r1'] },
				{ say: 'The Results tab is a table: a start station name, its coordinates, a geo_location column and the number of trips.', hide: ['r1'], show: ['r2'] },
				{ say: 'The busiest station is first: the rows are in descending order of num_trips, because the query sorted them.', hide: ['r2'], show: ['r3'] },
				{ say: 'On the Visualization tab a result can be drawn as a map, when it has a geography column and a number to show.', hide: ['r3', 'a'], show: ['b', 'r4'] },
				{ say: 'The panel on the right sets the Visualization type to Map, the Geography column to geo_location and the Data column to num_trips.', hide: ['r4'], show: ['r5'] },
				{ say: 'The map plots each station as a dot, shaded by num_trips between the Min and Max values shown in the panel.', hide: ['r5'], show: ['r6'] }
			]
		};
	})(),

	// ───────────── gcp-bigquery-design ─────────────
	{
		id: 'gc-bq-columnar',
		topic: 'gcp',
		group: 'gcp-bigquery-design',
		title: 'Columns, SELECT * and the bill',
		blurb: 'Why does naming columns make a query cheaper?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'cap', kind: 'text', x: 17, y: 24, text: 'orders table, stored column by column', size: 'sm', visible: true },
			{ id: 'c0', kind: 'box', x: 17, y: 40, w: 62, h: 110, label: 'id', sub: 'small', visible: true },
			{ id: 'c1', kind: 'box', x: 83, y: 40, w: 62, h: 110, label: 'customer', sub: 'small', visible: true },
			{ id: 'c2', kind: 'box', x: 149, y: 40, w: 62, h: 110, label: 'total', sub: 'small', visible: true },
			{ id: 'c3', kind: 'box', x: 215, y: 40, w: 62, h: 110, label: 'date', sub: 'small', visible: true },
			{ id: 'c4', kind: 'box', x: 281, y: 40, w: 62, h: 110, label: 'notes', sub: 'wide', visible: true },
			{ id: 'q1', kind: 'text', x: 17, y: 176, text: 'SELECT * FROM orders  reads all 5 columns', size: 'sm' },
			{ id: 'q2', kind: 'text', x: 17, y: 176, text: 'SELECT id, total FROM orders  reads 2 of 5', size: 'sm' },
			{ id: 'lim', kind: 'text', x: 17, y: 198, text: 'LIMIT 10 trims the result, not the data read', size: 'sm' },
			{ id: 'cm', kind: 'box', x: 17, y: 236, w: 130, h: 42, label: 'Compute', sub: 'runs queries' },
			{ id: 'st', kind: 'box', x: 213, y: 236, w: 130, h: 42, label: 'Storage', sub: 'columnar' },
			{ id: 'ce', kind: 'edge', from: 'cm', to: 'st', label: 'reads' },
			{ id: 'dry', kind: 'text', x: 17, y: 306, text: 'The validator and a dry run estimate the bytes first', size: 'sm' }
		],
		steps: [
			{ say: 'BigQuery stores each column of the orders table separately. The notes column is wide; the others are small.', focus: ['c4'] },
			{ say: 'SELECT * reads every column, including the wide notes column, even if you only look at two of them.', show: ['q1'], set: { c0: { tone: 'warn' }, c1: { tone: 'warn' }, c2: { tone: 'warn' }, c3: { tone: 'warn' }, c4: { tone: 'warn' } } },
			{ say: 'Naming two columns reads only those two. The wide notes column is never touched, so far fewer bytes are processed.', hide: ['q1'], show: ['q2'], set: { c0: { tone: 'accent' }, c1: { tone: 'neutral' }, c2: { tone: 'accent' }, c3: { tone: 'neutral' }, c4: { tone: 'neutral' } } },
			{ say: 'Adding LIMIT 10 does not change which columns are read or how much; on an unclustered table it only trims the result.', show: ['lim'], set: { lim: { tone: 'warn' } } },
			{ say: 'Storage and compute are separate layers, each scaling without affecting the other, so data can grow without sizing query servers.', show: ['cm', 'st', 'ce'] },
			{ say: 'Before you run, the editor\'s validator and a dry run estimate the bytes the query would process. Make checking it a habit.', show: ['dry'], set: { dry: { tone: 'accent' } } }
		]
	},
	{
		id: 'gc-bq-pruning',
		topic: 'gcp',
		group: 'gcp-bigquery-design',
		title: 'Partitions and clusters skip data',
		blurb: 'How do partitioning and clustering keep a query from reading everything?',
		stage: { w: 360, h: 310 },
		nodes: [
			{ id: 'cap', kind: 'text', x: 15, y: 22, text: 'orders, partitioned by day (toy sizes)', size: 'sm', visible: true },
			...[1, 2, 3, 4, 5, 6].map((d, i): SceneNode => ({ id: 'd' + d, kind: 'box', x: 15 + i * 56, y: 34, w: 50, h: 46, label: 'day ' + d, sub: '100 MB', visible: true })),
			{ id: 'q1', kind: 'text', x: 15, y: 106, text: 'WHERE day = 3: scans 100 MB of 600 MB', size: 'sm' },
			{ id: 'q2', kind: 'text', x: 15, y: 106, text: 'WHERE customer = 7: no partition filter, scans all', size: 'sm' },
			{ id: 'cap2', kind: 'text', x: 15, y: 148, text: 'inside day 3, clustered by customer', size: 'sm' },
			{ id: 'k0', kind: 'box', x: 15, y: 160, w: 76, h: 40, label: '1 to 5' },
			{ id: 'k1', kind: 'box', x: 99, y: 160, w: 76, h: 40, label: '6 to 10' },
			{ id: 'k2', kind: 'box', x: 183, y: 160, w: 76, h: 40, label: '11 to 15' },
			{ id: 'k3', kind: 'box', x: 267, y: 160, w: 76, h: 40, label: '16 to 20' },
			{ id: 'q3', kind: 'text', x: 15, y: 224, text: 'WHERE customer = 7: only the 6 to 10 block is read', size: 'sm' },
			{ id: 'cl', kind: 'text', x: 15, y: 252, text: 'CLUSTER BY customer, status (up to four columns)', size: 'sm' },
			{ id: 'mx', kind: 'text', x: 15, y: 280, text: 'Maximum bytes billed rejects an over-limit query', size: 'sm' }
		],
		steps: [
			{ say: 'A partitioned table keeps each day in its own partition. Here are six days of orders, 100 MB each in this toy example.', focus: ['d3'] },
			{ say: 'A filter on the partitioning column, day = 3, lets BigQuery scan only that partition and skip the rest.', show: ['q1'], set: { d3: { tone: 'accent' } } },
			{ say: 'A filter on a different column cannot prune partitions, so every partition is scanned.', hide: ['q1'], show: ['q2'], set: { d1: { tone: 'warn' }, d2: { tone: 'warn' }, d3: { tone: 'warn' }, d4: { tone: 'warn' }, d5: { tone: 'warn' }, d6: { tone: 'warn' } } },
			{ say: 'Clustering sorts data inside the partition into blocks by the clustered column, here customer.', hide: ['q2'], show: ['cap2', 'k0', 'k1', 'k2', 'k3'], set: { d1: { tone: 'neutral' }, d2: { tone: 'neutral' }, d3: { tone: 'accent' }, d4: { tone: 'neutral' }, d5: { tone: 'neutral' }, d6: { tone: 'neutral' } } },
			{ say: 'A filter on a clustered column skips blocks that cannot match. Only the block holding customer 7 is read.', show: ['q3'], set: { k1: { tone: 'accent' } } },
			{ say: 'Choose up to four clustering columns and put the one you filter on first, since their order matters.', show: ['cl'] },
			{ say: 'A dry run estimates bytes, and maximum bytes billed makes a query fail with no charge if its estimate is too high.', show: ['mx'], set: { mx: { tone: 'accent' } } }
		]
	}
];
