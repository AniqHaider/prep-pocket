import type { DbTopic } from '../types';
import { builder } from '../../quiz/types';

// Behavioral and SDE-2 expectations. Example stories are generic (a multi-tenant storefront platform, a checkout flow, an SSO rollout,
// a document/AI pipeline, a migration, a component library, production debugging). `~~~` in notes stands for a code fence.
const md = (...lines: string[]) => lines.join('\n').replace(/~~~/g, '```');

export const topics: DbTopic[] = [
	{
		id: 'iv-behavioral',
		title: 'Behavioral questions and STAR',
		level: 'basic',
		summary: 'Tell a short, honest story with a clear structure for conflict, failure, deadlines, ambiguity, feedback and mentoring.',
		scenes: [],
		notes: md(
			'Behavioral rounds test judgement through past behavior. Use **STAR**: **S**ituation (one or two sentences of context), **T**ask (what you were responsible for), **A**ction (what *you* did, with reasons), **R**esult (a number or a concrete outcome, plus what you learned). Spend about 60% of the time on Action.',
			'',
			'**Q. Walk me through how you answer a behavioral question.** `SDE 1`',
			'Pick a real story, say "I" not "we" for your own part, name the decision you made and why, and end with the result. Keep it under two minutes; let the interviewer ask for depth.',
			'',
			'**Q. Tell me about a disagreement with a teammate.** `SDE 1`',
			'Skeleton: two of us wanted different ways to store tenant settings (a JSON column vs separate tables). I wrote down the three queries we needed most, we compared both options against them, and picked the table design for the reporting query. Result: the report ran in a fraction of the time and we kept a good working relationship. Show that you argued with data, not ego.',
			'',
			'**Q. Tell me about a time you failed.** `SDE 1`',
			'Pick a real mistake with limited blast radius. Example: I shipped a checkout change without testing a coupon edge case and a few orders got a wrong total. I reverted within the hour, told my lead, fixed the data, and added a test plus a pre-release checklist item. Own it, fix it, prevent it.',
			'',
			'**Q. How do you handle a tight deadline?** `SDE 1`',
			'Clarify what must ship, cut scope instead of quality, say the risk early, and agree on what is deferred. Example: for a launch date moved up, I split work into must-have (payment path) and later (polish), flagged it in the stand-up, and shipped the core on time with the rest a week later.',
			'',
			'**Q. Tell me about receiving hard feedback.** `SDE 1`',
			'Name the feedback, your first reaction honestly, what you changed, and the later proof. Example: a reviewer said my pull requests were too large; I started splitting them by behavior, and review time dropped.',
			'',
			'**Q. Describe a task with unclear requirements.** `SDE 1`',
			'Ask questions, write down assumptions, build the smallest slice, show it early. Example: "make the PDF export faster" had no target; I measured it, agreed on a number with the product owner, then worked towards it.',
			'',
			'**Q. Tell me about a time you owned something beyond your task.** `SDE 2`',
			'Pick something you noticed, not something assigned. Example: sign-in failures during an SSO rollout were handled by support as one-offs; I grouped them, found a clock-skew cause, added a fix and an alert, and wrote a short runbook. Follow-up: how did you know it was worth your time? Answer with the volume or cost of the problem.',
			'',
			'**Q. Tell me about a time you made a decision with incomplete information.** `SDE 2`',
			'State what you knew and did not, how you made the decision reversible (feature flag, small rollout), what signal you watched, and the result. Example: migrating a tenant to a new data store with a dual-write period and a quick rollback. Follow-up: what would have made you stop?',
			'',
			'**Q. Tell me about mentoring someone.** `SDE 2`',
			'Describe the person\'s gap, how you adapted (pairing first, then reviews with questions rather than answers), and their growth. Example: a new teammate struggled with the shared component library; we paired on one component, then they shipped the next alone. Follow-up: what if they did not improve? Set clear expectations, give written feedback, involve the manager.',
			'',
			'**Q. Describe a production incident you handled.** `SDE 2`',
			'Order: stop the bleeding (rollback or flag), communicate, find the cause with evidence, fix, then a blameless write-up with action items. Example: a slow queue in an AI document pipeline backed up uploads; we added a concurrency limit, a dead-letter queue and an alert on queue age.',
			'',
			'**Q. Tell me about influencing without authority.** `SDE 2`',
			'Show how you won agreement: a short written proposal, a small proof of concept, listening to objections. Example: proposing a shared component library to several teams with a pilot in one product, then measuring the saved effort. Follow-up: what if someone still disagreed? Commit to the decision and revisit it with data later.',
			'',
			'**What interviewers look for:** a specific story, your own actions, clear reasoning, honest failures, a measured result, and a lesson you actually applied later. Avoid blaming others, vague "we", and perfect-sounding stories.'
		),
		try: [
			{
				label: 'Exercise: spot weak STAR parts',
				code: String.raw`// Exercise: a story is weak if a part is missing. Finish the check so the output flags missing parts.
// TODO: add the rule that Result must contain a digit (a number of some kind).
const stories = [
  { name: 'A', situation: 'Checkout totals wrong', task: 'Fix it', action: 'Reverted, added a test', result: 'No repeats in 3 months' },
  { name: 'B', situation: 'Slow report', task: 'Speed up', action: '', result: 'Faster' },
];
function review(s) {
  const missing = [];
  for (const k of ['situation', 'task', 'action', 'result']) if (!s[k]) missing.push(k);
  // TODO: if (s.result && !/\d/.test(s.result)) missing.push('result needs a number');
  return missing;
}
for (const s of stories) console.log(s.name, review(s).join(', ') || 'ok');`
			},
			{
				label: 'Exercise: I vs we count',
				code: String.raw`// Exercise: interviewers want to hear what YOU did. Count first-person words in each answer.
// Predict which answer is stronger, then run. TODO: change the weak answer so "I" shows up at least twice.
const answers = {
  weak: 'We found a bug and we fixed it and the team shipped a patch.',
  strong: 'I traced the bug to a rounding step, I proposed integer money values, and I wrote the migration.',
};
const count = (t) => (t.match(/\b(I|my)\b/g) || []).length;
for (const k in answers) console.log(k, 'first-person words:', count(answers[k]));`
			},
			{
				label: 'Exercise: plan a two-minute answer',
				code: String.raw`// Exercise: split 120 seconds across STAR using the 60% rule for Action.
// TODO: fill in the shares so they add to 1 and Action is the largest.
const shares = { situation: 0.1, task: 0.1, action: 0 /* TODO */, result: 0.2 };
const total = Object.values(shares).reduce((a, b) => a + b, 0);
console.log('shares total:', total.toFixed(2));
for (const [k, v] of Object.entries(shares)) console.log(k, Math.round(v * 120) + 's');`
			}
		]
	},
	{
		id: 'iv-sde2-expectations',
		title: 'SDE 1 vs SDE 2: what changes',
		level: 'advanced',
		summary: 'Explain how scope, ownership, design, estimation, reviews, mentoring and on-call grow from SDE 1 to SDE 2.',
		scenes: [],
		notes: md(
			'Levels differ by company, but the pattern is steady: an SDE 1 completes well-defined tasks with some guidance; an SDE 2 owns a feature or component end to end, including design, delivery and running it in production. Interviewers probe whether your stories show that jump.',
			'',
			'**Q. What is the main difference between SDE 1 and SDE 2?** `SDE 1`',
			'Scope and independence. SDE 1: a clear task, learns the codebase, asks for help early. SDE 2: a vague problem, breaks it down, picks an approach, delivers and maintains it.',
			'',
			'**Q. How do you estimate a task?** `SDE 1`',
			'Break it into pieces, estimate each, add time for review, testing and unknowns, and give a range. Tell the team early when the estimate changes.',
			'',
			'**Q. What makes a good code review comment?** `SDE 1`',
			'Specific, kind, and explains why. Separate must-fix from nitpicks. As an author: small pull requests, a clear description, and responding without defensiveness.',
			'',
			'**Q. When do you ask for help?** `SDE 1`',
			'After a bounded attempt (say 30 to 60 minutes) with a clear summary of what you tried. Too early wastes others, too late wastes the sprint.',
			'',
			'**Q. How do you design a feature before coding?** `SDE 2`',
			'Write a short design doc: problem, goals and non-goals, options with trade-offs, chosen approach, data model and API, rollout and rollback, risks, open questions. Share it before building. Follow-up: when is a doc overkill? For small, easily reversed changes a few paragraphs in the ticket is enough.',
			'',
			'**Q. How do you estimate a project with many unknowns?** `SDE 2`',
			'Reduce unknowns first with a time-boxed spike, then estimate in a range, list assumptions, and plan milestones that deliver value early. Follow-up: how do you communicate a slip? As soon as you know, with cause, new range and options such as cutting scope.',
			'',
			'**Q. How do you review a senior-looking pull request you disagree with?** `SDE 2`',
			'Ask a question first, show a concrete case where the approach fails, and discuss trade-offs. Approve if the concern is only preference.',
			'',
			'**Q. How do you balance speed and quality?** `SDE 2`',
			'Decide per change: risky or hard-to-reverse areas (payments, data migrations) get more tests and review; reversible UI changes can ship faster behind a flag. Record shortcuts as tracked debt with an owner.',
			'',
			'**Q. How do you take part in on-call?** `SDE 2`',
			'Respond to alerts, mitigate first, communicate status, then root cause. Afterwards write a blameless post-mortem with action items and improve alerts that were noisy or late. Follow-up: how do you reduce pages? Fix the top recurring cause.',
			'',
			'**Q. How do you handle a trade-off between two good designs?** `SDE 2`',
			'List criteria that matter (latency, cost, team skill, time), score both, pick, and write down why and what would change your mind. Prefer reversible choices.',
			'',
			'**Q. How do you influence without authority?** `SDE 2`',
			'Build trust with delivered work, write proposals, use data, listen, find what the other team needs, and pilot small. Follow-up: when do you escalate? When a decision is blocked past a reasonable time or the risk is high; bring options, not only the problem.',
			'',
			'**Q. How do you mentor and grow others?** `SDE 2`',
			'Pair, give context not only answers, delegate stretch tasks with support, and give timely specific feedback. Success is the other person working without you.',
			'',
			'**What interviewers look for:** end-to-end ownership, written design, honest estimates, trade-off reasoning, quality of reviews, calm incident handling and visible effect on teammates.'
		),
		try: [
			{
				label: 'Exercise: range estimate',
				code: String.raw`// Exercise: turn task estimates (days) into a range. Best = sum, worst = sum * 1.5, plus 20% for review/testing.
// TODO: replace the worst-case multiplier for tasks flagged "unknown" with 2 instead of 1.5.
const tasks = [
  { name: 'API', days: 3, unknown: false },
  { name: 'Data migration', days: 4, unknown: true },
  { name: 'UI', days: 2, unknown: false },
];
let best = 0, worst = 0;
for (const t of tasks) {
  best += t.days;
  worst += t.days * 1.5; // TODO: t.unknown ? 2 : 1.5
}
const pad = 1.2;
console.log('estimate:', (best * pad).toFixed(1), 'to', (worst * pad).toFixed(1), 'days');`
			},
			{
				label: 'Exercise: score two designs',
				code: String.raw`// Exercise: pick between two designs with weighted criteria. Predict the winner, then change a weight to flip it.
const weights = { latency: 3, cost: 2, simplicity: 3, time: 2 };
const options = {
  queueWorkers: { latency: 3, cost: 4, simplicity: 3, time: 3 },
  syncCall: { latency: 5, cost: 3, simplicity: 5, time: 5 },
};
for (const [name, s] of Object.entries(options)) {
  let total = 0;
  for (const k in weights) total += weights[k] * s[k];
  console.log(name, total);
}
// TODO: add a criterion "failureIsolation" (weight 4) and scores, and see who wins.`
			},
			{
				label: 'Exercise: sort review comments',
				code: String.raw`// Exercise: label review comments as must-fix or nit. TODO: add a rule so "security" and "data loss" are must-fix.
const comments = ['rename variable', 'possible data loss on retry', 'missing space', 'security: token logged'];
const label = (c) => (/bug|crash/.test(c) ? 'must-fix' : 'nit'); // TODO extend
for (const c of comments) console.log(label(c).padEnd(9), c);`
			}
		]
	},
	{
		id: 'iv-project-deep-dive',
		title: 'Project deep-dive and resume questions',
		level: 'mid',
		summary: 'Explain a project you built: context, architecture, decisions, numbers, failures, testing and what you would change.',
		scenes: [],
		notes: md(
			'Interviewers pick a line on your resume and keep asking "why" and "what if". Everything written there must be explainable. Prepare each project with: problem and users, your exact role, architecture in one minute, two key decisions with alternatives, one measurable result, one failure, and what you would redo.',
			'',
			'**Q. Describe your most significant project.** `SDE 1`',
			'Problem, who used it, your part, the stack, the outcome. Draw the architecture as boxes and arrows in under a minute, then pause for questions.',
			'',
			'**Q. What was your personal contribution?** `SDE 1`',
			'List concrete pieces you built, owned or fixed. Never claim the team\'s work; say clearly which parts were shared.',
			'',
			'**Q. Why did you choose that technology?** `SDE 1`',
			'Give the requirement, the alternatives, and the deciding factor (team skill, ecosystem, constraints). "It was already used" is honest, but add what you learned about its fit.',
			'',
			'**Q. What was the hardest bug?** `SDE 1`',
			'Symptom, how you narrowed it (logs, reproduction, bisecting), root cause, fix, and a test or guard added afterwards.',
			'',
			'**Q. How did you test it?** `SDE 1`',
			'Unit tests for logic, integration tests for the database and APIs, a few end-to-end flows for critical paths, plus manual checks. Say what you did not test and why.',
			'',
			'**Q. How did you measure success?** `SDE 2`',
			'Use before and after numbers: latency, error rate, conversion, cost, support tickets. If you lack numbers, say how you would measure them. Follow-up: how do you know it was your change? Mention comparison periods or a staged rollout.',
			'',
			'**Q. How would it handle ten times the load?** `SDE 2`',
			'Find the bottleneck first (database, a single worker, a third-party limit), then options: caching, indexes, queues, read replicas, horizontal scaling. Name what breaks first. Follow-up: how would you test it? Load test against a copy with realistic data.',
			'',
			'**Q. What happens when a dependency fails?** `SDE 2`',
			'Timeouts, retries with backoff and jitter, idempotency keys for writes, circuit breaker, a graceful fallback, and alerts. Example: a payment callback arriving twice must not charge twice.',
			'',
			'**Q. How is multi-tenant data kept separate?** `SDE 2`',
			'Every query scoped by tenant id, enforced in one data-access layer rather than scattered checks, tenant-aware caching keys, and tests that try cross-tenant reads. Follow-up: noisy neighbours? Per-tenant rate limits and quotas.',
			'',
			'**Q. How did you roll out a risky change or migration?** `SDE 2`',
			'Feature flag, dual-write or shadow reads, backfill in batches, compare results, move a small share of traffic, keep a rollback path, remove the old path later.',
			'',
			'**Q. What would you redo?** `SDE 2`',
			'Pick a real design regret and its cost, such as skipping an event log or leaving a shared table too wide, and how you would do it now. Shows judgement and growth.',
			'',
			'**Q. How did you handle security and secrets?** `SDE 2`',
			'Secrets in a manager not code, least-privilege access, input validation, hashed tokens, audit logs for sensitive actions, dependency updates.',
			'',
			'**What interviewers look for:** you really built it, clear tradeoff thinking, numbers, awareness of failure modes, and honesty about limits. Rehearse every claim on your resume.'
		),
		try: [
			{
				label: 'Exercise: before and after',
				code: String.raw`// Exercise: express impact as percent change. TODO: finish pct() and print each metric.
const metrics = [
  { name: 'p95 latency ms', before: 1200, after: 300 },
  { name: 'error rate %', before: 2.5, after: 0.5 },
];
function pct(before, after) {
  return 0; // TODO: return the percent reduction, ((before - after) / before) * 100
}
for (const m of metrics) console.log(m.name + ':', m.before, '->', m.after, '(' + pct(m.before, m.after).toFixed(0) + '% less)');`
			},
			{
				label: 'Exercise: idempotent callback',
				code: String.raw`// Exercise: a payment callback can arrive twice. Predict the final balance, then fix it with a seen-set.
const seen = new Set();
let charged = 0;
function onCallback(id, amount) {
  // TODO: if (seen.has(id)) return; seen.add(id);
  charged += amount;
}
onCallback('evt-1', 100);
onCallback('evt-1', 100); // duplicate delivery
onCallback('evt-2', 50);
console.log('charged:', charged, '(should be 150)');`
			},
			{
				label: 'Exercise: retry with backoff',
				code: String.raw`// Exercise: retry a flaky call with exponential delays. TODO: compute delay = 100 * 2 ** attempt (no real waiting here).
let calls = 0;
const flaky = () => { calls++; if (calls < 3) throw new Error('fail'); return 'ok'; };
function withRetry(fn, max) {
  for (let attempt = 0; attempt < max; attempt++) {
    try { return fn(); }
    catch (e) {
      const delay = 0; // TODO
      console.log('attempt', attempt + 1, 'failed, would wait', delay, 'ms');
    }
  }
  return 'gave up';
}
console.log(withRetry(flaky, 5));`
			}
		]
	}
];

const t = (topic: string) => builder('IV', topic);

// ───────────────────────── iv-behavioral ─────────────────────────
const b1 = t('iv-behavioral');

b1.add('basic', 'STAR',
	"In a STAR answer, where should most of your time go?",
	"The Action: what you personally did and why",
	["The Situation, so the interviewer fully understands the background", "The Result, because only the outcome matters", "The Task, because it shows how hard the job was"],
	"Interviewers judge your behavior and reasoning, which live in the Action. Situation and Task should be brief context, and the Result should be short, concrete and measurable. Long background hides what you actually did.");

b1.add('basic', 'ownership',
	"A teammate asks about your role in a team success. Which answer is strongest?",
	"I designed the retry logic and wrote the migration; a teammate built the UI",
	["We all worked very hard and the team delivered", "I led the whole project and everyone followed my plan, since that keeps things simple for everyone involved", "My part was small, the others did most of it"],
	"A strong answer names specific pieces you built and gives credit for the rest. Pure 'we' hides your contribution, claiming everything sounds untrue and invites hard follow-ups, and downplaying yourself gives no evidence.");

b1.add('basic', 'failure',
	"You shipped a bug that gave a few customers wrong totals. What is the best failure story shape?",
	"Rolled back quickly, told my lead, fixed the data, and added a test and checklist step",
	["Explained that the requirements were unclear and the bug was not really my fault", "Quietly fixed it later in the next release so nobody worried", "Said that I never make mistakes in production"],
	"Good failure answers show ownership, fast mitigation, honest communication and prevention. Blaming requirements avoids ownership, hiding it breaks trust, and claiming no mistakes sounds unrealistic.");

b1.add('basic', 'deadline',
	"A launch date is moved up by a week and the full scope will not fit. What is the best first move?",
	"Tell the owner now, agree on must-have scope and defer the rest",
	["Work nights and skip tests so everything still fits", "Say nothing and hope the original plan holds", "Refuse the new date until the schedule is changed back, because it looks decisive and saves effort in the short term"],
	"Early, honest communication and cutting scope protect quality. Skipping tests creates incident risk, silence removes options, and a flat refusal ignores a business need instead of offering choices.");

b1.add('basic', 'feedback',
	"After a review says your pull requests are too large, what is the best response?",
	"Split future work into small pull requests by behavior and check if review time drops",
	["Explain why large pull requests are fine and keep going, as that is the quickest route and avoids extra discussion", "Stop opening pull requests for a while", "Ask the reviewer to review more quickly instead"],
	"Acting on feedback and checking the effect shows growth. Defending the habit ignores the signal, avoiding review harms the team, and asking others to adapt does not fix the cause.");

b1.add('basic', 'ambiguity',
	"The ticket says 'make export faster' with no target. What do you do first?",
	"Measure current time and agree on a target with the requester",
	["Rewrite the export engine from scratch", "Wait until someone writes a precise ticket", "Add caching everywhere and call it done"],
	"Without a target you cannot know when you are finished. Measuring and agreeing a number turns vagueness into a goal. A rewrite is a large guess, waiting stalls the work, and blanket caching may not touch the real bottleneck.");

b1.add('basic', 'conflict',
	"You and a teammate disagree on a data model. Which approach shows the best judgement?",
	"List the key queries and compare both designs against them",
	["Go with whoever has more years of experience", "Ask the manager to decide immediately without preparing, which many people find the most natural thing to do", "Build your own version in secret and merge it"],
	"Evidence based on real needs resolves technical disputes and keeps the relationship intact. Seniority is not an argument, escalating without preparation shifts the work, and going around the teammate damages trust.");

b1.add('advanced', 'ownership',
	"Support keeps handling sign-in failures one by one. Which story best shows SDE 2 ownership?",
	"I grouped the cases, found a common cause, fixed it, added an alert and wrote a runbook",
	["I answered every ticket quickly so users were happy, since that keeps things simple for everyone involved", "I told support to ask engineering for each case", "I suggested hiring more support staff"],
	"Ownership means noticing a repeating problem, fixing the cause and preventing recurrence. Fast replies treat symptoms, deflecting work is not ownership, and staffing does not solve the defect.");

b1.add('advanced', 'incomplete-info',
	"You must migrate a tenant's data with little knowledge of edge cases. Which plan shows best judgement?",
	"Use a flag, dual-write, compare results, move a small share first and keep rollback",
	["Migrate everything over a weekend and fix problems as they come", "Delay until every edge case is documented", "Copy the data once and delete the old store immediately"],
	"When information is missing, make the decision reversible and watch evidence. A big-bang move is risky, waiting for perfect knowledge never ends, and deleting the old store removes your safety net.");

b1.add('advanced', 'mentoring',
	"A new teammate keeps missing the same review comments. What is the best mentoring step?",
	"Pair on one change, explain the reasoning, then let them do the next one alone with questions in review",
	["Rewrite their code yourself to save time", "Send them the style guide and expect them to read it, because it looks decisive and saves effort in the short term", "Stop reviewing their work and let a lead handle it"],
	"Mentoring builds independence: show, explain, then hand over. Rewriting removes the learning, a document alone rarely changes habits, and avoiding review leaves the gap in place.");

b1.add('advanced', 'incident',
	"A production queue is backing up and uploads are failing. What is the right order?",
	"Mitigate (limit load or roll back), communicate, find the cause, fix, then write a blameless review",
	["Find the root cause first while uploads keep failing, as that is the quickest route and avoids extra discussion", "Fix it quietly and write the report only if asked", "Blame the last deployer in the incident channel"],
	"Stopping the harm comes first, and people need status updates. Root cause analysis can follow once the system is stable. Silence loses trust and blame discourages the honest reports you need.");

b1.add('advanced', 'influence',
	"Other teams doubt a shared component library. What is the best way to influence them?",
	"Write a short proposal, pilot it in one product and show the measured effort saved",
	["Mandate it through the architecture channel", "Build it anyway and ask teams to adopt it later", "Drop the idea because they disagreed"],
	"Without authority, evidence and a small pilot earn trust. A mandate you cannot enforce breeds resentment, a library nobody asked for goes unused, and giving up ignores a real benefit.");

b1.add('advanced', 'disagree-commit',
	"The team chooses an option you argued against. What shows maturity?",
	"Commit fully, track the concern and revisit it with data if it appears",
	["Slow-roll the work to show you were right, which many people find the most natural thing to do", "Keep arguing in every meeting", "Quietly implement your own option"],
	"After a decision is made, a mature engineer helps it succeed and uses data to reopen it later. Slow-rolling, endless arguing and secret alternatives all damage the team and the product.");

// ───────────────────────── iv-sde2-expectations ─────────────────────────
const b2 = t('iv-sde2-expectations');

b2.add('basic', 'levels',
	"Which sentence best captures the step from SDE 1 to SDE 2?",
	"From completing defined tasks with guidance to owning a feature end to end",
	["From writing code to only writing documents, since that keeps things simple for everyone involved", "From working alone to never writing code", "From learning the stack to leaving the team"],
	"The usual shift is independence and ownership: break down a vague problem, design, deliver and run the result. SDE 2 still writes code, and design is an addition rather than a replacement.");

b2.add('basic', 'estimation',
	"What makes an estimate more trustworthy?",
	"Break the work into parts, add review and test time, and give a range",
	["Give one confident number and never change it", "Copy the estimate of the last similar task", "Estimate only the coding time"],
	"Parts and ranges expose uncertainty, and review and testing are real work. A single fixed number hides risk, copying ignores differences, and coding-only estimates always run late.");

b2.add('basic', 'code-review',
	"Which code review comment is most useful?",
	"This query runs per item; batching it avoids many round trips. Must-fix before merge",
	["This is bad", "I would have done it differently, because it looks decisive and saves effort in the short term", "Looks wrong, please redo"],
	"A useful comment is specific, explains why and says how important it is. The other comments give no reason or direction and are hard to act on.");

b2.add('basic', 'asking-help',
	"When is the best time to ask for help on a stuck task?",
	"After a bounded attempt, with a clear summary of what you tried",
	["Immediately, before reading any code, as that is the quickest route and avoids extra discussion", "Only after the deadline has passed", "Never, to avoid looking weak"],
	"A time-boxed attempt with notes respects others' time and speeds the answer. Asking at once wastes it, and waiting too long or never asking risks the sprint.");

b2.add('basic', 'pull-requests',
	"Which pull request is easiest to review well?",
	"A small one that does one thing and explains why in the description",
	["A large one that fixes several things at once", "One with no description because the code speaks for itself", "One that mixes formatting changes with logic changes"],
	"Small focused changes get faster and better reviews. Large or mixed changes hide bugs, and a missing description forces reviewers to guess the intent.");

b2.add('advanced', 'design-doc',
	"What belongs in a good design doc?",
	"Goals and non-goals, options with trade-offs, chosen design, rollout and rollback, risks",
	["Only the final class diagram", "A list of every function to be written", "A promise that the design will not change, which many people find the most natural thing to do"],
	"A design doc supports a decision, so it records the problem, alternatives and reasons, and how to ship and undo. A diagram alone or a function list gives no reasoning, and designs rightly change when facts change.");

b2.add('advanced', 'unknowns',
	"A project has big unknowns. How do you estimate it?",
	"Run a time-boxed spike, then estimate a range and list assumptions",
	["Add 50% to your first guess and stop", "Refuse to estimate until everything is known, since that keeps things simple for everyone involved", "Estimate only the parts you understand"],
	"A spike turns unknowns into knowledge cheaply, and a range with assumptions keeps expectations honest. A blind buffer is arbitrary, refusal helps nobody, and ignoring unknown parts hides the largest risk.");

b2.add('advanced', 'speed-quality',
	"Which approach balances speed and quality best?",
	"Apply more tests and review to risky, hard-to-reverse areas and ship reversible ones behind flags",
	["Same heavy process for every change", "Skip tests whenever a deadline is close", "Always ship fast and fix later"],
	"Matching rigor to risk gives speed where it is safe and care where mistakes are costly. A uniform process slows everything, and skipping checks near deadlines raises incident risk.");

b2.add('advanced', 'on-call',
	"After an incident that paged three times for the same cause, what is the best follow-up?",
	"A blameless write-up with an action to fix the recurring cause and improve the alert",
	["Tell the on-call person to respond faster next time, because it looks decisive and saves effort in the short term", "Mute the alert so it stops paging", "Find who deployed and ask them to be more careful"],
	"Recurring pages point to a system problem, so fix the cause and the signal. Asking for speed treats the symptom, muting hides real failures, and blaming a person stops people reporting problems.");

b2.add('advanced', 'trade-offs',
	"Two designs both work. How do you decide?",
	"Compare them on criteria that matter, pick one, record why and what would change your mind",
	["Pick the newest technology", "Pick whichever you are more familiar with without discussion, as that is the quickest route and avoids extra discussion", "Delay until a perfect design appears"],
	"Explicit criteria and a recorded rationale make the decision reviewable and reversible. Novelty and familiarity are biases, and waiting for perfection costs more than a good-enough choice.");

b2.add('advanced', 'influence',
	"Another team's service is slowing yours and you cannot change their code. What first?",
	"Gather measurements, share them with the owning team and propose options together",
	["Escalate to their manager with no data", "Write a workaround and never mention it", "Complain in a public channel"],
	"Data makes the problem concrete and a joint proposal builds cooperation. Escalating without evidence or complaining publicly damages trust, and a silent workaround leaves the cause in place.");

b2.add('advanced', 'mentoring',
	"What is the best measure that your mentoring worked?",
	"The teammate delivers similar work without you and reviews others well",
	["They ask you more questions over time, which many people find the most natural thing to do", "They always follow your exact style", "You finish their tasks faster"],
	"Mentoring succeeds when the other person becomes independent. Growing dependence, copying your style and you doing their work all show the opposite.");

b2.add('advanced', 'scope',
	"You find a risky shortcut in code you own. What is the best handling?",
	"Record it as tracked debt with an owner and a date, and schedule the fix",
	["Leave it; someone will notice eventually", "Fix it silently inside an unrelated large change, since that keeps things simple for everyone involved", "Remove the feature so the risk is gone"],
	"Visible debt with an owner can be prioritized and fixed. Hiding it or burying it in an unrelated change makes it unreviewable, and removing a feature over-reacts without discussing the trade-off.");

// ───────────────────────── iv-project-deep-dive ─────────────────────────
const b3 = t('iv-project-deep-dive');

b3.add('basic', 'role',
	"An interviewer asks what you personally built in a team project. What is best?",
	"List concrete pieces you built or owned and say clearly which parts were shared",
	["Describe the whole project as if you did all of it", "Say the team did it together and leave it there", "Only mention the technologies used"],
	"Specific, honest ownership is credible and survives follow-ups. Claiming everything is quickly exposed, vague team answers give no evidence, and a technology list says nothing about your contribution.");

b3.add('basic', 'technology-choice',
	"Why did you choose a particular database for the project? Best answer shape?",
	"State the requirement, the alternatives considered and the deciding factor",
	["It is the most popular so it must be best", "I did not choose it and never thought about it, because it looks decisive and saves effort in the short term", "It was fastest in a blog post I read"],
	"A decision story links requirements to alternatives and reasons. Popularity and a single blog benchmark are weak reasons, and not having thought about it shows no engagement even if the choice was inherited.");

b3.add('basic', 'debugging',
	"Which hardest-bug story is strongest?",
	"Symptom, how I narrowed it with logs and reproduction, root cause, fix and a guard test",
	["It was a very hard bug and eventually I fixed it, as that is the quickest route and avoids extra discussion", "A teammate found it and I merged the fix", "I restarted the server and it went away"],
	"A debugging story should show a method and prevention. The vague version has no content, handing the work over shows no contribution, and a restart is not a root-cause fix.");

b3.add('basic', 'testing',
	"How do you describe the testing of your project honestly?",
	"Unit tests for logic, integration tests for data and APIs, a few end-to-end flows, and what was not covered",
	["Everything was tested at 100 percent", "We tested manually by clicking a bit", "Testing was done by the QA team only"],
	"Balanced layers plus honest gaps sounds real. A claim of full coverage invites challenge, clicking around alone is weak evidence, and delegating all testing hides your own practice.");

b3.add('basic', 'architecture',
	"You have one minute to explain the architecture. What works best?",
	"Name the main components and how a request flows through them, then pause for questions",
	["List every library in the package file, which many people find the most natural thing to do", "Describe each file in the repository", "Explain only the user interface"],
	"A request flow gives a shared map the interviewer can probe. Lists of libraries or files bury the structure, and a UI-only view skips the data and services where depth is tested.");

b3.add('advanced', 'metrics',
	"How should you present the impact of a performance project?",
	"Before and after numbers such as p95 latency, and how you measured them",
	["It felt much faster to users, since that keeps things simple for everyone involved", "The code is cleaner now", "We used the latest framework"],
	"Impact needs comparable measurements and a method. Feelings and cleaner code are not results, and using a new framework describes a tool, not an outcome.");

b3.add('advanced', 'scale',
	"The interviewer asks how it would handle ten times the load. What first?",
	"Find the first bottleneck by measuring, then pick caching, indexes, queues or scaling for it",
	["Move everything to microservices", "Double the server size and say it is solved", "Say it would never get that big"],
	"Scaling answers start from the real bottleneck and match a tool to it. Microservices add complexity without fixing a specific limit, bigger machines may only move the problem, and dismissing growth avoids the question.");

b3.add('advanced', 'failure-modes',
	"A payment callback can be delivered twice. How do you stay correct?",
	"Make the handler idempotent using the event id so repeats have no extra effect",
	["Hope the provider never sends duplicates", "Add a delay so duplicates arrive together, because it looks decisive and saves effort in the short term", "Charge twice and refund extra later"],
	"At-least-once delivery means duplicates happen, so deduplicating by a unique id makes repeats safe. Hoping is not a design, delays do not remove duplicates, and refunds repair harm that should not happen.");

b3.add('advanced', 'multi-tenant',
	"How do you keep one tenant from reading another's data?",
	"Enforce tenant scoping in a single data-access layer and test cross-tenant reads",
	["Add a tenant check in each controller by hand, as that is the quickest route and avoids extra discussion", "Rely on tenant ids being hard to guess", "Hide other tenants in the user interface only"],
	"Central enforcement avoids the missed check that leaks data, and tests prove it. Per-controller checks get forgotten, unguessable ids are not authorization, and UI hiding does not stop direct requests.");

b3.add('advanced', 'rollout',
	"How do you roll out a risky data migration?",
	"Flag, dual-write, batch backfill, compare results, move traffic gradually, keep rollback",
	["Run the script once in production at night", "Migrate in staging only and trust it", "Stop all writes for several days"],
	"Gradual, verifiable steps with a way back limit the damage of surprises. A one-shot run has no safety net, staging data rarely matches production, and a long outage is a cost users will not accept.");

b3.add('advanced', 'retrospective',
	"What is the best answer to 'what would you redo'?",
	"A real design regret, its cost, and what you would do differently now",
	["Nothing, it was perfect", "I would use a different programming language, which many people find the most natural thing to do", "I would have had more time"],
	"A genuine regret with a lesson shows judgement and growth. Claiming perfection sounds unaware, a language swap is rarely the real issue, and more time is an excuse rather than a lesson.");

b3.add('advanced', 'dependency-failure',
	"A third-party API times out often. Which handling is best?",
	"Set timeouts, retry with backoff and jitter, add a circuit breaker and a fallback",
	["Retry immediately in a tight loop", "Remove the timeout so calls always finish, since that keeps things simple for everyone involved", "Show an error page and never retry"],
	"Bounded waits and spaced retries protect your service; a breaker and fallback stop failures cascading. Tight retries can overload the dependency, no timeout lets requests pile up, and never retrying fails on short glitches.");

export const banks: { out: import('../../quiz/types').Question[] }[] = [b1, b2, b3];
