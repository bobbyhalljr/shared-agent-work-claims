# Grok Bot gives you a team. The computer is shared.

Give one Bot research. Give another editing. Let a third prepare the weekly report.

That sounds like an org chart.

Now ask a less glamorous question: which of them can change the file the others are using?

Grok Bot’s documentation gives a surprisingly useful answer. The computer belongs to the user account. Bots on that account share it.

**You can divide the jobs without dividing the underlying access.**

That is the design detail I would understand before building a team of Bots around real work.

This is a documentation-based look at Grok Bot as of October 29, 2026. I also built a small, independent TypeScript example to explore one consequence of shared work. It is not a Grok Bot integration, an account audit, or a benchmark of the product.

<img src="https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/t4sbuz9zdn2nbdj3w6vb.png" alt="Different Bot jobs on one account-shared computer. Original explanatory artwork." width="1600" height="900">

[Watch the narrated companion](https://raw.githubusercontent.com/bobbyhalljr/shared-agent-work-claims/main/video/grok-bot-16x9-1x.mp4) · Bobby-alt narration, normal speed, captions included.

## What Grok Bot actually adds

[Grok Bot](https://docs.x.ai/grok-bot/overview) is an app for persistent AI teammates that can work with tools, websites, files, and a terminal. Bots retain working context, coordinate, and continue cloud work while your laptop is closed. The product combines conversation with an environment where work can actually happen.

The [FAQ](https://docs.x.ai/grok-bot/faq) distinguishes Grok Bot from the Grok chat app. If you are evaluating it, keep the product boundary clear: this article is about Grok Bot’s working environment and collaboration model.

The practical attraction is easy to see.

A task often needs the browser session you already established, a document someone saved yesterday, and the application where the final change belongs. Rebuilding all of that context for every request makes delegation expensive.

A persistent environment can reduce that setup cost. A useful output can become an input to the next piece of work.

That is where this product category gets interesting to me. The environment becomes part of the agent’s continuity.

## Separate screens solve a different problem from separate permissions

The [computer documentation](https://docs.x.ai/grok-bot/computer-and-apps) says Bots on one account share files, browser cookies, signed-in sessions, and command-line credentials. Each Bot has its own screen, which supports parallel computer work. Those screens are work surfaces rather than security boundaries.

The [FAQ](https://docs.x.ai/grok-bot/faq) puts the consequence plainly:

> Do not use separate Bots as a security boundary.

The scope matters: this describes Bots within one account. It does not establish that different users share the same computer or access.

Imagine a research Bot and a publishing Bot. This is a hypothetical workflow, not a report of a Grok Bot failure.

Research gathers sources. Publishing prepares the final post. Both work on the same report.

You have created two responsibilities. You still need to decide who owns the authoritative report, who can replace it, and how a reviewer knows which version they are looking at.

There are two different questions here:

- **Permission:** may this actor change this resource?
- **Coordination:** which authorized actor should change it right now?

An orderly handoff can help with the second question. It cannot create an access restriction that the underlying system does not enforce.

<img src="https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/yvmi5xkp596ixy4d6pev.png" alt="Separate Bot roles converge on account-shared files and sessions. Coordination and authorization are separate controls." width="1920" height="1200">

## A specialist’s name does not constrain a signed-in session

The [Bot management guide](https://docs.x.ai/grok-bot/bots) recommends focused jobs with explicit sources, responsibilities, and approval boundaries. That is sensible. A research role and a publishing role need different instructions and different definitions of done.

I would still treat a role description as a working contract.

If a task should only read a service, use a service identity whose permissions support that restriction wherever the product and service allow it. Calling a Bot “Read-only Research” does not reduce the permissions of a browser session it can use.

There is a useful nuance around secrets, too. [Grok Bot’s Vault documentation](https://docs.x.ai/grok-bot/vault) says saved passwords and card details can be used without exposing their values to the Bot. It also says Vault entries are available across the account’s Bots rather than scoped to one personal Bot.

Keeping a password out of the model’s text is valuable. The ability to operate a signed-in account is another form of authority.

You need to understand both when deciding what belongs in the shared environment.

## Give the work an owner, not just a destination

Here is an example handoff I would use for a report workflow:

```text
Task: weekly-account-report / 2026-10-29
Research output: sources-v3.json
Research status: ready for editorial review
Editor owns: report-v4.md
Reviewer must check: source dates and quoted figures
Stop before: publishing or contacting customers
Completion evidence: final artifact plus source links
```

These names and versions are illustrative. They are not built-in Grok Bot fields.

The important part is that a handoff describes an artifact and its current state. “The research is done” leaves the receiver guessing where to start and what remains uncertain.

I would keep intermediate outputs separate, choose one owner for the final artifact, and ask for a linked result that can be inspected outside the chat summary.

The final owner should also re-read the current source before applying a change. A correct conclusion about yesterday’s report may be wrong for today’s revision.

## Watch what happens when an old worker wakes up

I made a tiny companion example around that last problem.

Two simulated workers want to update the same in-memory report. The coordinator gives the current worker a ticket with an owner, expiry, input revision, random ID, and increasing generation number, often called a fencing number.

The first worker pauses. Its ticket expires. A second worker gets a newer ticket and saves a reviewed result.

Then the first worker returns with its older draft.

The resource owner must refuse that late write.

The critical part of the implementation is:

```ts
const c = this.#current(ticket, owner);
if (c.revision !== ticket.baseRevision) throw Error('source changed');
// Synchronous check and write through the same resource owner.
c.value = value; c.revision++; c.active = undefined;
return this.read(ticket.resource);
```

`#current` checks the ticket against the active claim, including its owner, ID, generation, revision, and expiry. The commit then checks whether an independent edit changed the input revision.

The demo prints:

```text
Research claims report: fence 1
Editor while claim is active: busy
Editor claims after expiry: fence 2
Research late commit: stale or wrong owner
Final report: reviewed-v1
```

The significant result is the final value. The returning worker does not overwrite the reviewed report.

The [public companion repository](https://github.com/bobbyhalljr/shared-agent-work-claims) contains the full example and tests. Run it with Node 22.18 or newer:

```sh
git clone https://github.com/bobbyhalljr/shared-agent-work-claims.git
cd shared-agent-work-claims
npm test
npm run demo
```

The 23 passing tests cover expiry, ownership, altered tickets, late commits, stale releases, input revisions, independent resources, and detached read snapshots. All inputs are synthetic. No Grok account, model API, or external service is called.

This code uses Node’s native TypeScript execution and does not perform static type checking.

There is an equally important limit: the coordinator is an in-memory object in one process. It does not survive a restart, coordinate cloud workers, protect a filesystem, or enforce permissions. A caller who can bypass it can bypass its coordination rules.

For a production design, the authoritative resource owner must enforce the current generation and revision atomically. A lock somewhere else cannot stop a stale worker from writing directly to a service that does not check it.

This is a teaching example for systems you build. It does not describe Grok Bot’s internal implementation or establish that Grok Bot lacks its own coordination.

## A routine multiplies the workflow you give it

Grok Bot separates reusable methods from triggers. Its [skills and routines guide](https://docs.x.ai/grok-bot/skills-routines-and-automations) describes skills as task instructions and routines as scheduled or event-driven execution. It recommends proving a one-time task before automating it. Demonstration-based teaching can produce a draft skill, with availability varying by rollout.

That gives you a practical evaluation path.

Start with one job that has a clear artifact and a clear stop point. Run it manually. Inspect the sources and result. Try a missing input, a changed file, and an expired login. Decide what the Bot should report in each case.

Then save the method and schedule it.

For a multi-Bot workflow, also test the handoff: can the receiver identify the latest artifact and distinguish completed work from a partial attempt?

A daily schedule makes a good workflow useful more often. It also repeats an ambiguous workflow more often.

## Evaluate the result you can inspect

The [approvals documentation](https://docs.x.ai/grok-bot/approvals-security-and-privacy) describes Auto Review checking actions and requesting approval where needed. It also recommends stating consequential-action boundaries in the request.

For an initial evaluation, I would give Grok Bot a bounded job such as:

```text
Research these three public product pages and prepare a comparison.
Link each factual claim to its source and include the retrieval date.
Save the comparison as a file and attach it here.
If a source is unavailable, name the gap.
Stop before posting, sending messages, or changing any account.
```

That gives you something concrete to review: a file, source links, and explicit uncertainty. It also gives the Bot a useful finish line.

I would expand the job after seeing that complete path work, including the inconvenient cases. A smooth happy-path demonstration cannot answer every operational question.

## The team is an interface. Shared state is an engineering problem.

Grok Bot makes an appealing idea tangible: give a persistent teammate a job and let it work in an environment that already has context.

The shared computer helps explain how that continuity and collaboration can work. It also tells you where to look when deciding what to share, who owns a result, and what happens when work overlaps.

These are questions I keep running into while building Roster and teaching [Ship a Safe Agent](https://bhjr.dev/courses/ship-a-safe-agent). You need a definition of done, an execution boundary, and evidence that the result exists where it belongs. [Module 1 and its walkthrough are free](https://bhjr.dev/courses/ship-a-safe-agent/module-1).

**Before you add another AI teammate, decide what they share and who gets the last write.**
