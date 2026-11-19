import type { Scene, SceneNode } from '../types';
import { consoleChrome, ring } from './consoleKit';

/**
 * AWS console lessons: what to look at and click, and what it means. AWS documentation images are not openly licensed, so every
 * picture here is redrawn with the lesson engine and says so. Ids `aw-console-*`; `group` = a topic id in src/db/aws.ts.
 * Names of tabs, buttons, settings and states come from the AWS documentation; values in the tables are made-up examples.
 */

const NOTE = 'Illustration of the console layout, not a screenshot';
/** The small "this is an illustration" line under the window (window top y=8, height h). */
const note = (h: number): SceneNode => ({ id: 'note', kind: 'text', x: 180, y: 8 + h + 18, text: NOTE, size: 'sm', anchor: 'middle', visible: true });
const stage = (h: number) => ({ w: 360, h: 8 + h + 28 });

export const awsConsoleScenes: Scene[] = [
	// ───────────── s3-storage ─────────────
	{
		id: 'aw-console-s3-bpa',
		topic: 'aws',
		group: 's3-storage',
		title: 'Block Public Access in the S3 console',
		blurb: 'Which four switches stop a bucket from becoming public?',
		stage: stage(250),
		nodes: [
			...consoleChrome('b', { path: 'S3 > Buckets > shop-assets', tabs: ['Objects', 'Properties', 'Permissions'], active: 2, h: 250 }),
			{
				id: 't', kind: 'table', x: 24, y: 70, colW: 156, title: 'Block public access', cols: ['Setting', 'Effect when on'],
				rows: [['BlockPublicAcls', 'Rejects new public ACLs'], ['IgnorePublicAcls', 'Ignores public ACLs'], ['BlockPublicPolicy', 'Rejects public policies'], ['RestrictPublicBuckets', 'Limits a public policy']]
			},
			{ id: 'w', kind: 'box', x: 24, y: 206, w: 312, h: 40, label: 'Switching a setting off changes no policy or ACL, so the access they allow comes back.', tone: 'warn' },
			note(250)
		],
		steps: [
			{ say: 'Open a bucket in the S3 console and choose Permissions. Block Public Access has four independent settings, and AWS recommends turning all four on.', show: ['t'] },
			{ say: 'BlockPublicAcls: requests that try to attach a public ACL fail. ACLs that already exist are not changed.', set: { t: { hl: [0] } } },
			{ say: 'IgnorePublicAcls: S3 ignores any public ACL already on the bucket and its objects, without deleting it.', set: { t: { hl: [1] } } },
			{ say: 'BlockPublicPolicy: saving a bucket policy that would allow public access is rejected.', set: { t: { hl: [2] } } },
			{ say: 'RestrictPublicBuckets: a bucket whose policy is public is limited to AWS services and people in the bucket owner\'s own account.', set: { t: { hl: [3] } } },
			{ say: 'The settings override policies and ACLs without editing them. Turn one off and a public policy or ACL takes effect again.', set: { t: { hl: [] } }, show: ['w'], focus: ['w'] }
		]
	},

	// ───────────── s3-presigned-and-cors ─────────────
	{
		id: 'aw-console-s3-cors',
		topic: 'aws',
		group: 's3-presigned-and-cors',
		title: 'Where CORS lives, and how it fails',
		blurb: 'Where do you set CORS on a bucket, and what does a missing rule look like?',
		stage: stage(240),
		nodes: [
			...consoleChrome('c', { path: 'S3 > Buckets > shop-assets', tabs: ['Objects', 'Properties', 'Permissions'], active: 2, h: 240 }),
			{
				id: 'cors', kind: 'doc', x: 24, y: 70, w: 312, title: 'Cross-origin resource sharing (CORS) > Edit',
				lines: ['[', '  {', '    "AllowedOrigins": ["https://shop.test"],', '    "AllowedMethods": ["GET", "PUT"],', '    "AllowedHeaders": ["*"],', '    "MaxAgeSeconds": 3000', '  }', ']']
			},
			{
				id: 'err', kind: 'doc', x: 24, y: 70, w: 312, title: 'Browser console', tone: 'neg',
				lines: ['Access to fetch at \'https://shop-assets.s3...\'', 'from origin \'https://shop.test\' is blocked by', 'CORS policy: No \'Access-Control-Allow-Origin\'', 'header is present on the requested resource.']
			},
			ring('rg', 26, 124, 308, 18),
			note(240)
		],
		steps: [
			{ say: 'CORS is set on the bucket: choose Permissions, then Cross-origin resource sharing (CORS) and Edit. In the S3 console the rules are a JSON document.', show: ['cors'] },
			{ say: 'AllowedOrigins lists the page addresses that may call the bucket from a browser. Without your shop\'s origin here, uploads from the page fail.', show: ['rg'] },
			{ say: 'AllowedMethods lists the HTTP methods those pages may use. A presigned upload needs PUT and a download needs GET.', move: { rg: { x: 26, y: 140 } } },
			{ say: 'MaxAgeSeconds tells the browser how long it may reuse the preflight answer, so it does not ask before every single request.', move: { rg: { x: 26, y: 172 } } },
			{ say: 'With no matching rule the browser blocks the call and prints this in its console. The bucket and the URL are fine; the browser enforces the rule.', hide: ['cors', 'rg'], show: ['err'], focus: ['err'] },
			{ say: 'Fix: add the page origin to the rule, choose Save changes and retry. Only browsers enforce CORS, so curl never shows this error.', hide: ['err'], show: ['cors', 'rg'], move: { rg: { x: 26, y: 124 } }, pulse: ['rg'] }
		]
	},

	// ───────────── cloudfront-caching ─────────────
	{
		id: 'aw-console-cloudfront-behaviors',
		topic: 'aws',
		group: 'cloudfront-caching',
		title: 'CloudFront behaviors and invalidations',
		blurb: 'Which path pattern wins, and where do you clear the cache?',
		stage: stage(232),
		nodes: [
			...consoleChrome('f', { path: 'CloudFront > Distributions > E2ABC', tabs: ['Origins', 'Behaviors', 'Invalidations'], active: 1, h: 232 }),
			{ id: 't', kind: 'table', x: 24, y: 70, colW: 156, cols: ['Path pattern', 'Origin'], rows: [['/api/*', 'app-alb'], ['images/*', 'shop-assets'], ['Default (*)', 'shop-assets']] },
			{ id: 'w', kind: 'box', x: 24, y: 176, w: 312, h: 44, label: 'A looser behavior listed first wins, so a stricter rule below it never runs.', tone: 'warn' },
			{ id: 'inv', kind: 'doc', x: 24, y: 70, w: 312, title: 'Create invalidation: one path per line', lines: ['/index.html', '/images/logo.png', '/css/*', ''] },
			{ id: 'w2', kind: 'box', x: 24, y: 176, w: 312, h: 44, label: 'An invalidation cannot be cancelled once started. Versioned file names avoid needing one.', tone: 'warn' },
			note(232)
		],
		steps: [
			{ say: 'A distribution page has Origins, Behaviors and Invalidations tabs. A cache behavior says what CloudFront does for requests that match a path pattern.', show: ['t'] },
			{ say: 'Behaviors are checked top to bottom and the first matching path pattern wins. A request for images/logo.png matches the second row.', set: { t: { hl: [1] } } },
			{ say: 'The default behavior (*) is always processed last, so it catches everything the rows above it did not match.', set: { t: { hl: [2] } } },
			{ say: 'Each behavior sends matching requests to one origin: here /api/* goes to the application and images go to an S3 bucket.', set: { t: { hl: [0] } } },
			{ say: 'Order is a security setting too. If a looser behavior matches first, a rule meant to protect content, such as signed URLs, never runs.', show: ['w'], focus: ['w'] },
			{ say: 'The Invalidations tab removes files from edge caches before they expire. Choose Create invalidation and enter one path per line.', hide: ['t', 'w'], show: ['inv'], set: { ft1: { tone: 'neutral' }, ft2: { tone: 'accent' } } },
			{ say: 'You cannot cancel an invalidation after you start it. Versioned file names, like app.3f9c.js, avoid the need and cost nothing extra.', show: ['w2'], focus: ['w2'] }
		]
	},

	// ───────────── iam-basics ─────────────
	{
		id: 'aw-console-iam-policy',
		topic: 'aws',
		group: 'iam-basics',
		title: 'Reading a policy in the IAM editor',
		blurb: 'What do Effect, Action and Resource mean in a policy and a trust policy?',
		stage: stage(240),
		nodes: [
			...consoleChrome('i', { path: 'IAM > Policies > Create policy', tabs: ['JSON'], active: 0, h: 240 }),
			{
				id: 'p', kind: 'doc', x: 24, y: 70, w: 312, title: 'Policy editor',
				lines: ['{', '  "Version": "2012-10-17",', '  "Statement": [{', '    "Effect": "Allow",', '    "Action": "s3:GetObject",', '    "Resource": "arn:aws:s3:::shop-assets/*"', '  }]', '}']
			},
			{
				id: 'tr', kind: 'doc', x: 24, y: 70, w: 312, title: 'Trust relationships > Edit trust policy',
				lines: ['{', '  "Effect": "Allow",', ' "Principal": {"Service": "ec2.amazonaws.com"},', '  "Action": "sts:AssumeRole"', '}']
			},
			ring('rg', 26, 108, 308, 18),
			ring('rt', 26, 124, 308, 18),
			note(240)
		],
		steps: [
			{ say: 'In the IAM console choose Policies, Create policy and the JSON tab. A permissions policy is a JSON document; this one lets a caller read objects from one bucket.', show: ['p'] },
			{ say: 'Version is the policy language version. Statement holds one or more rules, each with an Effect, an Action and a Resource.', show: ['rg'] },
			{ say: 'Effect is Allow or Deny. Everything is denied by default, so a statement is how you grant access, and an explicit Deny always wins.', move: { rg: { x: 26, y: 140 } } },
			{ say: 'Action names what may be done. s3:GetObject reads one object; listing the bucket or uploading would be separate actions.', move: { rg: { x: 26, y: 156 } } },
			{ say: 'Resource names what it may be done to: here only objects under shop-assets. The bucket ARN alone would not match the objects inside.', move: { rg: { x: 26, y: 172 } } },
			{ say: 'A role has a second document, the trust policy: choose Roles, the role, the Trust relationships tab and Edit trust policy. It says who may assume the role.', hide: ['p', 'rg'], show: ['tr', 'rt'], move: { rt: { x: 26, y: 124 } } },
			{ say: 'The permissions policy says what the role may do. The trust policy says who may become the role. Both must be right before a call works.', move: { rt: { x: 26, y: 140 } }, pulse: ['rt'] }
		]
	},

	// ───────────── iam-evaluation-and-sts ─────────────
	{
		id: 'aw-console-iam-last-accessed',
		topic: 'aws',
		group: 'iam-evaluation-and-sts',
		title: 'Last accessed information for a role',
		blurb: 'How do you find permissions a role has but never uses?',
		stage: stage(250),
		nodes: [
			...consoleChrome('a', { path: 'IAM > Roles > shop-api-role', h: 250 }),
			{
				id: 't', kind: 'table', x: 24, y: 54, colW: 156, title: 'Last accessed information', cols: ['Allowed service', 'Last accessed'],
				rows: [['Amazon S3', 'Today'], ['Amazon SQS', '5 days ago'], ['Amazon SES', 'Not accessed'], ['Amazon DynamoDB', 'Not accessed']]
			},
			{ id: 'ex', kind: 'box', x: 24, y: 190, w: 312, h: 44, label: 'Not counted: resource policies, boundaries, SCPs, session policies', tone: 'warn' },
			note(250)
		],
		steps: [
			{ say: 'IAM can show last accessed information for a role: which services its policies allow, and when each was last used. It helps you find permissions nobody uses.', show: ['t'] },
			{ say: 'Rows with a recent date are in use. Keep those permissions.', set: { t: { hl: [0, 1] } } },
			{ say: 'Services the policies allow but nothing has used in the tracking period, which is at least 400 days, are candidates to remove. That is least privilege in practice.', set: { t: { hl: [2, 3] } } },
			{ say: 'The data counts every attempt to call a service, including denied ones, so a surprising row is not proof of a break-in. CloudTrail is the authoritative record.', set: { t: { hl: [] } }, pulse: ['t'] },
			{ say: 'It only reflects the identity policies of the role. The other policy types that also affect access are not included in the report.', show: ['ex'], focus: ['ex'] },
			{ say: 'Recent activity can take up to about four hours to appear, so check back after you change something.', hide: ['ex'], set: { t: { hl: [0] } } }
		]
	},

	// ───────────── route53-acm ─────────────
	{
		id: 'aw-console-route53-acm',
		topic: 'aws',
		group: 'route53-acm',
		title: 'A hosted zone and a pending certificate',
		blurb: 'Which records does a domain need, and how does a certificate get validated?',
		stage: stage(286),
		nodes: [
			...consoleChrome('r', { path: 'Hosted zones > example.com', h: 286 }),
			{ id: 'btn', kind: 'box', x: 236, y: 14, w: 100, h: 24, label: 'Create record', shape: 'pill' },
			{
				id: 'z', kind: 'table', x: 24, y: 54, colW: 104, title: 'Records', cols: ['Record name', 'Type', 'Value'],
				rows: [['shop.example.com', 'A', 'Alias'], ['_a79865.shop', 'CNAME', 'acm-validations'], ['example.com', 'NS', '4 name servers']]
			},
			ring('rr', 24, 94, 312, 22),
			{ id: 'cs', kind: 'box', x: 24, y: 172, w: 312, h: 44, label: 'Certificate status: Pending validation', sub: 'shop.example.com', tone: 'warn' },
			{ id: 'b2', kind: 'box', x: 24, y: 228, w: 312, h: 44, label: 'Button on the certificate page: Create records in Route 53', tone: 'accent' },
			note(286)
		],
		steps: [
			{ say: 'A hosted zone in Route 53 is the list of DNS records for one domain. Choose Hosted zones, then the zone, and its records appear in a table.', show: ['z'] },
			{ say: 'The A record for shop.example.com is an alias: instead of an IP address it points at an AWS resource such as CloudFront.', show: ['rr'] },
			{ say: 'To add a record choose Create record, then set the record name, the type and the value or Alias. The routing policy decides how Route 53 picks among records.', show: ['btn'], focus: ['btn'] },
			{ say: 'For HTTPS, AWS Certificate Manager proves you own the domain with a CNAME record. Until ACM sees it, the certificate shows Pending validation.', show: ['cs'], move: { rr: { x: 24, y: 116 } } },
			{ say: 'If the zone is in Route 53, the certificate page has a Create records in Route 53 button, and ACM adds the CNAME for you.', show: ['b2'], focus: ['b2'] },
			{ say: 'Once ACM finds the CNAME the status becomes Issued. The console can keep saying Pending validation for up to about 30 minutes.', set: { cs: { label: 'Certificate status: Issued', tone: 'accent' } }, pulse: ['cs'] },
			{ say: 'Leave the CNAME in place. ACM uses it to renew the certificate automatically, and deleting it stops automatic renewal.', pulse: ['rr'], focus: ['rr'] }
		]
	},

	// ───────────── rds-and-aurora ─────────────
	{
		id: 'aw-console-rds',
		topic: 'aws',
		group: 'rds-and-aurora',
		title: 'The RDS Databases list and Monitoring',
		blurb: 'Which instance takes writes, and where do you watch the database?',
		stage: stage(212),
		nodes: [
			...consoleChrome('d', { path: 'RDS > Databases', h: 212 }),
			{
				id: 'l', kind: 'table', x: 24, y: 54, colW: 104, title: 'Databases', cols: ['DB identifier', 'Role', 'Engine'],
				rows: [['shop-cluster', 'Regional cluster', 'Aurora'], ['shop-1', 'Writer instance', 'Aurora'], ['shop-2', 'Reader instance', 'Aurora']]
			},
			{
				id: 'm', kind: 'table', x: 24, y: 54, colW: 156, title: 'Monitoring shows', cols: ['Kind', 'What it is'],
				rows: [['CloudWatch', 'RDS metrics with graphs'], ['Enhanced monitoring', 'OS metrics'], ['OS process list', 'Per-process details'], ['Database Insights', 'Database load dashboard']]
			},
			note(212)
		],
		steps: [
			{ say: 'The RDS console lists your databases. An Aurora cluster appears with the instances inside it, each with a role.', show: ['l'] },
			{ say: 'One instance is the writer, the primary DB instance. It takes every write, and can serve reads too.', set: { l: { hl: [1] } } },
			{ say: 'Reader instances, called Aurora Replicas, share the same storage volume and serve reads only. A cluster can have up to 15, ideally in separate Availability Zones.', set: { l: { hl: [2] } } },
			{ say: 'If the writer becomes unavailable, Aurora fails over to a reader. You can set the failover priority for each reader.', set: { l: { hl: [1, 2] } }, pulse: ['l'] },
			{ say: 'The Monitoring view shows four kinds of data: CloudWatch metrics, Enhanced monitoring, an OS process list and Database Insights.', hide: ['l'], show: ['m'] },
			{ say: 'Start with the CloudWatch metrics, such as CPUUtilization, DatabaseConnections and FreeableMemory, and alarm on them. Use Database Insights when load is the question.', set: { m: { hl: [0] } } }
		]
	},

	// ───────────── lambda-and-api-gateway ─────────────
	{
		id: 'aw-console-lambda',
		topic: 'aws',
		group: 'lambda-and-api-gateway',
		title: 'Testing and tuning a Lambda function',
		blurb: 'How do you run a function once, and where are memory and timeout?',
		stage: stage(250),
		nodes: [
			...consoleChrome('l', { path: 'Lambda > Functions > checkout-handler', tabs: ['Code', 'Test', 'Configuration'], active: 0, h: 250 }),
			{ id: 'ev', kind: 'doc', x: 24, y: 70, w: 312, title: 'Test event (JSON)', lines: ['{', '  "orderId": "A1001",', '  "items": 2', '}'] },
			{ id: 'res', kind: 'doc', x: 24, y: 172, w: 312, title: 'Execution result > Details', lines: ['Status: Succeeded', 'Duration: 118 ms', 'Max memory used: 74 MB'], tone: 'accent' },
			{ id: 'cfg', kind: 'table', x: 24, y: 70, colW: 156, title: 'General configuration > Edit', cols: ['Setting', 'Value'], rows: [['Memory', '512 MB'], ['Timeout', '0 min 10 sec']] },
			ring('rr', 24, 110, 312, 22),
			note(250)
		],
		steps: [
			{ say: 'A function page has tabs such as Code, Test and Configuration. The code only runs when something invokes it, for example API Gateway.', show: ['ev'] },
			{ say: 'On the Test tab you create a test event, a JSON input like the one API Gateway would send. Choose Test and Lambda invokes the function once.', set: { lt0: { tone: 'neutral' }, lt1: { tone: 'accent' } }, focus: ['ev'] },
			{ say: 'Under Execution result, expand Details to see the outcome, how long it took and how much memory it used. It is your fastest feedback loop.', show: ['res'], focus: ['res'] },
			{ say: 'Memory and Timeout live under the Configuration tab, General configuration, Edit.', hide: ['ev', 'res'], show: ['cfg'], set: { lt1: { tone: 'neutral' }, lt2: { tone: 'accent' } } },
			{ say: 'Memory runs from 128 MB to 10,240 MB. CPU is given in proportion to memory, so more memory can make CPU-bound code finish sooner.', show: ['rr'] },
			{ say: 'Timeout is how long one invocation may run before Lambda stops it. Set it a little above normal duration, and match what the caller can wait for.', move: { rr: { x: 24, y: 132 } } },
			{ say: 'Change memory, run a test and compare the duration. Tuning is measure, change, measure again, never guessing.', pulse: ['cfg'] }
		]
	},

	// ───────────── sqs-and-sns ─────────────
	{
		id: 'aw-console-sqs',
		topic: 'aws',
		group: 'sqs-and-sns',
		title: 'Reading an SQS queue\'s details',
		blurb: 'What do available, in flight and the dead-letter queue tell you?',
		stage: stage(262),
		nodes: [
			...consoleChrome('q', { path: 'SQS > Queues > orders-queue', h: 262 }),
			{
				id: 't', kind: 'table', x: 24, y: 54, colW: 156, cols: ['Detail', 'Value'],
				rows: [['Messages available', '12'], ['Messages in flight', '3'], ['Visibility timeout', '30 seconds'], ['Dead-letter queue', 'orders-dlq'], ['Maximum receives', '5']]
			},
			{ id: 'w', kind: 'box', x: 24, y: 198, w: 312, h: 52, label: 'Set the visibility timeout above your longest normal processing time, and alarm when the dead-letter queue is not empty.', tone: 'warn' },
			note(262)
		],
		steps: [
			{ say: 'A queue\'s page shows how its messages are doing. Each line answers a different question about your consumers.', show: ['t'] },
			{ say: 'Messages available are waiting to be received. A number that keeps growing means consumers are not keeping up.', set: { t: { hl: [0] } } },
			{ say: 'Messages in flight were received by a consumer but not deleted yet. They are hidden from other consumers until the visibility timeout ends.', set: { t: { hl: [1] } } },
			{ say: 'The visibility timeout defaults to 30 seconds. If the consumer does not delete the message in time, it reappears and is delivered again.', set: { t: { hl: [2] } } },
			{ say: 'After the maximum receives, the redrive policy\'s maxReceiveCount, a message that keeps failing moves to the dead-letter queue instead of looping forever.', set: { t: { hl: [3, 4] } } },
			{ say: 'Tune the two together: a timeout longer than normal processing avoids duplicates, and a dead-letter alarm tells you when messages are failing.', set: { t: { hl: [] } }, show: ['w'], focus: ['w'] }
		]
	},

	// ───────────── cloudwatch-and-xray ─────────────
	{
		id: 'aw-console-cloudwatch-alarm',
		topic: 'aws',
		group: 'cloudwatch-and-xray',
		title: 'An alarm\'s states and the logs behind it',
		blurb: 'What do OK, ALARM and INSUFFICIENT_DATA mean, and what next?',
		stage: stage(250),
		nodes: [
			...consoleChrome('w', { path: 'CloudWatch > Alarms > checkout-5xx', h: 250 }),
			{ id: 'st', kind: 'box', x: 24, y: 54, w: 312, h: 36, label: 'State: OK', shape: 'pill', tone: 'accent' },
			{
				id: 'cfg', kind: 'table', x: 24, y: 106, colW: 156, title: 'Alarm settings', cols: ['Setting', 'Value'],
				rows: [['Period', '60 seconds'], ['Evaluation periods', '5'], ['Datapoints to alarm', '3'], ['Threshold', '> 10 errors']]
			},
			{
				id: 'q', kind: 'doc', x: 24, y: 106, w: 312, title: 'Logs Insights query',
				lines: ['fields @timestamp, @message', '| filter @message like /ERROR/', '| sort @timestamp desc', '| limit 20']
			},
			note(250)
		],
		steps: [
			{ say: 'An alarm watches one metric and is always in one of three states. OK means the metric is within the threshold.', show: ['st'] },
			{ say: 'ALARM means the metric is outside the threshold, and the alarm can notify people or trigger an action.', set: { st: { label: 'State: ALARM', tone: 'neg' } }, pulse: ['st'] },
			{ say: 'INSUFFICIENT_DATA means the alarm just started, the metric is missing, or there is too little data to decide.', set: { st: { label: 'State: INSUFFICIENT_DATA', tone: 'neutral' } } },
			{ say: 'Three settings decide when the state changes: the Period, the Evaluation periods and the Datapoints to alarm.', show: ['cfg'], set: { st: { label: 'State: ALARM', tone: 'neg' } } },
			{ say: 'Here 3 of the last 5 one-minute data points must breach the threshold, and they need not be consecutive. That is an M out of N alarm.', set: { cfg: { hl: [1, 2] } } },
			{ say: 'When it fires, read the logs. CloudWatch Logs Insights queries a log group with a short query of piped commands.', hide: ['cfg'], show: ['q'] },
			{ say: 'Choose the log group and a time range, run the query, then widen from the first error to the requests around it.', set: { q: { hl: [1] } } }
		]
	},

	// ───────────── secrets-and-parameters ─────────────
	{
		id: 'aw-console-secrets',
		topic: 'aws',
		group: 'secrets-and-parameters',
		title: 'Secret versions and rotation',
		blurb: 'What are AWSCURRENT and AWSPREVIOUS, and what does rotation change?',
		stage: stage(240),
		nodes: [
			...consoleChrome('s', { path: 'Secrets Manager > Secrets > prod/db-password', h: 240 }),
			{
				id: 'v', kind: 'table', x: 24, y: 54, colW: 156, title: 'Secret versions', cols: ['Version', 'Staging labels'],
				rows: [['3f2a...', 'AWSCURRENT'], ['9c1d...', 'AWSPREVIOUS'], ['b77e...', '(no label)']]
			},
			{ id: 'rot', kind: 'doc', x: 24, y: 54, w: 312, title: 'Rotation', lines: ['Automatic rotation: On', 'Schedule: every 30 days', 'Rotation function: a Lambda function'] },
			{ id: 'app', kind: 'box', x: 24, y: 166, w: 312, h: 44, label: 'Your app asks for the secret by name and gets AWSCURRENT', tone: 'accent' },
			note(240)
		],
		steps: [
			{ say: 'A secret keeps versions of its encrypted value. When you change the value, or it rotates, Secrets Manager creates a new version.', show: ['v'] },
			{ say: 'AWSCURRENT marks the active version. Asking for a secret without naming a stage returns this one.', set: { v: { hl: [0] } } },
			{ say: 'AWSPREVIOUS is the version that was current before. During a rotation a new version is staged with the label AWSPENDING first.', set: { v: { hl: [1] } } },
			{ say: 'Labeled versions are never removed. A version with no label is deprecated and Secrets Manager cleans it up later.', set: { v: { hl: [2] } } },
			{ say: 'Rotation replaces the secret on a schedule. For database credentials it also changes the password in the database itself.', hide: ['v'], show: ['rot'] },
			{ say: 'Most rotation runs a Lambda function; some managed secrets use managed rotation with no function. Your app keeps reading AWSCURRENT.', show: ['app'], focus: ['app'] }
		]
	},

	// ───────────── shared-responsibility-and-cost ─────────────
	{
		id: 'aw-console-billing',
		topic: 'aws',
		group: 'shared-responsibility-and-cost',
		title: 'Budgets and Cost Explorer',
		blurb: 'How do you get warned before the bill surprises you?',
		stage: stage(232),
		nodes: [
			...consoleChrome('m', { path: 'Billing and Cost Management', h: 232 }),
			{
				id: 'b', kind: 'table', x: 24, y: 54, colW: 104, title: 'Budgets', cols: ['Budget', 'Type', 'Alert at'],
				rows: [['monthly-all', 'Cost budget', '80% actual'], ['search-usage', 'Usage budget', '100% forecast']]
			},
			{ id: 'w', kind: 'box', x: 24, y: 160, w: 312, h: 52, label: 'Budget data updates up to three times a day, and charges can arrive late: an alert is a warning light, not a hard stop.', tone: 'warn' },
			{
				id: 'ce', kind: 'table', x: 24, y: 54, colW: 156, title: 'Cost Explorer', cols: ['Card', 'Shows'],
				rows: [['Month-to-date costs', 'Charges so far this month'], ['Forecasted month end', 'Estimated month-end total']]
			},
			note(232)
		],
		steps: [
			{ say: 'In Billing and Cost Management, Budgets lets you set a spending or usage limit and be told before the bill arrives.', show: ['b'] },
			{ say: 'A cost budget tracks money and a usage budget tracks units of a service. Alerts can go to email, an Amazon SNS topic, or both.', set: { b: { hl: [0, 1] } } },
			{ say: 'An alert can fire on actual spend or on forecasted spend. A forecast alert warns you before the month ends; 80 percent is a common first threshold.', set: { b: { hl: [0] } } },
			{ say: 'Treat an alert as a warning light. Budget data refreshes a few times a day, so charges can pass the threshold before you hear about it.', show: ['w'], focus: ['w'] },
			{ say: 'Cost Explorer shows Month-to-date costs and a Forecasted month end figure, using usage up to the previous day.', hide: ['b', 'w'], show: ['ce'] },
			{ say: 'Cost Explorer shows where the money went and Budgets warns you when it goes too fast. AWS runs the hardware; the bill follows what you choose to run.', set: { ce: { hl: [0, 1] } } }
		]
	}
];
