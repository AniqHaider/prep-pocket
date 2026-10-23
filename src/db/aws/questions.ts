import { builder } from '../../quiz/types';
import type { Question } from '../../quiz/types';

// AWS quiz bank for a generic online store. Durable concepts only: no prices, no fast-changing quotas stated as facts.
// One builder per topic; ids are re-assigned positionally at the bottom.
const t = (topic: string) => builder('AW', topic);

// ───────────────────────── storefront-request-path ─────────────────────────
const sp = t('storefront-request-path');

sp.add('basic', 'dns-role',
	'In a store hosted on AWS, what does Route 53 do for a request to shop.example.com?',
	'It answers the DNS query, turning the domain name into an address',
	['It serves cached copies of images and scripts from locations close to the shopper',
	 'It spreads incoming requests over the application containers',
	 'It stores the orders and customers in a relational database'],
	'Route 53 is AWS\'s DNS service: it resolves names to addresses (often the address of CloudFront). Caching static files is CloudFront, spreading traffic is the load balancer, and storing orders is the database.');

sp.add('basic', 'cdn-role',
	'Why put CloudFront in front of an online store?',
	'It serves cached copies from nearby edge locations, so many requests never reach the origin',
	['It replaces the database, so the app no longer needs to run queries',
	 'It encrypts every object stored in the S3 bucket while it sits on disk, so that no other service can read it',
	 'It runs the checkout code on the shopper\'s own device to save server time'],
	'CloudFront is a content delivery network: edge locations keep copies of cacheable responses close to viewers, which lowers latency and origin load. It does not replace the database, encrypt storage at rest, or run server code on the shopper\'s device.');

sp.add('mid', 'where-cache',
	'A product image is requested 100,000 times a day and changes about once a month. Where should most of those requests be answered?',
	'At the CloudFront edge cache, with S3 as the origin',
	['By the RDS database, using an index on the image column',
	 'By the application containers, reading the file from disk on every request',
	 'By the load balancer, which keeps a copy of every response it forwards'],
	'Rarely changing static files are ideal for an edge cache with S3 behind it. Putting the files in the database or serving them from application containers spends expensive capacity, and an Application Load Balancer does not cache responses.');

sp.add('mid', 'personalised-page',
	'A shopper\'s cart page is personalised. How should CloudFront treat it?',
	'Forward it to the origin, or cache it only under a key that includes the user',
	['Cache it for a year like the logo, so the cart page loads faster',
	 'Serve it from S3 with a long TTL, because every HTML page an app produces is a static object',
	 'Skip the load balancer and send it straight to the database'],
	'A response that differs per user must not be shared through a cache keyed only by URL, or one shopper can receive another shopper\'s page. Either let it reach the origin or make the user part of the cache key. HTML from an app is not a static S3 object, and requests never go straight to the database.');

// ───────────────────────── s3-storage ─────────────────────────
const s3 = t('s3-storage');

s3.add('basic', 'private-default',
	'Right after you create a new S3 bucket, who can read the objects in it?',
	'Only identities you have granted access, because buckets and objects are private by default',
	['Anyone who knows the bucket name, until you switch on Block Public Access',
	 'Any user of any AWS account, because bucket names are unique across AWS',
	 'Every IAM user in your account, automatically, because users in the same account share the bucket\'s owner'],
	'S3 starts private: nothing is readable until a policy, ACL or similar grants access. A globally unique name only avoids clashes, and even IAM users in your own account need permissions before they can read.');

s3.add('basic', 'key-prefix',
	'In S3, what is products/42/front.jpg?',
	'A single object key; the slashes are ordinary characters and products/42/ is a prefix',
	['A file stored inside a real folder called 42, which is itself inside a real folder called products',
	 'A path on a disk that S3 mounts on your servers',
	 'A bucket name with two sub-buckets nested inside it'],
	'S3 has a flat namespace: bucket plus key identifies an object. The console draws folders by splitting keys on slashes, and listing by prefix gives the folder effect. There are no real directories to create or rename.');

s3.add('mid', 'consistency',
	'A process PUTs a new object and immediately lists the bucket. What does S3 guarantee?',
	'The new object appears, because S3 gives strong read-after-write consistency',
	['It may be missing for a short while, because listing is only eventually consistent',
	 'It appears only after you wait about fifteen minutes for the bucket index to settle',
	 'It appears only if you list from the same Availability Zone that took the write'],
	'S3 provides strong read-after-write consistency for object PUTs and DELETEs and for listings in all Regions. Bucket configuration changes, like enabling versioning for the first time, are the part that can take a moment to propagate.');

s3.add('mid', 'block-public-access',
	'How does S3 Block Public Access relate to bucket policies and ACLs?',
	'It overrides them, so public access they would grant is blocked or rejected, without rewriting them',
	['It only shows a console warning and never changes how requests are handled',
	 'It deletes any public policy or ACL at the moment you switch it on, so the old settings cannot come back',
	 'It applies to ACLs only and ignores bucket policies'],
	'Block Public Access settings take precedence over policies and ACLs, and can be set per bucket, per account or for an organisation. They do not edit or delete the existing policies, so removing the setting makes an old public policy effective again.');

s3.add('advanced', 'oac',
	'Why serve a private bucket through CloudFront with origin access control instead of making the bucket public?',
	'Only that distribution can read the objects, so the raw S3 URL stays denied while CloudFront still serves them',
	['It removes the need for any bucket policy, because CloudFront has built-in access to every bucket',
	 'It encrypts the objects with a key that you must rotate yourself',
	 'It makes S3 itself unable to answer requests over HTTPS, so all traffic is forced through the CDN'],
	'Origin access control lets CloudFront sign requests to S3, and the bucket policy then allows only that distribution. The bucket stays private, so guessing the S3 URL gets a denial. A bucket policy is still required, and S3 supports HTTPS on its own.');

// ───────────────────────── s3-presigned-and-cors ─────────────────────────
const ps = t('s3-presigned-and-cors');

ps.add('basic', 'what-presigned',
	'What is a presigned S3 URL?',
	'A URL signed with the signer\'s credentials that allows one action on one object until it expires',
	['A permanent public link that anyone can open without any signature',
	 'An encrypted copy of the object that can be downloaded only once',
	 'A URL that gives the browser access to the whole bucket for as long as the user stays logged in to your site'],
	'A presigned URL embeds a signature, an expiry and the target key and action. It is neither permanent nor public, it is not single-use, and it does not open the whole bucket.');

ps.add('basic', 'whose-permissions',
	'When someone uses a presigned URL, whose permissions does S3 apply?',
	'Those of the identity that created (signed) the URL',
	['Those of the person or browser that is using the URL',
	 'Those of the bucket owner\'s root user',
	 'None: S3 treats the request as anonymous'],
	'The signature proves the signer authorised this request, so S3 evaluates it as the signer. The holder needs no credentials at all, which is also why a leaked URL is dangerous until it expires. It is not anonymous access.');

ps.add('mid', 'upload-flow',
	'What is a good way to let browsers upload large files to S3 from a store?',
	'The API checks the user and returns a presigned PUT URL, then the browser uploads straight to S3',
	['Send the file to your API server, which forwards it to S3 with the SDK, so the browser never talks to S3',
	 'Embed an IAM user\'s access key in the front-end code, limited to the upload prefix',
	 'Make the bucket publicly writable so any browser can PUT objects'],
	'Presigned URLs keep credentials on the server and send the bytes directly to S3, so your servers do not carry the upload. Keys in browser code can be copied by anyone, and a publicly writable bucket invites abuse.');

ps.add('mid', 'cors-failure',
	'A browser PUT to S3 fails with a CORS error even though the presigned URL is valid. What is the likely cause?',
	'The bucket\'s CORS configuration does not allow that origin, method or header',
	['The signature expired, which browsers always report as a CORS error',
	 'S3 does not accept PUT requests from browsers at all',
	 'CORS errors only appear when the bucket is in a different Region from the page'],
	'CORS is enforced by the browser using the bucket\'s CORS configuration, which lists allowed origins, methods and headers. An expired signature gives an S3 error response, browsers can PUT to S3, and Region has no part in it.');

ps.add('advanced', 'role-expiry',
	'A presigned URL is created with a 12 hour expiry using role credentials that last one hour. When does it stop working?',
	'When the role session credentials expire, even though the URL asked for longer',
	['After 12 hours, because the URL carries its own expiry',
	 'After 12 hours, but only if the bucket has versioning enabled and the object was uploaded before the URL',
	 'Never, because S3 stores the signature once the URL is made'],
	'A presigned URL cannot outlive the credentials that signed it, so a URL made from temporary role credentials dies when that session ends. Longer lifetimes need credentials that last longer, and S3 does not store signatures.');

// ───────────────────────── cloudfront-caching ─────────────────────────
const cf = t('cloudfront-caching');

cf.add('basic', 'hit-miss',
	'What is a cache miss at a CloudFront edge location?',
	'The edge has no valid copy, so it fetches the object from the origin',
	['The viewer\'s browser cache is empty, so CloudFront shows a blank page until it is refreshed',
	 'The origin returned an error, so CloudFront shows an old page',
	 'A WAF rule blocked the request before it reached the cache'],
	'On a miss, the edge has nothing fresh for that cache key and goes to the origin, then usually stores the response. That first request is slower; later ones are hits.');

cf.add('basic', 'cache-key',
	'What does the CloudFront cache key decide?',
	'Whether two requests count as the same cached object: the URL plus any headers, cookies and query strings you include',
	['Which edge location a viewer is connected to',
	 'How long the object stays cached at the edge',
	 'Which origin in the distribution is treated as the primary one'],
	'Requests with the same cache key share one cached copy; anything that should produce a different response must be part of the key. Edge selection, TTL and origin choice are separate settings.');

cf.add('advanced', 'ttl-sources',
	'An origin sends "Cache-Control: public, s-maxage=300, max-age=60". How long may CloudFront keep the response?',
	'About 300 seconds, within the distribution\'s minimum and maximum TTL; the browser keeps it 60',
	['60 seconds, because max-age always wins for every cache',
	 '24 hours, the default TTL, because CloudFront ignores Cache-Control headers that come from an S3 origin',
	 'Zero seconds, because two directives cancel each other'],
	's-maxage targets shared caches such as CloudFront and max-age targets browsers. The result is clamped by the minimum and maximum TTL. The 24 hour default applies only when the origin gives no caching header.');

cf.add('mid', 'invalidate-or-version',
	'What is the cleanest way to ship a changed JavaScript file so users pick it up promptly?',
	'Put a content hash in the file name and update the HTML to point at the new name',
	['Invalidate /* after every deploy and keep the same file name',
	 'Set the distribution\'s maximum TTL to zero so nothing is ever cached',
	 'Ask users to hard-refresh their browsers after each release, since edge caches are cleared by a refresh'],
	'A new URL is a new cache key, so there is nothing stale to remove at the edge or in browsers, and hashed files can be cached for a long time. Invalidation clears only CloudFront, and turning caching off defeats the purpose of a CDN.');

cf.add('mid', 'shared-pages',
	'A cached cart page shows shoppers each other\'s names. What is the most likely cause?',
	'The cache key ignores the cookie or header that identifies the user',
	['The edge location is too close to the shoppers',
	 'The TTL is too short, so objects expire before they are served',
	 'CloudFront compresses responses at the edge and sometimes mixes up the bodies of two users'],
	'If the key is just the URL, the first user\'s response is stored and returned to everyone. Include the identifying value in the key, or do not cache personal pages. Distance, a short TTL and compression do not cross users.');

cf.add('advanced', 'stale-while-revalidate',
	'The origin sends "Cache-Control: s-maxage=60, stale-while-revalidate=30". What can CloudFront do at 70 seconds?',
	'Serve the stale copy while it refreshes it from the origin in the background',
	['Block the viewer until the origin answers, every time',
	 'Delete the object and return an error until the origin is called',
	 'Ignore the directive, because CloudFront cannot read stale-while-revalidate and only understands max-age'],
	'stale-while-revalidate allows serving a just-expired copy while revalidating, within the stated window and the maximum TTL. The viewer gets a fast answer and the next one gets the fresh copy. CloudFront does support this directive.');

// ───────────────────────── iam-basics ─────────────────────────
const ib = t('iam-basics');

ib.add('basic', 'role-vs-user',
	'What is a key difference between an IAM role and an IAM user?',
	'A role has no long-lived credentials and is assumed to get temporary ones',
	['A role can never have policies attached, but a user can',
	 'A role is only for people signing in to the console, and a user is only for software',
	 'A role stays valid forever once created, while a user expires'],
	'A user has permanent credentials such as a password or access keys. A role is assumed, and the caller receives short-lived credentials, which makes roles the right choice for applications. Both can have policies.');

ib.add('basic', 'app-credentials',
	'How should an application running in ECS call S3?',
	'Run the task with a task role that has just the S3 permissions it needs',
	['Put an IAM user\'s access key in the repository configuration',
	 'Make the bucket public so that the container does not need any credentials at all',
	 'Pass the account root user\'s key as an environment variable'],
	'A task role gives the container temporary credentials that AWS rotates for it, so no key is stored anywhere. Keys in a repository leak, public buckets expose data to everyone, and the root user should never be used by an app.');

ib.add('basic', 'least-privilege',
	'What does least privilege mean?',
	'Granting only the actions and resources that a task actually needs',
	['Giving new users admin rights, then removing them if misused',
	 'Using one shared role for every service in the account to keep the policies simple',
	 'Denying every action and relying only on resource policies'],
	'Least privilege limits the damage if an identity is misused or leaked. Starting with admin, sharing one broad role, or relying on a single policy type all grant more than needed.');

ib.add('mid', 'arn-pair',
	'A policy allows s3:GetObject on arn:aws:s3:::shop-assets/*, yet listing the bucket fails. Why?',
	'ListBucket applies to the bucket ARN, not to objects, so it needs its own statement',
	['GetObject also needs ListBucket to be granted to a different user',
	 'The wildcard after the slash blocks listing operations',
	 'Listing needs a permissions boundary attached to the bucket before any list call can succeed'],
	'Object actions use object ARNs (bucket/*) while bucket-level actions such as s3:ListBucket use the bucket ARN (without /*). A policy that needs both therefore lists both resources. Wildcards and boundaries are not the cause.');

ib.add('mid', 'root-user',
	'What is the right way to treat the account root user?',
	'Protect it with MFA and avoid using it day to day',
	['Use it for deployments, since it never hits permission errors',
	 'Share its password with the whole team through a vault, for emergencies',
	 'Create access keys for it so the CI pipeline can use them'],
	'The root user has unrestricted access that cannot be limited by IAM policies, so it is kept for the few tasks that require it, with MFA on. Daily work should use roles or users with limited permissions.');

// ───────────────────────── iam-evaluation-and-sts ─────────────────────────
const ie = t('iam-evaluation-and-sts');

ie.add('mid', 'explicit-deny',
	'A user\'s policy allows s3:DeleteObject, but an organisation SCP explicitly denies it. What is the result?',
	'Denied, because an explicit deny overrides any allow',
	['Allowed, because the user\'s identity policy takes priority over organisation policies',
	 'Allowed, after the SCP is reviewed on the next day',
	 'It depends on which policy was written last'],
	'In policy evaluation an explicit Deny anywhere that applies wins over every Allow, and order of writing does not matter. SCPs also act as limits for every identity in the account.');

ie.add('advanced', 'same-account-union',
	'In one account, a user\'s identity policy has no Allow for a bucket, but the bucket policy allows that user. What happens?',
	'The request is allowed, because within one account either kind of policy can supply the allow',
	['It is denied, because both the identity and resource policies must allow',
	 'It is denied, because bucket policies are evaluated only for requests that come from other accounts',
	 'It is allowed only if a permissions boundary is also attached'],
	'For same-account requests identity-based and resource-based policies are a union, so one Allow is enough as long as there is no explicit Deny. Cross-account access is the case that needs both sides.');

ie.add('mid', 'assume-role-result',
	'What does an AssumeRole call return?',
	'Temporary credentials: an access key id, a secret access key and a session token',
	['A new permanent access key for the role',
	 'A signed URL that only opens the management console',
	 'A policy document that lists everything the role may do, which the caller must then sign'],
	'STS returns short-lived credentials, and all three parts are needed to sign calls. The session lasts one hour unless you request longer, up to the role\'s maximum.');

ie.add('advanced', 'boundary',
	'A permissions boundary allows s3:*, and a user has no identity policy. Can the user use S3?',
	'No, because a boundary only limits the maximum permissions and grants none by itself',
	['Yes, because the boundary allows s3:* and that is enough on its own',
	 'Yes, but only for read actions, because a boundary with s3:* defaults to read-only access',
	 'Only after the user assumes a role in another account'],
	'A boundary sets the ceiling for what an identity-based policy can grant; the effective permissions are the overlap of boundary and policy. With no policy there is nothing to overlap with, so the answer is no.');

ie.add('advanced', 'role-chaining',
	'You chain role A into role B and request DurationSeconds of two hours. What happens?',
	'The call fails, because chained role sessions are limited to one hour',
	['It succeeds with two hours if role B\'s maximum session duration allows it',
	 'It succeeds, but the duration is silently reduced to fifteen minutes',
	 'It succeeds only in the us-east-1 Region'],
	'Role chaining, using one role\'s credentials to assume another, caps the session at one hour, and asking for more makes the operation fail instead of being trimmed.');

// ───────────────────────── route53-acm ─────────────────────────
const ra = t('route53-acm');

ra.add('basic', 'apex-cname',
	'Why can you not point example.com (the bare domain) at CloudFront with a CNAME record?',
	'DNS does not allow a CNAME at the zone apex, so you use a Route 53 alias record',
	['Route 53 charges extra for CNAME records at the apex',
	 'CloudFront accepts only A records for any name',
	 'A CNAME would hide the site\'s TLS certificate from browsers, so HTTPS would stop working'],
	'The apex must also hold records such as NS and SOA, which a CNAME cannot coexist with. Route 53\'s alias record works at the apex and points at CloudFront. The other reasons are not real.');

ra.add('basic', 'alias-facts',
	'Which statement is true of a Route 53 alias record that targets an AWS resource?',
	'Queries to it are not charged and it can be used at the zone apex',
	['You must set its TTL to at least 300 seconds',
	 'It appears to DNS clients as a CNAME record',
	 'It can point at any website on the internet, not only at resources that AWS runs'],
	'An alias to an AWS resource is free to query, can sit at the apex, and is answered as A/AAAA records. You do not set its TTL, and alias targets are limited to supported AWS resources and records in the same zone.');

ra.add('basic', 'cloudfront-cert-region',
	'In which Region must you request an ACM certificate to use it with CloudFront?',
	'US East (N. Virginia), us-east-1',
	['The Region closest to most of your shoppers',
	 'The same Region as the origin S3 bucket',
	 'Any Region, because ACM certificates are global'],
	'CloudFront reads viewer certificates from ACM in us-east-1, whatever Regions your origin runs in. Certificates are Regional resources, not global.');

ra.add('mid', 'alb-cert-region',
	'An Application Load Balancer runs in eu-west-1. Where must its ACM certificate be?',
	'In eu-west-1, the load balancer\'s own Region',
	['In us-east-1, as for CloudFront',
	 'In any Region, because ACM replicates certificates',
	 'Nowhere: ACM certificates cannot be used with load balancers'],
	'Regional services such as load balancers and API Gateway Regional endpoints use certificates from their own Region. The us-east-1 rule is specific to CloudFront.');

ra.add('mid', 'dns-validation',
	'Why is DNS validation convenient for an ACM certificate?',
	'While the validation record stays in DNS, ACM can renew the certificate without more manual steps',
	['It makes the certificate valid for ten years',
	 'It encrypts the DNS queries between browsers and Route 53',
	 'It removes the need to attach the certificate to the CloudFront distribution, because validation links them'],
	'ACM renews certificates automatically as long as the validation CNAME is still present. DNS validation neither lengthens the certificate lifetime nor encrypts DNS, and you must still attach the certificate.');

// ───────────────────────── rds-and-aurora ─────────────────────────
const rd = t('rds-and-aurora');

rd.add('basic', 'multi-az-purpose',
	'What is the main purpose of an RDS Multi-AZ deployment?',
	'Availability: automatic failover to a synchronous standby in another zone',
	['Read scaling: spreading SELECT queries over several copies',
	 'Reducing storage cost by compressing the data',
	 'Running the database in two Regions at once so shoppers on both sides get lower latency'],
	'Multi-AZ keeps a standby in a second Availability Zone updated synchronously and promotes it if the primary fails. Spreading reads is a read-replica job, and Multi-AZ stays within one Region.');

rd.add('basic', 'standby-reads',
	'In a Multi-AZ DB instance deployment with one standby, can the standby serve read queries?',
	'No, it exists only for failover',
	['Yes, reads are balanced across the primary and the standby',
	 'Yes, but only reads that use an index',
	 'Only during the nightly backup window'],
	'In the one-standby form the standby is not readable. A Multi-AZ DB cluster deployment, with two readable standbys, is a different option. Use read replicas to scale reads in the instance form.');

rd.add('advanced', 'replica-lag',
	'A user saves a profile change and the next page, read from a replica, shows the old value. What is the cause?',
	'Replication to the replica is asynchronous, so it can lag behind the primary',
	['A Multi-AZ failover has just occurred',
	 'The primary rolled back the write after a deadlock',
	 'Replicas cache every query result for the whole lifetime of each client connection'],
	'Replicas apply changes after the primary commits, so a read straight after a write may not see it yet. Read your own writes from the primary and use replicas for reads that tolerate being slightly old.');

rd.add('advanced', 'aurora',
	'Which statement best describes Aurora compared with standard RDS engines?',
	'It is AWS\'s cloud-built relational engine with MySQL- and PostgreSQL-compatible editions and storage shared across zones',
	['It is a NoSQL key-value store that replaces RDS',
	 'It is another name for RDS Multi-AZ',
	 'It runs only as a single instance with no replicas'],
	'Aurora is part of RDS but uses its own distributed storage layer and supports readers that share that storage. It is relational and compatible with MySQL and PostgreSQL, and it is not a synonym for Multi-AZ.');

// ───────────────────────── elasticache-redis ─────────────────────────
const ec = t('elasticache-redis');

ec.add('basic', 'why-cache',
	'What is the main reason to put Redis in front of a database?',
	'Serve frequent reads from memory, cutting latency and database load',
	['Make the database store data more durably',
	 'Replace the need for any backups',
	 'Let the database accept more concurrent writes than its disks would normally allow'],
	'An in-memory cache answers repeated reads quickly and takes that load off the database. It is a copy that can be lost, so it does not improve durability, replace backups, or raise the write capacity of the database.');

ec.add('mid', 'cache-aside',
	'In the cache-aside pattern, what does the app do on a cache miss?',
	'Reads from the database, stores the result in the cache with a TTL, and returns it',
	['Returns an error to the caller and waits for the cache to warm itself from the database',
	 'Writes to the cache only and skips the database',
	 'Deletes the key and retries the same cache read in a loop'],
	'On a miss the app loads the data from the source of truth, fills the cache with a TTL so it cannot stay stale forever, and returns the value. The cache never fills itself.');

ec.add('mid', 'stale-price',
	'A price changes in the database but shoppers still see the old price from Redis. What is the best fix?',
	'Delete or update the key when the price is written, keeping a TTL as a safety net',
	['Increase the TTL so fewer requests miss',
	 'Remove the TTL so keys never expire',
	 'Restart the database so that it pushes every changed price into the cache when it comes back up'],
	'Invalidate on write so the next read refills the key, and keep a TTL to bound any missed update. A longer TTL or none makes staleness worse, and the database does not push to a cache.');

ec.add('advanced', 'stampede',
	'A very popular key expires and the database load spikes as many requests miss at once. What is this called and how is it reduced?',
	'A cache stampede; add TTL jitter or let one request refill the key while others wait or use the stale value',
	['Cache poisoning; encrypt the keys',
	 'Replica lag; add more read replicas',
	 'Split brain; enable Multi-AZ on the cache'],
	'When many callers miss together they all recompute the same value. Randomising TTLs, locking so one request refills, or serving a slightly stale value avoids the burst. The other terms describe different problems.');

// ───────────────────────── containers-ecr-ecs-eks ─────────────────────────
const cn = t('containers-ecr-ecs-eks');

cn.add('basic', 'ecr',
	'What does Amazon ECR do?',
	'It stores and serves private container images',
	['It runs the containers on managed servers',
	 'It balances requests across running containers',
	 'It builds the application image from your source code automatically'],
	'ECR is a registry: you push images to it and ECS or EKS pull them. Running containers is ECS, EKS or Fargate; balancing traffic is a load balancer; building is done by your pipeline.');

cn.add('mid', 'ecs-eks',
	'How do ECS and EKS differ?',
	'EKS runs managed Kubernetes, while ECS is AWS\'s own orchestrator with its own API',
	['EKS runs serverless functions and ECS runs virtual machines',
	 'ECS runs Kubernetes and EKS does not',
	 'They are the same product, and only the name differs between AWS Regions and partitions'],
	'Both run containers. EKS gives you the Kubernetes API and ecosystem with more to operate, and ECS is simpler and AWS-specific. Fargate can run tasks for either without managing servers.');

cn.add('advanced', 'execution-role',
	'An ECS task cannot pull its image from ECR, even though the app\'s code has the right S3 permissions. Which role is most likely missing a permission?',
	'The task execution role, which ECS uses to pull images and fetch secrets at launch',
	['The task role, because the app\'s code uses it for all calls',
	 'The service-linked role of Route 53',
	 'The IAM user who originally created the cluster, because the cluster pulls images as that user'],
	'ECS performs launch-time actions, such as pulling from ECR and writing logs, with the execution role. The task role is what your code uses once running, and the other options are not involved.');

cn.add('mid', 'rolling-deploy',
	'How does a rolling ECS deployment avoid downtime?',
	'New tasks start and must pass health checks before the old tasks are stopped',
	['All old tasks stop first, then new ones start at once',
	 'The load balancer copies the old image into the new tasks',
	 'The database is paused for the duration of the update so that no writes are lost'],
	'ECS brings up tasks for the new revision, the load balancer sends traffic only to healthy ones, and old tasks drain afterwards. The service stays reachable throughout.');

// ───────────────────────── lambda-and-api-gateway ─────────────────────────
const lm = t('lambda-and-api-gateway');

lm.add('basic', 'timeout',
	'What is the maximum run time of a single Lambda invocation?',
	'15 minutes',
	['5 minutes',
	 '1 hour',
	 'No limit, if the memory setting is raised'],
	'Lambda caps a single invocation at 15 minutes. Raising memory adds CPU but does not extend the timeout, so longer jobs belong in containers, batch jobs or workflows.');

lm.add('mid', 'cold-start',
	'What is a Lambda cold start?',
	'The extra delay when Lambda must create and initialise a new execution environment',
	['The time a function waits in a queue behind other functions',
	 'The delay before an API Gateway route becomes active',
	 'The pause when a function\'s code is moved to a cheaper storage class after a period without any calls'],
	'If no warm environment is free, Lambda starts one, loads your code and runs initialisation, which adds latency to that call. Later calls can reuse the environment. It is not queuing, route activation or storage tiering.');

lm.add('mid', 'global-state',
	'A counter stored in a global variable of a Lambda function sometimes resets to zero. Why?',
	'Execution environments are separate and can be created or discarded at any time',
	['Lambda clears all variables after every single request',
	 'Global variables are not supported in the Node.js runtime',
	 'The counter resets whenever API Gateway deploys a new stage, because stages share one memory'],
	'Memory is per environment, and Lambda decides when environments live or die, so it is not a place for durable or shared state. Use a database, cache or S3.');

lm.add('advanced', 'payload-limit',
	'A Lambda function returns a 20 MB JSON body to a synchronous caller (a normal buffered response) and the call fails. What is the best fix?',
	'Return a link to the data in S3, because synchronous payloads are limited to about 6 MB',
	['Raise the function\'s memory to 10 GB so the larger body fits',
	 'Split the JSON into smaller keys, since the limit is per key',
	 'Increase the timeout, because large bodies just need more time'],
	'Synchronous invocation request and response payloads are limited to 6 MB each. Memory and timeout do not change that limit, so store the data in S3 and return a presigned URL.');

// ───────────────────────── sqs-and-sns ─────────────────────────
const sq = t('sqs-and-sns');

sq.add('basic', 'at-least-once',
	'What delivery guarantee does a standard SQS queue give?',
	'At-least-once: a message can occasionally be delivered more than once',
	['Exactly-once: every message is delivered a single time',
	 'At-most-once: a message may be lost but never repeated',
	 'Strict first-in, first-out delivery with no repeats, which is what every SQS queue gives'],
	'Standard queues favour throughput and durability, so duplicates can happen and ordering is best effort. Handlers should therefore be idempotent. FIFO queues are the option that adds ordering and de-duplication.');

sq.add('mid', 'visibility-timeout',
	'A worker receives an SQS message and crashes before deleting it. What happens next?',
	'After the visibility timeout the message becomes visible again and another worker can receive it',
	['It is deleted as soon as it is received',
	 'It stays hidden forever',
	 'It moves to the dead-letter queue immediately'],
	'Receiving only hides a message for the visibility timeout. Deleting it is the acknowledgement. If that never happens the message returns, and it moves to a DLQ only after exceeding maxReceiveCount.');

sq.add('advanced', 'timeout-too-short',
	'A job takes about 90 seconds and the queue uses the default 30 second visibility timeout. What goes wrong?',
	'The message reappears while the first worker is still busy, so it can be processed twice',
	['SQS cancels the job after 30 seconds and then deletes the message so that it cannot run again',
	 'The message is deleted and the job is lost',
	 'The queue refuses to deliver messages larger than 30 KB'],
	'The timeout should exceed the processing time, or the worker should extend it. Otherwise another consumer receives the same message. SQS does not cancel running work or delete the message by itself.');

sq.add('mid', 'sns-fanout',
	'Why connect an SNS topic to several SQS queues?',
	'One publish reaches every subscribed queue, and each consumer processes at its own pace',
	['It makes sure messages are processed in one global order',
	 'It removes the need to make handlers idempotent',
	 'It lets one queue send replies back to the publisher through the same topic subscription'],
	'Fan-out sends a copy to each subscriber, and each queue buffers independently so a slow consumer does not hold up the rest. It does not give global ordering, and duplicates still need handling.');

sq.add('advanced', 'dlq-retention',
	'Why should a dead-letter queue for a standard queue have a longer retention period than the source queue?',
	'The retention clock runs from the message\'s original enqueue time, so moved messages may have little time left',
	['The DLQ must store a copy of every message for auditing',
	 'DLQs are billed by retention and longer is cheaper',
	 'SQS blocks a redrive when the DLQ has a shorter period than the source queue'],
	'For standard queues a message keeps its original enqueue timestamp when moved, so a message that spent most of its life in the source queue can expire soon after arriving in the DLQ. A longer DLQ period leaves time to inspect it.');

// ───────────────────────── msk-kafka ─────────────────────────
const mk = t('msk-kafka');

mk.add('advanced', 'ordering',
	'Where does Kafka guarantee message order?',
	'Within a single partition',
	['Across the whole topic, whatever the number of partitions',
	 'Only when there is exactly one consumer group',
	 'Only when producers do not set a key'],
	'Each partition is an ordered log, but there is no global order across partitions. That is why related events must share a key and so land in the same partition.');

mk.add('mid', 'message-key',
	'Why do Kafka producers set a message key?',
	'Messages with the same key go to the same partition, so that key\'s events stay in order',
	['The key encrypts the message so only the consumer can read it',
	 'The key tells Kafka how long to keep the message',
	 'The key forces every message onto a new partition so that load stays balanced across brokers'],
	'The key is hashed to choose a partition, which keeps per-key ordering and lets one consumer see all events for a key. It is not encryption, retention or round-robin.');

mk.add('advanced', 'consumers-vs-partitions',
	'A topic has 3 partitions and one consumer group runs 5 consumers. What happens?',
	'Two consumers sit idle, because each partition goes to only one consumer in the group',
	['All five share the work equally, each reading part of every partition',
	 'Kafka creates two more partitions automatically',
	 'The extra consumers read duplicate copies of the messages'],
	'Within a group each partition is assigned to exactly one consumer, so parallelism is capped by the partition count. More partitions are needed for more parallelism, and other groups read independently.');

mk.add('advanced', 'kafka-vs-sqs',
	'When is Kafka a better fit than SQS?',
	'Several independent consumers need to read and replay the same ordered stream',
	['You need a simple work queue where each task is handled once by one worker and then removed',
	 'You want the lowest possible cost for a few messages a day',
	 'You need messages to disappear as soon as one consumer reads them'],
	'Kafka keeps records for a retention period and lets each group read at its own offset, so streams can be replayed and shared. SQS suits simple work queues where a message is consumed and deleted.');

// ───────────────────────── ses-email ─────────────────────────
const se = t('ses-email');

se.add('basic', 'sandbox',
	'What limits a brand-new SES account in the sandbox?',
	'It can send only to verified addresses or domains, or the mailbox simulator, at low limits',
	['It can send only plain text with no links',
	 'It can send to anyone, but only once per recipient',
	 'It can send only from the root user\'s email address'],
	'The sandbox is a per-Region safeguard: verified recipients only, and a small daily quota and rate. To email real customers you request production access.');

se.add('basic', 'verify-from',
	'After SES production access is granted, must the From address still be verified?',
	'Yes, the sending identity must be verified even in production',
	['No, production access removes every verification step',
	 'Only if the recipient uses a free email provider such as a consumer webmail service',
	 'Only for the first message sent each day'],
	'Production access lifts recipient restrictions and raises limits, but SES still needs to know you own the domain or address you send from.');

se.add('mid', 'bounces',
	'Your SES bounce rate climbs. What is the right response?',
	'Capture bounce events and suppress those addresses so you stop sending to them',
	['Send the same messages again until they are accepted',
	 'Ignore it, because bounces never affect reputation',
	 'Switch to a new From address after each bounce so that the sending reputation starts again'],
	'Repeatedly mailing addresses that reject you damages sender reputation and can get sending paused. Feed bounce and complaint events, for example through SNS, into a suppression list.');

se.add('mid', 'dkim',
	'What does DKIM do for outgoing mail?',
	'Adds a signature that receivers check against a public key published in your DNS',
	['Encrypts the message body so only the recipient can read it',
	 'Limits how many emails each recipient can receive per day, to stop one sender flooding them',
	 'Hides your sending IP address from mail servers'],
	'DKIM proves a message was signed by the domain owner and was not altered in transit, which improves deliverability. It does not encrypt the content or hide anything.');

// ───────────────────────── cloudwatch-and-xray ─────────────────────────
const cw = t('cloudwatch-and-xray');

cw.add('basic', 'metric-or-log',
	'Which tool tells you how many requests failed per minute?',
	'A CloudWatch metric, a number tracked over time',
	['A CloudWatch log line, read one at a time',
	 'An X-Ray trace that follows a single request between services',
	 'An IAM policy'],
	'Metrics are numeric time series suited to counts and rates. Logs give the detail of individual events, traces show one request across services, and IAM policies are about permissions.');

cw.add('basic', 'alarm',
	'What does a CloudWatch alarm do?',
	'Compares a metric with a threshold and triggers an action such as a notification',
	['Records every log line permanently',
	 'Rewrites the application code when errors occur',
	 'Blocks traffic from suspicious IP addresses'],
	'An alarm watches a metric and changes state when the threshold is crossed, which can notify through SNS or trigger automation. Storing logs, changing code and blocking traffic are other services.');

cw.add('mid', 'xray',
	'What does X-Ray add that metrics and logs do not?',
	'A trace of one request across services, with timing for each step',
	['Automatic fixes for slow queries',
	 'Long-term, low-cost storage of every application log, searchable by request id',
	 'A permanent record of who changed an IAM policy'],
	'Distributed tracing links the work of several services to one request and times each part, so you can see where the delay is. It does not repair queries or replace logs and audit trails.');

cw.add('mid', 'percentiles',
	'Average latency looks fine at 200 ms, yet some customers complain about slowness. What should you check?',
	'Percentiles such as p95 and p99, because the average hides a slow tail',
	['The minimum latency, which shows the typical user experience',
	 'The total number of log lines written',
	 'The CPU average across all servers, because high averages always explain user slowness'],
	'A few very slow requests barely move the mean but hurt real users. Tail percentiles reveal them. The minimum is the best case, and log volume and average CPU do not show user latency.');

// ───────────────────────── secrets-and-parameters ─────────────────────────
const sc = t('secrets-and-parameters');

sc.add('basic', 'not-in-code',
	'Where should a production database password live?',
	'In Secrets Manager or an encrypted Parameter Store value, read through IAM-controlled access',
	['In the source repository, in a file listed in the README',
	 'Baked into the container image so it always travels with the app',
	 'In a public S3 object with a hard-to-guess name'],
	'Secrets belong in a store designed for them, with access governed by IAM and encryption by KMS. Anything in a repository, an image or a public object can be copied by whoever can see it.');

sc.add('mid', 'manager-vs-parameter',
	'What is a notable feature of Secrets Manager compared with plain Parameter Store values?',
	'Built-in support for automatic secret rotation',
	['It stores values unencrypted for speed',
	 'It can only be read by code that runs inside Lambda functions',
	 'It never needs IAM permissions to read'],
	'Secrets Manager is made for secrets and can rotate them on a schedule. Parameter Store is a lighter option for configuration, with SecureString for encrypted values. Both use IAM and encryption.');

sc.add('advanced', 'rotation-restart',
	'A secret is rotated, but running ECS tasks still use the old value. Why?',
	'ECS injects secrets when a task starts, so running tasks keep the old value until restarted',
	['Secrets Manager refuses to rotate secrets used by ECS',
	 'ECS caches every secret for exactly one year',
	 'Rotation only applies to secrets stored in Parameter Store'],
	'Injection happens at launch, so a container sees the value from its start time. To pick up a new value, start new tasks or have the app fetch the secret itself.');

sc.add('advanced', 'execution-role-secret',
	'ECS injects a Secrets Manager value into a container and the task fails to start with an access error. Which role needs secretsmanager:GetSecretValue?',
	'The task execution role, because ECS fetches the secret while launching the task',
	['The task role, because the app\'s code reads the variable',
	 'The IAM role of the person who deployed the service',
	 'No role, because secrets are public inside the VPC'],
	'ECS retrieves the secret before the app starts, using the execution role. The task role is for calls your code makes at run time.');

// ───────────────────────── waf-and-shield ─────────────────────────
const wf = t('waf-and-shield');

wf.add('basic', 'what-waf',
	'What does AWS WAF inspect?',
	'HTTP requests, through a Web ACL attached to CloudFront, a load balancer or similar',
	['Database queries, through a policy on the RDS instance',
	 'Network packets between your VPC subnets',
	 'IAM calls made by your administrators'],
	'WAF works at the application layer on web requests, with rules evaluated in priority order. Database queries, subnet traffic and IAM calls are covered by other tools.');

wf.add('mid', 'rate-rule',
	'What does a WAF rate-based rule measure?',
	'Requests per aggregation key, such as an IP address, over a 1, 2, 5 or 10 minute window',
	['The number of distinct countries visiting per hour',
	 'The size in bytes of each response',
	 'How many rules are in the Web ACL'],
	'A rate-based rule counts matching requests for each key, such as each IP, looking back over the chosen window, and applies its action to requests past the limit.');

wf.add('mid', 'count-first',
	'What is the safest way to roll out a new WAF rule?',
	'Start in Count mode, check the logs for legitimate traffic, then switch to Block',
	['Block immediately, then watch for complaints',
	 'Deploy it only on weekends',
	 'Allow all traffic first, then add rules one year later'],
	'Count mode records what a rule would match without affecting users, so you can tune it first. Blocking straight away risks denying real customers.');

wf.add('advanced', 'shield-vs-waf',
	'How do Shield Standard and WAF differ?',
	'Shield defends against network and transport layer DDoS attacks automatically; WAF filters HTTP requests by your rules',
	['Shield filters SQL injection strings and WAF absorbs network floods',
	 'They are the same service sold under two names',
	 'Shield must be configured per URL and WAF is always on by default'],
	'Shield Standard is on automatically for AWS customers and handles common volumetric and protocol attacks. WAF is configured by you for application-layer rules such as injection patterns and rate limits.');

// ───────────────────────── shared-responsibility-and-cost ─────────────────────────
const sh = t('shared-responsibility-and-cost');

sh.add('basic', 'who-owns',
	'A bucket holding customer data is exposed because its policy allows public reads. Whose responsibility is that?',
	'The customer\'s, because access configuration is security in the cloud',
	['AWS\'s, because it operates the S3 service',
	 'The browser vendor\'s, because the exposed files were downloaded and cached in a browser',
	 'Nobody\'s, because buckets are public by default'],
	'AWS secures the service and infrastructure, and the customer controls who is granted access. Buckets are private by default, so exposure comes from a configuration change.');

sh.add('basic', 'managed-shift',
	'How does choosing Lambda instead of EC2 change who does the patching of the operating system?',
	'AWS handles the underlying operating system for Lambda, while with EC2 you patch it',
	['You patch both in the same way',
	 'AWS patches EC2 but you patch Lambda',
	 'Neither needs patching'],
	'The more managed the service, the more AWS runs. With EC2 the guest operating system is yours to patch, while Lambda hides it and you only manage your code and dependencies.');

sh.add('mid', 'budget-habit',
	'Which habit best keeps surprises off an AWS bill?',
	'Tag resources by owner and set a budget alarm',
	['Leave resources running in case they are needed',
	 'Use only the root account to create resources',
	 'Disable CloudTrail to save money'],
	'Tags show who spends what, and a budget alarm warns before costs run away. Leaving idle resources, using root, and turning off audit logging increase cost or risk.');

sh.add('mid', 'idle-cost',
	'A test environment sits unused, yet its bill keeps growing. What is the likely reason?',
	'Provisioned resources, such as instances, load balancers and NAT gateways, bill while running even when idle',
	['AWS bills only for traffic, so idle resources cost nothing',
	 'Resources are billed again each time you open the console',
	 'Idle resources are billed at a rate that grows each day'],
	'Many resources bill by the hour or capacity they are provisioned for, not by use. Clean up what is not needed, or schedule it to stop.');

// ───────────────────────── assemble ─────────────────────────
const banks = [sp, s3, ps, cf, ib, ie, ra, rd, ec, cn, lm, sq, mk, se, cw, sc, wf, sh];
export const awsQuestions: Question[] = banks
	.flatMap((b) => b.out)
	.map((q, i) => ({ ...q, id: 'AW' + String(i + 1).padStart(2, '0') }));
