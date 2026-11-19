import type { Scene, SceneNode, Tone } from '../../types';
import { consoleChrome, ring } from '../consoleKit';

/** Google Cloud compute, data and messaging lessons: Cloud Run, builds, GKE and VMs, functions, Cloud SQL, Memorystore, Firestore and Spanner, Pub/Sub, VPC. Ids `gc-*`; `group` = a topic id in src/db/gcp/compute.ts. */

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

const ILLUSTRATION = 'Illustration of the console layout, not a real screenshot';

export const gcCompute: Scene[] = [
	// ───────────── gcp-cloud-run ─────────────
	{
		id: 'gc-run-revisions',
		topic: 'gcp',
		group: 'gcp-cloud-run',
		title: 'Revisions and traffic in the console',
		blurb: 'How does Cloud Run route traffic between deployments?',
		stage: { w: 360, h: 236 },
		nodes: [
			...consoleChrome('r', { path: 'Google Cloud  >  Cloud Run  >  storefront-api', tabs: ['Metrics', 'Revisions', 'Logs', 'YAML'], active: 1, h: 186 }),
			{ id: 't', kind: 'table', x: 24, y: 70, colW: 104, cols: ['Revision', 'Traffic', 'Status'], rows: [['api-00007-qux', '100%', 'Ready']], visible: true },
			ring('rg', 128, 70, 104, 68),
			{ id: 'ill', kind: 'text', x: 180, y: 222, text: ILLUSTRATION, size: 'sm', anchor: 'middle', visible: true }
		],
		steps: [
			{ say: 'The Revisions tab lists every deployment of the service. Right now there is one revision, and it takes all the traffic.', focus: ['t'] },
			{ say: 'Deploying again creates revision 00008. A revision is a frozen copy of the code and its settings, so the old one is untouched.', set: { t: { rows: [['api-00008-zed', '0%', 'Ready'], ['api-00007-qux', '100%', 'Ready']], hl: [0] } } },
			{ say: 'Routing is a separate choice from deploying. Sending 5% to the new revision tries it on a few real shoppers first.', set: { t: { rows: [['api-00008-zed', '5%', 'Ready'], ['api-00007-qux', '95%', 'Ready']], hl: [0] } } },
			{ say: 'The Traffic column must add up to 100%. Cloud Run splits incoming requests by these percentages.', show: ['rg'], focus: ['rg'] },
			{ say: 'If errors rise, a rollback is one change: send 100% back to the older revision. It takes effect at once.', hide: ['rg'], set: { t: { rows: [['api-00008-zed', '0%', 'Ready'], ['api-00007-qux', '100%', 'Ready']], hl: [1] } } },
			{ say: 'A revision with 0% traffic stays in the list until you delete it, so rolling forward again is just another traffic change.', set: { t: { rows: [['api-00009-kiw', '0%', 'Ready'], ['api-00008-zed', '0%', 'Ready'], ['api-00007-qux', '100%', 'Ready']], hl: [2] } } }
		]
	},
	{
		id: 'gc-run-scaling',
		topic: 'gcp',
		group: 'gcp-cloud-run',
		title: 'Scale to zero and cold starts',
		blurb: 'What happens when requests arrive at a Cloud Run service that is idle?',
		stage: { w: 360, h: 280 },
		nodes: [
			{ id: 'users', kind: 'box', x: 16, y: 20, w: 150, h: 44, label: 'Shoppers', sub: 'requests', visible: true },
			{ id: 'svc', kind: 'box', x: 16, y: 110, w: 150, h: 56, label: 'Cloud Run service', sub: '0 instances', visible: true },
			{ id: 'e1', kind: 'edge', from: 'users', to: 'svc' },
			{ id: 'i1', kind: 'box', x: 200, y: 20, w: 144, h: 44, label: 'Instance 1', sub: 'container starting', tone: 'warn' },
			{ id: 'i2', kind: 'box', x: 200, y: 82, w: 144, h: 44, label: 'Instance 2', sub: 'second copy' },
			{ id: 'e2', kind: 'edge', from: 'svc', to: 'i1' },
			{ id: 'e3', kind: 'edge', from: 'svc', to: 'i2' },
			{ id: 'cfg', kind: 'doc', x: 16, y: 206, w: 328, title: 'Settings', lines: ['minimum instances: 0', 'concurrency: 80 requests per instance'], hl: [], visible: true }
		],
		steps: [
			{ say: 'With no traffic and the minimum at 0, the service runs zero instances. Under request-based billing, idle time is not billed.', focus: ['svc'] },
			{ say: 'The first request arrives. No instance is running, so Cloud Run has to start one.', show: ['e1'], set: { users: { tone: 'accent' } } },
			{ say: 'Booting the container is the cold start. That first shopper waits a little longer while it happens.', show: ['i1', 'e2'], set: { svc: { sub: '1 instance' } }, focus: ['i1'] },
			{ say: 'Once ready, the instance serves many requests at the same time, up to the concurrency setting. Later requests are fast.', set: { i1: { tone: 'accent', sub: 'ready, serving' }, cfg: { hl: [1] } }, pulse: ['i1'] },
			{ say: 'Traffic grows past what one instance can handle, so Cloud Run adds another. Higher concurrency means fewer instances for the same load.', show: ['i2', 'e3'], set: { svc: { sub: '2 instances' }, i2: { tone: 'accent', sub: 'ready, serving' } } },
			{ say: 'When traffic stops, instances are removed and the service returns to zero. A cold start waits again for the next visitor.', hide: ['i1', 'i2', 'e2', 'e3'], set: { svc: { sub: '0 instances' }, users: { tone: 'neutral' }, cfg: { hl: [] } } },
			{ say: 'Setting minimum instances above 0 keeps containers warm, so the first request is not a cold start. The warm instances are billed.', set: { cfg: { hl: [0], lines: ['minimum instances: 1', 'concurrency: 80 requests per instance'] }, svc: { sub: '1 warm instance' } }, pulse: ['cfg'] }
		]
	},
	{
		id: 'gc-run-job-vs-service',
		topic: 'gcp',
		group: 'gcp-cloud-run',
		title: 'A service versus a job',
		blurb: 'When do you run a Cloud Run job instead of a service?',
		stage: { w: 360, h: 296 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				cols: ['', 'Service', 'Job'],
				rows: [
					['Starts when', 'a request comes', 'you run it'],
					['Ends when', 'scaled to zero', 'all tasks end'],
					['Serves HTTP', 'yes', 'no'],
					['Fits', 'product API', 'order export']
				],
				hl: [],
				visible: true
			},
			{ id: 'job', kind: 'box', x: 110, y: 150, w: 140, h: 40, label: 'Job: order-export', sub: '3 tasks' },
			{ id: 'k0', kind: 'box', x: 16, y: 232, w: 104, h: 44, label: 'Task 0', sub: 'orders A to F' },
			{ id: 'k1', kind: 'box', x: 128, y: 232, w: 104, h: 44, label: 'Task 1', sub: 'orders G to M' },
			{ id: 'k2', kind: 'box', x: 240, y: 232, w: 104, h: 44, label: 'Task 2', sub: 'orders N to Z' },
			{ id: 'je0', kind: 'edge', from: 'job', to: 'k0' },
			{ id: 'je1', kind: 'edge', from: 'job', to: 'k1' },
			{ id: 'je2', kind: 'edge', from: 'job', to: 'k2' }
		],
		steps: [
			{ say: 'A service waits for web requests. A job runs to the end and stops, and nothing calls it over HTTP.', focus: ['t'] },
			{ say: 'A service starts when a request arrives and scales down when idle. A job starts when you run it and ends when every task is done.', set: { t: { hl: [0, 1] } } },
			{ say: 'Use a service for the product API. Use a job for a nightly order export or a database migration.', set: { t: { hl: [2, 3] } } },
			{ say: 'A job can split its work into tasks, up to 10,000, and run them in parallel.', show: ['job'], focus: ['job'] },
			{ say: 'Each task is its own container instance. It reads its index from an environment variable and handles only its slice of the data.', show: ['k0', 'k1', 'k2', 'je0', 'je1', 'je2'] },
			{ say: 'If a task fails, Cloud Run retries it, up to 3 times by default. A task that runs out of retries fails the whole execution.', set: { k1: { tone: 'neg', sub: 'failed, retrying' } }, pulse: ['k1'] },
			{ say: 'The retry succeeds and the job finishes. Make each task safe to run twice, because retries repeat work.', set: { k1: { tone: 'accent', sub: 'done on retry 1' }, job: { tone: 'accent', sub: 'complete' } } }
		]
	},

	// ───────────── gcp-artifact-and-build ─────────────
	{
		id: 'gc-build-pipeline',
		topic: 'gcp',
		group: 'gcp-artifact-and-build',
		title: 'From a commit to a running revision',
		blurb: 'What happens between git push and a new Cloud Run revision?',
		stage: { w: 360, h: 340 },
		nodes: [
			...stack(
				'b',
				[
					{ l: 'Git push', s: 'commit to the main branch' },
					{ l: 'Cloud Build trigger', s: 'matches the branch' },
					{ l: 'Build and test', s: 'steps from cloudbuild.yaml' },
					{ l: 'Artifact Registry', s: 'image stored, has a digest' },
					{ l: 'Cloud Run revision', s: 'deployed, then given traffic' }
				],
				{ gap: 24 }
			),
			{ id: 'n1', kind: 'text', x: 232, y: 82, w: 110, text: 'Also starts on a tag, a pull request or a click.', size: 'sm' },
			{ id: 'n2', kind: 'text', x: 232, y: 150, w: 110, text: 'Runs as the trigger\'s own service account.', size: 'sm' },
			{ id: 'n3', kind: 'text', x: 232, y: 218, w: 110, text: 'Repository lives in one region.', size: 'sm' },
			{ id: 'n4', kind: 'text', x: 232, y: 286, w: 110, text: 'Old revisions stay for rollback.', size: 'sm' }
		],
		steps: [
			{ say: 'A developer pushes a commit to the main branch. Nothing is built on the laptop; the build happens in the cloud.', focus: ['b0'] },
			{ say: 'A Cloud Build trigger is watching that branch. A push, a new tag, a pull request or a manual run can all start one.', show: ['b1', 'be0', 'n1'] },
			{ say: 'The trigger runs the build file: install, test, and build the container image. It runs as the service account named on the trigger.', show: ['b2', 'be1', 'n2'] },
			{ say: 'The finished image is pushed to a repository in Artifact Registry. Each image version gets a digest, a fingerprint of its exact bytes.', show: ['b3', 'be2', 'n3'] },
			{ say: 'A last build step deploys the image to Cloud Run. That creates a new revision, which then receives traffic.', show: ['b4', 'be3', 'n4'], set: { b4: { tone: 'accent' } } },
			{ say: 'Every step is automatic and repeatable, so what runs in production always came from a commit that passed the build.', pulse: ['b4'] }
		]
	},
	{
		id: 'gc-tag-vs-digest',
		topic: 'gcp',
		group: 'gcp-artifact-and-build',
		title: 'Tags move, digests do not',
		blurb: 'Why pin production deploys to a digest?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 't', kind: 'table', x: 16, y: 14, colW: 164, title: 'Registry (digests are shortened here)', cols: ['Tag', 'Points to'], rows: [['latest', 'sha256:a1f3']], hl: [0], visible: true },
			{ id: 'dA', kind: 'box', x: 16, y: 140, w: 156, h: 56, label: 'Deploy by tag', sub: 'runs: latest' },
			{ id: 'dB', kind: 'box', x: 188, y: 140, w: 156, h: 56, label: 'Deploy by digest', sub: 'runs: sha256:a1f3' },
			{ id: 'txt', kind: 'text', x: 16, y: 232, w: 328, text: 'Both start on Monday and run version 1.', size: 'sm' }
		],
		steps: [
			{ say: 'Version 1 is pushed with the tag latest. Its digest is a fingerprint of exactly these bytes. Change one byte and the digest changes.', focus: ['t'] },
			{ say: 'On Monday, one deploy uses the tag and another uses the digest. Both run version 1.', show: ['dA', 'dB', 'txt'], set: { dA: { sub: 'latest = sha256:a1f3' } } },
			{ say: 'On Tuesday version 2 is pushed with the same tag. The tag moves to the new image; version 1 stays in the registry, untagged.', set: { t: { rows: [['latest', 'sha256:b7c2'], ['(no tag)', 'sha256:a1f3']], hl: [0] }, txt: { text: 'Tuesday: version 2 is pushed and takes the tag.' } } },
			{ say: 'A redeploy by tag now runs version 2, even though nobody chose to change what runs in production.', set: { dA: { tone: 'warn', sub: 'latest = sha256:b7c2' } }, pulse: ['dA'] },
			{ say: 'A deploy by digest still runs version 1. To run version 2, you change the digest on purpose.', set: { dB: { tone: 'accent' } }, pulse: ['dB'] },
			{ say: 'Use tags to find images and digests to pin them. A rollback by digest returns the identical bytes.', set: { t: { hl: [1] }, txt: { text: 'Rolling back by digest restores exactly version 1.' } } }
		]
	},

	// ───────────── gcp-gke-and-compute-engine ─────────────
	{
		id: 'gc-mig-autohealing',
		topic: 'gcp',
		group: 'gcp-gke-and-compute-engine',
		title: 'A managed instance group heals itself',
		blurb: 'How does a group of VMs replace one that stops working?',
		stage: { w: 360, h: 306 },
		nodes: [
			{ id: 'tpl', kind: 'box', x: 16, y: 14, w: 328, h: 40, label: 'Instance template', sub: 'machine type, image, start-up script', visible: true },
			{ id: 'mig', kind: 'box', x: 16, y: 84, w: 328, h: 40, label: 'Managed instance group', sub: 'keeps 3 identical VMs running' },
			{ id: 'v0', kind: 'box', x: 16, y: 168, w: 100, h: 44, label: 'VM 1', sub: 'healthy' },
			{ id: 'v1', kind: 'box', x: 130, y: 168, w: 100, h: 44, label: 'VM 2', sub: 'healthy' },
			{ id: 'v2', kind: 'box', x: 244, y: 168, w: 100, h: 44, label: 'VM 3', sub: 'healthy' },
			{ id: 'e0', kind: 'edge', from: 'tpl', to: 'mig' },
			{ id: 'e1', kind: 'edge', from: 'mig', to: 'v0' },
			{ id: 'e2', kind: 'edge', from: 'mig', to: 'v1' },
			{ id: 'e3', kind: 'edge', from: 'mig', to: 'v2' },
			{ id: 'hc', kind: 'box', x: 100, y: 246, w: 160, h: 54, label: 'Health check', sub: 'asks each VM: do you answer?' }
		],
		steps: [
			{ say: 'An instance template records how to build a VM: the machine type, the image and the start-up script.', focus: ['tpl'] },
			{ say: 'A managed instance group uses the template to keep a set number of identical VMs running.', show: ['mig', 'e0'] },
			{ say: 'Three VMs run, all built from the same template. A load balancer in front would spread shoppers across them.', show: ['v0', 'v1', 'v2', 'e1', 'e2', 'e3'] },
			{ say: 'A health check asks each VM whether the application answers. That is how the group knows a VM is sick.', show: ['hc'], focus: ['hc'] },
			{ say: 'VM 2 stops answering. Its process crashed, but the VM itself is still running, so a plain uptime check would not notice.', set: { v1: { tone: 'neg', sub: 'check failed' } }, pulse: ['v1'] },
			{ say: 'Autohealing recreates the VM from the template. The group is back to three healthy VMs without anyone being paged.', set: { v1: { tone: 'accent', label: 'VM 4', sub: 'recreated' } } },
			{ say: 'Autoscaling and rolling updates use the same template: change it and the group replaces VMs gradually.', set: { tpl: { tone: 'accent' } }, pulse: ['tpl'] }
		]
	},
	{
		id: 'gc-gke-modes',
		topic: 'gcp',
		group: 'gcp-gke-and-compute-engine',
		title: 'GKE Autopilot or Standard',
		blurb: 'Who manages the nodes in each GKE mode?',
		stage: { w: 360, h: 250 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				cols: ['', 'Autopilot', 'Standard'],
				rows: [
					['Nodes', 'GKE manages', 'you manage'],
					['Node pools', 'not exposed', 'you configure'],
					['Privileged Pods', 'blocked', 'allowed'],
					['Pick it for', 'most workloads', 'node control']
				],
				hl: [],
				visible: true
			},
			{ id: 'rule', kind: 'box', x: 16, y: 160, w: 328, h: 56, label: 'Start with Autopilot', sub: 'Move to Standard only for node-level control or privileged settings' }
		],
		steps: [
			{ say: 'GKE is managed Kubernetes, and it comes in two modes. They differ mainly in how much of the node layer you run yourself.', focus: ['t'] },
			{ say: 'In Autopilot, GKE manages the nodes and their scaling. In Standard, you do.', set: { t: { hl: [0] } } },
			{ say: 'Standard lets you configure your own node pools. Autopilot does not expose them, and provisions capacity from what your workloads ask for.', set: { t: { hl: [1] } } },
			{ say: 'Autopilot applies guardrails by default, such as blocking privileged Pods. Standard allows them when you need them.', set: { t: { hl: [2] } } },
			{ say: 'Google recommends Autopilot for most workloads, unless the application needs privileges or settings that Autopilot does not allow.', set: { t: { hl: [3] } }, show: ['rule'] },
			{ say: 'Before either: a stateless web API is often simpler on Cloud Run, which has no cluster to upgrade at all.', set: { rule: { tone: 'accent' } }, pulse: ['rule'] }
		]
	},

	// ───────────── gcp-functions-and-gateway ─────────────
	{
		id: 'gc-functions-event',
		topic: 'gcp',
		group: 'gcp-functions-and-gateway',
		title: 'An upload triggers a function',
		blurb: 'How does a file landing in a bucket start some code?',
		stage: { w: 360, h: 372 },
		nodes: [
			...stack(
				'f',
				[
					{ l: 'Bucket: product-images', s: 'merchant uploads a photo' },
					{ l: 'Eventarc', s: 'routes the event' },
					{ l: 'Cloud Run function', s: 'make-thumbnail' },
					{ l: 'Bucket: thumbnails', s: 'the small copy' }
				],
				{ gap: 26 }
			),
			{ id: 'ev', kind: 'doc', x: 16, y: 284, w: 328, title: 'The event (a CloudEvents message)', lines: ['event: an object was uploaded', 'bucket: product-images', 'name: shoes/front.jpg'] }
		],
		steps: [
			{ say: 'A merchant uploads shoes/front.jpg to the product-images bucket. Nothing is polling the bucket to notice it.', focus: ['f0'] },
			{ say: 'Eventarc sees the new object and turns it into an event.', show: ['f1', 'fe0'] },
			{ say: 'The event is a small CloudEvents message: what happened, which bucket, which file. The image itself is not inside it.', show: ['ev'], set: { ev: { hl: [0] } } },
			{ say: 'Eventarc calls the function, which runs as a Cloud Run service. If nothing is uploaded, nothing runs.', show: ['f2', 'fe1'], set: { ev: { hl: [] } } },
			{ say: 'The function reads the original, resizes it, and writes a thumbnail to a second bucket.', show: ['f3', 'fe2'], set: { f3: { tone: 'accent' } } },
			{ say: 'Write the output to a different bucket. Writing back into the trigger bucket would fire the function again, in a loop.', set: { ev: { hl: [1] } }, pulse: ['f3'] }
		]
	},
	{
		id: 'gc-gateway-auth',
		topic: 'gcp',
		group: 'gcp-functions-and-gateway',
		title: 'A gateway in front of a private backend',
		blurb: 'How can a backend stay private and still serve an app?',
		stage: { w: 360, h: 270 },
		nodes: [
			...stack(
				'g',
				[
					{ l: 'Mobile app', s: 'sends an API key or ID token' },
					{ l: 'API Gateway', s: 'described by an OpenAPI file' },
					{ l: 'Cloud Run: orders-api', s: 'private, not public' }
				],
				{ gap: 32 }
			),
			{ id: 'x', kind: 'box', x: 262, y: 158, w: 82, h: 44, label: 'Direct call', sub: 'no role', tone: 'neg' },
			{ id: 'xe', kind: 'edge', from: 'x', to: 'g2', label: 'denied', tone: 'neg', dashed: true },
			{ id: 'note', kind: 'text', x: 16, y: 252, w: 328, text: 'The gateway signs backend calls with its backend service account.', size: 'sm' }
		],
		steps: [
			{ say: 'The mobile app calls one address, the gateway, and never the backend service directly.', focus: ['g0'] },
			{ say: 'The gateway checks the credential the app sent, such as an API key or a Google ID token, as the OpenAPI file says.', show: ['g1', 'ge0'] },
			{ say: 'Allowed requests are forwarded to the backend. The gateway signs that call using the backend service account on its API config.', show: ['g2', 'ge1', 'note'] },
			{ say: 'The backend is private. It accepts the call because that service account may invoke it, which the Cloud Run Invoker role grants.', set: { g2: { tone: 'accent', sub: 'private, invoker role granted' } }, pulse: ['g2'] },
			{ say: 'Anyone calling the backend directly has no permission, so Cloud Run refuses the request.', show: ['x', 'xe'] },
			{ say: 'The gateway decides who is a valid caller. Your own code still decides what each caller is allowed to do.', focus: ['g1'] }
		]
	},

	// ───────────── gcp-cloud-sql ─────────────
	{
		id: 'gc-sql-ha',
		topic: 'gcp',
		group: 'gcp-cloud-sql',
		title: 'High availability and a read replica',
		blurb: 'What do a standby and a read replica each do for Cloud SQL?',
		stage: { w: 360, h: 316 },
		nodes: [
			{ id: 'app', kind: 'box', x: 110, y: 14, w: 140, h: 40, label: 'Cloud Run', sub: 'storefront-api', visible: true },
			{ id: 'pri', kind: 'db', x: 24, y: 116, w: 120, h: 52, label: 'Primary', sub: 'zone A' },
			{ id: 'stb', kind: 'db', x: 216, y: 116, w: 120, h: 52, label: 'Standby', sub: 'zone B' },
			{ id: 'e0', kind: 'edge', from: 'app', to: 'pri', label: 'writes' },
			{ id: 'e1', kind: 'edge', from: 'pri', to: 'stb', label: 'sync' },
			{ id: 'e2', kind: 'edge', from: 'app', to: 'stb', tone: 'accent' },
			{ id: 'rep', kind: 'db', x: 120, y: 244, w: 120, h: 52, label: 'Read replica', sub: 'lags a little' },
			{ id: 'e3', kind: 'edge', from: 'stb', to: 'rep', label: 'async', dashed: true }
		],
		steps: [
			{ say: 'In a high availability instance the app uses one address. Behind it sits a primary database in one zone.', show: ['pri', 'e0'] },
			{ say: 'A standby waits in another zone of the same region. Every write is copied to both zones before it is confirmed.', show: ['stb', 'e1'], set: { stb: { tone: 'accent' } } },
			{ say: 'Now the primary, or its whole zone, fails.', set: { pri: { tone: 'neg', sub: 'failed' } }, pulse: ['pri'] },
			{ say: 'Cloud SQL promotes the standby and sends clients to it through the same address. Expect about a minute without service.', hide: ['pri', 'e0', 'e1'], show: ['e2'], set: { stb: { label: 'New primary', sub: 'zone B' } } },
			{ say: 'A read replica is different. It is fed asynchronously, can lag behind, and is promoted by hand if you need it.', show: ['rep', 'e3'] },
			{ say: 'Use HA for uptime and replicas for read load. A replica adds capacity, not automatic failover. Many stores need both.', set: { rep: { tone: 'accent' } }, pulse: ['rep'] }
		]
	},
	{
		id: 'gc-sql-console',
		topic: 'gcp',
		group: 'gcp-cloud-sql',
		title: 'Reading a Cloud SQL instance page',
		blurb: 'Which facts about an instance does its Overview page show?',
		stage: { w: 360, h: 292 },
		nodes: [
			...consoleChrome('s', { path: 'Google Cloud  >  SQL  >  store-db', tabs: ['Overview', 'Connections', 'Backups'], active: 0, h: 252 }),
			{
				id: 'd',
				kind: 'doc',
				x: 24,
				y: 70,
				w: 312,
				lines: ['Instance ID     store-db', 'Database        PostgreSQL', 'Region          us-central1', 'Availability    High availability', 'Connection      proj:us-central1:store-db'],
				hl: [],
				visible: true
			},
			{ id: 'd2', kind: 'doc', x: 24, y: 176, w: 312, lines: ['Private IP: on', 'Public IP: off', 'Allowlisted networks: none'], hl: [] },
			ring('rg', 28, 124, 304, 18),
			ring('rc', 28, 140, 304, 18),
			{ id: 'ill', kind: 'text', x: 180, y: 276, text: ILLUSTRATION, size: 'sm', anchor: 'middle', visible: true }
		],
		steps: [
			{ say: 'The Overview page of a Cloud SQL instance says who it is: its name, the database engine and the region it runs in.', set: { d: { hl: [0, 1, 2] } } },
			{ say: 'Availability shows whether the instance is regional (high availability) or sits in a single zone. A production store should be regional.', set: { d: { hl: [3] } }, show: ['rg'] },
			{ say: 'The connection name, project:region:instance, is how Cloud Run and the Auth Proxy find this instance.', set: { d: { hl: [4] } }, hide: ['rg'], show: ['rc'] },
			{ say: 'The Connections page is where private IP is chosen. Prefer private IP and the Auth Proxy to allowlisting public addresses.', hide: ['rc'], set: { d: { hl: [] }, st0: { tone: 'neutral' }, st1: { tone: 'accent' } }, show: ['d2'] },
			{ say: 'The Backups page shows the last successful backup. Point-in-time recovery needs one, and it restores to a new instance.', set: { st1: { tone: 'neutral' }, st2: { tone: 'accent' }, d2: { lines: ['Automated backups: on', 'Last backup: successful', 'Point-in-time recovery: on'], hl: [2] } } },
			{ say: 'Each page answers one question: who is it, how does it connect, and can we recover it?', set: { d2: { hl: [] } }, pulse: ['d2'] }
		]
	},

	// ───────────── gcp-memorystore ─────────────
	{
		id: 'gc-cache-aside',
		topic: 'gcp',
		group: 'gcp-memorystore',
		title: 'Reaching the cache, then using it',
		blurb: 'How does Cloud Run reach Memorystore, and what is cache-aside?',
		stage: { w: 360, h: 276 },
		nodes: [
			{ id: 'app', kind: 'box', x: 16, y: 14, w: 150, h: 44, label: 'Cloud Run', sub: 'storefront-api', visible: true },
			{ id: 'egr', kind: 'box', x: 16, y: 96, w: 150, h: 44, label: 'Direct VPC egress', sub: 'private IPs in a subnet' },
			{ id: 'cache', kind: 'db', x: 16, y: 186, w: 150, h: 52, label: 'Memorystore', sub: 'private IP only' },
			{ id: 'sql', kind: 'db', x: 204, y: 186, w: 140, h: 52, label: 'Cloud SQL', sub: 'source of truth' },
			{ id: 'e0', kind: 'edge', from: 'app', to: 'egr' },
			{ id: 'e1', kind: 'edge', from: 'egr', to: 'cache' },
			{ id: 'e2', kind: 'edge', from: 'egr', to: 'sql' }
		],
		steps: [
			{ say: 'A product page asks the cache first. Memorystore has only a private IP inside your VPC network, which Cloud Run does not sit in.', focus: ['app'] },
			{ say: 'Direct VPC egress gives each Cloud Run instance a private address from a subnet, so its traffic can enter the VPC.', show: ['egr', 'e0'] },
			{ say: 'The request for product:42 reaches the cache. The first time, nothing is stored under that key: a miss.', show: ['cache', 'e1'], set: { cache: { tone: 'warn', sub: 'miss' } } },
			{ say: 'On a miss, the app reads the database. The database stays the source of truth.', show: ['sql', 'e2'], pulse: ['sql'] },
			{ say: 'The app writes the value into the cache with a time to live, then answers. The TTL is the safety net against stale data.', set: { cache: { tone: 'accent', sub: 'stored, 5 minute TTL' } }, pulse: ['cache'] },
			{ say: 'The next shopper gets a hit with no database work. If the key is ever evicted, the app simply rebuilds it.', hide: ['sql', 'e2'], set: { cache: { sub: 'hit' } }, pulse: ['cache'] }
		]
	},

	// ───────────── gcp-firestore-and-spanner ─────────────
	{
		id: 'gc-store-data-fit',
		topic: 'gcp',
		group: 'gcp-firestore-and-spanner',
		title: 'Which database for which data?',
		blurb: 'How does a store split its data across Google Cloud databases?',
		stage: { w: 360, h: 230 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				cols: ['Data', 'Fits', 'Because'],
				rows: [
					['Carts, sessions', 'Firestore', 'read by key'],
					['Orders, payments', 'Cloud SQL', 'joins, ACID'],
					['Global stock', 'Spanner', 'global scale'],
					['Sales reports', 'BigQuery', 'big scans']
				],
				hl: [],
				visible: true
			},
			{ id: 'warn', kind: 'box', x: 16, y: 160, w: 328, h: 50, label: 'Spanner "to be safe" is a trap', sub: 'One regional Cloud SQL instance is simpler until it runs out of room' }
		],
		steps: [
			{ say: 'A store holds data of different shapes. Each Google Cloud database is built for one shape.', focus: ['t'] },
			{ say: 'Carts, sessions and profiles are read and written by key as small documents. Firestore fits and needs no capacity planning.', set: { t: { hl: [0] } } },
			{ say: 'Orders and payments need joins, constraints and transactions across tables. Cloud SQL is the familiar default.', set: { t: { hl: [1] } } },
			{ say: 'Stock that must stay consistent across continents at huge scale justifies Spanner: relational, and it scales out.', set: { t: { hl: [2] } } },
			{ say: 'Reports that scan years of sales are analytics, not transactions. They belong in BigQuery.', set: { t: { hl: [3] } } },
			{ say: 'Pick the simplest database that fits. Spanner for a workload one regional Postgres handles adds complexity you do not need.', show: ['warn'], set: { t: { hl: [] }, warn: { tone: 'warn' } } }
		]
	},
	{
		id: 'gc-spanner-hotspot',
		topic: 'gcp',
		group: 'gcp-firestore-and-spanner',
		title: 'The Spanner key hotspot',
		blurb: 'Why should a busy Spanner table not use a growing order number as its key?',
		stage: { w: 360, h: 270 },
		nodes: [
			{ id: 'lbl', kind: 'text', x: 16, y: 34, w: 328, text: 'Table split by key range, one slice per server', size: 'sm', visible: true },
			{ id: 'b0', kind: 'box', x: 16, y: 56, w: 76, h: 56, label: 'Server 1', sub: 'keys 1 to 250', visible: true },
			{ id: 'b1', kind: 'box', x: 104, y: 56, w: 76, h: 56, label: 'Server 2', sub: 'keys 251 to 500', visible: true },
			{ id: 'b2', kind: 'box', x: 192, y: 56, w: 76, h: 56, label: 'Server 3', sub: 'keys 501 to 750', visible: true },
			{ id: 'b3', kind: 'box', x: 280, y: 56, w: 64, h: 56, label: 'Server 4', sub: 'keys 751+', visible: true },
			{ id: 'w0', kind: 'text', x: 54, y: 134, text: '0 writes', size: 'sm', anchor: 'middle', visible: true },
			{ id: 'w1', kind: 'text', x: 142, y: 134, text: '0 writes', size: 'sm', anchor: 'middle', visible: true },
			{ id: 'w2', kind: 'text', x: 230, y: 134, text: '0 writes', size: 'sm', anchor: 'middle', visible: true },
			{ id: 'w3', kind: 'text', x: 312, y: 134, text: '0 writes', size: 'sm', anchor: 'middle', visible: true },
			{ id: 'k', kind: 'doc', x: 16, y: 170, w: 328, title: 'Next order keys', lines: ['sequential: 1001, 1002, 1003 ...'], hl: [] },
			{ id: 'k2', kind: 'doc', x: 16, y: 170, w: 328, title: 'Next order keys', lines: ['random UUID v4: 9c1e..., 2b7a..., e04d... '], hl: [] }
		],
		steps: [
			{ say: 'Spanner splits a table by key range and spreads the slices over servers. Each server owns one slice of the keys.', focus: ['b0', 'b1', 'b2', 'b3'] },
			{ say: 'Order numbers 1001, 1002, 1003 always grow, so every new row belongs to the last slice.', show: ['k'], set: { k: { hl: [0] } } },
			{ say: 'One server takes every write while three sit idle. That is a hotspot, and adding servers does not help.', set: { b3: { tone: 'warn', sub: 'all new rows' }, w3: { text: '12 writes', tone: 'warn' } }, pulse: ['b3'] },
			{ say: 'Use a random UUID version 4 as the first part of the key instead, or a bit-reversed sequence for integers.', hide: ['k'], show: ['k2'], set: { k2: { hl: [0] } } },
			{ say: 'New rows now land across all four slices, so the load spreads and capacity scales with servers.', set: { b3: { tone: 'accent', sub: 'keys 751+' }, b0: { tone: 'accent' }, b1: { tone: 'accent' }, b2: { tone: 'accent' }, w0: { text: '3 writes' }, w1: { text: '3 writes' }, w2: { text: '3 writes' }, w3: { text: '3 writes', tone: 'neutral' } } },
			{ say: 'To read orders by time, keep the timestamp as a later key part or in an index. Do not lead with it.', set: { k2: { hl: [] } }, pulse: ['k2'] }
		]
	},

	// ───────────── gcp-pubsub-and-tasks ─────────────
	{
		id: 'gc-pubsub-flow',
		topic: 'gcp',
		group: 'gcp-pubsub-and-tasks',
		title: 'One message, many subscriptions',
		blurb: 'How does one published event reach several independent consumers?',
		stage: { w: 360, h: 316 },
		nodes: [
			{ id: 'pub', kind: 'box', x: 110, y: 14, w: 140, h: 40, label: 'Checkout', sub: 'publisher', visible: true },
			{ id: 'top', kind: 'box', x: 110, y: 90, w: 140, h: 40, label: 'order-placed', sub: 'topic', shape: 'pill' },
			{ id: 'sa', kind: 'box', x: 16, y: 170, w: 150, h: 44, label: 'email-sub', sub: 'push subscription' },
			{ id: 'sb', kind: 'box', x: 194, y: 170, w: 150, h: 44, label: 'stock-sub', sub: 'pull subscription' },
			{ id: 'ca', kind: 'box', x: 16, y: 262, w: 150, h: 44, label: 'Cloud Run: email', sub: 'gets an HTTP POST' },
			{ id: 'cb', kind: 'box', x: 194, y: 262, w: 150, h: 44, label: 'Stock worker', sub: 'asks for messages' },
			{ id: 'e0', kind: 'edge', from: 'pub', to: 'top' },
			{ id: 'e1', kind: 'edge', from: 'top', to: 'sa' },
			{ id: 'e2', kind: 'edge', from: 'top', to: 'sb' },
			{ id: 'e3', kind: 'edge', from: 'sa', to: 'ca', label: 'push' },
			{ id: 'e4', kind: 'edge', from: 'cb', to: 'sb', label: 'pull' }
		],
		steps: [
			{ say: 'Checkout publishes an order-placed message. It does not know, or care, who will read it.', focus: ['pub'] },
			{ say: 'The message goes to a topic, a named channel that holds it until the subscriptions have received it.', show: ['top', 'e0'] },
			{ say: 'Each subscription on the topic gets its own copy of every message, so consumers do not compete for them.', show: ['sa', 'sb', 'e1', 'e2'] },
			{ say: 'With a push subscription, Pub/Sub POSTs each message to an HTTPS endpoint, such as a Cloud Run service.', show: ['ca', 'e3'], set: { ca: { tone: 'accent' } } },
			{ say: 'With a pull subscription, the worker asks for messages when it has capacity, which suits steady background work.', show: ['cb', 'e4'], set: { cb: { tone: 'accent' } } },
			{ say: 'Adding a new consumer means adding a subscription. Checkout never changes, which is why teams decouple with Pub/Sub.', pulse: ['sa', 'sb'] }
		]
	},
	{
		id: 'gc-pubsub-ack',
		topic: 'gcp',
		group: 'gcp-pubsub-and-tasks',
		title: 'Ack deadline, redelivery, dead letters',
		blurb: 'What happens to a message a worker is too slow to acknowledge?',
		stage: { w: 360, h: 320 },
		nodes: [
			{ id: 'sub', kind: 'box', x: 16, y: 14, w: 140, h: 40, label: 'Subscription', sub: 'holds the message', visible: true },
			{ id: 'wk', kind: 'box', x: 204, y: 14, w: 140, h: 40, label: 'Worker', sub: 'job takes 25 s', visible: true },
			{ id: 'e0', kind: 'edge', from: 'sub', to: 'wk', label: 'deliver' },
			{
				id: 'log',
				kind: 'doc',
				x: 16,
				y: 90,
				w: 328,
				lines: ['attempt 1: delivered, ack deadline 10 s', 'no ack by 10 s, the worker is still busy', 'attempt 2: delivered again', 'and again, up to the maximum', 'attempt 5: max delivery attempts reached', 'moved to the dead-letter topic'],
				hl: [],
				visible: true
			},
			{ id: 'dlq', kind: 'box', x: 16, y: 252, w: 200, h: 44, label: 'Dead-letter topic', sub: 'inspect, fix, replay' },
			{ id: 'e1', kind: 'edge', from: 'log', to: 'dlq', label: 'after 5' }
		],
		steps: [
			{ say: 'A worker receives a message and has an acknowledgment deadline, 10 seconds by default, to confirm it handled it.', set: { log: { hl: [0] } }, show: ['e0'] },
			{ say: 'The job takes 25 seconds, so no acknowledgment arrives in time and the deadline passes.', set: { log: { hl: [1] }, wk: { tone: 'warn' } } },
			{ say: 'Pub/Sub delivers the same message again. Delivery is at least once, so duplicates are normal, not a fault.', set: { log: { hl: [2] } } },
			{ say: 'This repeats. Client libraries can extend the deadline while a worker is still busy, which avoids needless redelivery.', set: { log: { hl: [3] } } },
			{ say: 'A subscription has a maximum number of delivery attempts, 5 by default. When it is reached, the message is not retried further.', set: { log: { hl: [4] }, wk: { tone: 'neg' } } },
			{ say: 'It moves to the dead-letter topic, where a subscription of its own lets you inspect it. One bad message stops retrying forever.', show: ['dlq', 'e1'], set: { log: { hl: [5] }, dlq: { tone: 'accent' } } },
			{ say: 'Because duplicates happen, the consumer must be idempotent: handling the same order message twice must not charge the customer twice.', set: { wk: { tone: 'accent', sub: 'idempotent handler' } }, pulse: ['wk'] }
		]
	},
	{
		id: 'gc-tasks-vs-pubsub',
		topic: 'gcp',
		group: 'gcp-pubsub-and-tasks',
		title: 'Cloud Tasks or Pub/Sub?',
		blurb: 'When does an explicit queue with a rate limit beat a topic?',
		stage: { w: 360, h: 232 },
		nodes: [
			{
				id: 't',
				kind: 'table',
				x: 16,
				y: 14,
				colW: 108,
				cols: ['', 'Pub/Sub', 'Cloud Tasks'],
				rows: [
					['Sender', 'publishes event', 'creates a task'],
					['Knows target?', 'no', 'yes'],
					['Speed', 'as it arrives', 'your rate limit'],
					['Duplicates', 'you handle', 'task name stops'],
					['Best for', 'fan-out', 'protect a target']
				],
				hl: [],
				visible: true
			},
			{ id: 'ex', kind: 'box', x: 16, y: 168, w: 328, h: 48, label: 'Payment provider allows 10 calls per second', sub: 'A queue with a rate limit keeps you under it' }
		],
		steps: [
			{ say: 'Both move work between services and retry on failure. They answer different questions.', focus: ['t'] },
			{ say: 'With Pub/Sub the publisher announces an event and knows nothing about who reads it. With Cloud Tasks your code creates each task for a specific target.', set: { t: { hl: [0, 1] } } },
			{ say: 'A Cloud Tasks queue dispatches at a configurable rate and can schedule a time. Pub/Sub delivers as soon as a subscriber is ready.', set: { t: { hl: [2] } } },
			{ say: 'A task name can stop duplicates for a while. With Pub/Sub you make the consumer idempotent yourself.', set: { t: { hl: [3] } } },
			{ say: 'Pub/Sub fits fan-out to many independent consumers. Cloud Tasks fits protecting one slow or rate-limited target.', set: { t: { hl: [4] } } },
			{ say: 'Calling a payment provider that limits you to 10 calls per second is a Cloud Tasks job: the queue paces the calls and retries failures.', show: ['ex'], set: { t: { hl: [] }, ex: { tone: 'accent' } } }
		]
	},

	// ───────────── gcp-vpc-networking ─────────────
	{
		id: 'gc-vpc-layout',
		topic: 'gcp',
		group: 'gcp-vpc-networking',
		title: 'A global network with regional subnets',
		blurb: 'What is global and what is regional in a VPC network?',
		stage: { w: 360, h: 222 },
		nodes: [
			{ id: 'win', kind: 'box', x: 12, y: 8, w: 336, h: 200, label: '', shape: 'panel', visible: true },
			{ id: 'ttl', kind: 'text', x: 24, y: 30, text: 'VPC network: store-net (global)', size: 'sm', visible: true },
			{ id: 'sa', kind: 'box', x: 28, y: 44, w: 146, h: 52, label: 'subnet-us', sub: 'us-central1 · 10.0.0.0/24' },
			{ id: 'sb', kind: 'box', x: 186, y: 44, w: 146, h: 52, label: 'subnet-eu', sub: 'europe-west1 · 10.1.0.0/24' },
			{ id: 'fw', kind: 'doc', x: 28, y: 126, w: 304, title: 'Firewall rules (belong to the network)', lines: ['allow tcp:443 from anywhere, priority 1000', 'implied: deny all ingress, lowest priority', 'implied: allow all egress, lowest priority'], hl: [] }
		],
		steps: [
			{ say: 'A VPC network is one private network for the whole project. It is a global resource, not tied to a single region.', focus: ['win'] },
			{ say: 'Inside it, each subnet belongs to one region and has its own IP range. Custom mode lets you choose the regions and ranges.', show: ['sa', 'sb'] },
			{ say: 'Firewall rules belong to the network and are enforced on each VM. Every network starts with two implied rules.', show: ['fw'] },
			{ say: 'Incoming traffic is denied and outgoing traffic is allowed, unless you add rules that say otherwise.', set: { fw: { hl: [1, 2] } } },
			{ say: 'Add an allow rule for just what you need, such as HTTPS to the web tier. Its priority must beat the implied deny.', set: { fw: { hl: [0] } } }
		]
	},
	{
		id: 'gc-vpc-egress-paths',
		topic: 'gcp',
		group: 'gcp-vpc-networking',
		title: 'Private paths out of Cloud Run',
		blurb: 'How does a serverless service reach private databases and the internet?',
		stage: { w: 360, h: 322 },
		nodes: [
			{ id: 'run', kind: 'box', x: 110, y: 14, w: 140, h: 40, label: 'Cloud Run', sub: 'storefront-api', visible: true },
			{ id: 'sub', kind: 'box', x: 110, y: 90, w: 140, h: 40, label: 'Subnet', sub: 'private IP addresses' },
			{ id: 'sql', kind: 'box', x: 16, y: 180, w: 150, h: 52, label: 'Cloud SQL', sub: 'private IP' },
			{ id: 'nat', kind: 'box', x: 194, y: 180, w: 150, h: 52, label: 'Cloud NAT', sub: 'outbound only' },
			{ id: 'net', kind: 'box', x: 194, y: 268, w: 150, h: 40, label: 'Payment provider', sub: 'on the internet' },
			{ id: 'e0', kind: 'edge', from: 'run', to: 'sub' },
			{ id: 'e1', kind: 'edge', from: 'sub', to: 'sql', label: 'peering' },
			{ id: 'e2', kind: 'edge', from: 'sub', to: 'nat' },
			{ id: 'e3', kind: 'edge', from: 'nat', to: 'net', label: 'NAT' }
		],
		steps: [
			{ say: 'Cloud Run runs outside your VPC network, so by default it cannot reach private IP addresses.', focus: ['run'] },
			{ say: 'Direct VPC egress gives each instance an address from a subnet you choose, so its traffic enters the VPC.', show: ['sub', 'e0'] },
			{ say: 'Cloud SQL with a private IP is reached through private services access: a peering with an IP range you allocated.', show: ['sql', 'e1'], set: { sql: { tone: 'accent' } } },
			{ say: 'Traffic to the internet leaves through Cloud NAT, which translates private addresses to outbound ones.', show: ['nat', 'e2'] },
			{ say: 'The payment provider sees the NAT address. Replies work, but nobody on the internet can start a connection to your instances.', show: ['net', 'e3'], set: { nat: { tone: 'accent' } } },
			{ say: 'The egress setting decides what enters the VPC: only private ranges, or all traffic. All traffic needs Cloud NAT for the internet path.', set: { sub: { tone: 'accent', sub: 'egress: private or all' } }, pulse: ['sub'] }
		]
	}
];
