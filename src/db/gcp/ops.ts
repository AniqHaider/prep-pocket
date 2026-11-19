import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

const md = (...lines: string[]) => lines.join('\n');

// Google Cloud, the "operate and analyse" half: logging, monitoring, secrets and security, and BigQuery. A generic online store is the running
// example. No prices or fast-changing quotas are stated as facts. Real screenshots come from the Google Cloud documentation (CC BY 4.0);
// see public/lessons/gcp/CREDITS.md. `try` snippets are plain, deterministic JavaScript that models the idea; they do not call Google Cloud
// and they use String.raw, so keep backticks and the dollar-brace sequence out of them.

export const topics: DbTopic[] = [
	{
		id: 'gcp-logging',
		title: 'Cloud Logging',
		level: 'basic',
		summary: 'Read the Logs Explorer, and know where log entries are stored, how sinks route them, and when to use log-based metrics or SQL.',
		scenes: ['gc-logs-explorer-tour', 'gc-logs-gke-menu', 'gc-logs-analytics'],
		notes: md(
			'Every service in the store writes **log entries**: a timestamp, a **severity** (DEBUG up to CRITICAL), the **resource** that wrote it (a Cloud Run revision, a load balancer) and a payload. Cloud Logging keeps each entry in a **log bucket** in the project where it was written.',
			'',
			'**Reading logs: the Logs Explorer.** A query pane at the top (the Logging query language, with menus that build it for you), a **Timeline** histogram of how many entries match in each slice of time, a **Fields** pane that counts values such as Severity, and the results below. Click a value and it is added to the query.',
			'',
			'**Moving logs: sinks.** A sink has one inclusion filter and optional exclusion filters; an entry that matches the inclusion filter and no exclusion filter is routed to a destination: a log bucket, a BigQuery dataset, a Cloud Storage bucket or a Pub/Sub topic. Sinks are not retroactive. Two sinks exist from the start: `_Required` (audit logs, cannot be changed) and `_Default` (everything else, which you can edit or disable). A bucket you create yourself keeps entries for 30 days unless you set another retention.',
			'',
			'**Turning logs into numbers.** A **log-based metric** counts matching entries (a counter) or groups extracted values such as latency (a distribution) and appears in Cloud Monitoring. It only counts entries that arrive after it was created.',
			'',
			'**Asking aggregate questions.** The Logs Explorer filters; it does not aggregate. Upgrade a bucket and use **Observability Analytics** (the page you may know as Log Analytics) to run SQL: errors per hour per service.',
			'',
			'**Mistakes to avoid:** excluding entries you later need (a sink cannot route them back), and expecting a new metric or sink to cover yesterday.',
			'',
			'Screenshots: Google Cloud documentation, CC BY 4.0, https://docs.cloud.google.com/logging/docs/view/logs-explorer-interface and https://docs.cloud.google.com/logging/docs/log-analytics'
		),
		try: [
			{
				label: 'A sink with filters, and a counter metric',
				code: String.raw`// Toy model of a log sink: one inclusion filter, exclusion filters, and a counter metric.
const logs = [
  { t: 1, sev: 'INFO',    type: 'cloud_run_revision', msg: 'order 41 placed' },
  { t: 2, sev: 'ERROR',   type: 'cloud_run_revision', msg: 'payment failed for order 42' },
  { t: 3, sev: 'WARNING', type: 'http_load_balancer', msg: 'slow backend' },
  { t: 4, sev: 'ERROR',   type: 'http_load_balancer', msg: '502 from backend' },
  { t: 5, sev: 'ERROR',   type: 'cloud_run_revision', msg: 'stock lookup timed out' },
];
const rank = { DEBUG: 0, INFO: 1, NOTICE: 2, WARNING: 3, ERROR: 4, CRITICAL: 5 };
const sink = {
  include: (e) => rank[e.sev] >= rank.ERROR,
  exclude: [(e) => e.type === 'http_load_balancer'],
};
const routed = logs.filter((e) => sink.include(e) && !sink.exclude.some((f) => f(e)));
console.log('routed:', routed.map((e) => e.msg));

// A counter metric created at t = 4 only sees entries that arrive after it exists.
const metricCreatedAt = 4;
const counted = logs.filter((e) => e.t > metricCreatedAt && e.sev === 'ERROR').length;
console.log('errors counted by a metric created at t=4:', counted, 'of', logs.filter((e) => e.sev === 'ERROR').length);`
			}
		]
	},
	{
		id: 'gcp-monitoring-and-alerts',
		title: 'Cloud Monitoring and alerts',
		level: 'basic',
		summary: 'Chart a metric in Metrics Explorer, build dashboards, and set up alerting policies, uptime checks and SLOs that wake you for the right reasons.',
		scenes: ['gc-mon-metrics-explorer', 'gc-mon-dashboard', 'gc-mon-alert'],
		notes: md(
			'**Cloud Monitoring** stores **metrics**: numbers over time, one **time series** for each combination of metric and labels (CPU utilization of one instance, requests per second of one service). Logs tell you what happened; metrics tell you how much and how often.',
			'',
			'**Metrics Explorer** builds a temporary chart: pick a resource type and metric, add filters, then aggregate (for example the mean, grouped by `zone`). You can save the chart to a dashboard or turn it into an alerting policy.',
			'',
			'**Dashboards** are collections of widgets: line, stacked-area and stacked-bar charts and heatmaps for trends; tables, gauges and scorecards for the latest value. Google creates one per service; you build custom ones for the store.',
			'',
			'**Alerting policies** say when to alert and how to notify. A metric-threshold condition is met when values stay above or below a threshold for a **retest window**; one or more **notification channels** (email, Slack) receive it, and the optional **documentation** field puts a playbook link in the message. When the condition stops holding, Monitoring closes the alert.',
			'',
			'**Uptime checks** probe a URL over HTTP, HTTPS or TCP from several regions. A check alerts nobody on its own: attach an alerting policy.',
			'',
			'**What to watch:** the four golden signals from Google\'s SRE book: latency, traffic, errors and saturation. An **SLO** turns one signal into a target (99.9% of requests good over a month); the **error budget**, here 0.1%, is how much failure you may spend.',
			'',
			'**Mistakes to avoid:** alerting on every spike (use a duration), and alerts with no documentation, so the person woken at night does not know what to do.',
			'',
			'Screenshots: Google Cloud documentation, CC BY 4.0, https://docs.cloud.google.com/monitoring/charts/metrics-explorer, https://docs.cloud.google.com/monitoring/dashboards and https://docs.cloud.google.com/monitoring/alerts/using-alerting-ui'
		),
		try: [
			{
				label: 'An alert that needs a duration, and a percentile',
				code: String.raw`// One CPU sample every 10 seconds. The alert fires only when the value stays above the threshold for N samples in a row.
const cpu = [0.02, 0.03, 0.09, 0.03, 0.02, 0.09, 0.11, 0.12, 0.1, 0.13, 0.11, 0.04];
function firstFiring(samples, threshold, needed) {
  let run = 0;
  for (let i = 0; i < samples.length; i++) {
    run = samples[i] > threshold ? run + 1 : 0;
    if (run >= needed) return i;
  }
  return -1;
}
console.log('no duration (1 sample):', firstFiring(cpu, 0.05, 1));
console.log('60 s duration (6 samples):', firstFiring(cpu, 0.05, 6));

// p95 of request latency in milliseconds, nearest-rank method.
const ms = [120, 80, 95, 300, 110, 90, 105, 2400, 100, 98];
const p = (arr, q) => [...arr].sort((a, b) => a - b)[Math.ceil(q * arr.length) - 1];
const mean = ms.reduce((a, b) => a + b, 0) / ms.length;
console.log('mean:', mean, 'p50:', p(ms, 0.5), 'p95:', p(ms, 0.95));
console.log('the mean hides the slow request that p95 shows');`
			}
		]
	},
	{
		id: 'gcp-secrets-and-security',
		title: 'Secrets, keys and Cloud Armor',
		level: 'basic',
		summary: 'Keep passwords out of code with Secret Manager, understand envelope encryption with Cloud KMS, and know what Cloud Armor and Organization Policy do.',
		scenes: ['gc-secret-versions', 'gc-kms-envelope', 'gc-armor-rules'],
		notes: md(
			'**Secret Manager** holds values such as the database password. A **secret** is the named container; each value is a **secret version**. Secret data is immutable: to change a value you add a new version. A version is enabled (readable), disabled (hidden but kept, can come back) or destroyed (gone for good). Access is IAM: the service reading the secret needs the Secret Manager Secret Accessor role.',
			'',
			'**Using a secret from Cloud Run.** As an **environment variable**, the value is fetched before an instance starts, so pin a specific version. As a **mounted file**, each read fetches the latest version, which suits rotation. Rotate secrets on a schedule, and never bake them into an image or a repository.',
			'',
			'**Cloud KMS and envelope encryption.** KMS manages keys, not your bulk data. You generate a **data encryption key (DEK)** locally, encrypt the data with it, then **wrap** the DEK with a **key encryption key (KEK)** that never leaves KMS, and store the wrapped DEK next to the data. A KEK protects many DEKs, and rotating it means re-wrapping DEKs, not re-encrypting data. Never store a plaintext DEK.',
			'',
			'**Cloud Armor** is a web application firewall and DDoS defence at the edge. Security policies (ordered rules, the highest-priority match wins) attach to the backend services behind a Google Cloud load balancer: preconfigured rules for common web attacks, allow and deny rules, and rate limiting (throttle or rate-based ban). Always-on L3/L4 DDoS protection is automatic; L7 floods need rules you configure.',
			'',
			'**Organization Policy** is a different control from IAM. IAM answers who can act; Organization Policy restricts what resources may be configured to do, set on an organization, folder or project and inherited downwards. A dry run logs violations without blocking.',
			'',
			'**Mistakes to avoid:** pinning nothing and discovering a bad version in production, and treating Cloud Armor as a fix for vulnerable code.'
		),
		try: [
			{
				label: 'Envelope encryption: one data key per object',
				code: String.raw`// TOY ONLY. XOR is not real encryption; it just makes the key hierarchy visible. Use Cloud KMS for real.
const toHex = (s) => [...s].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
const xor = (text, key) => [...text].map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('');
const kek = 'kek-v1-stays-in-kms';
let n = 0;
function seal(data) {
  const dek = 'dek-' + ++n;               // a fresh data key for every object
  return { cipher: xor(data, dek), wrapped: xor(dek, kek) };
}
function open(box) {
  const dek = xor(box.wrapped, kek);      // KMS unwraps the DEK with the KEK
  return xor(box.cipher, dek);
}
const a = seal('order 41, Asha, Pune');
const b = seal('order 42, Ben, Leeds');
console.log('stored for a:', toHex(a.cipher).slice(0, 24) + '...', toHex(a.wrapped));
console.log('round trip:', open(a), '|', open(b));
console.log('same plaintext, different ciphertext:', toHex(seal('same order data').cipher) !== toHex(seal('same order data').cipher));`
			},
			{
				label: 'Latest or pinned secret version',
				code: String.raw`// A secret is a name; each value is an immutable version. Choose how a service refers to it.
const secret = { name: 'db-password', versions: [
  { id: 1, state: 'destroyed', value: null },
  { id: 2, state: 'enabled', value: 'old-pass' },
  { id: 3, state: 'enabled', value: 'new-pass' },
] };
const resolve = (ref) => {
  const enabled = secret.versions.filter((v) => v.state === 'enabled');
  const v = ref === 'latest' ? enabled[enabled.length - 1] : enabled.find((x) => x.id === ref);
  return v ? v.value : '(no such enabled version)';
};
console.log('pinned 2 :', resolve(2));
console.log('latest   :', resolve('latest'));
secret.versions.push({ id: 4, state: 'enabled', value: 'rotated-pass' }); // rotation adds a version
console.log('after rotation, pinned 2:', resolve(2), '| latest:', resolve('latest'));`
			}
		]
	},
	{
		id: 'gcp-bigquery-console',
		title: 'BigQuery in the console',
		level: 'mid',
		summary: 'Take a guided tour of the BigQuery console: the sandbox, the Explorer, the query editor and validator, results, charts and job history.',
		scenes: ['gc-bq-sandbox', 'gc-bq-explorer', 'gc-bq-editor', 'gc-bq-results'],
		notes: md(
			'**BigQuery** is Google Cloud\'s data warehouse: you load or point it at data, write SQL, and it runs the query across many machines. For the store it answers questions the live database should not: revenue by week, which products are returned most.',
			'',
			'**The sandbox.** You can start with no credit card and no billing account: open BigQuery Studio, accept the terms, and create a project. The sandbox has limits (some features are unavailable and tables expire), and you can later turn on billing to upgrade.',
			'',
			'**The Explorer pane.** Data is organised as **project, dataset, table**. A dataset page shows its tables, models and routines. Public datasets live in the `bigquery-public-data` project: you can query them from your own project, and the job runs in yours. **Job history** has Personal history (your jobs) and Project history (recent jobs in the project).',
			'',
			'**The editor.** Open a query in a tab. A green check mark means the query is valid and shows how much data it will process, before you press **Run**; an exclamation point means an error. To read the schema of a table beside your SQL, open the table, click **Query**, then choose **In new tab** or **In split tab**.',
			'',
			'**Results.** Query results have tabs, including Job information (duration and data processed), Results and Visualization. A result with a geography column and a numeric column can be drawn as a map.',
			'',
			'**Habit to build:** glance at the data estimate every time. It is the cheapest cost control you have.',
			'',
			'Screenshots: Google Cloud documentation, CC BY 4.0, https://docs.cloud.google.com/bigquery/docs/quickstarts/query-public-dataset-console and https://docs.cloud.google.com/bigquery/docs/bigquery-web-ui'
		),
		try: [
			{
				label: 'Top stations by trips (the quickstart idea)',
				code: String.raw`// The quickstart groups Citi Bike trips by start station and returns the busiest stations. Same idea on a tiny array.
const trips = [
  'E 17 St & Broadway', 'W 21 St & 6 Ave', 'E 17 St & Broadway', 'Pershing Square North',
  'E 17 St & Broadway', 'W 21 St & 6 Ave', 'Broadway & E 14 St', 'E 17 St & Broadway', 'W 21 St & 6 Ave',
];
const counts = new Map();
for (const s of trips) counts.set(s, (counts.get(s) || 0) + 1);
const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3);
console.log('station'.padEnd(24), 'num_trips');
for (const [station, n] of top) console.log(station.padEnd(24), n);`
			}
		]
	},
	{
		id: 'gcp-bigquery-design',
		title: 'How BigQuery works and what it costs',
		level: 'advanced',
		summary: 'Understand columnar storage, why SELECT * is expensive, how partitioning and clustering prune data, and how dry runs and pricing models fit together.',
		scenes: ['gc-bq-columnar', 'gc-bq-pruning'],
		notes: md(
			'**Serverless, with storage and compute apart.** BigQuery has a storage layer that holds and optimises your data and a separate compute layer that runs queries. Each scales without affecting the other, so a table can grow without you sizing servers.',
			'',
			'**Columnar storage.** Data is stored column by column. A query reads only the columns it names, so `SELECT order_id, total` reads two columns, while `SELECT *` reads all of them, including the wide `notes` column you did not need. This is the biggest cost lever you control.',
			'',
			'**Two ways to pay for queries.** On-demand pricing is based on the data a query processes; capacity pricing is based on the compute (slots) you reserve. Pick by workload: spiky, occasional questions suit on-demand; steady heavy use suits capacity. Prices change, so check the pricing page rather than memorising numbers.',
			'',
			'**Pruning.** **Partitioning** splits a table by a date or integer column (or by ingestion time); a query that filters on that column scans only the matching partitions and skips the rest. **Clustering** sorts data within blocks by up to four columns, and filters on them skip blocks. Column order matters, so filter on the first clustered column first. A `LIMIT` does not reduce the data read on an unclustered table.',
			'',
			'**Guard rails.** A **dry run** estimates the bytes a query would process without running it (an upper bound). The **maximum bytes billed** setting makes a query fail, without charge, if its estimate exceeds your limit. Previewing a table in the console is free.',
			'',
			'**Getting data in.** Batch load files from Cloud Storage (Avro, Parquet, ORC, CSV, JSON) or stream with the Storage Write API. For the store, export orders and events here for analysis instead of querying the production database.'
		),
		try: [
			{
				label: 'Bytes read: SELECT * versus two columns',
				code: String.raw`// Columnar storage: a query pays for the columns it reads. Toy sizes, in bytes per row.
const rows = 1000000;
const colBytes = { order_id: 8, customer_id: 8, total: 8, placed_at: 8, notes: 200 };
const read = (cols) => cols.reduce((sum, c) => sum + colBytes[c] * rows, 0);
const mb = (b) => (b / 1e6).toFixed(0) + ' MB';
console.log('SELECT *                  :', mb(read(Object.keys(colBytes))));
console.log('SELECT order_id, total    :', mb(read(['order_id', 'total'])));
console.log('saving by naming columns  :', Math.round((1 - read(['order_id', 'total']) / read(Object.keys(colBytes))) * 100) + '%');`
			},
			{
				label: 'Partition pruning, and LIMIT does not help',
				code: String.raw`// 30 daily partitions of an orders table. A filter on the partition column skips the others.
const days = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, mb: 100 + (i % 5) * 10 }));
const total = days.reduce((s, d) => s + d.mb, 0);
const scanned = (pred) => days.filter(pred).reduce((s, d) => s + d.mb, 0);
console.log('no filter            :', scanned(() => true), 'of', total, 'MB');
console.log('WHERE day = 12       :', scanned((d) => d.day === 12), 'MB');
console.log('WHERE day >= 24      :', scanned((d) => d.day >= 24), 'MB');
// LIMIT is applied to the result, after the data was read.
const limit10 = scanned(() => true);
console.log('no filter, LIMIT 10  :', limit10, 'MB (the same data is read)');`
			}
		]
	}
];

// ───────────────────────── quiz ─────────────────────────
const t = (topic: string) => builder('GC', topic);

// ── gcp-logging
const lg = t('gcp-logging');
lg.add('basic', 'where-stored',
	'In Google Cloud, where does Cloud Logging store a log entry by default?',
	'In a log bucket in the project where it was written',
	['In a Cloud Storage bucket that you must create for each service first',
	 'In a BigQuery dataset that exists in every new project already',
	 'Only in the memory of the service that wrote the entry, until it restarts'],
	'Each entry is stored in a log bucket belonging to the project, folder or organization where it originates. Cloud Storage, BigQuery and Pub/Sub are optional sink destinations, and nothing about logging depends on the writing service keeping the entry in memory.');
lg.add('basic', 'timeline',
	'In the Logs Explorer, what does the Timeline above the results show?',
	'A histogram of how many entries that match the query fall in each slice of time',
	['The latency of every request that reached the store, measured in milliseconds per page',
	 'Which people on the team have opened each entry, with the time they looked at it',
	 'The order in which the sinks processed each entry, from the first to the last'],
	'The Timeline is a histogram of matching entries over the chosen time range, which makes spikes easy to spot and lets you zoom into them. It is not a latency chart, an access record or a view of sink processing.');
lg.add('mid', 'sink-filters',
	'A sink has the inclusion filter severity >= ERROR and an exclusion filter for entries from the HTTP load balancer. Which entries are routed?',
	'Entries at ERROR or above, except those written by the load balancer',
	['Every entry from the load balancer, because exclusion filters only apply to the _Default sink',
	 'Entries below ERROR, because exclusion filters invert the inclusion filter',
	 'Nothing, because a sink can have either an inclusion filter or an exclusion filter, not both'],
	'An entry is routed when it matches the inclusion filter and matches none of the exclusion filters. A sink has one inclusion filter and can have several exclusion filters, and the rule is the same for the _Default sink and for sinks you create.');
lg.add('mid', 'metric-not-retroactive',
	'You create a log-based counter metric today for a filter that matched many entries last week. What does the metric count?',
	'Only entries received after the metric was created',
	['All matching entries from the last seven days, filled in automatically',
	 'Matching entries from the _Required bucket only',
	 'Nothing, until you also create an alerting policy that uses it'],
	'Log-based metrics are not retroactively populated: only entries that arrive after the metric exists are counted. The same is true of sinks. The metric works without an alerting policy; a policy is just one way to use it.');
lg.add('advanced', 'aggregate-errors',
	'You need the number of errors per hour for each service over the last week. Which tool fits best?',
	'Observability Analytics (once Log Analytics) on an upgraded bucket, using SQL',
	['The Logs Explorer alone, because it supports aggregate operations such as GROUP BY',
	 'A sink to the _Required bucket, which counts entries per severity automatically',
	 'An uptime check on each service, which records its error count'],
	'The Logs Explorer filters and browses but does not aggregate; Observability Analytics runs SQL (grouping and counting) over log views once the bucket is upgraded. The _Required bucket holds audit logs, and uptime checks probe URLs rather than count log errors.');

// ── gcp-monitoring-and-alerts
const mn = t('gcp-monitoring-and-alerts');
mn.add('basic', 'golden-signals',
	'Which set names the four golden signals of monitoring?',
	'Latency, traffic, errors and saturation',
	['CPU, memory, disk and network',
	 'Uptime, cost, security and speed',
	 'Requests, retries, restarts and rollbacks'],
	'The four golden signals from Google\'s SRE book are latency, traffic, errors and saturation. CPU, memory, disk and network are resources that feed saturation, but they are not the signals themselves.');
mn.add('basic', 'metrics-explorer',
	'What is Metrics Explorer used for?',
	'Building a temporary chart of any metric, then saving it to a dashboard or an alert',
	['Keeping metric data for much longer than the default retention period allows, at lower cost',
	 'Replaying a log bucket as if it were a set of metrics',
	 'Writing the service-level objectives for the store'],
	'Metrics Explorer is for exploring: choose a metric, filter, aggregate and group, then save the chart as a dashboard widget or an alerting policy. It does not extend retention, convert logs, or define SLOs.');
mn.add('mid', 'alert-duration',
	'An alerting policy fires when CPU is above 80%. Why add a retest window of five minutes?',
	'A brief spike does not alert: the condition has to hold for the whole window',
	['Monitoring then stores the metric for five minutes longer so that you can replay it later',
	 'Notifications are held back until the alert has been closed',
	 'The policy starts reading logs instead of metrics'],
	'A metric-threshold condition is met when values stay beyond the threshold for the retest window, which filters out short spikes that nobody needs to be woken for. It has no effect on retention, notification timing after closing, or the data source.');
mn.add('mid', 'uptime-notify',
	'What makes an uptime check actually notify someone when it fails?',
	'An alerting policy, with a notification channel, attached to the check',
	['The check itself emails the project owners on every failed probe',
	 'A log sink that routes every check result to a Pub/Sub topic that the team subscribes to',
	 'A dashboard widget that shows the check status'],
	'An uptime check only records whether probes from several regions succeeded; it notifies nobody by itself. You attach an alerting policy with one or more notification channels, and by default it waits for failures from at least two regions.');
mn.add('advanced', 'error-budget',
	'An SLO says 99.9% of requests must be good over a month. What is the error budget?',
	'The 0.1% of requests allowed to be bad that month',
	['The 99.9% of requests that have to succeed',
	 'The money reserved to pay for incident response',
	 'The number of alerts the on-call engineer may receive per day'],
	'The error budget is the allowed failure: (1 minus the goal) times the eligible events, here 0.1%. It shrinks as bad events occur, and below zero the SLO is violated. It is not the success share, a cash amount or an alert quota.');

// ── gcp-secrets-and-security
const sc = t('gcp-secrets-and-security');
sc.add('basic', 'new-version',
	'How do you change the value of a secret in Secret Manager?',
	'Add a new version, because the payload of an existing version cannot be changed',
	['Edit the payload of the current version in place',
	 'Delete the secret and create it again under the same name, then redeploy every service',
	 'Change the IAM role of the service that reads it'],
	'Secret data is immutable: versions are added, and old ones can be disabled or destroyed. Editing in place is not possible, recreating the secret is unnecessary, and an IAM role controls access rather than the value.');
sc.add('basic', 'env-var-timing',
	'A Cloud Run service reads a secret as an environment variable. When is the value fetched?',
	'Before an instance starts, so new instances can pick up a later version',
	['On every request, so a rotated secret takes effect straight away',
	 'Only once, when the service is first deployed, so later instances keep that value for good',
	 'Never, because environment variables cannot hold secrets'],
	'For an environment variable Cloud Run resolves the secret before the instance starts, which is why you pin a specific version instead of latest. A mounted file is different: each read fetches the latest version, which suits rotation.');
sc.add('mid', 'envelope',
	'In envelope encryption with Cloud KMS, what does the key stored in KMS encrypt?',
	'The data encryption key, which has encrypted the data',
	['The data itself, with one KMS call for every object',
	 'The IAM policy that guards the data',
	 'The wrapped key only after it has been written to Cloud Storage'],
	'The key encryption key in KMS wraps the data encryption key; the data is encrypted locally by the data key, and the wrapped key is stored beside it. That keeps bulk data out of KMS and lets one KEK protect many data keys.');
sc.add('mid', 'armor-attach',
	'Where does a Cloud Armor security policy normally attach?',
	'To a backend service behind a Google Cloud load balancer',
	['To an IAM role at the project level',
	 'To the Cloud DNS zone for the store\'s domain',
	 'To the container image of each Cloud Run service, as a layer added at build time'],
	'Security policies are ordered rules attached to the backend services of supported load balancers, so requests are filtered at the Google edge before they reach your service. DNS zones, IAM roles and images are not where WAF rules live.');
sc.add('advanced', 'orgpolicy-vs-iam',
	'How does Organization Policy differ from IAM?',
	'IAM controls who can act; Organization Policy limits what resources may be configured to do',
	['Organization Policy grants roles, while IAM only sets constraints',
	 'Organization Policy applies only to single projects, while IAM is inherited down the hierarchy',
	 'They are the same system, and Organization Policy is the older name for IAM'],
	'IAM answers who may do what; Organization Policy sets constraints on configuration, such as which regions or external IPs are allowed. Both are set on organizations, folders or projects and inherited downwards, and a dry run logs violations before enforcement.');

// ── gcp-bigquery-console
const bc = t('gcp-bigquery-console');
bc.add('basic', 'sandbox',
	'What does the BigQuery sandbox give you?',
	'A way to try BigQuery with no credit card or billing account, with limited features',
	['Unlimited free queries and storage, for as long as the project exists and without any expiry',
	 'Use of BigQuery without needing any Google account',
	 'Free streaming inserts into tables, with no expiry'],
	'The sandbox needs no billing account, but it is limited: some features such as streaming are unavailable and tables expire automatically. You still sign in with a Google account, and you can upgrade by turning on billing.');
bc.add('basic', 'validator',
	'In the BigQuery query editor, what does the green check mark tell you before you press Run?',
	'The query is valid, and it shows how much data the query will process',
	['The result is already cached and will cost nothing',
	 'The tables in the query are partitioned and clustered correctly for the filter you wrote',
	 'The query will finish in under a second'],
	'The validator checks the query as you type: a check mark means it is valid and shows the amount of data it will process, while an exclamation point shows an error. It says nothing about caching, partitioning or run time.');
bc.add('mid', 'breadcrumb',
	'A dataset page shows the path bigquery-public-data / Datasets / america_health_rankings. What is bigquery-public-data?',
	'The project that owns the dataset',
	['The table that is queried by default',
	 'The region where the dataset is stored',
	 'The billing account that pays for your queries'],
	'BigQuery organises data as project, dataset, table, and the first part of the breadcrumb is the owning project. Public datasets live in a project Google maintains; your own queries on them still run in your project.');
bc.add('mid', 'job-history',
	'What is the difference between Personal history and Project history under Job history?',
	'Personal lists your own jobs; Project lists recent jobs in the whole project',
	['Personal history shows queries you saved; Project history shows only failed jobs',
	 'Personal history is private to the dataset; Project history is private to the table',
	 'Personal history is for loading data; Project history is for queries'],
	'Job history has two views: your own jobs, and recent jobs of everyone in the project. Neither is limited to saved or failed jobs, and both cover every kind of job, not only loads or queries.');
bc.add('advanced', 'billing-project',
	'You query a table in bigquery-public-data from your own project. Which project does the query job belong to?',
	'Your own project, the one selected in the console when you ran it',
	['bigquery-public-data, because that is where the table lives',
	 'A temporary project that BigQuery creates automatically for each job and deletes later',
	 'The organization at the top of the resource hierarchy'],
	'A query job runs in the project you run it from, and that is where it appears in Job history; the table\'s owner does not matter. This is why read access to a public dataset is enough, and why the sandbox limits apply to your project.');

// ── gcp-bigquery-design
const bd = t('gcp-bigquery-design');
bd.add('mid', 'select-star',
	'Why does SELECT * usually cost more than selecting two columns in BigQuery?',
	'Storage is columnar, so it reads every column instead of only the two',
	['SELECT * switches off the query cache for the whole project',
	 'SELECT * always runs under capacity pricing instead of on-demand',
	 'SELECT * forces the whole table to be exported to Cloud Storage before it is read'],
	'BigQuery stores data column by column, so cost follows the columns a query reads. Naming only the columns you need is the simplest saving; the cache, the pricing model and exports are unrelated to the star.');
bd.add('advanced', 'limit',
	'You add LIMIT 10 to a query on a table that is not clustered. What happens to the amount of data read?',
	'It does not go down: LIMIT does not reduce the data read',
	['It drops to a tenth of the table, because only ten rows are needed',
	 'It drops to the first partition only',
	 'It becomes free, because small results are never charged'],
	'LIMIT is applied to the result, after the columns have been read, so on an unclustered table it does not reduce the data processed. Filtering on a partition column, selecting fewer columns or using clustering does.');
bd.add('advanced', 'partition-prune',
	'An orders table is partitioned by day. A query filters on a single day in that column. What does BigQuery do?',
	'It scans only the matching partition and skips the rest',
	['It scans the whole table and filters the rows afterwards',
	 'It scans every partition once, in parallel, and keeps the matching rows',
	 'It rebuilds the partitions before running the query'],
	'Filtering on the partitioning column lets BigQuery prune: only partitions that match are read, which reduces the bytes processed. A filter on some other column cannot prune partitions, and no rebuilding happens at query time.');
bd.add('advanced', 'dry-run',
	'What does a dry run of a query give you?',
	'An upper-bound estimate of the bytes it would process, without running it',
	['The result rows, without any charge',
	 'The exact bytes that will be billed after the cache is used',
	 'A list of the columns that you should cluster by to make the query cheaper next time'],
	'A dry run validates the query and estimates the bytes it would process, which can exceed the bytes actually billed. It returns no rows, and it does not account for the cache or give advice on clustering.');
bd.add('advanced', 'storage-compute',
	'What does separating storage from compute in BigQuery mean for the store?',
	'Each layer scales on its own, so data can grow without you sizing query servers',
	['Queries can only read data that was loaded in the same minute',
	 'The data must be copied to a compute cluster before each query',
	 'You pay for storage only while a query is running, and nothing when the data sits idle'],
	'BigQuery has a storage layer and a separate compute layer, each allocating resources without affecting the other, and it is serverless. Data is not copied per query, there is no same-minute restriction, and storage is held, not billed per query.');

export const banks: { out: Question[] }[] = [lg, mn, sc, bc, bd];
